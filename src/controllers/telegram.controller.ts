import { Request, Response, NextFunction } from "express"
import { db } from "../lib/prisma"

export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { storeId } = req.query
    if (!storeId) {
      return res.status(400).json({ ok: false, error: "Missing storeId" })
    }

    const store = await db.store.findUnique({ where: { id: String(storeId) } })
    if (!store || !store.telegramBot) {
      return res.status(404).json({ ok: false, error: "Store or bot token not found" })
    }

    const body = req.body
    const message = body?.message
    if (!message) {
      return res.json({ ok: true }) // Not a message update, ignore
    }

    const chatId = message.chat?.id
    const text: string = message.text || ""
    const token = store.telegramBot
    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000"
    const storeUrl = `${appUrl}/en/store/${store.slug}`

    // Handle /start command
    if (text.startsWith("/start")) {
      await sendTelegramMessage(token, chatId, {
        text: `👋 Welcome to *${store.name}*!\n\nTap the button below to open our store.`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `🛍️ Open ${store.name}`,
                web_app: { url: storeUrl },
              },
            ],
          ],
        },
      })
    }

    res.json({ ok: true })
  } catch (error) {
    console.error("[Telegram Webhook Error]", error)
    res.status(500).json({ ok: false, error: "Internal server error" })
  }
}

async function sendTelegramMessage(token: string, chatId: number, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, ...payload }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error("[sendTelegramMessage]", err)
    }
  } catch (error) {
    console.error("[sendTelegramMessage Exception]", error)
  }
}
