import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import helmet from "helmet"
import { errorHandler } from "./middleware/error.middleware"

import authRoutes from "./routes/auth.routes"
import productsRoutes from "./routes/products.routes"
import ordersRoutes from "./routes/orders.routes"
import storesRoutes from "./routes/stores.routes"
import telegramRoutes from "./routes/telegram.routes"
import adminRoutes from "./routes/admin.routes"

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
)
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productsRoutes)
app.use("/api/orders", ordersRoutes)
app.use("/api/stores", storesRoutes)
app.use("/api/telegram", telegramRoutes)
app.use("/api/admin", adminRoutes)

// Error Handler Middleware
app.use(errorHandler)

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Backend Express API server running on http://localhost:${PORT}`)
  })
}

export default app
