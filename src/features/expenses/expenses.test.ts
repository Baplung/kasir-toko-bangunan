import { describe, expect, it } from 'vitest'
import { validateExpense, sumExpenses } from './expenses'
import type { Expense } from '../../db/database'

const expense = (amount: number): Expense => ({
  id: 1, datetime: new Date('2026-11-01T09:00:00'), category: 'Listrik',
  description: 'Tagihan toko', amount, paymentMethod: 'Tunai', userId: 1,
})

describe('validasi dan ringkasan pengeluaran', () => {
  it('menerima catatan pengeluaran dengan nominal positif dan kategori', () => {
    expect(validateExpense({ category: 'Listrik', description: 'Token listrik', amount: 100000 })).toBe('')
  })
  it('menolak nominal nol atau negatif', () => {
    expect(validateExpense({ category: 'Listrik', description: 'Token listrik', amount: 0 })).toBe('Nominal harus lebih dari 0.')
  })
  it('menolak keterangan kosong', () => {
    expect(validateExpense({ category: 'Listrik', description: '  ', amount: 1000 })).toBe('Keterangan wajib diisi.')
  })
  it('menjumlahkan pengeluaran', () => {
    expect(sumExpenses([expense(10000), expense(25000)])).toBe(35000)
  })
})
