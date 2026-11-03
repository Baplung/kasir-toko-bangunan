import type { Expense } from '../../db/database'

export function validateExpense(input: { category: string; description: string; amount: number }) {
  if (!input.category.trim()) return 'Pilih kategori pengeluaran.'
  if (!input.description.trim()) return 'Keterangan wajib diisi.'
  if (!Number.isFinite(input.amount) || input.amount <= 0) return 'Nominal harus lebih dari 0.'
  return ''
}

export function sumExpenses(expenses: Expense[]) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0)
}
