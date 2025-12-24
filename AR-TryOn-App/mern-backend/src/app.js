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
import Jewelry from './models/Jewelry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 1. Serve standard uploads
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Serving uploads from:', uploadsPath);

// 2. Serve ML service output (Fixed path.resolve)
const mlOutputPath = path.resolve(__dirname, '../../ml-service-2dto3d/output');
app.use('/ml-output', express.static(mlOutputPath));
console.log('📁 Serving ML output from:', mlOutputPath);

app.use('/api/admin', adminRoutes);
app.use('/api/jewelry', jewelryRoutes);
app.use('/api/ml', mlRoutes);

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

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;