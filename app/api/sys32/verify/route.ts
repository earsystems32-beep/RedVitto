import { NextResponse } from "next/server"
import { addSession } from "@/lib/session-store"

const loginAttempts = new Map<string, { count: number; timestamp: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

const sessionStore = new Map<string, { created: number; ip: string }>()
const SESSION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

setInterval(() => {
  const now = Date.now()
  // Clean expired sessions
  for (const [token, data] of sessionStore.entries()) {
    if (now - data.created > SESSION_EXPIRY) {
      sessionStore.delete(token)
    }
  }
  // Clean old login attempts
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.timestamp > LOCKOUT_TIME) {
      loginAttempts.delete(ip)
    }
  }
}, 60000) // Run every minute

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const allowedOrigin = process.env.ALLOWED_ORIGIN

    if (process.env.NODE_ENV === "production") {
      if (allowedOrigin) {
        // If ALLOWED_ORIGIN is set, validate against it
        const isValidOrigin = origin && origin.includes(allowedOrigin.replace(/\/$/, ""))
        const isValidReferer = referer && referer.includes(allowedOrigin.replace(/\/$/, ""))

        if (!isValidOrigin && !isValidReferer) {
          return NextResponse.json({ success: false, message: "Origen no autorizado" }, { status: 403 })
        }
      } else {
        // If ALLOWED_ORIGIN is not set, allow any Netlify or Vercel URL
        const isNetlifyOrVercel =
          (origin && (origin.includes(".netlify.app") || origin.includes(".vercel.app"))) ||
          (referer && (referer.includes(".netlify.app") || referer.includes(".vercel.app")))

        if (!isNetlifyOrVercel) {
          return NextResponse.json({ success: false, message: "Origen no autorizado" }, { status: 403 })
        }
      }
    }

    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    const attempts = loginAttempts.get(ip)
    const now = Date.now()

    if (attempts) {
      if (now - attempts.timestamp < LOCKOUT_TIME && attempts.count >= MAX_ATTEMPTS) {
        const remainingTime = Math.ceil((LOCKOUT_TIME - (now - attempts.timestamp)) / 60000)
        return NextResponse.json(
          {
            success: false,
            message: `Demasiados intentos fallidos. Intentá de nuevo en ${remainingTime} minutos.`,
          },
          { status: 429 },
        )
      }
      // Reset if lockout time has passed
      if (now - attempts.timestamp >= LOCKOUT_TIME) {
        loginAttempts.delete(ip)
      }
    }

    let pin: string
    try {
      const body = await request.json()
      pin = body.pin
    } catch (jsonError) {
      return NextResponse.json({ success: false, message: "Datos inválidos" }, { status: 400 })
    }

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ success: false, message: "PIN inválido" }, { status: 400 })
    }

    const sanitizedPin = pin.trim().slice(0, 100)

    const ADMIN_PIN = process.env.ADMIN_PIN

    if (!ADMIN_PIN) {
      return NextResponse.json({ success: false, message: "Configuración del servidor incompleta" }, { status: 500 })
    }

    if (sanitizedPin === ADMIN_PIN) {
      const sessionToken = generateSessionToken()

      addSession(sessionToken, ip)

      // Clear failed attempts for this IP
      loginAttempts.delete(ip)

      const response = NextResponse.json({ success: true, token: sessionToken })

      response.cookies.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      })

      if (origin && allowedOrigin) {
        response.headers.set("Access-Control-Allow-Origin", origin)
        response.headers.set("Access-Control-Allow-Credentials", "true")
      }
      response.headers.set("X-Content-Type-Options", "nosniff")
      response.headers.set("X-Frame-Options", "DENY")
      response.headers.set("X-XSS-Protection", "1; mode=block")
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

      return response
    }

    const currentAttempts = loginAttempts.get(ip)
    if (currentAttempts) {
      loginAttempts.set(ip, {
        count: currentAttempts.count + 1,
        timestamp: now,
      })
    } else {
      loginAttempts.set(ip, { count: 1, timestamp: now })
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({ success: false, message: "PIN incorrecto" }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error del servidor" }, { status: 500 })
  }
}
