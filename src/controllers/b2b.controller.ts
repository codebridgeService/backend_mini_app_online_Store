import { Response, NextFunction } from "express"
import { db } from "../lib/prisma"
import { AuthRequest } from "../middleware/auth.middleware"

// ── B2B Buyers & Verification ────────────────────────────────────────────────
export async function getB2BBuyers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const buyers = await db.user.findMany({
      where: { role: "USER" },
      include: {
        b2bProfile: {
          include: { priceTier: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({ success: true, buyers })
  } catch (error) {
    next(error)
  }
}

export async function approveB2BBuyer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status, creditLimit, priceTierId } = req.body

    const existingUser = await db.user.findUnique({
      where: { id: String(id) },
      include: { b2bProfile: true },
    })

    if (!existingUser) {
      return res.status(404).json({ success: false, error: "Buyer not found" })
    }

    const updatedProfile = await (db as any).b2BBuyerProfile.upsert({
      where: { userId: existingUser.id },
      update: {
        status: status || "APPROVED",
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : 5000,
        priceTierId: priceTierId || null,
      },
      create: {
        userId: existingUser.id,
        companyName: existingUser.name || "Business Account",
        status: status || "APPROVED",
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : 5000,
        priceTierId: priceTierId || null,
      },
      include: { priceTier: true },
    })

    res.json({ success: true, profile: updatedProfile })
  } catch (error) {
    next(error)
  }
}

// ── Wholesale Price Tiers ────────────────────────────────────────────────────
export async function getPriceTiers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tiers = await (db as any).priceTier.findMany({
      orderBy: { discountPercentage: "asc" },
      include: { _count: { select: { buyers: true } } },
    })
    res.json({ success: true, tiers })
  } catch (error) {
    next(error)
  }
}

export async function createPriceTier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, discountPercentage, minOrderAmount } = req.body
    if (!name) {
      return res.status(400).json({ success: false, error: "Tier name is required" })
    }

    const tier = await (db as any).priceTier.create({
      data: {
        name,
        discountPercentage: Number(discountPercentage) || 0,
        minOrderAmount: Number(minOrderAmount) || 0,
      },
    })
    res.status(201).json({ success: true, tier })
  } catch (error) {
    next(error)
  }
}

// ── Request for Quotes (RFQs) ────────────────────────────────────────────────
export async function getRFQs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rfqs = await (db as any).quotation.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true } },
        items: { include: { product: { select: { name: true, sku: true, sellPrice: true } } } },
      },
      orderBy: { createdAt: "desc" },
    })
    res.json({ success: true, rfqs })
  } catch (error) {
    next(error)
  }
}

export async function updateRFQ(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { status, adminNotes, quotedPrice } = req.body

    const updated = await (db as any).quotation.update({
      where: { id: String(id) },
      data: {
        status: status || undefined,
        adminNotes: adminNotes !== undefined ? adminNotes : undefined,
        totalAmount: quotedPrice !== undefined ? Number(quotedPrice) : undefined,
      },
    })
    res.json({ success: true, rfq: updated })
  } catch (error) {
    next(error)
  }
}
