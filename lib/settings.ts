import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export interface AttentionNumber {
  phone: string
  name: string
  active: boolean
}

export interface Settings {
  minAmount: number
  timerSeconds: number
  createUserEnabled: boolean
  alias: string
  phone: string
  supportPhone: string
  paymentType: "alias" | "cbu"
  platformUrl: string
  bonusEnabled: boolean
  bonusPercentage: number
  rotationEnabled: boolean
  rotationMode: "clicks" | "time"
  rotationThreshold: number
  attentionNumbers: AttentionNumber[]
  currentRotationIndex: number
  rotationClickCount: number
  lastRotationTime: string
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[Settings] Missing env vars:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    })
    throw new Error("Missing Supabase environment variables")
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function getSettings(): Promise<Settings> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single()

  if (error) {
    throw new Error(`Failed to fetch settings: ${error.message}`)
  }

  if (!data) {
    throw new Error("Settings not found")
  }

  const attentionNumbers: AttentionNumber[] = []
  for (let i = 1; i <= 9; i++) {
    attentionNumbers.push({
      phone: data[`attention_phone_${i}`] || "",
      name: data[`attention_name_${i}`] || "",
      active: data[`attention_active_${i}`] ?? false,
    })
  }

  return {
    minAmount: data.min_amount,
    timerSeconds: data.timer_seconds,
    createUserEnabled: data.create_user_enabled,
    alias: data.alias || "",
    phone: data.phone || "",
    supportPhone: data.support_phone || "",
    paymentType: data.payment_type,
    platformUrl: data.platform_url || "https://ganamos.sbs",
    bonusEnabled: data.bonus_enabled ?? true,
    bonusPercentage: data.bonus_percentage ?? 25,
    rotationEnabled: data.rotation_enabled ?? false,
    rotationMode: data.rotation_mode || "clicks",
    rotationThreshold: data.rotation_threshold || 10,
    attentionNumbers,
    currentRotationIndex: data.current_rotation_index || 0,
    rotationClickCount: data.rotation_click_count || 0,
    lastRotationTime: data.last_rotation_time || new Date().toISOString(),
  }
}

export async function updateSettings(updates: Record<string, unknown>): Promise<Settings> {
  const supabase = getSupabaseClient()
  const dbUpdates: Record<string, unknown> = {}

  // Mapeo de campos
  const fieldMap: Record<string, string> = {
    minAmount: "min_amount",
    timerSeconds: "timer_seconds",
    createUserEnabled: "create_user_enabled",
    alias: "alias",
    phone: "phone",
    supportPhone: "support_phone",
    paymentType: "payment_type",
    platformUrl: "platform_url",
    bonusEnabled: "bonus_enabled",
    bonusPercentage: "bonus_percentage",
    rotationEnabled: "rotation_enabled",
    rotationMode: "rotation_mode",
    rotationThreshold: "rotation_threshold",
    currentRotationIndex: "current_rotation_index",
    rotationClickCount: "rotation_click_count",
    lastRotationTime: "last_rotation_time",
  }

  // Aplicar mapeo
  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      dbUpdates[dbKey] = updates[key]
    }
  }

  // Campos de atención directos
  for (let i = 1; i <= 9; i++) {
    for (const suffix of ["phone", "name", "active"]) {
      const key = `attention_${suffix}_${i}`
      if (updates[key] !== undefined) {
        dbUpdates[key] = updates[key]
      }
    }
  }

  dbUpdates.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from("settings").update(dbUpdates).eq("id", 1).select().single()

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  const attentionNumbers: AttentionNumber[] = []
  for (let i = 1; i <= 9; i++) {
    attentionNumbers.push({
      phone: data[`attention_phone_${i}`] || "",
      name: data[`attention_name_${i}`] || "",
      active: data[`attention_active_${i}`] ?? false,
    })
  }

  return {
    minAmount: data.min_amount,
    timerSeconds: data.timer_seconds,
    createUserEnabled: data.create_user_enabled,
    alias: data.alias || "",
    phone: data.phone || "",
    supportPhone: data.support_phone || "",
    paymentType: data.payment_type,
    platformUrl: data.platform_url || "https://ganamos.sbs",
    bonusEnabled: data.bonus_enabled ?? true,
    bonusPercentage: data.bonus_percentage ?? 25,
    rotationEnabled: data.rotation_enabled ?? false,
    rotationMode: data.rotation_mode || "clicks",
    rotationThreshold: data.rotation_threshold || 10,
    attentionNumbers,
    currentRotationIndex: data.current_rotation_index || 0,
    rotationClickCount: data.rotation_click_count || 0,
    lastRotationTime: data.last_rotation_time || new Date().toISOString(),
  }
}
