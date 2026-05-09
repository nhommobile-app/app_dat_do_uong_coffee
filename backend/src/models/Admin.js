const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Admin {
  static async create(adminData) {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      role = 'admin'
    } = adminData;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.execute(
      'INSERT INTO admins (first_name, last_name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, phone || null, address || null, role]
    );
    
    return this.findById(result.insertId);
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async update(id, adminData) {
    const { firstName, lastName, phone, address, role, password } = adminData;
    const safe = v => (v === undefined || v === '' ? null : v);
    
    let updateFields = [];
    let updateValues = [];
    
    if (firstName !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(safe(firstName));
    }
    if (lastName !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(safe(lastName));
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(safe(phone));
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(safe(address));
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }
    
    if (updateFields.length === 0) {
      return this.findById(id);
    }
    
    updateValues.push(id);
    await pool.execute(
      `UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    return this.findById(id);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE admins SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
  }

  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM admins ORDER BY created_at DESC'
    );
    return rows;
  }

  static async updateRole(id, role) {
    if (!['admin', 'super_admin', 'employee'].includes(role)) {
      throw new Error('Role không hợp lệ');
    }
    await pool.execute(
      'UPDATE admins SET role = ? WHERE id = ?',
      [role, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await pool.execute('DELETE FROM admins WHERE id = ?', [id]);
  }
}

module.exports = Admin;

