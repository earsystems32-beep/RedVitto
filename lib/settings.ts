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
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single()

    if (error) {
      console.error("[Settings] Error fetching from Supabase:", error)
      throw new Error(`Failed to fetch settings: ${error.message}`)
    }

    if (!data) {
      throw new Error("Settings not found")
    }

    const attentionNumbers: AttentionNumber[] = []
    for (let i = 1; i <= 9; i++) {
      const phone = data[`attention_phone_${i}`] || ""
      const name = data[`attention_name_${i}`] || ""
      const active = data[`attention_active_${i}`] ?? false

      attentionNumbers.push({ phone, name, active })
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
  } catch (error) {
    console.error("[Settings] getSettings error:", error)
    throw error
  }
}

export async function updateSettings(updates: Record<string, unknown>): Promise<Settings> {
  try {
    const supabase = getSupabaseClient()

    const dbUpdates: Record<string, unknown> = {}

    if (updates.minAmount !== undefined) dbUpdates.min_amount = updates.minAmount
    if (updates.timerSeconds !== undefined) dbUpdates.timer_seconds = updates.timerSeconds
    if (updates.createUserEnabled !== undefined) dbUpdates.create_user_enabled = updates.createUserEnabled
    if (updates.alias !== undefined) dbUpdates.alias = updates.alias
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.supportPhone !== undefined) dbUpdates.support_phone = updates.supportPhone
    if (updates.paymentType !== undefined) dbUpdates.payment_type = updates.paymentType
    if (updates.platformUrl !== undefined) dbUpdates.platform_url = updates.platformUrl
    if (updates.bonusEnabled !== undefined) dbUpdates.bonus_enabled = updates.bonusEnabled
    if (updates.bonusPercentage !== undefined) dbUpdates.bonus_percentage = updates.bonusPercentage
    if (updates.rotationEnabled !== undefined) dbUpdates.rotation_enabled = updates.rotationEnabled
    if (updates.rotationMode !== undefined) dbUpdates.rotation_mode = updates.rotationMode
    if (updates.rotationThreshold !== undefined) dbUpdates.rotation_threshold = updates.rotationThreshold

    if (updates.currentRotationIndex !== undefined) dbUpdates.current_rotation_index = updates.currentRotationIndex
    if (updates.rotationClickCount !== undefined) dbUpdates.rotation_click_count = updates.rotationClickCount
    if (updates.lastRotationTime !== undefined) dbUpdates.last_rotation_time = updates.lastRotationTime

    for (let i = 1; i <= 9; i++) {
      const phoneKey = `attention_phone_${i}`
      const nameKey = `attention_name_${i}`
      const activeKey = `attention_active_${i}`

      if (updates[phoneKey] !== undefined) {
        dbUpdates[phoneKey] = updates[phoneKey]
      }
      if (updates[nameKey] !== undefined) {
        dbUpdates[nameKey] = updates[nameKey]
      }
      if (updates[activeKey] !== undefined) {
        dbUpdates[activeKey] = updates[activeKey]
      }
    }

    dbUpdates.updated_at = new Date().toISOString()

    console.log("[v0] updateSettings - dbUpdates:", JSON.stringify(dbUpdates, null, 2))

    const { data, error } = await supabase.from("settings").update(dbUpdates).eq("id", 1).select().single()

    if (error) {
      console.error("[Settings] Error updating Supabase:", error)
      throw new Error(`Failed to update settings: ${error.message}`)
    }

    console.log("[v0] updateSettings - data returned:", JSON.stringify(data, null, 2))

    const attentionNumbers: AttentionNumber[] = []
    for (let i = 1; i <= 9; i++) {
      const phone = data[`attention_phone_${i}`] || ""
      const name = data[`attention_name_${i}`] || ""
      const active = data[`attention_active_${i}`] ?? false

      attentionNumbers.push({ phone, name, active })
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
  } catch (error) {
    console.error("[Settings] updateSettings error:", error)
    throw error
  }
}
