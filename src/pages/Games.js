import { useState } from "react"
import { motion } from "framer-motion"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom"

const games = [
  {
    id: "bgmi",
    name: "BGMI",
    subtitle: "BATTLEGROUNDS MOBILE INDIA",
    tagline: "SURVIVE. DOMINATE. WIN.",
    image:
      "https://imgs.search.brave.com/7o5LrcSHUKSwXe4CejygemJdnZw2vZFr__sswiBN4hU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLmdl/dHR5d2FsbHBhcGVy/cy5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjIvMDcvQkdN/SS1CYWNrZ3JvdW5k/LVBpY3R1cmVzLmpw/Zw",
    accent: "#ff4d00"
  },
  {
    id: "freefire",
    name: "FREE FIRE",
    subtitle: "FAST-PACED BATTLE ROYALE",
    tagline: "FAST. FIERCE. DEADLY.",
    image:
      "https://imgs.search.brave.com/PSzYpVQjmhXWWbZBtyl3cEsC0TgfOJ4jlEzEMrTQxx0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLmdl/dHR5d2FsbHBhcGVy/cy5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDQvRnJl/ZS1GaXJlLVdhbGxw/YXBlci0xOTIweDEw/ODAtNGsuanBn",
    accent: "#a855f7"
  }
]

export default function Games() {
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const [cursor, setCursor] = useState({ x: 50, y: 50 })

  const logout = async () => {
    await signOut(auth)
    navigate("/")
  }

  const game = games[active]

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
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
      <div className="absolute top-0 left-0 w-full z-30 flex justify-between items-center px-10 py-6">
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
      <motion.img
        key={game.id}
        src={game.image}
        alt={game.name}
        className="absolute inset-0 w-full h-full object-cover scale-110"
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1.1 }}
        transition={{ duration: 1.2 }}
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/70" />

      {/* MAIN CONTENT */}
      <div className="relative z-20 h-full flex items-center px-16 lg:px-28">
        <motion.div
          key={game.name}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="max-w-2xl"
        >
          <p className="text-xs tracking-[0.5em] text-gray-400 mb-4">
            {game.subtitle}
          </p>

          <h2
            className="font-orbitron text-6xl lg:text-7xl tracking-widest mb-6"
            style={{ textShadow: `0 0 35px ${game.accent}55` }}
          >
            {game.name}
          </h2>

          <p className="text-xl text-gray-300 mb-12">
            {game.tagline}
          </p>

          <button
            onClick={() => navigate(`/lobby/${game.id}`)}
            style={{ background: game.accent }}
            className="px-14 py-4 rounded-full text-black
            font-orbitron tracking-widest
            hover:scale-105 active:scale-95 transition-all
            shadow-[0_0_50px_rgba(255,80,0,0.6)]"
          >
            ENTER ARENA
          </button>
        </motion.div>
      </div>

      {/* GAME SWITCHER */}
      <div className="absolute bottom-10 right-10 z-30 flex flex-col gap-4">
        {games.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setActive(i)}
            className={`text-xs tracking-widest px-4 py-2 rounded-full
              border transition
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
