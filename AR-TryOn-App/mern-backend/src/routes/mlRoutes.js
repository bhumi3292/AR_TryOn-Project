// src/routes/mlRoutes.js

import express from "express";
import { triggerMLConversion } from '../controllers/mlTriggerController.js';
import { mlConversionCallback } from '../controllers/mlController.js';
import adminOnly from '../middleware/adminOnly.js';

const router = express.Router();

// Route for Admins to manually re-trigger a conversion (protected by JWT)
router.post('/trigger/:id', adminOnly, triggerMLConversion);

// Route for the ML Service to call back (protected by shared secret header)
router.post('/callback', mlConversionCallback);

export default router;