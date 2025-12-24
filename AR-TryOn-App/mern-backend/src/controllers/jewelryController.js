import Jewelry from '../models/Jewelry.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs/promises';
import path from 'path';
import callML from '../services/callMLService.js';

/**
 * Helper to delete local file with a safety check
 */
const deleteLocalFile = async (filePath) => {
    try {
        if (!filePath) return;
        const absolutePath = path.resolve(filePath);
        await fs.access(absolutePath);
        await fs.unlink(absolutePath);
        console.log(`🗑️ Local cleanup: Deleted ${path.basename(filePath)}`);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error(`Error deleting local file ${filePath}:`, err);
        }
    }
};

export const addJewelry = async (req, res) => {
    const { name, category, description, price } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ success: false, message: '2D image file is required.' });
    }

    const localFilePath = req.file.path;

    try {
        // 1. Image URL Setup (Cloudinary with Local Fallback)
        let image2DUrl = null;
        let isCloudinary = false;

        try {
            // Check if cloudinary config actually has keys
            if (process.env.CLOUDINARY_API_KEY && cloudinary && cloudinary.uploader) {
                const uploadResult = await cloudinary.uploader.upload(localFilePath, { 
                    folder: 'jewelry-2d-images' 
                });
                image2DUrl = uploadResult.secure_url;
                isCloudinary = true;
            }
        } catch (uploadErr) {
            console.warn('Cloudinary upload skipped/failed, using local storage.');
        }

        // If Cloudinary failed or is not configured, use local path
        if (!image2DUrl) {
            const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
            image2DUrl = `${base}/uploads/${req.file.filename}`;
        }

        // 2. Create Jewelry Document
        const userId = req.admin?._id || req.user?._id || null;
        const jewelry = await Jewelry.create({ 
            name, 
            category, 
            description,
            price,
            image2D: image2DUrl, 
            createdBy: userId,
            conversionStatus: 'pending' 
        });

        // 3. Trigger ML Service
        console.log(`✨ Triggering ML conversion for: ${jewelry.name}`);
        await callML(localFilePath, userId, jewelry._id);

        // 4. Smart Cleanup
        // ONLY delete the local file if it was successfully uploaded to Cloudinary
        // AND wait 10 seconds to ensure the ML Service has finished reading it
        if (isCloudinary) {
            console.log("⏳ Scheduling local file cleanup in 10 seconds...");
            setTimeout(() => deleteLocalFile(localFilePath), 10000);
        } else {
            console.log("ℹ️ Keeping local file: Frontend needs it for display (Local Fallback mode)");
        }

        return res.status(201).json({ success: true, data: jewelry });

    } catch (error) {
        console.error('CRITICAL: Error adding jewelry:', error);
        // On error, we try to clean up the file
        await deleteLocalFile(localFilePath);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getJewelryPublic = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const items = await Jewelry.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: items.length, data: items });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
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

            const userId = req.admin?._id || req.user?._id;
            await callML(localFilePath, userId, jewelry._id);

            // Smart Cleanup for Update
            if (isCloudinary) {
                setTimeout(() => deleteLocalFile(localFilePath), 10000);
            }
        }

        await jewelry.save();
        return res.status(200).json({ success: true, data: jewelry });

    } catch (err) {
        if (localFilePath) await deleteLocalFile(localFilePath);
        return res.status(500).json({ success: false, message: err.message });
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
        return res.status(500).json({ success: false, message: err.message });
    }
};