import { NextResponse } from "next/server"
import { cookies } from "next/headers"

let serverConfig = {
  alias: "",
  phone: "",
  paymentType: "alias" as "alias" | "cbu",
  userCreationEnabled: true,
  transferTimer: 30,
  minAmount: 2000,
  updatedAt: new Date().toISOString(),
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const alias = cookieStore.get("cfg_alias")?.value || serverConfig.alias || process.env.NEXT_PUBLIC_DEFAULT_ALIAS || "DLHogar.mp"
    const phone = cookieStore.get("cfg_phone")?.value || serverConfig.phone || process.env.NEXT_PUBLIC_DEFAULT_PHONE || "543415481923"
    const paymentType = (cookieStore.get("cfg_payment_type")?.value as "alias" | "cbu") || serverConfig.paymentType || "alias"
    const userCreationEnabled = cookieStore.get("cfg_user_creation_enabled")?.value === "false" ? false : (cookieStore.get("cfg_user_creation_enabled")?.value === "true" ? true : serverConfig.userCreationEnabled)
    const transferTimer = Number(cookieStore.get("cfg_transfer_timer")?.value) || serverConfig.transferTimer || 30
    const minAmount = Number(cookieStore.get("cfg_min_amount")?.value) || serverConfig.minAmount || 2000

    const config = {
      alias,
      phone,
      paymentType,
      userCreationEnabled,
      transferTimer,
      minAmount,
      updatedAt: serverConfig.updatedAt,
    }

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminPin = process.env.ADMIN_PIN
    if (!adminPin) {
      return NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 })
    }

    const body = await request.json()
    const { alias, phone, paymentType, userCreationEnabled, transferTimer, minAmount, pin } = body

    if (!pin || pin !== adminPin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    if (!alias || !phone || !paymentType) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (paymentType !== "alias" && paymentType !== "cbu") {
      return NextResponse.json({ error: "Tipo de pago inválido" }, { status: 400 })
    }

    if (typeof userCreationEnabled !== "boolean") {
      return NextResponse.json({ error: "Estado de creación de usuarios inválido" }, { status: 400 })
    }

    if (typeof transferTimer !== "number" || transferTimer < 0 || transferTimer > 300) {
      return NextResponse.json({ error: "Temporizador inválido (0-300 segundos)" }, { status: 400 })
    }

    if (typeof minAmount !== "number" || minAmount < 0) {
      return NextResponse.json({ error: "Monto mínimo inválido" }, { status: 400 })
    }

    serverConfig = {
      alias,
      phone,
      paymentType,
      userCreationEnabled,
      transferTimer,
      minAmount,
      updatedAt: new Date().toISOString(),
    }

    const response = NextResponse.json({
      success: true,
      config: serverConfig,
    })

    response.cookies.set("cfg_alias", alias, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
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

    response.cookies.set("cfg_user_creation_enabled", String(userCreationEnabled), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })

    response.cookies.set("cfg_transfer_timer", String(transferTimer), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })

    response.cookies.set("cfg_min_amount", String(minAmount), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
