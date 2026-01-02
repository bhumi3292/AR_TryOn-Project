// src/controllers/mlController.js

import Jewelry from '../models/Jewelry.js';

export const mlConversionCallback = async (req, res) => {
    try {
        // 1. Security Check
        const apiKey = req.headers['x-ml-api-key'];
        if (apiKey !== process.env.ML_CALLBACK_SECRET && apiKey !== 'ml-callback-secret') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Invalid ML service key'
            });
        }

        // 2. Extract Data from Payload
        const payload = req.body;
        console.log('[ML CALLBACK] Received Payload:', JSON.stringify(payload, null, 2));

        const jewelryId = payload.jewelryId || payload._id;
        if (!jewelryId) {
            return res.status(400).json({ success: false, message: 'Missing jewelryId in payload' });
        }

        // 3. Map Fields
        // The ML service sends: { status: "completed", glb_url: "...", ... }
        const status = payload.status; // "completed", "failed"
        const glbUrl = payload.glb_url;
        const isFallback = payload.is_fallback || false;
        const failureReason = payload.fallback_reason || payload.reason || null;

        // Determine DB statuses
        let dbConversionStatus = 'failed';
        let dbTryOnStatus = 'failed';

        if (status === 'completed' && glbUrl) {
            dbConversionStatus = 'completed';
            dbTryOnStatus = 'ready';
        } else if (status === 'processing') {
            dbConversionStatus = 'processing';
            dbTryOnStatus = 'pending';
        }

        // 4. Update Object
        const updateFields = {
            conversionStatus: dbConversionStatus,
            tryOnStatus: dbTryOnStatus,
            model3D: glbUrl,         // This is the critical field for the frontend
            glbModelUrl: glbUrl,     // Redundant backup field if schema uses it
            isGenerated: true,
            isFallback: isFallback,
            generationError: failureReason,
            updatedAt: new Date(),

            // Upsert metadata fields if provided (for entirely new products)
            name: payload.name,
            description: payload.description,
            price: payload.price,
            category: payload.category || 'necklace',
            image2D: payload.image2D,
            createdBy: payload.createdBy,
            sellerId: payload.sellerId
        };

        // Remove undefined keys so we don't accidentally unset distinct fields
        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] === undefined || updateFields[key] === null) {
                delete updateFields[key];
            }
        });

        console.log('[ML CALLBACK] Updating DB with:', updateFields);

        // 5. Execute Update (Upsert)
        const updatedProduct = await Jewelry.findByIdAndUpdate(
            jewelryId,
            {
                $set: updateFields,
                $setOnInsert: { createdAt: new Date() }
            },
            {
                new: true,   // Return the modified document
                upsert: true, // Create if not exists
                runValidators: false // Allow partial updates
            }
        );

        console.log(`[ML CALLBACK] Success! Product ${updatedProduct._id} model3D is now: ${updatedProduct.model3D}`);

        return res.status(200).json({
            success: true,
            data: updatedProduct
        });

    } catch (error) {
        console.error('[ML CALLBACK ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal processing error: ' + error.message
        });
    }
};