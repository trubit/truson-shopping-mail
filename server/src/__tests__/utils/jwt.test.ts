import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
} from '../../utils/jwt.js'
import type { TokenPayload } from '../../../../src/shared/types/auth.types.js'

const testPayload: Omit<TokenPayload, 'iat' | 'exp'> = {
  userId: 'user-abc-123',
  email: 'testuser@example.com',
  role: 'user',
}

describe('signAccessToken', () => {
  it('returns a non-empty string', () => {
    const token = signAccessToken(testPayload)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('produces a valid JWT with three parts', () => {
    const token = signAccessToken(testPayload)
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('signRefreshToken', () => {
  it('returns a non-empty string', () => {
    const token = signRefreshToken(testPayload)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('produces a different token from the access token', () => {
    const access = signAccessToken(testPayload)
    const refresh = signRefreshToken(testPayload)
    expect(access).not.toBe(refresh)
  })
})

describe('verifyAccessToken', () => {
  it('decodes and returns the original payload', () => {
    const token = signAccessToken(testPayload)
    const decoded = verifyAccessToken(token)
    expect(decoded.userId).toBe(testPayload.userId)
    expect(decoded.email).toBe(testPayload.email)
    expect(decoded.role).toBe(testPayload.role)
  })

  it('throws for an invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.value')).toThrow()
  })

  it('throws when verified with the wrong secret', () => {
    const tampered = jwt.sign(testPayload, 'wrong-secret')
    expect(() => verifyAccessToken(tampered)).toThrow()
  })
})

describe('verifyRefreshToken', () => {
  it('decodes and returns the original payload', () => {
    const token = signRefreshToken(testPayload)
    const decoded = verifyRefreshToken(token)
    expect(decoded.userId).toBe(testPayload.userId)
    expect(decoded.email).toBe(testPayload.email)
  })

  it('throws for an invalid token', () => {
    expect(() => verifyRefreshToken('bad.token.here')).toThrow()
  })
})

describe('generateTokenPair', () => {
  it('returns both accessToken and refreshToken', () => {
    const pair = generateTokenPair(testPayload)
    expect(pair).toHaveProperty('accessToken')
    expect(pair).toHaveProperty('refreshToken')
  })

  it('both tokens are valid JWTs', () => {
    const { accessToken, refreshToken } = generateTokenPair(testPayload)
    expect(accessToken.split('.')).toHaveLength(3)
    expect(refreshToken.split('.')).toHaveLength(3)
  })

  it('accessToken and refreshToken are different', () => {
    const { accessToken, refreshToken } = generateTokenPair(testPayload)
    expect(accessToken).not.toBe(refreshToken)
  })

  it('accessToken payload matches original', () => {
    const { accessToken } = generateTokenPair(testPayload)
    const decoded = verifyAccessToken(accessToken)
    expect(decoded.userId).toBe(testPayload.userId)
  })
})
