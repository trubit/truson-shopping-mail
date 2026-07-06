import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../modules/dashboard/dashboard.controller.js'

const router = Router()

router.use(authenticate)

router.get('/unread-count', getUnreadCount)
router.get('/',             getNotifications)
router.put('/read-all',     markAllRead)
router.put('/:id/read',    markRead)

export default router
