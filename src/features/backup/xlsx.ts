export interface WorkbookRows {
  products: Record<string, unknown>[]
  transactions: Record<string, unknown>[]
  stockMovements: Record<string, unknown>[]
  expenses: Record<string, unknown>[]
  settings: Record<string, unknown>[]
}

export function validateWorkbookRows(rows: WorkbookRows) {
  const errors: string[] = []
  const productCodes = new Set<string>()
  for (const [index, row] of rows.products.entries()) {
    const code = String(row.Kode ?? '').trim()
    if (!code) errors.push(`Produk baris ${index + 2}: kode wajib diisi.`)
    else if (productCodes.has(code)) errors.push(`Kode produk ${code} terduplikasi dalam file.`)
    else productCodes.add(code)
    if (!String(row.Nama ?? '').trim()) errors.push(`Produk baris ${index + 2}: nama wajib diisi.`)
    if (!Number.isFinite(Number(row.Harga)) || Number(row.Harga) < 0) errors.push(`Produk ${code || index + 2}: harga tidak valid.`)
    if (!Number.isFinite(Number(row.Stok)) || Number(row.Stok) < 0) errors.push(`Produk ${code || index + 2}: stok tidak valid.`)
  }
  const transactionIds = new Set<string>()
  for (const [index, row] of rows.transactions.entries()) {
    const id = String(row.ID ?? '').trim()
    if (!id) errors.push(`Transaksi baris ${index + 2}: ID wajib diisi.`)
    else if (transactionIds.has(id)) errors.push(`ID transaksi ${id} terduplikasi dalam file.`)
    else transactionIds.add(id)
    if (!Number.isFinite(Number(row.Total)) || Number(row.Total) < 0) errors.push(`Transaksi ${id || index + 2}: total tidak valid.`)
    try {
      const items = JSON.parse(String(row.Items ?? '[]'))
      if (!Array.isArray(items)) errors.push(`Transaksi ${id || index + 2}: detail barang tidak valid.`)
    } catch { errors.push(`Transaksi ${id || index + 2}: format detail barang tidak valid.`) }
  }
  for (const row of rows.stockMovements) {
    if (!String(row.KodeProduk ?? '').trim()) errors.push('Pergerakan stok: kode produk wajib diisi.')
    if (!Number.isFinite(Number(row.Jumlah))) errors.push('Pergerakan stok: jumlah tidak valid.')
  }
  for (const row of rows.expenses) {
    if (!String(row.ID ?? '').trim()) errors.push('Pengeluaran: ID wajib diisi.')
    if (!Number.isFinite(Number(row.Nominal)) || Number(row.Nominal) <= 0) errors.push(`Pengeluaran ${String(row.ID ?? '')}: nominal tidak valid.`)
  }
  return { errors }
}

import * as XLSX from '@e965/xlsx'
import { db, type Product, type StockMovement, type Transaction, type Expense } from '../../db/database'

export async function exportWorkbook() {
  const [products, transactions, movements, expenses, settings] = await Promise.all([
    db.products.toArray(), db.transactions.toArray(), db.stockMovements.toArray(), db.expenses.toArray(), db.storeSettings.toArray(),
  ])
  const productCodes = new Map(products.map((p) => [p.id!, p.code]))
  const workbook = XLSX.utils.book_new()
  const sheets: Array<[string, Record<string, unknown>[]]> = [
    ['Produk', products.map((p) => ({ Kode: p.code, Nama: p.name, Kategori: p.category, Satuan: p.unit, Harga: p.price, Stok: p.stock, Aktif: p.active }))],
    ['Transaksi', transactions.map((t) => ({ ID: t.id, Waktu: new Date(t.datetime).toISOString(), Total: t.total, Dibayar: t.paid, Kembalian: t.change, UserID: t.userId, Items: JSON.stringify(t.items) }))],
    ['Pergerakan Stok', movements.map((m) => ({ ID: m.id, KodeProduk: productCodes.get(m.productId) || '', Tipe: m.type, Jumlah: m.qty, Alasan: m.reason, Waktu: new Date(m.datetime).toISOString(), UserID: m.userId }))],
    ['Pengeluaran', expenses.map((e) => ({ ID: e.id, Waktu: new Date(e.datetime).toISOString(), Kategori: e.category, Keterangan: e.description, Nominal: e.amount, MetodePembayaran: e.paymentMethod, UserID: e.userId }))],
    ['Pengaturan', settings.map((s) => ({ Kunci: s.key, Nilai: s.value }))],
  ]
  for (const [name, rows] of sheets) XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name)
  XLSX.writeFile(workbook, `Cadangan-Kasir-${new Date().toISOString().slice(0, 10)}.xlsx`)
  return { products: products.length, transactions: transactions.length, stockMovements: movements.length, expenses: expenses.length }
}

export function parseWorkbook(file: File): Promise<WorkbookRows> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('File tidak dapat dibaca.'))
    reader.onload = () => {
      try {
        const workbook = XLSX.read(reader.result, { type: 'array', cellDates: true })
        const required = ['Produk', 'Transaksi', 'Pergerakan Stok', 'Pengeluaran', 'Pengaturan']
        const missing = required.filter((name) => !workbook.SheetNames.includes(name))
        if (missing.length) throw new Error(`Sheet wajib tidak ditemukan: ${missing.join(', ')}.`)
        const sheet = (name: string) => XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[name], { defval: '' })
        resolve({ products: sheet('Produk'), transactions: sheet('Transaksi'), stockMovements: sheet('Pergerakan Stok'), expenses: sheet('Pengeluaran'), settings: sheet('Pengaturan') })
      } catch (error) { reject(error instanceof Error ? error : new Error('Format file XLSX tidak valid.')) }
    }
    reader.readAsArrayBuffer(file)
  })
}

export async function applyWorkbook(rows: WorkbookRows) {
  const validation = validateWorkbookRows(rows)
  if (validation.errors.length) throw new Error(validation.errors.join('\\n'))
  const productCodes = new Set(rows.products.map((r) => String(r.Kode).trim()))
  for (const row of rows.stockMovements) {
    if (!productCodes.has(String(row.KodeProduk).trim())) throw new Error(`Produk ${String(row.KodeProduk)} untuk pergerakan stok tidak ada di workbook.`)
    if (!['sale', 'incoming', 'adjustment'].includes(String(row.Tipe))) throw new Error(`Tipe pergerakan stok tidak valid untuk produk ${String(row.KodeProduk)}.`)
  }
  const mappedProductIds = new Map<string, number>()
  await db.transaction('rw', db.products, db.transactions, db.stockMovements, db.expenses, db.storeSettings, async () => {
    // XLSX is a full snapshot restore, not a merge. All operational tables are replaced atomically.
    await Promise.all([db.products.clear(), db.transactions.clear(), db.stockMovements.clear(), db.expenses.clear(), db.storeSettings.clear()])
    for (const row of rows.products) {
      const code = String(row.Kode).trim()
      const value: Product = { code, name: String(row.Nama).trim(), category: String(row.Kategori), unit: String(row.Satuan), price: Number(row.Harga), stock: Number(row.Stok), active: String(row.Aktif).toLowerCase() !== 'false' }
      mappedProductIds.set(code, await db.products.add(value))
    }
    for (const row of rows.transactions) {
      const id = String(row.ID).trim()
      const rawItems = JSON.parse(String(row.Items)) as Array<Record<string, unknown>>
      const items = rawItems.map((item) => ({ ...item, productId: mappedProductIds.get(String(item.code)) ?? Number(item.productId) }))
      const transaction: Transaction = { id, datetime: new Date(String(row.Waktu)), total: Number(row.Total), paid: Number(row.Dibayar), change: Number(row.Kembalian), userId: Number(row.UserID), items: items as Transaction['items'] }
      await db.transactions.add(transaction)
    }
    for (const row of rows.stockMovements) {
      const code = String(row.KodeProduk).trim()
      const productId = mappedProductIds.get(code)
      if (productId === undefined) throw new Error(`Produk ${code} tidak ditemukan.`)
      const movement: StockMovement = { productId, type: String(row.Tipe) as StockMovement['type'], qty: Number(row.Jumlah), reason: String(row.Alasan), datetime: new Date(String(row.Waktu)), userId: Number(row.UserID) }
      await db.stockMovements.add(movement)
    }
    for (const row of rows.expenses) {
      const expense: Expense = { datetime: new Date(String(row.Waktu)), category: String(row.Kategori), description: String(row.Keterangan), amount: Number(row.Nominal), paymentMethod: String(row.MetodePembayaran), userId: Number(row.UserID) }
      await db.expenses.add(expense)
    }
    for (const row of rows.settings) {
      const key = String(row.Kunci).trim()
      if (key) await db.storeSettings.add({ key, value: String(row.Nilai) })
    }
  })
  return { products: rows.products.length, transactions: rows.transactions.length, stockMovements: rows.stockMovements.length, expenses: rows.expenses.length }
}
