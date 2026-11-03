import { useState } from 'react'
import { applyWorkbook, exportWorkbook, parseWorkbook, validateWorkbookRows, type WorkbookRows } from './xlsx'

export default function BackupPage() {
  const [rows, setRows] = useState<WorkbookRows | null>(null)
  const [fileName, setFileName] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [lastExport, setLastExport] = useState(localStorage.getItem('lastXlsxExport') || '')
  const [lastImport, setLastImport] = useState(localStorage.getItem('lastXlsxImport') || '')

  const exportData = async () => {
    setBusy(true); setNotice('')
    try {
      const counts = await exportWorkbook()
      const time = new Date().toLocaleString('id-ID')
      localStorage.setItem('lastXlsxExport', time); setLastExport(time)
      setNotice(`Ekspor berhasil: ${counts.products} produk, ${counts.transactions} transaksi, ${counts.stockMovements} pergerakan stok, dan ${counts.expenses} pengeluaran.`)
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Ekspor gagal.') }
    finally { setBusy(false) }
  }

  const chooseFile = async (file?: File) => {
    setErrors([]); setRows(null); setNotice('')
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) { setErrors(['Pilih file dengan format .xlsx.']); return }
    setBusy(true); setFileName(file.name)
    try {
      const parsed = await parseWorkbook(file)
      const validation = validateWorkbookRows(parsed)
      setRows(parsed); setErrors(validation.errors)
      if (!validation.errors.length) setNotice('File valid. Periksa pratinjau sebelum menerapkan data.')
    } catch (e) { setErrors([e instanceof Error ? e.message : 'File gagal dibaca.']) }
    finally { setBusy(false) }
  }

  const apply = async () => {
    if (!rows || errors.length) return
    if (!window.confirm('Impor ini akan MENGGANTI seluruh data produk, transaksi, pergerakan stok, pengeluaran, dan pengaturan pada perangkat ini dengan isi file XLSX. Data lokal yang belum diekspor akan hilang. Lanjutkan?')) return
    setBusy(true); setNotice('')
    try {
      const counts = await applyWorkbook(rows)
      const time = new Date().toLocaleString('id-ID')
      localStorage.setItem('lastXlsxImport', time); setLastImport(time)
      setNotice(`Impor selesai: ${counts.products} produk diproses, ${counts.transactions} transaksi baru, ${counts.stockMovements} pergerakan stok, ${counts.expenses} pengeluaran.`)
      setRows(null); setFileName('')
    } catch (e) { setErrors([e instanceof Error ? e.message : 'Impor gagal. Tidak ada perubahan yang diterapkan.']) }
    finally { setBusy(false) }
  }

  return <div className="p-4 lg:p-6 max-w-5xl space-y-6">
    <header><h1 className="text-2xl font-bold text-slate-800">Data & Cadangan XLSX</h1><p className="mt-1 text-sm text-slate-500">Pindahkan atau cadangkan data lokal antarperangkat menggunakan workbook Excel.</p></header>
    <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900"><strong className="block mb-1">Penting sebelum berpindah perangkat</strong>Perangkat digunakan bergantian. Impor dan ekspor tidak menyinkronkan data secara otomatis. Ekspor data terbaru dari perangkat sebelumnya sebelum berpindah perangkat. Impor akan mengganti data produk yang memiliki kode sama, termasuk stok; pastikan file yang dipilih adalah cadangan terbaru.</div>
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-xl">↓</div><h2 className="mt-4 font-semibold text-slate-800">Ekspor Cadangan</h2><p className="mt-1 text-sm text-slate-500">Unduh semua data ke satu file XLSX berisi sheet produk, transaksi, stok, pengeluaran, dan pengaturan.</p><button disabled={busy} onClick={() => void exportData()} className="mt-5 w-full rounded-xl bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 py-3 font-semibold text-white">Ekspor Data XLSX</button><p className="mt-3 text-xs text-slate-500">Ekspor terakhir: {lastExport || 'Belum pernah'}</p></div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center text-xl">↑</div><h2 className="mt-4 font-semibold text-slate-800">Impor Cadangan</h2><p className="mt-1 text-sm text-slate-500">Pilih file cadangan. Data akan diperiksa dan ditampilkan dalam pratinjau sebelum diterapkan.</p><label className="mt-5 flex min-h-12 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal-600">{busy ? 'Memproses file…' : 'Pilih File XLSX'}<input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} className="sr-only" onChange={(e) => void chooseFile(e.target.files?.[0])} /></label><p className="mt-3 text-xs text-slate-500">Impor terakhir: {lastImport || 'Belum pernah'}</p></div>
    </section>
    {fileName && <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"><h2 className="font-semibold text-slate-800">Pratinjau: {fileName}</h2>{rows && <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">{[['Produk', rows.products.length], ['Transaksi', rows.transactions.length], ['Pergerakan Stok', rows.stockMovements.length], ['Pengeluaran', rows.expenses.length], ['Pengaturan', rows.settings.length]].map(([label, count]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-800">{count}</p></div>)}</div>}{errors.length > 0 && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"><h3 className="font-semibold text-red-800">Perlu diperbaiki ({errors.length})</h3><ul className="mt-2 max-h-48 list-disc space-y-1 overflow-auto pl-5 text-sm text-red-700">{errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>}{rows && errors.length === 0 && <button disabled={busy} onClick={() => void apply()} className="mt-5 w-full rounded-xl bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300">Terapkan Impor</button>}</section>}
    {notice && <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">{notice}</div>}
  </div>
}
