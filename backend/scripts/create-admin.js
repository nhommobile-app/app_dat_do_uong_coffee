/**
 * Script để tạo tài khoản admin
 * Usage: node scripts/create-admin.js <email> <password> <firstName> <lastName>
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

async function createAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.error('Usage: node scripts/create-admin.js <email> <password> <firstName> <lastName>');
    process.exit(1);
  }

  const [email, password, firstName, lastName] = args;

  try {
    // Kiểm tra user đã tồn tại chưa
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      // Cập nhật role thành admin
      await pool.execute(
        'UPDATE users SET role = ? WHERE email = ?',
        ['admin', email]
      );
      console.log(`✅ Đã cập nhật user ${email} thành admin`);
    } else {
      // Tạo user mới với role admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute(
        'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword, 'admin']
      );
      console.log(`✅ Đã tạo admin user: ${email}`);
    }

    console.log('\n📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', `${firstName} ${lastName}`);
    console.log('🔐 Role: admin');
    console.log('\n✨ Bạn có thể đăng nhập vào admin panel với thông tin trên!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
}

createAdmin();







