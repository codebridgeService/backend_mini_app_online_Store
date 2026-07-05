import { Request, Response, NextFunction } from "express"
import { db } from "../lib/prisma"
import { AuthRequest } from "../middleware/auth.middleware"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "123456789",
  api_secret: process.env.CLOUDINARY_API_SECRET || "abcdefghijklmnop",
})

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = String(req.query.storeId || "")
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined
    const brandId = req.query.brandId ? String(req.query.brandId) : undefined
    const status = req.query.status ? String(req.query.status) : undefined

    if (!storeId) {
      return res.status(400).json({ success: false, error: "storeId is required" })
    }

    const products = await db.product.findMany({
      where: {
        storeId,
        ...(categoryId && { categoryId }),
        ...(brandId && { brandId }),
        ...(status && { status }),
      },
      include: { category: true, brand: true, variants: true },
      orderBy: { createdAt: "desc" },
    })

    res.json({ success: true, products })
  } catch (error) {
    next(error)
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const storeId = req.query.storeId ? String(req.query.storeId) : undefined

    const product = await db.product.findFirst({
      where: {
        id,
        ...(storeId && { storeId }),
      },
      include: { category: true, brand: true, variants: true },
    })

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    res.json({ success: true, product })
  } catch (error) {
    next(error)
  }
}

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const {
      storeId,
      name,
      description,
      sku,
      barcode,
      costPrice,
      sellPrice,
      stockQty,
      status,
      categoryId,
      brandId,
      images,
      variants,
    } = req.body

    const storeIdStr = String(storeId || "")

    if (!storeIdStr || !name || sellPrice === undefined) {
      return res.status(400).json({ success: false, error: "storeId, name, and sellPrice are required" })
    }

    const product = await db.product.create({
      data: {
        storeId: storeIdStr,
        name: String(name),
        description: description ? String(description) : null,
        sku: sku ? String(sku) : null,
        barcode: barcode ? String(barcode) : null,
        costPrice: Number(costPrice || 0),
        sellPrice: Number(sellPrice),
        stockQty: Number(stockQty || 0),
        status: status ? String(status) : "ACTIVE",
        categoryId: categoryId ? String(categoryId) : null,
        brandId: brandId ? String(brandId) : null,
        images: Array.isArray(images) ? images.map(String) : [],
        variants: {
          create: (variants || []).map((v: any) => ({
            name: String(v.name),
            value: String(v.value),
            additionalPrice: Number(v.price || 0),
            stockQty: Number(stockQty || 0),
          })),
        },
      },
      include: { variants: true },
    })

    res.status(201).json({ success: true, product })
  } catch (error) {
    next(error)
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const data = req.body

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: String(data.name) }),
        ...(data.description !== undefined && { description: data.description ? String(data.description) : null }),
        ...(data.sku !== undefined && { sku: data.sku ? String(data.sku) : null }),
        ...(data.barcode !== undefined && { barcode: data.barcode ? String(data.barcode) : null }),
        ...(data.costPrice !== undefined && { costPrice: Number(data.costPrice) }),
        ...(data.sellPrice !== undefined && { sellPrice: Number(data.sellPrice) }),
        ...(data.stockQty !== undefined && { stockQty: Number(data.stockQty) }),
        ...(data.status !== undefined && { status: String(data.status) }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId ? String(data.categoryId) : null }),
        ...(data.brandId !== undefined && { brandId: data.brandId ? String(data.brandId) : null }),
        ...(data.images !== undefined && { images: Array.isArray(data.images) ? data.images.map(String) : [] }),
        ...(data.variants && {
          variants: {
            deleteMany: {},
            create: data.variants.map((v: any) => ({
              name: String(v.name),
              value: String(v.value),
              additionalPrice: Number(v.price || 0),
              stockQty: Number(data.stockQty || existing.stockQty),
            })),
          },
        }),
      },
      include: { variants: true },
    })

    res.json({ success: true, product })
  } catch (error) {
    next(error)
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, error: "Product not found" })
    }

    await db.product.delete({ where: { id } })
    res.json({ success: true, message: "Product deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file
    const { base64Image } = req.body

    let uploadSource = ""
    if (file) {
      const b64 = Buffer.from(file.buffer).toString("base64")
      uploadSource = `data:${file.mimetype};base64,${b64}`
    } else if (base64Image) {
      uploadSource = String(base64Image)
    } else {
      return res.status(400).json({ success: false, error: "No image file or base64 data provided" })
    }

    try {
      const result = await cloudinary.uploader.upload(uploadSource, {
        folder: "mini_app_products",
      })
      return res.json({
        success: true,
        url: result.secure_url,
        public_id: result.public_id,
      })
    } catch (cloudErr) {
      console.warn("Cloudinary upload failed, falling back to data URL for dev:", cloudErr)
      return res.json({
        success: true,
        url: uploadSource,
        public_id: `dev_fallback_${Date.now()}`,
      })
    }
  } catch (error) {
    next(error)
  }
}
