/**
 * Settings Management Module
 * 
 * This module manages system configuration stored in Supabase.
 * All configuration is stored in a single row (id=1) in the settings table.
 * 
 * Required Supabase table schema:
 * - id (integer, PK) – always 1
 * - min_amount (integer) – minimum deposit amount
 * - timer_seconds (integer) – transfer timer duration
 * - create_user_enabled (boolean) – controls user creation button
 * - alias (text) – payment alias or CBU
 * - phone (text) – support contact phone
 * - payment_type (text) – 'alias' or 'cbu'
 * - updated_at (timestamp) – last update time
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface Settings {
  minAmount: number
  timerSeconds: number
  createUserEnabled: boolean
  alias: string
  phone: string
  paymentType: "alias" | "cbu"
  updatedAt: string
}

const DEFAULT_SETTINGS: Settings = {
  minAmount: 2000,
  timerSeconds: 30,
  createUserEnabled: true,
  alias: process.env.NEXT_PUBLIC_DEFAULT_ALIAS || "DLHogar.mp",
  phone: process.env.NEXT_PUBLIC_DEFAULT_PHONE || "543415481923",
  paymentType: "alias",
  updatedAt: new Date().toISOString(),
}

async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignore cookie errors from Server Components
        }
      },
    },
  })
}

/**
 * Get current system settings from Supabase
 * @returns Settings object with current configuration
 */
export async function getSettings(): Promise<Settings> {
  const supabase = await getSupabaseClient()

  if (!supabase) {
    console.warn("[Settings] Supabase not configured, using defaults")
    return DEFAULT_SETTINGS
  }

  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single()

    if (error) {
      console.error("[Settings] Error reading from Supabase:", error.message)
      return DEFAULT_SETTINGS
    }

    if (!data) {
      console.warn("[Settings] No settings found, using defaults")
      return DEFAULT_SETTINGS
    }

    return {
      minAmount: data.min_amount,
      timerSeconds: data.timer_seconds,
      createUserEnabled: data.create_user_enabled,
      alias: data.alias,
      phone: data.phone,
      paymentType: data.payment_type as "alias" | "cbu",
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error("[Settings] Unexpected error:", error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Update system settings in Supabase
 * @param partialSettings - Partial settings object with fields to update
 * @returns Updated settings object
 */
export async function updateSettings(partialSettings: Partial<Omit<Settings, "updatedAt">>): Promise<Settings> {
  const supabase = await getSupabaseClient()

  if (!supabase) {
    throw new Error("Supabase not configured")
  }

  // Build update object with snake_case fields
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (partialSettings.minAmount !== undefined) {
    updateData.min_amount = partialSettings.minAmount
  }
  if (partialSettings.timerSeconds !== undefined) {
    updateData.timer_seconds = partialSettings.timerSeconds
  }
  if (partialSettings.createUserEnabled !== undefined) {
    updateData.create_user_enabled = partialSettings.createUserEnabled
  }
  if (partialSettings.alias !== undefined) {
    updateData.alias = partialSettings.alias
  }
  if (partialSettings.phone !== undefined) {
    updateData.phone = partialSettings.phone
  }
  if (partialSettings.paymentType !== undefined) {
    updateData.payment_type = partialSettings.paymentType
  }

  try {
    const { data, error } = await supabase
      .from("settings")
      .update(updateData)
      .eq("id", 1)
      .select()
      .single()

    if (error) {
      console.error("[Settings] Error updating Supabase:", error.message)
      throw new Error(`Failed to update settings: ${error.message}`)
    }

    if (!data) {
      throw new Error("No data returned after update")
    }

    return {
      minAmount: data.min_amount,
      timerSeconds: data.timer_seconds,
      createUserEnabled: data.create_user_enabled,
      alias: data.alias,
      phone: data.phone,
      paymentType: data.payment_type as "alias" | "cbu",
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error("[Settings] Unexpected error during update:", error)
    throw error
  }
}
