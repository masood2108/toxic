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

/* 🆕 MAP IMAGES (USED IN CREATE UI) */
const MAP_IMAGES = {
  Erangel: "https://wallpapers.com/images/high/pubg-season-3-erangel-new-map-bel56ctm7szmed63.webp",
  Miramar: "https://wallpapers.com/images/high/playerunknowns-battlegrounds-4k-fr44xgm1ts02ab4m.webpg",
  Sanhok: "https://wallpapers.com/images/high/pubg-season-3-welcome-to-sanhok-7hb85ror77gq7cl2.webp",
  Vikendi: "https://wallpapers.com/images/high/pubg-1440p-vikendi-drop-ziatf2qem16sw87b.webp",
  Livik: "https://imgs.search.brave.com/eSAgjyBD8xICsJbjpzvBEuX0q_GBnbIPhLpdNixHx4k/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJjYXZlLmNv/bS93cC93cDY5MDIz/OTcuanBn",
  Nusa: "https://imgs.search.brave.com/OA8Q4gZcBagqiWDI9h7JEpvYdWLg1MtWsn7cQlf7n-A/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWNnLnNwb3J0c2tl/ZWRhLmNvbS9lZGl0/b3IvMjAyMy8wNi84/ODE0NS0xNjg3Mjcw/MDIyMDI5OC0xOTIw/LmpwZw",
  Bermuda: "https://imgs.search.brave.com/PmvRTkzr7Zzt0BJlL5BxNvQIFm8tf0jgETyUVaZ_pM4/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWNnLnNwb3J0c2tl/ZWRhLmNvbS9lZGl0/b3IvMjAyMC8wOS83/MjJmNi0xNjAxMTc1/NjUwMjYyMy04MDAu/anBn",
  "Bermuda Remastered": "http://imgs.search.brave.com/jH-3xQIBzaM99d9r8SAF3SYmQGaURpEAYQUYiu_xo64/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMuZGlnaXQuaW4v/ZGVmYXVsdC8zYTNi/NTk2MDQyZWRiOTIy/M2VjYTk1Y2ZjYTM3/NWVmNWNlY2MxNjA2/LmpwZWc",
  Purgatory: "https://imgs.search.brave.com/Mi6MJyK7ppDbaBSjEQ1HPkXIEa84Rv75WRUIQMn5USg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJhY2Nlc3Mu/Y29tL2Z1bGwvOTUz/MjEzNS5qcGc",
  Kalahari: "https://imgs.search.brave.com/SsQfQ3aNleBkdjM-01R6jTxEnPOByE0bcJqioE7zIuk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxs/cGFwZXJhY2Nlc3Mu/Y29tL2Z1bGwvOTUz/MjE1Mi5qcGc",
  Alpine: "https://imgs.search.brave.com/nRf0-UkiPVE1atIBhzRJdMAjEErcn9msaFSFHRj1M8M/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzgyLzY5/LzA4LzgyNjkwOGVk/MmE1OGFkZDVmN2Ux/MzU5OThjNTk2NjQ0/LmpwZw",
  NeXTerra: "https://imgs.search.brave.com/O3iVlo90er6ssZV534mqehjeCUX6TnWCt1C-ABCrVcc/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWNnLnNwb3J0c2tl/ZWRhLmNvbS9lZGl0/b3IvMjAyMi8wOC84/NThjMC0xNjYxMDI1/MDkyMDk2Mi0xOTIw/LmpwZw"
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

  /* 🔐 AUTH */
  useEffect(() => {
    if (!auth.currentUser || !ADMIN_EMAILS.includes(auth.currentUser.email)) {
      navigate("/")
    }
  }, [navigate])

  /* 🏷️ TITLE */
  useEffect(() => {
    if (selectedTournament) {
      document.title = `Room Ops • ${selectedTournament.map} | ToxicRush`
    } else {
      document.title = `ToxicRush Admin • ${gameId.toUpperCase()}`
    }
  }, [gameId, selectedTournament])

  /* 📡 FETCH TOURNAMENTS */
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

  /* 👥 FETCH PLAYERS */
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

  /* 🚀 CREATE TOURNAMENT */
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

  /* 🔑 ROOM SAVE */
  const saveRoom = async () => {
    if (!selectedTournament) return
    await updateDoc(doc(db, "tournaments", selectedTournament.id), {
      roomId,
      roomPassword
    })
    alert("Room updated")
  }

  /* 💳 PAYMENT STATUS */
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
      </div>

      {/* CREATE TOURNAMENT */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-14">
        <h2 className="font-orbitron mb-6 text-xl">CREATE TOURNAMENT</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* MAP SELECT */}
          <div className="col-span-full">
            <p className="text-sm text-gray-400 mb-3">SELECT MAP</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {MAPS[gameKey]?.map(m => (
                <div
                  key={m}
                  onClick={() => setMap(m)}
                  className={`relative cursor-pointer rounded-xl overflow-hidden border
                    ${map === m ? "border-toxic" : "border-white/10 hover:border-toxic/50"}`}
                >
                  <img src={MAP_IMAGES[m]} alt={m} className="w-full h-28 object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-end p-2">
                    <span className="text-sm font-semibold">{m}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MODE SELECT */}
          <div className="col-span-full flex gap-4">
            {["SOLO", "DUO", "SQUAD"].map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-6 py-3 rounded-xl border font-orbitron
                  ${type === t ? "bg-toxic text-black" : "border-white/20"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* INPUTS */}
          <input className="admin-input" placeholder="Entry Fee ₹" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
          <input className="admin-input" placeholder="Prize Pool ₹" value={prize} onChange={e => setPrize(e.target.value)} />
          <input className="admin-input" placeholder="Max Players" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} />
          <input className="admin-input" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>

        <button onClick={createTournament} className="mt-8 bg-toxic px-12 py-3 rounded-xl text-black font-orbitron">
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

