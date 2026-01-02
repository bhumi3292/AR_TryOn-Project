import express from 'express';
import devController from '../controllers/devController.js';

const router = express.Router();

// Optional key: set DEV_API_KEY in env to require a header for safety
router.post('/product', async (req, res, next) => {
    try {
        const key = req.headers['x-dev-api-key'];
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, message: 'Disabled in production' });
        }
        if (process.env.DEV_API_KEY && process.env.DEV_API_KEY !== key) {
            return res.status(403).json({ success: false, message: 'Invalid DEV API key' });
        }
        return devController.createDevProduct(req, res);
    } catch (e) { next(e); }
});

export default router;
