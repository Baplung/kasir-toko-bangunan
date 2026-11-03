import { Navigate, Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppLayout() {
  const { user, logout } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  const navItems = [
    { to: '/pos', label: 'Kasir', icon: '🛒', roles: ['admin', 'kasir'] },
    { to: '/products', label: 'Produk & Stok', icon: '📦', roles: ['admin'] },
    { to: '/stock-in', label: 'Stok Masuk', icon: '📥', roles: ['admin'] },
    { to: '/expenses', label: 'Pengeluaran', icon: '💸', roles: ['admin'] },
    { to: '/history', label: 'Riwayat & Laporan', icon: '📊', roles: ['admin', 'kasir'] },
    { to: '/data', label: 'Data & Cadangan', icon: '💾', roles: ['admin'] },
    { to: '/settings', label: 'Pengaturan', icon: '⚙️', roles: ['admin'] },
  ]

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col shrink-0">
        {/* Store name */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm">TB</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-tight">Toko Bangunan</h2>
              <span className="text-xs text-slate-400">Mode Offline</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
