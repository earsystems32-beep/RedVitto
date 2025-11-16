import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

let globalConfig: ServerConfig = { ...DEFAULT_CONFIG }

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  try {
    return createClient(supabaseUrl, supabaseKey)
  } catch {
    return null
  }
}

async function getConfig(): Promise<ServerConfig> {
  const supabase = getSupabaseClient()
  
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .eq("id", 1)
        .single()

      if (!error && data) {
        // Successfully read from Supabase, update cache and return
        globalConfig = {
          alias: data.alias,
          phone: data.phone,
          paymentType: data.payment_type,
          userCreationEnabled: data.user_creation_enabled,
          transferTimer: data.transfer_timer,
          minAmount: data.min_amount,
          updatedAt: data.updated_at,
        }
        return globalConfig
      }
    } catch {
      // Supabase failed, fallback to memory
    }
  }

  // Fallback to memory (v0 or Supabase not available)
  return globalConfig
}

async function saveConfig(config: ServerConfig): Promise<void> {
  globalConfig = config
  
  const supabase = getSupabaseClient()
  
  if (supabase) {
    try {
      await supabase
        .from("system_config")
        .upsert({
          id: 1,
          alias: config.alias,
          phone: config.phone,
          payment_type: config.paymentType,
          user_creation_enabled: config.userCreationEnabled,
          transfer_timer: config.transferTimer,
          min_amount: config.minAmount,
          updated_at: config.updatedAt,
        })
      // Successfully saved to Supabase
    } catch {
      // Silently fail and rely on memory backup
    }
  }
}

export async function GET() {
  try {
    const config = await getConfig()
    const supabase = getSupabaseClient()
    
    return NextResponse.json({
      success: true,
      config,
      storage: supabase ? "supabase" : "memory"
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

    await saveConfig(newConfig)
    const supabase = getSupabaseClient()

    return NextResponse.json({
      success: true,
      config: newConfig,
      storage: supabase ? "supabase" : "memory"
    })
  } catch (error) {
    console.error("[Config] POST error:", error)
    return NextResponse.json({ 
      error: "Error del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
