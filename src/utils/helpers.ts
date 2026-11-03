export function formatRupiah(amount: number): string {
  return 'Rp' + amount.toLocaleString('id-ID')
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateTransactionId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TRX-${date}-${rand}`
}

export const CATEGORIES = [
  'Semen',
  'Cat',
  'Besi',
  'Pipa',
  'Listrik',
  'Perkakas',
  'Lainnya',
] as const

export const UNITS = [
  'pcs',
  'sak',
  'batang',
  'dus',
  'meter',
  'liter',
  'kg',
] as const

export const EXPENSE_CATEGORIES = [
  'Listrik',
  'Transportasi',
  'Perlengkapan Toko',
  'Lainnya',
] as const

export const PAYMENT_METHODS = ['Tunai', 'Transfer'] as const
