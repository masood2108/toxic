import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom"

/* 🎮 GAME DATA WITH PORTRAIT POSTERS */
const games = [
  {
    id: "bgmi",
    name: "BGMI",
    subtitle: "BATTLEGROUNDS MOBILE INDIA",
    tagline: "SURVIVE. DOMINATE. WIN.",
    image: "https://imgs.search.brave.com/7o5LrcSHUKSwXe4CejygemJdnZw2vZFr__sswiBN4hU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLmdl/dHR5d2FsbHBhcGVy/cy5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjIvMDcvQkdN/SS1CYWNrZ3JvdW5k/LVBpY3R1cmVzLmpw/Zw",
    imageMobile: "https://wallpapers.com/images/high/bgmi-jumping-against-explosion-qcmp2kscfxs0x0d6.webp",
    accent: "#ff4d00"
  },
  {
    id: "freefire",
    name: "FREE FIRE",
    subtitle: "FAST-PACED BATTLE ROYALE",
    tagline: "FAST. FIERCE. DEADLY.",
    image: "https://wallpapers.com/images/high/free-fire-clown-heist-iga1et4sh2ppt0ia.webp",
    imageMobile: "https://wallpapers.com/images/high/free-fire-chrono-uxyalziru9r1e8de.webp",
    accent: "#a855f7"
  }
]

export default function Games() {
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const [cursor, setCursor] = useState({ x: 50, y: 50 })
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const game = games[active]

  /* 🔄 SCREEN SIZE DETECT */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  /* 🏷️ TAB TITLE */
  useEffect(() => {
    document.title = `ToxicRush • ${game.name}`
  }, [game])

  /* 🔁 AUTO POSTER ROTATION */
  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % games.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const logout = async () => {
    await signOut(auth)
    navigate("/")
  }

  const currentImage = isMobile ? game.imageMobile : game.image

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-black text-white"
      onMouseMove={(e) =>
        setCursor({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100
        })
      }
    >
      {/* CURSOR AURA */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: `radial-gradient(circle at ${cursor.x}% ${cursor.y}%,
          ${game.accent}33, transparent 45%)`
        }}
      />

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 w-full z-30 flex justify-between items-center px-6 md:px-10 py-6">
        <h1 className="font-orbitron tracking-[0.4em] text-lg">
          TOXIC<span style={{ color: game.accent }}>RUSH</span>
        </h1>
        <button
          onClick={logout}
          className="text-xs tracking-widest opacity-70 hover:opacity-100 transition"
        >
          LOGOUT
        </button>
      </div>

      {/* BACKGROUND IMAGE */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImage}
          src={currentImage}
          alt={game.name}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/50" />

      {/* CONTENT */}
      <div className="relative z-20 h-full flex items-center px-6 md:px-16 lg:px-28">
        <motion.div
          key={game.name}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl"
        >
          <p className="text-xs tracking-[0.5em] text-gray-400 mb-4">
            {game.subtitle}
          </p>

          <h2
            className="font-orbitron text-5xl md:text-6xl lg:text-7xl tracking-widest mb-6"
            style={{ textShadow: `0 0 35px ${game.accent}55` }}
          >
            {game.name}
          </h2>

          <p className="text-lg md:text-xl text-gray-300 mb-10">
            {game.tagline}
          </p>

          <button
            onClick={() => navigate(`/lobby/${game.id}`)}
            style={{ background: game.accent }}
            className="px-12 py-4 rounded-full text-black
              font-orbitron tracking-widest
              hover:scale-105 active:scale-95 transition-all
              shadow-[0_0_50px_rgba(255,80,0,0.6)]"
          >
            ENTER ARENA
          </button>
        </motion.div>
      </div>

      {/* GAME SWITCHER */}
      <div className="absolute bottom-8 right-6 z-30 flex flex-col gap-3">
        {games.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setActive(i)}
            className={`text-xs tracking-widest px-4 py-2 rounded-full border transition
              ${
                active === i
                  ? "border-white text-white"
                  : "border-white/20 text-gray-400 hover:border-white/60"
              }`}
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  )
}
