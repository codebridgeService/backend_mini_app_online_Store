import { Router } from "express"
import * as ordersController from "../controllers/orders.controller"
import { requireAuth } from "../middleware/auth.middleware"

const router = Router()

router.get("/", ordersController.getOrders)
router.get("/:id", ordersController.getOrderById)
router.post("/storefront", ordersController.createStorefrontOrder)
router.put("/:id/status", requireAuth, ordersController.updateOrderStatus)
router.put("/:id/payment-status", requireAuth, ordersController.updatePaymentStatus)
router.delete("/:id", requireAuth, ordersController.deleteOrder)

export default router
