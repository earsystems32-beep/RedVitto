import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

    return {
      minAmount: data.min_amount,
      timerSeconds: data.timer_seconds,
      createUserEnabled: data.create_user_enabled,
      alias: data.alias,
      phone: data.phone,
      supportPhone: data.support_phone || data.phone,
      paymentType: data.payment_type,
      platformUrl: data.platform_url || "https://ganamos.sbs",
      bonusEnabled: data.bonus_enabled ?? true,
      bonusPercentage: data.bonus_percentage ?? 25,
    }
  } catch (error) {
    console.error("[Settings] getSettings error:", error)
    throw error
  }
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
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

    const { data, error } = await supabase.from("settings").update(dbUpdates).eq("id", 1).select().single()

    if (error) {
      console.error("[Settings] Error updating Supabase:", error)
      throw new Error(`Failed to update settings: ${error.message}`)
    }

    if (!data) {
      throw new Error("Settings update returned no data")
    }

    return {
      minAmount: data.min_amount,
      timerSeconds: data.timer_seconds,
      createUserEnabled: data.create_user_enabled,
      alias: data.alias,
      phone: data.phone,
      supportPhone: data.support_phone || data.phone,
      paymentType: data.payment_type,
      platformUrl: data.platform_url || "https://ganamos.sbs",
      bonusEnabled: data.bonus_enabled ?? true,
      bonusPercentage: data.bonus_percentage ?? 25,
    }
  } catch (error) {
    console.error("[Settings] updateSettings error:", error)
    throw error
  }
}
