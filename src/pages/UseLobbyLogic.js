import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
  getDocs
} from "firebase/firestore"

export default function useLobbyLogic() {

  /* ================= CONFIG ================= */
  const REJOIN_COOLDOWN_MINUTES = 10
  const MAX_RETRY_LIMIT = 3

  const { gameId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)

  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [selectedTournamentId, setSelectedTournamentId] = useState(null)

  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [userStatus, setUserStatus] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState("")

  const [ign, setIgn] = useState("")
  const [bgmiUid, setBgmiUid] = useState("")

  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  /* 🆕 ROOM DETAILS (ADDED – NOTHING REMOVED) */
  const [roomId, setRoomId] = useState("")
  const [roomPassword, setRoomPassword] = useState("")

  /* ================= FETCH TOURNAMENTS ================= */
  useEffect(() => {
    if (!gameId) return

    const q = query(
      collection(db, "tournaments"),
      where("game", "==", gameId.toLowerCase()),
      orderBy("createdAtClient", "desc")
    )

    const unsub = onSnapshot(q, snap => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [gameId])

  /* ================= AUTO DETECT JOINED MATCH (STEP 1) ================= */
  useEffect(() => {
    if (!auth.currentUser) return

    const detectJoined = async () => {
      const q = query(
        collectionGroup(db, "players"),
        where("email", "==", auth.currentUser.email)
      )

      const snap = await getDocs(q)
      if (snap.empty) return

      const playerDoc = snap.docs[0]
      const tournamentId = playerDoc.ref.parent.parent.id

      setSelectedTournamentId(tournamentId)
      setAlreadyJoined(true)
    }

    detectJoined()
  }, [])

  /* ================= MAP JOINED MATCH TO UI (STEP 2) ================= */
  useEffect(() => {
    if (!selectedTournamentId || tournaments.length === 0) return

    const tournament = tournaments.find(t => t.id === selectedTournamentId)
    if (tournament) {
      setSelectedTournament(tournament)
    }
  }, [selectedTournamentId, tournaments])

  /* ================= USER STATUS LISTENER ================= */
  useEffect(() => {
    if (!auth.currentUser || !selectedTournamentId) return

    const ref = doc(
      db,
      "tournamentPlayers",
      selectedTournamentId,
      "players",
      auth.currentUser.uid
    )

    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) {
        setAlreadyJoined(false)
        setUserStatus(null)
        setAttempts(0)
        return
      }

      const data = snap.data()
      const status = data.paymentStatus
      const retryCount = data.attempts || 0
      const lastRejectedAt = data.lastRejectedAt || 0

      setUserStatus(status)
      setAttempts(retryCount)

      if (status === "rejected") {
        if (retryCount >= MAX_RETRY_LIMIT) {
          setAlreadyJoined(true)
          setMessage("❌ Retry limit reached")
          return
        }

        const cooldownMs = REJOIN_COOLDOWN_MINUTES * 60 * 1000
        if (Date.now() - lastRejectedAt < cooldownMs) {
          setAlreadyJoined(true)
          setMessage(`⏳ Wait ${REJOIN_COOLDOWN_MINUTES} minutes`)
          return
        }

        setAlreadyJoined(false)
        setMessage("")
        return
      }

      if (status === "pending" || status === "approved") {
        setAlreadyJoined(true)
        setMessage("")
      }
    })

    return () => unsub()
  }, [selectedTournamentId])

  /* ================= ROOM DETAILS LISTENER (ONLY AFTER APPROVAL) ================= */
  useEffect(() => {
    if (!selectedTournamentId || userStatus !== "approved") return

    const ref = doc(db, "tournaments", selectedTournamentId)

    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) return
      const data = snap.data()
      setRoomId(data.roomId || "")
      setRoomPassword(data.roomPassword || "")
    })

    return () => unsub()
  }, [selectedTournamentId, userStatus])

  /* ================= CLEAN PREVIEW ================= */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  /* ================= CLOUDINARY UPLOAD ================= */
  const uploadToCloudinary = file => {
    setIsUploading(true)
    setUploadProgress(0)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()

      formData.append("file", file)
      formData.append("upload_preset", "99dxxxx")

      xhr.open("POST", "https://api.cloudinary.com/v1_1/dvic2uies/image/upload")

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded * 100) / e.total))
        }
      }

      xhr.onload = () => {
        setIsUploading(false)
        let res
        try {
          res = JSON.parse(xhr.responseText)
        } catch {
          reject()
          return
        }
        res?.secure_url ? resolve(res.secure_url) : reject()
      }

      xhr.onerror = () => {
        setIsUploading(false)
        reject()
      }

      xhr.send(formData)
    })
  }

  /* ================= CONFIRM JOIN ================= */
  const confirmJoin = async () => {
    if (!auth.currentUser) {
      setMessage("⚠️ Please login first")
      return
    }

    if (!ign || !bgmiUid || !paymentScreenshot || !selectedTournamentId) {
      setMessage("⚠️ Fill all details")
      return
    }

    if (alreadyJoined) {
      setMessage("⚠️ Already joined")
      return
    }

    setJoining(true)
    setMessage("")

    try {
      const user = auth.currentUser
      const screenshotUrl = await uploadToCloudinary(paymentScreenshot)

      const playerRef = doc(db, "tournamentPlayers", selectedTournamentId, "players", user.uid)
      const tournamentRef = doc(db, "tournaments", selectedTournamentId)

      await setDoc(
        playerRef,
        {
          ign,
          bgmiUid,
          email: user.email,
          paymentScreenshot: screenshotUrl,
          paymentStatus: "pending",
          joinedAt: Date.now(),
          attempts: userStatus === "rejected" ? attempts + 1 : 1,
          lastRejectedAt: null
        },
        { merge: true }
      )

      if (userStatus !== "pending" && userStatus !== "approved") {
        await updateDoc(tournamentRef, {
          joinedCount: increment(1)
        })
      }

      setShowJoinModal(false)
      setAlreadyJoined(true)
      setIgn("")
      setBgmiUid("")
      setPaymentScreenshot(null)
      setPreviewUrl(null)

    } catch {
      setMessage("❌ Something went wrong")
    }

    setJoining(false)
  }

  return {
    gameId,
    navigate,

    tournaments,
    selectedTournament,
    setSelectedTournament,
    setSelectedTournamentId,

    uploadProgress,
    isUploading,

    paymentScreenshot,
    setPaymentScreenshot,
    previewUrl,
    setPreviewUrl,

    alreadyJoined,
    userStatus,

    roomId,
    roomPassword,

    loading,
    showJoinModal,
    setShowJoinModal,

    joining,
    message,

    ign,
    setIgn,
    bgmiUid,
    setBgmiUid,

    confirmJoin
  }
}
