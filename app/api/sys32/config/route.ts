import { NextResponse } from "next/server"
import { put, head, list } from "@vercel/blob"

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

async function getConfigFromBlob(): Promise<ServerConfig> {
  try {
    // Check if config file exists in Blob storage
    const { blobs } = await list({
      prefix: BLOB_CONFIG_PATH,
      limit: 1,
    })

    if (blobs.length === 0) {
      // Config doesn't exist, create it with defaults
      await saveConfigToBlob(DEFAULT_CONFIG)
      return DEFAULT_CONFIG
    }

    // Fetch existing config
    const response = await fetch(blobs[0].url)
    const config: ServerConfig = await response.json()
    return config
  } catch (error) {
    console.error("[Config] Error loading from Blob:", error)
    return DEFAULT_CONFIG
  }
}

async function saveConfigToBlob(config: ServerConfig): Promise<void> {
  try {
    await put(BLOB_CONFIG_PATH, JSON.stringify(config, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: true,
    })
  } catch (error) {
    console.error("[Config] Error saving to Blob:", error)
    throw error
  }
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
