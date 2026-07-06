import { Router } from "express"
import * as b2bController from "../controllers/b2b.controller"
import { requireAuth } from "../middleware/auth.middleware"
import { requireSuperAdmin } from "../controllers/admin.controller"

const router = Router()

// All B2B admin routes require auth and ADMIN role
router.use(requireAuth, requireSuperAdmin)

router.get("/buyers", b2bController.getB2BBuyers)
router.put("/buyers/:id/approve", b2bController.approveB2BBuyer)

router.get("/tiers", b2bController.getPriceTiers)
router.post("/tiers", b2bController.createPriceTier)

router.get("/rfqs", b2bController.getRFQs)
router.put("/rfqs/:id", b2bController.updateRFQ)

export default router
