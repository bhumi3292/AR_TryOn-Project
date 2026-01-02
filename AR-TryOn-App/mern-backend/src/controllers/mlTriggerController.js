// src/controllers/mlTriggerController.js

import axios from 'axios';
import FormData from 'form-data';
import Jewelry from '../models/Jewelry.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000/convert-2d-to-3d";

export const triggerMLConversion = async (req, res) => {
    const { id } = req.params;
    console.log(`[ML TRIGGER] Received request for Product ID: ${id}`);

    try {
        const jewelry = await Jewelry.findById(id);

        if (!jewelry) {
            return res.status(404).json({ success: false, message: 'Jewelry not found' });
        }

        // Logic check: Only allow if not already success (or allow retry?)
        // User said "Do NOT regenerate product" automatically, but manual trigger implies we WANT to generate.
        // So we allow it even if exists, or maybe check status?
        // User: "If ready -> load GLB... If failed -> show fallback". 
        // We'll allow retry.

        // 1. Update DB Status (Optimistic)
        jewelry.tryOnStatus = 'pending';
        jewelry.conversionStatus = 'processing'; // Legacy sync
        await jewelry.save();

        // 2. Return Response Immediately (Non-blocking)
        res.status(202).json({
            success: true,
            message: 'ML conversion request accepted.',
            data: {
                tryOnStatus: 'pending',
                productId: id
            }
        });

        // 3. Async Background Request to ML Service
        (async () => {
            try {
                const imageUrl = jewelry.image2D;
                if (!imageUrl) throw new Error("Product has no image2D URL");

                console.log(`[ML BG] Fetching image from: ${imageUrl}`);

                // Fetch image as stream
                const imageRes = await axios.get(imageUrl, { responseType: 'stream' });

                // Create FormData
                const form = new FormData();
                form.append('file', imageRes.data, `input-${id}.png`);
                form.append('product_id', id);
                form.append('category', jewelry.category || 'necklace');

                console.log(`[ML BG] Sending to ML Service: ${ML_SERVICE_URL}`);

                // Send to ML Service
                await axios.post(ML_SERVICE_URL, form, {
                    headers: {
                        ...form.getHeaders(),
                        // Max content length for large images might be needed
                        'Max-Content-Length': Infinity,
                        'Max-Body-Length': Infinity
                    }
                });

                console.log(`[ML BG] Request sent to ML service successfully.`);
                // Note: ML Service will call /callback to finalize status.

            } catch (bgError) {
                console.error(`[ML BG ERROR] Failed to send to ML service:`, bgError.message);
                // Revert status to failed
                try {
                    await Jewelry.findByIdAndUpdate(id, {
                        tryOnStatus: 'failed',
                        conversionStatus: 'failed'
                    });
                } catch (dbErr) {
                    console.error('[ML BG FATAL] Could not update DB failure status', dbErr);
                }
            }
        })();

    } catch (err) {
        console.error('[ML TRIGGER ERROR]', err);
        return res.status(500).json({ success: false, message: 'Failed to initiate ML trigger.' });
    }
};