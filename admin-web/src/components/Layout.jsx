import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  FolderTree,
  Image as ImageIcon,
  LogOut 
} from 'lucide-react'
import './Layout.css'

const Layout = () => {
  const { logout, user, isSuperAdmin } = useAuth()
  const location = useLocation()

  const isAdmin = user?.role === 'admin' || isSuperAdmin

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Sản phẩm' },
    { path: '/categories', icon: FolderTree, label: 'Danh mục' },
    { path: '/banners', icon: ImageIcon, label: 'Banner' },
    { path: '/orders', icon: ShoppingCart, label: 'Đơn hàng' },
    { path: '/admins', icon: Users, label: 'Quản trị viên', adminOnly: true },
    { path: '/users', icon: Users, label: 'Khách hàng', restricted: true }
  ]

  const visibleMenu = menuItems.filter(item => {
    if (item.restricted && !isSuperAdmin) return false
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Meeple Coffee</h1>
          <p>Admin Panel</p>
        </div>
        <nav className="sidebar-nav">
          {visibleMenu.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          {user && (
            <div className="user-meta">
              <p className="user-email">{user.email}</p>
              <span className={`role-badge ${isSuperAdmin ? 'super' : ''}`}>
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          )}
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout


