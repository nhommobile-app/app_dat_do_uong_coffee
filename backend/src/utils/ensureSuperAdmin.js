const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const DEFAULT_SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'dieuchauzz@gmail.com',
  password: process.env.SUPER_ADMIN_PASSWORD || '123456A@',
  firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'Dieu',
  lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Châu'
};

const SHOULD_AUTO_SEED = process.env.AUTO_SEED_SUPER_ADMIN !== 'false';

async function ensureSuperAdmin() {
  if (!SHOULD_AUTO_SEED) {
    console.log('[super-admin] AUTO_SEED_SUPER_ADMIN=false ⇒ bỏ qua khởi tạo mặc định.');
    return;
  }

  try {
    console.log('[super-admin] Đang kiểm tra tài khoản super admin mặc định...');
    const [existing] = await pool.execute(
      'SELECT id, email, role FROM admins WHERE email = ? LIMIT 1',
      [DEFAULT_SUPER_ADMIN.email]
    );

    const hashedPassword = await bcrypt.hash(DEFAULT_SUPER_ADMIN.password, 10);

    if (existing.length > 0) {
      const admin = existing[0];
      await pool.execute(
        `UPDATE admins 
         SET first_name = ?, last_name = ?, password = ?, role = 'super_admin'
         WHERE id = ?`,
        [
          DEFAULT_SUPER_ADMIN.firstName,
          DEFAULT_SUPER_ADMIN.lastName,
          hashedPassword,
          admin.id
        ]
      );
      console.log('[super-admin] Đã đảm bảo tài khoản super admin mặc định tồn tại.');
      return;
    }

    await pool.execute(
      `INSERT INTO admins (first_name, last_name, email, password, role)
       VALUES (?, ?, ?, ?, 'super_admin')`,
      [
        DEFAULT_SUPER_ADMIN.firstName,
        DEFAULT_SUPER_ADMIN.lastName,
        DEFAULT_SUPER_ADMIN.email,
        hashedPassword
      ]
    );

    console.log('[super-admin] Đã tạo mới tài khoản super admin mặc định.');
  } catch (error) {
    console.error('[super-admin] Không thể đảm bảo super admin mặc định:', error.message);
  }
}

module.exports = ensureSuperAdmin;


