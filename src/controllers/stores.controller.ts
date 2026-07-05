import { Request, Response, NextFunction } from "express"
import { db } from "../lib/prisma"
import { AuthRequest } from "../middleware/auth.middleware"

export async function getMyStore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id ? String(req.user.id) : ""
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" })
    }

    const store = await db.store.findFirst({
      where: { ownerId: userId },
      include: {
        categories: true,
        brands: true,
      },
    })

    res.json({ success: true, store })
  } catch (error) {
    next(error)
  }
}

export async function getStoreBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug || "")
    const store = await db.store.findUnique({
      where: { slug },
      include: {
        categories: true,
        brands: true,
      },
    })

    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" })
    }

    res.json({ success: true, store })
  } catch (error) {
    next(error)
  }
}

export async function getStoreById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const store = await db.store.findUnique({
      where: { id },
      include: {
        categories: true,
        brands: true,
      },
    })

    if (!store) {
      return res.status(404).json({ success: false, error: "Store not found" })
    }

    res.json({ success: true, store })
  } catch (error) {
    next(error)
  }
}

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")

    const [
      totalOrders,
      pendingOrders,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      revenueAgg,
      recentOrders,
      monthlyRevenue,
    ] = await Promise.all([
      db.order.count({ where: { storeId: id } }),
      db.order.count({ where: { storeId: id, status: "PENDING" } }),
      db.product.count({ where: { storeId: id } }),
      db.product.count({ where: { storeId: id, stockQty: { lte: 5 } } }),
      db.customer.count({ where: { storeId: id } }),
      db.order.aggregate({
        where: { storeId: id },
        _sum: { totalAmount: true },
      }),
      db.order.findMany({
        where: { storeId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
      db.order.groupBy({
        by: ["createdAt"],
        where: {
          storeId: id,
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        _sum: { totalAmount: true },
      }),
    ])

    const sumTotalAmount = revenueAgg?._sum?.totalAmount ?? 0

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalProducts,
        lowStockProducts,
        totalCustomers,
        totalRevenue: sumTotalAmount,
        recentOrders,
        monthlyRevenue,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function updateStore(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const data = req.body

    const store = await db.store.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: String(data.name) }),
        ...(data.slug !== undefined && { slug: String(data.slug) }),
        ...(data.currency !== undefined && { currency: String(data.currency) }),
        ...(data.language !== undefined && { language: String(data.language) }),
        ...(data.logo !== undefined && { logo: data.logo ? String(data.logo) : null }),
        ...(data.telegramBot !== undefined && { telegramBot: data.telegramBot ? String(data.telegramBot) : null }),
        ...(data.bakongLink !== undefined && { bakongLink: data.bakongLink ? String(data.bakongLink) : null }),
        ...(data.abaMerchantLink !== undefined && { abaMerchantLink: data.abaMerchantLink ? String(data.abaMerchantLink) : null }),
      },
    })

    res.json({ success: true, store })
  } catch (error) {
    next(error)
  }
}

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = String(req.query.storeId || "")

    if (!storeId) {
      return res.status(400).json({ success: false, error: "storeId is required" })
    }

    const categories = await db.category.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    })

    res.json({ success: true, categories })
  } catch (error) {
    next(error)
  }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { storeId, name } = req.body
    const storeIdStr = String(storeId || "")
    const nameStr = String(name || "")

    if (!storeIdStr || !nameStr) {
      return res.status(400).json({ success: false, error: "storeId and name are required" })
    }

    const category = await db.category.create({
      data: {
        storeId: storeIdStr,
        name: nameStr,
      },
    })

    res.status(201).json({ success: true, category })
  } catch (error) {
    next(error)
  }
}

export async function getHeroPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      totalStores,
      monthlyRevenue,
      sampleProducts,
    ] = await Promise.all([
      db.order.count(),
      db.order.aggregate({ _sum: { totalAmount: true } }),
      db.product.count(),
      db.customer.count(),
      db.store.count(),
      db.order.groupBy({
        by: ["createdAt"],
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
        _sum: { totalAmount: true },
        orderBy: { createdAt: "asc" },
      }),
      db.product.findMany({
        take: 4,
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          sellPrice: true,
          images: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    const monthMap: Record<string, number> = {}
    for (const row of monthlyRevenue) {
      const label = new Date(row.createdAt).toLocaleString("en", {
        month: "short",
        year: "2-digit",
      })
      monthMap[label] = (monthMap[label] ?? 0) + (row._sum.totalAmount ?? 0)
    }
    const chartData = Object.entries(monthMap).map(([month, total]) => ({
      month,
      total,
    }))

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum?.totalAmount ?? 0,
        totalProducts,
        totalCustomers,
        totalStores,
      },
      chartData,
      products: sampleProducts,
    })
  } catch (error) {
    next(error)
  }
}

// Customers
export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = String(req.params.id || "")
    const customers = await db.customer.findMany({
      where: { storeId },
      include: { orders: { select: { id: true, totalAmount: true } } },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, customers })
  } catch (error) {
    next(error)
  }
}

export async function createCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { storeId, name, email, phone, notes } = req.body
    const customer = await db.customer.create({
      data: {
        storeId: String(storeId || ""),
        name: String(name || ""),
        email: email ? String(email) : null,
        phone: phone ? String(phone) : null,
        notes: notes ? String(notes) : null,
      },
    })
    res.status(201).json({ success: true, customer })
  } catch (error) {
    next(error)
  }
}

export async function updateCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const { name, email, phone, notes } = req.body
    const customer = await db.customer.update({
      where: { id },
      data: {
        name: name ? String(name) : undefined,
        email: email !== undefined ? (email ? String(email) : null) : undefined,
        phone: phone !== undefined ? (phone ? String(phone) : null) : undefined,
        notes: notes !== undefined ? (notes ? String(notes) : null) : undefined,
      },
    })
    res.json({ success: true, customer })
  } catch (error) {
    next(error)
  }
}

export async function deleteCustomer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    await db.customer.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

// Invoices
export async function getInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = String(req.params.id || "")
    const invoices = await db.invoice.findMany({
      where: { order: { storeId } },
      include: {
        order: {
          include: { customer: true, payment: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, invoices })
  } catch (error) {
    next(error)
  }
}

// Payments
export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = String(req.params.id || "")
    const payments = await db.payment.findMany({
      where: { order: { storeId } },
      include: {
        order: { include: { customer: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, payments })
  } catch (error) {
    next(error)
  }
}

// Brands
export async function getBrands(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = String(req.query.storeId || "")
    const brands = await db.brand.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    })
    res.json({ success: true, brands })
  } catch (error) {
    next(error)
  }
}

export async function createBrand(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { storeId, name } = req.body
    const brand = await db.brand.create({
      data: {
        storeId: String(storeId || ""),
        name: String(name || ""),
      },
    })
    res.status(201).json({ success: true, brand })
  } catch (error) {
    next(error)
  }
}
