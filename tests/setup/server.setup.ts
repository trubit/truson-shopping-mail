import mongoose from 'mongoose'
import { afterAll, beforeAll } from 'vitest'

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env['MONGODB_URI']!)
  }
})

afterAll(async () => {
  const { collections } = mongoose.connection
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
  await mongoose.connection.close()
})
