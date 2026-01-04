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
    const { incrementClick, resetCounters, forceRotate } = body

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

    if (forceRotate) {
      const activeNumbers = getActiveNumbers(settings)
      console.log("[v0] forceRotate - Números activos:", activeNumbers)

      if (activeNumbers.length === 0) {
        return NextResponse.json({ error: "No hay números activos para rotar" }, { status: 400 })
      }

      if (activeNumbers.length === 1) {
        return NextResponse.json({
          success: true,
          phone: activeNumbers[0].phone,
          label: activeNumbers[0].name,
          currentIndex: 0,
          totalNumbers: 1,
          message: "Solo hay un número activo",
        })
      }

      // Obtener el índice actual dentro del array de números activos
      const currentIndex = settings.current_rotation_index || 0
      console.log("[v0] forceRotate - Índice actual en DB:", currentIndex)

      // Calcular el siguiente índice en el array de números activos
      const newIndex = (currentIndex + 1) % activeNumbers.length
      console.log("[v0] forceRotate - Nuevo índice calculado:", newIndex, "de", activeNumbers.length, "números")

      const { error: updateError } = await supabase
        .from("settings")
        .update({
          current_rotation_index: newIndex,
          rotation_click_count: 0,
          last_rotation_time: new Date().toISOString(),
        })
        .eq("id", 1)

      if (updateError) {
        console.error("[v0] forceRotate - Error al actualizar:", updateError)
        return NextResponse.json({ error: "Error al forzar rotación" }, { status: 500 })
      }

      const selectedNumber = activeNumbers[newIndex]
      console.log("[v0] forceRotate - Número seleccionado:", selectedNumber)

      return NextResponse.json({
        success: true,
        phone: selectedNumber.phone,
        label: selectedNumber.name,
        currentIndex: newIndex,
        totalNumbers: activeNumbers.length,
        message: `Rotado a ${selectedNumber.name}`,
      })
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
