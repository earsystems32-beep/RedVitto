"use client"

import { TrendingUp, Wallet, ArrowLeft, Clock, Calendar } from "lucide-react"
import Link from "next/link"

export default function RetirosPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Fondo con gradientes */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col">
        <div className="flex-1 w-full max-w-md mx-auto px-4 py-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-lg mb-8"
          >
            <ArrowLeft className="w-6 h-6" />
            Volver
          </button>

          <div className="text-center space-y-4 mb-8">
            <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Calendar className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Cronograma
            </h1>
            <p className="text-gray-400 text-xl">Información sobre premios y retiros</p>
          </div>

          <div className="space-y-5">
            {/* Límite de premios */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Límite por jugada</h3>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                Premio máximo acreditable: <span className="font-bold text-white">$1.000.000</span> por jugada.
              </p>
            </div>

            {/* Límites de retiro */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Límites de retiro</h3>
              </div>
              <ul className="space-y-3 text-xl text-gray-300">
                <li className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  Hasta <span className="font-bold text-white mx-1">2 retiros</span> por día
                </li>
                <li className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  <span className="font-bold text-white">$125.000</span> máximo por retiro
                </li>
                <li className="flex items-center gap-4">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  <span className="font-bold text-white">$250.000</span> máximo diario
                </li>
              </ul>
            </div>

            {/* Frecuencia de pagos */}
            <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Tiempo de pago</h3>
              </div>
              <p className="text-xl text-gray-300 leading-relaxed">
                Pagos <span className="font-bold text-white">en el momento</span>. En alta demanda puede demorar hasta
                30 minutos.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="w-full py-6 rounded-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-3 text-2xl"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
