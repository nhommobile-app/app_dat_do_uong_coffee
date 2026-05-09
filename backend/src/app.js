const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const searchRoutes = require('./routes/search');
const locationRoutes = require('./routes/location');

const app = express();
const { PORT, HOST, BASE_URL } = require('./config/env');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/locations', locationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server is running at ${BASE_URL}`);
  console.log(`Uploads directory: ${path.join(__dirname, '../uploads')}`);
});