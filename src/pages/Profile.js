import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  getDoc
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"

export default function Profile() {

  const user = auth.currentUser
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [matches, setMatches] = useState([])
  const [editing, setEditing] = useState(false)

  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    bgmiUid: "",
    freeFireUid: ""
  })

  /* 🔥 REALTIME PROFILE */
  useEffect(() => {
    if (!user) return

    return onSnapshot(doc(db, "users", user.uid), snap => {
      const d = snap.data()
      if (!d) return

      setData(d)
      setForm({
        name: d.name || "",
        whatsapp: d.whatsapp || "",
        bgmiUid: d.bgmiUid || "",
        freeFireUid: d.freeFireUid || ""
      })
    })
  }, [user])

  /* 🎮 REALTIME MATCH HISTORY (FIXED & SAFE) */
  useEffect(() => {
    if (!user) return

    const unsub = onSnapshot(
      collection(db, "tournaments"),
      async snap => {
        const result = []

        for (const tDoc of snap.docs) {
          const tData = tDoc.data()

          const playerRef = doc(
            db,
            "tournamentPlayers",
            tDoc.id,
            "players",
            user.uid
          )

          const playerSnap = await getDoc(playerRef)

          if (playerSnap.exists()) {
            result.push({
              id: tDoc.id,
              ...tData,
              ...playerSnap.data()
            })
          }
        }

        result.sort((a, b) => b.joinedAt - a.joinedAt)
        setMatches(result)
      }
    )

    return () => unsub()
  }, [user])

  /* 💾 SAVE PROFILE */
  const saveProfile = async () => {
    if (!user) return
    await updateDoc(doc(db, "users", user.uid), form)
    setEditing(false)
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-black text-white px-6 pb-24">

      {/* HEADER */}
      <div className="flex items-center gap-4 py-6 border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="text-toxic text-xl"
        >
          ←
        </button>
        <h1 className="font-orbitron tracking-widest text-lg">
          PROFILE
        </h1>
      </div>

      {/* PROFILE CARD */}
      <div className="mt-10 bg-gradient-to-br from-black to-[#120900]
                      border border-toxic/40 rounded-3xl p-8 text-center">

        <div className="w-24 h-24 mx-auto rounded-full border-2 border-toxic
                        flex items-center justify-center text-3xl">
          👤
        </div>

        <h2 className="mt-4 text-2xl font-bold">{data.name}</h2>
        <p className="text-gray-400 text-sm">{data.email}</p>

        {data.role === "admin" && (
          <span className="inline-block mt-3 px-4 py-1 text-xs
                           bg-red-600/20 border border-red-500
                           text-red-400 rounded-full">
            ADMIN
          </span>
        )}
      </div>

      {/* INFO */}
      <div className="mt-8 space-y-4">
        <Info label="WhatsApp" value={data.whatsapp || "Not Set"} />
        <Info label="BGMI UID" value={data.bgmiUid || "Not Set"} danger={!data.bgmiUid} />
        <Info label="Free Fire UID" value={data.freeFireUid || "Not Set"} danger={!data.freeFireUid} />
      </div>

      {/* 🎮 MATCH HISTORY */}
      <div className="mt-10">
        <h2 className="font-orbitron text-lg mb-4 tracking-widest">
          MATCH HISTORY
        </h2>

        {matches.length === 0 && (
          <p className="text-gray-400 text-sm">
            No matches played yet.
          </p>
        )}

        <div className="space-y-4">
          {matches.map(m => (
            <div
              key={m.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex justify-between">
                <p className="font-semibold">
                  {m.game?.toUpperCase()} • {m.map} • {m.type}
                </p>

                <span className={`text-xs px-3 py-1 rounded-full
                  ${m.paymentStatus === "approved"
                    ? "bg-green-500/20 text-green-400"
                    : m.paymentStatus === "rejected"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"}
                `}>
                  {m.paymentStatus?.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-1">
                Prize ₹{m.prize} • Entry ₹{m.entryFee}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                {new Date(m.joinedAt).toLocaleString()}
              </p>

              {m.paymentStatus === "approved" && m.roomId && (
                <div className="mt-3 text-sm bg-green-900/20
                                border border-green-500 rounded-lg p-2">
                  Room ID: <b>{m.roomId}</b> | Pass: <b>{m.roomPassword}</b>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-10 space-y-4">
        <button
          onClick={() => setEditing(true)}
          className="w-full bg-white text-black py-3 rounded-xl font-bold"
        >
          EDIT PROFILE
        </button>

        <button
          onClick={async () => {
            await auth.signOut()
            navigate("/")
          }}
          className="w-full border border-red-500 text-red-500 py-3 rounded-xl"
        >
          LOGOUT
        </button>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/90 z-50
                        flex items-center justify-center px-4">
          <div className="bg-[#0b0b0b] border border-toxic
                          rounded-2xl p-6 w-full max-w-md">

            <h2 className="font-orbitron text-lg mb-4">
              EDIT PROFILE
            </h2>

            {["name","whatsapp","bgmiUid","freeFireUid"].map(key => (
              <input
                key={key}
                value={form[key]}
                onChange={e =>
                  setForm({ ...form, [key]: e.target.value })
                }
                placeholder={key.toUpperCase()}
                className="admin-input mb-3"
              />
            ))}

            <button
              onClick={saveProfile}
              className="w-full bg-toxic text-black py-3 rounded-xl mt-2"
            >
              SAVE
            </button>

            <button
              onClick={() => setEditing(false)}
              className="w-full mt-2 text-gray-400"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </div>
  )
}

const Info = ({ label, value, danger }) => (
  <div className="flex justify-between bg-white/5 rounded-xl p-4">
    <span className="text-gray-400">{label}</span>
    <span className={danger ? "text-red-400" : "text-white"}>
      {value}
    </span>
  </div>
)
