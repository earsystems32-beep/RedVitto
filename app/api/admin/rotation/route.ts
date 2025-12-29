import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[Rotation API] Missing Supabase environment variables")
}

function getActiveNumbers(settings: any): Array<{ phone: string; name: string; index: number }> {
  const active = []
  for (let i = 1; i <= 9; i++) {
    const phone = settings[`attention_phone_${i}`]
    const name = settings[`attention_name_${i}`]
    const isActive = settings[`attention_active_${i}`]

    if (phone && phone.trim() && isActive) {
      active.push({ phone: phone.trim(), name: name || `Número ${i}`, index: i - 1 })
    }
  }
  return active
}

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuración del servidor incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const { incrementClick, resetCounters } = body

    const { data: settings, error: fetchError } = await supabase.from("settings").select("*").eq("id", 1).single()

    if (fetchError || !settings) {
      return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
    }

    if (resetCounters) {
      const { error: updateError } = await supabase
        .from("settings")
        .update({
          current_rotation_index: 0,
          rotation_click_count: 0,
          last_rotation_time: new Date().toISOString(),
        })
        .eq("id", 1)

      if (updateError) {
        return NextResponse.json({ error: "Error al resetear contadores" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Contadores reseteados" })
    }

    if (incrementClick) {
      const activeNumbers = getActiveNumbers(settings)

      if (activeNumbers.length === 0) {
        return NextResponse.json({ success: true, phone: settings.phone || "" })
      }

      const newClickCount = (settings.rotation_click_count || 0) + 1
      let newIndex = settings.current_rotation_index || 0

      if (newClickCount >= settings.rotation_threshold) {
        newIndex = (newIndex + 1) % activeNumbers.length

        const { error: updateError } = await supabase
          .from("settings")
          .update({
            current_rotation_index: newIndex,
            rotation_click_count: 0,
          })
          .eq("id", 1)

        if (updateError) {
          return NextResponse.json({ error: "Error al actualizar rotación" }, { status: 500 })
        }
      } else {
        const { error: updateError } = await supabase
          .from("settings")
          .update({
            rotation_click_count: newClickCount,
          })
          .eq("id", 1)

        if (updateError) {
          return NextResponse.json({ error: "Error al actualizar contador" }, { status: 500 })
        }
      }

      const selectedNumber = activeNumbers[newIndex]

      return NextResponse.json({
        success: true,
        phone: selectedNumber.phone,
        label: selectedNumber.name,
        clickCount: newClickCount >= settings.rotation_threshold ? 0 : newClickCount,
        threshold: settings.rotation_threshold,
        currentIndex: newIndex,
      })
    }

    return NextResponse.json({ error: "Acción no especificada" }, { status: 400 })
  } catch (error) {
    console.error("[Rotation API] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
