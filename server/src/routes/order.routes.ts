import { Router } from 'express'
import * as orderController from '../modules/order/order.controller.js'
import { authenticate }     from '../middlewares/auth.middleware.js'
import { validate }         from '../middlewares/validate.middleware.js'
import { createOrderSchema } from '../../../src/shared/validators/payment.validators.js'

const router = Router()

router.use(authenticate)

router.post('/',        validate(createOrderSchema), orderController.createOrder)
router.get('/',         orderController.getMyOrders)
router.get('/:id',      orderController.getOrder)

export default router
