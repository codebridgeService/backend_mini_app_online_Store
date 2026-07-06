import { Request, Response, NextFunction } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "../lib/prisma"
import { AuthRequest } from "../middleware/auth.middleware"

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey987654321"

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, role } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" })
    }

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User with this email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split("@")[0],
        role: role || "USER",
      },
    })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    const { password: _, ...userWithoutPassword } = user
    res.status(201).json({ success: true, user: userWithoutPassword, token })
  } catch (error) {
    next(error)
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    let { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" })
    }
    email = String(email).trim()
    password = String(password).trim()

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: "Invalid email or password" })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid email or password" })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    const { password: _, ...userWithoutPassword } = user
    res.json({ success: true, user: userWithoutPassword, token })
  } catch (error) {
    next(error)
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Unauthorized" })
    }

    const user = await db.user.findUnique({
      where: { id: req.user.id },
      include: {
        stores: true,
      },
    })

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" })
    }

    const { password: _, ...userWithoutPassword } = user
    res.json({ success: true, user: userWithoutPassword })
  } catch (error) {
    next(error)
  }
}
