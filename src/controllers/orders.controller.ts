import { Request, Response, NextFunction } from "express"
import { db } from "../lib/prisma"
import { AuthRequest } from "../middleware/auth.middleware"

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const storeId = String(req.query.storeId || "")
    const status = req.query.status ? String(req.query.status) : undefined

    if (!storeId) {
      return res.status(400).json({ success: false, error: "storeId is required" })
    }

    const orders = await db.order.findMany({
      where: {
        storeId,
        ...(status && { status: status as any }),
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({ success: true, orders })
  } catch (error) {
    next(error)
  }
}

export async function getOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        payment: true,
      },
    })

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" })
    }

    res.json({ success: true, order })
  } catch (error) {
    next(error)
  }
}

export async function createStorefrontOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      storeId,
      customer,
      items,
      paymentMethod,
      totalAmount,
    } = req.body

    const storeIdStr = String(storeId || "")

    if (!storeIdStr || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "storeId and items are required" })
    }

    // 1. Create or find customer
    let dbCustomer = null
    if (customer?.phone) {
      dbCustomer = await db.customer.findFirst({
        where: { storeId: storeIdStr, phone: String(customer.phone) },
      })
    }

    if (!dbCustomer) {
      dbCustomer = await db.customer.create({
        data: {
          storeId: storeIdStr,
          name: customer?.name ? String(customer.name) : "Guest",
          phone: customer?.phone ? String(customer.phone) : null,
          notes: customer?.address ? String(customer.address) : null,
        },
      })
    } else if (customer?.address || customer?.name) {
      dbCustomer = await db.customer.update({
        where: { id: dbCustomer.id },
        data: {
          ...(customer.name && { name: String(customer.name) }),
          ...(customer.address && { notes: String(customer.address) }),
        },
      })
    }

    // 2. Create the order with items and payment in a transaction
    const order = await db.order.create({
      data: {
        storeId: storeIdStr,
        customerId: dbCustomer.id,
        status: "PENDING",
        totalAmount: Number(totalAmount || 0),
        items: {
          create: items.map((item: any) => ({
            productId: String(item.productId),
            quantity: Number(item.quantity || item.qty || 1),
            price: Number(item.price || 0),
          })),
        },
        payment: {
          create: {
            amount: Number(totalAmount || 0),
            method: paymentMethod ? String(paymentMethod) : "COD",
            status: "PENDING",
          },
        },
      },
      include: {
        items: true,
        payment: true,
      },
    })

    // Decrement stock for products
    for (const item of items) {
      if (item.productId) {
        await db.product.updateMany({
          where: { id: String(item.productId), stockQty: { gt: 0 } },
          data: { stockQty: { decrement: Number(item.quantity || item.qty || 1) } },
        }).catch(() => {})
      }
    }

    res.status(201).json({ success: true, orderId: order.id, order })
  } catch (error) {
    next(error)
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ success: false, error: "status is required" })
    }

    const order = await db.order.update({
      where: { id },
      data: { status: String(status) as any },
    })

    res.json({ success: true, order })
  } catch (error) {
    next(error)
  }
}

export async function updatePaymentStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    const { paymentStatus } = req.body

    if (!paymentStatus) {
      return res.status(400).json({ success: false, error: "paymentStatus is required" })
    }

    const existingPayment = await db.payment.findUnique({ where: { orderId: id } })
    if (existingPayment) {
      const updatedPayment = await db.payment.update({
        where: { orderId: id },
        data: { status: String(paymentStatus) as any },
      })
      return res.json({ success: true, payment: updatedPayment })
    } else {
      const order = await db.order.findUnique({ where: { id } })
      const newPayment = await db.payment.create({
        data: {
          orderId: id,
          amount: order?.totalAmount || 0,
          method: "COD",
          status: String(paymentStatus) as any,
        },
      })
      return res.json({ success: true, payment: newPayment })
    }
  } catch (error) {
    next(error)
  }
}

export async function deleteOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id || "")
    await db.order.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
