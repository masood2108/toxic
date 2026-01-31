import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { auth, db } from "../firebase"
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"

export default function Lobby() {

  const { gameId } = useParams()

  /* 🔥 TOURNAMENT LIST */
  const [uploadProgress, setUploadProgress] = useState(0)
const [isUploading, setIsUploading] = useState(false)
const navigate = useNavigate()

  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)

  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [alreadyJoined, setAlreadyJoined] = useState(false)

  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState("")

  const [ign, setIgn] = useState("")
  const [bgmiUid, setBgmiUid] = useState("")

  const [userStatus, setUserStatus] = useState(null)

  /* 🔥 FETCH ALL OPEN TOURNAMENTS (REALTIME) */
  useEffect(() => {
    const q = query(
      collection(db, "tournaments"),
      where("game", "==", gameId.toLowerCase()),
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(q, snap => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [gameId])

  /* 🔥 CHECK IF USER ALREADY JOINED */
  useEffect(() => {
    if (!auth.currentUser || !selectedTournament) return

    const ref = doc(
      db,
      "tournamentPlayers",
      selectedTournament.id,
      "players",
      auth.currentUser.uid
    )

    return onSnapshot(ref, snap => {
      if (snap.exists()) {
        setAlreadyJoined(true)
        setUserStatus(snap.data().paymentStatus)
      } else {
        setAlreadyJoined(false)
        setUserStatus(null)
      }
    })
  }, [selectedTournament])

  /* 🧼 ADDED: clean preview URL memory */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  /* ☁️ CLOUDINARY UPLOAD */
  const uploadToCloudinary = (file) => {
  setIsUploading(true)
  setUploadProgress(0)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()

    formData.append("file", file)
    formData.append("upload_preset", "99dxxxx")

    xhr.open(
      "POST",
      "https://api.cloudinary.com/v1_1/dvic2uies/image/upload"
    )

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded * 100) / e.total)
        setUploadProgress(percent)
      }
    }

    xhr.onload = () => {
      setIsUploading(false)
      const res = JSON.parse(xhr.responseText)
      if (res.secure_url) resolve(res.secure_url)
      else reject("Upload failed")
    }

    xhr.onerror = () => {
      setIsUploading(false)
      reject("Upload error")
    }

    xhr.send(formData)
  })
}



  /* 🔥 CONFIRM JOIN */
  const confirmJoin = async () => {

    if (!auth.currentUser) {
      setMessage("⚠️ Please login first")
      return
    }

    if (!ign || !bgmiUid || !paymentScreenshot || !selectedTournament) {
      setMessage("⚠️ Please fill all details")
      return
    }

    if (alreadyJoined) {
      setMessage("⚠️ You already joined this tournament")
      return
    }

    setJoining(true)
    setMessage("")

    try {
      const user = auth.currentUser

      const screenshotUrl = await uploadToCloudinary(paymentScreenshot)

      await setDoc(
        doc(
          db,
          "tournamentPlayers",
          selectedTournament.id,
          "players",
          user.uid
        ),
        {
          ign,
          bgmiUid,
          email: user.email,
          paymentScreenshot: screenshotUrl,
paymentStatus: "approved",
          joinedAt: Date.now()
        }
      )

      const nextCount = selectedTournament.joinedCount + 1

      await updateDoc(
        doc(db, "tournaments", selectedTournament.id),
        {
          joinedCount: nextCount,
          status:
            nextCount >= selectedTournament.maxPlayers
              ? "closed"
              : "open"
        }
      )

      setShowJoinModal(false)
      setIgn("")
      setBgmiUid("")
      setPaymentScreenshot(null)
      setPreviewUrl(null)

    } catch (err) {
      setMessage("❌ Something went wrong. Try again.")
    }

    setJoining(false)
  }

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        LOADING...
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-400">
        NO ACTIVE TOURNAMENTS AVAILABLE
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 pb-20">

      {/* HEADER */}
      <div className="flex justify-between items-center py-6 border-b border-white/10">
        <h1 className="font-orbitron tracking-widest text-xl">
          TOXIC<span className="text-toxic">RUSH</span>
        </h1>
        {/* PROFILE ICON */}
<div
  onClick={() => navigate("/profile")}
  className="w-10 h-10 rounded-full border-2 border-toxic
             flex items-center justify-center cursor-pointer
             hover:bg-toxic/20 transition"
>
  <span className="text-toxic text-lg">👤</span>
</div>

      </div>
      
      {/* TITLE */}
      <div className="mt-8">
        <h2 className="font-orbitron text-3xl tracking-widest">
          {gameId.toUpperCase()} ZONE
        </h2>
        <p className="text-gray-400 mt-1">
          Tournament Lobby
        </p>
      </div>

      {/* 🔥 TOURNAMENT LIST */}
      <div className="mt-10 max-w-5xl space-y-6">
        {tournaments.map(t => {
          const progress = Math.round(
            (t.joinedCount / t.maxPlayers) * 100
          )

          return (
            <div
              key={t.id}
              className="bg-white/5 border border-white/10 rounded-3xl p-8"
            >
              <div className="flex justify-between">
                <h3 className="font-orbitron text-lg">
                  {t.map} • {t.type}
                </h3>
                <span className="px-4 py-1 text-xs border border-toxic text-toxic rounded-full">
                  {t.status.toUpperCase()}
                </span>
              </div>

              <div className="mt-4 text-xs text-gray-400">
                Joined: {t.joinedCount}/{t.maxPlayers} • Prize ₹{t.prize}
              </div>

              <div className="h-2 bg-gray-800 rounded overflow-hidden mt-2">
                <div
                  className="h-full bg-toxic"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {userStatus === "approved" && selectedTournament?.id === t.id && (
                <div className="mt-4 bg-green-900/20 border border-green-500 rounded-xl p-4">
                  <p>Room ID: <b>{t.roomId}</b></p>
                  <p>Password: <b>{t.roomPassword}</b></p>
                </div>
              )}

              <div className="flex justify-between items-center mt-6">
                <p className="font-orbitron">
                  Entry ₹{t.entryFee}
                </p>

                <button
                  onClick={() => {
                    setSelectedTournament(t)
                    setShowJoinModal(true)
                    setMessage("") 
                  }}
                  disabled={
                    t.status === "closed" ||
                    (alreadyJoined && selectedTournament?.id === t.id)
                  }
                  className="px-8 py-3 rounded-xl bg-toxic text-black font-orbitron disabled:opacity-50"
                >
                  {alreadyJoined && selectedTournament?.id === t.id
                    ? "JOINED"
                    : "JOIN"}
                </button>
              </div>
            </div>
          )
        })}
      </div>



      {/* 🔥 JOIN MODAL */}
      {showJoinModal && (
  <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4">

    <div className="w-full max-w-5xl bg-[#0b0b0b] border border-toxic rounded-2xl overflow-hidden">

      {/* HEADER */}
      <div className="px-6 py-4 border-b border-white/10">
        <h2 className="font-orbitron tracking-widest text-xl">
          JOIN MATCH
        </h2>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">

        {/* IGN */}
        <div>
          <label className="text-sm text-gray-400">In-Game Name</label>
          <input
            value={ign}
            onChange={e => setIgn(e.target.value)}
            placeholder="Ex: SoulMortal"
            className="w-full mt-1 px-4 py-3 bg-black border border-white/20 rounded-lg
            outline-none focus:border-toxic"
          />
        </div>

        {/* BGMI UID */}
        <div>
          <label className="text-sm text-gray-400">BGMI UID</label>
          <input
            value={bgmiUid}
            onChange={e => setBgmiUid(e.target.value)}
            placeholder="Enter your BGMI UID"
            className="w-full mt-1 px-4 py-3 bg-black border border-white/20 rounded-lg
            outline-none focus:border-toxic"
          />
        </div>

        {/* PAYMENT SECTION */}
        <div className="bg-white rounded-xl p-6 flex flex-col items-center">
          <p className="font-semibold text-black mb-2">
            Scan to Pay ₹{selectedTournament?.entryFee}
          </p>

          {/* QR IMAGE */}
          <img
            src="/qr.png"   // 🔥 replace with your QR image path
            alt="QR Code"
            className="w-40 h-40 object-contain mb-4"
          />

         
        </div>

        {/* UPLOAD SCREENSHOT */}
        <div>
          <label className="text-sm text-gray-400">
            Upload Payment Screenshot
          </label>

          <input
  type="file"
  accept="image/*"
  onChange={e => {
    const file = e.target.files[0]
    setPaymentScreenshot(file)
    setPreviewUrl(URL.createObjectURL(file))
  }}
  className="w-full mt-2 text-sm text-gray-300
    file:bg-toxic file:text-black file:px-4 file:py-2
    file:rounded file:border-0 cursor-pointer"
/>
{previewUrl && (
  <img
    src={previewUrl}
    alt="Preview"
    className="mt-4 rounded-lg max-h-60 border border-white/20"
  />
)}
{/* UPLOAD PROGRESS */}
{isUploading && (
  <div className="mt-4">
    <div className="flex justify-between text-xs text-gray-400 mb-1">
      <span>Uploading screenshot</span>
      <span>{uploadProgress}%</span>
    </div>
    <div className="h-2 bg-gray-800 rounded overflow-hidden">
      <div
        className="h-full bg-toxic transition-all"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
  </div>
)}


        </div>

        {/* CONFIRM BUTTON */}
        <button
          onClick={confirmJoin}
          disabled={joining}
          className="w-full py-4 rounded-xl bg-toxic text-black
          font-orbitron tracking-widest text-lg hover:shadow-toxic transition
          disabled:opacity-60"
        >
          {joining ? "PROCESSING..." : "CONFIRM JOIN"}
        </button>

        {/* CANCEL */}
        <button
          onClick={() => setShowJoinModal(false)}
          className="w-full text-center text-gray-400 hover:text-white"
        >
          Cancel
        </button>

        {message && (
          <p className="text-center text-sm text-red-400">
            {message}
          </p>
        )}

      </div>
    </div>
  </div>
)}


    </div>
  )
}
