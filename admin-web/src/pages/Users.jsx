import { useEffect, useState } from 'react'
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Users.css'

const Users = () => {
  const { isSuperAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    if (authLoading) return

    if (!isSuperAdmin) {
      setLoading(false)
      setAccessDenied(true)
      return
    }

    fetchUsers()
  }, [authLoading, isSuperAdmin])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/users')
      console.log('Full API response:', response)
      console.log('Response data:', response.data)
      console.log('Response data type:', typeof response.data)
      console.log('Is array?', Array.isArray(response.data))
      
      if (response.data && response.data.length > 0) {
        console.log('First user sample:', response.data[0])
        console.log('First user email:', response.data[0].email)
        console.log('First user keys:', Object.keys(response.data[0]))
        console.log('First user JSON:', JSON.stringify(response.data[0], null, 2))
      }
      
      // Đảm bảo response.data là array và map lại để đảm bảo email có
      let usersData = Array.isArray(response.data) ? response.data : []
      
      // Normalize data để đảm bảo email luôn có
      usersData = usersData.map(user => ({
        ...user,
        email: user.email || user.Email || '',
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        phone: user.phone || '',
        address: user.address || '',
        createdAt: user.createdAt || user.created_at || ''
      }))
      
      console.log('Normalized usersData:', usersData)
      if (usersData.length > 0) {
        console.log('First normalized user:', usersData[0])
        console.log('First normalized user email:', usersData[0].email)
      }
      
      setUsers(usersData)
      setAccessDenied(false)
    } catch (error) {
      console.error('Lỗi lấy users:', error)
      console.error('Error response:', error.response)
      if (error.response?.status === 403) {
        setAccessDenied(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    if (!isSuperAdmin) return
    if (!confirm('Bạn có chắc muốn xóa khách hàng này?')) return
    
    try {
      await api.delete(`/admin/users/${userId}`)
      fetchUsers()
    } catch (error) {
      console.error('Lỗi xóa user:', error)
      alert(error.response?.data?.message || 'Lỗi xóa người dùng')
    }
  }

  const formatDate = (value) => {
    if (!value) return '-'
    try {
      return new Date(value).toLocaleDateString('vi-VN')
    } catch {
      return '-'
    }
  }

  // Sắp xếp theo thời gian tạo (mới nhất trước)
  const sortedUsers = [...users].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0)
    const dateB = new Date(b.createdAt || 0)
    return dateB - dateA
  })

  const filteredUsers = sortedUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    )
  })

  // Phân trang
  const totalItems = filteredUsers.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset về trang 1 khi thay đổi itemsPerPage hoặc searchTerm
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, searchTerm])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value))
  }

  if (authLoading || loading) {
    return <div className="loading">Đang tải...</div>
  }

  if (!isSuperAdmin || accessDenied) {
    return (
      <div className="users-page">
        <h1 className="page-title">Quản lý khách hàng</h1>
        <div className="no-access-card">
          <h2>Không có quyền truy cập</h2>
          <p>Chỉ tài khoản Super Admin mới có thể quản lý khách hàng.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1 className="page-title">Quản lý khách hàng</h1>
          <p>Danh sách tất cả khách hàng đã đăng ký trong hệ thống.</p>
        </div>
      </div>

      <div className="users-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="7" className="empty-state">
                  {searchTerm ? 'Không tìm thấy khách hàng nào.' : 'Chưa có khách hàng nào.'}
                </td>
              </tr>
            )}
            {paginatedUsers.map((user, index) => {
              // Đảm bảo email được lấy đúng
              const userEmail = user?.email || user?.Email || ''
              const displayIndex = startIndex + index + 1
              
              return (
              <tr key={user.id}>
                  <td className="user-id">{displayIndex}</td>
                <td className="user-name">{user.firstName} {user.lastName}</td>
                  <td className="user-email" style={{ color: userEmail ? '#4299e1' : '#718096' }}>
                    {userEmail || '(Không có email)'}
                  </td>
                <td>{user.phone || '-'}</td>
                <td className="user-address">{user.address || '-'}</td>
                  <td>{formatDate(user.createdAt)}</td>
                <td>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="btn-delete"
                      title="Xóa khách hàng"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
              )
            })}
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
    </div>
  )
}

export default Users
