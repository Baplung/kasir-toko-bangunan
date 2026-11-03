import { describe, expect, it } from 'vitest'
import { calculateStockAfterReceiving, validateReceiving } from './stockIn'

describe('penerimaan stok', () => {
  it('menambahkan jumlah barang diterima ke stok saat ini', () => {
    expect(calculateStockAfterReceiving(8, 5)).toBe(13)
  })
  it('menolak jumlah penerimaan nol atau negatif', () => {
    expect(validateReceiving(0)).toBe('Jumlah harus lebih dari 0.')
    expect(validateReceiving(-2)).toBe('Jumlah harus lebih dari 0.')
  })
  it('mengizinkan jumlah penerimaan positif', () => {
    expect(validateReceiving(2)).toBe('')
  })
})
