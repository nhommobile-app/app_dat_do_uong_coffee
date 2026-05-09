const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public route - app lấy banner active
router.get('/active', adminController.getActiveBanners);

module.exports = router;

