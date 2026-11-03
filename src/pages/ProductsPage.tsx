import { useState, useEffect } from 'react'
import { db, type Product } from '../db/database'
import { formatRupiah, CATEGORIES, UNITS } from '../utils/helpers'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showAdjust, setShowAdjust] = useState<Product | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [toast, setToast] = useState('')

  // Form state
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: CATEGORIES[0] as string,
    unit: UNITS[0] as string,
    price: '',
    stock: '',
  })
  const [formError, setFormError] = useState('')

  const loadProducts = async () => {
    let all = await db.products.toArray()
    setProducts(all)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || p.category === filterCategory
    return matchSearch && matchCat
  })

  const activeProducts = filtered.filter((p) => p.active)
  const inactiveProducts = filtered.filter((p) => !p.active)

  const openAdd = () => {
    setEditProduct(null)
    setForm({ code: '', name: '', category: CATEGORIES[0], unit: UNITS[0], price: '', stock: '' })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      code: p.code,
      name: p.name,
      category: p.category,
      unit: p.unit,
      price: String(p.price),
      stock: String(p.stock),
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    setFormError('')
    if (!form.code.trim() || !form.name.trim() || !form.price || !form.stock) {
      setFormError('Semua kolom wajib diisi.')
      return
    }
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (isNaN(price) || price < 0) { setFormError('Harga tidak valid.'); return }
    if (isNaN(stock) || stock < 0) { setFormError('Stok tidak valid.'); return }

    // Check duplicate code
    const existing = await db.products.where('code').equals(form.code.trim()).first()
    if (existing && existing.id !== editProduct?.id) {
      setFormError('Kode produk sudah digunakan.')
      return
    }

    if (editProduct) {
      await db.products.update(editProduct.id!, {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        price,
        stock,
      })
      showToast('Produk berhasil diperbarui.')
    } else {
      await db.products.add({
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        price,
        stock,
        active: true,
      })
      showToast('Produk berhasil ditambahkan.')
    }
    setShowForm(false)
    loadProducts()
  }

  const toggleActive = async (p: Product) => {
    await db.products.update(p.id!, { active: !p.active })
    showToast(p.active ? 'Produk dinonaktifkan.' : 'Produk diaktifkan kembali.')
    loadProducts()
  }

  const handleAdjust = async () => {
    if (!adjustQty || isNaN(Number(adjustQty)) || Number(adjustQty) === 0) return
    if (!adjustReason.trim()) return
    const qty = Number(adjustQty)
    const newStock = showAdjust!.stock + qty
    if (newStock < 0) return

    await db.products.update(showAdjust!.id!, { stock: newStock })
    await db.stockMovements.add({
      productId: showAdjust!.id!,
      type: 'adjustment',
      qty,
      reason: adjustReason.trim(),
      datetime: new Date(),
      userId: Number(localStorage.getItem('currentUserId') || 0),
    })
    showToast(`Stok disesuaikan (${qty > 0 ? '+' : ''}${qty}).`)
    setShowAdjust(null)
    setAdjustQty('')
    setAdjustReason('')
    loadProducts()
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Produk & Stok</h1>
        <button
          onClick={openAdd}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Tambah Produk
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari nama atau kode produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 text-slate-800"
        >
          <option value="">Semua Kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Product Table */}
      {activeProducts.length === 0 && inactiveProducts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg">Produk belum ditambahkan.</p>
          <p className="text-sm mt-1">Klik "Tambah Produk" untuk memulai.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Kode</th>
                  <th className="text-left px-4 py-3 font-medium">Nama Produk</th>
                  <th className="text-left px-4 py-3 font-medium">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium">Satuan</th>
                  <th className="text-right px-4 py-3 font-medium">Harga Jual</th>
                  <th className="text-right px-4 py-3 font-medium">Stok</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-600">{p.code}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.category}</td>
                    <td className="px-4 py-3 text-slate-600">{p.unit}</td>
                    <td className="px-4 py-3 text-right text-slate-800">{formatRupiah(p.price)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${p.stock <= 5 ? 'text-red-600' : 'text-slate-800'}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(p)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors">Edit</button>
                        <button onClick={() => { setShowAdjust(p); setAdjustQty(''); setAdjustReason('') }} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 rounded transition-colors">Stok</button>
                        <button onClick={() => toggleActive(p)} className="text-xs bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded transition-colors">Nonaktifkan</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inactive products */}
          {inactiveProducts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Produk Nonaktif ({inactiveProducts.length})</h3>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden opacity-60">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {inactiveProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2 font-mono text-slate-400">{p.code}</td>
                        <td className="px-4 py-2 text-slate-500">{p.name}</td>
                        <td className="px-4 py-2 text-slate-400">{p.category}</td>
                        <td className="px-4 py-2 text-slate-400">{p.unit}</td>
                        <td className="px-4 py-2 text-right text-slate-400">{formatRupiah(p.price)}</td>
                        <td className="px-4 py-2 text-right text-slate-400">{p.stock}</td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => toggleActive(p)} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded transition-colors">Aktifkan</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {editProduct ? 'Edit Produk' : 'Tambah Produk'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kode Produk *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="SMN001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="Semen 40 kg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Satuan</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="68000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stok Awal *</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="25" />
                </div>
              </div>
            </div>
            {formError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{formError}</div>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
              <button onClick={handleSave} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2 rounded-lg font-medium transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjust && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Sesuaikan Stok</h2>
            <p className="text-sm text-slate-500 mb-4">{showAdjust.name} — Stok saat ini: <strong>{showAdjust.stock}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Perubahan (+ atau -)</label>
                <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="+10 atau -5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alasan *</label>
                <input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="Koreksi stok fisik" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdjust(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium transition-colors">Batal</button>
              <button onClick={handleAdjust} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2 rounded-lg font-medium transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
