import { Router }                      from 'express'
import { authenticate, authorize }      from '../middlewares/auth.middleware.js'
import * as adminController             from '../modules/admin/admin.controller.js'
import { approve, block }               from '../modules/product/product.controller.js'
import { dashboardLimiter }             from '../middlewares/rateLimiter.middleware.js'
import rateLimit                        from 'express-rate-limit'

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Too many admin requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders:   false,
})

const router = Router()

router.use(authenticate, authorize('admin'))
router.use(adminLimiter)

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/stats',           adminController.getStats)

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users',                         adminController.listUsers)
router.patch('/users/:id/toggle-active',     adminController.toggleUserActive)
router.patch('/users/:id/role',              adminController.changeUserRole)
router.delete('/users/:id',                  adminController.deleteUser)

// ─── Sellers ──────────────────────────────────────────────────────────────────
router.get('/sellers',                       adminController.listSellers)
router.patch('/sellers/:id/verify',          adminController.verifySeller)

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products',                      adminController.listAllProducts)
router.put('/products/:id/approve',          approve)
router.put('/products/:id/block',            block)

// ─── Orders ───────────────────────────────────────────────────────────────────
router.get('/orders',                        adminController.listAllOrders)
router.patch('/orders/:id/status',           adminController.updateOrderStatus)

// ─── Payments ─────────────────────────────────────────────────────────────────
router.get('/payments',                      adminController.listPayments)

// ─── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics',   dashboardLimiter,  adminController.getAnalytics)

// ─── Fraud & Audit ────────────────────────────────────────────────────────────
router.get('/fraud-alerts',                   adminController.getFraudAlerts)
router.get('/audit-logs',                     adminController.getAuditLogs)

// ─── Reports ──────────────────────────────────────────────────────────────────
router.get('/reports',     dashboardLimiter,  adminController.getReports)

export default router
