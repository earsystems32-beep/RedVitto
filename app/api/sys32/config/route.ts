import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const BLOB_CONFIG_PATH = "system-config.json"

interface ServerConfig {
  alias: string
  phone: string
  paymentType: "alias" | "cbu"
  userCreationEnabled: boolean
  transferTimer: number
  minAmount: number
  updatedAt: string
}

const DEFAULT_CONFIG: ServerConfig = {
  alias: process.env.NEXT_PUBLIC_DEFAULT_ALIAS || "DLHogar.mp",
  phone: process.env.NEXT_PUBLIC_DEFAULT_PHONE || "543415481923",
  paymentType: "alias",
  userCreationEnabled: true,
  transferTimer: 30,
  minAmount: 2000,
  updatedAt: new Date().toISOString(),
}

const isBlobAvailable = !!process.env.BLOB_READ_WRITE_TOKEN

async function getConfigFromBlob(): Promise<ServerConfig> {
  if (!isBlobAvailable) {
    return getConfigFromCookies()
  }

  try {
    const { put, list } = await import("@vercel/blob")
    
    const { blobs } = await list({
      prefix: BLOB_CONFIG_PATH,
      limit: 1,
    })

    if (blobs.length === 0) {
      await saveConfigToBlob(DEFAULT_CONFIG)
      return DEFAULT_CONFIG
    }

    const response = await fetch(blobs[0].url)
    const config: ServerConfig = await response.json()
    return config
  } catch (error) {
    console.error("[Config] Error loading from Blob, falling back to cookies:", error)
    return getConfigFromCookies()
  }
}

async function saveConfigToBlob(config: ServerConfig): Promise<void> {
  if (!isBlobAvailable) {
    saveConfigToCookies(config)
    return
  }

  try {
    const { put } = await import("@vercel/blob")
    
    await put(BLOB_CONFIG_PATH, JSON.stringify(config, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: true,
    })
    
    saveConfigToCookies(config)
  } catch (error) {
    console.error("[Config] Error saving to Blob, using cookies:", error)
    saveConfigToCookies(config)
  }
}

function getConfigFromCookies(): ServerConfig {
  const cookieStore = cookies()
  
  const alias = cookieStore.get("config_alias")?.value || DEFAULT_CONFIG.alias
  const phone = cookieStore.get("config_phone")?.value || DEFAULT_CONFIG.phone
  const paymentType = (cookieStore.get("config_paymentType")?.value as "alias" | "cbu") || DEFAULT_CONFIG.paymentType
  const userCreationEnabled = cookieStore.get("config_userCreationEnabled")?.value === "true"
  const transferTimer = parseInt(cookieStore.get("config_transferTimer")?.value || String(DEFAULT_CONFIG.transferTimer))
  const minAmount = parseInt(cookieStore.get("config_minAmount")?.value || String(DEFAULT_CONFIG.minAmount))
  const updatedAt = cookieStore.get("config_updatedAt")?.value || DEFAULT_CONFIG.updatedAt

  return {
    alias,
    phone,
    paymentType,
    userCreationEnabled,
    transferTimer,
    minAmount,
    updatedAt,
  }
}

function saveConfigToCookies(config: ServerConfig): void {
  const cookieStore = cookies()
  const maxAge = 365 * 24 * 60 * 60 // 1 year
  
  cookieStore.set("config_alias", config.alias, { maxAge, sameSite: "lax" })
  cookieStore.set("config_phone", config.phone, { maxAge, sameSite: "lax" })
  cookieStore.set("config_paymentType", config.paymentType, { maxAge, sameSite: "lax" })
  cookieStore.set("config_userCreationEnabled", String(config.userCreationEnabled), { maxAge, sameSite: "lax" })
  cookieStore.set("config_transferTimer", String(config.transferTimer), { maxAge, sameSite: "lax" })
  cookieStore.set("config_minAmount", String(config.minAmount), { maxAge, sameSite: "lax" })
  cookieStore.set("config_updatedAt", config.updatedAt, { maxAge, sameSite: "lax" })
}

export async function GET() {
  try {
    const config = await getConfigFromBlob()

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error("[Config] GET error:", error)
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

    const newConfig: ServerConfig = {
      alias,
      phone,
      paymentType,
      userCreationEnabled,
      transferTimer,
      minAmount,
      updatedAt: new Date().toISOString(),
    }

    await saveConfigToBlob(newConfig)

    return NextResponse.json({
      success: true,
      config: newConfig,
    })
  } catch (error) {
    console.error("[Config] POST error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
