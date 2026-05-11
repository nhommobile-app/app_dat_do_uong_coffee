import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()
const ADMIN_ROLES = ['admin', 'super_admin', 'employee']

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    const storedUser = localStorage.getItem('adminUser')

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser({ ...parsedUser, token })
      } catch (error) {
        console.error('Không thể parse adminUser từ localStorage', error)
        localStorage.removeItem('adminUser')
      }
    }

    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/admin/login', { email, password })
      const { token, user } = response.data

      if (!user || !ADMIN_ROLES.includes(user.role)) {
        throw new Error('Bạn không có quyền truy cập admin panel')
      }

      localStorage.setItem('adminToken', token)
      localStorage.setItem('adminUser', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser({ ...user, token })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Đăng nhập thất bại'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

