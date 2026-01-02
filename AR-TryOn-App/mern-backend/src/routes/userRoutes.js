import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { getProfile, updateProfile, saveAddress, updateAddress, savePayment, updatePayment } from '../controllers/userController.js';

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, upload.single('profileImage'), updateProfile);
router.post('/address', auth, saveAddress);
router.put('/address', auth, updateAddress);
router.post('/payment', auth, savePayment);
router.put('/payment', auth, updatePayment);

export default router;
