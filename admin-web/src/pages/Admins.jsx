import { useEffect, useState } from 'react'
import { Trash2, PlusCircle, Search, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import './Admins.css'

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  address: '',
  role: 'employee'
}

const Admins = () => {
  const { user, isSuperAdmin, loading: authLoading } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState(initialFormState)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Chỉ super_admin và admin mới thấy button và có quyền chỉnh sửa/xóa
  const canManage = isSuperAdmin || user?.role === 'admin'
  const canCreate = canManage

  useEffect(() => {
    if (authLoading) return
    fetchAdmins()
  }, [authLoading])

  const fetchAdmins = async () => {
    setLoading(true)
    try {
      const response = await api.get('/admin/admins')
      setAdmins(response.data)
    } catch (error) {
      console.error('Lỗi lấy admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setFormError('')
    setFormSuccess('')
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (admin) => {
    setEditingAdmin(admin)
    setFormData({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      email: admin.email || '',
      password: '',
      confirmPassword: '',
      phone: admin.phone || '',
      address: admin.address || '',
      role: admin.role || 'employee'
    })
    setFormError('')
    setFormSuccess('')
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingAdmin(null)
    resetForm()
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user types
    if (formError) setFormError('')
  }

  const validateForm = (isEdit = false) => {
    if (!formData.firstName.trim()) {
      setFormError('Họ là bắt buộc')
      return false
    }
    if (!formData.lastName.trim()) {
      setFormError('Tên là bắt buộc')
      return false
    }
    if (!isEdit) {
      // Khi thêm mới, email bắt buộc
      if (!formData.email.trim()) {
        setFormError('Email là bắt buộc')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setFormError('Email không hợp lệ')
        return false
      }
    }
    if (!formData.phone.trim()) {
      setFormError('Số điện thoại là bắt buộc')
      return false
    }
    if (!formData.address.trim()) {
      setFormError('Địa chỉ là bắt buộc')
      return false
    }
    if (!isEdit) {
      // Khi thêm mới, mật khẩu bắt buộc
      if (!formData.password) {
        setFormError('Mật khẩu là bắt buộc')
        return false
      }
      if (formData.password.length < 6) {
        setFormError('Mật khẩu phải có ít nhất 6 ký tự')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Mật khẩu xác nhận không khớp')
        return false
      }
    } else {
      // Khi chỉnh sửa, nếu có mật khẩu thì phải xác nhận
      if (formData.password || formData.confirmPassword) {
        if (formData.password.length < 6) {
          setFormError('Mật khẩu phải có ít nhất 6 ký tự')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setFormError('Mật khẩu xác nhận không khớp')
          return false
        }
      }
    }
    return true
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (!canCreate) return

    if (!validateForm(false)) return

    setFormError('')
    setFormSuccess('')
    setCreating(true)

    try {
      const { confirmPassword, ...dataToSend } = formData
      await api.post('/admin/admins', dataToSend)
      setFormSuccess('Tạo tài khoản quản trị viên thành công')
      setTimeout(() => {
        closeModals()
        fetchAdmins()
      }, 1500)
    } catch (error) {
      console.error('Lỗi tạo admin:', error)
      setFormError(error.response?.data?.message || 'Không thể tạo quản trị viên. Vui lòng thử lại.')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateAdmin = async (e) => {
    e.preventDefault()
    if (!canManage || !editingAdmin) return

    if (!validateForm(true)) return

    setFormError('')
    setFormSuccess('')
    setUpdating(true)

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        role: formData.role
      }

      // Chỉ superadmin mới có thể đổi mật khẩu
      if (isSuperAdmin && formData.password) {
        updateData.password = formData.password
      }

      await api.put(`/admin/admins/${editingAdmin.id}`, updateData)
      setFormSuccess('Cập nhật thông tin quản trị viên thành công')
      setTimeout(() => {
        closeModals()
        fetchAdmins()
      }, 1500)
    } catch (error) {
      console.error('Lỗi cập nhật admin:', error)
      setFormError(error.response?.data?.message || 'Không thể cập nhật quản trị viên. Vui lòng thử lại.')
    } finally {
      setUpdating(false)
    }
  }

  const deleteAdmin = async (adminId, role) => {
    if (!canManage || role === 'super_admin') return
    if (!confirm('Bạn có chắc muốn xóa quản trị viên này?')) return

    try {
      await api.delete(`/admin/admins/${adminId}`)
      fetchAdmins()
    } catch (error) {
      console.error('Lỗi xóa admin:', error)
      alert(error.response?.data?.message || 'Lỗi xóa quản trị viên')
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

  const getRoleLabel = (role) => {
    const labels = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'employee': 'Nhân viên'
    }
    return labels[role] || role
  }

  const getRoleClass = (role) => {
    const classes = {
      'super_admin': 'super-admin',
      'admin': 'admin',
      'employee': 'employee'
    }
    return classes[role] || ''
  }

  // Sắp xếp theo thời gian tạo (mới nhất trước)
  const sortedAdmins = [...admins].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0)
    const dateB = new Date(b.createdAt || 0)
    return dateB - dateA
  })

  const filteredAdmins = sortedAdmins.filter(admin => {
    const matchesSearch = 
      admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  // Phân trang
  const totalItems = filteredAdmins.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex)

  // Reset về trang 1 khi thay đổi itemsPerPage, searchTerm hoặc roleFilter
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage, searchTerm, roleFilter])

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

  return (
    <div className="admins-page">
      <div className="admins-header">
        <div>
          <h1 className="page-title">Quản lý quản trị viên</h1>
          <p>Danh sách tất cả quản trị viên trong hệ thống.</p>
        </div>
        {canCreate && (
          <button 
            className="btn-primary"
            onClick={openCreateModal}
          >
            <PlusCircle size={20} />
            <span>Thêm mới quản trị viên</span>
          </button>
        )}
      </div>

      {/* Modal Thêm mới */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo tài khoản quản trị viên mới</h2>
              <button className="modal-close" onClick={closeModals}>
                <X size={24} />
              </button>
            </div>
            {formError && <div className="form-alert error">{formError}</div>}
            {formSuccess && <div className="form-alert success">{formSuccess}</div>}
            <form className="modal-form" onSubmit={handleCreateAdmin}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    required
                    placeholder="Nhập họ quản trị viên"
                  />
                </div>
                <div className="form-group">
                  <label>Tên *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    required
                    placeholder="Nhập tên quản trị viên"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    required
                    placeholder="Nhập email quản trị viên"
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    required
                    placeholder="Nhập mật khẩu"
                  />
                </div>
                <div className="form-group">
                  <label>Xác nhận mật khẩu *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                    required
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    required
                    className="role-select"
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="admin">Admin</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="form-group">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    required
                    placeholder="Nhập địa chỉ liên hệ"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeModals} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Đang tạo...' : 'Tạo quản trị viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa */}
      {showEditModal && editingAdmin && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa thông tin quản trị viên</h2>
              <button className="modal-close" onClick={closeModals}>
                <X size={24} />
              </button>
            </div>
            {formError && <div className="form-alert error">{formError}</div>}
            {formSuccess && <div className="form-alert success">{formSuccess}</div>}
            <form className="modal-form" onSubmit={handleUpdateAdmin}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Họ *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    required
                    placeholder="CHAU"
                  />
                </div>
                <div className="form-group">
                  <label>Tên *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    required
                    placeholder="DIEU"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="disabled-input"
                    placeholder="admin@Meeple Coffee.com"
                  />
                  <small style={{ color: '#718096', fontSize: '12px' }}>Email không thể thay đổi</small>
                </div>
                {isSuperAdmin && (
                  <>
                    <div className="form-group">
                      <label>Mật khẩu mới (để trống nếu không đổi)</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleFormChange('password', e.target.value)}
                        placeholder="Nhập mật khẩu (nếu thay đổi)"
                      />
                    </div>
                    <div className="form-group">
                      <label>Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                      />
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label>Vai trò *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    required
                    className="role-select"
                    disabled={editingAdmin.role === 'super_admin'}
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="admin">Admin</option>
                    {isSuperAdmin && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                    required
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="form-group">
                  <label>Địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    required
                    placeholder="Nhập địa chỉ liên hệ"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeModals} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="admins-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <label>Lọc theo vai trò:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="employee">Nhân viên</option>
          </select>
        </div>
      </div>

      <div className="admins-table-container">
        <table className="admins-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              {canManage && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedAdmins.length === 0 && (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="empty-state">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Không tìm thấy quản trị viên nào.' 
                    : 'Chưa có quản trị viên nào.'}
                </td>
              </tr>
            )}
            {paginatedAdmins.map((admin, index) => {
              const isRowSuperAdmin = admin.role === 'super_admin'
              const canEditRow = canManage && !isRowSuperAdmin
              const displayIndex = startIndex + index + 1

              return (
                <tr key={admin.id}>
                  <td className="admin-id">{displayIndex}</td>
                  <td className="admin-name">{admin.firstName} {admin.lastName}</td>
                  <td className="admin-email">{admin.email}</td>
                  <td>{admin.phone || '-'}</td>
                  <td className="admin-address">{admin.address || '-'}</td>
                  <td>
                    <span className={`role-badge ${getRoleClass(admin.role)}`}>
                      {getRoleLabel(admin.role)}
                    </span>
                  </td>
                  <td>{formatDate(admin.createdAt)}</td>
                  {canManage && (
                    <td>
                      <div className="action-buttons">
                        {canEditRow && (
                          <button
                            onClick={() => openEditModal(admin)}
                            className="btn-edit"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {canEditRow && (
                          <button
                            onClick={() => deleteAdmin(admin.id, admin.role)}
                            className="btn-delete"
                            title="Xóa quản trị viên"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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

export default Admins
