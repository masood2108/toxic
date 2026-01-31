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

export default function AdminGameDashboard() {

  const { gameId } = useParams()
  const navigate = useNavigate()
  const gameKey = normalize(gameId)

  /* ================= STATE ================= */
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [zoomImage, setZoomImage] = useState(null)


  /* CREATE FORM */
  const [map, setMap] = useState("")
  const [type, setType] = useState("SOLO")
  const [entryFee, setEntryFee] = useState("")
  const [prize, setPrize] = useState("")
  const [maxPlayers, setMaxPlayers] = useState("")
  const [startTime, setStartTime] = useState("")

  /* ROOM */
  const [roomId, setRoomId] = useState("")
  const [roomPassword, setRoomPassword] = useState("")

  /* ================= AUTH ================= */
  useEffect(() => {
    if (!auth.currentUser || !ADMIN_EMAILS.includes(auth.currentUser.email)) {
      navigate("/")
    }
  }, [navigate])

  /* ================= FETCH TOURNAMENTS ================= */
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

  /* ================= FETCH PLAYERS ================= */
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

  /* ================= CREATE TOURNAMENT ================= */
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

  /* ================= ROOM UPDATE ================= */
  const saveRoom = async () => {
    if (!selectedTournament) return

    await updateDoc(
      doc(db, "tournaments", selectedTournament.id),
      { roomId, roomPassword }
    )

    alert("Room updated")
  }

  /* ================= PAYMENT STATUS ================= */
  const updateStatus = async (uid, status) => {
  if (!selectedTournament) return

  const playerRef = doc(
    db,
    "tournamentPlayers",
    selectedTournament.id,
    "players",
    uid
  )

  const tournamentRef = doc(
    db,
    "tournaments",
    selectedTournament.id
  )

  // 🔥 Get current player data
  const playerSnap = await getDoc(playerRef)
  if (!playerSnap.exists()) return

  const prevStatus = playerSnap.data().paymentStatus

  // ✅ Update payment status
  await updateDoc(playerRef, {
    paymentStatus: status
  })

  // 🔻 AUTO DECREMENT IF REJECTED
  if (status === "rejected" && prevStatus !== "rejected") {

    const newCount = Math.max(
      (selectedTournament.joinedCount || 1) - 1,
      0
    )

    await updateDoc(tournamentRef, {
      joinedCount: newCount,
      status: "open" // 🔓 reopen tournament
    })
  }
}


  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-black text-white p-8">

      <h1 className="font-orbitron text-4xl mb-10">
        {gameId.toUpperCase()} — ADMIN DASHBOARD
      </h1>

      {/* ================= CREATE ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12">
        <h2 className="font-orbitron mb-6">CREATE TOURNAMENT</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="admin-input" placeholder="Map" value={map} onChange={e => setMap(e.target.value)} />
          <select className="admin-input" value={type} onChange={e => setType(e.target.value)}>
            <option>SOLO</option>
            <option>DUO</option>
            <option>SQUAD</option>
          </select>
          <input className="admin-input" placeholder="Entry Fee" value={entryFee} onChange={e => setEntryFee(e.target.value)} />
          <input className="admin-input" placeholder="Prize Pool" value={prize} onChange={e => setPrize(e.target.value)} />
          <input className="admin-input" placeholder="Max Players" value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} />
          <input className="admin-input" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>

        <button
          onClick={createTournament}
          className="mt-6 bg-toxic px-8 py-3 rounded-xl text-black font-orbitron"
        >
          CREATE TOURNAMENT
        </button>
      </div>

      {/* ================= TOURNAMENT LIST ================= */}
      <h2 className="font-orbitron text-xl mb-4">ALL TOURNAMENTS</h2>

      {tournaments.map(t => (
        <div
          key={t.id}
          onClick={() => {
            setSelectedTournament(t)
            setRoomId(t.roomId || "")
            setRoomPassword(t.roomPassword || "")
          }}
          className={`p-4 mb-3 rounded-xl border cursor-pointer transition
            ${selectedTournament?.id === t.id
              ? "border-toxic bg-toxic/10"
              : t.status === "open"
                ? "border-green-500 bg-green-900/10"
                : "border-white/10 bg-white/5"
            }`}
        >
          <p className="font-semibold">{t.map} • {t.type}</p>
          <p className="text-xs text-gray-400">
            {t.joinedCount}/{t.maxPlayers} joined • ₹{t.prize}
          </p>
        </div>
      ))}

      {/* ================= SELECTED TOURNAMENT ================= */}
      {selectedTournament && (
        <>
          <h2 className="font-orbitron text-xl mt-10 mb-4">
            TOURNAMENT PLAYERS
          </h2>

          {/* ROOM */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="font-orbitron mb-4">ROOM DETAILS</h3>
            <input className="admin-input mb-3" value={roomId} placeholder="Room ID" onChange={e => setRoomId(e.target.value)} />
            <input className="admin-input mb-4" value={roomPassword} placeholder="Room Password" onChange={e => setRoomPassword(e.target.value)} />
            <button onClick={saveRoom} className="bg-toxic px-6 py-2 text-black rounded-lg">
              SAVE ROOM
            </button>
          </div>

          {/* PLAYERS */}
          {players.length === 0 && (
            <p className="text-gray-400">No players registered yet.</p>
          )}

          {players.map(p => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-5 mb-4">
              <div className="flex flex-col md:flex-row gap-6">

                <div className="flex-1">
                  <p className="text-lg font-semibold">{p.ign}</p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                  <p className="text-xs mt-1">BGMI UID: {p.bgmiUid}</p>

                  <p className={`mt-2 font-semibold ${
                    p.paymentStatus === "approved"
                      ? "text-green-400"
                      : p.paymentStatus === "rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                  }`}>
                    {p.paymentStatus?.toUpperCase()}
                  </p>

                  <div className="mt-3 space-x-2">
                    <button onClick={() => updateStatus(p.id, "approved")} className="btn-approve">
                      Approve
                    </button>
                    <button onClick={() => updateStatus(p.id, "rejected")} className="btn-reject">
                      Reject
                    </button>
                  </div>
                </div>

                {p.paymentScreenshot && (
                  <div className="w-full md:w-64">
                    <p className="text-xs text-gray-400 mb-1">Payment Screenshot</p>
                    <img
  src={p.paymentScreenshot}
  alt="Payment"
  onClick={() => setZoomImage(p.paymentScreenshot)}
  className="rounded-lg border border-white/20 max-h-48 object-contain cursor-zoom-in"
/>

                  </div>
                )}
                
{zoomImage && (
  <div
    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
    onClick={() => setZoomImage(null)}
  >
    <img
      src={zoomImage}
      alt="Zoomed payment screenshot"  
      className="max-w-[90%] max-h-[90%] rounded-xl"
    />
  </div>
)}


              </div>
            </div>
          ))}
        </>
      )}

    </div>
  )
}
