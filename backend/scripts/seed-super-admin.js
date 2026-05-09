/**
 * Seed mặc định tài khoản super admin để quản trị hệ thống.
 * Usage: npm run seed:super-admin
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

const DEFAULT_SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || 'dieuchauzz@gmail.com@gmail.com',
  password: process.env.SUPER_ADMIN_PASSWORD || '123456A@',
  firstName: process.env.SUPER_ADMIN_FIRST_NAME || 'Chau',
  lastName: process.env.SUPER_ADMIN_LAST_NAME || 'Dieu'
};

async function seedSuperAdmin() {
  try {
    console.log('🔐 Đang kiểm tra tài khoản super admin mặc định...');
    const [existing] = await pool.execute(
      'SELECT * FROM admins WHERE email = ?',
      [DEFAULT_SUPER_ADMIN.email]
    );

    const hashedPassword = await bcrypt.hash(DEFAULT_SUPER_ADMIN.password, 10);

    if (existing.length > 0) {
      const admin = existing[0];
      await pool.execute(
        `
          UPDATE admins 
          SET first_name = ?, last_name = ?, password = ?, role = 'super_admin'
          WHERE id = ?
        `,
        [
          DEFAULT_SUPER_ADMIN.firstName,
          DEFAULT_SUPER_ADMIN.lastName,
          hashedPassword,
          admin.id
        ]
      );

      console.log('✅ Đã cập nhật tài khoản hiện có thành super admin mặc định.');
    } else {
      await pool.execute(
        `
          INSERT INTO admins (first_name, last_name, email, password, role) 
          VALUES (?, ?, ?, ?, 'super_admin')
        `,
        [
          DEFAULT_SUPER_ADMIN.firstName,
          DEFAULT_SUPER_ADMIN.lastName,
          DEFAULT_SUPER_ADMIN.email,
          hashedPassword
        ]
      );

      console.log('✅ Đã tạo mới tài khoản super admin mặc định.');
    }

    console.log('\n📧 Email:', DEFAULT_SUPER_ADMIN.email);
    console.log('🔑 Password:', DEFAULT_SUPER_ADMIN.password);
    console.log('👤 Name:', `${DEFAULT_SUPER_ADMIN.firstName} ${DEFAULT_SUPER_ADMIN.lastName}`);
    console.log('🎯 Role: super_admin');
    console.log('\n⚠️ Vui lòng thay đổi mật khẩu sau khi đăng nhập lần đầu tiên!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Không thể seed super admin:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();


