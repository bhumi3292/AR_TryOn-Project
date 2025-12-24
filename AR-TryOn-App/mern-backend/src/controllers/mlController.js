// src/controllers/mlCallbackController.js

import Jewelry from '../models/Jewelry.js';


export const mlConversionCallback = async (req, res) => {
    try {
        // 🔐 SECURITY: Check the shared secret key from the ML service
        const apiKey = req.headers['x-ml-api-key'];
        if (apiKey !== process.env.ML_CALLBACK_SECRET) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Invalid ML service key'
            });
        }

        const { jewelryId, model3DUrl, conversionStatus } = req.body;

        if (!jewelryId || !conversionStatus) {
            return res.status(400).json({
                success: false,
                message: 'jewelryId and conversionStatus are required'
            });
        }

        if (!['completed', 'failed'].includes(conversionStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid conversionStatus'
            });
        }

        // Normalize model3DUrl to a backend-served absolute URL when possible
        let normalizedModel3D = null;
        try {
            if (conversionStatus === 'completed' && model3DUrl) {
                const urlPath = String(model3DUrl);
                // If ML service returned a path under its /output directory, extract filename
                // and rewrite to backend's /ml-output/<filename> so frontend fetches via the backend (avoids CORS)
                const parsed = urlPath.split('/');
                const filename = parsed[parsed.length - 1] || null;
                const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
                if (filename) {
                    normalizedModel3D = `${base.replace(/\/$/, '')}/ml-output/${filename}`;
                } else {
                    normalizedModel3D = model3DUrl;
                }
            }
        } catch (e) {
            console.error('[ML CALLBACK] URL normalization failed, using raw URL', e);
            normalizedModel3D = model3DUrl || null;
        }

        const update = conversionStatus === 'completed'
            ? { conversionStatus, model3D: normalizedModel3D }
            : { conversionStatus, model3D: null };

        const jewelry = await Jewelry.findByIdAndUpdate(
            jewelryId,
            { $set: update },
            { new: true }
        );

        if (!jewelry) {
            return res.status(404).json({ success: false, message: 'Jewelry not found' });
        }

        console.log(`[ML CALLBACK] Jewelry ${jewelryId} → ${conversionStatus}`);

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('[ML CALLBACK ERROR]', err);
        return res.status(500).json({ success: false, message: 'ML callback failed' });
    }
};