import type { UserRole } from './auth.types.js'

export interface IUser {
  _id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  address?: IAddress
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface IAddress {
  street: string
  city: string
  state: string
  country: string
  zipCode: string
}

export interface IPublicUser {
  _id: string
  name: string
  avatar?: string
  role: UserRole
}
