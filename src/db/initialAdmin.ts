import bcrypt from 'bcryptjs'
import { db } from './database'

export function shouldCreateInitialAdmin(userCount: number) {
  return userCount === 0
}

export function validateInitialAdmin(username: string, pin: string) {
  const name = username.trim()
  if (!/^[A-Za-z0-9._-]{3,32}$/.test(name)) {
    return { valid: false, error: 'Nama pengguna harus 3–32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung.' }
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return { valid: false, error: 'PIN harus 4–6 digit angka.' }
  }
  if (/^(\d)\1+$/.test(pin) || ['1234', '12345', '123456', '654321', '0000'].includes(pin)) {
    return { valid: false, error: 'PIN terlalu mudah ditebak. Gunakan kombinasi angka yang lebih unik.' }
  }
  return { valid: true as const }
}

export async function createInitialAdmin(username: string, pin: string) {
  const validation = validateInitialAdmin(username, pin)
  if (!validation.valid) throw new Error(validation.error)
  return db.transaction('rw', db.users, async () => {
    if (!shouldCreateInitialAdmin(await db.users.count())) {
      throw new Error('Akun pengguna sudah tersedia. Silakan masuk.')
    }
    const name = username.trim()
    return db.users.add({
      username: name,
      pin_hash: bcrypt.hashSync(pin, 10),
      role: 'admin',
      active: true,
    })
  })
}
