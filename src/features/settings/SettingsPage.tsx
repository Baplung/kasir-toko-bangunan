import { useCallback, useEffect, useState } from 'react'
import bcrypt from 'bcryptjs'
import { db, type StoreSetting, type User } from '../../db/database'
import { useAuth } from '../../context/AuthContext'
import { validateUserInput } from './settings'

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<Record<string, string>>({ store_name: '', store_address: '', store_phone: '' })
  const [users, setUsers] = useState<User[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [storeBusy, setStoreBusy] = useState(false)
  const [userForm, setUserForm] = useState({ username: '', pin: '', role: 'kasir' as 'admin' | 'kasir' })
  const [userError, setUserError] = useState('')
  const [pinUser, setPinUser] = useState<User | null>(null)
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')

  const load = useCallback(async () => {
    const [stored, accountRows] = await Promise.all([db.storeSettings.toArray(), db.users.toArray()])
    setSettings((current) => ({ ...current, ...Object.fromEntries(stored.map((item) => [item.key, item.value])) }))
    accountRows.sort((a, b) => a.username.localeCompare(b.username))
    setUsers(accountRows)
  }, [])
  useEffect(() => { void load() }, [load])

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice(''); setStoreBusy(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        const current = await db.storeSettings.where('key').equals(key).first()
        if (current?.id) await db.storeSettings.update(current.id, { value: value.trim() })
        else await db.storeSettings.add({ key, value: value.trim() } as StoreSetting)
      }
      setNotice('Identitas toko berhasil disimpan.')
    } catch { setError('Pengaturan toko gagal disimpan.') }
    finally { setStoreBusy(false) }
  }

  const addUser = async (event: React.FormEvent) => {
    event.preventDefault(); setUserError('')
    const validation = validateUserInput(userForm)
    if (validation) { setUserError(validation); return }
    if (await db.users.where('username').equals(userForm.username.trim()).first()) { setUserError('Nama pengguna sudah digunakan.'); return }
    await db.users.add({ username: userForm.username.trim(), pin_hash: bcrypt.hashSync(userForm.pin, 10), role: userForm.role, active: true })
    setUserForm({ username: '', pin: '', role: 'kasir' }); setNotice('Akun pengguna berhasil dibuat.'); await load()
    window.setTimeout(() => setNotice(''), 3000)
  }

  const toggleUser = async (account: User) => {
    if (!account.id || account.id === user?.id) return
    const activeAdmins = users.filter((u) => u.active && u.role === 'admin').length
    if (account.active && account.role === 'admin' && activeAdmins <= 1) { setUserError('Tidak dapat menonaktifkan admin terakhir.'); return }
    if (!window.confirm(`${account.active ? 'Nonaktifkan' : 'Aktifkan'} akun ${account.username}?`)) return
    await db.users.update(account.id, { active: !account.active }); setUserError(''); await load()
  }

  const changePin = async (event: React.FormEvent) => {
    event.preventDefault(); setPinError('')
    if (!pinUser?.id) return
    const validation = validateUserInput({ username: pinUser.username, pin: newPin, role: pinUser.role })
    if (validation && validation !== 'Nama pengguna wajib diisi.') { setPinError(validation); return }
    await db.users.update(pinUser.id, { pin_hash: bcrypt.hashSync(newPin, 10) })
    setPinUser(null); setNewPin(''); setNotice(`PIN untuk ${pinUser.username} berhasil diperbarui.`)
    window.setTimeout(() => setNotice(''), 3000)
  }

  return <div className="p-4 lg:p-6 max-w-6xl space-y-6">
    <header><h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1><p className="mt-1 text-sm text-slate-500">Atur identitas toko dan akun pengguna aplikasi.</p></header>
    {notice && <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{notice}</div>}
    <form onSubmit={saveSettings} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div><h2 className="font-semibold text-slate-800">Identitas Toko</h2><p className="text-sm text-slate-500 mt-1">Informasi ini ditampilkan pada struk transaksi.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Toko *</label><input required value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon</label><input value={settings.store_phone} onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div><div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label><textarea rows={2} value={settings.store_address} onChange={(e) => setSettings({ ...settings, store_address: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-800" /></div></div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={storeBusy} className="rounded-xl bg-teal-700 px-5 py-2.5 font-semibold text-white disabled:bg-slate-300">Simpan Identitas Toko</button>
    </form>
    <section className="grid grid-cols-1 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)] gap-6 items-start">
      <form onSubmit={addUser} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"><div><h2 className="font-semibold text-slate-800">Tambah Pengguna</h2><p className="mt-1 text-sm text-slate-500">PIN harus 4–6 digit angka.</p></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Nama Pengguna *</label><input required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-slate-800" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">PIN *</label><input required type="password" inputMode="numeric" maxLength={6} value={userForm.pin} onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })} className="w-full rounded-lg border px-3 py-2.5 text-slate-800" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Peran *</label><select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'kasir' })} className="w-full rounded-lg border px-3 py-2.5 text-slate-800"><option value="kasir">Kasir</option><option value="admin">Admin</option></select></div>{userError && <p role="alert" className="text-sm text-red-700">{userError}</p>}<button className="w-full rounded-xl bg-teal-700 py-2.5 font-semibold text-white">Buat Akun</button></form>
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-5 border-b"><h2 className="font-semibold text-slate-800">Daftar Pengguna</h2><p className="mt-1 text-xs text-slate-500">PIN tersimpan dalam bentuk hash dan tidak ditampilkan.</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="text-left px-4 py-3">Nama Pengguna</th><th className="text-left px-4 py-3">Peran</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{users.map((account) => <tr key={account.id}><td className="px-4 py-3 font-medium text-slate-800">{account.username}{account.id === user?.id && <span className="ml-2 text-xs text-teal-700">(Anda)</span>}</td><td className="px-4 py-3 capitalize text-slate-600">{account.role}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${account.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{account.active ? 'Aktif' : 'Nonaktif'}</span></td><td className="px-4 py-3 text-right whitespace-nowrap"><button onClick={() => { setPinUser(account); setNewPin(''); setPinError('') }} className="rounded-md px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">Ubah PIN</button>{account.id !== user?.id && <button onClick={() => void toggleUser(account)} className={`ml-1 rounded-md px-2 py-1 text-xs ${account.active ? 'text-red-700 hover:bg-red-50' : 'text-emerald-700 hover:bg-emerald-50'}`}>{account.active ? 'Nonaktifkan' : 'Aktifkan'}</button>}</td></tr>)}</tbody></table></div></section>
    </section>
    {pinUser && <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"><form onSubmit={changePin} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"><h2 className="text-lg font-bold text-slate-800">Ubah PIN</h2><p className="mt-1 text-sm text-slate-500">Pengguna: {pinUser.username}</p><label className="mt-4 block text-sm font-medium text-slate-700 mb-1">PIN baru</label><input required type="password" inputMode="numeric" minLength={4} maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-slate-800" />{pinError && <p role="alert" className="mt-2 text-sm text-red-700">{pinError}</p>}<div className="mt-5 flex gap-3"><button type="button" onClick={() => setPinUser(null)} className="flex-1 rounded-lg bg-slate-100 py-2.5 font-medium text-slate-700">Batal</button><button className="flex-1 rounded-lg bg-teal-700 py-2.5 font-semibold text-white">Simpan PIN</button></div></form></div>}
  </div>
}
