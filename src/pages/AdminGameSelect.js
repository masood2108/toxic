import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"

const ADMIN_EMAILS = [
  "masoodhussainr8@gmail.com",
  "officialtoxicrush.esports@gmail.com"
]

export default function AdminGameSelect() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.currentUser || !ADMIN_EMAILS.includes(auth.currentUser.email)) {
      navigate("/")
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        <button
          onClick={() => navigate("/admin/game/bgmi")}
          className="bg-white/5 border border-white/10 p-12 rounded-3xl
          hover:border-toxic transition text-3xl font-orbitron"
        >
          BGMI
        </button>

        <button
          onClick={() => navigate("/admin/game/freefire")}
          className="bg-white/5 border border-white/10 p-12 rounded-3xl
          hover:border-toxic transition text-3xl font-orbitron"
        >
          FREE FIRE
        </button>

      </div>
    </div>
  )
}
