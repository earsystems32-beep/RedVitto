"use client"
import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import {
  Check,
  Copy,
  Crown,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
  X,
  Gift,
  Clock,
  ChevronRight,
  Phone,
  Loader2,
  Calendar,
} from "lucide-react"
import { generateVCF } from "@/lib/vcf-generator"
import { getNextAttentionNumber } from "@/lib/whatsapp-rotation"
import { downloadLaCoronaContact } from "@/lib/vcf-generator"
import { detectOS } from "@/lib/device-detection"

interface Settings {
  alias?: string
  phone?: string
  paymentType?: "alias" | "cbu"
  createUserEnabled?: boolean
  timerSeconds?: number
  minAmount?: number
  platformUrl?: string
  bonusEnabled?: boolean
  bonusPercentage?: number
  rotationEnabled?: boolean
  rotationMode?: string
  rotationThreshold?: number
  currentRotationIndex?: number
  rotationClickCount?: number
  lastRotationTime?: string
  attentionNumbers?: Array<{ phone?: string; label?: string; active?: boolean }>
  support_phone?: string
}

const DEFAULT_PASSWORD = "12345678"
const DEFAULT_PLATFORM_URL = "https://ganamos.sbs"
const CONFIG_REFRESH_INTERVAL = 10000

export default function TheCrown() {
  // Estados principales del flujo
  const [step, setStep] = useState(1)
  const [isStepAnimating, setIsStepAnimating] = useState(true)

  // Datos del formulario
  const [apodo, setApodo] = useState("")
  const [digitos, setDigitos] = useState("")
  const [plataforma, setPlataforma] = useState("g")
  const [usuario, setUsuario] = useState("")
  const [titular, setTitular] = useState("")
  const [monto, setMonto] = useState("")
  const [transferTime, setTransferTime] = useState("")

  // Estados de error
  const [apodoError, setApodoError] = useState("")
  const [digitosError, setDigitosError] = useState("")
  const [plataformaError, setPlataformaError] = useState("")
  const [titularError, setTitularError] = useState("")

  // Estados de UI
  const [copiedAlias, setCopiedAlias] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  // Timer y bono
  const [transferButtonTimer, setTransferButtonTimer] = useState(30)
  const [bonusAccepted, setBonusAccepted] = useState(false)
  const [timerHasStarted, setTimerHasStarted] = useState(false)
  const [originalTimerSeconds, setOriginalTimerSeconds] = useState(30)
  const [canProceed, setCanProceed] = useState(false)

  // Configuración del servidor
  const [settings, setSettings] = useState<Settings | null>(null)
  const [alias, setAlias] = useState("")
  const [minAmount, setMinAmount] = useState(2000)
  const [userCreationEnabled, setUserCreationEnabled] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [paymentType, setPaymentType] = useState<"alias" | "cbu">("alias")
  const [paymentData, setPaymentData] = useState("")
  const [platformUrl, setPlatformUrl] = useState(DEFAULT_PLATFORM_URL)
  const [bonusEnabled, setBonusEnabled] = useState(true)
  const [bonusPercentage, setBonusPercentage] = useState(25)
  const [rotationEnabled, setRotationEnabled] = useState(false)

  // Contacto y WhatsApp
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [attentionPhoneNumber, setAttentionPhoneNumber] = useState<string | null>(null)
  const [userOS, setUserOS] = useState<"ios" | "android" | "other">("other")
  const [contactTimer, setContactTimer] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)

  // Modal de advertencia
  const [showContactWarningModal, setShowContactWarningModal] = useState(false)
  const [canProceedAfterCopy, setCanProceedAfterCopy] = useState(false)

  const paymentLabel = useMemo(() => (paymentType === "alias" ? "Alias" : "CBU"), [paymentType])

  // Detectar OS al montar
  useEffect(() => {
    setUserOS(detectOS())
  }, [])

  useEffect(() => {
    const loadServerConfig = async () => {
      try {
        const response = await fetch(`/api/admin/settings?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        })
        if (!response.ok) return

        const data = await response.json()
        if (!data.success || !data.settings) return

        const s = data.settings
        setSettings(s)
        setAlias(s.alias || "")
        setPhoneNumber(s.phone || "")
        setPaymentType(s.paymentType || "alias")
        setUserCreationEnabled(s.createUserEnabled ?? true)

        const timerValue = s.timerSeconds ?? 30
        setOriginalTimerSeconds(timerValue)
        if (!timerHasStarted) setTransferButtonTimer(timerValue)

        setMinAmount(s.minAmount ?? 2000)
        setPaymentData(s.paymentData || "")
        setPlatformUrl(s.platformUrl || DEFAULT_PLATFORM_URL)
        setBonusEnabled(s.bonusEnabled ?? true)
        setBonusPercentage(s.bonusPercentage ?? 25)
        setRotationEnabled(s.rotationEnabled ?? false)

        if (!attentionPhoneNumber) {
          const nextPhone = await getNextAttentionNumber(s)
          setAttentionPhoneNumber(nextPhone)
        }
      } catch (error) {
        console.error("Error cargando settings:", error)
      }
    }

    loadServerConfig()
    const interval = setInterval(loadServerConfig, CONFIG_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [timerHasStarted, attentionPhoneNumber])

  // Inicialización del DOM
  useEffect(() => {
    if (typeof window === "undefined") return

    document.documentElement.classList.add("dark")
    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })

    const savedUsername = localStorage.getItem("eds_username")
    if (savedUsername) {
      setUsuario(savedUsername)
    }
    const savedTime = localStorage.getItem("eds_transfer_time")
    if (savedTime) setTransferTime(savedTime)
  }, [])

  // Manejo de cambio de paso
  useEffect(() => {
    setIsDropdownOpen(step === 2)
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })

    if (step === 5 && !timerHasStarted) {
      setTransferButtonTimer(originalTimerSeconds)
      setTimerHasStarted(true)
    }

    if (step !== 5 && timerHasStarted) {
      setTimerHasStarted(false)
      setBonusAccepted(false)
    }
  }, [step, originalTimerSeconds, timerHasStarted])

  // Timer del paso 5
  useEffect(() => {
    if (step !== 5 || transferButtonTimer <= 0) return

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
  }, [step, transferButtonTimer])

  // Habilitar botón cuando timer llega a 0
  useEffect(() => {
    setCanProceed(step === 5 && transferButtonTimer === 0)
  }, [step, transferButtonTimer])

  // Timer del paso 6 (contacto)
  useEffect(() => {
    if (step !== 6 || !timerActive || contactTimer <= 0) return

    const interval = setInterval(() => {
      setContactTimer((prev) => {
        if (prev <= 1) {
          setContactSaved(true)
          setTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [step, timerActive, contactTimer])

  // Reset del paso 6
  useEffect(() => {
    if (step === 6) {
      setContactTimer(30)
      setTimerActive(true)
      setCopiedPhone(false)
      setContactSaved(false)
    }
  }, [step])

  const isApodoValid = useCallback((value: string) => /^[A-Za-zÀ-ÿ\s]+$/.test(value.trim()), [])
  const isDigitosValid = useCallback((value: string) => /^\d{4}$/.test(value), [])
  const isPlataformaValid = useCallback((value: string) => value === "g" || value === "z", [])

  const isFormValid = useMemo(
    () => isApodoValid(apodo) && isDigitosValid(digitos) && isPlataformaValid(plataforma),
    [apodo, digitos, plataforma, isApodoValid, isDigitosValid, isPlataformaValid],
  )

  // Validación de plataforma
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
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
  }, [])

  const formatDateTime = useCallback((d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }, [])

  const formatCurrency = useCallback((value: number | string): string => {
    const num = typeof value === "string" ? Number.parseFloat(value.replace(/,/g, ".")) : value
    if (isNaN(num)) return "0"
    return new Intl.NumberFormat("es-AR").format(num)
  }, [])

  // Handlers de input
  const handleApodoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.normalize("NFD").replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    setApodo(cleaned)
    setApodoError(cleaned !== value ? "Usá solo letras." : "")
  }, [])

  const handleTitularChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.normalize("NFD").replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    setTitular(cleaned)
    setTitularError(cleaned !== value ? "Usá solo letras." : "")
  }, [])

  const handleDigitosChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cleaned = value.replace(/\D/g, "").slice(0, 4)
    setDigitos(cleaned)
    setDigitosError(cleaned !== value ? "Usá solo números." : "")
  }, [])

  const handleInputBlur = useCallback(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }), 100)
    }
  }, [])

  const changeStep = useCallback(
    (newStep: number, direction: "forward" | "back" = "forward") => {
      setIsStepAnimating(false)
      window.scrollTo({ top: 0, behavior: "smooth" })

      setTimeout(() => {
        setStep(newStep)
        setIsStepAnimating(true)

        if (newStep === 6 && direction === "forward") {
          const currentTime = formatDateTime(new Date())
          setTransferTime(currentTime)
          localStorage.setItem("eds_transfer_time", currentTime)
        }
      }, 200)
    },
    [formatDateTime],
  )

  // Crear usuario
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

      const apodoSan = sanitizeName(apodo)
      const apodoCapitalized = apodoSan.charAt(0).toUpperCase() + apodoSan.slice(1)
      const generatedUser = `${apodoCapitalized}${digitos}00g`

      setUsuario(generatedUser)
      localStorage.setItem("eds_username", generatedUser)
      localStorage.setItem("eds_platform", plataforma)

      changeStep(4, "forward")
    },
    [apodo, digitos, plataforma, isApodoValid, isDigitosValid, sanitizeName, changeStep],
  )

  // Copiar datos de pago
  const copyPaymentData = useCallback(() => {
    if (!paymentData) return
    navigator.clipboard.writeText(paymentData)
    setCopiedAlias(true)
    setShowToast(true)
    setTimeout(() => {
      setCopiedAlias(false)
      setShowToast(false)
    }, 1500)
  }, [paymentData])

  // Confirmar transferencia
  const handleTransferConfirmation = useCallback(() => {
    const now = new Date()
    const formattedTime = formatDateTime(new Date())
    localStorage.setItem("eds_transfer_time", formattedTime)
    setTransferTime(formattedTime)
    setStep(5)
  }, [formatDateTime])

  // Enviar a WhatsApp (legacy)
  const handleWhatsApp = useCallback(() => {
    const timeToUse = transferTime || localStorage.getItem("eds_transfer_time") || formatDateTime(new Date())
    const plataformaGuardada = localStorage.getItem("eds_platform") || plataforma
    const plataformaURL = plataformaGuardada === "z" ? "https://casinozeus.fit" : platformUrl

    const message = `Hola, ya envié mi c4rg4.

Usu4rio: ${usuario}
Contr4seña: ${DEFAULT_PASSWORD}
Pl4taform4: ${plataformaURL}

Titular: ${titular}
Monto: $${formatCurrency(monto)}
Hora de transferencia: ${timeToUse}

Adjunto comprobante.`

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank")
  }, [plataforma, usuario, titular, monto, transferTime, formatCurrency, phoneNumber, platformUrl, formatDateTime])

  // Modal info
  const openInfoModal = useCallback(() => {
    setShowInfoModal(true)
    setTimeout(() => setIsModalAnimating(true), 10)
    sessionStorage.setItem("info_seen", "true")
  }, [])

  const closeInfoModal = useCallback(() => {
    setIsModalAnimating(false)
    setTimeout(() => setShowInfoModal(false), 300)
  }, [])

  // Descargar contacto
  const handleDownloadContact = useCallback(() => {
    generateVCF(settings?.support_phone || "543416605903", "TheCrown Atención")
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }, [settings])

  const handleDownloadLaCorona = useCallback(async () => {
    if (!settings) return
    const currentPhone = await getNextAttentionNumber(settings)
    downloadLaCoronaContact(currentPhone)
    setContactSaved(true)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }, [settings])

  // Copiar número de atención
  const handleCopyNumber = useCallback(async () => {
    if (!attentionPhoneNumber) return

    try {
      const phoneWithPlus = attentionPhoneNumber.startsWith("+") ? attentionPhoneNumber : `+${attentionPhoneNumber}`

      await navigator.clipboard.writeText(phoneWithPlus)
      setCopiedPhone(true)
      setShowContactWarningModal(true)
      setCanProceedAfterCopy(false)
    } catch (err) {
      console.error("Error al copiar:", err)
    }
  }, [attentionPhoneNumber])

  // Enviar a WhatsApp
  const handleWhatsAppSend = useCallback(async () => {
    if (!settings) {
      alert("Error: No se pudo cargar la configuración. Por favor recarga la página.")
      return
    }

    // Construir objeto de configuración para rotación
    const settingsForRotation = {
      rotation_enabled: settings.rotationEnabled,
      rotation_mode: settings.rotationMode,
      rotation_threshold: settings.rotationThreshold,
      current_rotation_index: settings.currentRotationIndex,
      rotation_click_count: settings.rotationClickCount,
      last_rotation_time: settings.lastRotationTime,
      phone: settings.phone,
      ...Object.fromEntries(
        (settings.attentionNumbers || []).flatMap((num, i) => [
          [`attention_phone_${i + 1}`, num?.phone || ""],
          [`attention_name_${i + 1}`, num?.label || ""],
          [`attention_active_${i + 1}`, num?.active || false],
        ]),
      ),
    }

    const currentPhone = await getNextAttentionNumber(settingsForRotation as any)

    if (!currentPhone) {
      alert("Error: No hay número de atención disponible.")
      return
    }

    setAttentionPhoneNumber(currentPhone)

    const timeToUse = transferTime || localStorage.getItem("eds_transfer_time") || formatDateTime(new Date())
    const plataformaGuardada = localStorage.getItem("eds_platform") || plataforma
    const plataformaURL = plataformaGuardada === "z" ? "https://casinozeus.fit" : platformUrl

    const message = `Hola, ya envié mi c4rg4.

Usu4rio: ${usuario}
Contr4seña: ${DEFAULT_PASSWORD}
Pl4taform4: ${plataformaURL}

Titular: ${titular}
Monto: $${formatCurrency(monto)}
Hora de transferencia: ${timeToUse}

Adjunto comprobante.`

    window.open(`https://wa.me/${currentPhone}?text=${encodeURIComponent(message)}`, "_blank")
    changeStep(8, "forward")
  }, [
    settings,
    transferTime,
    plataforma,
    usuario,
    titular,
    monto,
    formatCurrency,
    platformUrl,
    formatDateTime,
    changeStep,
  ])

  const isSoporteButtonEnabled = titular.trim().length > 0 && monto.trim().length > 0

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div
            className={`space-y-6 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="text-center space-y-4">
              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Crown className="w-14 h-14 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                La Corona
              </h1>
            </div>

            <div className="space-y-4 pt-6">
              <button
                onClick={() => (userCreationEnabled ? changeStep(2, "forward") : changeStep(4, "forward"))}
                className="w-full py-6 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-3 text-2xl"
              >
                Crear Usuario
                <ChevronRight className="w-7 h-7" />
              </button>
              <Link
                href="/retiros"
                className="w-full py-6 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-3 text-2xl"
              >
                <Calendar className="w-6 h-6" />
                Cronograma
              </Link>
            </div>

            {/* Info */}
            <div className="flex items-center justify-center pt-4">
              <button
                onClick={() => setShowHowItWorks(true)}
                className="text-base text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <AlertCircle className="w-5 h-5" />
                ¿Cómo funciona?
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div
            className={`space-y-4 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => changeStep(1, "back")}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Datos para tu usuario</h2>
              <p className="text-gray-400 text-lg">Completá la información</p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="apodo" className="text-lg text-gray-300">
                  Nombre o apodo
                </Label>
                <Input
                  id="apodo"
                  value={apodo}
                  onChange={handleApodoChange}
                  onBlur={handleInputBlur}
                  placeholder="Cómo querés que te llamemos"
                  className="bg-gray-900 border-gray-700 text-white h-14 text-lg rounded-xl"
                  maxLength={20}
                />
                {apodoError && <p className="text-red-400 text-base">{apodoError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="digitos" className="text-lg text-gray-300">
                  Últimos 4 dígitos de tu celular
                </Label>
                <Input
                  id="digitos"
                  value={digitos}
                  onChange={handleDigitosChange}
                  onBlur={handleInputBlur}
                  placeholder="Últimos 4 del celu"
                  className="bg-gray-900 border-gray-700 text-white h-14 text-lg rounded-xl"
                  maxLength={4}
                  inputMode="numeric"
                />
                <p className="text-gray-500 text-base">Corresponde a los últimos 4 números de tu celular</p>
                {digitosError && <p className="text-red-400 text-base">{digitosError}</p>}
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full py-5 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl"
              >
                Continuar
                <ChevronRight className="w-6 h-6" />
              </button>
            </form>
          </div>
        )

      case 4:
        return (
          <div
            className={`space-y-4 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => changeStep(userCreationEnabled ? 2 : 1, "back")}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Detalles de la carga</h2>
              <p className="text-gray-400 text-lg">Ingresá los datos de tu transferencia</p>
            </div>

            <div className="space-y-5">
              {usuario && (
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                  <p className="text-base text-gray-400">Tu usuario</p>
                  <p className="text-white font-mono text-xl">{usuario}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="titular" className="text-lg text-gray-300">
                  Titular de la cuenta
                </Label>
                <Input
                  id="titular"
                  value={titular}
                  onChange={handleTitularChange}
                  onBlur={handleInputBlur}
                  placeholder="Nombre completo"
                  className="bg-gray-900 border-gray-700 text-white h-14 text-lg rounded-xl"
                />
                <p className="text-gray-500 text-base">
                  Debe coincidir con el nombre de la persona que realiza la transferencia
                </p>
                {titularError && <p className="text-red-400 text-base">{titularError}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto" className="text-lg text-gray-300">
                  Monto a cargar (mín ${formatCurrency(minAmount)})
                </Label>
                <Input
                  id="monto"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
                  onBlur={handleInputBlur}
                  placeholder={`Ej: ${minAmount}`}
                  className="bg-gray-900 border-gray-700 text-white h-14 text-lg rounded-xl"
                  inputMode="numeric"
                />
              </div>

              {/* Bono */}
              {bonusEnabled && monto && Number(monto) >= minAmount && (
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-700/50">
                  <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-green-400 font-semibold text-lg">+{bonusPercentage}% de bono!</p>
                      <p className="text-green-300/70 text-base">
                        Recibís ${formatCurrency(Math.round(Number(monto) * (1 + bonusPercentage / 100)))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => changeStep(5, "forward")}
                disabled={!titular.trim() || !monto || Number(monto) < minAmount}
                className="w-full py-5 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl"
              >
                Continuar
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )

      case 5:
        return (
          <div
            className={`space-y-4 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => changeStep(4, "back")}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">Realizá la transferencia</h2>
              <p className="text-gray-400 text-lg">Enviá el monto exacto</p>
            </div>

            {/* Datos de pago */}
            <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-lg">{paymentLabel}</span>
                <button
                  onClick={copyPaymentData}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-lg"
                >
                  {copiedAlias ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copiedAlias ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p className="text-white font-mono text-2xl break-all">{paymentData || alias}</p>

              <div className="pt-3 border-t border-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-lg">Monto</span>
                  <span className="text-white font-bold text-xl">${formatCurrency(monto)}</span>
                </div>
              </div>
            </div>

            {/* Botón cambiar de estado */}
            <button
              onClick={() => changeStep(6, "forward")}
              disabled={!canProceed}
              className={`w-full py-5 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-3 text-xl ${
                canProceed
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                  : "bg-gray-700 cursor-not-allowed"
              }`}
            >
              {canProceed ? (
                <>
                  Transferencia Realizada
                  <ChevronRight className="w-6 h-6" />
                </>
              ) : (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Esperando transferencia...
                </>
              )}
            </button>
          </div>
        )

      case 6:
        return (
          <div
            className={`space-y-4 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => changeStep(5, "back")}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">Guarda nuestro contacto</h2>
              <p className="text-gray-400 text-sm">Guardanos como "La Corona"</p>
            </div>

            {/* Número de contacto */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-mono">+{attentionPhoneNumber || phoneNumber}</p>
                    <p className="text-gray-400 text-xs">Guardar como "La Corona"</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón copiar */}
            <button
              onClick={handleCopyNumber}
              disabled={copiedPhone}
              className={`w-full py-5 rounded-xl font-semibold text-xl transition-all flex items-center justify-center gap-3 ${
                copiedPhone
                  ? "bg-green-600 text-white"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              }`}
            >
              {copiedPhone ? (
                <>
                  <Check className="w-6 h-6" />
                  Número copiado
                </>
              ) : (
                <>
                  <Copy className="w-6 h-6" />
                  Copiar número
                </>
              )}
            </button>

            {/* Botón continuar */}
            <button
              onClick={() => changeStep(7, "forward")}
              disabled={!copiedPhone || !canProceedAfterCopy}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                !copiedPhone || !canProceedAfterCopy
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
              }`}
            >
              {!copiedPhone ? (
                "Primero copiá el número"
              ) : !canProceedAfterCopy ? (
                <span className="flex items-center gap-2 animate-pulse">
                  <Clock className="w-4 h-4 animate-spin" />
                  Agendanos y volvé aquí...
                </span>
              ) : (
                <>
                  Ya guardé el contacto
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )

      case 7:
        return (
          <div
            className={`space-y-4 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => changeStep(6, "back")}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">Últimos detalles</h2>
              <p className="text-gray-400 text-sm">Confirmá tu carga</p>
            </div>

            {/* Resumen */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 space-y-2">
              {usuario && (
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Usuario</span>
                  <span className="text-white font-mono text-sm">{usuario}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Titular</span>
                <span className="text-white text-sm">{titular}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Monto</span>
                <span className="text-white font-semibold">${formatCurrency(monto)}</span>
              </div>
              {bonusEnabled && (
                <div className="flex justify-between text-green-400">
                  <span className="text-sm">Con bono (+{bonusPercentage}%)</span>
                  <span className="font-semibold">
                    ${formatCurrency(Math.round(Number(monto) * (1 + bonusPercentage / 100)))}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleWhatsAppSend}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Enviar Solicitud
            </button>
          </div>
        )

      case 8:
        return (
          <div
            className={`space-y-4 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">¡Solicitud Completada!</h2>
              <p className="text-gray-400">Tu comprobante fue enviado exitosamente</p>
            </div>

            <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-700/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-purple-300 font-semibold text-sm">¿Qué sigue?</p>
                  <ul className="text-purple-200/70 text-sm space-y-1">
                    <li>• Revisaremos tu comprobante en los próximos minutos</li>
                    <li>• Te responderemos por WhatsApp con la confirmación</li>
                    <li>• Tu carga será acreditada una vez verificada</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 9:
        return (
          <div
            className={`space-y-4 transition-all duration-500 ${isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <button
              onClick={() => changeStep(1, "back")}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </button>

            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Soporte</h2>
              <p className="text-gray-400 text-sm">Contactanos para ayuda</p>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <p className="text-gray-400 text-sm mb-2">Número de soporte</p>
              <p className="text-white font-mono text-lg">+{settings?.support_phone || "543416605903"}</p>
            </div>

            <a
              href={`https://wa.me/${settings?.support_phone || "543416605903"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Abrir WhatsApp
            </a>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fondo con gradiente */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20 pointer-events-none" />

      {/* Contenedor principal */}
      <div className="relative min-h-screen flex flex-col">
        {/* Contenido */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">{renderStep()}</div>
        </main>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-sm">Copiado al portapapeles</span>
          </div>
        </div>
      )}

      {/* Modal de información */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div
            className={`bg-gray-900 rounded-2xl p-6 max-w-sm w-full transition-all duration-300 ${isModalAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">¿Cómo funciona?</h3>
              <button onClick={closeInfoModal} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-gray-300 text-sm">
              <p>1. Creá tu usuario o usá uno existente</p>
              <p>2. Ingresá los datos de tu transferencia</p>
              <p>3. Realizá la transferencia al alias indicado</p>
              <p>4. Guardá nuestro contacto de WhatsApp</p>
              <p>5. Enviá el comprobante por WhatsApp</p>
              <p>6. ¡Listo! Tu carga se acredita en minutos</p>
            </div>
            <button
              onClick={closeInfoModal}
              className="w-full mt-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de advertencia de contacto */}
      {showContactWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white">¡Importante!</h3>
              <div className="text-gray-300 text-sm space-y-2">
                <p>Guardá el número como "La Corona" en tus contactos.</p>
                <p className="text-yellow-400 font-semibold">NO envíes mensajes todavía.</p>
                <p>Volvé aquí para continuar con el proceso.</p>
              </div>
              <button
                onClick={() => {
                  setShowContactWarningModal(false)
                  setTimeout(() => setCanProceedAfterCopy(true), 5000)
                }}
                className="w-full py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cómo funciona */}
      {showHowItWorks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div
            className={`bg-gray-900 rounded-2xl p-6 max-w-sm w-full transition-all duration-300 ${
              showHowItWorks ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">¿Cómo funciona?</h3>
              <button onClick={() => setShowHowItWorks(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-gray-300 text-sm">
              <p>1. Creá tu usuario o usá uno existente</p>
              <p>2. Ingresá los datos de tu transferencia</p>
              <p>3. Realizá la transferencia al alias indicado</p>
              <p>4. Guardá nuestro contacto de WhatsApp</p>
              <p>5. Enviá el comprobante por WhatsApp</p>
              <p>6. ¡Listo! Tu carga se acredita en minutos</p>
            </div>
            <button
              onClick={() => setShowHowItWorks(false)}
              className="w-full mt-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
