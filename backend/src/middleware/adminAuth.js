const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const ALLOWED_ROLES = ['admin', 'super_admin', 'employee'];

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization header không hợp lệ' 
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn' 
      });
    }

    // Kiểm tra nếu token có type = 'admin' hoặc có role trong decoded
    // Nếu token cũ không có type, thử tìm trong bảng admins trước
    let admin;
    
    if (decoded.type === 'admin' || decoded.role) {
      // Token mới có type hoặc role
      admin = await Admin.findById(decoded.userId);
    } else {
      // Token cũ, thử tìm trong bảng admins
      admin = await Admin.findById(decoded.userId);
      if (!admin) {
        return res.status(401).json({ 
          success: false,
          message: 'Token không hợp lệ. Vui lòng đăng nhập lại.' 
        });
      }
    }
    
    if (!admin) {
      return res.status(401).json({ 
        success: false,
        message: 'Admin không tồn tại' 
      });
    }

    if (!ALLOWED_ROLES.includes(admin.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Không có quyền truy cập. Chỉ admin mới có quyền này.' 
      });
    }
    
    req.user = {
      userId: admin.id,
      email: admin.email,
      role: admin.role
    };
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi xác thực' 
    });
  }
};

