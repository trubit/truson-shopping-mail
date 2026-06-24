export type UserRole = 'user' | 'seller' | 'admin'

export interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  phoneNumber?: string
  role?: UserRole
}
