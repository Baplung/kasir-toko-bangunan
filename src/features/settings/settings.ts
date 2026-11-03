export function validateUserInput(input: { username: string; pin: string; role: string }) {
  if (!input.username.trim()) return 'Nama pengguna wajib diisi.'
  if (!/^\d{4,6}$/.test(input.pin)) return 'PIN harus terdiri dari 4 sampai 6 digit angka.'
  if (input.role !== 'admin' && input.role !== 'kasir') return 'Peran pengguna tidak valid.'
  return ''
}
