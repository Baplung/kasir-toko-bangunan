// Database definition using Dexie (IndexedDB wrapper)
import Dexie, { type Table } from 'dexie'

export interface User {
  id?: number
  username: string
  pin_hash: string
  role: 'admin' | 'kasir'
  active: boolean
}

export interface Product {
  id?: number
  code: string
  name: string
  category: string
  unit: string
  price: number
  stock: number
  active: boolean
}

export interface TransactionItem {
  productId: number
  code: string
  name: string
  unit: string
  qty: number
  price: number
  subtotal: number
}

export interface Transaction {
  id?: string
  datetime: Date
  items: TransactionItem[]
  total: number
  paid: number
  change: number
  userId: number
}

export interface StockMovement {
  id?: number
  productId: number
  type: 'sale' | 'incoming' | 'adjustment'
  qty: number
  reason: string
  datetime: Date
  userId: number
}

export interface Expense {
  id?: number
  datetime: Date
  category: string
  description: string
  amount: number
  paymentMethod: string
  userId: number
}

export interface StoreSetting {
  id?: number
  key: string
  value: string
}

class AppDatabase extends Dexie {
  users!: Table<User>
  products!: Table<Product>
  transactions!: Table<Transaction>
  stockMovements!: Table<StockMovement>
  expenses!: Table<Expense>
  storeSettings!: Table<StoreSetting>

  constructor() {
    super('KasirTokoBangunan')
    this.version(1).stores({
      users: '++id, username, role, active',
      products: '++id, code, name, category, active',
      transactions: 'id, datetime, userId',
      stockMovements: '++id, productId, type, datetime',
      expenses: '++id, datetime, category, userId',
      storeSettings: '++id, key',
    })
  }
}

export const db = new AppDatabase()
