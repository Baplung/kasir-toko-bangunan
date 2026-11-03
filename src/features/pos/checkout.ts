import type { Product, TransactionItem } from '../../db/database'

export function validateCartStock(items: TransactionItem[], products: Product[]) {
  const errors: string[] = []
  for (const item of items) {
    const product = products.find((candidate) => candidate.id === item.productId)
    if (!product || !product.active) {
      errors.push(`${item.name}: produk tidak ditemukan atau sudah nonaktif.`)
    } else if (item.qty <= 0 || item.qty > product.stock) {
      errors.push(`${item.name}: diminta ${item.qty} ${item.unit}, stok tersedia ${product.stock} ${item.unit}.`)
    }
  }
  return { valid: errors.length === 0, errors }
}

export function calculateCartTotal(items: TransactionItem[]) {
  return items.reduce((total, item) => total + item.subtotal, 0)
}
