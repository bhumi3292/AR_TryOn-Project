import Jewelry from '../models/Jewelry.js';
import mongoose from 'mongoose';
import { triggerMLBackground } from './jewelryController.js';

// Dev-only endpoint to create a product without auth and trigger ML
export const createDevProduct = async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, message: 'Not available in production' });
        }

        const { name, category, price, image2D, description } = req.body;
        if (!name || !category) {
            return res.status(400).json({ success: false, message: 'name and category required' });
        }

        const userId = process.env.DEV_USER_ID ? mongoose.Types.ObjectId(process.env.DEV_USER_ID) : mongoose.Types.ObjectId();

        const jewelry = await Jewelry.create({
            name,
            category,
            description: description || '',
            price: Number(price) || 0,
            image2D: image2D || null,
            images: image2D ? [image2D] : [],
            createdBy: userId,
            sellerId: userId,
            conversionStatus: 'pending',
            tryOnStatus: 'pending'
        });

        // Trigger ML in background
        triggerMLBackground(jewelry);

        return res.status(201).json({ success: true, data: jewelry });
    } catch (err) {
        console.error('Dev create product error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

export default { createDevProduct };
