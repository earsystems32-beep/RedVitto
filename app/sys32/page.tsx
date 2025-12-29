"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LinkIcon, RefreshCw, Settings } from "lucide-react"
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
import {
  getAttentionNumbers,
  saveAttentionNumbers,
  getRotationConfig,
  saveRotationConfig,
  resetClickCounters,
  getCurrentNumberInfo,
  type AttentionNumber,
} from "@/lib/whatsapp-rotation"

const SUPPORT_CONTACTS = [
  { name: "1. Sofía — B", phone: "5493416198041" },
  { name: "2. Milu — B", phone: "5491160340101" },
  { name: "3. Sara — P", phone: "5491160340179" },
  { name: "4. Cecilia", phone: "543416132645" },
  { name: "5. Ludmila", phone: "543416845591" },
  { name: "Otro / Personalizado", phone: "" },
]

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
  const [selectedContactIndex, setSelectedContactIndex] = useState<string>("0")
  const [phone, setPhone] = useState("")
  const [supportPhone, setSupportPhone] = useState("")
  const [selectedSupportContactIndex, setSelectedSupportContactIndex] = useState<string>("5")
  const [isPhoneEditable, setIsPhoneEditable] = useState(false)
  const [isSupportPhoneEditable, setIsSupportPhoneEditable] = useState(false)
  const [activeAlias, setActiveAlias] = useState("")
  const [activePhone, setActivePhone] = useState("")
  const [activeContactName, setActiveContactName] = useState("")
  const [activePaymentType, setActivePaymentType] = useState<"alias" | "cbu">("alias")
  const [userCreationEnabled, setUserCreationEnabled] = useState(true)
  const [transferTimer, setTransferTimer] = useState("30")
  const [minAmount, setMinAmount] = useState("2000")
  const [bonusEnabled, setBonusEnabled] = useState(true)
  const [bonusPercentage, setBonusPercentage] = useState("25")
  const [activeBonusEnabled, setActiveBonusEnabled] = useState(true)
  const [activeBonusPercentage, setActiveBonusPercentage] = useState(25)
  const [adminPin, setAdminPin] = useState("") // Store PIN for config saves
  const [activeSupportPhone, setActiveSupportPhone] = useState("") // Declare the variable
  const [platformUrl, setPlatformUrl] = useState("https://ganamos.sbs")
  const [activePlatformUrl, setActivePlatformUrl] = useState("https://ganamos.sbs")
  const [activeUserCreationEnabled, setActiveUserCreationEnabled] = useState(true)
  const [activeTransferTimer, setActiveTransferTimer] = useState(30)
  const [activeMinAmount, setActiveMinAmount] = useState(2000)
  const [rotationEnabled, setRotationEnabled] = useState(false)
  const [rotationMode, setRotationMode] = useState<"clicks" | "time">("clicks")
  const [rotationThreshold, setRotationThreshold] = useState(100)
  const [currentNumberInfo, setCurrentNumberInfo] = useState<ReturnType<typeof getCurrentNumberInfo>>(null)
  const [attentionNumbers, setAttentionNumbers] = useState<AttentionNumber[]>([])

  useEffect(() => {
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
          setActivePhone(settings.phone || "")
          setActivePaymentType(settings.paymentType || "alias")
          setActiveUserCreationEnabled(settings.createUserEnabled ?? true)
          setActiveTransferTimer(settings.timerSeconds ?? 30)
          setActiveMinAmount(settings.minAmount ?? 2000)
          setPhone(settings.phone || "")
          setSupportPhone(settings.support_phone || "")
          setPlatformUrl(settings.platformUrl || "https://ganamos.sbs")
          setActivePlatformUrl(settings.platformUrl || "https://ganamos.sbs")

          setAlias(settings.alias || "")
          setPaymentType(settings.paymentType || "alias")
          setUserCreationEnabled(settings.createUserEnabled ?? true)
          setTransferTimer(String(settings.timerSeconds ?? 30))
          setMinAmount(String(settings.minAmount ?? 2000))

          if (settings.phone) {
            const idx = SUPPORT_CONTACTS.findIndex((c) => c.phone === settings.phone)
            if (idx >= 0) {
              setSelectedContactIndex(String(idx))
              setIsPhoneEditable(SUPPORT_CONTACTS[idx].name === "Otro / Personalizado")
            } else {
              setSelectedContactIndex("0")
              setIsPhoneEditable(true)
            }
          } else {
            setSelectedContactIndex("0")
            setIsPhoneEditable(false)
          }

          if (settings.support_phone) {
            const idx = SUPPORT_CONTACTS.findIndex((c) => c.phone === settings.support_phone)
            if (idx >= 0) {
              setSelectedSupportContactIndex(String(idx))
              setIsSupportPhoneEditable(SUPPORT_CONTACTS[idx].name === "Otro / Personalizado")
            } else {
              setSelectedSupportContactIndex(String(SUPPORT_CONTACTS.length - 1))
              setIsSupportPhoneEditable(true)
            }
          } else {
            setSelectedSupportContactIndex(String(SUPPORT_CONTACTS.length - 1))
            setIsSupportPhoneEditable(false)
          }

          setBonusEnabled(settings.bonusEnabled ?? true)
          setBonusPercentage(String(settings.bonusPercentage ?? 25))
          setActiveBonusEnabled(settings.bonusEnabled ?? true)
          setActiveBonusPercentage(settings.bonusPercentage ?? 25)
          setRotationEnabled(settings.rotationEnabled ?? false)
        }
      }
    }

    const numbers = getAttentionNumbers()
    const config = getRotationConfig()
    setAttentionNumbers(numbers)
    setRotationMode(config.mode)
    setRotationThreshold(config.threshold)
    setCurrentNumberInfo(getCurrentNumberInfo())

    loadSettings()
  }, [])

  const handleContactChange = (value: string) => {
    setSelectedContactIndex(value)
    const idx = Number.parseInt(value)
    if (idx >= 0 && idx < SUPPORT_CONTACTS.length) {
      const contact = SUPPORT_CONTACTS[idx]
      if (contact.phone) {
        setPhone(contact.phone)
        setIsPhoneEditable(false)
      } else {
        setIsPhoneEditable(true)
      }
    }
  }

  const handleSupportContactChange = (value: string) => {
    setSelectedSupportContactIndex(value)
    const idx = Number.parseInt(value)
    if (idx >= 0 && idx < SUPPORT_CONTACTS.length) {
      const contact = SUPPORT_CONTACTS[idx]
      if (contact.phone) {
        setSupportPhone(contact.phone)
        setIsSupportPhoneEditable(false)
      } else {
        setIsSupportPhoneEditable(true)
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
          await loadConfig()
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

  const handleSave = async () => {
    const phoneValue = sanitizePhone(phone.trim())
    const supportPhoneValue = sanitizePhone(supportPhone.trim())
    const bonusPercentageNum = Number.parseInt(bonusPercentage, 10)

    if (!phoneValue || phoneValue.length < 8) {
      alert("Ingresá un teléfono válido (mínimo 8 dígitos)")
      return
    }

    if (phoneValue.length > 15) {
      alert("El teléfono no puede tener más de 15 dígitos")
      return
    }

    if (!supportPhoneValue || supportPhoneValue.length < 8) {
      alert("Ingresá un teléfono de soporte válido (mínimo 8 dígitos)")
      return
    }

    if (supportPhoneValue.length > 15) {
      alert("El teléfono de soporte no puede tener más de 15 dígitos")
      return
    }

    if (paymentType === "cbu") {
      if (alias.length !== 22) {
        alert("El CBU debe tener exactamente 22 dígitos")
        return
      }
      if (!/^\d{22}$/.test(alias)) {
        alert("El CBU solo debe contener números")
        return
      }
    }

    if (paymentType === "alias") {
      const sanitized = sanitizeAlias(alias.trim())
      if (!sanitized || sanitized.length < 6) {
        alert("Ingresá un alias válido (mínimo 6 caracteres)")
        return
      }
      if (!/^[A-Za-z0-9.-]+$/.test(sanitized)) {
        alert("El alias solo puede contener letras, números, puntos y guiones")
        return
      }
    }

    const transferTimerNum = Number(transferTimer)
    if (isNaN(transferTimerNum) || transferTimerNum < 10 || transferTimerNum > 300) {
      alert("El temporizador debe estar entre 10 y 300 segundos")
      return
    }

    const minAmountNum = Number(minAmount)
    if (isNaN(minAmountNum) || minAmountNum < 1000) {
      alert("El monto mínimo debe ser al menos $1,000")
      return
    }

    if (bonusPercentageNum < 0 || bonusPercentageNum > 100) {
      alert("El porcentaje del bono debe estar entre 0 y 100")
      return
    }

    const urlTrimmed = platformUrl.trim()
    if (!urlTrimmed) {
      alert("Ingresá una URL válida para la plataforma")
      return
    }
    if (!urlTrimmed.startsWith("http://") && !urlTrimmed.startsWith("https://")) {
      alert("La URL debe comenzar con http:// o https://")
      return
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          alias: alias.trim(),
          phone: phoneValue,
          paymentType: paymentType,
          createUserEnabled: userCreationEnabled,
          timerSeconds: transferTimerNum,
          minAmount: minAmountNum,
          support_phone: supportPhoneValue,
          platformUrl: urlTrimmed, // Incluir URL de plataforma en el guardado
          bonusEnabled: bonusEnabled,
          bonusPercentage: bonusPercentageNum,
          pin: adminPin,
          rotationEnabled: rotationEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al guardar la configuración")
      }

      const data = await response.json()

      if (data.success) {
        setActiveAlias(alias.trim())
        setActivePhone(phoneValue)
        setActivePaymentType(paymentType)
        setActiveUserCreationEnabled(userCreationEnabled)
        setActiveTransferTimer(transferTimerNum)
        setActiveMinAmount(minAmountNum)
        setActiveContactName(SUPPORT_CONTACTS[Number.parseInt(selectedContactIndex)].name)
        setActiveSupportPhone(SUPPORT_CONTACTS[Number.parseInt(selectedSupportContactIndex)].phone)
        setActivePlatformUrl(urlTrimmed) // Actualizar URL activa
        setActiveBonusEnabled(bonusEnabled)
        setActiveBonusPercentage(bonusPercentageNum)
        setRotationEnabled(rotationEnabled)

        alert(
          "✅ Configuración guardada exitosamente en Supabase.\nLos cambios son permanentes y se reflejan en todos los dispositivos.",
        )
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("❌ Error al guardar. Verificá tu conexión e intentá de nuevo.")
    }
  }

  const handleSaveRotationConfig = () => {
    saveAttentionNumbers(attentionNumbers)
    const config = getRotationConfig()
    config.mode = rotationMode
    config.threshold = rotationThreshold
    saveRotationConfig(config)
    setCurrentNumberInfo(getCurrentNumberInfo())
    alert("Configuración de rotación guardada correctamente")
  }

  const loadConfig = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          const settings = data.settings

          setActiveAlias(settings.alias || "")
          setActivePhone(settings.phone || "")
          setActivePaymentType(settings.paymentType || "alias")
          setActiveUserCreationEnabled(settings.createUserEnabled ?? true)
          setActiveTransferTimer(settings.timerSeconds ?? 30)
          setActiveMinAmount(settings.minAmount ?? 2000)
          setPhone(settings.phone || "")
          setSupportPhone(settings.support_phone || "")
          setPlatformUrl(settings.platformUrl || "https://ganamos.sbs")
          setActivePlatformUrl(settings.platformUrl || "https://ganamos.sbs")

          setAlias(settings.alias || "")
          setPaymentType(settings.paymentType || "alias")
          setUserCreationEnabled(settings.createUserEnabled ?? true)
          setTransferTimer(String(settings.timerSeconds ?? 30))
          setMinAmount(String(settings.minAmount ?? 2000))

          if (settings.phone) {
            const idx = SUPPORT_CONTACTS.findIndex((c) => c.phone === settings.phone)
            if (idx >= 0) {
              setSelectedContactIndex(String(idx))
              setIsPhoneEditable(SUPPORT_CONTACTS[idx].name === "Otro / Personalizado")
            } else {
              setSelectedContactIndex("0")
              setIsPhoneEditable(true)
            }
          } else {
            setSelectedContactIndex("0")
            setIsPhoneEditable(false)
          }

          if (settings.support_phone) {
            const idx = SUPPORT_CONTACTS.findIndex((c) => c.phone === settings.support_phone)
            if (idx >= 0) {
              setSelectedSupportContactIndex(String(idx))
              setIsSupportPhoneEditable(SUPPORT_CONTACTS[idx].name === "Otro / Personalizado")
            } else {
              setSelectedSupportContactIndex(String(SUPPORT_CONTACTS.length - 1))
              setIsSupportPhoneEditable(true)
            }
          } else {
            setSelectedSupportContactIndex(String(SUPPORT_CONTACTS.length - 1))
            setIsSupportPhoneEditable(false)
          }

          setBonusEnabled(settings.bonusEnabled ?? true)
          setBonusPercentage(String(settings.bonusPercentage ?? 25))
          setActiveBonusEnabled(settings.bonusEnabled ?? true)
          setActiveBonusPercentage(settings.bonusPercentage ?? 25)
          setRotationEnabled(settings.rotationEnabled ?? false)
        }
      }
    } catch (error) {
      console.error("Error loading config:", error)
    }
  }

  const toggleNumberActive = (id: number) => {
    const updated = attentionNumbers.map((n) => (n.id === id ? { ...n, active: !n.active } : n))
    setAttentionNumbers(updated)
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
                          const value = Math.max(10, Math.min(300, Number.parseInt(e.target.value) || 10))
                          setTransferTimer(String(value))
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
                          const value = Math.max(1000, Number.parseInt(e.target.value) || 1000)
                          setMinAmount(String(value))
                        }}
                        placeholder="2000"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                      />
                      <p className="text-xs text-gray-400">Monto mínimo en $ (1000 mínimo)</p>
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
                        placeholder={paymentType === "alias" ? "Ej: DLHogar.mp" : "Ej: 0000003100010000000000"}
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

                    {/* Contacto de Atención */}
                    <div className="space-y-3">
                      <Label className="text-base text-white font-medium flex items-center gap-2">
                        <Phone className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        Contacto de atención
                      </Label>
                      <p className="text-xs text-gray-400">Número para enviar comprobantes de transferencia</p>
                      <div className="flex items-center gap-4">
                        <Select value={selectedContactIndex} onValueChange={handleContactChange}>
                          <SelectTrigger className="h-14 flex-1 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl">
                            <SelectValue placeholder="Seleccioná un contacto…" />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-purple-600/40 rounded-xl">
                            {SUPPORT_CONTACTS.map((contact, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(idx)}
                                className="text-base font-medium text-white focus:bg-purple-950/50"
                              >
                                {contact.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={phone}
                          onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                          readOnly={!isPhoneEditable}
                          placeholder="Número"
                          className="h-14 w-40 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Contacto de Soporte */}
                    <div className="space-y-3">
                      <Label className="text-base text-white font-medium flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-400" strokeWidth={2} />
                        Contacto de soporte
                      </Label>
                      <p className="text-xs text-gray-400">Número para consultas y reclamos</p>
                      <div className="flex items-center gap-4">
                        <Select value={selectedSupportContactIndex} onValueChange={handleSupportContactChange}>
                          <SelectTrigger className="h-14 flex-1 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl">
                            <SelectValue placeholder="Seleccioná un contacto…" />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-purple-600/40 rounded-xl">
                            {SUPPORT_CONTACTS.map((contact, idx) => (
                              <SelectItem
                                key={idx}
                                value={String(idx)}
                                className="text-base font-medium text-white focus:bg-purple-950/50"
                              >
                                {contact.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={supportPhone}
                          onChange={(e) => setSupportPhone(sanitizePhone(e.target.value))}
                          readOnly={!isSupportPhoneEditable}
                          placeholder="Número"
                          className="h-14 w-40 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl"
                        />
                      </div>
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
                      <p className="text-xs text-gray-400">Este link se incluirá en los mensajes de WhatsApp</p>
                    </div>

                    <button
                      onClick={handleSave}
                      disabled={paymentType === "cbu" && alias.length !== 22}
                      className="w-full h-14 btn-gradient-animated text-white font-bold text-base rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                    >
                      <Save className="w-5 h-5" strokeWidth={2.5} />
                      Guardar Configuración
                    </button>
                  </div>

                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-6 space-y-4 animate-fadeIn shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <RefreshCw className="w-6 h-6 text-purple-500" strokeWidth={2.5} />
                      <h2 className="text-2xl font-bold text-white neon-text">Rotación de Números</h2>
                    </div>

                    <div className="p-6 rounded-2xl border-2 border-purple-600/40 bg-black/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-semibold text-white mb-1">Sistema de rotación</h4>
                          <p className="text-sm text-gray-400">
                            {rotationEnabled
                              ? "Rotación activa - Los números rotan automáticamente"
                              : "Rotación desactivada - Se usa el número fijo de atención"}
                          </p>
                        </div>
                        <button
                          onClick={() => setRotationEnabled(!rotationEnabled)}
                          className={`relative w-16 h-9 rounded-full transition-all duration-300 shadow-lg ${
                            rotationEnabled ? "bg-gradient-to-r from-purple-600 to-purple-500" : "bg-gray-700"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-md ${
                              rotationEnabled ? "left-8" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {rotationEnabled && (
                      <>
                        <p className="text-sm text-gray-400 mb-4">
                          Configura la rotación automática de números para distribuir la carga de mensajes
                        </p>

                        {/* Estado actual */}
                        {currentNumberInfo && (
                          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-600/40 mb-4">
                            <h4 className="text-sm font-semibold text-purple-300 mb-2">Número actual en uso:</h4>
                            <p className="text-white font-bold">{currentNumberInfo.label}</p>
                            <p className="text-gray-400 text-sm mt-1">{currentNumberInfo.phone}</p>
                            <p className="text-purple-400 text-sm mt-2">
                              {currentNumberInfo.mode} • {currentNumberInfo.progress}
                            </p>
                          </div>
                        )}

                        {/* Modo de rotación */}
                        <div className="space-y-3">
                          <Label className="text-base text-white font-medium">Modo de rotación</Label>
                          <Select
                            value={rotationMode}
                            onValueChange={(value: "clicks" | "time") => setRotationMode(value)}
                          >
                            <SelectTrigger className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-purple-600/40 rounded-xl">
                              <SelectItem value="clicks" className="text-base font-medium text-white">
                                Por clics (cantidad de usos)
                              </SelectItem>
                              <SelectItem value="time" className="text-base font-medium text-white">
                                Por tiempo (minutos)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Umbral */}
                        <div className="space-y-3">
                          <Label className="text-base text-white font-medium">
                            {rotationMode === "clicks" ? "Clics máximos por número" : "Minutos por número"}
                          </Label>
                          <Input
                            type="number"
                            value={rotationThreshold}
                            onChange={(e) => setRotationThreshold(Number(e.target.value))}
                            min={1}
                            placeholder={rotationMode === "clicks" ? "Ej: 100" : "Ej: 60"}
                            className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                          />
                          <p className="text-xs text-gray-400">
                            {rotationMode === "clicks"
                              ? "Cantidad de clics antes de rotar al siguiente número"
                              : "Minutos que un número permanece activo antes de rotar"}
                          </p>
                        </div>

                        {/* Lista de números */}
                        <div className="space-y-3">
                          <Label className="text-base text-white font-medium">Números de atención disponibles</Label>
                          <div className="space-y-2">
                            {attentionNumbers.map((number) => (
                              <div
                                key={number.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-purple-600/20"
                              >
                                <div className="flex-1">
                                  <p className="text-white font-medium">{number.label}</p>
                                  <p className="text-gray-400 text-sm">{number.phone}</p>
                                </div>
                                <button
                                  onClick={() => toggleNumberActive(number.id)}
                                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                    number.active
                                      ? "bg-green-600/20 text-green-400 border border-green-600/40"
                                      : "bg-gray-800 text-gray-500 border border-gray-700"
                                  }`}
                                >
                                  {number.active ? "Activo" : "Inactivo"}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Botones de acción de rotación */}
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleSaveRotationConfig}
                            className="flex-1 h-12 btn-gradient-animated text-white font-semibold text-base rounded-xl transition-all"
                          >
                            Guardar Rotación
                          </button>
                          {rotationMode === "clicks" && (
                            <button
                              onClick={() => {
                                resetClickCounters()
                                setCurrentNumberInfo(getCurrentNumberInfo())
                                alert("Contadores reseteados")
                              }}
                              className="h-12 px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all"
                            >
                              Resetear
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {!rotationEnabled && (
                      <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-700">
                        <p className="text-sm text-gray-400 mb-2">Número fijo en uso:</p>
                        <p className="text-white font-bold text-lg">{phone}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          Todos los mensajes se enviarán a este número de atención
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-6 space-y-3 animate-fadeIn shadow-xl">
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
                      {activePhone && (
                        <div className="flex justify-between py-2 border-b border-gray-800/50">
                          <span className="text-gray-400">Atención:</span>
                          <span className="text-white font-medium font-mono">{activePhone}</span>
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
          )}
        </div>
      </div>
    </div>
  )
}
