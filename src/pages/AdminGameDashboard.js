import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  getDoc,
  orderBy
} from "firebase/firestore"

const ADMIN_EMAILS = [
  "masoodhussainr8@gmail.com",
  "officialtoxicrush.esports@gmail.com"
]

const normalize = v => v?.toLowerCase()

const MAPS = {
  bgmi: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa"],
  freefire: ["Bermuda", "Bermuda Remastered", "Purgatory", "Kalahari", "Alpine", "NeXTerra"]
}

export default function AdminGameDashboard() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const gameKey = normalize(gameId)

  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [zoomImage, setZoomImage] = useState(null)

  const [map, setMap] = useState("")
  const [type, setType] = useState("SOLO")
  const [entryFee, setEntryFee] = useState("")
  const [prize, setPrize] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("")
  const [startTime, setStartTime] = useState("")

  const [roomId, setRoomId] = useState("")
  const [roomPassword, setRoomPassword] = useState("")
/* 🆕 MAP ICONS */
const MAP_ICONS = {
  Erangel: "🌍",
  Miramar: "🏜️",
  Sanhok: "🌴",
  Vikendi: "❄️",
  Livik: "⚡",
  Nusa: "🏝️",

  Bermuda: "🌊",
  "Bermuda Remastered": "🔥",
  Purgatory: "☠️",
  Kalahari: "🏜️",
  Alpine: "🏔️",
  NeXTerra: "🚀"
}

  useEffect(() => {
    if (!auth.currentUser || !ADMIN_EMAILS.includes(auth.currentUser.email)) {
      navigate("/")
    }
  }, [navigate])

  useEffect(() => {
    const q = query(
      collection(db, "tournaments"),
      where("game", "==", gameKey),
      orderBy("createdAtClient", "desc")
    )
    return onSnapshot(q, snap => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [gameKey])

  useEffect(() => {
    if (!selectedTournament) {
      setPlayers([])
      return
    }
    return onSnapshot(
      collection(db, "tournamentPlayers", selectedTournament.id, "players"),
      snap => {
        setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    )
  }, [selectedTournament])

  const createTournament = async () => {
    if (!map || !entryFee || !prize || !maxPlayers || !startTime) {
      alert("Fill all fields")
      return
    }

    const id = `${gameKey}_${type.toLowerCase()}_${Date.now()}`

    await setDoc(doc(db, "tournaments", id), {
      game: gameKey,
      map,
      type,
      entryFee: Number(entryFee),
      prize: Number(prize),
      maxPlayers: Number(maxPlayers),
      joinedCount: 0,
      status: "open",
      roomId: "",
      roomPassword: "",
      startTime: new Date(startTime),
      createdAt: serverTimestamp(),
      createdAtClient: Date.now()
    })

    setMap("")
    setEntryFee("")
    setPrize("")
    setMaxPlayers("")
    setStartTime("")
  }

  const saveRoom = async () => {
    if (!selectedTournament) return
    await updateDoc(doc(db, "tournaments", selectedTournament.id), {
      roomId,
      roomPassword
    })
    alert("Room updated")
  }

  const updateStatus = async (uid, status) => {
    if (!selectedTournament) return

    const playerRef = doc(db, "tournamentPlayers", selectedTournament.id, "players", uid)
    const tournamentRef = doc(db, "tournaments", selectedTournament.id)

    const playerSnap = await getDoc(playerRef)
    if (!playerSnap.exists()) return

    const prevStatus = playerSnap.data().paymentStatus

    await updateDoc(playerRef, {
      paymentStatus: status,
      ...(status === "rejected" && { lastRejectedAt: Date.now() })
    })

    if (status === "rejected" && prevStatus !== "rejected") {
      await updateDoc(tournamentRef, {
        joinedCount: Math.max((selectedTournament.joinedCount || 1) - 1, 0),
        status: "open"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-8">

      {/* HEADER */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-black/60 border border-white/10 rounded-2xl p-6 mb-10 flex justify-between items-center">
        <h1 className="font-orbitron text-4xl flex gap-3 items-center">
          {gameId.toUpperCase()}
          <span className="text-toxic">ADMIN OPS</span>
        </h1>
        <div className="text-xs text-gray-400">
          Live Control Panel • ToxicRush
        </div>
      </div>

      {/* CREATE */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-14 shadow-[0_0_80px_rgba(0,255,150,0.08)]">
        <h2 className="font-orbitron mb-6 text-xl">CREATE TOURNAMENT</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="admin-input" value={map} onChange={e => setMap(e.target.value)}>
            <option value="">Select Map</option>
            {MAPS[gameKey]?.map(m => <option key={m}>{m}</option>)}
          </select>

          <select className="admin-input" value={type} onChange={e => setType(e.target.value)}>
            <option>SOLO</option>
            <option>DUO</option>
            <option>SQUAD</option>
          </select>

          <input className="admin-input" placeholder="Entry Fee ₹" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
          <input className="admin-input" placeholder="Prize Pool ₹" value={prize} onChange={e => setPrize(e.target.value)} />
          <input className="admin-input" placeholder="Max Players" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} />
          <input className="admin-input" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>

        <button
          onClick={createTournament}
          className="mt-8 bg-toxic px-12 py-3 rounded-xl text-black font-orbitron hover:scale-105 hover:shadow-[0_0_30px_#00ff99] transition"
        >
          DEPLOY TOURNAMENT
        </button>
      </div>

      {/* TOURNAMENTS */}
      <h2 className="font-orbitron text-xl mb-4">LIVE TOURNAMENTS</h2>

      {tournaments.map(t => (
        <div
          key={t.id}
          onClick={() => {
            setSelectedTournament(t)
            setRoomId(t.roomId || "")
            setRoomPassword(t.roomPassword || "")
          }}
          className={`p-5 mb-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]
          ${selectedTournament?.id === t.id
              ? "border-toxic bg-toxic/10 shadow-[0_0_30px_rgba(0,255,150,0.15)]"
              : "border-white/10 bg-white/5 hover:border-toxic/50"
            }`}
        >
          <div className="flex justify-between items-center">
<p className="font-semibold flex items-center gap-2">
  <span className="text-xl">
    {MAP_ICONS[t.map] || "🎮"}
  </span>
  <span>{t.map}</span>
  <span className="text-xs text-gray-400">• {t.type}</span>
</p>
            <span className="text-xs px-3 py-1 rounded-full bg-black/40 border border-white/10">
              {t.joinedCount}/{t.maxPlayers}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Prize ₹{t.prize}</p>
        </div>
      ))}

      {selectedTournament && (
        <>
<h2 className="font-orbitron text-xl mt-12 mb-4 flex items-center gap-3">
  <span className="text-2xl">
    {MAP_ICONS[selectedTournament.map] || "🎮"}
  </span>
  TOURNAMENT CONTROL — {selectedTournament.map}
</h2>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="font-orbitron mb-4">ROOM ACCESS</h3>
            <input className="admin-input mb-3" value={roomId} placeholder="Room ID" onChange={e => setRoomId(e.target.value)} />
            <input className="admin-input mb-4" value={roomPassword} placeholder="Room Password" onChange={e => setRoomPassword(e.target.value)} />
            <button onClick={saveRoom} className="bg-toxic px-8 py-2 text-black rounded-lg hover:scale-105 transition">
              LOCK ROOM
            </button>
          </div>

          {players.map(p => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-6 mb-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="text-lg font-semibold">{p.ign}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                  <p className="text-xs mt-1">UID: {p.bgmiUid}</p>

                  <p className={`mt-3 font-bold ${
                    p.paymentStatus === "approved" ? "text-green-400" :
                    p.paymentStatus === "rejected" ? "text-red-400" : "text-yellow-400"
                  }`}>
                    {p.paymentStatus?.toUpperCase()}
                  </p>

                  <div className="mt-4 flex gap-3">
                    <button onClick={() => updateStatus(p.id, "approved")} className="btn-approve">
                      APPROVE
                    </button>
                    <button onClick={() => updateStatus(p.id, "rejected")} className="btn-reject">
                      REJECT
                    </button>
                  </div>
                </div>

                {p.paymentScreenshot && (
                  <img
  src={p.paymentScreenshot}
  alt="Player payment screenshot"
  onClick={() => setZoomImage(p.paymentScreenshot)}
  className="w-64 rounded-xl border border-white/20 cursor-zoom-in hover:scale-105 transition"
/>

                )}
              </div>
            </div>
          ))}
        </>
      )}

      {zoomImage && (
        <div onClick={() => setZoomImage(null)} className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
<img
  src={zoomImage}
  alt="Zoomed payment screenshot"
  className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl"
/>
        </div>
      )}
    </div>
  )
}
