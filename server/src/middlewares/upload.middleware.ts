import os from 'os'
import path from 'path'
import multer from 'multer'
import type { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware.js'

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

// Write uploads to OS temp dir instead of RAM.
// This prevents 40 MB × concurrent_uploads from filling the Node.js heap.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase()
    const name = `cartiva-upload-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    cb(null, name)
  },
})

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

const wrapMulter = (
  handler: ReturnType<typeof uploader.single | typeof uploader.array>,
  req:     Request,
  res:     Response,
  next:    NextFunction,
): void => {
  handler(req, res, (err) => {
    if (!err) return next()
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Each image must be under 5 MB', 400))
    }
    return next(new AppError(err instanceof Error ? err.message : 'File upload error', 400))
  })
}

export const uploadAvatar = (req: Request, res: Response, next: NextFunction): void =>
  wrapMulter(uploader.single('avatar'), req, res, next)

export const uploadProductImages = (req: Request, res: Response, next: NextFunction): void =>
  wrapMulter(uploader.array('images', 8), req, res, next)
