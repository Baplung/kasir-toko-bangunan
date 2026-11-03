import { useCallback, useEffect, useState } from 'react'
import { db, type Product, type StockMovement } from '../../db/database'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime, formatRupiah } from '../../utils/helpers'
import { calculateStockAfterReceiving, validateReceiving } from './stockIn'

export default function StockInPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<(StockMovement & { productName: string; code: string })[]>([])
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [supplier, setSupplier] = useState('')
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('')

  const load = useCallback(async () => {
    const activeProducts = await db.products.filter((p) => p.active).toArray()
    setProducts(activeProducts)
    const incoming = await db.stockMovements.where('type').equals('incoming').reverse().sortBy('datetime')
    const rows = await Promise.all(incoming.map(async (m) => {
      const product = await db.products.get(m.productId)
      return { ...m, productName: product?.name || 'Produk dihapus', code: product?.code || '-' }
    }))
    setMovements(rows)
  }, [])

  useEffect(() => { void load() }, [load])

  const selected = products.find((p) => String(p.id) === productId)
  const filtered = movements.filter((m) => !filter || new Date(m.datetime).toISOString().slice(0, 10) === filter)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const receivedQty = Number(qty)
    const validation = validateReceiving(receivedQty)
    if (validation) { setError(validation); return }
    if (!selected) { setError('Pilih produk yang diterima.'); return }
    if (!user?.id) { setError('Sesi pengguna tidak ditemukan. Silakan masuk kembali.'); return }
    const receivedDate = new Date(`${date}T12:00:00`)
    if (Number.isNaN(receivedDate.getTime())) { setError('Tanggal tidak valid.'); return }
    const unitCost = cost.trim() ? Number(cost) : undefined
    if (unitCost !== undefined && (!Number.isFinite(unitCost) || unitCost < 0)) { setError('Harga modal tidak valid.'); return }

    try {
      await db.transaction('rw', db.products, db.stockMovements, async () => {
        const latest = await db.products.get(selected.id!)
        if (!latest || !latest.active) throw new Error('Produk tidak ditemukan atau sudah nonaktif.')
        await db.products.update(latest.id!, { stock: calculateStockAfterReceiving(latest.stock, receivedQty) })
        await db.stockMovements.add({
          productId: latest.id!, type: 'incoming', qty: receivedQty,
          reason: [supplier.trim() ? `Pemasok: ${supplier.trim()}` : '', unitCost !== undefined ? `Harga modal: ${formatRupiah(unitCost)}` : '', notes.trim()].filter(Boolean).join(' | '),
          datetime: receivedDate, userId: user.id!,
        })
      })
      setToast(`Stok ${selected.name} berhasil ditambah ${receivedQty} ${selected.unit}.`)
      setProductId(''); setQty(''); setSupplier(''); setCost(''); setNotes(''); setDate(new Date().toISOString().slice(0, 10))
      await load()
      window.setTimeout(() => setToast(''), 3500)
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan stok masuk.') }
  }

  return <div className="p-4 lg:p-6 space-y-6">
    <header><h1 className="text-2xl font-bold text-slate-800">Stok Masuk</h1><p className="mt-1 text-sm text-slate-500">Catat barang yang diterima. Stok akan bertambah setelah disimpan.</p></header>
    <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 items-start">
      <form onSubmit={save} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Catat Penerimaan Barang</h2>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Produk *</label><select required value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800"><option value="">Pilih produk</option>{products.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name} (stok {p.stock} {p.unit})</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm font-medium text-slate-700 mb-1">Jumlah *</label><input required min="0.001" step="any" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Jumlah diterima" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Tanggal *</label><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Pemasok (opsional)</label><input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nama pemasok" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Harga Modal per Satuan (opsional)</label><input min="0" type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Contoh: 62000" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1">Catatan (opsional)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan tambahan" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div>
        {selected && Number(qty) > 0 && <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 text-sm text-teal-900"><p>Stok saat ini: <strong>{selected.stock} {selected.unit}</strong></p><p>Stok setelah disimpan: <strong>{calculateStockAfterReceiving(selected.stock, Number(qty))} {selected.unit}</strong></p></div>}
        {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!products.length} className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white py-3 font-semibold">Simpan Stok Masuk</button>
        {!products.length && <p className="text-xs text-amber-700">Tambahkan produk terlebih dahulu melalui menu Produk & Stok.</p>}
      </form>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap gap-3 justify-between items-center"><div><h2 className="font-semibold text-slate-800">Riwayat Stok Masuk</h2><p className="text-xs text-slate-500 mt-1">{filtered.length} catatan</p></div><input aria-label="Filter tanggal" type="date" value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700" /></div>
        {filtered.length === 0 ? <p className="p-10 text-center text-slate-500">Belum ada catatan stok masuk.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-4 py-3">Tanggal</th><th className="text-left px-4 py-3">Produk</th><th className="text-right px-4 py-3">Jumlah</th><th className="text-left px-4 py-3">Catatan</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((m) => <tr key={m.id}><td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDateTime(m.datetime)}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{m.productName}</p><p className="text-xs text-slate-500">{m.code}</p></td><td className="px-4 py-3 text-right font-semibold text-emerald-700">+{m.qty}</td><td className="px-4 py-3 text-xs text-slate-500">{m.reason || '—'}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
    {toast && <div role="status" className="fixed bottom-6 right-6 max-w-md rounded-xl bg-slate-800 text-white px-5 py-3 shadow-lg text-sm">{toast}</div>}
  </div>
}
