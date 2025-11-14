import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// In-memory storage for configuration (will reset on server restart)
let serverConfig = {
  alias: "",
  phone: "",
  paymentType: "alias" as "alias" | "cbu",
  updatedAt: new Date().toISOString(),
}

export async function GET() {
  try {
    const config = serverConfig.alias
      ? serverConfig
      : {
          alias: process.env.NEXT_PUBLIC_DEFAULT_ALIAS || "DLHogar.mp",
          phone: process.env.NEXT_PUBLIC_DEFAULT_PHONE || "543415481923",
          paymentType: "alias" as "alias" | "cbu",
          updatedAt: new Date().toISOString(),
        }

    console.log("[v0] Config GET:", config)

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error("[v0] Config GET error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      console.log("[v0] Config POST: No autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { alias, phone, paymentType } = body

    console.log("[v0] Config POST received:", { alias, phone, paymentType })

    if (!alias || !phone || !paymentType) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (paymentType !== "alias" && paymentType !== "cbu") {
      return NextResponse.json({ error: "Tipo de pago inválido" }, { status: 400 })
    }

    serverConfig = {
      alias,
      phone,
      paymentType,
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({
      success: true,
      config: serverConfig,
    })

    // Set persistent cookies that sync across devices
    response.cookies.set("cfg_alias", alias, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    })

    response.cookies.set("cfg_phone", phone, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })

    response.cookies.set("cfg_payment_type", paymentType, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })

    console.log("[v0] Config saved successfully:", serverConfig)

    return response
  } catch (error) {
    console.error("[v0] Config POST error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
