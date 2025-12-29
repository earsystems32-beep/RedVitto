"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { LinkIcon, Settings, Plus } from "lucide-react"
import {
  Lock,
  LogOut,
  Save,
  Phone,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  Crown,
  MessageCircle,
  CheckCircle,
} from "lucide-react"
import type { AttentionNumber } from "@/lib/whatsapp-rotation"

const sanitizeAlias = (value: string): string => {
  // Allow letters, numbers, dots, and hyphens only
  return value.replace(/[^A-Za-z0-9.-]/g, "").slice(0, 50)
}

const sanitizeCBU = (value: string): string => {
  // Only allow digits, max 22
  return value.replace(/\D/g, "").slice(0, 22)
}

const sanitizePhone = (value: string): string => {
  // Only allow digits, between 8-15 characters
  return value.replace(/\D/g, "").slice(0, 15)
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [alias, setAlias] = useState("")
  const [paymentType, setPaymentType] = useState<"alias" | "cbu">("alias")
  const [cbuError, setCbuError] = useState("")

  const [supportPhone, setSupportPhone] = useState("")
  const [platformUrl, setPlatformUrl] = useState("https://ganamos.sbs")
  const [userCreationEnabled, setUserCreationEnabled] = useState(true)
  const [transferTimer, setTransferTimer] = useState("30")
  const [minAmount, setMinAmount] = useState("2000")
  const [bonusEnabled, setBonusEnabled] = useState(true)
  const [bonusPercentage, setBonusPercentage] = useState("25")
  const [adminPin, setAdminPin] = useState("")

  // Estados activos
  const [activeAlias, setActiveAlias] = useState("")
  const [activePaymentType, setActivePaymentType] = useState<"alias" | "cbu">("alias")
  const [activeUserCreationEnabled, setActiveUserCreationEnabled] = useState(true)
  const [activeTransferTimer, setActiveTransferTimer] = useState(30)
  const [activeMinAmount, setActiveMinAmount] = useState(2000)
  const [activeSupportPhone, setActiveSupportPhone] = useState("")
  const [activePlatformUrl, setActivePlatformUrl] = useState("https://ganamos.sbs")
  const [activeBonusEnabled, setActiveBonusEnabled] = useState(true)
  const [activeBonusPercentage, setActiveBonusPercentage] = useState(25)

  // Sistema de rotación
  const [rotationEnabled, setRotationEnabled] = useState(false)
  const [rotationMode, setRotationMode] = useState<"clicks" | "time">("clicks")
  const [rotationThreshold, setRotationThreshold] = useState(10)
  const [attentionNumbers, setAttentionNumbers] = useState<AttentionNumber[]>([])

  // Nuevo número
  const [newNumberLabel, setNewNumberLabel] = useState("")
  const [newNumberPhone, setNewNumberPhone] = useState("")

  const [showAddNumberForm, setShowAddNumberForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch("/api/admin/verify", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          setAdminPin(data.pin || "")
          await loadSettings()
          loadRotationNumbers()
        }
      }
    }
    checkAuth()
  }, [])

  const loadRotationNumbers = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()

      if (data.success && data.settings) {
        const settings = data.settings
        const numbers: AttentionNumber[] = []

        for (let i = 1; i <= 9; i++) {
          const phone = settings[`attention_phone_${i}`]
          const name = settings[`attention_name_${i}`]
          const active = settings[`attention_active_${i}`]

          // Solo agregar al array si tiene un teléfono configurado
          if (phone && phone.trim() !== "") {
            numbers.push({
              id: `attention_${i}`,
              phone: phone,
              label: name || "",
              active: active || false,
            })
          }
        }

        setAttentionNumbers(numbers)
        setRotationMode(settings.rotation_mode || "clicks")
        setRotationThreshold(settings.rotation_threshold || 10)
      }
    } catch (error) {
      console.error("Error al cargar números de rotación:", error)
    }
  }

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", {
      credentials: "include",
      cache: "no-store",
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.settings) {
        const settings = data.settings

        setActiveAlias(settings.alias || "")
        setActivePaymentType(settings.paymentType || "alias")
        setActiveUserCreationEnabled(settings.createUserEnabled ?? true)
        setActiveTransferTimer(settings.timerSeconds ?? 30)
        setActiveMinAmount(settings.minAmount ?? 2000)
        setActiveSupportPhone(settings.supportPhone || "")
        setActivePlatformUrl(settings.platformUrl || "https://ganamos.sbs")
        setActiveBonusEnabled(settings.bonusEnabled ?? true)
        setActiveBonusPercentage(settings.bonusPercentage ?? 25)

        setAlias(settings.alias || "")
        setPaymentType(settings.paymentType || "alias")
        setUserCreationEnabled(settings.createUserEnabled ?? true)
        setTransferTimer(String(settings.timerSeconds ?? 30))
        setMinAmount(String(settings.minAmount ?? 2000))
        setSupportPhone(settings.supportPhone || "")
        setPlatformUrl(settings.platformUrl || "https://ganamos.sbs")
        setBonusEnabled(settings.bonusEnabled ?? true)
        setBonusPercentage(String(settings.bonusPercentage ?? 25))
        setRotationEnabled(settings.rotationEnabled ?? false)
      }
    }
  }

  const handleLogin = async () => {
    if (!pinInput.trim()) {
      alert("Ingresá el PIN de administrador")
      return
    }

    setIsLoading(true)
    try {
      const testPIN = pinInput.trim()

      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: testPIN }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setIsAuthenticated(true)
          setAdminPin(testPIN)
          await loadSettings()
          loadRotationNumbers() // Cargar números de rotación después de autenticar
          setPinInput("")
        } else {
          alert("PIN incorrecto")
          setPinInput("")
        }
      } else {
        const data = await response.json()
        alert(data.error || "PIN incorrecto o error de conexión")
        setPinInput("")
      }
    } catch (error) {
      alert("Error de conexión. Intentá de nuevo.")
      console.error("Login error:", error)
      setPinInput("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsAuthenticated(false)
    setPinInput("")
    setAdminPin("")
  }

  const validateCbu = (value: string): boolean => {
    if (paymentType === "cbu") {
      if (value.length === 0) {
        setCbuError("")
        return false
      }
      if (value.length < 22) {
        setCbuError(`Faltan ${22 - value.length} dígitos`)
        return false
      }
      if (value.length === 22) {
        setCbuError("")
        return true
      }
    }
    setCbuError("")
    return true
  }

  const handleAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    if (paymentType === "cbu") {
      value = sanitizeCBU(value)
    } else {
      value = sanitizeAlias(value)
    }

    setAlias(value)
    validateCbu(value)
  }

  const handleToggleNumberActive = (id: string) => {
    if (!rotationEnabled) {
      // Si rotación OFF, desactivar todos excepto el seleccionado
      setAttentionNumbers((prev) => {
        const updated = prev.map((num) => ({
          ...num,
          active: num.id === id ? !num.active : false,
        }))
        return updated
      })
    } else {
      // Si rotación ON, solo toggle el seleccionado
      setAttentionNumbers((prev) => {
        const updated = prev.map((num) => (num.id === id ? { ...num, active: !num.active } : num))
        return updated
      })
    }
  }

  const handleDeleteNumber = (id: string) => {
    setAttentionNumbers((prev) => prev.filter((num) => num.id !== id))
  }

  const handleAddNumber = () => {
    const phoneValue = sanitizePhone(newNumberPhone.trim())
    const labelValue = newNumberLabel.trim()

    if (!labelValue) {
      alert("Ingresá un nombre para el contacto")
      return
    }

    if (!phoneValue || phoneValue.length < 8) {
      alert("Ingresá un teléfono válido (mínimo 8 dígitos)")
      return
    }

    const newNumber: AttentionNumber = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phone: phoneValue,
      label: labelValue,
      active: false,
    }

    setAttentionNumbers((prev) => [...prev, newNumber])
    setNewNumberLabel("")
    setNewNumberPhone("")
    setShowAddNumberForm(false)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Encontrar el número activo para sincronizar con columna legacy 'phone'
      const activeNumber = attentionNumbers.find((n) => n.active)
      const phoneForLegacy = activeNumber?.phone || attentionNumbers[0]?.phone || ""

      // Construir columnas de atención (1-9)
      const attentionColumns: Record<string, string | boolean> = {}

      for (let i = 1; i <= 9; i++) {
        const number = attentionNumbers[i - 1]
        attentionColumns[`attention_phone_${i}`] = number?.phone || ""
        attentionColumns[`attention_name_${i}`] = number?.label || ""
        attentionColumns[`attention_active_${i}`] = number?.active || false
      }

      const bodyData = {
        pin: adminPin,
        alias: alias.trim(),
        paymentType: paymentType,
        createUserEnabled: userCreationEnabled,
        timerSeconds: Number(transferTimer),
        minAmount: Number(minAmount),
        support_phone: sanitizePhone(supportPhone.trim()),
        platformUrl: platformUrl.trim(),
        bonusEnabled: bonusEnabled,
        bonusPercentage: Number(bonusPercentage),
        rotationEnabled: rotationEnabled,
        rotationMode: rotationMode,
        rotationThreshold: rotationThreshold,
        phone: phoneForLegacy,
        ...attentionColumns,
      }

      // Validaciones básicas antes de enviar
      if (paymentType === "cbu") {
        if (bodyData.alias.length !== 22) {
          alert("El CBU debe tener exactamente 22 dígitos")
          setSaving(false)
          return
        }
        if (!/^\d{22}$/.test(bodyData.alias)) {
          alert("El CBU solo debe contener números")
          setSaving(false)
          return
        }
      }

      if (paymentType === "alias") {
        const sanitized = sanitizeAlias(bodyData.alias.trim())
        if (!sanitized || sanitized.length < 6) {
          alert("Ingresá un alias válido (mínimo 6 caracteres)")
          setSaving(false)
          return
        }
        if (!/^[A-Za-z0-9.-]+$/.test(sanitized)) {
          alert("El alias solo puede contener letras, números, puntos y guiones")
          setSaving(false)
          return
        }
      }

      const transferTimerNum = Number(bodyData.timerSeconds)
      if (isNaN(transferTimerNum) || transferTimerNum < 10 || transferTimerNum > 300) {
        alert("El temporizador debe estar entre 10 y 300 segundos")
        setSaving(false)
        return
      }

      const minAmountNum = Number(bodyData.minAmount)
      if (isNaN(minAmountNum) || minAmountNum < 1000) {
        alert("El monto mínimo debe ser al menos $1,000")
        setSaving(false)
        return
      }

      if (bodyData.bonusPercentage < 0 || bodyData.bonusPercentage > 100) {
        alert("El porcentaje del bono debe estar entre 0 y 100")
        setSaving(false)
        return
      }

      const urlTrimmed = bodyData.platformUrl
      if (!urlTrimmed) {
        alert("Ingresá una URL válida para la plataforma")
        setSaving(false)
        return
      }
      if (!urlTrimmed.startsWith("http://") && !urlTrimmed.startsWith("https://")) {
        alert("La URL debe comenzar con http:// o https://")
        setSaving(false)
        return
      }

      const supportPhoneValue = sanitizePhone(bodyData.support_phone.trim())
      if (!supportPhoneValue || supportPhoneValue.length < 8) {
        alert("Ingresá un teléfono de soporte válido (mínimo 8 dígitos)")
        setSaving(false)
        return
      }
      if (supportPhoneValue.length > 15) {
        alert("El teléfono de soporte no puede tener más de 15 dígitos")
        setSaving(false)
        return
      }

      const activeCount = attentionNumbers.filter((n) => n.active).length
      if (!rotationEnabled && activeCount !== 1) {
        alert("Con rotación desactivada, debe haber exactamente 1 número activo")
        setSaving(false)
        return
      }
      if (rotationEnabled && activeCount === 0) {
        alert("Activá al menos un número para la rotación")
        setSaving(false)
        return
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(bodyData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al guardar la configuración")
      }

      const data = await response.json()

      if (data.success) {
        setActiveAlias(alias.trim())
        setActivePaymentType(paymentType)
        setActiveUserCreationEnabled(userCreationEnabled)
        setActiveTransferTimer(Number(transferTimer))
        setActiveMinAmount(Number(minAmount))
        setActiveSupportPhone(supportPhoneValue)
        setActivePlatformUrl(urlTrimmed)
        setActiveBonusEnabled(bonusEnabled)
        setActiveBonusPercentage(Number(bonusPercentage))
        alert("✅ Configuración actualizada correctamente")
        await loadRotationNumbers() // Recargar números después de guardar para confirmar
      } else {
        alert("❌ Error: " + data.message)
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("❌ Error al guardar la configuración. Verificá tu conexión e intentá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Partículas flotantes en el fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
      </div>

      {/* Padding aumentado para móvil */}
      <div className="relative z-10 p-4 md:p-6 pt-12">
        <div className="mx-auto max-w-2xl">
          {!isAuthenticated ? (
            // Card de login con fondo negro, borde morado y efectos neon
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-purple-600/30 p-6 shadow-[0_0_50px_rgba(124,58,237,0.3)] animate-fadeIn">
              <div className="space-y-4">
                {/* Ícono con efecto neon pulse */}
                <div className="flex items-center gap-3 justify-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center neon-glow animate-pulse">
                    <Crown className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-4xl font-black text-white neon-text">TheCrown</h1>
                </div>

                <p className="text-base text-gray-300 text-center font-medium">Panel de Administración</p>

                <div className="space-y-3">
                  <Label htmlFor="admin-pin" className="text-base text-white font-bold">
                    PIN de Acceso
                  </Label>
                  {/* Input con estilo negro/morado */}
                  <Input
                    id="admin-pin"
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                    placeholder="Ingresá el PIN"
                    disabled={isLoading}
                    className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl hover:border-purple-500/60"
                  />
                </div>

                {/* Botón con gradiente animado */}
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full h-14 btn-gradient-animated text-white font-bold text-base rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" strokeWidth={2.5} />
                  {isLoading ? "Verificando..." : "Entrar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="min-h-screen bg-black py-8 px-4 animate-fadeIn">
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-3 mb-8">
                  <Crown className="w-12 h-12 mx-auto text-purple-500 neon-glow" strokeWidth={2} />
                  <h1 className="text-4xl font-black text-white neon-text">TheCrown Admin</h1>
                  <p className="text-gray-400 text-sm">Panel de configuración</p>
                </div>

                <div className="space-y-6">
                  {/* Configuración general */}
                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-6 space-y-4 animate-fadeIn shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Settings className="w-6 h-6 text-purple-500" strokeWidth={2.5} />
                      <h2 className="text-2xl font-bold text-white neon-text">Configuración General</h2>
                    </div>

                    {/* Creación de usuarios */}
                    <div className="space-y-3">
                      <Label className="text-base text-white font-medium flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        Creación de usuarios
                      </Label>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-black/50 border border-purple-600/20">
                        <span className="text-gray-300 text-base">Permitir crear usuarios nuevos</span>
                        <Switch checked={userCreationEnabled} onCheckedChange={setUserCreationEnabled} />
                      </div>
                    </div>

                    {/* Temporizador de transferencia */}
                    <div className="space-y-3">
                      <Label className="text-base text-white font-medium flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        Temporizador de transferencia
                      </Label>
                      <Input
                        type="number"
                        min="10"
                        max="300"
                        value={transferTimer}
                        onChange={(e) => {
                          setTransferTimer(e.target.value)
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          if (value === "") {
                            setTransferTimer("10")
                            return
                          }
                          const num = Number.parseInt(value)
                          if (isNaN(num) || num < 10) {
                            setTransferTimer("10")
                          } else if (num > 300) {
                            setTransferTimer("300")
                          } else {
                            setTransferTimer(String(num))
                          }
                        }}
                        placeholder="30"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                      />
                      <p className="text-xs text-gray-400">Tiempo en segundos (10-300)</p>
                    </div>

                    {/* Monto mínimo de carga */}
                    <div className="space-y-3">
                      <Label className="text-base text-white font-medium flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        Monto mínimo de carga
                      </Label>
                      <Input
                        type="number"
                        min="1000"
                        value={minAmount}
                        onChange={(e) => {
                          setMinAmount(e.target.value)
                        }}
                        onBlur={(e) => {
                          const value = e.target.value
                          if (value === "") {
                            setMinAmount("1000")
                            return
                          }
                          const num = Number.parseInt(value)
                          if (isNaN(num) || num < 1000) {
                            setMinAmount("1000")
                          } else {
                            setMinAmount(String(num))
                          }
                        }}
                        placeholder="2000"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                      />
                      <p className="text-xs text-gray-400">Monto mínimo en $ (sin máximo)</p>
                    </div>

                    {/* Tipo de pago y Alias/CBU */}
                    <div className="space-y-3">
                      <Label className="text-base text-white font-medium flex items-center gap-2">
                        <Phone className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        Método de pago
                      </Label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="payment-type"
                            value="alias"
                            checked={paymentType === "alias"}
                            onChange={(e) => {
                              setPaymentType(e.target.value as "alias" | "cbu")
                              setCbuError("")
                              setAlias("")
                            }}
                            className="w-5 h-5 text-purple-600 accent-purple-600"
                          />
                          <span className="text-base text-white font-medium">Alias</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="payment-type"
                            value="cbu"
                            checked={paymentType === "cbu"}
                            onChange={(e) => {
                              setPaymentType(e.target.value as "alias" | "cbu")
                              setCbuError("")
                              setAlias("")
                            }}
                            className="w-5 h-5 text-purple-600 accent-purple-600"
                          />
                          <span className="text-base text-white font-medium">CBU</span>
                        </label>
                        {paymentType === "cbu" && (
                          <span
                            className={`text-sm font-medium ${
                              alias.length === 22
                                ? "text-green-400"
                                : alias.length > 0
                                  ? "text-yellow-400"
                                  : "text-gray-500"
                            }`}
                          >
                            {alias.length}/22
                          </span>
                        )}
                      </div>
                      <Input
                        id="cfg-alias"
                        type="text"
                        inputMode={paymentType === "cbu" ? "numeric" : "text"}
                        value={alias}
                        onChange={handleAliasChange}
                        placeholder={paymentType === "alias" ? "Ingresá tu alias" : "Ingresá tu CBU (22 dígitos)"}
                        className={`h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl ${
                          cbuError ? "border-red-400" : ""
                        }`}
                      />
                      {cbuError && (
                        <div className="flex items-center gap-3 text-red-400 text-sm font-medium">
                          <AlertCircle className="w-5 h-5 shrink-0" strokeWidth={2.5} />
                          <span>{cbuError}</span>
                        </div>
                      )}
                    </div>

                    {/* URL de Plataforma */}
                    <div className="space-y-3">
                      <Label className="text-base text-white font-medium flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        URL de Plataforma
                      </Label>
                      <Input
                        type="url"
                        value={platformUrl}
                        onChange={(e) => setPlatformUrl(e.target.value)}
                        placeholder="https://ganamos.sbs"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                      />
                    </div>

                    {/* Configuración del Bono */}
                    <div className="space-y-4 rounded-lg border border-purple-500/20 bg-black/30 p-4">
                      <h3 className="text-lg font-semibold text-purple-300">Configuración del Bono</h3>

                      <div className="flex items-center justify-between">
                        <span className="text-base text-gray-300">Activar Bono</span>
                        <Switch checked={bonusEnabled} onCheckedChange={setBonusEnabled} />
                      </div>

                      {bonusEnabled && (
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-300">Porcentaje del Bono (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={bonusPercentage}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(100, Number.parseInt(e.target.value) || 0))
                              setBonusPercentage(String(value))
                            }}
                            className="h-12 bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Número de Soporte */}
                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-6 h-6 text-purple-500" strokeWidth={2.5} />
                      <h2 className="text-2xl font-bold text-white neon-text">Número de Soporte</h2>
                    </div>
                    <p className="text-sm text-gray-400">
                      Número fijo para consultas de soporte (no rota, siempre disponible)
                    </p>
                    <div className="space-y-2">
                      <Label className="text-base text-white font-medium">Teléfono de Soporte</Label>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(sanitizePhone(e.target.value))}
                        placeholder="Ingresá el número completo (ej: 543415481923)"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                      />
                      <p className="text-xs text-gray-400">Este número se usa para consultas generales y soporte</p>
                    </div>
                  </div>

                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Phone className="w-6 h-6 text-purple-500" strokeWidth={2.5} />
                      <h2 className="text-2xl font-bold text-white neon-text">Números de Atención</h2>
                    </div>

                    {/* Toggle principal de rotación */}
                    <div className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-black/30 p-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white">Sistema de Rotación</h3>
                        <p className="text-sm text-gray-400">
                          {rotationEnabled
                            ? "Activo - Distribuye mensajes entre múltiples números"
                            : "Desactivado - Solo un número fijo"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRotationEnabled(!rotationEnabled)}
                        className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                          rotationEnabled ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                            rotationEnabled ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Configuración de modo - Solo si rotación ON */}
                    {rotationEnabled && (
                      <div className="space-y-4 rounded-lg border border-purple-500/20 bg-black/30 p-4">
                        <h4 className="text-sm font-medium text-purple-300">Configuración de Rotación</h4>

                        <div>
                          <label className="mb-2 block text-sm text-gray-300">Modo de Rotación</label>
                          <select
                            value={rotationMode}
                            onChange={(e) => setRotationMode(e.target.value as "clicks" | "time")}
                            className="w-full rounded-lg border border-purple-500/30 bg-black/60 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          >
                            <option value="clicks">Por Clicks</option>
                            <option value="time">Por Tiempo</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm text-gray-300">
                            {rotationMode === "clicks" ? "Clicks por número" : "Minutos por número"}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={rotationThreshold}
                            onChange={(e) => setRotationThreshold(Math.max(1, Number(e.target.value)))}
                            className="w-full rounded-lg border border-purple-500/30 bg-black/60 px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Lista de números */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-purple-300">
                        Lista de Números {!rotationEnabled && "(Solo 1 puede estar activo)"}
                      </h4>

                      {attentionNumbers.filter((n) => n.phone.trim() !== "").length === 0 ? (
                        <div className="rounded-lg border border-dashed border-purple-500/30 bg-black/20 p-6 text-center">
                          <p className="text-gray-400">No hay números configurados. Agregá uno abajo.</p>
                        </div>
                      ) : (
                        attentionNumbers
                          .filter((n) => n.phone.trim() !== "")
                          .map((number) => (
                            <div
                              key={number.id}
                              className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-black/30 p-3"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-white">{number.label}</p>
                                <p className="text-sm text-gray-400">{number.phone}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                {/* Toggle activo/inactivo */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleNumberActive(number.id)}
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                                    number.active ? "bg-green-500" : "bg-gray-600"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                      number.active ? "translate-x-6" : "translate-x-1"
                                    }`}
                                  />
                                </button>

                                {/* Botón eliminar */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNumber(number.id)}
                                  className="px-3 py-1 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    <div className="space-y-3">
                      {!showAddNumberForm ? (
                        <Button
                          type="button"
                          onClick={() => setShowAddNumberForm(true)}
                          className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-500/30 text-purple-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Nuevo Número
                        </Button>
                      ) : (
                        <div className="space-y-3 rounded-lg border border-purple-500/30 bg-black/20 p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-purple-300">Agregar Nuevo Número</h4>
                            <Button
                              type="button"
                              onClick={() => {
                                setShowAddNumberForm(false)
                                setNewNumberLabel("")
                                setNewNumberPhone("")
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-purple-400 hover:text-purple-300"
                            >
                              Cancelar
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Input
                              type="text"
                              value={newNumberLabel}
                              onChange={(e) => setNewNumberLabel(e.target.value)}
                              placeholder="Nombre (ej: JUAN)"
                              className="bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-lg"
                            />
                            <Input
                              type="tel"
                              inputMode="numeric"
                              value={newNumberPhone}
                              onChange={(e) => setNewNumberPhone(sanitizePhone(e.target.value))}
                              placeholder="543415481923"
                              className="bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-lg"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                handleAddNumber()
                                setShowAddNumberForm(false)
                              }}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Configuración Activa (al final) */}
                    <div className="bg-black/40 backdrop-blur-md border border-green-600/20 rounded-xl p-6 space-y-4">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-500" strokeWidth={2.5} />
                        <h2 className="text-2xl font-bold text-white neon-text">Configuración Activa</h2>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-gray-800/50">
                          <span className="text-gray-400">Crear usuarios:</span>
                          <span className="text-white font-medium">
                            {activeUserCreationEnabled ? "✓ Activado" : "✗ Desactivado"}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-800/50">
                          <span className="text-gray-400">Temporizador:</span>
                          <span className="text-white font-medium">{activeTransferTimer}s</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-800/50">
                          <span className="text-gray-400">Monto mínimo:</span>
                          <span className="text-white font-medium">${activeMinAmount}</span>
                        </div>
                        {activeAlias && (
                          <div className="flex justify-between py-2 border-b border-gray-800/50">
                            <span className="text-gray-400">{activePaymentType === "alias" ? "Alias:" : "CBU:"}</span>
                            <span className="text-white font-medium font-mono">{activeAlias}</span>
                          </div>
                        )}
                        {activeSupportPhone && (
                          <div className="flex justify-between py-2 border-b border-gray-800/50">
                            <span className="text-gray-400">Soporte:</span>
                            <span className="text-white font-medium font-mono">{activeSupportPhone}</span>
                          </div>
                        )}
                        {activePlatformUrl && (
                          <div className="flex justify-between py-2 border-b border-gray-800/50">
                            <span className="text-gray-400">URL Plataforma:</span>
                            <span className="text-white font-medium truncate max-w-[200px]">{activePlatformUrl}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-gray-800/50">
                          <span className="text-gray-400">Bono Primera Carga:</span>
                          <span className="text-white font-medium">
                            {activeBonusEnabled ? `✓ ${activeBonusPercentage}%` : "✗ Desactivado"}
                          </span>
                        </div>
                      </div>

                      {/* Botón Salir */}
                      <button
                        onClick={handleLogout}
                        className="w-full h-12 border-2 border-purple-600/40 hover:border-purple-500 hover:bg-purple-950/30 transition-all text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 mt-6"
                      >
                        <LogOut className="w-5 h-5" strokeWidth={2.5} />
                        Salir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleSave}
            className="w-auto h-14 px-8 btn-gradient-animated text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xl hover:shadow-xl shadow-purple-500/30"
          >
            <Save className="w-6 h-6" strokeWidth={2.5} />
            Guardar Configuración
          </button>
        </div>
      )}
    </div>
  )
}
