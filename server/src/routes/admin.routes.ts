import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import * as adminController from '../modules/admin/admin.controller.js'
import { approve, block } from '../modules/product/product.controller.js'

const router = Router()

router.use(authenticate, authorize('admin'))

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/stats', adminController.getStats)

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users',                     adminController.listUsers)
router.patch('/users/:id/toggle-active', adminController.toggleUserActive)
router.patch('/users/:id/role',          adminController.changeUserRole)

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products',              adminController.listAllProducts)
router.put('/products/:id/approve',  approve)
router.put('/products/:id/block',    block)

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders',              adminController.listAllOrders)
router.patch('/orders/:id/status', adminController.updateOrderStatus)

export default router
