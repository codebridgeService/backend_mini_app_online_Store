import { Router } from "express"
import * as adminController from "../controllers/admin.controller"
import { requireAuth } from "../middleware/auth.middleware"

const router = Router()

// All admin routes require authentication and SUPER_ADMIN role
router.use(requireAuth, adminController.requireSuperAdmin)

router.get("/stats", adminController.getAdminStats)
router.get("/stores", adminController.getAllStores)
router.get("/users", adminController.getAllUsers)

// Plans
router.get("/plans", adminController.getPlans)
router.post("/plans", adminController.createPlan)
router.put("/plans/:id", adminController.updatePlan)
router.delete("/plans/:id", adminController.deletePlan)

// Subscriptions
router.get("/subscriptions", adminController.getSubscriptions)
router.put("/subscriptions/:id", adminController.updateSubscription)

export default router
