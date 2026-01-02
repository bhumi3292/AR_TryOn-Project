import express from 'express';
import { checkout, getBuyerOrders, getSellerOrders, updateOrderStatus } from '../controllers/orderController.js';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.post('/checkout', auth, requireRole('BUYER'), checkout);
router.get('/buyer', auth, requireRole('BUYER'), getBuyerOrders);
router.get('/seller', auth, requireRole(['SELLER', 'admin']), getSellerOrders);
router.put('/status/:id', auth, requireRole(['SELLER', 'admin']), updateOrderStatus);

export default router;
