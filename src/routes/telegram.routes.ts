import { Router } from "express"
import * as telegramController from "../controllers/telegram.controller"

const router = Router()

router.post("/", telegramController.handleWebhook)

export default router
