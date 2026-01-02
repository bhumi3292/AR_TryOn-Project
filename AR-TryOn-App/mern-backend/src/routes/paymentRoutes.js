import express from 'express';
import { initiatePayment, verifyKhaltiPayment, verifyEsewaPayment } from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/initiate', auth, initiatePayment);
router.post('/verify/khalti', auth, verifyKhaltiPayment);
router.post('/verify/esewa', verifyEsewaPayment); // eSewa callback might not have auth header? Depending on flow. Usually client calls backend after successful redirect, so it can have auth.

export default router;
