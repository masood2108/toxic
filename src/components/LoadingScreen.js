import React, { useEffect, useState } from "react"

export default function LoadingScreen({ onFinish }) {

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onFinish, 700)
          return 100
        }
        return prev + Math.floor(Math.random() * 6 + 2)
      })
    }, 140)

    return () => clearInterval(interval)
  }, [onFinish])   // ✅ ONLY ADDITION (FIXES WARNING)

  const statusText =
    progress < 40 ? "INITIALIZING CORE" :
    progress < 70 ? "LOADING ASSETS" :
    progress < 100 ? "FINALIZING" :
    "READY"

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-radial-glow"></div>

      {/* SCANLINES */}
      <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none"></div>

      {/* CONTENT */}
      <div className="relative flex flex-col items-center px-4 text-center">

        {/* ENERGY RINGS */}
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-toxic animate-spin-slow blur-sm"></div>
          <div className="absolute inset-6 rounded-full border border-toxicSoft"></div>

          {/* LOGO */}
          <h1 className="font-orbitron tracking-widest text-3xl sm:text-4xl glitch">
            <span className="text-white">TOXIC</span>
            <span className="text-toxic">RUSH</span>
          </h1>
        </div>

        {/* STATUS */}
        <p className="mt-6 font-rajdhani text-gray-400 tracking-widest text-xs sm:text-sm">
          {statusText}
        </p>

        {/* PROGRESS */}
        <div className="mt-3 font-orbitron text-toxic text-lg sm:text-xl">
          {progress}%
        </div>

        {/* BAR */}
        <div className="mt-4 w-56 sm:w-64 h-1 bg-gray-800 rounded overflow-hidden">
          <div
            className="h-full bg-toxic transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </div>
  )
}
