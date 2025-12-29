// Sistema de rotación de números de WhatsApp para atención

export interface AttentionNumber {
  id: number
  label: string
  phone: string
  active: boolean
  note?: string
}

export interface RotationConfig {
  mode: "clicks" | "time"
  threshold: number // clics o minutos según el modo
  currentIndex: number
  clickCounts: Record<number, number>
  lastRotationTime: number
}

const STORAGE_KEY_ROTATION = "thecrown_rotation_config"
const STORAGE_KEY_NUMBERS = "thecrown_attention_numbers"

// Números por defecto (sincronizados con SUPPORT_CONTACTS de sys32)
const DEFAULT_NUMBERS: AttentionNumber[] = [
  { id: 1, label: "1. Sofía — B", phone: "5493416198041", active: true },
  { id: 2, label: "2. Milu — B", phone: "5491160340101", active: true },
  { id: 3, label: "3. Sara — P", phone: "5491160340179", active: true },
  { id: 4, label: "4. Cecilia", phone: "543416132645", active: true },
  { id: 5, label: "5. Ludmila", phone: "543416845591", active: true },
]

// Configuración por defecto
const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  mode: "clicks",
  threshold: 100,
  currentIndex: 0,
  clickCounts: {},
  lastRotationTime: Date.now(),
}

export function getAttentionNumbers(): AttentionNumber[] {
  if (typeof window === "undefined") return DEFAULT_NUMBERS

  try {
    const stored = localStorage.getItem(STORAGE_KEY_NUMBERS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("[WhatsApp Rotation] Error loading numbers:", error)
  }

  return DEFAULT_NUMBERS
}

export function saveAttentionNumbers(numbers: AttentionNumber[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY_NUMBERS, JSON.stringify(numbers))
  } catch (error) {
    console.error("[WhatsApp Rotation] Error saving numbers:", error)
  }
}

export function getRotationConfig(): RotationConfig {
  if (typeof window === "undefined") return DEFAULT_ROTATION_CONFIG

  try {
    const stored = localStorage.getItem(STORAGE_KEY_ROTATION)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("[WhatsApp Rotation] Error loading config:", error)
  }

  return DEFAULT_ROTATION_CONFIG
}

export function saveRotationConfig(config: RotationConfig): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY_ROTATION, JSON.stringify(config))
  } catch (error) {
    console.error("[WhatsApp Rotation] Error saving config:", error)
  }
}

export function resetClickCounters(): void {
  const config = getRotationConfig()
  config.clickCounts = {}
  config.currentIndex = 0
  saveRotationConfig(config)
}

/**
 * Obtiene el siguiente número de atención según la configuración de rotación
 * @param fallbackPhone Número de fallback si no hay números activos
 * @param rotationEnabled Si la rotación está activada (si es false, usa número fijo)
 * @returns El número de teléfono a usar
 */
export function getNextAttentionNumber(fallbackPhone?: string, rotationEnabled = true): string {
  // Si la rotación está desactivada, usar el número fijo
  if (!rotationEnabled && fallbackPhone) {
    console.log("[WhatsApp Rotation] Rotation disabled, using fixed phone")
    return fallbackPhone
  }

  const numbers = getAttentionNumbers()
  const config = getRotationConfig()

  // Filtrar solo números activos
  const activeNumbers = numbers.filter((n) => n.active)

  // Si no hay números activos, usar fallback
  if (activeNumbers.length === 0) {
    console.warn("[WhatsApp Rotation] No active numbers, using fallback")
    return fallbackPhone || numbers[0]?.phone || ""
  }

  // Si solo hay un número activo, usarlo siempre
  if (activeNumbers.length === 1) {
    return activeNumbers[0].phone
  }

  let selectedNumber: AttentionNumber

  if (config.mode === "clicks") {
    // Modo: Rotación por clics
    // Encontrar el primer número que no haya alcanzado el threshold
    let foundNumber = false

    for (let i = 0; i < activeNumbers.length; i++) {
      const number = activeNumbers[i]
      const clicks = config.clickCounts[number.id] || 0

      if (clicks < config.threshold) {
        selectedNumber = number
        foundNumber = true

        // Incrementar contador
        config.clickCounts[number.id] = clicks + 1
        config.currentIndex = i
        saveRotationConfig(config)
        break
      }
    }

    // Si todos alcanzaron el threshold, resetear y empezar de nuevo
    if (!foundNumber) {
      console.log("[WhatsApp Rotation] All numbers reached threshold, resetting...")
      resetClickCounters()
      const newConfig = getRotationConfig()
      selectedNumber = activeNumbers[0]
      newConfig.clickCounts[selectedNumber.id] = 1
      newConfig.currentIndex = 0
      saveRotationConfig(newConfig)
    }
  } else {
    // Modo: Rotación por tiempo
    const now = Date.now()
    const elapsedMinutes = (now - config.lastRotationTime) / 1000 / 60

    if (elapsedMinutes >= config.threshold) {
      // Rotar al siguiente número
      config.currentIndex = (config.currentIndex + 1) % activeNumbers.length
      config.lastRotationTime = now
      saveRotationConfig(config)
      console.log(`[WhatsApp Rotation] Time threshold reached, rotating to index ${config.currentIndex}`)
    }

    selectedNumber = activeNumbers[config.currentIndex]
  }

  console.log(`[WhatsApp Rotation] Selected number: ${selectedNumber!.label}`)
  return selectedNumber!.phone
}

/**
 * Obtiene información del número actual en uso
 */
export function getCurrentNumberInfo(): { label: string; phone: string; mode: string; progress: string } | null {
  const numbers = getAttentionNumbers()
  const config = getRotationConfig()
  const activeNumbers = numbers.filter((n) => n.active)

  if (activeNumbers.length === 0) {
    return null
  }

  const currentNumber = activeNumbers[config.currentIndex] || activeNumbers[0]

  let progress = ""
  if (config.mode === "clicks") {
    const clicks = config.clickCounts[currentNumber.id] || 0
    progress = `${clicks}/${config.threshold} clics`
  } else {
    const now = Date.now()
    const elapsedMinutes = Math.floor((now - config.lastRotationTime) / 1000 / 60)
    progress = `${elapsedMinutes}/${config.threshold} min`
  }

  return {
    label: currentNumber.label,
    phone: currentNumber.phone,
    mode: config.mode === "clicks" ? "Por clics" : "Por tiempo",
    progress,
  }
}
