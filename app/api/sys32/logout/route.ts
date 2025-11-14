import { NextResponse } from "next/server"
import { removeSession } from "@/lib/session-store"

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const allowedOrigin = process.env.ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_VERCEL_URL

    // Validate origin/referer in production
    if (process.env.NODE_ENV === "production") {
      const isValidOrigin = origin && allowedOrigin && origin.includes(allowedOrigin.replace(/\/$/, ""))
      const isValidReferer = referer && allowedOrigin && referer.includes(allowedOrigin.replace(/\/$/, ""))

      if (!isValidOrigin && !isValidReferer) {
        return NextResponse.json({ success: false }, { status: 403 })
      }
    }

    const cookieHeader = request.headers.get("cookie")
    if (cookieHeader) {
      const sessionMatch = cookieHeader.match(/admin_session=([^;]+)/)
      if (sessionMatch) {
        const sessionToken = sessionMatch[1]
        removeSession(sessionToken)
      }
    }

    const response = NextResponse.json({ success: true })

    response.cookies.set("admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    if (origin && allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")

    return response
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
