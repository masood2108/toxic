import React, { useEffect, useState } from "react"

export default function LoadingScreen({ onFinish }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onFinish, 600)
          return 100
        }
        return prev + Math.floor(Math.random() * 6 + 3)
      })
    }, 120)

    return () => clearInterval(interval)
  }, [onFinish])

  const status =
    progress < 30
      ? "POWERING CORE"
      : progress < 60
      ? "CHARGING SYSTEMS"
      : progress < 90
      ? "OVERLOADING"
      : "REACTOR READY"

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center overflow-hidden">

      {/* BACKDROP GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.25),transparent_55%)]" />

      {/* CORE */}
      <div className="relative flex flex-col items-center">

        {/* ROTATING SEGMENTS */}
        <div className="relative w-52 h-52 sm:w-64 sm:h-64">
          <div className="absolute inset-0 rounded-full border border-red-500/30 animate-spinSlow" />
          <div className="absolute inset-4 rounded-full border border-orange-500/40 animate-spinReverse" />
          <div className="absolute inset-8 rounded-full border border-yellow-400/30" />

          {/* ENERGY FILL */}
          <div
            className="absolute inset-10 rounded-full transition-all duration-300"
            style={{
              background: `radial-gradient(circle, rgba(255,77,0,${
                progress / 120
              }), transparent 70%)`,
              boxShadow: `0 0 ${progress / 2}px rgba(255,77,0,0.8)`
            }}
          />

          {/* LOGO */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-orbitron text-3xl sm:text-4xl tracking-[0.35em]">
              <span className="text-white">TOXIC</span>
              <span className="text-red-500">RUSH</span>
            </h1>
          </div>
        </div>

        {/* STATUS */}
        <p className="mt-6 text-xs sm:text-sm tracking-[0.4em] text-gray-400">
          {status}
        </p>

        {/* PROGRESS */}
        <div className="mt-2 font-orbitron text-2xl text-red-500 tracking-widest">
          {progress}%
        </div>

        {/* CHARGE BAR */}
        <div className="mt-5 w-64 h-1 bg-gray-800 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, #ff2a00, #ff6a00, #ffb000)",
              boxShadow: "0 0 20px rgba(255,77,0,0.8)"
            }}
          />
        </div>

        {/* FINAL WARNING */}
        {progress > 90 && (
          <p className="mt-4 text-xs tracking-[0.3em] text-red-500 animate-pulse">
            OVERCHARGE DETECTED
          </p>
        )}
      </div>
    </div>
  )
}
