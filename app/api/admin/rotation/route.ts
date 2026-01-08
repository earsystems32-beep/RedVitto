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
    const { incrementClick, resetCounters, forceRotate, resetTotalRequests } = body

    const { data: settings, error: fetchError } = await supabase.from("settings").select("*").eq("id", 1).single()

    if (fetchError || !settings) {
      return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
    }

    if (resetTotalRequests) {
      const { error: updateError } = await supabase
        .from("settings")
        .update({
          total_requests_count: 0,
        })
        .eq("id", 1)

      if (updateError) {
        return NextResponse.json({ error: "Error al resetear contador de solicitudes" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Contador de solicitudes reseteado", totalRequestsCount: 0 })
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

      const currentIndex = settings.current_rotation_index || 0
      const newIndex = (currentIndex + 1) % activeNumbers.length

      const { error: updateError } = await supabase
        .from("settings")
        .update({
          current_rotation_index: newIndex,
          rotation_click_count: 0,
          last_rotation_time: new Date().toISOString(),
        })
        .eq("id", 1)

      if (updateError) {
        return NextResponse.json({ error: "Error al forzar rotación" }, { status: 500 })
      }

      const selectedNumber = activeNumbers[newIndex]

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

      const currentTotalRequests = settings.total_requests_count || 0
      const newTotalRequests = currentTotalRequests + 1

      if (activeNumbers.length === 0) {
        // Actualizar solo el contador total
        await supabase.from("settings").update({ total_requests_count: newTotalRequests }).eq("id", 1)

        return NextResponse.json({
          success: true,
          phone: settings.phone || "",
          totalRequestsCount: newTotalRequests,
        })
      }

      const currentIndex = settings.current_rotation_index || 0
      const currentClickCount = settings.rotation_click_count || 0
      const threshold = settings.rotation_threshold || 1

      const phoneToUse = activeNumbers[currentIndex % activeNumbers.length]

      const newClickCount = currentClickCount + 1

      if (newClickCount >= threshold) {
        const nextIndex = (currentIndex + 1) % activeNumbers.length

        const { error: updateError } = await supabase
          .from("settings")
          .update({
            current_rotation_index: nextIndex,
            rotation_click_count: 0,
            last_rotation_time: new Date().toISOString(),
            total_requests_count: newTotalRequests,
          })
          .eq("id", 1)

        if (updateError) {
          return NextResponse.json({ error: "Error al actualizar rotación" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          phone: phoneToUse.phone,
          label: phoneToUse.name,
          clickCount: 0,
          threshold: threshold,
          currentIndex: nextIndex,
          rotated: true,
          totalRequestsCount: newTotalRequests,
        })
      } else {
        const { error: updateError } = await supabase
          .from("settings")
          .update({
            rotation_click_count: newClickCount,
            total_requests_count: newTotalRequests,
          })
          .eq("id", 1)

        if (updateError) {
          return NextResponse.json({ error: "Error al actualizar contador" }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          phone: phoneToUse.phone,
          label: phoneToUse.name,
          clickCount: newClickCount,
          threshold: threshold,
          currentIndex: currentIndex,
          rotated: false,
          totalRequestsCount: newTotalRequests,
        })
      }
    }

    return NextResponse.json({ error: "Acción no especificada" }, { status: 400 })
  } catch (error) {
    console.error("[Rotation API] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
