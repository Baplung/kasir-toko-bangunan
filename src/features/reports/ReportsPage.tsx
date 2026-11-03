import { useCallback, useEffect, useMemo, useState } from 'react'
import { db, type Expense, type StockMovement, type Transaction } from '../../db/database'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime, formatRupiah } from '../../utils/helpers'
import { summarizeItems, summarizeTransactions } from './reports'

export default function ReportsPage() {
  const { user, isAdmin } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selected, setSelected] = useState<Transaction | null>(null)

  const load = useCallback(async () => {
    const [tx, ex, sm] = await Promise.all([db.transactions.toArray(), db.expenses.toArray(), db.stockMovements.toArray()])
    tx.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    ex.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    sm.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
    setTransactions(tx); setExpenses(ex); setMovements(sm)
  }, [])

  useEffect(() => { void load() }, [load])

  const inPeriod = (date: Date) => {
    const day = new Date(date).toISOString().slice(0, 10)
    return (!startDate || day >= startDate) && (!endDate || day <= endDate)
  }
  const filteredTransactions = useMemo(() => transactions.filter((tx) => inPeriod(tx.datetime) && (isAdmin || tx.userId === user?.id)), [transactions, startDate, endDate, isAdmin, user?.id])
  const filteredExpenses = useMemo(() => expenses.filter((item) => inPeriod(item.datetime)), [expenses, startDate, endDate])
  const filteredMovements = useMemo(() => movements.filter((item) => inPeriod(item.datetime)), [movements, startDate, endDate])
  const summary = summarizeTransactions(filteredTransactions)
  const sold = summarizeItems(filteredTransactions)
  const stockReceived = filteredMovements.filter((m) => m.type === 'incoming').reduce((sum, m) => sum + m.qty, 0)
  const expenseTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return <div className="p-4 lg:p-6 space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-800">Riwayat & Laporan</h1><p className="mt-1 text-sm text-slate-500">Ringkasan transaksi, barang terjual, stok masuk, dan biaya operasional.</p></div><div className="flex flex-wrap gap-3"><label className="text-xs text-slate-500">Dari <input aria-label="Tanggal mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ml-1 rounded-md border px-2 py-1.5 text-slate-700" /></label><label className="text-xs text-slate-500">Sampai <input aria-label="Tanggal akhir" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ml-1 rounded-md border px-2 py-1.5 text-slate-700" /></label></div></header>
    <section className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
      <SummaryCard label="Penjualan" value={formatRupiah(summary.sales)} color="teal" />
      <SummaryCard label="Jumlah Transaksi" value={String(summary.transactionCount)} color="blue" />
      <SummaryCard label="Barang Terjual" value={String(sold.reduce((sum, item) => sum + item.qty, 0))} color="violet" />
      {isAdmin && <SummaryCard label="Stok Masuk" value={`${stockReceived} unit`} color="green" />}
    </section>
    {isAdmin && <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold text-orange-900">Pengeluaran Operasional</h2><p className="mt-1 text-sm text-orange-800">Ditampilkan terpisah dari omzet dan pembelian barang. Tidak memengaruhi stok.</p></div><strong className="text-xl text-orange-900">{formatRupiah(expenseTotal)}</strong></section>}
    <section className="grid grid-cols-1 2xl:grid-cols-2 gap-6 items-start">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Riwayat Transaksi</h2><p className="text-xs text-slate-500 mt-1">{filteredTransactions.length} transaksi</p></div>{!filteredTransactions.length ? <p className="p-10 text-center text-slate-500">Belum ada transaksi pada periode ini.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-4 py-3">Waktu</th><th className="text-left px-4 py-3">Nomor Transaksi</th><th className="text-right px-4 py-3">Total</th><th className="px-3 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{filteredTransactions.map((tx) => <tr key={tx.id}><td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDateTime(tx.datetime)}</td><td className="px-4 py-3 font-mono text-xs text-slate-700">{tx.id}</td><td className="px-4 py-3 text-right font-semibold text-slate-800">{formatRupiah(tx.total)}</td><td className="px-3 py-3 text-right"><button onClick={() => setSelected(tx)} className="rounded-md bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800">Detail</button></td></tr>)}</tbody></table></div>}</div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Barang Terjual</h2></div>{!sold.length ? <p className="p-10 text-center text-slate-500">Belum ada barang terjual.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-4 py-3">Produk</th><th className="text-right px-4 py-3">Jumlah</th><th className="text-right px-4 py-3">Omzet</th></tr></thead><tbody className="divide-y divide-slate-100">{sold.map((item) => <tr key={item.code}><td className="px-4 py-3"><p className="font-medium text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.code}</p></td><td className="px-4 py-3 text-right">{item.qty} {item.unit}</td><td className="px-4 py-3 text-right font-medium">{formatRupiah(item.revenue)}</td></tr>)}</tbody></table></div>}</div>
    </section>
    {isAdmin && <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-5 border-b border-slate-100"><h2 className="font-semibold text-slate-800">Riwayat Pengeluaran</h2></div>{!filteredExpenses.length ? <p className="p-8 text-center text-slate-500">Belum ada pengeluaran pada periode ini.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-4 py-3">Tanggal</th><th className="text-left px-4 py-3">Kategori</th><th className="text-left px-4 py-3">Keterangan</th><th className="text-right px-4 py-3">Nominal</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredExpenses.map((item) => <tr key={item.id}><td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.datetime)}</td><td className="px-4 py-3">{item.category}</td><td className="px-4 py-3">{item.description}</td><td className="px-4 py-3 text-right font-medium">{formatRupiah(item.amount)}</td></tr>)}</tbody></table></div>}</section>}
    {selected && <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between items-start"><div><h2 className="text-lg font-bold text-slate-800">Detail Transaksi</h2><p className="text-xs text-slate-500 mt-1">{selected.id} • {formatDateTime(selected.datetime)}</p></div><button onClick={() => setSelected(null)} aria-label="Tutup" className="text-slate-400 text-xl">×</button></div><div className="my-4 divide-y">{selected.items.map((item) => <div key={item.productId} className="py-3 flex justify-between gap-3 text-sm"><span>{item.name}<small className="block text-slate-500">{item.qty} {item.unit} × {formatRupiah(item.price)}</small></span><strong>{formatRupiah(item.subtotal)}</strong></div>)}</div><div className="border-t pt-3 space-y-2 text-sm"><div className="flex justify-between font-bold"><span>Total</span><span>{formatRupiah(selected.total)}</span></div><div className="flex justify-between"><span>Dibayar</span><span>{formatRupiah(selected.paid)}</span></div><div className="flex justify-between"><span>Kembalian</span><span>{formatRupiah(selected.change)}</span></div></div><button onClick={() => window.print()} className="mt-5 w-full rounded-xl bg-teal-700 py-2.5 font-semibold text-white print:hidden">Cetak Detail</button></div></div>}
  </div>
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const styles: Record<string, string> = { teal: 'bg-teal-50 text-teal-800', blue: 'bg-blue-50 text-blue-800', violet: 'bg-violet-50 text-violet-800', green: 'bg-emerald-50 text-emerald-800' }
  return <div className={`rounded-2xl p-5 ${styles[color]}`}><p className="text-sm opacity-80">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>
}
