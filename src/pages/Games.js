import { useState } from "react"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom"

const games = [
  {
    id: "bgmi",
    name: "BGMI",
    tagline: "SURVIVE. DOMINATE. WIN.",
    image:
      "https://imgs.search.brave.com/7o5LrcSHUKSwXe4CejygemJdnZw2vZFr__sswiBN4hU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLmdl/dHR5d2FsbHBhcGVy/cy5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjIvMDcvQkdN/SS1CYWNrZ3JvdW5k/LVBpY3R1cmVzLmpw/Zw",
    gradient: "from-orange-600 via-red-600 to-pink-700"
  },
  {
    id: "freefire",
    name: "FREE FIRE",
    tagline: "FAST. FIERCE. DEADLY.",
    image:
      "https://imgs.search.brave.com/PSzYpVQjmhXWWbZBtyl3cEsC0TgfOJ4jlEzEMrTQxx0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLmdl/dHR5d2FsbHBhcGVy/cy5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDQvRnJl/ZS1GaXJlLVdhbGxw/YXBlci0xOTIweDEw/ODAtNGsuanBn",
    gradient: "from-purple-700 via-fuchsia-700 to-indigo-800"
  }
]

export default function Games() {

  const navigate = useNavigate()
  const [offset, setOffset] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const logout = async () => {
    await signOut(auth)
    navigate("/")
  }

  const handleMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30
    setOffset(x)
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-white">

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 py-5 z-30">
        <h1 className="font-orbitron tracking-widest text-xl">
          TOXIC<span className="text-toxic">RUSH</span>
        </h1>

        <button
          onClick={logout}
          className="px-5 py-2 text-xs rounded-full font-rajdhani tracking-widest 
          border border-white/25 bg-black/40 backdrop-blur-md
          hover:border-toxic hover:text-toxic transition"
        >
          LOGOUT
        </button>
      </div>

      {/* MAIN */}
      <div
        className="relative z-10 h-screen flex flex-col lg:flex-row"
        onMouseMove={handleMove}
      >
        {games.map((game, index) => (
          <div
            key={game.id}
            className="group relative flex-1 overflow-hidden"
          >
            {/* 🔥 ANIMATED IMAGE LAYER */}
            <div
              className={`absolute inset-0 animate-float-${index}`}
              style={{
                transform: `translateX(${offset}px)`
              }}
            >
              <img
                src={game.image}
                alt={game.name}
                className="w-full h-full object-cover object-center scale-110
                transition-transform duration-1000 will-change-transform"
              />
            </div>

            {/* IMAGE DARKEN */}
            <div className="absolute inset-0 bg-black/65" />

            {/* COLOR OVERLAY */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${game.gradient} 
              opacity-40 mix-blend-overlay`}
            />

            {/* VIGNETTE */}
            <div className="absolute inset-0 pointer-events-none 
              bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.9))]" />

            {/* CONTENT */}
            <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-20">

              <div className="max-w-xl bg-black/55 backdrop-blur-xl 
                border border-white/10 rounded-3xl p-8 sm:p-10">

                <p className="font-rajdhani tracking-[0.4em] text-xs text-gray-300 mb-4">
                  CHOOSE YOUR BATTLE
                </p>

                <h2 className="font-orbitron text-5xl sm:text-6xl tracking-widest mb-4 text-white">
                  {game.name}
                </h2>

                <p className="font-rajdhani text-lg text-gray-200 mb-8">
                  {game.tagline}
                </p>

                <button
                  onClick={() => {
                    setTransitioning(true)
                    setTimeout(() => {
                      navigate(`/lobby/${game.id}`)
                    }, 600)
                  }}
                  className="px-10 py-3 rounded-full bg-toxic text-black
                  font-orbitron tracking-widest text-sm
                  hover:shadow-[0_0_35px_rgba(255,80,0,0.7)]
                  transition active:scale-95"
                >
                  ENTER ARENA
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CLICK TRANSITION */}
      {transitioning && (
        <div className="fixed inset-0 bg-black animate-fade z-50" />
      )}
    </div>
  )
}
