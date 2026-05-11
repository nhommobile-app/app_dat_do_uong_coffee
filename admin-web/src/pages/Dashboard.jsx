import { useState, useEffect } from 'react'
import api from '../services/api'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  TrendingUp 
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import './Dashboard.css'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats')
      console.log('Dashboard stats response:', response.data)
      setStats(response.data)
    } catch (error) {
      console.error('Lỗi lấy thống kê:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  if (!stats) {
    return (
      <div className="error">
        <h2>Không thể tải dữ liệu</h2>
        <p>Vui lòng kiểm tra kết nối hoặc thử lại sau.</p>
        <button onClick={fetchStats} style={{ marginTop: '16px', padding: '8px 16px' }}>
          Thử lại
        </button>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Tổng khách hàng',
      value: stats.stats.totalUsers,
      icon: Users,
      color: '#4299e1'
    },
    {
      title: 'Tổng sản phẩm',
      value: stats.stats.totalProducts,
      icon: Package,
      color: '#48bb78'
    },
    {
      title: 'Tổng đơn hàng',
      value: stats.stats.totalOrders,
      icon: ShoppingCart,
      color: '#ed8936'
    },
    {
      title: 'Tổng doanh thu',
      value: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(stats.stats.totalRevenue),
      icon: DollarSign,
      color: '#9f7aea'
    }
  ]

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-title">{stat.title}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2>Đơn hàng theo trạng thái</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.ordersByStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#C87D55" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Doanh thu theo tháng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#C87D55" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="top-products">
        <h2>Top 5 sản phẩm bán chạy</h2>
        <div className="products-list">
          {stats.topProducts.map((product, index) => (
            <div key={product.id} className="product-item">
              <div className="product-rank">#{index + 1}</div>
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-info">
                <h3>{product.name}</h3>
                <p>Đã bán: {product.total_sold} sản phẩm</p>
              </div>
              <div className="product-revenue">
                <TrendingUp size={16} />
                <span>{new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(product.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard





