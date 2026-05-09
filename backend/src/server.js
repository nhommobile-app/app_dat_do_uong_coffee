const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const multer = require('multer');

const ensureSuperAdmin = require('./utils/ensureSuperAdmin');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const searchRoutes = require('./routes/search');
const locationRoutes = require('./routes/location');
const adminRoutes = require('./routes/admin');
const bannerRoutes = require('./routes/banner');
const app = express();
const { PORT, HOST, BASE_URL } = require('./config/env');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('[MulterError]', err.message);
    return res.status(400).json({ message: `Upload thất bại: ${err.message}` });
  }

  if (err?.message === 'Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)') {
    console.warn('[UploadValidation]', err.message);
    return res.status(400).json({ message: err.message });
  }

  console.error(err.stack || err);
  res.status(500).json({ message: 'Đã xảy ra lỗi!' });
});

async function startServer() {
  await ensureSuperAdmin();

  app.listen(PORT, HOST, () => {
    console.log(`Server is running at ${BASE_URL}`);
    console.log(`Listening on ${HOST}:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Không thể khởi động server:', error);
  process.exit(1);
});