import express from 'express';
import { addJewelry, getJewelryPublic, getJewelryById, updateJewelry, deleteJewelry, getSellerJewelry, getTryOnModel } from '../controllers/jewelryController.js';
import adminOnly from '../middleware/adminOnly.js';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Multer Enabled: Handle 'images' (gallery) and 'preview' (main/tryon image)
router.post('/', auth, requireRole(['SELLER', 'admin']),
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'preview', maxCount: 1 },
        { name: 'image2D', maxCount: 1 } // Legacy support
    ]),
    addJewelry
);

// Static routes MUST come before dynamic routes
router.get('/seller', auth, requireRole(['SELLER', 'admin']), getSellerJewelry);
router.get('/preview/tryon', (req, res) => res.json({ message: "Preview endpoint" }));

router.get('/', getJewelryPublic);

// Dynamic routes
router.get('/:id', getJewelryById);
router.get('/:id/tryon', getTryOnModel);
router.put('/:id', auth, requireRole(['SELLER', 'admin']), upload.single('image2D'), updateJewelry);
router.delete('/:id', auth, requireRole(['SELLER', 'admin']), deleteJewelry);

export default router;
