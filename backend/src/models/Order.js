const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const statusCache = new Map();
const paymentMethodCache = new Map();

const DEFAULT_STATUS = 'processing';
const DEFAULT_PAYMENT_METHOD = 'cash';

async function resolveStatusId(status = DEFAULT_STATUS) {
  const key = String(status || DEFAULT_STATUS).toLowerCase()

  if (statusCache.has(key)) {
    return statusCache.get(key)
  }

  const [rows] = await pool.execute(
    'SELECT id FROM order_status WHERE name = ? LIMIT 1',
    [key]
  )

  if (rows.length > 0) {
    statusCache.set(key, rows[0].id)
    return rows[0].id
  }

  const [defaultRows] = await pool.execute(
    'SELECT id FROM order_status WHERE name = ? LIMIT 1',
    [DEFAULT_STATUS]
  )

  if (defaultRows.length > 0) {
    statusCache.set(DEFAULT_STATUS, defaultRows[0].id)
    return defaultRows[0].id
  }

  throw new Error(`Không tìm thấy trạng thái đơn hàng: ${key}`)
}

async function resolvePaymentMethodId(method = DEFAULT_PAYMENT_METHOD) {
  const key = method.toLowerCase();
  if (paymentMethodCache.has(key)) return paymentMethodCache.get(key);

  const [rows] = await pool.execute(
    'SELECT id FROM payment_methods WHERE name = ? LIMIT 1',
    [key]
  );

  if (rows.length > 0) {
    paymentMethodCache.set(key, rows[0].id);
    return rows[0].id;
  }

  const [fallback] = await pool.execute('SELECT id, name FROM payment_methods LIMIT 1');
  if (fallback.length === 0) {
    throw new Error('No payment methods configured in database');
  }

  paymentMethodCache.set(fallback[0].name, fallback[0].id);
  return fallback[0].id;
}

class Order {
  static async create({ userId, items, totalAmount, status, address, note, paymentMethod, customerName, customerPhone }) {
    const orderId = uuidv4();
    const statusId = await resolveStatusId(status);
    const paymentMethodId = await resolvePaymentMethodId(paymentMethod);
    
    await pool.execute(
      'INSERT INTO orders (id, user_id, total_amount, status_id, delivery_address, notes, payment_method_id, delivery_method, customer_name, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        orderId,
        userId,
        totalAmount,
        statusId,
        address || null,
        note || null,
        paymentMethodId,
        'deliver',
        customerName || null,
        customerPhone || null
      ]
    );
    for (const item of items) {
      await pool.execute(
        'INSERT INTO order_items (id, order_id, product_id, quantity, size, price) VALUES (?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          orderId,
          item.id,
          item.quantity,
          item.size,
          item.price,
        ]
      );
    }
    return orderId;
  }

  // Thêm hàm này để lấy lịch sử đơn hàng của user
  static async findByUserId(userId) {
    // Lấy danh sách đơn hàng của user
    const [orders] = await pool.execute(
      `SELECT o.id, o.total_amount, o.status_id, os.name AS status_name,
              o.delivery_address, o.notes, o.payment_method_id, pm.name AS payment_method_name,
              o.created_at, o.customer_name, o.customer_phone
       FROM orders o
       LEFT JOIN order_status os ON o.status_id = os.id
       LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Lấy items cho từng đơn hàng
    for (const order of orders) {
      const [items] = await pool.execute(
        'SELECT oi.id, oi.product_id, p.name as productName, oi.price, oi.quantity, oi.size, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
        [order.id]
      );
      order.items = items;
      order.status = order.status_name || DEFAULT_STATUS;
      order.paymentMethod = order.payment_method_name || DEFAULT_PAYMENT_METHOD;
      order.date = order.created_at;
      order.address = order.delivery_address;
      order.note = order.notes;
      order.totalAmount = order.total_amount;
      order.customerName = order.customer_name;
      order.customerPhone = order.customer_phone;
    }

    return orders;
  }

  static async findById(orderId) {
    const [orders] = await pool.execute(
      `SELECT o.id, o.user_id, o.total_amount, o.status_id, os.name AS status_name,
              o.delivery_address, o.notes, o.payment_method_id, pm.name AS payment_method_name,
              o.created_at, o.customer_name, o.customer_phone
       FROM orders o
       LEFT JOIN order_status os ON o.status_id = os.id
       LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
       WHERE o.id = ?
       LIMIT 1`,
      [orderId]
    );

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];
    order.status = order.status_name || DEFAULT_STATUS;
    order.paymentMethod = order.payment_method_name || DEFAULT_PAYMENT_METHOD;
    order.customerName = order.customer_name;
    order.customerPhone = order.customer_phone;
    return order;
  }

  static async updateStatus(orderId, status) {
    const statusId = await resolveStatusId(status);
    await pool.execute(
      'UPDATE orders SET status_id = ? WHERE id = ?',
      [statusId, orderId]
    );
  }

  static async confirmUserTransfer(orderId) {
    await pool.execute(
      'UPDATE orders SET user_confirmed_transfer = TRUE, user_confirmed_transfer_at = NOW() WHERE id = ?',
      [orderId]
    );
  }
}

module.exports = Order;