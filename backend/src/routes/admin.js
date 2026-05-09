const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const superAdminOnly = require('../middleware/superAdminOnly');
const multer = require('multer');
const path = require('path');

// Cấu hình multer cho upload ảnh sản phẩm
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Tất cả routes đều yêu cầu admin authentication
router.use(adminAuth);

// Dashboard & Statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management (super admin only) - Quản lý khách hàng
router.get('/users', superAdminOnly, adminController.getAllUsers);
router.delete('/users/:userId', superAdminOnly, adminController.deleteUser);

// Admin Management - Quản lý admin (admin và super_admin)
router.get('/admins', adminController.getAllAdmins);
router.post('/admins', adminController.createAdminUser);
router.put('/admins/:userId', adminController.updateAdmin);
router.put('/admins/:userId/role', superAdminOnly, adminController.updateAdminRole);
router.delete('/admins/:userId', adminController.deleteAdmin);

// Product Management
router.get('/products', adminController.getAllProductsAdmin);
router.post('/products', upload.single('image'), adminController.createProduct);
router.put('/products/:id', upload.single('image'), adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Order Management
router.get('/orders', adminController.getAllOrders);
router.put('/orders/:orderId/status', adminController.updateOrderStatusAdmin);

// Category Management
router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Banner Management
router.get('/banners', adminController.getAllBanners);
router.post('/banners', upload.single('image'), adminController.createBanner);
router.put('/banners/:id', upload.single('image'), adminController.updateBanner);
router.delete('/banners/:id', adminController.deleteBanner);

module.exports = router;


