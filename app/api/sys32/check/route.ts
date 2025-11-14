import { NextResponse } from "next/server"

// Note: In production, use Redis or database for session storage
const sessionStore = new Map<string, { created: number; ip: string }>()

export async function GET(request: Request) {
  try {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const allowedOrigin = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_VERCEL_URL

    // Validate origin/referer in production
    if (process.env.NODE_ENV === "production") {
      const isValidOrigin = origin && allowedOrigin && origin.includes(allowedOrigin.replace(/\/$/, ""))
      const isValidReferer = referer && allowedOrigin && referer.includes(allowedOrigin.replace(/\/$/, ""))

      if (!isValidOrigin && !isValidReferer) {
        return NextResponse.json({ authenticated: false }, { status: 403 })
      }
    }

    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

    const cookieHeader = request.headers.get("cookie")

    if (!cookieHeader) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const sessionMatch = cookieHeader.match(/admin_session=([^;]+)/)
    if (!sessionMatch) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const sessionToken = sessionMatch[1]

    if (!sessionToken || sessionToken.length < 20) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const session = sessionStore.get(sessionToken)
    const now = Date.now()
    const SESSION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    if (now - session.created > SESSION_EXPIRY) {
      sessionStore.delete(sessionToken)
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Uncomment if you want to enforce IP binding
    // if (session.ip !== ip) {
    //   sessionStore.delete(sessionToken)
    //   return NextResponse.json({ authenticated: false }, { status: 401 })
    // }

    const response = NextResponse.json({ authenticated: true })

    if (origin && allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")

    return response
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
