"use client"

import { AlertCircle, TrendingUp, Wallet, Crown } from "lucide-react"

export default function RetirosPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Fondo con partículas animadas */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent animate-float" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-purple-600/20">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <div className="flex items-center gap-3 mx-auto">
            <Crown className="w-8 h-8 text-purple-500 animate-pulse" strokeWidth={2.5} />
            <h1 className="text-3xl font-black text-white neon-text">TheCrown</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 animate-slideInUp">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block p-4 bg-purple-950/40 rounded-2xl border border-purple-600/30 shadow-[0_0_40px_rgba(167,139,250,0.3)] mb-4">
            <AlertCircle className="w-16 h-16 text-purple-400 mx-auto" strokeWidth={2} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white neon-text">Términos y Condiciones</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Información importante sobre premios y retiros</p>
        </div>

        {/* Términos y Condiciones */}
        <div className="bg-purple-950/20 border border-purple-600/30 rounded-2xl p-8 space-y-6 animate-scalePopIn">
          {/* Límite de premios */}
          <div className="space-y-3 p-6 bg-black/40 rounded-xl border border-purple-600/20 hover:border-purple-500/40 transition-all duration-300">
            <h4 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-500" strokeWidth={2} />
              Límite de premios por jugada
            </h4>
            <p className="text-base text-gray-300 leading-relaxed">
              Cada jugada tiene un premio máximo acreditable de{" "}
              <span className="font-bold text-white text-lg">$1.000.000</span>. Si un resultado supera ese valor, se
              acreditará el tope máximo permitido por jugada.
            </p>
          </div>

          {/* Límites de retiro */}
          <div className="space-y-3 p-6 bg-black/40 rounded-xl border border-purple-600/20 hover:border-purple-500/40 transition-all duration-300">
            <h4 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-purple-500" strokeWidth={2} />
              Límites de retiro diarios
            </h4>
            <ul className="space-y-3 text-base text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-1 text-xl">•</span>
                <span>
                  Hasta <span className="font-bold text-white">2 retiros</span> por día
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-1 text-xl">•</span>
                <span>
                  <span className="font-bold text-white">$125.000</span> por retiro
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-1 text-xl">•</span>
                <span>
                  Máximo <span className="font-bold text-white">$250.000</span> diarios
                </span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-400 text-center italic pt-4">
            Estas condiciones aplican a todas las operaciones dentro de la plataforma.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-600/20 mt-20">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <span>TheCrown © 2025</span>
            <span>•</span>
            <span>Retiros Seguros</span>
            <span>•</span>
            <span>+18 Juego Responsable</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
