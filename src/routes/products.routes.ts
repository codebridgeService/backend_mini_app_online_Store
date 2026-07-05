import { Router } from "express"
import multer from "multer"
import * as productsController from "../controllers/products.controller"
import { requireAuth } from "../middleware/auth.middleware"

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.get("/", productsController.getProducts)
router.get("/:id", productsController.getProductById)
router.post("/", requireAuth, productsController.createProduct)
router.put("/:id", requireAuth, productsController.updateProduct)
router.delete("/:id", requireAuth, productsController.deleteProduct)
router.post("/upload", upload.single("file"), productsController.uploadImage)

export default router
