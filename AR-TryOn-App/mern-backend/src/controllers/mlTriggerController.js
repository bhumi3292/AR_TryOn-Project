// src/controllers/mlTriggerController.js

import axios from 'axios';
import Jewelry from '../models/Jewelry.js';


export const triggerMLConversion = async (req, res) => {
    try {
        const jewelry = await Jewelry.findById(req.params.id);

        if (!jewelry) {
            return res.status(404).json({ success: false, message: 'Jewelry not found' });
        }

        if (jewelry.conversionStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Conversion already triggered or in progress'
            });
        }

        // 1. Mark as processing in DB immediately
        jewelry.conversionStatus = 'processing';
        await jewelry.save();

        await axios.post(
            process.env.ML_SERVICE_URL,
            {
                jewelryId: jewelry._id,
                image2DUrl: jewelry.image2D,
                callbackUrl: `${process.env.BASE_API_URL}/api/ml/callback` 
            },
            {
                headers: {
                    'x-backend-secret': process.env.ML_BACKEND_SECRET 
                }
            }
        );

        return res.status(202).json({
            success: true,
            message: 'ML conversion triggered successfully. Status updated to processing.'
        });

    } catch (err) {
        console.error('[ML TRIGGER ERROR]', err);
        
        return res.status(500).json({ success: false, message: 'ML trigger failed.' });
    }
};