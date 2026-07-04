import '@testing-library/jest-dom/vitest'
import { server } from '../mocks/server.js'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => server.close())
