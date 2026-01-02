import express from 'express';
import { getCart, addToCart, removeFromCart, updateCartItem } from '../controllers/cartController.js';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';

const router = express.Router();

router.get('/', auth, requireRole('BUYER'), getCart);
router.post('/add', auth, requireRole('BUYER'), addToCart);
router.put('/update', auth, requireRole('BUYER'), updateCartItem);
router.delete('/remove', auth, requireRole('BUYER'), removeFromCart);

export default router;
