import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { put, list } from "@vercel/blob"

const CONFIG_BLOB_NAME = "app-config.json"

async function getConfigFromBlob() {
  try {
    const { blobs } = await list({ prefix: CONFIG_BLOB_NAME })
    
    if (blobs.length === 0) {
      // File doesn't exist, create it with defaults
      const defaultConfig = {
        alias: process.env.NEXT_PUBLIC_DEFAULT_ALIAS || "DLHogar.mp",
        phone: process.env.NEXT_PUBLIC_DEFAULT_PHONE || "543415481923",
        paymentType: "alias",
        updatedAt: new Date().toISOString(),
      }
      
      await put(CONFIG_BLOB_NAME, JSON.stringify(defaultConfig), {
        access: "public",
        contentType: "application/json",
      })
      
      return defaultConfig
    }
    
    // File exists, fetch and return it
    const response = await fetch(blobs[0].url)
    return await response.json()
  } catch (error) {
    console.error("Blob config error:", error)
    // Return defaults on any error
    return {
      alias: process.env.NEXT_PUBLIC_DEFAULT_ALIAS || "DLHogar.mp",
      phone: process.env.NEXT_PUBLIC_DEFAULT_PHONE || "543415481923",
      paymentType: "alias",
    }
  }
}

export async function GET() {
  try {
    const config = await getConfigFromBlob()

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error("Config GET error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { alias, phone, paymentType } = body

    if (!alias || !phone || !paymentType) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (paymentType !== "alias" && paymentType !== "cbu") {
      return NextResponse.json({ error: "Tipo de pago inválido" }, { status: 400 })
    }

    const config = { alias, phone, paymentType, updatedAt: new Date().toISOString() }
    await put(CONFIG_BLOB_NAME, JSON.stringify(config), {
      access: "public",
      contentType: "application/json",
    })

    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error("Config POST error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
