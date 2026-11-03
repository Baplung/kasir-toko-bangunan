import { describe, expect, it } from 'vitest'
import { validateWorkbookRows, type WorkbookRows } from './xlsx'

const base: WorkbookRows = {
  products: [{ Kode: 'SMN1', Nama: 'Semen', Kategori: 'Semen', Satuan: 'sak', Harga: 68000, Stok: 5, Aktif: true }],
  transactions: [{ ID: 'TRX1', Waktu: '2026-11-01T10:00:00.000Z', Total: 68000, Dibayar: 70000, Kembalian: 2000, UserID: 1, Items: '[]' }],
  stockMovements: [], expenses: [], settings: [],
}

describe('validasi workbook XLSX', () => {
  it('menerima sheet wajib dengan kolom valid', () => {
    expect(validateWorkbookRows(base).errors).toEqual([])
  })
  it('menolak kode produk duplikat di file impor', () => {
    expect(validateWorkbookRows({ ...base, products: [...base.products, base.products[0]] }).errors).toContain('Kode produk SMN1 terduplikasi dalam file.')
  })
  it('menolak produk tanpa kode atau harga/stok negatif', () => {
    const bad = { ...base, products: [{ ...base.products[0], Kode: '', Harga: -1, Stok: -2 }] }
    expect(validateWorkbookRows(bad).errors.length).toBeGreaterThan(0)
  })
  it('mendeteksi duplikasi ID transaksi dalam file', () => {
    expect(validateWorkbookRows({ ...base, transactions: [...base.transactions, base.transactions[0]] }).errors).toContain('ID transaksi TRX1 terduplikasi dalam file.')
  })
})
