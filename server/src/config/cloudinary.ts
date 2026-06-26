import { v2 as cloudinary, type UploadApiOptions } from 'cloudinary'
import streamifier from 'streamifier'
import { env } from './env.js'

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
})

export const isCloudinaryConfigured = (): boolean =>
  !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)

export interface CloudinaryUploadResult {
  url:      string
  publicId: string
}

export const uploadImageBuffer = (
  buffer: Buffer,
  folder = 'trusonshopp/avatars',
): Promise<CloudinaryUploadResult> =>
  new Promise((resolve, reject) => {
    const options: UploadApiOptions = {
      folder,
      overwrite:     true,
      resource_type: 'image',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'center' }],
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
      resolve({ url: result.secure_url, publicId: result.public_id })
    })
    streamifier.createReadStream(buffer).pipe(stream)
  })

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId)
}

export { cloudinary }
