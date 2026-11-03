import { describe, expect, it } from 'vitest'
import { shouldCreateInitialAdmin, validateInitialAdmin } from './initialAdmin'

describe('first-run administrator setup', () => {
  it('requests administrator setup only when no users exist', () => {
    expect(shouldCreateInitialAdmin(0)).toBe(true)
    expect(shouldCreateInitialAdmin(1)).toBe(false)
  })

  it('accepts a username and 4-6 digit PIN', () => {
    expect(validateInitialAdmin('admin.toko', '4826')).toEqual({ valid: true })
    expect(validateInitialAdmin('kasir_utama', '482691')).toEqual({ valid: true })
  })

  it('rejects invalid usernames', () => {
    expect(validateInitialAdmin('ab', '4826').valid).toBe(false)
    expect(validateInitialAdmin('admin toko', '4826').valid).toBe(false)
  })

  it('rejects short, long, or non-numeric PINs', () => {
    expect(validateInitialAdmin('admin', '123').valid).toBe(false)
    expect(validateInitialAdmin('admin', '1234567').valid).toBe(false)
    expect(validateInitialAdmin('admin', '12a4').valid).toBe(false)
  })
})
