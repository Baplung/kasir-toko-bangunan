import { useCallback, useEffect, useMemo, useState } from 'react'
import { db, type Expense } from '../../db/database'
import { useAuth } from '../../context/AuthContext'
import { EXPENSE_CATEGORIES, formatDateTime, formatRupiah, PAYMENT_METHODS } from '../../utils/helpers'
import { sumExpenses, validateExpense } from './expenses'

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null)

  const load = useCallback(async () => {
    const all = await db.expenses.toArray()
    all.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    setExpenses(all)
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => expenses.filter((expense) => {
    const d = new Date(expense.datetime).toISOString().slice(0, 10)
    return (!startDate || d >= startDate) && (!endDate || d <= endDate) && (!categoryFilter || expense.category === categoryFilter)
  }), [expenses, startDate, endDate, categoryFilter])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const value = Number(amount)
    const validation = validateExpense({ category, description, amount: value })
    if (validation) { setError(validation); return }
    if (!user?.id) { setError('Sesi admin tidak ditemukan. Silakan masuk kembali.'); return }
    const expenseDate = new Date(`${date}T12:00:00`)
    if (Number.isNaN(expenseDate.getTime())) { setError('Tanggal tidak valid.'); return }
    try {
      await db.expenses.add({ datetime: expenseDate, category, description: description.trim(), amount: value, paymentMethod, userId: user.id })
      setDescription(''); setAmount(''); setDate(new Date().toISOString().slice(0, 10))
      await load()
      setToast('Pengeluaran berhasil dicatat.')
      window.setTimeout(() => setToast(''), 3000)
    } catch {
      setError('Pengeluaran gagal disimpan. Coba lagi.')
    }
  }

  const deleteExpense = async () => {
    if (!pendingDelete?.id) return
    await db.expenses.delete(pendingDelete.id)
    setPendingDelete(null)
    await load()
    setToast('Catatan pengeluaran dihapus.')
    window.setTimeout(() => setToast(''), 3000)
  }

  return <div className="p-4 lg:p-6 space-y-6">
    <header><h1 className="text-2xl font-bold text-slate-800">Pengeluaran Operasional</h1><p className="mt-1 text-sm text-slate-500">Catat biaya operasional toko. Catatan ini tidak mengubah stok barang.</p></header>
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.5fr)] gap-6 items-start">
      <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Tambah Pengeluaran</h2>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Kategori *</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800">{EXPENSE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Keterangan *</label><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Tagihan listrik bulan ini" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp) *</label><input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Tanggal *</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran *</label><select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800">{PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">Pengeluaran operasional hanya mencatat uang keluar dan tidak mengurangi atau menambah stok.</div>
        {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white py-3 font-semibold">Simpan Pengeluaran</button>
      </form>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 space-y-4"><div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="font-semibold text-slate-800">Riwayat Pengeluaran</h2><p className="text-xs text-slate-500 mt-1">{filtered.length} catatan</p></div><div className="rounded-xl bg-orange-50 px-4 py-3"><p className="text-xs text-orange-700">Total pada periode ini</p><p className="text-lg font-bold text-orange-800">{formatRupiah(sumExpenses(filtered))}</p></div></div>
          <div className="flex flex-wrap gap-2"><label className="text-xs text-slate-500">Dari <input aria-label="Tanggal mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ml-1 rounded-md border px-2 py-1.5 text-slate-700" /></label><label className="text-xs text-slate-500">Sampai <input aria-label="Tanggal akhir" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ml-1 rounded-md border px-2 py-1.5 text-slate-700" /></label><select aria-label="Filter kategori" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border px-2 py-1.5 text-sm text-slate-700"><option value="">Semua kategori</option>{EXPENSE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></div>
        </div>
        {filtered.length === 0 ? <p className="p-10 text-center text-slate-500">Belum ada pengeluaran pada periode ini.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-4 py-3">Tanggal</th><th className="text-left px-4 py-3">Kategori & Keterangan</th><th className="text-left px-4 py-3">Pembayaran</th><th className="text-right px-4 py-3">Nominal</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((item) => <tr key={item.id}><td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDateTime(item.datetime)}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{item.category}</p><p className="text-xs text-slate-500">{item.description}</p></td><td className="px-4 py-3 text-slate-600">{item.paymentMethod}</td><td className="px-4 py-3 text-right font-semibold text-slate-800">{formatRupiah(item.amount)}</td><td className="px-3 py-3 text-right"><button onClick={() => setPendingDelete(item)} className="rounded-md px-2 py-1 text-xs text-red-700 hover:bg-red-50">Hapus</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
    {pendingDelete && <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 className="font-bold text-lg text-slate-800">Hapus catatan?</h2><p className="mt-2 text-sm text-slate-600">Catatan “{pendingDelete.description}” sebesar {formatRupiah(pendingDelete.amount)} akan dihapus.</p><div className="mt-5 flex gap-3"><button onClick={() => setPendingDelete(null)} className="flex-1 rounded-lg bg-slate-100 py-2.5 font-medium text-slate-700">Batal</button><button onClick={() => void deleteExpense()} className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white">Hapus</button></div></div></div>}
    {toast && <div role="status" className="fixed bottom-6 right-6 max-w-md rounded-xl bg-slate-800 text-white px-5 py-3 shadow-lg text-sm">{toast}</div>}
  </div>
}
