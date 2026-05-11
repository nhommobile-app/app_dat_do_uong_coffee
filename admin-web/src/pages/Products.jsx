import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import './Products.css'

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fullDescription: '',
    price: '',
    categoryId: '',
    sizes: [{ size: 'S', priceModifier: 0 }]
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formError, setFormError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await api.get('/admin/products')
      setProducts(response.data)
    } catch (error) {
      console.error('Lỗi lấy sản phẩm:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Try admin endpoint first, fallback to public endpoint
      try {
        const response = await api.get('/admin/categories')
        setCategories(response.data)
      } catch {
        const response = await api.get('/products/categories')
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const formDataToSend = new FormData()
    formDataToSend.append('name', formData.name)
    formDataToSend.append('description', formData.description)
    formDataToSend.append('fullDescription', formData.fullDescription)
    formDataToSend.append('price', formData.price)
    formDataToSend.append('categoryId', formData.categoryId)
    formDataToSend.append('sizes', JSON.stringify(formData.sizes))
    
    if (imageFile) {
      formDataToSend.append('image', imageFile)
    }

    try {
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/admin/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      
      setShowModal(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error('Lỗi lưu sản phẩm:', error)
      const apiMessage = error.response?.data?.message
      setFormError(apiMessage || 'Không thể lưu sản phẩm. Vui lòng thử lại sau.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return
    
    try {
      await api.delete(`/admin/products/${id}`)
      fetchProducts()
    } catch (error) {
      console.error('Lỗi xóa sản phẩm:', error)
      alert('Lỗi xóa sản phẩm')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      fullDescription: product.full_description || product.fullDescription || '',
      price: product.price,
      categoryId: product.category_id,
      sizes: product.sizes || [{ size: 'S', priceModifier: 0 }]
    })
    setImagePreview(getImageUrl(product.image))
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      fullDescription: '',
      price: '',
      categoryId: '',
      sizes: [{ size: 'S', priceModifier: 0 }]
    })
    setImageFile(null)
    setImagePreview(null)
    setEditingProduct(null)
    setFormError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!allowedImageTypes.includes(file.type)) {
      setFormError('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)')
      setImageFile(null)
      setImagePreview(null)
      e.target.value = ''
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  // Group products by category
  const productsByCategory = products.reduce((acc, product) => {
    const categoryName = product.category_name || 'Chưa phân loại'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(product)
    return acc
  }, {})

  // Flatten products for pagination
  const allProducts = Object.entries(productsByCategory).flatMap(([categoryName, categoryProducts]) =>
    categoryProducts.map(product => ({ ...product, categoryName }))
  )

  // Phân trang
  const totalItems = allProducts.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = allProducts.slice(startIndex, endIndex)

  // Group paginated products by category
  const paginatedProductsByCategory = paginatedProducts.reduce((acc, product) => {
    const categoryName = product.categoryName || 'Chưa phân loại'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(product)
    return acc
  }, {})

  // Reset về trang 1 khi thay đổi itemsPerPage
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value))
  }

const getImageUrl = (image) => {
  if (!image) return ''

  const rawImage = String(image).trim()

  // Nếu là link ngoài internet như Unsplash, Pexels thì giữ nguyên
  if (
    rawImage.startsWith('http') &&
    !rawImage.includes('/uploads/')
  ) {
    return rawImage
  }

  const imageName = rawImage.includes('/uploads/')
    ? rawImage.split('/uploads/').pop()
    : rawImage

  const cleanImage = imageName
    .replace(/^uploads[\\/]/, '')
    .replace(/^\/+/, '')

  return `http://${window.location.hostname}:3000/uploads/${encodeURI(cleanImage)}`
}

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý sản phẩm</h1>
        <button onClick={() => { resetForm(); setShowModal(true) }} className="btn-primary">
          <Plus size={20} />
          Thêm sản phẩm
        </button>
      </div>

      {Object.keys(paginatedProductsByCategory).length === 0 ? (
        <div className="empty-state">
          <p>Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!</p>
        </div>
      ) : (
        Object.entries(paginatedProductsByCategory).map(([categoryName, categoryProducts]) => (
          <div key={categoryName} className="category-section">
            <h2 className="category-title">{categoryName}</h2>
            <div className="products-grid">
              {categoryProducts.map(product => (
                <div key={product.id} className="product-card">
                  <img
                      src={getImageUrl(product.image)}
                       alt={product.name}
                      className="product-image"/>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">{formatPrice(product.price)}</p>
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="product-sizes">
                        <p className="sizes-label">Kích thước:</p>
                        <div className="sizes-list">
                          {product.sizes.map((size, idx) => {
                            const finalPrice = parseFloat(product.price) + (parseFloat(size.priceModifier) || 0)
                            return (
                              <span key={idx} className="size-item">
                                {size.size}: {formatPrice(finalPrice)}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="product-actions">
                    <button onClick={() => handleEdit(product)} className="btn-edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="btn-delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="close-btn">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              {formError && <div className="form-alert error">{formError}</div>}
              <div className="form-group">
                <label>Tên sản phẩm *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả ngắn *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mô tả đầy đủ</label>
                <textarea
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Giá * (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="Nhập giá sản phẩm"
                  />
                  {formData.price && (
                    <span className="price-display">
                      {formatPrice(parseFloat(formData.price) || 0)}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label>Danh mục *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Hình ảnh</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                )}
              </div>
              <div className="form-group">
                <label>Sizes (Kích thước và giá)</label>
                <div className="sizes-container">
                  {formData.sizes.map((size, index) => (
                    <div key={index} className="size-input-row">
                      <div>
                        <select
                          value={size.size}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes]
                            newSizes[index].size = e.target.value
                            setFormData({ ...formData, sizes: newSizes })
                          }}
                          className="size-select"
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Giá thêm/bớt (VNĐ)"
                          value={size.priceModifier}
                          onChange={(e) => {
                            const newSizes = [...formData.sizes]
                            newSizes[index].priceModifier = parseFloat(e.target.value) || 0
                            setFormData({ ...formData, sizes: newSizes })
                          }}
                          className="price-modifier-input"
                        />
                        {formData.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSizes = formData.sizes.filter((_, i) => i !== index)
                              setFormData({ ...formData, sizes: newSizes })
                            }}
                            className="btn-remove-size"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      <div className="size-price-info">
                        <span className="price-modifier-display">
                          {size.priceModifier !== 0 
                            ? `Giá thêm/bớt: ${size.priceModifier > 0 ? '+' : ''}${formatPrice(size.priceModifier)}` 
                            : 'Không đổi giá'}
                        </span>
                        {formData.price && (
                          <span className="final-price-display">
                            → Giá cuối: <strong>{formatPrice(parseFloat(formData.price) + (parseFloat(size.priceModifier) || 0))}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        sizes: [...formData.sizes, { size: 'S', priceModifier: 0 }]
                      })
                    }}
                    className="btn-add-size"
                  >
                    + Thêm size
                  </button>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products


