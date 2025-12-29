// Generador de archivos VCF (vCard) para guardar contactos

export interface VCFContact {
  name: string
  phone: string
  organization?: string
  note?: string
}

/**
 * Genera el contenido de un archivo VCF
 */
export function generateVCFContent(contact: VCFContact): string {
  const vcfLines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${contact.name}`, `TEL;TYPE=CELL:${contact.phone}`]

  if (contact.organization) {
    vcfLines.push(`ORG:${contact.organization}`)
  }

  if (contact.note) {
    vcfLines.push(`NOTE:${contact.note}`)
  }

  vcfLines.push("END:VCARD")

  return vcfLines.join("\n")
}

/**
 * Descarga un archivo VCF con el contacto especificado
 */
export function downloadVCF(contact: VCFContact, filename = "contacto.vcf"): void {
  const vcfContent = generateVCFContent(contact)
  const blob = new Blob([vcfContent], { type: "text/vcard;charset=utf-8" })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}

/**
 * Genera y descarga el VCF de TheCrown con el número de soporte
 */
export function downloadTheCrownContact(supportPhone: string): void {
  downloadVCF(
    {
      name: "TheCrown — Soporte VIP",
      phone: supportPhone,
      organization: "TheCrown",
      note: "Contacto oficial de TheCrown para soporte prioritario",
    },
    "TheCrown-Soporte.vcf",
  )
}

/**
 * Genera y descarga el VCF de "La Corona" con el número dinámico
 */
export function downloadLaCoronaContact(phone: string): void {
  downloadVCF(
    {
      name: "La Corona",
      phone: phone,
      organization: "La Corona",
      note: "Contacto oficial para atención y soporte",
    },
    "La-Corona.vcf",
  )
}

/**
 * Función simplificada para generar y descargar VCF
 * @param phone - Número de teléfono
 * @param name - Nombre del contacto
 */
export function generateVCF(phone: string, name: string): void {
  downloadVCF(
    {
      name: name,
      phone: phone,
      organization: "TheCrown",
    },
    `${name.replace(/\s+/g, "-")}.vcf`,
  )
}
