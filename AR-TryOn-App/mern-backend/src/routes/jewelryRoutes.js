import express from 'express';
import { addJewelry, getJewelryPublic, getJewelryById, updateJewelry, deleteJewelry } from '../controllers/jewelryController.js';
import adminOnly from '../middleware/adminOnly.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Expect the form-data file field to be named 'image2D' (matches controller expectations)
router.post('/', adminOnly, upload.single('image2D'), addJewelry);
router.get('/', getJewelryPublic);
router.get('/:id', getJewelryById);
router.put('/:id', adminOnly, upload.single('image2D'), updateJewelry);
router.delete('/:id', adminOnly, deleteJewelry);

export default router;
