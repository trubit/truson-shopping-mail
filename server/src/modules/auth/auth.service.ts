import crypto from 'crypto'
import { User } from '../user/user.model.js'
import { AppError } from '../../middlewares/error.middleware.js'
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/email.js'
import { logger } from '../../utils/logger.js'
import type { IUserDocument } from '../user/user.model.js'
import type { RegisterCredentials } from '../../../../src/shared/types/auth.types.js'

// ─── Register ──────────────────────────────────────────────────────────────────
export const registerUser = async (data: RegisterCredentials): Promise<IUserDocument> => {
  const [emailExists, usernameExists] = await Promise.all([
    User.findOne({ email: data.email }),
    User.findOne({ username: data.username }),
  ])

  if (emailExists)    throw new AppError('Email is already registered', 409)
  if (usernameExists) throw new AppError('Username is already taken', 409)

  const user = new User({
    firstName:   data.firstName,
    lastName:    data.lastName,
    username:    data.username.toLowerCase(),
    email:       data.email.toLowerCase(),
    password:    data.password,
    phoneNumber: data.phoneNumber,
    role:        data.role ?? 'user',
  })

  const verifyToken = user.createEmailVerificationToken()
  await user.save()

  await sendVerificationEmail(user.email, user.firstName, verifyToken).catch((err) => {
    logger.warn('Verification email failed to send', { email: user.email, error: (err as Error).message })
  })

  return user
}

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +refreshTokens')

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401)
  }

  if (!user.isActive) throw new AppError('Your account has been deactivated', 403)

  const tokens = generateTokenPair({ userId: user._id.toString(), email: user.email, role: user.role })

  const hashedRefresh = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex')
  user.refreshTokens = [...(user.refreshTokens ?? []).slice(-4), hashedRefresh]
  await user.save({ validateBeforeSave: false })

  return { user, tokens }
}

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logoutUser = async (userId: string, refreshToken: string): Promise<void> => {
  const user = await User.findById(userId).select('+refreshTokens')
  if (!user) return

  const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex')
  user.refreshTokens = (user.refreshTokens ?? []).filter((t) => t !== hashed)
  await user.save({ validateBeforeSave: false })
}

// ─── Refresh Tokens ────────────────────────────────────────────────────────────
export const refreshTokens = async (refreshToken: string) => {
  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError('Invalid or expired refresh token', 401)
  }

  const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const user = await User.findById(payload.userId).select('+refreshTokens')

  if (!user || !(user.refreshTokens ?? []).includes(hashed)) {
    throw new AppError('Refresh token not recognized', 401)
  }

  const tokens = generateTokenPair({ userId: user._id.toString(), email: user.email, role: user.role })

  const newHashed = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex')
  user.refreshTokens = (user.refreshTokens ?? []).filter((t) => t !== hashed).concat(newHashed)
  await user.save({ validateBeforeSave: false })

  return { user, tokens }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return // Silent — don't reveal if email exists

  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  await sendPasswordResetEmail(user.email, user.firstName, resetToken).catch(async () => {
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save({ validateBeforeSave: false })
  })
}

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires +refreshTokens')

  if (!user) throw new AppError('Reset token is invalid or has expired', 400)

  user.password = newPassword
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  user.refreshTokens = []
  await user.save()
}

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = async (token: string): Promise<void> => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex')

  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires')

  if (!user) throw new AppError('Verification link is invalid or has expired', 400)

  user.emailVerified = true
  user.emailVerificationToken = undefined
  user.emailVerificationExpires = undefined
  await user.save({ validateBeforeSave: false })
}

// ─── Get Current User ─────────────────────────────────────────────────────────
export const getCurrentUser = async (userId: string): Promise<IUserDocument> => {
  const user = await User.findById(userId)
  if (!user) throw new AppError('User not found', 404)
  return user
}
