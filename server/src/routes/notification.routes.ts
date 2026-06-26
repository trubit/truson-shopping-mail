import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/unread-count', (_req, res) => {
  res.json({ success: true, data: { count: 0 } })
})

router.get('/', (_req, res) => {
  res.json({ success: true, data: { notifications: [], total: 0 } })
})

router.put('/:id/read', (req, res) => {
  res.json({ success: true, data: { id: req.params.id } })
})

router.put('/read-all', (_req, res) => {
  res.json({ success: true, data: null })
})

export default router
