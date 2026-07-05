import { Request, Response, NextFunction } from "express"
import { db } from "../lib/prisma"
import { AuthRequest } from "../middleware/auth.middleware"

// Middleware helper to ensure SUPER_ADMIN
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ success: false, error: "Forbidden: Super Admin access required" })
  }
  next()
}

export async function getAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [totalStores, totalUsers, stores] = await Promise.all([
      db.store.count(),
      db.user.count(),
      db.store.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { owner: { select: { id: true, name: true, email: true } } },
      }),
    ])

    res.json({ success: true, stats: { totalStores, totalUsers }, recentStores: stores })
  } catch (error) {
    next(error)
  }
}

export async function getAllStores(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const stores = await db.store.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, stores })
  } catch (error) {
    next(error)
  }
}

export async function getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { stores: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, users })
  } catch (error) {
    next(error)
  }
}

// --- Plans ---
export async function getPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await (db as any).plan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { sortOrder: "asc" },
    })
    res.json({ success: true, plans })
  } catch (error) {
    next(error)
  }
}

export async function createPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const body = req.body
    const plan = await (db as any).plan.create({
      data: {
        name: String(body.name),
        description: body.description ? String(body.description) : null,
        priceMonthly: Number(body.priceMonthly || 0),
        priceYearly: Number(body.priceYearly || 0),
        features: Array.isArray(body.features) ? body.features : [],
        maxProducts: Number(body.maxProducts ?? 50),
        maxOrders: Number(body.maxOrders ?? 500),
        maxStaff: Number(body.maxStaff ?? 3),
        isActive: body.isActive ?? true,
        isPopular: body.isPopular ?? false,
        sortOrder: Number(body.sortOrder ?? 0),
      },
      include: { _count: { select: { subscriptions: true } } },
    })
    res.status(201).json({ success: true, plan })
  } catch (error) {
    next(error)
  }
}

export async function updatePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const body = req.body
    const plan = await (db as any).plan.update({
      where: { id },
      data: body,
      include: { _count: { select: { subscriptions: true } } },
    })
    res.json({ success: true, plan })
  } catch (error) {
    next(error)
  }
}

export async function deletePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    await (db as any).plan.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

// --- Subscriptions ---
export async function getSubscriptions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const subscriptions = await (db as any).subscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, subscriptions })
  } catch (error) {
    next(error)
  }
}

export async function updateSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const body = req.body
    const subscription = await (db as any).subscription.update({
      where: { id },
      data: body,
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
      },
    })
    res.json({ success: true, subscription })
  } catch (error) {
    next(error)
  }
}
