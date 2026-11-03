import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { seedDatabase } from './db/seed'
import { db } from './db/database'
import LoginPage from './pages/LoginPage'
import InitialSetupPage from './pages/InitialSetupPage'
import AppLayout from './components/AppLayout'
import ProductsPage from './pages/ProductsPage'
import PosPage from './features/pos/PosPage'
import StockInPage from './features/stock/StockInPage'
import ExpensesPage from './features/expenses/ExpensesPage'
import ReportsPage from './features/reports/ReportsPage'
import BackupPage from './features/backup/BackupPage'
import SettingsPage from './features/settings/SettingsPage'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/pos" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/pos" replace /> : <LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/pos" element={<PosPage />} />
        <Route path="/products" element={<ProtectedRoute adminOnly><ProductsPage /></ProtectedRoute>} />
        <Route path="/stock-in" element={<ProtectedRoute adminOnly><StockInPage /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute adminOnly><ExpensesPage /></ProtectedRoute>} />
        <Route path="/history" element={<ReportsPage />} />
        <Route path="/data" element={<ProtectedRoute adminOnly><BackupPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/pos' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [needsInitialSetup, setNeedsInitialSetup] = useState(false)

  useEffect(() => {
    seedDatabase()
      .then(() => db.users.count())
      .then((userCount) => {
        setNeedsInitialSetup(userCount === 0)
        setReady(true)
      })
  }, [])

  const completeInitialSetup = () => setNeedsInitialSetup(false)

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500">Memuat...</p>
      </div>
    )
  }

  return (
    <HashRouter>
      <AuthProvider>
        {needsInitialSetup ? <InitialSetupPage onComplete={completeInitialSetup} /> : <AppRoutes />}
      </AuthProvider>
    </HashRouter>
  )
}
