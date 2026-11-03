import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { createInitialAdmin, validateInitialAdmin } from '../db/initialAdmin'

export default function InitialSetupPage({ onComplete }: { onComplete: () => void }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const validation = validateInitialAdmin(username, pin)
    if (!validation.valid) { setError(validation.error); return }
    if (pin !== confirmPin) { setError('Konfirmasi PIN belum sama.'); return }

    setSaving(true)
    try {
      await createInitialAdmin(username, pin)
      const loggedIn = await login(username.trim(), pin)
      if (!loggedIn) throw new Error('Akun Admin berhasil dibuat, tetapi gagal masuk. Silakan masuk dengan akun yang baru dibuat.')
      onComplete()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Akun Admin gagal dibuat.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-teal-700 text-2xl font-bold text-white">TB</div>
        <h1 className="text-xl font-bold text-slate-800">Siapkan Akun Admin</h1>
        <p className="mt-2 text-sm text-slate-500">Buat akun Admin pertama untuk aplikasi toko ini.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="initial-username" className="mb-1 block text-sm font-medium text-slate-700">Nama pengguna</label>
          <input id="initial-username" autoComplete="username" required minLength={3} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="Contoh: admin.toko" />
          <p className="mt-1 text-xs text-slate-500">3–32 karakter; huruf, angka, titik, garis bawah, atau tanda hubung.</p>
        </div>
        <div>
          <label htmlFor="initial-pin" className="mb-1 block text-sm font-medium text-slate-700">PIN Admin</label>
          <input id="initial-pin" type="password" inputMode="numeric" autoComplete="new-password" required minLength={4} maxLength={6} value={pin} onChange={(event) => setPin(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="4–6 digit angka" />
        </div>
        <div>
          <label htmlFor="confirm-pin" className="mb-1 block text-sm font-medium text-slate-700">Ulangi PIN</label>
          <input id="confirm-pin" type="password" inputMode="numeric" autoComplete="new-password" required minLength={4} maxLength={6} value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-800 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600" placeholder="Masukkan PIN sekali lagi" />
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}
        <button disabled={saving} className="w-full rounded-lg bg-teal-700 py-2.5 font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50">{saving ? 'Membuat akun…' : 'Buat Akun Admin'}</button>
      </form>
      <p className="mt-6 text-center text-xs text-slate-400">Mode offline • Akun ini hanya disimpan di perangkat ini</p>
    </div>
  </div>
}
