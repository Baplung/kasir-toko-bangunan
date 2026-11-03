import { describe, expect, it } from 'vitest'
import { isSessionExpired, SESSION_TTL_MS } from './session'

describe('masa berlaku sesi login', () => {
  it('sesi tetap valid sebelum batas waktu', () => {
    expect(isSessionExpired(Date.now() - SESSION_TTL_MS + 1000)).toBe(false)
  })
  it('sesi kedaluwarsa setelah batas waktu', () => {
    expect(isSessionExpired(Date.now() - SESSION_TTL_MS - 1)).toBe(true)
  })
  it('sesi kedaluwarsa jika timestamp tidak valid', () => {
    expect(isSessionExpired(Number.NaN)).toBe(true)
  })
})
