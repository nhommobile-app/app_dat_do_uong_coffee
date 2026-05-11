import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react'
import './Banners.css'

const Banners = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    linkUrl: '',
    isActive: true,
    displayOrder: 0
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await api.get('/admin/banners')
      setBanners(response.data)
    } catch (error) {
      console.error('Lỗi lấy banners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    if (!imageFile && !editingBanner) {
      setFormError('Vui lòng chọn hình ảnh banner')
      setSubmitting(false)
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('title', formData.title)
    formDataToSend.append('description', formData.description || '')
    formDataToSend.append('linkUrl', formData.linkUrl || '')
    formDataToSend.append('isActive', formData.isActive ? 'true' : 'false')
    formDataToSend.append('displayOrder', formData.displayOrder.toString())
    
    if (imageFile) {
      formDataToSend.append('image', imageFile)
    }

    try {
      if (editingBanner) {
        await api.put(`/admin/banners/${editingBanner.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/admin/banners', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      
      setShowModal(false)
      resetForm()
      fetchBanners()
    } catch (error) {
      console.error('Lỗi lưu banner:', error)
      setFormError(
        error.response?.data?.message || 
        (error.message?.includes('ảnh') ? error.message : 'Lỗi lưu banner. Vui lòng thử lại.')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return
    
    try {
      await api.delete(`/admin/banners/${id}`)
      fetchBanners()
    } catch (error) {
      console.error('Lỗi xóa banner:', error)
      alert(error.response?.data?.message || 'Lỗi xóa banner')
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description || '',
      linkUrl: banner.link_url || '',
      isActive: banner.is_active,
      displayOrder: banner.display_order || 0
    })
    setImagePreview(banner.image)
    setImageFile(null)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      linkUrl: '',
      isActive: true,
      displayOrder: 0
    })
    setImageFile(null)
    setImagePreview(null)
    setEditingBanner(null)
    setFormError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setFormError('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)')
        e.target.value = ''
        return
      }
      setFormError('')
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="banners-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý Banner</h1>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary">
          <Plus size={20} />
          Thêm banner
        </button>
      </div>

      <div className="banners-grid">
        {banners.map(banner => (
          <div key={banner.id} className="banner-card">
            <div className="banner-image-container">
              <img src={banner.image} alt={banner.title} className="banner-image" />
              {!banner.is_active && (
                <div className="banner-inactive-badge">Đã tắt</div>
              )}
            </div>
            <div className="banner-info">
              <h3>{banner.title}</h3>
              {banner.description && (
                <p className="banner-description">{banner.description}</p>
              )}
              <div className="banner-meta">
                <span className={`status-badge ${banner.is_active ? 'active' : 'inactive'}`}>
                  {banner.is_active ? 'Đang hiển thị' : 'Đã tắt'}
                </span>
                <span className="order-badge">Thứ tự: {banner.display_order}</span>
              </div>
            </div>
            <div className="banner-actions">
              <button onClick={() => handleEdit(banner)} className="btn-edit">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(banner.id)} className="btn-delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="empty-state">
            <ImageIcon size={48} color="#ccc" />
            <p>Chưa có banner nào</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm() }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Chỉnh sửa banner' : 'Thêm banner mới'}</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="banner-form">
              {formError && <div className="form-alert error">{formError}</div>}
              
              <div className="form-group">
                <label>Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ví dụ: Khuyến mãi mùa hè"
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Mô tả ngắn về banner"
                />
              </div>

              <div className="form-group">
                <label>Link URL (tùy chọn)</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Đang hiển thị</option>
                    <option value="false">Đã tắt</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Hình ảnh {!editingBanner && '*'}</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  required={!editingBanner}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); resetForm() }} 
                  className="btn-cancel"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : (editingBanner ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Banners

