import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { db, type User } from '../db/database'
import bcrypt from 'bcryptjs'
import { isSessionExpired } from './session'

interface AuthContextType {
  user: User | null
  login: (username: string, pin: string) => Promise<boolean>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Check saved session
  useEffect(() => {
    const savedUserId = localStorage.getItem('currentUserId')
    const savedAt = Number(localStorage.getItem('currentUserAt'))
    if (!savedUserId || isSessionExpired(savedAt)) {
      localStorage.removeItem('currentUserId')
      localStorage.removeItem('currentUserAt')
      return
    }
    db.users.get(Number(savedUserId)).then((u) => {
      if (u && u.active) setUser(u)
      else {
        localStorage.removeItem('currentUserId')
        localStorage.removeItem('currentUserAt')
      }
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const timestamp = Number(localStorage.getItem('currentUserAt'))
      if (localStorage.getItem('currentUserId') && isSessionExpired(timestamp)) {
        setUser(null)
        localStorage.removeItem('currentUserId')
        localStorage.removeItem('currentUserAt')
      }
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const login = async (username: string, pin: string): Promise<boolean> => {
    const found = await db.users.where('username').equals(username).first()
    if (!found || !found.active) return false
    const match = bcrypt.compareSync(pin, found.pin_hash)
    if (!match) return false
    setUser(found)
    localStorage.setItem('currentUserId', String(found.id))
    localStorage.setItem('currentUserAt', String(Date.now()))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('currentUserId')
    localStorage.removeItem('currentUserAt')
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
