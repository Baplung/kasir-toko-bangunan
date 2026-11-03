import { describe, expect, it } from 'vitest'
import { validateUserInput } from './settings'

describe('validasi akun pengguna', () => {
  it('menerima username, PIN numerik, dan peran yang valid', () => {
    expect(validateUserInput({ username: 'kasir2', pin: '4821', role: 'kasir' })).toBe('')
  })
  it('menolak username kosong', () => {
    expect(validateUserInput({ username: '  ', pin: '4821', role: 'kasir' })).toBe('Nama pengguna wajib diisi.')
  })
  it('menolak PIN yang bukan 4 sampai 6 digit angka', () => {
    expect(validateUserInput({ username: 'kasir2', pin: '12ab', role: 'kasir' })).toBe('PIN harus terdiri dari 4 sampai 6 digit angka.')
  })
  it('menolak peran yang tidak dikenal', () => {
    expect(validateUserInput({ username: 'kasir2', pin: '4821', role: 'owner' })).toBe('Peran pengguna tidak valid.')
  })
})
