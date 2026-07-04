import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from '../../validators/auth.validators.js'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'secret' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('password')
  })
})

describe('registerSchema', () => {
  const validPayload = {
    firstName: 'Alice',
    lastName: 'Smith',
    username: 'alice_smith',
    email: 'alice@example.com',
    password: 'SecurePass1!',
    role: 'user' as const,
  }

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(validPayload).success).toBe(true)
  })

  it('rejects first name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validPayload, firstName: 'A' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('firstName')
  })

  it('rejects last name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validPayload, lastName: 'S' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('lastName')
  })

  it('rejects username shorter than 3 characters', () => {
    const result = registerSchema.safeParse({ ...validPayload, username: 'ab' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('username')
  })

  it('rejects username with uppercase letters', () => {
    const result = registerSchema.safeParse({ ...validPayload, username: 'Alice' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('username')
  })

  it('rejects username with hyphens', () => {
    const result = registerSchema.safeParse({ ...validPayload, username: 'alice-smith' })
    expect(result.success).toBe(false)
  })

  it('accepts username with underscores and numbers', () => {
    const result = registerSchema.safeParse({ ...validPayload, username: 'alice_42' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...validPayload, email: 'not-an-email' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validPayload, password: 'Ab1!' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('password')
  })

  it('rejects password without uppercase letter', () => {
    const result = registerSchema.safeParse({ ...validPayload, password: 'securepass1!' })
    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({ ...validPayload, password: 'SecurePass!' })
    expect(result.success).toBe(false)
  })

  it('rejects password without special character', () => {
    const result = registerSchema.safeParse({ ...validPayload, password: 'SecurePass1' })
    expect(result.success).toBe(false)
  })

  it('defaults role to "user" when omitted', () => {
    const { role: _, ...noRole } = validPayload
    const result = registerSchema.safeParse(noRole)
    expect(result.success).toBe(true)
    expect(result.data?.role).toBe('user')
  })

  it('accepts "seller" as role', () => {
    const result = registerSchema.safeParse({ ...validPayload, role: 'seller' })
    expect(result.success).toBe(true)
  })

  it('accepts optional phone number', () => {
    const result = registerSchema.safeParse({ ...validPayload, phoneNumber: '+1 555 123 4567' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid phone number format', () => {
    const result = registerSchema.safeParse({ ...validPayload, phoneNumber: 'abc' })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'user@example.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  const validReset = {
    token: 'valid-reset-token-abc123',
    password: 'NewSecure1!',
    confirmPassword: 'NewSecure1!',
  }

  it('accepts matching passwords with valid token', () => {
    expect(resetPasswordSchema.safeParse(validReset).success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({
      ...validReset,
      confirmPassword: 'Different1!',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('confirmPassword')
  })

  it('rejects missing token', () => {
    const result = resetPasswordSchema.safeParse({ ...validReset, token: '' })
    expect(result.success).toBe(false)
  })

  it('rejects weak new password', () => {
    const result = resetPasswordSchema.safeParse({
      ...validReset,
      password: 'weakpassword',
      confirmPassword: 'weakpassword',
    })
    expect(result.success).toBe(false)
  })
})
