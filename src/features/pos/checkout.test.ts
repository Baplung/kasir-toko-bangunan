import { describe, expect, it } from 'vitest'
import { validateCartStock, calculateCartTotal } from './checkout'
import type { Product, TransactionItem } from '../../db/database'

const product = (stock: number): Product => ({
  id: 1, code: 'SMN001', name: 'Semen 40 kg', category: 'Semen',
  unit: 'sak', price: 68000, stock, active: true,
})
const item = (qty: number): TransactionItem => ({
  productId: 1, code: 'SMN001', name: 'Semen 40 kg', unit: 'sak',
  qty, price: 68000, subtotal: 68000 * qty,
})

describe('validasi stok keranjang', () => {
  it('mengizinkan transaksi saat stok mencukupi', () => {
    expect(validateCartStock([item(2)], [product(2)])).toEqual({ valid: true, errors: [] })
  })
  it('menolak transaksi jika jumlah melebihi stok tersedia', () => {
    expect(validateCartStock([item(3)], [product(2)])).toEqual({
      valid: false,
      errors: ['Semen 40 kg: diminta 3 sak, stok tersedia 2 sak.'],
    })
  })
  it('menghitung total dari subtotal barang', () => {
    expect(calculateCartTotal([item(2), { ...item(1), productId: 2, subtotal: 35000 }])).toBe(171000)
  })
})
