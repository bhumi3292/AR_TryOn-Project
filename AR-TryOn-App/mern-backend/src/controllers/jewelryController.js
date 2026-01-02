import Jewelry from '../models/Jewelry.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import callML from '../services/callMLService.js';
import axios from 'axios';
import FormData from 'form-data';

/**
 * Helper to delete local file with a safety check
 */
const deleteLocalFile = async (filePath) => {
    try {
        if (!filePath) return;
        const absolutePath = path.resolve(filePath);
        await fsp.access(absolutePath);
        await fsp.unlink(absolutePath);
        console.log(`🗑️ Local cleanup: Deleted ${path.basename(filePath)}`);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error(`Error deleting local file ${filePath}:`, err);
        }
    }
};

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/convert-2d-to-3d";

// Helper: Fire-and-forget ML trigger
const triggerMLBackground = async (jewelry) => {
    // Run in background, do not await in main request
    (async () => {
        try {
            console.log(`[AUTO ML] Triggering generation for ${jewelry._id}`);

            // 1. Update Status
            await Jewelry.findByIdAndUpdate(jewelry._id, {
                conversionStatus: 'processing',
                tryOnStatus: 'pending'
            });

            // 2. Prepare Data
            const imageUrl = jewelry.image2D;
            if (!imageUrl) {
                console.warn(`[AUTO ML] No image URL for ${jewelry._id}, skipping.`);
                return;
            }

            // Fetch image stream (Loopback or External)
            console.log(`[AUTO ML] Fetching image stream from ${imageUrl}`);
            const imageRes = await axios.get(imageUrl, { responseType: 'stream' });

            const form = new FormData();
            form.append('file', imageRes.data, `input-${jewelry._id}.png`);
            form.append('product_id', String(jewelry._id));
            form.append('category', jewelry.category || 'necklace');

            // Pass metadata for Potential Auto-Upsert (if python service needs to recreate it)
            form.append('name', jewelry.name || '');
            form.append('description', jewelry.description || '');
            form.append('price', String(jewelry.price || 0));
            form.append('image2D', jewelry.image2D || '');
            if (jewelry.createdBy) form.append('createdBy', String(jewelry.createdBy));
            if (jewelry.sellerId) form.append('sellerId', String(jewelry.sellerId));

            // 3. Send to ML Service
            console.log(`[AUTO ML] Sending to Python Service at ${ML_SERVICE_URL}`);
            await axios.post(ML_SERVICE_URL, form, {
                headers: {
                    ...form.getHeaders(),
                    'Max-Content-Length': Infinity,
                    'Max-Body-Length': Infinity
                }
            });
            console.log(`[AUTO ML] Request sent successfully for ${jewelry._id}`);

        } catch (err) {
            console.error(`[AUTO ML ERROR] Failed for ${jewelry._id}:`, err.message);
            await Jewelry.findByIdAndUpdate(jewelry._id, {
                conversionStatus: 'failed',
                tryOnStatus: 'failed'
            }).catch(e => console.error("DB Update failed", e));
        }
    })();
};

export const addJewelry = async (req, res) => {
    try {
        const { name, category, description, price, image } = req.body;
        console.log('addJewelry Payload:', { name, category, price });

        // 1. Validation
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const missing = [];
        if (!name) missing.push('name');
        if (!category) missing.push('category');
        if (price === undefined || price === null || price === '') missing.push('price');

        if (missing.length) {
            return res.status(400).json({ success: false, message: 'Missing required fields', fields: missing });
        }

        const parsedPrice = Number(price);
        if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ success: false, message: 'Price must be a positive number' });
        }

        // 2. File / Image Handling
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        let image2DUrl = image || null;
        let additionalImages = [];

        // Check Multer Files
        if (req.files) {
            // Main Preview Image (priority: preview -> image2D -> first of images)
            let mainFile = null;
            if (req.files['preview'] && req.files['preview'][0]) mainFile = req.files['preview'][0];
            else if (req.files['image2D'] && req.files['image2D'][0]) mainFile = req.files['image2D'][0];
            else if (req.files['images'] && req.files['images'][0]) mainFile = req.files['images'][0];

            if (mainFile) {
                image2DUrl = `${baseUrl}/uploads/${mainFile.filename}`;
            }

            // Gallery Images
            if (req.files['images']) {
                additionalImages = req.files['images'].map(f => `${baseUrl}/uploads/${f.filename}`);
            }
        }

        // Fallback for image2D if still null
        if (!image2DUrl) {
            image2DUrl = `https://placehold.co/600x400?text=${encodeURIComponent(name)}`;
        }

        // 3. Create Document
        const userId = req.user.id;
        const jewelry = await Jewelry.create({
            name,
            category,
            description: description || '',
            price: parsedPrice,
            image2D: image2DUrl,
            images: additionalImages,
            createdBy: userId,
            sellerId: userId,
            conversionStatus: 'pending',
            tryOnStatus: 'pending'
        });

        console.log('✅ Product created successfully:', jewelry._id);

        // 4. Trigger Automatic ML Conversion
        // Only trigger if we have a valid image (not a placeholder preferred, but placeholder won't crash it, just produce garbage 3D)
        if (image2DUrl && !image2DUrl.includes('placehold.co')) {
            triggerMLBackground(jewelry);
        }

        return res.status(201).json({ success: true, data: jewelry });

    } catch (error) {
        console.error('Error adding jewelry:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getJewelryPublic = async (req, res) => {
    try {
        const { category, tryOnStatus } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (tryOnStatus) filter.tryOnStatus = tryOnStatus;
        const items = await Jewelry.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: items.length, data: items });
    } catch (err) {
        console.error('Error in getJewelryPublic:', err && err.stack ? err.stack : err);
        return res.status(500).json({ success: false, message: 'Failed to load jewelry list' });
    }
};

export const getJewelryById = async (req, res) => {
    try {
        const jewelry = await Jewelry.findById(req.params.id).populate('createdBy', 'fullName email');
        if (!jewelry) {
            return res.status(404).json({ success: false, message: 'Jewelry not found' });
        }
        return res.status(200).json({ success: true, data: jewelry });
    } catch (err) {
        console.error('Error in getJewelryById:', err && err.stack ? err.stack : err);
        return res.status(500).json({ success: false, message: 'Invalid ID format or server error' });
    }
};

export const updateJewelry = async (req, res) => {
    const { id } = req.params;
    let localFilePath = req.file ? req.file.path : null;

    try {
        let jewelry = await Jewelry.findById(id);
        if (!jewelry) {
            if (localFilePath) await deleteLocalFile(localFilePath);
            return res.status(404).json({ success: false, message: 'Jewelry not found' });
        }

        const fieldsToUpdate = ['name', 'category', 'description', 'price'];
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) jewelry[field] = req.body[field];
        });

        if (req.file) {
            let image2DUrl = null;
            let isCloudinary = false;

            try {
                if (process.env.CLOUDINARY_API_KEY && cloudinary?.uploader) {
                    const uploadResult = await cloudinary.uploader.upload(localFilePath, { folder: 'jewelry-2d-images' });
                    image2DUrl = uploadResult.secure_url;
                    isCloudinary = true;
                }
            } catch (e) { console.error("Update Cloudinary failed"); }

            if (!image2DUrl) {
                const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
                image2DUrl = `${base}/uploads/${req.file.filename}`;
            }

            jewelry.image2D = image2DUrl;
            jewelry.conversionStatus = 'pending';

            const userId = req.user?.id || null;
            await callML(localFilePath, userId, jewelry._id);

            // Smart Cleanup for Update
            if (isCloudinary) {
                setTimeout(() => deleteLocalFile(localFilePath), 10000);
            }
        }

        await jewelry.save();
        return res.status(200).json({ success: true, data: jewelry });

    } catch (err) {
        console.error('Error in updateJewelry:', err && err.stack ? err.stack : err);
        if (localFilePath) await deleteLocalFile(localFilePath);
        return res.status(500).json({ success: false, message: 'Failed to update jewelry' });
    }
};

export const getSellerJewelry = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await Jewelry.find({ createdBy: userId }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: items.length, data: items });
    } catch (err) {
        console.error('Error in getSellerJewelry:', err && err.stack ? err.stack : err);
        return res.status(500).json({ success: false, message: 'Failed to load seller items' });
    }
};

export const deleteJewelry = async (req, res) => {
    try {
        const jewelry = await Jewelry.findById(req.params.id);
        if (!jewelry) {
            return res.status(404).json({ success: false, message: 'Jewelry not found' });
        }
        await Jewelry.deleteOne({ _id: req.params.id });
        return res.status(200).json({ success: true, message: 'Jewelry and metadata deleted successfully' });
    } catch (err) {
        console.error('Error in deleteJewelry:', err && err.stack ? err.stack : err);
        return res.status(500).json({ success: false, message: 'Failed to delete jewelry' });
    }
};

// Return a GLB URL for try-on without exposing price/inventory
export const getTryOnModel = async (req, res) => {
    try {
        const id = req.params.id;
        // Validate ObjectId to prevent generic CastErrors if route matching fails
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ success: false, message: 'Invalid Product ID' });
        }

        const jewelry = await Jewelry.findById(id).select('model3D glbModelUrl tryOnStatus conversionStatus');
        if (!jewelry) return res.status(404).json({ success: false, message: 'Not found' });

        // 1. Prefer new explicit field
        if (jewelry.glbModelUrl) {
            return res.json({ success: true, glb: jewelry.glbModelUrl, status: jewelry.tryOnStatus });
        }

        // 2. Fallback to legacy field
        if (jewelry.model3D) {
            return res.json({ success: true, glb: jewelry.model3D, status: jewelry.conversionStatus });
        }

        // 3. Last Resort: Check physical file existence (legacy support)
        const mlPath = path.join(process.cwd(), 'ml-output');
        const candidate = path.join(mlPath, `${id}.glb`);

        try {
            // Check file existence using sync API on core fs
            if (fs.existsSync(candidate)) {
                // Expose via server static mount /ml-output
                const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
                const url = `${base}/ml-output/${encodeURIComponent(id)}.glb`;

                // Self-healing: Update DB if found but not linked
                jewelry.glbModelUrl = url;
                jewelry.tryOnStatus = 'ready';
                await jewelry.save().catch(e => console.error("Auto-heal failed", e));

                return res.json({ success: true, glb: url, status: 'ready' });
            }
        } catch (err) {
            // File check failed, just return 404
        }

        return res.status(404).json({ success: false, message: '3D model not available yet', status: jewelry.tryOnStatus || 'pending' });

    } catch (err) {
        console.error('TryOn lookup error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Export helper for reuse by dev/test routes
export { triggerMLBackground };