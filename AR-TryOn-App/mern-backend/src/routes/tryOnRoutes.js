
import express from 'express';
import { triggerMLConversion } from '../controllers/mlTriggerController.js';
import { getTryOnModel } from '../controllers/jewelryController.js';

const router = express.Router();

// POST /api/tryon/:productId/generate
router.post('/:productId/generate', triggerMLConversion);

// Legacy GET /api/tryon/:id (mapped in app.js differently but good to have here if we consolidate)
// Keeping it simple as per request.

export default router;
