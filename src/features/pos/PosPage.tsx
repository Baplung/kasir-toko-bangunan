import { useCallback, useEffect, useMemo, useState } from 'react'
import { db, type Product, type Transaction, type TransactionItem } from '../../db/database'
import { useAuth } from '../../context/AuthContext'
import { CATEGORIES, formatRupiah, formatDateTime, generateTransactionId } from '../../utils/helpers'
import { calculateCartTotal, validateCartStock } from './checkout'

export default function PosPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<TransactionItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [paid, setPaid] = useState('')
  const [checkout, setCheckout] = useState(false)
  const [receiptId, setReceiptId] = useState('')
  const [notice, setNotice] = useState('')

  const loadProducts = useCallback(async () => {
    setProducts(await db.products.filter((p) => p.active).toArray())
  }, [])

  useEffect(() => {
    void loadProducts()
    const timer = window.setInterval(() => void loadProducts(), 1500)
    return () => window.clearInterval(timer)
  }, [loadProducts])

  const filteredProducts = useMemo(() => products.filter((p) => {
    const q = search.trim().toLowerCase()
    return (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) && (!category || p.category === category)
  }), [products, search, category])
  const total = calculateCartTotal(cart)
  const stockCheck = validateCartStock(cart, products)
  const change = Math.max(0, Number(paid || 0) - total)

  const addToCart = (product: Product) => {
    const found = cart.find((item) => item.productId === product.id)
    if (found) {
      setCart(cart.map((item) => item.productId === product.id ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price } : item))
    } else {
      setCart([...cart, { productId: product.id!, code: product.code, name: product.name, unit: product.unit, qty: 1, price: product.price, subtotal: product.price }])
    }
  }

  const updateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter((item) => item.productId !== productId))
      return
    }
    setCart(cart.map((item) => item.productId === productId ? { ...item, qty, subtotal: qty * item.price } : item))
  }

  const saveTransaction = async () => {
    const latestProducts = await db.products.filter((p) => p.active).toArray()
    const currentCheck = validateCartStock(cart, latestProducts)
    if (!currentCheck.valid) {
      setNotice(currentCheck.errors.join(' '))
      await loadProducts()
      return
    }
    const amountPaid = Number(paid)
    if (!Number.isFinite(amountPaid) || amountPaid < total) {
      setNotice('Jumlah pembayaran kurang dari total transaksi.')
      return
    }
    if (!user?.id) return

    const id = generateTransactionId()
    try {
      await db.transaction('rw', db.products, db.transactions, db.stockMovements, async () => {
        for (const item of cart) {
          const product = await db.products.get(item.productId)
          if (!product || product.stock < item.qty || !product.active) throw new Error(`Stok ${item.name} berubah atau tidak mencukupi.`)
        }
        for (const item of cart) {
          await db.products.update(item.productId, { stock: (await db.products.get(item.productId))!.stock - item.qty })
          await db.stockMovements.add({ productId: item.productId, type: 'sale', qty: -item.qty, reason: `Transaksi ${id}`, datetime: new Date(), userId: user.id! })
        }
        await db.transactions.add({ id, datetime: new Date(), items: cart, total, paid: amountPaid, change: amountPaid - total, userId: user.id! })
      })
      setReceiptId(id)
      setCheckout(false)
      setCart([])
      setPaid('')
      await loadProducts()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Transaksi gagal disimpan.')
    }
  }

  const startNewTransaction = () => {
    setReceiptId('')
    setNotice('')
  }

  if (receiptId) {
    return <Receipt transactionId={receiptId} onNew={startNewTransaction} />
  }

  return (
    <div className="h-full min-h-screen p-4 lg:p-6 flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div><h1 className="text-2xl font-bold text-slate-800">Kasir</h1><p className="text-sm text-slate-500">Pilih produk untuk memulai transaksi</p></div>
        <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-sm font-medium">● Mode Offline</span>
      </header>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 flex-1 min-h-0">
        <section className="min-w-0 flex flex-col">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau kode produk..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-teal-600" />
          <div className="flex gap-2 overflow-x-auto py-3">
            <button onClick={() => setCategory('')} className={`shrink-0 rounded-full px-4 py-2 text-sm ${!category ? 'bg-teal-700 text-white' : 'bg-white text-slate-700 border'}`}>Semua</button>
            {CATEGORIES.map((c) => <button key={c} onClick={() => setCategory(c)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${category === c ? 'bg-teal-700 text-white' : 'bg-white text-slate-700 border'}`}>{c}</button>)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 overflow-auto pb-4">
            {filteredProducts.map((p) => <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="text-left rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-500 hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="flex justify-between gap-2"><span className="font-semibold text-slate-800">{p.name}</span><span className="text-xs text-slate-400">{p.code}</span></div>
              <p className="mt-2 text-teal-800 font-bold">{formatRupiah(p.price)} <span className="text-xs font-normal text-slate-500">/ {p.unit}</span></p>
              <p className={`mt-1 text-sm ${p.stock <= 5 ? 'text-amber-700' : 'text-slate-500'}`}>Stok: {p.stock} {p.unit}</p>
            </button>)}
            {filteredProducts.length === 0 && <div className="col-span-full rounded-xl bg-white p-10 text-center text-slate-500">{products.length ? 'Produk tidak ditemukan.' : 'Belum ada produk aktif. Admin dapat menambahkannya di menu Produk & Stok.'}</div>}
          </div>
        </section>
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[420px] xl:min-h-0">
          <div className="p-4 border-b border-slate-100 flex justify-between"><h2 className="font-bold text-slate-800">Keranjang</h2><span className="text-sm text-slate-500">{cart.reduce((n, i) => n + i.qty, 0)} item</span></div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {cart.length === 0 && <p className="py-10 text-center text-slate-400">Belum ada barang di keranjang.</p>}
            {cart.map((item) => <div key={item.productId} className="border-b border-slate-100 pb-3">
              <div className="flex justify-between gap-2"><p className="font-medium text-slate-800">{item.name}</p><button onClick={() => updateQty(item.productId, 0)} className="text-slate-400 hover:text-red-600" aria-label={`Hapus ${item.name}`}>✕</button></div>
              <p className="text-xs text-slate-500 mt-1">{formatRupiah(item.price)} / {item.unit}</p>
              <div className="flex items-center justify-between mt-2"><div className="flex items-center gap-2"><button onClick={() => updateQty(item.productId, item.qty - 1)} className="w-8 h-8 rounded-lg bg-slate-100 text-lg">−</button><span className="w-8 text-center font-semibold">{item.qty}</span><button onClick={() => updateQty(item.productId, item.qty + 1)} className="w-8 h-8 rounded-lg bg-slate-100 text-lg">+</button><span className="text-xs text-slate-500">{item.unit}</span></div><strong className="text-slate-800">{formatRupiah(item.subtotal)}</strong></div>
            </div>)}
          </div>
          <div className="border-t border-slate-100 p-4 space-y-3">
            {!stockCheck.valid && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{stockCheck.errors.join(' ')}</div>}
            {notice && <div role="alert" className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">{notice}</div>}
            <div className="flex justify-between text-lg font-bold text-slate-800"><span>Total</span><span>{formatRupiah(total)}</span></div>
            <button onClick={() => { setNotice(''); setCheckout(true) }} disabled={!cart.length || !stockCheck.valid} className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 font-bold">Lanjut ke Pembayaran</button>
          </div>
        </aside>
      </div>
      {checkout && <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"><div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-800">Pembayaran</h2><div className="flex justify-between border-b py-4 mt-2 text-lg"><span>Total</span><strong>{formatRupiah(total)}</strong></div>
        <label className="block text-sm font-medium mt-4 mb-1 text-slate-700">Uang diterima (Rp)</label><input autoFocus type="number" min={total} value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="Masukkan jumlah pembayaran" className="w-full rounded-xl border px-4 py-3 text-lg text-slate-800 focus:ring-2 focus:ring-teal-600 outline-none" />
        <div className="flex justify-between mt-4 bg-emerald-50 p-3 rounded-lg text-emerald-800"><span>Kembalian</span><strong>{formatRupiah(change)}</strong></div>
        {notice && <p className="mt-3 text-sm text-red-600">{notice}</p>}
        <div className="flex gap-3 mt-5"><button onClick={() => setCheckout(false)} className="flex-1 py-3 rounded-xl bg-slate-100 font-semibold text-slate-700">Kembali</button><button onClick={() => void saveTransaction()} disabled={Number(paid) < total || !stockCheck.valid} className="flex-1 py-3 rounded-xl bg-teal-700 text-white font-semibold disabled:bg-slate-300">Simpan Transaksi</button></div>
      </div></div>}
    </div>
  )
}

function Receipt({ transactionId, onNew }: { transactionId: string; onNew: () => void }) {
  const [transaction, setTransaction] = useState<Transaction | undefined>()
  const [settings, setSettings] = useState<Record<string, string>>({})
  useEffect(() => {
    void db.transactions.get(transactionId).then((t) => setTransaction(t))
    void db.storeSettings.toArray().then((rows) => setSettings(Object.fromEntries(rows.map((r) => [r.key, r.value]))))
  }, [transactionId])
  if (!transaction) return <div className="p-8">Memuat struk...</div>
  return <div className="min-h-screen bg-slate-100 p-6 flex justify-center"><div className="w-full max-w-lg bg-white p-7 rounded-xl shadow-sm h-fit">
    <div className="text-center border-b border-dashed pb-5"><h1 className="font-bold text-xl text-slate-800">{settings.store_name || 'Toko Bangunan'}</h1><p className="text-sm text-slate-500">{settings.store_address || ''}</p><p className="text-xs text-slate-500 mt-4">{transaction.id}</p><p className="text-xs text-slate-500">{formatDateTime(transaction.datetime)}</p></div>
    <div className="py-4 space-y-3 border-b border-dashed">{transaction.items.map((item) => <div key={item.productId}><div className="flex justify-between gap-4 text-sm"><span>{item.name}</span><span>{formatRupiah(item.subtotal)}</span></div><p className="text-xs text-slate-500">{item.qty} {item.unit} × {formatRupiah(item.price)}</p></div>)}</div>
    <div className="py-4 space-y-2 text-sm"><div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatRupiah(transaction.total)}</span></div><div className="flex justify-between text-slate-600"><span>Uang diterima</span><span>{formatRupiah(transaction.paid)}</span></div><div className="flex justify-between text-slate-600"><span>Kembalian</span><span>{formatRupiah(transaction.change)}</span></div></div>
    <p className="text-center text-sm text-slate-500 py-4">Terima kasih telah berbelanja.</p>
    <div className="flex gap-3 print:hidden"><button onClick={() => window.print()} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold">Cetak Struk</button><button onClick={onNew} className="flex-1 py-3 rounded-xl bg-teal-700 text-white font-semibold">Transaksi Baru</button></div>
  </div></div>
}
