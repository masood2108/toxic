import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  updateDoc,
  runTransaction
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

  const [joining, setJoining] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  /* 👥 TEAM PLAYERS (REFACTORED) */
  const [teamPlayers, setTeamPlayers] = useState([])

  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  /* 🆕 ROOM DETAILS (ADDED – NOTHING REMOVED) */
  const [roomId, setRoomId] = useState("")
  const [roomPassword, setRoomPassword] = useState("")
  const [userName, setUserName] = useState("")
  const prevRoomId = useRef("")

  /* ================= REQUEST PERMISSION FOR NOTIFICATIONS ================= */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  /* ================= FETCH USER NAME ================= */
  useEffect(() => {
    if (!auth.currentUser) return
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), snap => {
      if (snap.exists()) setUserName(snap.data().name || "")
    })
    return () => unsub()
  }, [])

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

  /* ================= LEADERBOARD LOGIC ================= */
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "transactions"), (snap) => {
      const userEarnings = {};

      snap.docs.forEach((d) => {
        const tx = d.data();
        if (tx.category === "match_prize") {
          const uid = tx.userId;
          if (uid) {
            if (!userEarnings[uid]) {
              userEarnings[uid] = {
                userId: uid,
                name: tx.userName || tx.ign || "Unknown Player",
                earnings: 0,
              };
            }
            userEarnings[uid].earnings += Number(tx.amount || 0);
          }
        }
      });

      const sorted = Object.values(userEarnings)
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 50);

      setLeaderboard(sorted);
    });

    return () => unsub();
  }, []);

  /* ================= NOTIFICATIONS ================= */
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return () => unsub()
  }, [])

  const markNotificationAsRead = async (notifId) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true })
  }

  /* ================= MY PAST MATCHES ================= */
  const [myPastMatches, setMyPastMatches] = useState([])

  useEffect(() => {
    if (!auth.currentUser || !gameId) return

    const unsub = onSnapshot(
      query(collection(db, "tournaments"), where("game", "==", gameId.toLowerCase()), where("status", "==", "completed")),
      async snap => {
        const result = []
        for (const tDoc of snap.docs) {
          try {
            const playerSnap = await getDoc(
              doc(db, "tournamentPlayers", tDoc.id, "players", auth.currentUser.uid)
            )
            if (playerSnap.exists()) {
              result.push({
                id: tDoc.id,
                ...tDoc.data(),
                ...playerSnap.data()
              })
            }
          } catch (e) {
            console.error("Error fetching past match player data", e)
          }
        }
        result.sort((a, b) => b.createdAtClient - a.createdAtClient)
        setMyPastMatches(result)
      }
    )

    return () => unsub()
  }, [gameId])

  /* ================= USER STATS ================= */
  const [userStats, setUserStats] = useState({ matchesPlayed: 0, totalWinnings: 0 })

  useEffect(() => {
    if (!auth.currentUser || myPastMatches.length === 0) return

    const totalWon = myPastMatches.reduce((acc, m) => {
      const myResult = m.results?.find(r => r.userId === auth.currentUser.uid)
      return acc + (Number(myResult?.prizeWon) || 0)
    }, 0)

    setUserStats({
      matchesPlayed: myPastMatches.length,
      totalWinnings: totalWon
    })
  }, [myPastMatches])

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

      const newRoomId = data.roomId || ""
      const newRoomPassword = data.roomPassword || ""

      // Trigger Alert & Notification when Room ID is revealed for the first time
      if (newRoomId && !prevRoomId.current && newRoomId !== prevRoomId.current) {
        try {
          const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg")
          audio.play().catch(e => console.log("Audio play blocked:", e))

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🎮 Match Room Details Revealed!", {
              body: `Ready up! Room ID: ${newRoomId}\nPassword: ${newRoomPassword}`,
              icon: "/favicon.ico"
            })
          }
        } catch (err) {
          console.error("Alert error:", err)
        }
      }

      prevRoomId.current = newRoomId
      setRoomId(newRoomId)
      setRoomPassword(newRoomPassword)
    })

    return () => unsub()
  }, [selectedTournamentId, userStatus])


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

    // Validate all players have IGN, UID and Screenshot
    const isValid = teamPlayers.every(p => p.ign && p.bgmiUid && p.screenshot)
    if (!isValid || !selectedTournamentId) {
      setMessage("⚠️ Fill all details & upload all screenshots")
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
      const uploadedPlayers = []

      // Upload each screenshot
      for (let i = 0; i < teamPlayers.length; i++) {
        const p = teamPlayers[i]
        const url = await uploadToCloudinary(p.screenshot)
        uploadedPlayers.push({
          ign: p.ign,
          bgmiUid: p.bgmiUid,
          screenshotUrl: url
        })
      }

      await runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, "tournaments", selectedTournamentId)
        const playerRef = doc(db, "tournamentPlayers", selectedTournamentId, "players", user.uid)

        const tournamentDoc = await transaction.get(tournamentRef)
        if (!tournamentDoc.exists()) {
          throw new Error("Tournament does not exist")
        }

        const data = tournamentDoc.data()
        const currentJoined = data.joinedCount || 0
        const maxSlots = data.maxPlayers || 0

        if (currentJoined >= maxSlots) {
          throw new Error("MATCH_FULL")
        }

        // Add team and increment count together
        transaction.set(playerRef, {
          captainEmail: user.email,
          players: uploadedPlayers,
          paymentStatus: "pending",
          joinedAt: Date.now(),
          attempts: userStatus === "rejected" ? attempts + 1 : 1,
          lastRejectedAt: null
        }, { merge: true })

        transaction.update(tournamentRef, {
          joinedCount: currentJoined + uploadedPlayers.length
        })
      })

      setShowJoinModal(false)
      setAlreadyJoined(true)
      setTeamPlayers([])
      setMessage("✅ Team registered! Wait for approval.")

    } catch (err) {
      console.error("Join error:", err)
      if (err.message === "MATCH_FULL") {
        setMessage("❌ Sorry, this match just got full!")
      } else {
        setMessage("❌ Something went wrong")
      }
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

    alreadyJoined,
    userStatus,

    roomId,
    roomPassword,

    loading,
    showJoinModal,
    setShowJoinModal,

    joining,
    message,

    teamPlayers,
    setTeamPlayers,

    confirmJoin,
    leaderboard,
    myPastMatches,
    notifications,
    markNotificationAsRead,
    userStats,
    userName
  }
}
