// Detección de sistema operativo del dispositivo

export function detectOS(): "ios" | "android" | "other" {
  if (typeof window === "undefined") return "other"

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // iOS detection
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return "ios"
  }

  // Android detection
  if (/android/i.test(userAgent)) {
    return "android"
  }

  return "other"
}
