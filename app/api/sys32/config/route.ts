import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const alias = cookieStore.get("cfg_alias")?.value || process.env.NEXT_PUBLIC_DEFAULT_ALIAS || "DLHogar.mp"
    const phone = cookieStore.get("cfg_phone")?.value || process.env.NEXT_PUBLIC_DEFAULT_PHONE || "543415481923"
    const paymentType = (cookieStore.get("cfg_payment_type")?.value as "alias" | "cbu") || "alias"

    return NextResponse.json({
      success: true,
      config: {
        alias,
        phone,
        paymentType,
      },
    })
  } catch (error) {
    console.error("Config GET error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { alias, phone, paymentType } = body

    if (!alias || !phone || !paymentType) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (paymentType !== "alias" && paymentType !== "cbu") {
      return NextResponse.json({ error: "Tipo de pago inválido" }, { status: 400 })
    }

    cookieStore.set("cfg_alias", alias, {
      httpOnly: false, // Allow client-side reading
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    })
    
    cookieStore.set("cfg_phone", phone, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })
    
    cookieStore.set("cfg_payment_type", paymentType, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      config: {
        alias,
        phone,
        paymentType,
      },
    })
  } catch (error) {
    console.error("Config POST error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
