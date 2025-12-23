"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LinkIcon } from "lucide-react"
import {
  Lock,
  LogOut,
  Save,
  Phone,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  Shield,
  Crown,
  MessageCircle,
  Gift,
  Percent,
  CheckCircle,
} from "lucide-react"

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
        }
      }
    }

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

        alert(
          "✅ Configuración guardada exitosamente en Supabase.\nLos cambios son permanentes y se reflejan en todos los dispositivos.",
        )
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("❌ Error al guardar. Verificá tu conexión e intentá de nuevo.")
    }
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
        }
      }
    } catch (error) {
      console.error("Error loading config:", error)
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
            <div className="space-y-4 animate-slideInUp">
              {/* Card principal con fondo negro y bordes morados */}
              <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-purple-600/30 p-6 shadow-[0_0_50px_rgba(124,58,237,0.3)] space-y-4">
                {/* Header con ícono neon */}
                <div className="flex items-center gap-3 justify-center pb-3 border-b border-purple-600/20">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center neon-glow">
                    <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-3xl font-black text-white neon-text">Configuración</h1>
                </div>

                <div className="space-y-4">
                  {/* Control de acceso */}
                  {/* Sección con fondo sutil y borde morado */}
                  <div className="space-y-3 p-4 rounded-xl border border-purple-600/20 bg-purple-950/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                      Control de acceso
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-purple-600/10">
                      <Label htmlFor="user-creation-toggle" className="text-base text-white font-medium">
                        Permitir creación de usuarios
                      </Label>
                      <Switch
                        id="user-creation-toggle"
                        checked={userCreationEnabled}
                        onCheckedChange={setUserCreationEnabled}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  </div>

                  {/* Temporizador */}
                  <div className="space-y-3 p-4 rounded-xl border border-purple-600/20 bg-purple-950/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                      Temporizador
                    </h3>
                    <div className="space-y-3">
                      <Label htmlFor="transfer-timer" className="text-base text-white font-medium">
                        Tiempo de espera (segundos)
                      </Label>
                      <Input
                        id="transfer-timer"
                        type="text"
                        inputMode="numeric"
                        value={transferTimer}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          setTransferTimer(value)
                        }}
                        placeholder="30"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl"
                      />
                      <p className="text-sm text-gray-400 font-medium">
                        Tiempo de espera en la sección "Esperando transferencia" (10-300 segundos)
                      </p>
                    </div>
                  </div>

                  {/* Monto mínimo */}
                  <div className="space-y-3 p-4 rounded-xl border border-purple-600/20 bg-purple-950/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                      Monto mínimo
                    </h3>
                    <div className="space-y-3">
                      <Label htmlFor="min-amount" className="text-base text-white font-medium">
                        Monto mínimo de carga ($)
                      </Label>
                      <Input
                        id="min-amount"
                        type="text"
                        inputMode="numeric"
                        value={minAmount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          setMinAmount(value)
                        }}
                        placeholder="0"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl"
                      />
                      <p className="text-sm text-gray-400 font-medium">
                        Monto mínimo requerido para realizar una carga ($1,000 mínimo)
                      </p>
                    </div>
                  </div>

                  {/* Tipo de pago */}
                  <div className="space-y-3 p-4 rounded-xl border border-purple-600/20 bg-purple-950/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                      Tipo de pago
                    </h3>
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
                          className="w-6 h-6 text-purple-600 accent-purple-600"
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
                          className="w-6 h-6 text-purple-600 accent-purple-600"
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
                      placeholder={paymentType === "alias" ? "Ejemplo: DLHogar.mp" : "Ejemplo: 0000003100010000000000"}
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
                  <div className="space-y-3 p-4 rounded-xl border border-purple-600/20 bg-purple-950/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                      Contacto de atención
                    </h3>
                    <p className="text-sm text-gray-400">
                      Este número se usa para enviar comprobantes de transferencia
                    </p>

                    <div className="space-y-3">
                      <Label htmlFor="cfg-phone-select" className="text-base text-white font-medium">
                        Seleccionar contacto
                      </Label>
                      <Select value={selectedContactIndex} onValueChange={handleContactChange}>
                        <SelectTrigger
                          id="cfg-phone-select"
                          className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                        >
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
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="cfg-phone-display" className="text-base text-white font-medium">
                        Teléfono de atención
                      </Label>
                      <Input
                        id="cfg-phone-display"
                        type="text"
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                        readOnly={!isPhoneEditable}
                        placeholder="Número de teléfono"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Contacto de Soporte */}
                  <div className="space-y-3 p-4 rounded-xl border border-purple-600/20 bg-purple-950/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                      Contacto de soporte
                    </h3>
                    <p className="text-sm text-gray-400">Este número se usa para consultas y reclamos de usuarios</p>

                    <div className="space-y-3">
                      <Label htmlFor="cfg-support-select" className="text-base text-white font-medium">
                        Seleccionar contacto
                      </Label>
                      <Select value={selectedSupportContactIndex} onValueChange={handleSupportContactChange}>
                        <SelectTrigger
                          id="cfg-support-select"
                          className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white rounded-xl"
                        >
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
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="cfg-support-phone-display" className="text-base text-white font-medium">
                        Teléfono de soporte
                      </Label>
                      <Input
                        id="cfg-support-phone-display"
                        type="text"
                        inputMode="numeric"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(sanitizePhone(e.target.value))}
                        readOnly={!isSupportPhoneEditable}
                        placeholder="Número de teléfono"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* URL de Plataforma */}
                  <div className="space-y-3 p-4 rounded-xl border border-purple-600/20 bg-purple-950/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                      URL de Plataforma
                    </h3>
                    <p className="text-sm text-gray-400">
                      Este link se incluye en los mensajes de WhatsApp que envían los usuarios
                    </p>

                    <div className="space-y-3">
                      <Label htmlFor="cfg-platform-url" className="text-base text-white font-medium">
                        Link de la plataforma Ganamos
                      </Label>
                      <Input
                        id="cfg-platform-url"
                        type="url"
                        value={platformUrl}
                        onChange={(e) => setPlatformUrl(e.target.value)}
                        placeholder="https://ganamos.sbs"
                        className="h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl"
                      />
                      <p className="text-xs text-gray-500">
                        Ejemplo: https://ganamos.sbs o https://nuevaplataforma.com
                      </p>
                    </div>
                  </div>

                  {/* Configuración del Bono */}
                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-6 space-y-4 animate-fadeIn shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Gift className="w-6 h-6 text-purple-500 neon-glow" strokeWidth={2.5} />
                      <h2 className="text-2xl font-bold text-white neon-text">Configuración del Bono</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Toggle para activar/desactivar bono */}
                      <div className="flex items-center justify-between p-4 bg-black/60 border border-purple-600/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-950/50 rounded-lg flex items-center justify-center">
                            <Gift className="w-5 h-5 text-purple-400" strokeWidth={2} />
                          </div>
                          <div>
                            <label className="text-base font-medium text-white">Bono de primera carga</label>
                            <p className="text-xs text-gray-400">Activar o desactivar el bono para nuevos usuarios</p>
                          </div>
                        </div>
                        <Switch
                          checked={bonusEnabled}
                          onCheckedChange={setBonusEnabled}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>

                      {/* Input para porcentaje del bono */}
                      <div className="space-y-2">
                        <label className="text-base font-medium text-white flex items-center gap-2">
                          <Percent className="w-4 h-4 text-purple-400" />
                          Porcentaje del Bono
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={bonusPercentage}
                          onChange={(e) => setBonusPercentage(e.target.value)}
                          disabled={!bonusEnabled}
                          className="w-full h-12 px-4 bg-black/60 border border-purple-600/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Ej: 25"
                        />
                        <p className="text-xs text-gray-400">
                          Porcentaje adicional que recibirán los usuarios en su primera carga (0-100%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones con gradientes animados */}
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={paymentType === "cbu" && alias.length !== 22}
                      className="flex-1 h-14 btn-gradient-animated text-white font-bold text-base rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" strokeWidth={2.5} />
                      Guardar
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 h-14 border-2 border-purple-600/40 hover:border-purple-500 hover:bg-purple-950/30 transition-all text-white font-bold text-base rounded-xl flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" strokeWidth={2.5} />
                      Salir
                    </button>
                  </div>
                </div>

                {/* Configuración Activa */}
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
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
