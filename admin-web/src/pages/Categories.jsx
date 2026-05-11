import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import './Categories.css'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories')
      setCategories(response.data)
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error)
      alert('Lỗi lấy danh mục')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, formData)
      } else {
        await api.post('/admin/categories', formData)
      }
      
      setShowModal(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error('Lỗi lưu danh mục:', error)
      alert(error.response?.data?.message || 'Lỗi lưu danh mục')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này? Sản phẩm trong danh mục cũng sẽ bị ảnh hưởng.')) return
    
    try {
      await api.delete(`/admin/categories/${id}`)
      fetchCategories()
    } catch (error) {
      console.error('Lỗi xóa danh mục:', error)
      alert(error.response?.data?.message || 'Lỗi xóa danh mục')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
    setEditingCategory(null)
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý danh mục</h1>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary">
          <Plus size={20} />
          Thêm danh mục
        </button>
      </div>

      <div className="categories-grid">
        {categories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-info">
              <h3>{category.name}</h3>
              <p className="category-description">
                {category.description || 'Không có mô tả'}
              </p>
            </div>
            <div className="category-actions">
              <button onClick={() => handleEdit(category)} className="btn-edit">
                <Edit size={16} />
              </button>
              <button onClick={() => handleDelete(category.id)} className="btn-delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm() }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group">
                <label>Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ví dụ: Cà phê máy"
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Mô tả về danh mục này..."
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories

