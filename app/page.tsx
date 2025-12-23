"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Check,
  Copy,
  Crown,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
  X,
  Hourglass,
  Gift,
  Shield,
  Users,
  Wallet,
  Clock,
  TrendingUp,
} from "lucide-react"

export default function TheCrown() {
  const [step, setStep] = useState(1)
  const [apodo, setApodo] = useState("")
  const [digitos, setDigitos] = useState("")
  const [plataforma, setPlataforma] = useState("g") // Fija en "Ganamos"
  const [usuario, setUsuario] = useState("")
  const [transferTime, setTransferTime] = useState("")
  const [titular, setTitular] = useState("")
  const [monto, setMonto] = useState("")
  const [copiedAlias, setCopiedAlias] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [apodoError, setApodoError] = useState("")
  const [plataformaError, setPlataformaError] = useState("")
  const [titularError, setTitularError] = useState("")
  const [montoError, setMontoError] = useState("")
  // Renamed state for modal
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [isStepAnimating, setIsStepAnimating] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [transferButtonTimer, setTransferButtonTimer] = useState(30)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [isBonusModalAnimating, setIsBonusModalAnimating] = useState(false)
  const [bonusAccepted, setBonusAccepted] = useState(false)
  const [timerHasStarted, setTimerHasStarted] = useState(false)

  const [alias, setAlias] = useState("")
  const [minAmount, setMinAmount] = useState(2000)
  const [userCreationEnabled, setUserCreationEnabled] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState("543415481923")
  const [paymentType, setPaymentType] = useState<"alias" | "cbu">("alias")
  const [originalTimerSeconds, setOriginalTimerSeconds] = useState(30)
  const [paymentData, setPaymentData] = useState("") // Para alias o cbu

  // New state for amount input formatting
  const [montoInput, setMontoInput] = useState("")
  const [username, setUsername] = useState("")
  const [copied, setCopied] = useState(false) // Renamed from copiedAlias for clarity

  // Separated config loading to only set timer when not in use
  useEffect(() => {
    const loadServerConfig = async () => {
      try {
        const response = await fetch(`/api/admin/settings?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.settings) {
            setAlias(data.settings.alias)
            setPhoneNumber(data.settings.phone)
            setPaymentType(data.settings.paymentType)
            setUserCreationEnabled(data.settings.createUserEnabled ?? true)
            const timerValue = data.settings.timerSeconds ?? 30
            setOriginalTimerSeconds(timerValue)

            // Only update transferButtonTimer if timer hasn't started yet
            if (!timerHasStarted) {
              setTransferButtonTimer(timerValue)
            }

            setMinAmount(data.settings.minAmount ?? 2000)
            setPaymentData(data.settings.paymentData || "") // Cargar alias/cbu
          }
        }
      } catch (error) {
        // Silent fail - use defaults
      }
    }

    loadServerConfig()
    const interval = setInterval(loadServerConfig, 10000)

    return () => clearInterval(interval)
  }, [timerHasStarted])

  const password = "12345678"

  const paymentLabel = paymentType === "alias" ? "Alias" : "CBU"
  const minAmountStr = String(minAmount)

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.add("dark")

      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual"
      }

      window.scrollTo({ top: 0, left: 0, behavior: "instant" })

      const savedUsername = localStorage.getItem("eds_username")
      if (savedUsername) {
        setUsuario(savedUsername)
        setUsername(savedUsername) // Set username state here as well
      }
      const savedTime = localStorage.getItem("eds_transfer_time")
      if (savedTime) {
        setTransferTime(savedTime)
      }
    }
  }, [])

  useEffect(() => {
    if (step === 2) {
      setIsDropdownOpen(true)
    } else {
      setIsDropdownOpen(false)
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" })

    // Initialize timer only on first entry to step 4
    if (step === 4) {
      if (!timerHasStarted) {
        setTransferButtonTimer(originalTimerSeconds)
        setTimerHasStarted(true)

        setShowBonusModal(true)
        setTimeout(() => setIsBonusModalAnimating(true), 10)
      }
    }

    // Reset timer state when leaving step 4
    if (step !== 4 && timerHasStarted) {
      setTimerHasStarted(false)
      setBonusAccepted(false)
    }
  }, [step, originalTimerSeconds, timerHasStarted])

  // Countdown timer runs only when conditions are met
  useEffect(() => {
    if (step === 4 && bonusAccepted && transferButtonTimer > 0) {
      const interval = setInterval(() => {
        setTransferButtonTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [step, bonusAccepted])

  const isApodoValid = useCallback((value: string) => {
    return /^[A-Za-zÀ-ÿ\s]+$/.test(value.trim())
  }, [])

  const isDigitosValid = useCallback((value: string) => {
    return /^\d{4}$/.test(value)
  }, [])

  const isPlataformaValid = useCallback((value: string) => {
    return value === "g" || value === "z"
  }, [])

  const isFormValid = isApodoValid(apodo) && isDigitosValid(digitos) && isPlataformaValid(plataforma)

  useEffect(() => {
    if (isApodoValid(apodo) && isDigitosValid(digitos) && !isPlataformaValid(plataforma) && plataforma === "") {
      setPlataformaError("Elegí una opción para continuar.")
    } else if (plataforma !== "" && !isPlataformaValid(plataforma)) {
      setPlataformaError("Elegí una opción para continuar.")
    } else {
      setPlataformaError("")
    }
  }, [apodo, digitos, plataforma, isApodoValid, isDigitosValid, isPlataformaValid])

  const sanitizeName = useCallback((str: string) => {
    const soloLetrasEspacios = str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
    return soloLetrasEspacios.replace(/\s+/g, "")
  }, [])

  const formatDateTime = useCallback((d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const year = d.getFullYear()
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }, [])

  const formatCurrency = useCallback((value: number | string): string => {
    const num = typeof value === "string" ? Number.parseFloat(value.replace(/,/g, ".")) : value
    if (isNaN(num)) return "0"
    return new Intl.NumberFormat("es-AR").format(num)
  }, [])

  const handleApodoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.normalize("NFD").replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    setApodo(cleaned)

    if (cleaned !== value) {
      setApodoError("Usá solo letras.")
    } else {
      setApodoError("")
    }
  }, [])

  const handleTitularChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.normalize("NFD").replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    setTitular(cleaned)

    if (cleaned !== value) {
      setTitularError("Usá solo letras.")
    } else {
      setTitularError("")
    }
  }, [])

  const handleDigitosChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value) && value.length <= 4) {
      setDigitos(value)
    }
  }, [])

  const handleCreateUser = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (!isApodoValid(apodo)) {
        alert("Usá solo letras.")
        return
      }
      if (!isDigitosValid(digitos)) {
        alert("Ingresá 4 dígitos.")
        return
      }
      // Plataforma ya es fija, no necesita validación aquí

      const apodoSan = sanitizeName(apodo)
      const apodoCapitalized = apodoSan.charAt(0).toUpperCase() + apodoSan.slice(1)
      const generatedUser = `${apodoCapitalized}${digitos}00g`
      setUsuario(generatedUser)
      setUsername(generatedUser) // Set username state for step 3
      localStorage.setItem("eds_username", generatedUser)
      localStorage.setItem("eds_platform", plataforma)
      setStep(3) // Directly set step instead of calling changeStep
    },
    [apodo, digitos, plataforma, isApodoValid, isDigitosValid, sanitizeName],
  )

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAlias(true)
    setShowToast(true)
    setTimeout(() => {
      setCopiedAlias(false)
      setShowToast(false)
    }, 1500)
  }, [])

  // Renamed to copyPaymentData for clarity
  const copyPaymentData = useCallback(() => {
    if (paymentData) {
      navigator.clipboard.writeText(paymentData)
      setCopied(true)
      setShowToast(true)
      setTimeout(() => {
        setCopied(false)
        setShowToast(false)
      }, 1500)
    }
  }, [paymentData])

  const handleTransferConfirmation = useCallback(() => {
    const now = new Date()
    const formattedTime = formatDateTime(now)
    localStorage.setItem("eds_transfer_time", formattedTime)
    setTransferTime(formattedTime)
    setStep(5) // Directly set step instead of calling changeStep
  }, [formatDateTime])

  // Modified to use the updated handleWhatsApp function
  const handleWhatsApp = useCallback(() => {
    const plataformaGuardada = localStorage.getItem("eds_platform") || plataforma
    let plataformaURL = ""

    if (plataformaGuardada === "g") {
      plataformaURL = "https://ganamos.sbs"
    } else if (plataformaGuardada === "z") {
      plataformaURL = "https://casinozeus.fit"
    }

    const message = `Hola, ya envié mi c4rg4.

Usu4rio: ${usuario}
Contr4seña: ${password}
Quiero jug4r en: ${plataformaURL}

Titular: ${titular}
Monto: $${formatCurrency(monto)}
Hora de transferencia: ${transferTime}

Adjunto comprobante.`
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }, [plataforma, usuario, titular, monto, transferTime, formatCurrency, password, phoneNumber])

  // Updated openInfoModal function
  const openInfoModal = useCallback(() => {
    setShowInfoModal(true)
    setTimeout(() => setIsModalAnimating(true), 10)
    sessionStorage.setItem("info_seen", "true")
  }, [])

  const closeInfoModal = useCallback(() => {
    setIsModalAnimating(false)
    setTimeout(() => setShowInfoModal(false), 300)
  }, [])

  const isSoporteButtonEnabled = titular.trim().length > 0 && monto.trim().length > 0

  const changeStep = useCallback((newStep: number, direction: "forward" | "back" = "forward") => {
    setIsStepAnimating(false)
    setTimeout(() => {
      setStep(newStep)
      setTimeout(() => setIsStepAnimating(true), 50)
    }, 400)
  }, [])

  const handleInputBlur = useCallback(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
      }, 100)
    }
  }, [])

  const closeBonusModal = useCallback(() => {
    setIsBonusModalAnimating(false)
    setTimeout(() => {
      setShowBonusModal(false)
      setBonusAccepted(true)
    }, 300)
  }, [])

  const handleWhatsAppSend = useCallback(() => {
    // Lógica para enviar mensaje de WhatsApp con los datos del paso 5
    // Esta función se llama desde el botón de "Acreditar mi carga" en el paso 5
    handleWhatsApp() // Reutilizamos la lógica de handleWhatsApp
    setStep(7) // Directly set step instead of calling changeStep
  }, [handleWhatsApp])

  // This function seems redundant with handleWhatsAppSend now, but kept for potential future use
  const handleContinueTransfer = useCallback(() => {
    if (!titular || !monto) {
      // Basic validation, specific errors are handled inline
      alert("Por favor, completá todos los campos.")
      return
    }
    // Simulate sending data or moving to next step
    // For now, we assume it leads to confirming the transfer
    setStep(5) // Directly set step instead of calling changeStep
  }, [titular, monto])

  // Modified handleMontoChange to use formatCurrency and update montoInput state
  const handleMontoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9,.]/g, "") // Allow numbers, commas, and periods
      setMontoInput(value) // Keep the input as typed

      const cleanedValue = value.replace(/,/g, ".") // Normalize comma to dot for parsing
      const num = Number.parseFloat(cleanedValue)

      if (!isNaN(num)) {
        if (num < minAmount) {
          setMontoError(`El monto mínimo es $${formatCurrency(minAmount)}`)
        } else {
          setMontoError("")
        }
        // Update the actual 'monto' state with formatted value if needed elsewhere, or just use formatted input
        // For submission, you'll likely want the parsed number or a consistently formatted string
      } else if (value.trim() === "") {
        setMontoError("") // Clear error if input is empty
        setMonto("") // Clear actual monto state if input is empty
      } else {
        setMontoError("Formato de monto inválido")
      }
    },
    [minAmount, formatCurrency],
  )

  // This useEffect updates the 'monto' state from 'montoInput' when it's considered valid for submission,
  // or when transitioning steps where 'monto' is used.
  // It ensures 'monto' has a clean, parsable numeric string or is formatted correctly.
  useEffect(() => {
    const cleanedValue = montoInput.replace(/,/g, ".")
    const num = Number.parseFloat(cleanedValue)
    if (!isNaN(num) && num >= minAmount) {
      setMonto(cleanedValue) // Store a parsable version
    } else {
      setMonto("") // Clear if invalid or below minimum
    }
  }, [montoInput, minAmount])

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for reset query parameter (for testing)
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get("resetBonus") === "1") {
        localStorage.removeItem("bonus20_seen")
      }
    }
  }, [])

  const handleCopyAlias = useCallback(() => {
    copyToClipboard(paymentData || alias || "No configurado")
  }, [paymentData, alias, copyToClipboard])

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black">
      {showToast && (
        <div
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black shadow-2xl border border-gray-200"
          style={{ animation: "slideDown 0.3s ease" }}
        >
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-purple-600" strokeWidth={2} />
            <span>Copiado</span>
          </div>
        </div>
      )}

      <div className="container relative z-10 mx-auto max-w-md pt-20 pb-24 px-6">
        {isDropdownOpen && (
          <div className="fixed inset-0 z-50 bg-transparent" onClick={() => setIsDropdownOpen(false)} />
        )}

        {/* Bonus Modal */}
        {showBonusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div
              className={`relative w-full max-w-sm bg-black border border-purple-600/30 rounded-2xl shadow-2xl transition-all duration-300 ${
                isBonusModalAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              {/* Fondo cambiado de blanco a negro con borde morado */}
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3 justify-center">
                  <Gift className="w-10 h-10 text-purple-500" strokeWidth={2} />
                  <h2 className="text-3xl font-bold text-white">¡Felicitaciones!</h2>
                </div>

                <div className="space-y-4 text-center">
                  <div className="bg-purple-950/50 border border-purple-600/30 rounded-xl p-6">
                    <p className="text-5xl font-bold text-purple-400 mb-2">25%</p>
                    <p className="text-lg text-white font-medium">Adicional en tu primera carga</p>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Recordá, el bono <span className="font-bold text-purple-400">no forma parte del premio</span>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeBonusModal}
                  className="w-full h-14 btn-gradient-animated text-white font-semibold rounded-xl transition-all hover:scale-105"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Retiros - Updated content */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div
              className={`relative w-full max-w-sm bg-black rounded-2xl shadow-2xl border border-purple-600/30 transition-all duration-300 ${
                isModalAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <button
                onClick={closeInfoModal}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" strokeWidth={2} />
              </button>

              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Wallet className="w-8 h-8 text-purple-500" strokeWidth={2} />
                  <h2 className="text-2xl font-bold text-white">Modalidad de Retiros</h2>
                </div>

                <div className="space-y-5 text-sm text-gray-300 leading-relaxed">
                  <div className="bg-purple-950/30 border border-purple-600/30 rounded-xl p-4">
                    <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" strokeWidth={2} />
                      Límites por retiro
                    </h3>
                    <p>
                      Podés realizar hasta <strong className="text-white">2 retiros</strong> de máximo{" "}
                      <strong className="text-white">$125.000</strong> cada uno.
                    </p>
                  </div>

                  <div className="bg-purple-950/30 border border-purple-600/30 rounded-xl p-4">
                    <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5" strokeWidth={2} />
                      Límite diario
                    </h3>
                    <p>
                      Total máximo de <strong className="text-white">$250.000</strong> cada 24 horas.
                    </p>
                  </div>

                  <div className="text-center text-xs text-gray-500 pt-2">
                    Los retiros se procesan de forma inmediata una vez aprobados.
                  </div>
                </div>

                <button
                  onClick={closeInfoModal}
                  className="w-full h-14 btn-gradient-animated text-white font-semibold rounded-xl transition-all hover:scale-105"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 1 - Bienvenida SIN CARD */}
        {step === 1 && (
          <div
            className={`transition-all duration-500 ease-out ${
              isStepAnimating ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            }`}
            style={{
              animation: isStepAnimating ? "scalePopIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          >
            <div className="text-center space-y-16">
              <div className="space-y-4">
                <Crown className="w-20 h-20 text-purple-500 mx-auto mb-6" strokeWidth={1.5} />
                <h1 className="text-6xl font-bold tracking-tight text-white">TheCrown</h1>
                <p className="text-lg text-gray-400 font-normal">Plataforma Premium de Pagos</p>
              </div>

              <div className="space-y-5">
                {userCreationEnabled && (
                  <button
                    onClick={() => changeStep(2, "forward")}
                    className="w-full h-14 btn-gradient-animated text-white font-semibold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
                  >
                    Crear Usuario
                  </button>
                )}

                {/* Updated buttons: removed Horarios, changed Info to Retiros, only 2 buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={openInfoModal}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl border border-gray-800 hover:border-purple-600 transition-colors group"
                  >
                    <Wallet
                      className="w-6 h-6 text-gray-400 group-hover:text-purple-500 transition-colors"
                      strokeWidth={2}
                    />
                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors font-medium">
                      Retiros
                    </span>
                  </button>

                  <button
                    onClick={() => changeStep(7, "forward")}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl border border-gray-800 hover:border-purple-600 transition-all group hover:scale-105"
                  >
                    <MessageCircle
                      className="w-6 h-6 text-gray-400 group-hover:text-purple-500 transition-colors"
                      strokeWidth={2}
                    />
                    <span className="text-xs text-gray-400 group-hover:text-white transition-colors font-medium">
                      Soporte
                    </span>
                  </button>
                </div>

                {!userCreationEnabled && (
                  <div className="flex items-center gap-2 justify-center text-sm text-gray-400 bg-gray-900 p-4 rounded-xl border border-gray-800">
                    <AlertCircle className="w-5 h-5" strokeWidth={2} />
                    <span>Creación de usuarios temporalmente deshabilitada</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PASO 2 - Crear Usuario */}
        {step === 2 && (
          <div
            className="w-full max-w-md mx-auto"
            style={{
              animation: isStepAnimating ? "slideInFromRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          >
            <div className={`space-y-8 transition-all duration-500 ${isStepAnimating ? "opacity-100" : "opacity-0"}`}>
              <div className="text-center space-y-2">
                <Crown className="w-10 h-10 mx-auto text-purple-500 mb-4" strokeWidth={2} />
                <h2 className="text-3xl font-black text-white">Crear Usuario</h2>
                <p className="text-gray-400 text-sm">Completá tus datos para comenzar</p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="apodo" className="text-base text-gray-300 font-medium">
                    Apodo
                  </Label>
                  <Input
                    id="apodo"
                    type="text"
                    value={apodo}
                    onChange={handleApodoChange}
                    placeholder="Ingresá tu apodo"
                    className="h-14 text-base bg-gray-900 border-gray-800 focus:border-purple-600 transition-colors text-white placeholder:text-gray-600 rounded-xl"
                    required
                  />
                  {apodoError && <p className="text-red-500 text-xs mt-1">{apodoError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="digitos" className="text-base text-gray-300 font-medium">
                    Últimos 4 dígitos del celular
                  </Label>
                  <Input
                    id="digitos"
                    value={digitos}
                    onChange={handleDigitosChange}
                    placeholder="1234"
                    className="h-14 bg-gray-900 border border-gray-800 text-white text-base focus:border-purple-600 transition-colors rounded-xl"
                    maxLength={4}
                  />
                </div>

                {/* Plataforma fija en Ganamos */}
                <div className="space-y-2">
                  <Label className="text-base text-gray-300 font-medium">Plataforma</Label>
                  <div className="h-14 bg-gray-900 border border-gray-800 rounded-xl flex items-center px-4">
                    <span className="text-base text-white">Ganamos</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => changeStep(3, "forward")}
                    disabled={!isFormValid}
                    className={`w-full h-14 font-semibold text-base rounded-xl transition-all ${
                      isFormValid
                        ? "btn-gradient-animated text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
                        : "bg-gray-900 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Siguiente
                  </button>

                  <button
                    onClick={() => changeStep(1, "back")}
                    className="w-full h-14 text-base border border-gray-800 hover:border-purple-600 transition-all text-white font-medium rounded-xl hover:scale-105"
                  >
                    <ArrowLeft className="w-5 h-5 inline mr-2" strokeWidth={2} />
                    Volver
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PASO 3 - Usuario Creado SIN CARD */}
        {step === 3 && (
          <div
            className={`transition-all duration-500 ease-out ${
              isStepAnimating ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-90"
            }`}
            style={{
              animation: isStepAnimating ? "fadeInZoom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          >
            <div className="space-y-10">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
                    <Check className="w-10 h-10 text-white" strokeWidth={2} />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-white">Usuario Creado</h2>
                <p className="text-base text-gray-400">Tu usuario fue creado con éxito</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-400">Usuario</Label>
                  <div className="h-14 px-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center">
                    <span className="text-lg font-mono text-purple-500 font-semibold">{usuario}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium text-gray-400">Contraseña</Label>
                  <div className="h-14 px-4 rounded-xl bg-gray-900 border border-gray-800 flex items-center">
                    <span className="text-lg font-mono text-purple-500 font-semibold">{password}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={() => changeStep(4, "forward")}
                  className="w-full h-14 btn-gradient-animated text-white font-semibold text-base rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
                >
                  Ir a pagar
                </button>

                <button
                  onClick={() => changeStep(2, "back")}
                  className="w-full h-14 text-base border border-gray-800 hover:border-purple-600 transition-all text-white font-medium rounded-xl hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-2" strokeWidth={2} />
                  Atrás
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 4 - Enviá tu carga */}
        {step === 4 && (
          <div
            className="w-full max-w-md mx-auto"
            style={{
              animation: isStepAnimating ? "slideInFromRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          >
            <div className={`space-y-8 transition-all duration-500 ${isStepAnimating ? "opacity-100" : "opacity-0"}`}>
              <div className="text-center space-y-2">
                <Crown className="w-10 h-10 mx-auto text-purple-500 mb-4" strokeWidth={2} />
                <h2 className="text-3xl font-black text-white">Enviá tu carga</h2>
                <p className="text-gray-400 text-sm">Hacé la transferencia y confirmala</p>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Carga mínima:</span>
                    <span className="text-lg font-bold text-white">${formatCurrency(minAmount)}</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <span className="text-base text-gray-400">Alias</span>
                    <span className="text-2xl font-bold text-purple-400">
                      {paymentData || alias || "No configurado"}
                    </span>
                    <button
                      onClick={handleCopyAlias}
                      className="btn-gradient-animated px-6 py-2 text-white rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(167,139,250,0.5)] flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" strokeWidth={2} />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" strokeWidth={2} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => changeStep(5, "forward")}
                  disabled={transferButtonTimer > 0}
                  className={`w-full h-14 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-all ${
                    transferButtonTimer > 0
                      ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                      : "btn-gradient-animated text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
                  }`}
                >
                  {transferButtonTimer > 0 ? (
                    <>
                      <Hourglass className="w-5 h-5 animate-spin" strokeWidth={2} />
                      <span>Esperando transferencia</span>
                    </>
                  ) : (
                    <span>Ya envié el dinero</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 5 - Últimos detalles */}
        {step === 5 && (
          <div
            className="w-full max-w-md mx-auto"
            style={{
              animation: isStepAnimating ? "slideInFromRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          >
            <div className={`space-y-8 transition-all duration-500 ${isStepAnimating ? "opacity-100" : "opacity-0"}`}>
              <div className="text-center space-y-2">
                <Crown className="w-10 h-10 mx-auto text-purple-500 mb-4" strokeWidth={2} />
                <h2 className="text-3xl font-bold text-white">Últimos detalles</h2>
                <p className="text-gray-400 text-sm">Completá los datos de la transferencia</p>
              </div>

              <div className="p-4 bg-purple-950/20 border border-purple-800/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-purple-300">Importante:</span> Asegurate de que el titular y el
                    monto coincidan exactamente con los datos de tu transferencia para que tu carga se acredite más
                    rápido.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="titular-step5" className="block text-base font-medium text-gray-300 mb-2">
                      Titular de la cuenta
                    </label>
                    <input
                      id="titular-step5"
                      type="text"
                      value={titular}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^[A-Za-zÀ-ÿ\s]*$/.test(value)) {
                          setTitular(value)
                          setTitularError("")
                        }
                      }}
                      onBlur={() => {
                        if (titular.trim() && !/^[A-Za-zÀ-ÿ\s]+$/.test(titular.trim())) {
                          setTitularError("Solo se permiten letras")
                        } else {
                          setTitularError("")
                        }
                      }}
                      placeholder="Nombre completo del titular"
                      className="w-full h-14 px-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-600 transition-colors"
                    />
                    {titularError && <p className="text-red-500 text-xs mt-1">{titularError}</p>}
                  </div>

                  <div>
                    <label htmlFor="monto-step5" className="block text-base font-medium text-gray-300 mb-2">
                      Monto a depositado
                    </label>
                    <input
                      id="monto-step5"
                      type="text"
                      value={montoInput} // Use montoInput for the typed value
                      onChange={handleMontoChange}
                      placeholder={`Mínimo $${formatCurrency(minAmount)}`}
                      className="w-full h-14 px-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-600 transition-colors"
                    />
                    {montoError && <p className="text-red-500 text-xs mt-1">{montoError}</p>}
                  </div>
                </div>

                <button
                  onClick={handleWhatsAppSend}
                  disabled={!isSoporteButtonEnabled}
                  className={`w-full h-14 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-all ${
                    !isSoporteButtonEnabled
                      ? "bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800"
                      : "btn-gradient-animated text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" strokeWidth={2} />
                  <span>{!isSoporteButtonEnabled ? "Completar los campos" : "Acreditar mi carga"}</span>
                </button>

                <button
                  onClick={() => changeStep(4, "back")}
                  className="w-full h-14 text-base border border-gray-800 hover:border-purple-600 transition-all text-white font-medium rounded-xl hover:scale-105"
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 6 - Preguntas Frecuentes SIN CARD */}
        {step === 6 && (
          <div
            className={`transition-all duration-500 ease-out ${
              isStepAnimating ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
            }`}
            style={{
              animation: isStepAnimating ? "fadeInZoom 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          >
            <div className="space-y-10">
              <div className="space-y-3 text-center">
                <h2 className="text-4xl font-bold text-white">Preguntas Frecuentes</h2>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-3">
                <AccordionItem
                  value="item-1"
                  className="border-0 bg-gray-900 rounded-xl px-5 py-1 border border-gray-800"
                >
                  <AccordionTrigger className="text-left text-white hover:text-purple-500 transition-colors font-medium text-base">
                    ¿Cuánto tarda en acreditarse mi carga?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 leading-relaxed text-sm pt-2">
                    Las cargas se acreditan en un plazo de 5 a 30 minutos.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-2"
                  className="border-0 bg-gray-900 rounded-xl px-5 py-1 border border-gray-800"
                >
                  <AccordionTrigger className="text-left text-white hover:text-purple-500 transition-colors font-medium text-base">
                    ¿Puedo cargar desde otra cuenta?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 leading-relaxed text-sm pt-2">
                    Sí, podés cargar desde cualquier cuenta.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-3"
                  className="border-0 bg-gray-900 rounded-xl px-5 py-1 border border-gray-800"
                >
                  <AccordionTrigger className="text-left text-white hover:text-purple-500 transition-colors font-medium text-base">
                    ¿Qué hago si me equivoqué de monto?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 leading-relaxed text-sm pt-2">
                    Contactá inmediatamente al soporte por WhatsApp.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem
                  value="item-4"
                  className="border-0 bg-gray-900 rounded-xl px-5 py-1 border border-gray-800"
                >
                  <AccordionTrigger className="text-left text-white hover:text-purple-500 transition-colors font-medium text-base">
                    ¿Qué horario tiene el soporte?
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-400 leading-relaxed text-sm pt-2">
                    El soporte está disponible de 9:00 a 23:00 hs.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <button
                onClick={() => changeStep(5, "back")}
                className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base rounded-xl transition-all flex items-center justify-center gap-3 hover:scale-105 hover:shadow-[0_0_30px_rgba(167,139,250,0.5)]"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                <span>Volver</span>
              </button>
            </div>
          </div>
        )}

        {/* PASO 7 - Soporte SIN CARD */}
        {step === 7 && (
          <div
            className={`transition-all duration-500 ease-out ${
              isStepAnimating ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-8 scale-95"
            }`}
            style={{
              animation: isStepAnimating ? "slideInFromLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          >
            <div className="space-y-10">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-purple-500" strokeWidth={2} />
                  </div>
                </div>
                <h2 className="text-4xl font-bold text-white">Soporte</h2>
              </div>

              <p className="text-center text-gray-400 text-base leading-relaxed">
                Comunicate con nuestro equipo para reclamos y consultas sobre fichas, accesos o promociones.
              </p>

              <div className="space-y-4">
                <a
                  href="https://wa.me/543416605903?text=Hola,%20me%20contacto%20desde%20TheCrown."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base rounded-xl transition-all flex items-center justify-center gap-3 hover:scale-105 hover:shadow-[0_0_30px_rgba(167,139,250,0.5)]"
                >
                  <MessageCircle className="w-5 h-5" strokeWidth={2} />
                  <span>Contactar</span>
                </a>

                <button
                  onClick={() => changeStep(1, "back")}
                  className="w-full h-14 text-base border border-gray-800 hover:border-purple-600 transition-all text-white font-medium rounded-xl hover:scale-105"
                >
                  <ArrowLeft className="w-5 h-5 inline mr-2" strokeWidth={2} />
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer minimalista */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-black/50 backdrop-blur-sm border-t border-gray-900">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-x-6 text-xs text-gray-500 overflow-x-auto">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Shield className="w-3.5 h-3.5" />
              Pagos Seguros
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Users className="w-3.5 h-3.5" />
              10K+ Usuarios
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <AlertCircle className="w-3.5 h-3.5" />
              +18 Juego responsable
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
