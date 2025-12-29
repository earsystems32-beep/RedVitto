"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Check,
  Copy,
  Crown,
  MessageCircle,
  ArrowLeft,
  AlertCircle,
  X,
  Gift,
  Shield,
  Users,
  Wallet,
  Clock,
  TrendingUp,
  Trophy,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Hourglass,
} from "lucide-react"
import { generateVCF } from "@/lib/vcf-generator"
import { getNextAttentionNumber } from "@/lib/whatsapp-rotation"
import { downloadLaCoronaContact } from "@/lib/vcf-generator"
import { detectOS } from "@/lib/device-detection"

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
  const [digitosError, setDigitosError] = useState("")
  const [plataformaError, setPlataformaError] = useState("")
  const [titularError, setTitularError] = useState("")
  const [montoError, setMontoError] = useState("")
  // Renamed state for modal
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isModalAnimating, setIsModalAnimating] = useState(false)
  const [isStepAnimating, setIsStepAnimating] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [transferButtonTimer, setTransferButtonTimer] = useState(30)
  // Removed: const [showBonusModal, setShowBonusModal] = useState(false)
  // Removed: const [isBonusModalAnimating, setIsBonusModalAnimating] = useState(false)
  const [bonusAccepted, setBonusAccepted] = useState(false)
  const [timerHasStarted, setTimerHasStarted] = useState(false)

  const [alias, setAlias] = useState("")
  const [minAmount, setMinAmount] = useState(2000)
  const [userCreationEnabled, setUserCreationEnabled] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState("") // Eliminado número de teléfono específico del estado inicial
  const [paymentType, setPaymentType] = useState<"alias" | "cbu">("alias")
  const [originalTimerSeconds, setOriginalTimerSeconds] = useState(30)
  const [paymentData, setPaymentData] = useState("") // Para alias o cbu

  // New state for amount input formatting
  const [montoInput, setMontoInput] = useState("")
  const [username, setUsername] = useState("")
  const [copied, setCopied] = useState(false) // Renamed from copiedAlias for clarity
  const [platformUrl, setPlatformUrl] = useState("https://ganamos.sbs")

  const [bonusEnabled, setBonusEnabled] = useState(true)
  const [bonusPercentage, setBonusPercentage] = useState(25)
  const [rotationEnabled, setRotationEnabled] = useState(false)

  // Assume settings is available after fetching
  const [settings, setSettings] = useState<any>(null) // Added state for settings

  const [vcfDownloaded, setVcfDownloaded] = useState(false)
  const [conditionsAccepted, setConditionsAccepted] = useState(false)
  const [canProceed, setCanProceed] = useState(false) // New state for step 5 confirmation
  const [copiedPhone, setCopiedPhone] = useState(false) // For copying attention phone number
  const [attentionPhoneNumber, setAttentionPhoneNumber] = useState<string | null>(null)

  const [userOS, setUserOS] = useState<"ios" | "android" | "other">("other")
  const [contactCopied, setContactCopied] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)
  const [contactTimer, setContactTimer] = useState(30) // Timer inicial de 30 segundos
  const [timerActive, setTimerActive] = useState(false) // Si el timer está corriendo
  const [numberCopied, setNumberCopied] = useState(false) // Si se copió el número

  useEffect(() => {
    setUserOS(detectOS())
  }, [])

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
            setSettings(data.settings) // Store settings
            setAlias(data.settings.alias)
            setPhoneNumber(data.settings.phone || "") // Asegurarse de que sea string
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
            setPlatformUrl(data.settings.platformUrl || "https://ganamos.sbs")
            setBonusEnabled(data.settings.bonusEnabled ?? true)
            setBonusPercentage(data.settings.bonusPercentage ?? 25)
            setRotationEnabled(data.settings.rotationEnabled ?? false)

            // Fetch attention phone number for step 5
            if (!attentionPhoneNumber) {
              const nextPhone = await getNextAttentionNumber(data.settings)
              setAttentionPhoneNumber(nextPhone)
            }
          }
        }
      } catch (error) {
        // Silent fail - use defaults
      }
    }

    loadServerConfig()
    const interval = setInterval(loadServerConfig, 10000)

    return () => clearInterval(interval)
  }, [timerHasStarted, attentionPhoneNumber])

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

    // El bono ahora solo se muestra al pasar del paso 4 al 5 en changeStep

    // Initialize timer only on first entry to step 5 (anteriormente paso 4)
    if (step === 5) {
      if (!timerHasStarted) {
        setTransferButtonTimer(originalTimerSeconds)
        setTimerHasStarted(true)
      }
    }

    // Reset timer state when leaving step 5
    if (step !== 5 && timerHasStarted) {
      setTimerHasStarted(false)
      setBonusAccepted(false)
    }
  }, [step, originalTimerSeconds, timerHasStarted, bonusEnabled])

  // Countdown timer runs only when conditions are met
  useEffect(() => {
    if (step === 5 && transferButtonTimer > 0) {
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
  }, [step, transferButtonTimer])

  // Update transferButtonTimer logic to enable proceeding
  useEffect(() => {
    if (step === 5 && transferButtonTimer === 0) {
      setCanProceed(true)
    } else {
      setCanProceed(false)
    }
  }, [step, transferButtonTimer])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    // Si estamos en el paso 6 y el timer está activo
    if (step === 6 && timerActive && contactTimer > 0) {
      interval = setInterval(() => {
        setContactTimer((prev) => {
          if (prev <= 1) {
            setContactSaved(true) // Habilitar botón cuando llega a 0
            setTimerActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [step, timerActive, contactTimer])

  useEffect(() => {
    if (step === 6) {
      setContactTimer(30)
      setTimerActive(true)
      setNumberCopied(false)
      setContactSaved(false)
    }
  }, [step])

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
    const cleaned = value.replace(/\D/g, "").slice(0, 4)
    setDigitos(cleaned)

    if (cleaned !== value) {
      setDigitosError("Usá solo números.")
    } else {
      setDigitosError("")
    }
  }, [])

  const changeStep = useCallback(
    (newStep: number, direction: "forward" | "back" = "forward") => {
      setIsStepAnimating(false)
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
      setUsername(generatedUser)
      localStorage.setItem("eds_username", generatedUser)
      localStorage.setItem("eds_platform", plataforma)

      changeStep(4, "forward")
    },
    [apodo, digitos, plataforma, isApodoValid, isDigitosValid, sanitizeName, changeStep],
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
    setStep(5) // Directly set step instead of calling changeStep. This will be step 6 after renumbering.
  }, [formatDateTime])

  // Modified to use the updated handleWhatsApp function
  const handleWhatsApp = useCallback(() => {
    const timeToUse = transferTime || localStorage.getItem("eds_transfer_time") || formatDateTime(new Date())

    console.log("[v0] Hora de transferencia usada:", timeToUse)

    const plataformaGuardada = localStorage.getItem("eds_platform") || plataforma
    let plataformaURL = platformUrl // Usar el URL de configuración

    if (plataformaGuardada === "g") {
      plataformaURL = platformUrl
    } else if (plataformaGuardada === "z") {
      plataformaURL = "https://casinozeus.fit"
    }

    const message = `Hola, ya envié mi c4rg4.

Usu4rio: ${usuario}
Contr4seña: ${password}
Quiero jug4r en: ${plataformaURL}

Titular: ${titular}
Monto: $${formatCurrency(monto)}
Hora de transferencia: ${timeToUse}

Adjunto comprobante.`
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(url, "_blank")
  }, [
    plataforma,
    usuario,
    titular,
    monto,
    transferTime,
    formatCurrency,
    password,
    phoneNumber,
    platformUrl,
    formatDateTime,
  ])

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

  // This function was moved up and modified to be called changeStep
  // const changeStep = useCallback(...)

  const handleInputBlur = useCallback(() => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
      }, 100)
    }
  }, [])

  // Removed: closeBonusModal function

  const handleDownloadContact = useCallback(() => {
    generateVCF(settings?.support_phone || "543416605903", "TheCrown Atención") // Usar el número de soporte configurado
    setVcfDownloaded(true)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)

    setTimeout(() => {
      // Puede avanzar aunque no haya guardado realmente
      console.log("[v0] Timer de 5 segundos completado, usuario puede continuar")
      // You might want to automatically trigger changeStep(8, "forward") here
      // or enable a "Continue" button, depending on the desired UX.
      // For now, just logging and enabling the possibility to proceed.
    }, 5000)
  }, [settings])

  const handleDownloadLaCorona = useCallback(async () => {
    if (!settings) {
      console.error("[v0] Settings no disponibles")
      return
    }

    const currentPhone = await getNextAttentionNumber(settings)
    console.log("[v0] Descargando contacto La Corona con número:", currentPhone)

    downloadLaCoronaContact(currentPhone)
    setContactSaved(true)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }, [settings])

  const handleCopyNumber = useCallback(async () => {
    if (!settings) {
      console.error("[v0] Settings no disponibles")
      return
    }

    const currentPhone = await getNextAttentionNumber(settings)

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentPhone).then(() => {
        console.log("[v0] Número copiado:", currentPhone)
        setNumberCopied(true)
        setContactTimer(5)
        setTimerActive(true)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
      })
    } else {
      // Fallback para navegadores sin clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = currentPhone
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)

      setNumberCopied(true)
      setContactTimer(5)
      setTimerActive(true)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    }
  }, [settings])

  const handleWhatsAppSend = useCallback(async () => {
    if (!settings) {
      console.error("[v0] Settings no disponibles")
      return
    }

    const currentPhone = await getNextAttentionNumber(settings)

    console.log("[v0] Enviando mensaje a WhatsApp con número:", currentPhone)

    const savedTransferTime = localStorage.getItem("eds_transfer_time") || transferTime
    const currentTransferTime = savedTransferTime || formatDateTime(new Date())

    const message = `Hola! Te envío el comprobante de mi carga 📲

✅ *Usuario:* ${usuario || username}
💰 *Monto:* $${monto}
👤 *Titular:* ${titular}
🕒 *Hora de transferencia:* ${currentTransferTime}
🎮 *Quiero jug4r en:* ${platformUrl}

Gracias! 🎰👑`

    const whatsappUrl = `https://wa.me/${currentPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")

    // Ir al paso de confirmación
    changeStep(7, "forward") // Changed to step 7
  }, [
    transferTime,
    usuario,
    username,
    monto,
    titular,
    platformUrl,
    settings, // Changed from settings?.phone and settings?.rotationEnabled
    changeStep,
    formatDateTime,
  ])

  // This function seems redundant with handleWhatsAppSend now, but kept for potential future use
  const handleContinueTransfer = useCallback(() => {
    if (!titular || !monto) {
      // Basic validation, specific errors are handled inline
      alert("Por favor, completá todos los campos.")
      return
    }
    // Simulate sending data or moving to next step
    // For now, we assume it leads to confirming the transfer
    setStep(5) // Directly set step instead of calling changeStep. This will be step 6.
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

  useEffect(() => {
    const savedTime = localStorage.getItem("eds_transfer_time") || transferTime
    if (savedTime && !transferTime) {
      setTransferTime(savedTime)
    }
  }, [transferTime])

  const handleCopyAlias = useCallback(() => {
    copyToClipboard(paymentData || alias || "No configurado")
  }, [paymentData, alias, copyToClipboard])

  // Mocking supportPhone for handleDownloadContact
  const supportPhone = settings?.support_phone || "543416605903"

  // New state and functions for step 5 confirmation
  // const [canProceed, setCanProceed] = useState(false) moved to top

  const handleConfirmTransfer = useCallback(() => {
    if (!canProceed) return // Prevent multiple clicks if not ready
    changeStep(6, "forward") // Move to the next step (step 6)
  }, [canProceed, changeStep])

  // Removed: useEffect that updated canProceed based on transferButtonTimer

  // Dummy variables for step 7 summary (replace with actual state variables)
  const amount = montoInput // Assuming montoInput holds the current amount entered
  const aliasForSummary = alias || "No configurado"
  const generatedUsername = username // Assuming username state holds the generated username

  const handleOpenDialer = useCallback(async () => {
    if (!settings) return
    const currentPhone = await getNextAttentionNumber(settings)
    console.log("[v0] Abriendo marcador con número:", currentPhone)

    // Abrir el marcador del teléfono con el número cargado
    window.location.href = `tel:${currentPhone}`

    // Habilitar el botón de WhatsApp inmediatamente
    setContactSaved(true)
  }, [settings])

  const handleSaveContact = useCallback(async () => {
    const phone = await getNextAttentionNumber(settings) // Await here

    console.log("[v0] Sistema detectado:", userOS)
    console.log("[v0] Guardando contacto con número:", phone)

    if (userOS === "ios") {
      // iOS: Descargar archivo VCF
      downloadLaCoronaContact(phone)
    } else if (userOS === "android") {
      // Android: Intentar abrir la app de contactos nativa
      const contactName = "La Corona"
      const androidContactURL = `intent://contacts/people/?action=android.intent.action.INSERT&name=${encodeURIComponent(contactName)}&phone=${encodeURIComponent(phone)}#Intent;scheme=content;end`

      // Intentar abrir la app de contactos, si falla, descargar VCF
      try {
        window.location.href = androidContactURL
        // Fallback: después de 1 segundo, ofrecer descarga VCF
        setTimeout(() => {
          downloadLaCoronaContact(phone)
        }, 1000)
      } catch (error) {
        console.log("[v0] Error abriendo contactos Android, descargando VCF:", error)
        downloadLaCoronaContact(phone)
      }
    } else {
      // Desktop u otro: Descargar VCF
      downloadLaCoronaContact(phone)
    }

    // Timer oculto de 5 segundos antes de habilitar WhatsApp
    setTimeout(() => {
      setContactSaved(true)
      console.log("[v0] Contacto guardado, habilitando WhatsApp")
    }, 5000)
  }, [settings, userOS])

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

      <div className="container relative z-10 mx-auto max-w-md pt-8 pb-24 px-6">
        {isDropdownOpen && (
          <div className="fixed inset-0 z-50 bg-transparent" onClick={() => setIsDropdownOpen(false)} />
        )}

        {/* Removed: Bonus Modal */}

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
                  className="w-full h-14 btn-gradient-animated text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
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
                    onClick={() => changeStep(8, "forward")} // Changed step to 8
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
                <div className="inline-block px-4 py-2 rounded-full bg-purple-950/50 border border-purple-600/40 mb-4">
                  <span className="text-sm font-bold text-purple-400">Paso 1 de 5</span>
                </div>

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
                    type="tel"
                    inputMode="numeric"
                    value={digitos}
                    onChange={handleDigitosChange}
                    placeholder="Ingresá tus 4 dígitos"
                    className="h-14 text-base bg-gray-900 border-gray-800 focus:border-purple-600 transition-colors text-white placeholder:text-gray-600 rounded-xl"
                    maxLength={4}
                    required
                  />
                  {digitosError && <p className="text-red-500 text-xs mt-1">{digitosError}</p>}
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
                    type="submit" // Changed to type="submit" to use form's onSubmit
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
                    className="w-full h-14 text-base border border-gray-800 hover:border-purple-600 transition-all text-white font-medium rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5 inline mr-2" strokeWidth={2} />
                    Volver
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Paso 3 eliminado completamente */}

        {/* PASO 4: Confirmar condiciones y bono integrado */}
        {step === 4 && (
          <div
            className={`transition-all duration-500 ease-out ${
              isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block px-4 py-2 rounded-full bg-purple-950/50 border border-purple-600/40 mb-4">
                  <span className="text-sm font-bold text-purple-400">Paso 2 de 5</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Antes de continuar</h2>
                <p className="text-gray-400 text-sm">Conocé los límites y condiciones</p>
              </div>

              <div className="space-y-4 p-6 rounded-2xl border border-purple-600/30 bg-black/40">
                {/* Sección de límites */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Trophy className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" strokeWidth={2} />
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">Premio máximo por jugada</h3>
                      <p className="text-gray-300 text-base">$1.000.000</p>
                    </div>
                  </div>

                  <div className="h-px bg-purple-600/20" />

                  <div className="flex items-start gap-3">
                    <Wallet className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" strokeWidth={2} />
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-2">Límites de retiro</h3>
                      <ul className="space-y-1.5 text-gray-300 text-base">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Máximo 2 retiros por día
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          $125.000 por retiro
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Total diario: $250.000
                        </li>
                      </ul>
                    </div>
                  </div>

                  {bonusEnabled && bonusPercentage > 0 && (
                    <>
                      <div className="h-px bg-purple-600/20" />
                      <div className="flex items-start gap-3">
                        <Gift className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" strokeWidth={2} />
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-lg mb-1">Bono especial</h3>
                          <p className="text-gray-300 text-base mb-2">
                            Recibís un <strong className="text-purple-400">{bonusPercentage}% adicional</strong> en tu
                            primera carga
                          </p>
                          <p className="text-amber-400 text-sm font-medium">El bono no forma parte del premio</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="h-px bg-purple-600/20 mt-4" />

                <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl hover:bg-purple-950/20 transition-all">
                  <input
                    type="checkbox"
                    checked={conditionsAccepted}
                    onChange={(e) => setConditionsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-purple-600/40 bg-black/50 text-purple-600 focus:ring-purple-600 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    Acepto los términos y condiciones
                  </span>
                </label>

                {/* Botón continuar dentro */}
                <button
                  onClick={() => changeStep(5, "forward")}
                  disabled={!conditionsAccepted}
                  className="w-full h-14 btn-gradient-animated text-white font-semibold text-base rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 mt-4"
                >
                  Continuar
                </button>
              </div>

              <button
                onClick={() => changeStep(2, "back")}
                className="w-full h-12 text-base border border-gray-800 hover:border-purple-600 transition-all text-white font-medium rounded-xl"
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" strokeWidth={2} />
                Volver
              </button>
            </div>
          </div>
        )}

        {/* PASO 5: Enviá tu carga (Transferencia) - PRIMERO */}
        {step === 5 && (
          <div
            className={`transition-all duration-500 ease-out ${
              isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block px-4 py-2 rounded-full bg-purple-950/50 border border-purple-600/40 mb-4">
                  <span className="text-sm font-bold text-purple-400">Paso 3 de 5</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Enviá tu carga</h2>
                <p className="text-gray-400 text-sm">Realizá la transferencia</p>
              </div>

              <div className="space-y-4 p-6 rounded-2xl border border-purple-600/30 bg-black/40">
                <div className="flex items-center justify-between">
                  <span className="text-base text-gray-400">Carga mínima</span>
                  <span className="text-lg font-bold text-white">${formatCurrency(minAmount)}</span>
                </div>

                <div className="h-px bg-purple-600/20" />

                <div className="space-y-3">
                  <Label className="text-lg text-white font-bold text-center block">Alias</Label>
                  <div className="w-full text-center p-4 rounded-xl bg-purple-950/30 border-2 border-purple-600/50">
                    <p className="text-3xl font-black text-purple-400 tracking-wide">{alias || "No configurado"}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(alias)
                      setCopiedAlias(true)
                      setTimeout(() => setCopiedAlias(false), 2000)
                    }}
                    className="w-full btn-gradient-animated px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all"
                  >
                    {copiedAlias ? (
                      <>
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" strokeWidth={2.5} />
                        <span>Copiar Alias</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleConfirmTransfer}
                  disabled={!canProceed}
                  className={`w-full h-14 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                    canProceed
                      ? "btn-gradient-animated text-white hover:scale-105"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {canProceed ? (
                    <>
                      <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                      <span>Ya realicé la transferencia</span>
                    </>
                  ) : (
                    <>
                      <Hourglass className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                      <span>Esperando transferencia</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => changeStep(4, "back")}
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
            </div>
          </div>
        )}

        {/* PASO 6: Guardá mi contacto - DESPUÉS DE LA TRANSFERENCIA */}
        {step === 6 && (
          <div
            className={`transition-all duration-500 ease-out ${
              isStepAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-block px-4 py-2 rounded-full bg-purple-950/50 border border-purple-600/40 mb-4">
                  <span className="text-sm font-bold text-purple-400">Paso 4 de 5</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Guardá nuestro contacto</h2>
                <p className="text-gray-400 text-sm">Es necesario para continuar</p>
              </div>

              <div className="space-y-4 p-6 rounded-2xl border border-purple-600/30 bg-black/40">
                {/* Explicación de importancia */}
                <div className="flex items-start gap-3 p-4 bg-purple-950/30 rounded-xl border border-purple-500/20">
                  <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-white text-sm font-bold">¿Por qué es necesario?</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Para que tu mensaje llegue correctamente y no sea detectado como spam, es{" "}
                      <span className="font-bold text-purple-300">obligatorio</span> guardar nuestro número en tu agenda
                      como <span className="font-bold text-purple-300">&quot;La Corona&quot;</span>.
                    </p>
                  </div>
                </div>

                {/* Número con botón copiar (como el alias) */}
                <div className="space-y-3">
                  <Label className="text-lg text-white font-bold text-center block">Número de atención</Label>
                  <div className="w-full text-center p-4 rounded-xl bg-purple-950/30 border-2 border-purple-600/50">
                    <p className="text-3xl font-black text-purple-400 tracking-wide">
                      {attentionPhoneNumber || "Cargando..."}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyNumber}
                    disabled={!attentionPhoneNumber}
                    className="w-full btn-gradient-animated px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="w-5 h-5" strokeWidth={2.5} />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" strokeWidth={2.5} />
                        <span>Copiar Número</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => changeStep(7, "forward")}
                disabled={!contactSaved}
                className={`w-full h-14 font-semibold text-base rounded-xl transition-all flex items-center justify-center gap-2 ${
                  contactSaved
                    ? "btn-gradient-animated text-white hover:scale-105"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                {!contactSaved ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" strokeWidth={2} />
                    <span>Esperando guardado de contacto</span>
                  </>
                ) : (
                  <>
                    <span>Contacto guardado - Continuar</span>
                    <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                  </>
                )}
              </button>

              <button
                onClick={() => changeStep(5, "back")}
                className="w-full py-3 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2} />
                <span>Volver</span>
              </button>
            </div>
          </div>
        )}

        {/* PASO 7: Últimos detalles */}
        {step === 7 && (
          <div className={`space-y-6 transition-opacity duration-300 ${isStepAnimating ? "opacity-100" : "opacity-0"}`}>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-xs font-medium text-purple-400">Paso 5 de 5</span>
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white neon-text tracking-tight">Últimos detalles</h1>
              <p className="text-gray-400 text-sm">Completá y enviá tu comprobante</p>
            </div>

            {/* Advertencia de coincidencia de datos */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-600/40 flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-sm text-purple-200 leading-relaxed">
                  <strong className="font-semibold">Importante:</strong> Los datos deben coincidir exactamente con tu
                  transferencia para una acreditación más rápida.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="titular" className="text-base text-white font-medium">
                  Titular de la cuenta
                </Label>
                <Input
                  id="titular"
                  type="text"
                  value={titular}
                  onChange={(e) => {
                    setTitular(e.target.value)
                    if (titularError) setTitularError("")
                  }}
                  placeholder="Nombre completo del titular"
                  className={`h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl ${
                    titularError ? "border-red-500" : ""
                  }`}
                />
                {titularError && <p className="text-sm text-red-400 flex items-center gap-2">{titularError}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="monto" className="text-base text-white font-medium">
                  Monto depositado
                </Label>
                <Input
                  id="monto"
                  type="text" // Changed to text to handle comma input correctly, validation happens on change
                  inputMode="decimal" // Use decimal for currency input
                  value={montoInput} // Bind to montoInput for real-time display
                  onChange={(e) => {
                    handleMontoChange(e) // Use the dedicated handler
                    if (montoError) setMontoError("")
                  }}
                  placeholder="Ingresá el monto"
                  className={`h-14 text-base bg-black/50 border-purple-600/40 focus:border-purple-500 transition-all text-white placeholder:text-gray-500 rounded-xl ${
                    montoError ? "border-red-500" : ""
                  }`}
                />
                {montoError && <p className="text-sm text-red-400 flex items-center gap-2">{montoError}</p>}
              </div>
            </div>

            <button
              onClick={async () => {
                if (!titular.trim()) {
                  setTitularError("Ingresá el titular de la cuenta")
                  return
                }
                // Re-validate monto based on montoInput for confirmation
                const cleanedValue = montoInput.replace(/,/g, ".")
                const num = Number.parseFloat(cleanedValue)
                if (!num || num < minAmount) {
                  setMontoError(`El monto mínimo es $${formatCurrency(minAmount)}`)
                  return
                }

                // Llamar a handleWhatsAppSend que recopila y envía todo
                await handleWhatsAppSend()
              }}
              className="w-full h-14 btn-gradient-animated text-white font-semibold text-base rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
            >
              <span>Enviar Solicitud</span>
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <button
              onClick={() => changeStep(6, "back")}
              className="w-full py-3 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
              <span>Volver</span>
            </button>
          </div>
        )}

        {/* PASO 8 - Soporte (anteriormente paso 7) */}
        {step === 8 && (
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
                  href={`https://wa.me/${supportPhone}?text=Hola,%20me%20contacto%20desde%20TheCrown.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 btn-gradient-animated text-white font-semibold text-base rounded-xl transition-all flex items-center justify-center gap-3 hover:scale-105 hover:shadow-[0_0_40px_rgba(167,139,250,0.6)]"
                >
                  <MessageCircle className="w-5 h-5" strokeWidth={2} />
                  <span>Contactar Soporte</span>
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
