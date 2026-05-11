import { useState, useEffect } from 'react'
import api from '../services/api'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import './Orders.css'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/admin/orders')
      setOrders(response.data)
    } catch (error) {
      console.error('Lỗi lấy đơn hàng:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status })
      fetchOrders()
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error)
      alert('Lỗi cập nhật trạng thái đơn hàng')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      processing: '#4299e1',
      pending: '#ed8936',
      delivered: '#48bb78',
      cancelled: '#c53030'
    }
    return colors[status] || '#718096'
  }

  const getStatusLabel = (status) => {
    const labels = {
      processing: 'Đang xử lý',
      pending: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    }
    return labels[status] || status
  }

  // Sắp xếp theo thời gian tạo (mới nhất trước)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.created_at || 0)
    const dateB = new Date(b.created_at || 0)
    return dateB - dateA
  })

  const filteredOrders = sortedOrders.filter(order => {
    if (!searchTerm.trim()) return true
    const keyword = searchTerm.trim().toLowerCase()
    const fields = [
      order.id,
      order.customer_name,
      `${order.first_name || ''} ${order.last_name || ''}`,
      order.user_email,
      order.customer_phone,
      order.delivery_address,
      order.status_name
    ]
    return fields.some(field => field?.toLowerCase?.().includes(keyword))
  })

  // Phân trang
  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset về trang 1 khi thay đổi itemsPerPage
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value))
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="orders-page">
      <h1 className="page-title">Quản lý đơn hàng</h1>

      <div className="orders-actions">
        <div className="search-box">
          <input
            type="text"
            className="orders-search-input"
            placeholder="Tìm theo mã đơn, khách hàng, email, SĐT, trạng thái..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày đặt</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            )}
            {paginatedOrders.map(order => (
              <tr key={order.id}>
                <td className="order-id">#{String(order.id).slice(0, 8)}</td>

                <td>
                  <div className="customer-info">
                    <p className="customer-name">
                      {order.customer_name || `${order.first_name} ${order.last_name}`}
                    </p>
                    <p className="customer-email">{order.user_email}</p>
                    <p className="customer-phone">{order.customer_phone}</p>
                  </div>
                </td>
                <td>
                  <div className="order-items">
                    {order.items?.slice(0, 2).map(item => (
                      <div key={item.id} className="order-item">
                        <img src={item.image} alt={item.product_name} />
                        <span>{item.product_name} x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items?.length > 2 && (
                      <p className="more-items">+{order.items.length - 2} sản phẩm khác</p>
                    )}
                  </div>
                </td>
                <td className="order-total">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(order.total_amount)}
                </td>
                <td>
                  <select
                    value={order.status_name}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="status-select"
                    style={{ borderColor: getStatusColor(order.status_name) }}
                  >
                    <option value="processing">Đang xử lý</option>
                    <option value="pending">Đang giao</option>
                    <option value="delivered">Đã giao</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="btn-details"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Trang {currentPage} trên tổng số {totalPages} trang ({totalItems} bản ghi)
            </span>
          </div>
          <div className="pagination-controls">
            <div className="items-per-page">
              <label>Hiển thị:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                className="items-per-page-select"
              >
                <option value={10}>10 bản ghi</option>
                <option value={20}>20 bản ghi</option>
                <option value={50}>50 bản ghi</option>
              </select>
            </div>
            <div className="pagination-buttons">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <ChevronLeft size={16} />
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Hiển thị tối đa 5 số trang
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="pagination-ellipsis">...</span>
                }
                return null
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Sau
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn hàng</h2>
              <button onClick={() => setSelectedOrder(null)} className="close-btn">
                <X size={24} />
              </button>
            </div>
            <div className="order-detail-content">
              <div className="detail-section">
                <h3>Thông tin đơn hàng</h3>
                <div className="detail-row">
                  <span className="detail-label">Mã đơn:</span>
                  <span className="detail-value">#{selectedOrder.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Trạng thái:</span>
                  <span className="detail-value" style={{ color: getStatusColor(selectedOrder.status_name) }}>
                    {getStatusLabel(selectedOrder.status_name)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Ngày đặt:</span>
                  <span className="detail-value">
                    {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tổng tiền:</span>
                  <span className="detail-value order-total-large">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(selectedOrder.total_amount)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phương thức thanh toán:</span>
                  <span className="detail-value">{selectedOrder.payment_method_name || 'N/A'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Thông tin khách hàng</h3>
                <div className="detail-row">
                  <span className="detail-label">Họ tên:</span>
                  <span className="detail-value">
                    {selectedOrder.customer_name || `${selectedOrder.first_name} ${selectedOrder.last_name}`}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedOrder.user_email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Số điện thoại:</span>
                  <span className="detail-value">{selectedOrder.customer_phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Địa chỉ giao hàng:</span>
                  <span className="detail-value">{selectedOrder.delivery_address}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Sản phẩm</h3>
                <div className="order-items-list">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="order-item-detail">
                      <img src={item.image} alt={item.product_name} />
                      <div className="item-info">
                        <h4>{item.product_name}</h4>
                        <p>Size: {item.size} | Số lượng: {item.quantity}</p>
                        <p className="item-price">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                          }).format(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="detail-section">
                  <h3>Ghi chú</h3>
                  <p className="order-notes">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders


