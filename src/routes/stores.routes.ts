import { Router } from "express"
import * as storesController from "../controllers/stores.controller"
import { requireAuth } from "../middleware/auth.middleware"

const router = Router()

router.get("/me", requireAuth, storesController.getMyStore)
router.get("/hero-preview", storesController.getHeroPreview)
router.get("/slug/:slug", storesController.getStoreBySlug)

// Customers global / non-id routes
router.post("/customers", requireAuth, storesController.createCustomer)
router.put("/customers/:id", requireAuth, storesController.updateCustomer)
router.delete("/customers/:id", requireAuth, storesController.deleteCustomer)

// Brands & Categories
router.get("/brands/list", storesController.getBrands)
router.post("/brands", requireAuth, storesController.createBrand)
router.get("/categories/list", storesController.getCategories)
router.post("/categories", requireAuth, storesController.createCategory)

// Store ID routes
router.get("/:id", storesController.getStoreById)
router.get("/:id/stats", requireAuth, storesController.getDashboardStats)
router.get("/:id/customers", requireAuth, storesController.getCustomers)
router.get("/:id/invoices", requireAuth, storesController.getInvoices)
router.get("/:id/payments", requireAuth, storesController.getPayments)
router.put("/:id", requireAuth, storesController.updateStore)

export default router
