// Sistema de rotación de números de WhatsApp para atención usando Supabase

export interface AttentionNumber {
  id: number
  label: string
  phone: string
  active: boolean
  note?: string
}

export interface SupabaseSettings {
  rotation_enabled: boolean
  rotation_mode: "clicks" | "time"
  rotation_threshold: number
  current_rotation_index: number
  rotation_click_count: number
  last_rotation_time: string
  phone: string
  // 9 números de atención fijos
  attention_phone_1?: string
  attention_name_1?: string
  attention_active_1: boolean
  attention_phone_2?: string
  attention_name_2?: string
  attention_active_2: boolean
  attention_phone_3?: string
  attention_name_3?: string
  attention_active_3: boolean
  attention_phone_4?: string
  attention_name_4?: string
  attention_active_4: boolean
  attention_phone_5?: string
  attention_name_5?: string
  attention_active_5: boolean
  attention_phone_6?: string
  attention_name_6?: string
  attention_active_6: boolean
  attention_phone_7?: string
  attention_name_7?: string
  attention_active_7: boolean
  attention_phone_8?: string
  attention_name_8?: string
  attention_active_8: boolean
  attention_phone_9?: string
  attention_name_9?: string
  attention_active_9: boolean
}

function getAttentionNumbersFromSettings(settings: SupabaseSettings): AttentionNumber[] {
  const numbers: AttentionNumber[] = []

  for (let i = 1; i <= 9; i++) {
    const phoneKey = `attention_phone_${i}` as keyof SupabaseSettings
    const nameKey = `attention_name_${i}` as keyof SupabaseSettings
    const activeKey = `attention_active_${i}` as keyof SupabaseSettings

    const phone = settings[phoneKey] as string
    const name = settings[nameKey] as string
    const active = settings[activeKey] as boolean

    if (phone && phone.trim()) {
      numbers.push({
        id: i,
        phone: phone.trim(),
        label: name?.trim() || `Número ${i}`,
        active: active || false,
      })
    }
  }

  return numbers
}

/**
 * Obtiene el siguiente número de atención según la configuración de rotación
 * @param settings Configuración completa de Supabase
 * @returns El número de teléfono a usar
 */
export async function getNextAttentionNumber(settings: SupabaseSettings): Promise<string> {
  console.log("[v0 DEBUG] getNextAttentionNumber called with settings:", {
    rotation_enabled: settings.rotation_enabled,
    rotation_mode: settings.rotation_mode,
    rotation_threshold: settings.rotation_threshold,
    current_rotation_index: settings.current_rotation_index,
    rotation_click_count: settings.rotation_click_count,
  })

  if (!settings.rotation_enabled) {
    console.log("[v0 DEBUG] Rotation disabled, using fixed phone")
    return settings.phone || ""
  }

  const allNumbers = getAttentionNumbersFromSettings(settings)
  const activeNumbers = allNumbers.filter((n) => n.active)

  console.log("[v0 DEBUG] Active numbers:", activeNumbers.length, activeNumbers)

  if (activeNumbers.length === 0) {
    console.warn("[v0 DEBUG] No active numbers, using fallback")
    return settings.phone || ""
  }

  if (activeNumbers.length === 1) {
    console.log("[v0 DEBUG] Only 1 active number, returning:", activeNumbers[0].phone)
    return activeNumbers[0].phone
  }

  let currentIndex = settings.current_rotation_index || 0

  if (settings.rotation_mode === "clicks") {
    console.log("[v0 DEBUG] Rotation mode: CLICKS - Calling API to increment")
    try {
      const response = await fetch("/api/admin/rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incrementClick: true }),
      })

      console.log("[v0 DEBUG] API Response status:", response.status)
      const data = await response.json()
      console.log("[v0 DEBUG] API Response data:", data)

      if (data.success && data.phone) {
        console.log(`[v0 DEBUG] Click mode - Selected: ${data.label} (${data.phone})`)
        return data.phone
      }
    } catch (error) {
      console.error("[v0 DEBUG] Error incrementing click:", error)
    }

    console.log("[v0 DEBUG] Fallback to current index:", currentIndex)
    return activeNumbers[currentIndex].phone
  } else {
    const lastRotation = new Date(settings.last_rotation_time).getTime()
    const now = Date.now()
    const elapsedMinutes = (now - lastRotation) / 1000 / 60

    if (elapsedMinutes >= settings.rotation_threshold) {
      currentIndex = (currentIndex + 1) % activeNumbers.length
      console.log(`[WhatsApp Rotation] Time threshold reached, rotating to index ${currentIndex}`)
    }

    return activeNumbers[currentIndex].phone
  }
}

/**
 * Resetea los contadores de rotación
 */
export async function resetRotationCounters(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/rotation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetCounters: true }),
    })

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error("[WhatsApp Rotation] Error resetting counters:", error)
    return false
  }
}
