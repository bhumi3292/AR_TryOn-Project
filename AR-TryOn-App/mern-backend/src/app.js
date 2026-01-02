import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import jewelryRoutes from './routes/jewelryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import Jewelry from './models/Jewelry.js';
import { getTryOnModel } from './controllers/jewelryController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 1. Serve standard uploads
// Using process.cwd() assumes server is started from mern-backend root
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Serving uploads from:', uploadsPath);

// 2. Serve ML service output
const mlOutputPath = path.join(process.cwd(), 'ml-output');
app.use('/ml-output', express.static(mlOutputPath));
console.log('📁 Serving ML output from:', mlOutputPath);

import chatRoutes from './routes/chatRoutes.js';
import tryOnRoutes from './routes/tryOnRoutes.js';
import devRoutes from './routes/devRoutes.js';

app.use('/api/admin', adminRoutes);
app.use('/api/jewelry', jewelryRoutes);
// Alias for compliance with product specifications
app.use('/api/products', jewelryRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/tryon', tryOnRoutes); // New Route for generation trigger
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chats', chatRoutes);
// Dev-only helpers
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev', devRoutes);
}

// Categories endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const schema = Jewelry.schema.path('category');
    if (schema && schema.enumValues && schema.enumValues.length > 0) {
      return res.json({ success: true, data: schema.enumValues.map(v => ({ id: v, name: v.charAt(0).toUpperCase() + v.slice(1) })) });
    }
    const cats = await Jewelry.distinct('category');
    return res.json({ success: true, data: cats.map(c => ({ id: c, name: c })) });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'AR Jewelry Try-On Backend Running' });
});

// Backwards-compatible try-on API path requested by frontend
// Static route for 'preview' must come before dynamic :id route to avoid CastError
app.get('/api/products/preview/tryon', (req, res) => {
  // Return a clear message so the dynamic route isn't invoked with 'preview' as an ObjectId
  return res.status(404).json({ success: false, message: 'Preview try-on not available at this products path' });
});

app.get('/api/products/:id/tryon', getTryOnModel);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;