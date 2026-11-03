import { describe, expect, it } from 'vitest'
import { summarizeTransactions, summarizeItems } from './reports'
import type { Transaction } from '../../db/database'

const trx = (id: string, total: number, items: Transaction['items']): Transaction => ({
  id, datetime: new Date('2026-11-01T09:00:00'), items, total, paid: total, change: 0, userId: 1,
})
const item = { productId: 1, code: 'SMN001', name: 'Semen 40 kg', unit: 'sak', qty: 2, price: 68000, subtotal: 136000 }

describe('ringkasan laporan', () => {
  it('menghitung omzet dan jumlah transaksi', () => {
    expect(summarizeTransactions([trx('A', 136000, [item]), trx('B', 50000, [])])).toEqual({ sales: 186000, transactionCount: 2 })
  })
  it('menggabungkan jumlah barang terjual per kode produk', () => {
    expect(summarizeItems([trx('A', 136000, [item]), trx('B', 68000, [{ ...item, qty: 1, subtotal: 68000 }])])).toEqual([{ code: 'SMN001', name: 'Semen 40 kg', unit: 'sak', qty: 3, revenue: 204000 }])
  })
})
