import multer from 'multer'
import type { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware.js'

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const storage = multer.memoryStorage()

const uploader = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'))
    }
  },
})

export const uploadAvatar = (req: Request, res: Response, next: NextFunction): void => {
  uploader.single('avatar')(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Image must be under 5 MB', 400))
    }
    return next(new AppError(err instanceof Error ? err.message : 'File upload error', 400))
  })
}
