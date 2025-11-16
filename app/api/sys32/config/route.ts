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
  // Redirect to new admin settings API
  const url = new URL("/api/admin/settings", process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000")
  return NextResponse.redirect(url)
}

export async function POST(request: Request) {
  // Forward to new admin settings API
  const body = await request.json()
  
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}/api/admin/settings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
