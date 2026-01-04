"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
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
import Link from "next/link"

const TIMER_MIN = 10
const TIMER_MAX = 300
const MIN_AMOUNT_DEFAULT = 1000
const MAX_NUMBERS = 9
const POLLING_INTERVAL = 2000

const sanitizeAlias = (value: string): string => value.replace(/[^A-Za-z0-9.-]/g, "").slice(0, 50)
const sanitizeCBU = (value: string): string => value.replace(/\D/g, "").slice(0, 22)
const sanitizePhone = (value: string): string => value.replace(/\D/g, "").slice(0, 15)

const createEmptyNumbers = (): AttentionNumber[] =>
  Array.from({ length: MAX_NUMBERS }, (_, i) => ({
    id: String(i + 1),
    phone: "",
    label: "",
    active: false,
  }))

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null) // Estado para el error de login
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
  const [attentionNumbers, setAttentionNumbers] = useState<AttentionNumber[]>(createEmptyNumbers())

  // Nuevo número
  const [newNumberLabel, setNewNumberLabel] = useState("")
  const [newNumberPhone, setNewNumberPhone] = useState("")
  const [showAddNumberForm, setShowAddNumberForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [forcingRotation, setForcingRotation] = useState(false)

  // Estados de rotación
  const [currentRotationIndex, setCurrentRotationIndex] = useState(0)
  const [rotationClickCount, setRotationClickCount] = useState(0)
  const [rotationLastUpdate, setRotationLastUpdate] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const activeNumbers = useMemo(
    () => attentionNumbers.filter((n) => n.phone.trim() !== "" && n.active),
    [attentionNumbers],
  )

  const numbersWithPhone = useMemo(() => attentionNumbers.filter((n) => n.phone.trim() !== ""), [attentionNumbers])

  const loadRotationNumbers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()

      if (data.success && data.settings) {
        const settings = data.settings

        if (settings.attentionNumbers && Array.isArray(settings.attentionNumbers)) {
          const numbers: AttentionNumber[] = settings.attentionNumbers.map((num: any, index: number) => ({
            id: String(index + 1),
            phone: num.phone || "",
            label: num.name || "",
            active: num.active || false,
          }))
          setAttentionNumbers(numbers)
        } else {
          setAttentionNumbers(createEmptyNumbers())
        }

        setRotationMode(settings.rotationMode || "clicks")
        setRotationThreshold(settings.rotationThreshold || 10)
      }
    } catch (error) {
      console.error("Error al cargar números de rotación:", error)
    }
  }, [])

  const loadSettings = useCallback(async () => {
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
  }, [])

  const loadRotationStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        credentials: "include",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setCurrentRotationIndex(data.settings.currentRotationIndex || 0)
          setRotationClickCount(data.settings.rotationClickCount || 0)
          if (data.settings.rotation_last_update) {
            setRotationLastUpdate(new Date(data.settings.rotation_last_update))
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar estado de rotación:", error)
    }
  }, [])

  const handleForceRotation = useCallback(async () => {
    if (!rotationEnabled) {
      alert('Debes activar el "Sistema de Rotación" primero antes de poder rotar números manualmente.')
      return
    }

    if (activeNumbers.length < 2) {
      alert(
        `Necesitas al menos 2 números activos para rotar.\n\nActualmente tienes ${activeNumbers.length} número(s) activo(s).\n\nActiva más números usando los switches verdes en la lista.`,
      )
      return
    }

    setForcingRotation(true)
    try {
      const response = await fetch("/api/admin/rotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: adminPin,
          forceRotate: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error al rotar: ${error.error || "Error desconocido"}`)
        return
      }

      const data = await response.json()
      await loadRotationNumbers()

      const newActiveNumber = attentionNumbers.find((num) => num.id === String(data.currentIndex + 1))
      if (newActiveNumber) {
        alert(`Rotación exitosa!\n\nNuevo número activo:\n${newActiveNumber.label} - ${newActiveNumber.phone}`)
      } else {
        alert("Rotación exitosa!")
      }
    } catch (error) {
      console.error("Error al forzar rotación:", error)
      alert("Error de conexión al intentar rotar.")
    } finally {
      setForcingRotation(false)
    }
  }, [rotationEnabled, activeNumbers, adminPin, attentionNumbers, loadRotationNumbers])

  // Auth check on mount
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
          loadRotationStatus()
        }
      }
    }
    checkAuth()
  }, [loadSettings, loadRotationNumbers, loadRotationStatus])

  // Polling for rotation status
  useEffect(() => {
    if (rotationEnabled) {
      loadRotationStatus()
      const interval = setInterval(loadRotationStatus, POLLING_INTERVAL)
      return () => clearInterval(interval)
    }
  }, [rotationEnabled, loadRotationStatus])

  // Timer countdown for time-based rotation
  useEffect(() => {
    if (rotationEnabled && rotationMode === "time" && rotationLastUpdate) {
      const updateTimer = () => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - rotationLastUpdate.getTime()) / 1000 / 60)
        const remaining = Math.max(0, rotationThreshold - elapsed)
        setTimeRemaining(remaining)
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [rotationEnabled, rotationMode, rotationLastUpdate, rotationThreshold])

  const handleLogin = async () => {
    if (!pinInput.trim()) {
      setLoginError("Ingresá el PIN de administrador")
      return
    }

    setIsLoading(true)
    setLoginError(null) // Limpiar errores anteriores
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
          loadRotationNumbers()
          loadRotationStatus()
          setPinInput("")
        } else {
          setLoginError("PIN incorrecto")
          setPinInput("")
        }
      } else {
        const data = await response.json()
        setLoginError(data.error || "PIN incorrecto o error de conexión")
        setPinInput("")
      }
    } catch (error) {
      setLoginError("Error de conexión. Intentá de nuevo.")
      console.error("Login error:", error)
      setPinInput("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPinInput("")
    setAdminPin("")
    setLoginError(null) // Limpiar error de login al cerrar sesión
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
    value = paymentType === "cbu" ? sanitizeCBU(value) : sanitizeAlias(value)
    setAlias(value)
    validateCbu(value)
  }

  const handleToggleNumberActive = useCallback(
    (id: string) => {
      setAttentionNumbers((prev) => {
        if (!rotationEnabled) {
          return prev.map((num) => ({
            ...num,
            active: num.id === id ? !num.active : false,
          }))
        }
        return prev.map((num) => (num.id === id ? { ...num, active: !num.active } : num))
      })
    },
    [rotationEnabled],
  )

  const handleAddNumber = useCallback(() => {
    const emptyIndex = attentionNumbers.findIndex((num) => !num.phone.trim())

    if (emptyIndex === -1) {
      alert(`Has alcanzado el límite de ${MAX_NUMBERS} números`)
      return
    }

    const newNumber: AttentionNumber = {
      id: String(emptyIndex + 1),
      phone: newNumberPhone,
      label: newNumberLabel,
      active: true,
    }

    const updated = [...attentionNumbers]
    updated[emptyIndex] = newNumber
    setAttentionNumbers(updated)

    setNewNumberLabel("")
    setNewNumberPhone("")
    setShowAddNumberForm(false)
  }, [attentionNumbers, newNumberPhone, newNumberLabel])

  const handleUpdateNumber = useCallback((id: string, updates: Partial<AttentionNumber>) => {
    setAttentionNumbers((prev) => prev.map((num) => (num.id === id ? { ...num, ...updates } : num)))
  }, [])

  const handleDeleteNumber = useCallback((id: string) => {
    setAttentionNumbers((prev) =>
      prev.map((num) => (num.id === id ? { ...num, phone: "", label: "", active: false } : num)),
    )
  }, [])

  const handleSave = async () => {
    setSaving(true)

    try {
      const activeNumber = attentionNumbers.find((num) => num.active && num.phone.trim() !== "")

      const attentionColumns: Record<string, string | boolean> = {}
      attentionNumbers.forEach((num, index) => {
        const position = index + 1
        attentionColumns[`attention_phone_${position}`] = num.phone || ""
        attentionColumns[`attention_name_${position}`] = num.label || ""
        attentionColumns[`attention_active_${position}`] = num.active || false
      })

      const body = {
        pin: adminPin,
        alias: alias,
        paymentType: paymentType,
        createUserEnabled: userCreationEnabled,
        timerSeconds: Number.parseInt(transferTimer) || 30,
        minAmount: Number.parseInt(minAmount) || 2000,
        phone: activeNumber?.phone || "",
        supportPhone: supportPhone,
        platformUrl: platformUrl,
        bonusEnabled: bonusEnabled,
        bonusPercentage: Number.parseInt(bonusPercentage) || 25,
        rotationEnabled: rotationEnabled,
        rotationMode: rotationMode,
        rotationThreshold: rotationThreshold,
        ...attentionColumns,
      }

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setActiveAlias(alias)
          setActivePaymentType(paymentType)
          setActiveUserCreationEnabled(userCreationEnabled)
          setActiveTransferTimer(Number.parseInt(transferTimer) || 30)
          setActiveMinAmount(Number.parseInt(minAmount) || 2000)
          setActiveSupportPhone(supportPhone)
          setActivePlatformUrl(platformUrl)
          setActiveBonusEnabled(bonusEnabled)
          setActiveBonusPercentage(Number.parseInt(bonusPercentage) || 25)

          await loadRotationNumbers()
          alert("Configuración guardada correctamente")
        } else {
          alert(data.error || "Error al guardar la configuración")
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Error al guardar la configuración")
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Error al guardar la configuración. Verificá tu conexión e intentá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const handleTimerBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setTransferTimer(String(TIMER_MIN))
      return
    }
    const num = Number.parseInt(value)
    if (isNaN(num) || num < TIMER_MIN) {
      setTransferTimer(String(TIMER_MIN))
    } else if (num > TIMER_MAX) {
      setTransferTimer(String(TIMER_MAX))
    } else {
      setTransferTimer(String(num))
    }
  }

  const handleMinAmountBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === "") {
      setMinAmount(String(MIN_AMOUNT_DEFAULT))
      return
    }
    const num = Number.parseInt(value)
    if (isNaN(num) || num < MIN_AMOUNT_DEFAULT) {
      setMinAmount(String(MIN_AMOUNT_DEFAULT))
    } else {
      setMinAmount(String(num))
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <style jsx>{`
        @keyframes pulse-neon {
          0%, 100% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3); }
          50% { box-shadow: 0 0 30px rgba(124, 58, 237, 0.8), 0 0 60px rgba(124, 58, 237, 0.5); }
        }
        .neon-glow { animation: pulse-neon 2s ease-in-out infinite; }
        .neon-text { text-shadow: 0 0 10px rgba(124, 58, 237, 0.8), 0 0 20px rgba(124, 58, 237, 0.5); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .btn-gradient-animated {
          background: linear-gradient(-45deg, #7c3aed, #a855f7, #ec4899, #7c3aed);
          background-size: 300% 300%;
          animation: gradient-shift 4s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.3; }
        }
        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 50%;
          animation: float 8s ease-in-out infinite;
        }
        .particle-1 { top: 10%; left: 10%; animation-delay: 0s; }
        .particle-2 { top: 20%; right: 15%; animation-delay: 2s; }
        .particle-3 { bottom: 30%; left: 20%; animation-delay: 4s; }
        .particle-4 { bottom: 10%; right: 25%; animation-delay: 6s; }
      `}</style>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
        <div className="particle particle-4" />
      </div>

      <div className="relative z-10 p-4 md:p-6 pt-12">
        <div className="mx-auto max-w-2xl">
          {!isAuthenticated ? (
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-black/70 backdrop-blur-xl rounded-2xl border border-purple-600/30 p-8 shadow-[0_0_50px_rgba(124,58,237,0.3)] animate-fadeIn space-y-8">
                <div className="text-center space-y-4">
                  <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center neon-glow animate-pulse">
                    <Crown className="w-14 h-14 text-white" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-5xl font-black text-white neon-text">TheCrown</h1>
                  <p className="text-xl text-gray-300 text-center font-medium">Panel de Administración</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="admin-pin" className="text-xl text-white font-bold">
                      PIN de Acceso
                    </Label>
                    <Input
                      id="admin-pin"
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !isLoading && handleLogin()}
                      placeholder="Ingresá el PIN"
                      disabled={isLoading}
                      className="h-16 text-xl bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl hover:border-purple-500/60"
                    />
                    {loginError && <p className="text-red-400 text-lg text-center">{loginError}</p>}
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full h-16 btn-gradient-animated text-white font-bold text-xl rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Lock className="w-6 h-6" strokeWidth={2.5} />
                    {isLoading ? "Verificando..." : "Entrar"}
                  </button>
                </div>
                <div className="text-center">
                  <Link href="/" className="text-lg text-gray-400 hover:text-white transition-colors">
                    Volver al inicio
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-screen bg-black py-6 px-2 animate-fadeIn">
              <div className="max-w-5xl mx-auto space-y-4">
                {/* Header */}
                <div className="text-center space-y-3 mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Panel Admin
                  </h1>
                  <p className="text-gray-400 text-sm">Configuración del sistema</p>
                </div>

                <div className="space-y-4">
                  {/* Configuración general */}
                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-4 space-y-3 animate-fadeIn shadow-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
                      <h2 className="text-xl font-bold text-white neon-text">Configuración General</h2>
                    </div>

                    {/* Creación de usuarios */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/50 border border-purple-600/20">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" strokeWidth={2} />
                        <span className="text-gray-300 text-sm">Permitir crear usuarios nuevos</span>
                      </div>
                      <Switch checked={userCreationEnabled} onCheckedChange={setUserCreationEnabled} />
                    </div>

                    {/* Temporizador y Monto mínimo en una fila */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm text-white font-medium flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-400" strokeWidth={2} />
                          Temporizador (seg)
                        </Label>
                        <Input
                          type="number"
                          min={TIMER_MIN}
                          max={TIMER_MAX}
                          value={transferTimer}
                          onChange={(e) => setTransferTimer(e.target.value)}
                          onBlur={handleTimerBlur}
                          placeholder="30"
                          className="h-12 text-sm bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-white font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-purple-400" strokeWidth={2} />
                          Monto mínimo
                        </Label>
                        <Input
                          type="number"
                          min={MIN_AMOUNT_DEFAULT}
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          onBlur={handleMinAmountBlur}
                          placeholder="2000"
                          className="h-12 text-sm bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Tipo de pago y Alias/CBU */}
                    <div className="space-y-2">
                      <Label className="text-sm text-white font-medium flex items-center gap-1">
                        <Phone className="w-4 h-4 text-purple-400" strokeWidth={2} />
                        Método de pago
                      </Label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
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
                            className="w-4 h-4 text-purple-600 accent-purple-600"
                          />
                          <span className="text-sm text-white">Alias</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
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
                            className="w-4 h-4 text-purple-600 accent-purple-600"
                          />
                          <span className="text-sm text-white">CBU</span>
                        </label>
                        {paymentType === "cbu" && (
                          <span
                            className={`text-xs font-medium ${
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
                        className={`h-12 text-sm bg-black/50 border-purple-600/40 focus:border-purple-500 text-white placeholder:text-gray-500 rounded-xl ${
                          cbuError ? "border-red-400" : ""
                        }`}
                      />
                      {cbuError && (
                        <div className="flex items-center gap-2 text-red-400 text-xs font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                          <span>{cbuError}</span>
                        </div>
                      )}
                    </div>

                    {/* URL de Plataforma */}
                    <div className="space-y-1">
                      <Label className="text-sm text-white font-medium flex items-center gap-1">
                        <LinkIcon className="w-4 h-4 text-purple-400" strokeWidth={2} />
                        URL de Plataforma
                      </Label>
                      <Input
                        type="url"
                        value={platformUrl}
                        onChange={(e) => setPlatformUrl(e.target.value)}
                        placeholder="https://ganamos.sbs"
                        className="h-12 text-sm bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-xl"
                      />
                    </div>

                    {/* Configuración del Bono */}
                    <div className="space-y-3 rounded-lg border border-purple-500/20 bg-black/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Activar Bono</span>
                        <Switch checked={bonusEnabled} onCheckedChange={setBonusEnabled} />
                      </div>

                      {bonusEnabled && (
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-300">Porcentaje del Bono (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={bonusPercentage}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(100, Number.parseInt(e.target.value) || 0))
                              setBonusPercentage(String(value))
                            }}
                            className="h-10 bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Número de Soporte */}
                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
                      <h2 className="text-xl font-bold text-white neon-text">Número de Soporte</h2>
                    </div>
                    <p className="text-xs text-gray-400">Número fijo para consultas de soporte (no rota)</p>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(sanitizePhone(e.target.value))}
                      placeholder="543415481923"
                      className="h-12 text-sm bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-xl"
                    />
                  </div>

                  {/* Números de Atención */}
                  <div className="bg-black/40 backdrop-blur-md border border-purple-600/20 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
                      <h2 className="text-xl font-bold text-white neon-text">Números de Atención</h2>
                    </div>

                    {/* Toggle principal de rotación */}
                    <div className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-black/30 p-3">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-semibold text-white">Sistema de Rotación</h3>
                        <p className="text-xs text-gray-400">
                          {rotationEnabled ? "Activo - Distribuye mensajes" : "Desactivado - Solo un número fijo"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRotationEnabled(!rotationEnabled)}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                          rotationEnabled ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                            rotationEnabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Configuración de modo - Solo si rotación ON */}
                    {rotationEnabled && (
                      <div className="space-y-3 rounded-lg border border-purple-500/20 bg-black/30 p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs text-gray-300">Modo</label>
                            <select
                              value={rotationMode}
                              onChange={(e) => setRotationMode(e.target.value as "clicks" | "time")}
                              className="w-full rounded-lg border border-purple-500/30 bg-black/60 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            >
                              <option value="clicks">Por Clicks</option>
                              <option value="time">Por Tiempo</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-300">
                              {rotationMode === "clicks" ? "Clicks" : "Minutos"}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={rotationThreshold}
                              onChange={(e) => setRotationThreshold(Math.max(1, Number(e.target.value)))}
                              className="w-full rounded-lg border border-purple-500/30 bg-black/60 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista de números */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-300">
                        Lista de Números {!rotationEnabled && "(Solo 1 activo)"}
                      </h3>

                      {/* Panel de estado de rotación */}
                      {rotationEnabled && numbersWithPhone.length > 0 && (
                        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-green-300">
                                  {rotationMode === "clicks" ? "Por Clicks" : "Por Tiempo"}
                                </p>
                                <p className="text-xs text-gray-400">
                                  #{currentRotationIndex + 1}
                                  {attentionNumbers[currentRotationIndex]?.label &&
                                    ` - ${attentionNumbers[currentRotationIndex].label}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {rotationMode === "clicks" ? (
                                <>
                                  <p className="text-xl font-bold text-green-300">{rotationClickCount}</p>
                                  <p className="text-xs text-gray-400">de {rotationThreshold}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xl font-bold text-green-300">{timeRemaining}</p>
                                  <p className="text-xs text-gray-400">min rest.</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between border-t border-green-500/20 pt-2">
                            <p className="text-xs text-gray-400">Forzar rotación</p>
                            <button
                              onClick={handleForceRotation}
                              disabled={forcingRotation}
                              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                            >
                              {forcingRotation ? "Rotando..." : "Rotar Ahora"}
                            </button>
                          </div>
                        </div>
                      )}

                      {numbersWithPhone.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 p-6 text-center">
                          <p className="text-xs text-gray-400">No hay números configurados.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {numbersWithPhone.map((number) => {
                            const isCurrentlyActive =
                              rotationEnabled &&
                              attentionNumbers.findIndex((n) => n.id === number.id) === currentRotationIndex

                            return (
                              <div
                                key={number.id}
                                className={`flex items-center justify-between rounded-lg border p-2 transition-all ${
                                  isCurrentlyActive
                                    ? "border-green-500/50 bg-green-500/10"
                                    : "border-purple-500/20 bg-black/20"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    {isCurrentlyActive && (
                                      <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                                      </span>
                                    )}
                                    <p
                                      className={`text-sm font-medium truncate ${isCurrentlyActive ? "text-green-300" : "text-white"}`}
                                    >
                                      {number.label || "Sin nombre"}
                                    </p>
                                    {isCurrentlyActive && (
                                      <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-xs font-semibold text-green-300">
                                        ACTIVO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400 truncate">{number.phone}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={number.active}
                                    onCheckedChange={(checked) => {
                                      if (checked && !rotationEnabled) {
                                        setAttentionNumbers((prev) =>
                                          prev.map((n) => ({ ...n, active: n.id === number.id })),
                                        )
                                      } else {
                                        handleUpdateNumber(number.id, { active: checked })
                                      }
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNumber(number.id)}
                                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300 px-2 h-8 text-xs"
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Agregar nuevo número */}
                    <div className="space-y-2">
                      {!showAddNumberForm ? (
                        <Button
                          type="button"
                          onClick={() => setShowAddNumberForm(true)}
                          className="w-full h-10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 border border-purple-500/30 text-purple-200 text-sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar Número
                        </Button>
                      ) : (
                        <div className="space-y-2 rounded-lg border border-purple-500/30 bg-black/20 p-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-medium text-purple-300">Nuevo Número</h4>
                            <Button
                              type="button"
                              onClick={() => {
                                setShowAddNumberForm(false)
                                setNewNumberLabel("")
                                setNewNumberPhone("")
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-purple-400 hover:text-purple-300 h-6 px-2 text-xs"
                            >
                              Cancelar
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="text"
                              value={newNumberLabel}
                              onChange={(e) => setNewNumberLabel(e.target.value)}
                              placeholder="Nombre"
                              className="h-10 text-sm bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-lg"
                            />
                            <Input
                              type="tel"
                              inputMode="numeric"
                              value={newNumberPhone}
                              onChange={(e) => setNewNumberPhone(sanitizePhone(e.target.value))}
                              placeholder="543415481923"
                              className="h-10 text-sm bg-black/50 border-purple-600/40 focus:border-purple-500 text-white rounded-lg"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddNumber}
                            className="w-full h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Agregar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Configuración Activa */}
                  <div className="bg-black/40 backdrop-blur-md border border-green-600/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={2.5} />
                      <h2 className="text-xl font-bold text-white neon-text">Configuración Activa</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                        <span className="text-gray-400">Usuarios:</span>
                        <span className="text-white">{activeUserCreationEnabled ? "Si" : "No"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                        <span className="text-gray-400">Timer:</span>
                        <span className="text-white">{activeTransferTimer}s</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                        <span className="text-gray-400">Mínimo:</span>
                        <span className="text-white">${activeMinAmount}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-800/50">
                        <span className="text-gray-400">Bono:</span>
                        <span className="text-white">{activeBonusEnabled ? `${activeBonusPercentage}%` : "No"}</span>
                      </div>
                      {activeAlias && (
                        <div className="flex justify-between py-1.5 border-b border-gray-800/50 col-span-2">
                          <span className="text-gray-400">{activePaymentType === "alias" ? "Alias:" : "CBU:"}</span>
                          <span className="text-white font-mono truncate max-w-[150px]">{activeAlias}</span>
                        </div>
                      )}
                      {activeSupportPhone && (
                        <div className="flex justify-between py-1.5 border-b border-gray-800/50 col-span-2">
                          <span className="text-gray-400">Soporte:</span>
                          <span className="text-white font-mono">{activeSupportPhone}</span>
                        </div>
                      )}
                      {activePlatformUrl && (
                        <div className="flex justify-between py-1.5 border-b border-gray-800/50 col-span-2">
                          <span className="text-gray-400">URL:</span>
                          <span className="text-white truncate max-w-[150px]">{activePlatformUrl}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full h-10 border-2 border-purple-600/40 hover:border-purple-500 hover:bg-purple-950/30 transition-all text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mt-3"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={2.5} />
                      Salir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-auto h-12 px-6 btn-gradient-animated text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xl hover:shadow-xl shadow-purple-500/30 disabled:opacity-50"
          >
            <Save className="w-5 h-5" strokeWidth={2.5} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  )
}
