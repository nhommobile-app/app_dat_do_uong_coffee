const User = require('../models/User');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const { BASE_URL } = require('../config/env');

function buildImageUrl(reqOrImage, maybeImage) {
  let image;
  let baseUrl;

  if (maybeImage === undefined) {
    image = reqOrImage;
    baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  } else {
    const req = reqOrImage;
    image = maybeImage;

    if (req && typeof req.get === 'function') {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    } else {
      baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    }
  }

  if (!image) {
    return `${baseUrl}/uploads/default.jpg`;
  }

  if (typeof image === 'string' && image.startsWith('http')) {
    return image;
  }

  const cleanImage = String(image)
    .replace(/^uploads[\\/]/, '')
    .replace(/^\/+/, '');

  return `${baseUrl}/uploads/${cleanImage}`;
}

const mapUserResponse = (user) => {
  // Debug log để kiểm tra dữ liệu từ DB
  if (!user.email) {
    console.warn('User missing email:', user.id, user);
  }
  return {
    id: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email || '',
    phone: user.phone || null,
    address: user.address || null,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  };
};

const mapAdminResponse = (admin) => ({
  id: admin.id,
  firstName: admin.first_name,
  lastName: admin.last_name,
  email: admin.email,
  phone: admin.phone,
  address: admin.address,
  role: admin.role,
  createdAt: admin.created_at,
  updatedAt: admin.updated_at
});

const DELIVERED_NAME_VARIANTS = [
  'delivered',
  'đã giao',
  'da_giao',
  'da giao',
  'đã giao hàng'
];

async function resolveDeliveredStatusId() {
  const placeholders = DELIVERED_NAME_VARIANTS.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `
    SELECT id 
    FROM order_status 
    WHERE LOWER(name) IN (${placeholders})
    LIMIT 1
    `,
    DELIVERED_NAME_VARIANTS
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [fallback] = await pool.execute(
    `SELECT id FROM order_status ORDER BY id LIMIT 1`
  );
  return fallback[0]?.id || null;
}

const adminController = {
  // ========== DASHBOARD & STATISTICS ==========
  async getDashboardStats(req, res) {
    try {
      const deliveredStatusId = await resolveDeliveredStatusId();

      // Tổng số users
      const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
      
      // Tổng số products
      const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
      
      // Tổng số orders
      const [orderCount] = await pool.execute('SELECT COUNT(*) as count FROM orders');
      
      // Tổng doanh thu
      const [revenueRows] = deliveredStatusId
        ? await pool.execute(
            'SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status_id = ?',
            [deliveredStatusId]
          )
        : [[{ total: 0 }]];
      const totalRevenue = parseFloat(revenueRows[0]?.total) || 0;
      
      // Orders theo status
      const [ordersByStatus] = await pool.execute(`
        SELECT 
          os.name as status,
          COUNT(o.id) as count
        FROM order_status os
        LEFT JOIN orders o ON os.id = o.status_id
        GROUP BY os.id, os.name
      `);
      
      // Top 5 sản phẩm bán chạy
      const [topProducts] = deliveredStatusId
        ? await pool.execute(
            `
            SELECT 
              p.id,
              p.name,
              p.image,
              COALESCE(SUM(oi.quantity), 0) as total_sold,
              COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status_id = ?
            GROUP BY p.id, p.name, p.image
            ORDER BY total_sold DESC
            LIMIT 5
            `,
            [deliveredStatusId]
          )
        : [[]];
      
      // Doanh thu theo tháng (6 tháng gần nhất)
      const [monthlyRevenueRows] = deliveredStatusId
        ? await pool.execute(
            `
            SELECT 
              DATE_FORMAT(order_date, '%Y-%m') as month,
              COALESCE(SUM(total_amount), 0) as revenue,
              COUNT(*) as order_count
            FROM orders
            WHERE status_id = ? AND order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(order_date, '%Y-%m')
            ORDER BY month ASC
            `,
            [deliveredStatusId]
          )
        : [[]];

      const monthMap = new Map(
        (monthlyRevenueRows || []).map(row => [row.month, row])
      );
      const normalizedMonthlyRevenue = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toISOString().slice(0, 7);
        const entry = monthMap.get(key);
        normalizedMonthlyRevenue.push({
          month: key,
          revenue: entry ? parseFloat(entry.revenue) : 0,
          order_count: entry ? parseInt(entry.order_count) : 0
        });
      }

      res.json({
        stats: {
          totalUsers: parseInt(userCount[0]?.count) || 0,
          totalProducts: parseInt(productCount[0]?.count) || 0,
          totalOrders: parseInt(orderCount[0]?.count) || 0,
          totalRevenue
        },
        ordersByStatus: ordersByStatus || [],
        topProducts: (topProducts || []).map(p => ({
          ...p,
          image: buildImageUrl(req, p.image),
          total_sold: parseInt(p.total_sold) || 0,
          revenue: parseFloat(p.revenue) || 0
        })),
        monthlyRevenue: normalizedMonthlyRevenue
      });
    } catch (error) {
      console.error('Lỗi lấy thống kê dashboard:', error);
      res.status(500).json({ 
        success: false,
        message: 'Lỗi máy chủ nội bộ',
        error: error.message 
      });
    }
  },

  // ========== USER MANAGEMENT ==========
  async getAllUsers(req, res) {
    try {
      const users = await User.getAll();
      console.log('Raw users from DB:', users.length, 'users');
      if (users.length > 0) {
        console.log('Sample raw user:', users[0]);
      }
      const mappedUsers = users.map(mapUserResponse);
      if (mappedUsers.length > 0) {
        console.log('Sample mapped user:', mappedUsers[0]);
      }
      res.json(mappedUsers);
    } catch (error) {
      console.error('Lỗi lấy danh sách users:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }

      await User.delete(userId);
      res.json({ message: 'Xóa user thành công' });
    } catch (error) {
      console.error('Lỗi xóa user:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  // ========== ADMIN MANAGEMENT ==========
  async getAllAdmins(req, res) {
    try {
      // Chỉ admin và super_admin mới có thể xem danh sách
      const currentUserRole = req.user.role;
      if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }
      
      const admins = await Admin.getAll();
      res.json(admins.map(mapAdminResponse));
    } catch (error) {
      console.error('Lỗi lấy danh sách admins:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async createAdminUser(req, res) {
    try {
      const { email, password, firstName, lastName, phone, address, role } = req.body;
      const currentUserRole = req.user.role;

      // Chỉ admin và super_admin mới có thể tạo
      if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
        return res.status(403).json({ message: 'Không có quyền tạo admin' });
      }

      if (!email || !password || !firstName || !lastName || !phone || !address) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
      }

      // Validate role
      const allowedRoles = ['admin', 'super_admin', 'employee'];
      const selectedRole = role || 'employee';
      if (!allowedRoles.includes(selectedRole)) {
        return res.status(400).json({ message: 'Role không hợp lệ' });
      }

      // Chỉ super_admin mới có thể tạo super_admin
      if (selectedRole === 'super_admin' && currentUserRole !== 'super_admin') {
        return res.status(403).json({ message: 'Chỉ super admin mới có thể tạo super admin' });
      }

      // Kiểm tra email đã tồn tại trong admins hoặc users
      const existingAdmin = await Admin.findByEmail(email);
      const existingUser = await User.findByEmail(email);
      if (existingAdmin || existingUser) {
        return res.status(409).json({ message: 'Email đã tồn tại trong hệ thống' });
      }

      const newAdmin = await Admin.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        address,
        role: selectedRole
      });

      return res.status(201).json({
        message: 'Tạo tài khoản admin thành công',
        user: mapAdminResponse(newAdmin)
      });
    } catch (error) {
      console.error('Lỗi tạo admin user:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateAdminRole(req, res) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const allowedRoles = ['admin', 'super_admin', 'employee'];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Role không hợp lệ' });
      }

      const targetAdmin = await Admin.findById(userId);
      if (!targetAdmin) {
        return res.status(404).json({ message: 'Không tìm thấy admin' });
      }

      if (targetAdmin.role === 'super_admin' && role !== 'super_admin') {
        return res.status(400).json({ message: 'Không thể thay đổi quyền của super admin' });
      }

      await Admin.updateRole(userId, role);
      res.json({ message: 'Cập nhật role thành công' });
    } catch (error) {
      console.error('Lỗi cập nhật role:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateAdmin(req, res) {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email, phone, address, role, password } = req.body;
      const currentUserRole = req.user.role;

      const targetAdmin = await Admin.findById(userId);
      if (!targetAdmin) {
        return res.status(404).json({ message: 'Không tìm thấy admin' });
      }

      // Chỉ super_admin mới có thể đổi mật khẩu
      if (password && currentUserRole !== 'super_admin') {
        return res.status(403).json({ message: 'Chỉ super admin mới có thể đổi mật khẩu' });
      }

      // Chỉ super_admin mới có thể đổi role
      if (role && currentUserRole !== 'super_admin') {
        return res.status(403).json({ message: 'Chỉ super admin mới có thể đổi role' });
      }

      // Không cho phép đổi role của super_admin
      if (role && targetAdmin.role === 'super_admin' && role !== 'super_admin') {
        return res.status(400).json({ message: 'Không thể thay đổi role của super admin' });
      }

      // Email không được thay đổi khi update

      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (role !== undefined && currentUserRole === 'super_admin') updateData.role = role;
      if (password && currentUserRole === 'super_admin') updateData.password = password;

      await Admin.update(userId, updateData);
      const updatedAdmin = await Admin.findById(userId);
      
      res.json({
        message: 'Cập nhật thông tin admin thành công',
        admin: mapAdminResponse(updatedAdmin)
      });
    } catch (error) {
      console.error('Lỗi cập nhật admin:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async deleteAdmin(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;
      const currentUserRole = req.user.role;
      
      if (String(userId) === String(currentUserId)) {
        return res.status(400).json({ message: 'Không thể xóa tài khoản của chính bạn' });
      }

      const targetAdmin = await Admin.findById(userId);
      if (!targetAdmin) {
        return res.status(404).json({ message: 'Không tìm thấy admin' });
      }

      if (targetAdmin.role === 'super_admin') {
        return res.status(400).json({ message: 'Không thể xóa super admin' });
      }

      // Chỉ admin và super_admin mới có thể xóa
      if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
        return res.status(403).json({ message: 'Không có quyền xóa admin' });
      }

      await Admin.delete(userId);
      res.json({ message: 'Xóa admin thành công' });
    } catch (error) {
      console.error('Lỗi xóa admin:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  // ========== PRODUCT MANAGEMENT ==========
  async getAllProductsAdmin(req, res) {
    try {
      const products = await Product.getAll();
      
      // Lấy sizes cho từng sản phẩm
      for (const product of products) {
        const sizes = await Product.getSizes(product.id);
        product.sizes = sizes.map(s => ({
          size: s.size,
          priceModifier: parseFloat(s.price_modifier) || 0
        }));
      }
      
      res.json(products.map(p => ({
        ...p,
        image: buildImageUrl(p.image)
      })));
    } catch (error) {
      console.error('Lỗi lấy danh sách products:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async createProduct(req, res) {
    try {
      const { name, description, fullDescription, price, categoryId, sizes } = req.body;
      
      if (!name || !description || !price || !categoryId) {
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      const productId = uuidv4();
      const image = req.file ? req.file.filename : 'default.jpg';

      await pool.execute(
        'INSERT INTO products (id, name, description, full_description, price, image, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [productId, name, description, fullDescription || description, price, image, categoryId]
      );

      // Thêm sizes nếu có
      const parsedSizes = parseSizes(sizes);

if (parsedSizes.length > 0) {
  for (const size of parsedSizes) {
    await pool.execute(
      'INSERT INTO product_sizes (product_id, size, price_modifier) VALUES (?, ?, ?)',
      [
        productId,
        size.size,
        Number(size.priceModifier || size.price_modifier || 0)
      ]
    );
  }
}

      const product = await Product.getById(productId);
      product.image = buildImageUrl(req, product.image);
      res.status(201).json(product);
    } catch (error) {
      console.error('Lỗi tạo product:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const { name, description, fullDescription, price, categoryId, sizes } = req.body;

      const product = await Product.getById(id);
      if (!product) {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      }

      // Cập nhật thông tin sản phẩm
      const image = req.file ? req.file.filename : product.image;
      
      await pool.execute(
        'UPDATE products SET name = ?, description = ?, full_description = ?, price = ?, image = ?, category_id = ? WHERE id = ?',
        [name, description, fullDescription || description, price, image, categoryId, id]
      );

      // Cập nhật sizes
      const parsedSizes = parseSizes(sizes);

// Xóa sizes cũ
await pool.execute('DELETE FROM product_sizes WHERE product_id = ?', [id]);

// Thêm sizes mới
if (parsedSizes.length > 0) {
  for (const size of parsedSizes) {
    await pool.execute(
      'INSERT INTO product_sizes (product_id, size, price_modifier) VALUES (?, ?, ?)',
      [
        id,
        size.size,
        Number(size.priceModifier || size.price_modifier || 0)
      ]
    );
  }
}

      const updatedProduct = await Product.getById(id);
      updatedProduct.image = buildImageUrl(req, updatedProduct.image);
      res.json(updatedProduct);
    } catch (error) {
      console.error('Lỗi cập nhật product:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async deleteProduct(req, res) {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    await connection.beginTransaction();

    const [products] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const product = products[0];

    // Xóa dữ liệu phụ thuộc trước
    await connection.execute('DELETE FROM favorites WHERE product_id = ?', [id]);
    await connection.execute('DELETE FROM cart_items WHERE product_id = ?', [id]);
    await connection.execute('DELETE FROM reviews WHERE product_id = ?', [id]);
    await connection.execute('DELETE FROM product_sizes WHERE product_id = ?', [id]);

    // Vì order_items đang giữ product_id nên phải xóa trước
    // Lưu ý: thao tác này sẽ làm mất chi tiết sản phẩm trong đơn hàng cũ
    await connection.execute('DELETE FROM order_items WHERE product_id = ?', [id]);

    // Sau đó mới xóa sản phẩm
    await connection.execute('DELETE FROM products WHERE id = ?', [id]);

    await connection.commit();

    // Xóa file ảnh sau khi database đã xóa thành công
    if (
      product.image &&
      product.image !== 'default.jpg' &&
      !product.image.startsWith('http')
    ) {
      try {
        const imageName = product.image.replace(/^uploads[\\/]/, '');
        const imagePath = path.join(__dirname, '..', '..', 'uploads', imageName);
        await fs.unlink(imagePath);
      } catch (err) {
        console.warn('Không tìm thấy file ảnh để xóa, bỏ qua:', err.message);
      }
    }

    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    await connection.rollback();
    console.error('Lỗi xóa product:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  } finally {
    connection.release();
  }
},

  // ========== ORDER MANAGEMENT ==========
  async getAllOrders(req, res) {
    try {
      const [orders] = await pool.execute(`
        SELECT 
          o.id,
          o.user_id,
          o.total_amount,
          o.status_id,
          o.delivery_address,
          o.notes,
          o.payment_method_id,
          o.customer_name,
          o.customer_phone,
          o.created_at,
          os.name as status_name,
          pm.name as payment_method_name,
          u.email as user_email,
          u.first_name,
          u.last_name
        FROM orders o
        LEFT JOIN order_status os ON o.status_id = os.id
        LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `);

      // Lấy items cho từng order
      for (const order of orders) {
        const [items] = await pool.execute(`
          SELECT 
            oi.id,
            oi.product_id,
            p.name as product_name,
            oi.price,
            oi.quantity,
            oi.size,
            p.image
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);
        
        order.items = items.map(item => ({
          ...item,
          image: buildImageUrl(item.image)
        }));
      }

      res.json(orders);
    } catch (error) {
      console.error('Lỗi lấy danh sách orders:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateOrderStatusAdmin(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      await Order.updateStatus(orderId, status);
      res.json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  // ========== CATEGORY MANAGEMENT ==========
  async getAllCategories(req, res) {
    try {
      const [categories] = await pool.execute('SELECT * FROM categories ORDER BY name');
      res.json(categories);
    } catch (error) {
      console.error('Lỗi lấy danh sách categories:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async createCategory(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
      }

      const categoryId = uuidv4();
      await pool.execute(
        'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
        [categoryId, name, description || null]
      );

      const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [categoryId]);
      res.status(201).json(categories[0]);
    } catch (error) {
      console.error('Lỗi tạo category:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      await pool.execute(
        'UPDATE categories SET name = ?, description = ? WHERE id = ?',
        [name, description || null, id]
      );

      const [categories] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
      res.json(categories[0]);
    } catch (error) {
      console.error('Lỗi cập nhật category:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
      res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
      console.error('Lỗi xóa category:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  // ========== BANNER MANAGEMENT ==========
  async getAllBanners(req, res) {
    try {
      const [banners] = await pool.execute(
        'SELECT * FROM banners ORDER BY display_order ASC, created_at DESC'
      );
      res.json(banners.map(banner => ({
        ...banner,
        image: buildImageUrl(banner.image)
      })));
    } catch (error) {
      console.error('Lỗi lấy danh sách banners:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async getActiveBanners(req, res) {
    try {
      const [banners] = await pool.execute(
        'SELECT * FROM banners WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
      );
      res.json(banners.map(banner => ({
        ...banner,
        image: buildImageUrl(banner.image)
      })));
    } catch (error) {
      console.error('Lỗi lấy banners active:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async createBanner(req, res) {
    try {
      const { title, description, linkUrl, isActive, displayOrder } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: 'Tiêu đề banner là bắt buộc' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Hình ảnh banner là bắt buộc' });
      }

      const bannerId = uuidv4();
      await pool.execute(
        'INSERT INTO banners (id, title, description, image, link_url, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          bannerId,
          title,
          description || null,
          req.file.filename,
          linkUrl || null,
          isActive !== undefined ? Boolean(isActive) : true,
          displayOrder || 0
        ]
      );

      const [banners] = await pool.execute('SELECT * FROM banners WHERE id = ?', [bannerId]);
      const banner = banners[0];
      res.status(201).json({
        ...banner,
        image: buildImageUrl(banner.image)
      });
    } catch (error) {
      console.error('Lỗi tạo banner:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async updateBanner(req, res) {
    try {
      const { id } = req.params;
      const { title, description, linkUrl, isActive, displayOrder } = req.body;

      const [existing] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id]);
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy banner' });
      }

      const image = req.file ? req.file.filename : existing[0].image;

      await pool.execute(
        'UPDATE banners SET title = ?, description = ?, image = ?, link_url = ?, is_active = ?, display_order = ? WHERE id = ?',
        [
          title,
          description || null,
          image,
          linkUrl || null,
          isActive !== undefined ? Boolean(isActive) : existing[0].is_active,
          displayOrder !== undefined ? displayOrder : existing[0].display_order,
          id
        ]
      );

      // Xóa ảnh cũ nếu có ảnh mới
      if (req.file && existing[0].image && existing[0].image !== 'default.jpg') {
        try {
          const imagePath = path.join(__dirname, '..', '..', 'uploads', existing[0].image);
          await fs.unlink(imagePath);
        } catch (err) {
          console.error('Lỗi xóa file ảnh cũ:', err);
        }
      }

      const [banners] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id]);
      const banner = banners[0];
      res.json({
        ...banner,
        image: buildImageUrl(banner.image)
      });
    } catch (error) {
      console.error('Lỗi cập nhật banner:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  },

  async deleteBanner(req, res) {
    try {
      const { id } = req.params;
      
      const [banners] = await pool.execute('SELECT * FROM banners WHERE id = ?', [id]);
      if (banners.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy banner' });
      }

      const banner = banners[0];

      // Xóa file ảnh nếu không phải default
      if (banner.image && banner.image !== 'default.jpg') {
        try {
          const imagePath = path.join(__dirname, '..', '..', 'uploads', banner.image);
          await fs.unlink(imagePath);
        } catch (err) {
          console.error('Lỗi xóa file ảnh:', err);
        }
      }

      await pool.execute('DELETE FROM banners WHERE id = ?', [id]);
      res.json({ message: 'Xóa banner thành công' });
    } catch (error) {
      console.error('Lỗi xóa banner:', error);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
  }
};
const parseSizes = (sizes) => {
  if (!sizes) return [];

  if (Array.isArray(sizes)) {
    return sizes;
  }

  try {
    const parsed = JSON.parse(sizes);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};
module.exports = adminController;


