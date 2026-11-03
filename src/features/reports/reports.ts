import type { Transaction } from '../../db/database'

export function summarizeTransactions(transactions: Transaction[]) {
  return {
    sales: transactions.reduce((sum, transaction) => sum + transaction.total, 0),
    transactionCount: transactions.length,
  }
}

export function summarizeItems(transactions: Transaction[]) {
  const grouped = new Map<string, { code: string; name: string; unit: string; qty: number; revenue: number }>()
  for (const transaction of transactions) {
    for (const item of transaction.items) {
      const current = grouped.get(item.code) || { code: item.code, name: item.name, unit: item.unit, qty: 0, revenue: 0 }
      current.qty += item.qty
      current.revenue += item.subtotal
      grouped.set(item.code, current)
    }
  }
  return [...grouped.values()].sort((a, b) => b.qty - a.qty)
}
