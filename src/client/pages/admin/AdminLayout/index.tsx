import { NavLink, Outlet, Link } from 'react-router-dom'
import { FiGrid, FiUsers, FiPackage, FiShoppingBag, FiBarChart2 } from 'react-icons/fi'
import { useAdminStats } from '../../../hooks/useAdmin.js'
import Logo from '../../../components/ui/Logo/index.js'

export default function AdminLayout() {
  const { data: statsRes } = useAdminStats()
  const stats = statsRes?.data

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="sm" theme="dark" />
          </Link>
          <p className="admin-sidebar__role">Admin Panel</p>
        </div>

        <nav className="admin-nav-section">
          <div className="admin-nav-label">Overview</div>
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <FiGrid size={15} /> Dashboard
          </NavLink>
        </nav>

        <nav className="admin-nav-section">
          <div className="admin-nav-label">Manage</div>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <FiUsers size={15} /> Users
            {stats && <span className="admin-nav-badge">{stats.users.total}</span>}
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <FiPackage size={15} /> Products
            {stats && stats.products.pending > 0 && (
              <span className="admin-nav-badge">{stats.products.pending}</span>
            )}
          </NavLink>
          <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
            <FiShoppingBag size={15} /> Orders
            {stats && <span className="admin-nav-badge">{stats.orders.total}</span>}
          </NavLink>
        </nav>
      </aside>

      {/* Page content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
