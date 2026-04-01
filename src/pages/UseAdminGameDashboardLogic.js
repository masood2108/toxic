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
  serverTimestamp,
  query,
  where,
  orderBy,
  getDoc,
  deleteDoc,
  writeBatch,
  increment
} from "firebase/firestore"

/* ================= ADMIN CONFIG ================= */
const ADMIN_EMAILS = [
  "masoodhussainr8@gmail.com",
  "officialtoxicrush.esports@gmail.com"
]

/* ================= HELPERS ================= */
const safeString = v => (typeof v === "string" ? v : "")
const safeNumber = v =>
  typeof v === "number" || typeof v === "string" ? String(v) : ""

const safeStartTime = v => {
  if (!v) return { date: "", time: "" }

  if (typeof v === "object" && v.seconds) {
    const d = new Date(v.seconds * 1000)
    return {
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 5)
    }
  }

  if (typeof v === "string" && v.includes(" ")) {
    const [date, time] = v.split(" ")
    return { date, time }
  }

  return { date: "", time: "" }
}

export default function useAdminGameDashboardLogic() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const gameKey = gameId?.toLowerCase()

  /* ================= BASIC STATS ================= */
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const [reviews] = useState(0)

  /* ================= USERS ================= */
  const [users, setUsers] = useState([])

  /* ================= TOURNAMENT STATE ================= */
  const [tournaments, setTournaments] = useState([])
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [players, setPlayers] = useState([])
  const [activeTab, setActiveTab] = useState("MATCHES")
  const [isEditing, setIsEditing] = useState(false)
  const [zoomImage, setZoomImage] = useState(null)

  /* ================= PUBLISH RESULTS STATE ================= */
  const [matchResults, setMatchResults] = useState([])
  const [resultsProof, setResultsProof] = useState(null)
  const [resultsProofUrl, setResultsProofUrl] = useState("")
  const [isUploadingProof, setIsUploadingProof] = useState(false)

  /* ================= FORM STATE ================= */
  const [matchType, setMatchType] = useState("Tournament")
  const [matchName, setMatchName] = useState("")
  const [gameMode, setGameMode] = useState("SQUAD TPP")
  const [map, setMap] = useState("")
  const [entryFee, setEntryFee] = useState("")
  const [prizePool, setPrizePool] = useState("")
  const [slots, setSlots] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [roomId, setRoomId] = useState("")
  const [roomPassword, setRoomPassword] = useState("")
  /* ================= WITHDRAWALS ================= */
  const [withdrawals, setWithdrawals] = useState([])
  /* 🧾 WITHDRAW HISTORY */
  const [withdrawHistory, setWithdrawHistory] = useState([])

  /* ================= BROADCAST ================= */
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [broadcastType, setBroadcastType] = useState("info")
  const [transactions, setTransactions] = useState([])

  /* ================= ADMIN OVERVIEW STATS ================= */
  const [adminOverview, setAdminOverview] = useState({
    pendingApprovals: 0,
    completedMatches: 0,
    totalJoined: 0
  })

  useEffect(() => {
    if (!gameKey) return

    // 1. Pending Approvals (Across all matches for this game)
    const qPending = query(collectionGroup(db, "players"), where("paymentStatus", "==", "pending"))
    const unsubPending = onSnapshot(qPending, snap => {
      // Filter by gameId in memory if collectionGroup doesn't support nested gameId where
      // (Actually tournament ID contains the gameKey often, e.g. "bgmi_...")
      const myPending = snap.docs.filter(d => d.ref.path.includes(gameKey))
      setAdminOverview(prev => ({ ...prev, pendingApprovals: myPending.length }))
    })

    // 2. Tournament Stats
    const qTournaments = query(collection(db, "tournaments"), where("game", "==", gameKey))
    const unsubTournaments = onSnapshot(qTournaments, snap => {
      let completed = 0
      let joined = 0
      snap.docs.forEach(d => {
        const data = d.data()
        if (data.status === "completed") completed++
        joined += Number(data.joinedCount) || 0
      })
      setAdminOverview(prev => ({
        ...prev,
        completedMatches: completed,
        totalJoined: joined
      }))
    })

    return () => {
      unsubPending()
      unsubTournaments()
    }
  }, [gameKey])

  const updateWithdrawStatus = async (id, status) => {
    await updateDoc(doc(db, "withdrawals", id), {
      status,
      processedAt: Date.now(),
      processedBy: auth.currentUser.email
    })
  }
  /* ================= ANALYTICS ================= */
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalMatches: 0,
    totalDeposits: 0,
    totalPrizes: 0,
    totalWithdrawals: 0, // ✅ ADDED

    totalTransactions: 0,
    netRevenue: 0
  })

  /* ================= WITHDRAWALS ANALYTICS ================= */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "withdrawals"),
      snap => {
        let totalWithdrawals = 0

        snap.docs.forEach(d => {
          const w = d.data()
          if (w.status === "approved") {
            totalWithdrawals += Number(w.amount || 0)
          }
        })

        setAnalytics(prev => ({
          ...prev,
          totalWithdrawals,
          netRevenue:
            prev.totalDeposits -
            prev.totalPrizes -
            totalWithdrawals
        }))
      }
    )

    return () => unsub()
  }, [])

  /* ================= ADMIN WITHDRAWALS (REALTIME) ================= */
  /* ================= WITHDRAWALS (REALTIME + ANALYTICS) ================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "withdrawals"), snap => {
      let totalWithdrawals = 0
      const history = []
      const withdrawalTx = []

      snap.docs.forEach(d => {
        const w = { id: d.id, ...d.data() }
        history.push(w)

        if (w.status === "approved") {
          totalWithdrawals += Number(w.amount || 0)

          // 👇 count withdrawals as transactions
          withdrawalTx.push({
            id: d.id,
            name: w.name || "User",
            amount: Number(w.amount),
            type: "withdrawal",
            status: "completed",
            time: w.processedAt
              ? new Date(w.processedAt).toLocaleString()
              : new Date(w.requestedAt).toLocaleString()
          })
        }
      })

      setWithdrawals(history)
      setWithdrawHistory(history)

      setAnalytics(prev => ({
        ...prev,
        totalWithdrawals,
        netRevenue:
          prev.totalDeposits -
          prev.totalPrizes -
          totalWithdrawals
      }))

      // 👇 merge with deposits
      setTransactions(prev =>
        [...prev.filter(t => t.type === "deposit"), ...withdrawalTx]
      )
    })

    return () => unsub()
  }, [])




  /* ================= AUTH GUARD ================= */
  useEffect(() => {
    if (!auth.currentUser || !ADMIN_EMAILS.includes(auth.currentUser.email)) {
      navigate("/")
    }
  }, [navigate])

  /* ================= USERS LIST ================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTotalUsers(snap.size)
    })
    return unsub
  }, [])

  /* ================= TOURNAMENT LIST (PER GAME) ================= */
  useEffect(() => {
    if (!gameKey) return

    const q = query(
      collection(db, "tournaments"),
      where("game", "==", gameKey),
      orderBy("createdAtClient", "desc")
    )

    return onSnapshot(q, snap => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTotalMatches(snap.size)
    })
  }, [gameKey])

  /* ================= PLAYERS ================= */
  useEffect(() => {
    if (!selectedTournament) {
      setPlayers([])
      return
    }

    const ref = collection(
      db,
      "tournamentPlayers",
      selectedTournament.id,
      "players"
    )

    return onSnapshot(ref, snap => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [selectedTournament])
  useEffect(() => {
    const unsub = onSnapshot(
      collectionGroup(db, "players"),
      async snap => {
        const txs = []

        for (const docSnap of snap.docs) {
          const p = docSnap.data()

          if (p.paymentStatus === "approved") {
            // 🔥 get tournamentId from path
            const tournamentId = docSnap.ref.parent.parent.id

            // 🔥 fetch tournament to get entryFee
            const tournamentSnap = await getDoc(
              doc(db, "tournaments", tournamentId)
            )

            if (!tournamentSnap.exists()) continue

            const tournament = tournamentSnap.data()

            txs.push({
              id: docSnap.id,
              name: p.ign || p.name || "Unknown User",
              email: p.email,
              amount: Number(tournament.entryFee || 0), // ✅ REAL VALUE
              type: "deposit",
              status: "completed",
              time: p.joinedAt
                ? new Date(p.joinedAt).toLocaleString()
                : "Unknown time"
            })
          }
        }

        setTransactions(txs)
      }
    )

    return () => unsub()
  }, [])

  /* ================= REAL ANALYTICS ================= */
  useEffect(() => {
    if (!gameKey) return

    // REAL USERS = unique player emails
    const unsubUsers = onSnapshot(
      collectionGroup(db, "players"),
      snap => {
        const emails = new Set()
        snap.docs.forEach(d => {
          const p = d.data()
          if (p.email) emails.add(p.email)
        })

        setAnalytics(prev => ({
          ...prev,
          totalUsers: emails.size
        }))
      }
    )

    // MATCHES + PRIZES (PER GAME)
    const unsubTournaments = onSnapshot(
      query(
        collection(db, "tournaments"),
        where("game", "==", gameKey)
      ),
      snap => {
        let prizes = 0
        snap.docs.forEach(d => {
          const t = d.data()
          if (t.status === "completed") {
            prizes += Number(t.prize || 0)
          }
        })

        setAnalytics(prev => ({
          ...prev,
          totalMatches: snap.size,
          totalPrizes: prizes
        }))
      }
    )

    // DEPOSITS (REAL ENTRY FEES)
    const unsubPayments = onSnapshot(
      collectionGroup(db, "players"),
      async snap => {
        let deposits = 0
        let tx = 0

        for (const d of snap.docs) {
          const p = d.data()
          if (p.paymentStatus === "approved") {
            const tid = d.ref.parent.parent.id
            const tSnap = await getDoc(doc(db, "tournaments", tid))
            if (tSnap.exists()) {
              deposits += Number(tSnap.data().entryFee || 0)
              tx++
            }
          }
        }

        setAnalytics(prev => ({
          ...prev,
          totalDeposits: deposits,
          totalTransactions: tx + prev.totalWithdrawals > 0 ? 1 : 0
        }))


      }
    )

    return () => {
      unsubUsers()
      unsubTournaments()
      unsubPayments()
    }
  }, [gameKey])

  /* ================= CRUD ================= */
  const selectTournamentForEdit = t => {
    setSelectedTournament(t)
    setIsEditing(true)

    setMatchType(t.matchType || "Tournament")
    setMatchName(safeString(t.matchName))
    setGameMode(safeString(t.gameMode))
    setMap(safeString(t.map))
    setEntryFee(safeNumber(t.entryFee))
    setPrizePool(safeNumber(t.prize))
    setSlots(safeNumber(t.maxPlayers))
    setRoomId(safeString(t.roomId))
    setRoomPassword(safeString(t.roomPassword))

    const { date, time } = safeStartTime(t.startTime)
    setDate(date)
    setTime(time)

    // Pre-load results if they exist, or start empty
    setMatchResults(t.results || [])
  }

  const resetForm = () => {
    setIsEditing(false)
    setSelectedTournament(null)
    setMatchName("")
    setEntryFee("")
    setPrizePool("")
    setSlots("")
    setDate("")
    setTime("")
    setRoomId("")
    setRoomPassword("")
    setMatchResults([])
    setResultsProof(null)
    setResultsProofUrl("")
  }

  const createMatch = async () => {
    const id = `${gameKey}_${Date.now()}`
    await setDoc(doc(db, "tournaments", id), {
      game: gameKey,
      matchType,
      matchName,
      gameMode,
      map,
      entryFee: Number(entryFee),
      prize: Number(prizePool),
      maxPlayers: Number(slots),
      joinedCount: 0,
      status: "open",
      roomId,
      roomPassword,
      startTime: `${date} ${time}`,
      createdAt: serverTimestamp(),
      createdAtClient: Date.now()
    })
    resetForm()
  }
  const updateMatch = async () => {
    const prevRoomId = selectedTournament.roomId
    const prevRoomPass = selectedTournament.roomPassword

    await updateDoc(doc(db, "tournaments", selectedTournament.id), {
      matchType,
      matchName,
      gameMode,
      map,
      entryFee: Number(entryFee),
      prize: Number(prizePool),
      maxPlayers: Number(slots),
      roomId,
      roomPassword,
      startTime: `${date} ${time}`
    })

    // Notify all approved players if Room Details updated
    if ((roomId && roomId !== prevRoomId) || (roomPassword && roomPassword !== prevRoomPass)) {
      players.forEach(p => {
        if (p.paymentStatus === "approved") {
          setDoc(doc(collection(db, "notifications")), {
            userId: p.id,
            title: "🎮 Match Room Details!",
            message: `Room details for ${matchName} are now available! ID: ${roomId}`,
            type: "room_update",
            matchId: selectedTournament.id,
            createdAt: Date.now(),
            read: false
          })
        }
      })
    }

    resetForm()
  }

  const deleteMatch = async (matchId) => {
    const isConfirm = window.confirm("Are you sure you want to PERMANENTLY DELETE this match and all its registrations?")
    if (!isConfirm) return

    try {
      await deleteDoc(doc(db, "tournaments", matchId))
      alert("Match deleted successfully")
      if (selectedTournament?.id === matchId) {
        resetForm()
      }
    } catch (err) {
      console.error("Delete match error:", err)
      alert("Failed to delete match")
    }
  }

  const updateStatus = async (uid, status) => {
    await updateDoc(
      doc(db, "tournamentPlayers", selectedTournament.id, "players", uid),
      { paymentStatus: status }
    )

    // Notify user of status update
    if (status === "approved" || status === "rejected") {
      await setDoc(doc(collection(db, "notifications")), {
        userId: uid,
        title: status === "approved" ? "✅ Registration Approved!" : "❌ Registration Rejected",
        message: status === "approved"
          ? `Your registration for ${selectedTournament.matchName} has been accepted.`
          : `Your registration for ${selectedTournament.matchName} was rejected. Please check requirements.`,
        type: "payment_status",
        matchId: selectedTournament.id,
        createdAt: Date.now(),
        read: false
      })
    }
  }

  const sendBroadcast = async () => {
    await setDoc(doc(collection(db, "broadcasts")), {
      title: broadcastTitle,
      message: broadcastMessage,
      type: broadcastType,
      createdAt: Date.now()
    })
    setBroadcastType("info")
  }

  /* ================= RESULTS MANAGEMENT ================= */
  const addResultRow = () => {
    setMatchResults(prev => [
      ...prev,
      { userId: "", ign: "", rank: "", kills: "", prizeWon: "" }
    ])
  }

  const addPlayerToResults = (p, rank = "") => {
    setMatchResults(prev => {
      // Avoid duplicates
      if (prev.find(r => r.userId === p.id)) return prev

      // Concatenate all team member IGNs for display
      const teamNames = p.players && p.players.length > 0
        ? p.players.map(pl => pl.ign).join(", ")
        : (p.ign || "Unknown Player")

      return [
        ...prev,
        {
          userId: p.id,
          ign: teamNames,
          rank: rank || (prev.length + 1).toString(),
          kills: "0",
          prizeWon: "0"
        }
      ]
    })
  }

  const updateResultRow = (index, field, value) => {
    setMatchResults(prev => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const removeResultRow = index => {
    setMatchResults(prev => prev.filter((_, i) => i !== index))
  }

  const publishResults = async () => {
    if (!selectedTournament) return
    const isConfirm = window.confirm("Are you sure you want to completely publish these results and mark the match completed?")
    if (!isConfirm) return

    const batch = writeBatch(db)
    const tid = selectedTournament.id

    let finalProofUrl = resultsProofUrl
    if (resultsProof) {
      setIsUploadingProof(true)
      try {
        const formData = new FormData()
        formData.append("file", resultsProof)
        formData.append("upload_preset", "99dxxxx")

        const res = await fetch("https://api.cloudinary.com/v1_1/dvic2uies/image/upload", {
          method: "POST",
          body: formData
        }).then(r => r.json())

        if (res.secure_url) {
          finalProofUrl = res.secure_url
          setResultsProofUrl(res.secure_url)
        }
      } catch (err) {
        console.error("Proof upload error:", err)
      }
      setIsUploadingProof(false)
    }

    const results = matchResults.map(r => ({
      userId: r.userId || "",
      ign: r.ign || "Unknown Player",
      rank: Number(r.rank) || 0,
      kills: Number(r.kills) || 0,
      prizeWon: Number(r.prizeWon) || 0
    }))

    // 1. Update tournament doc
    const tournamentRef = doc(db, "tournaments", tid)
    batch.update(tournamentRef, {
      status: "completed",
      results,
      resultsProofUrl: finalProofUrl
    })

    // 2. Credit winners and record transactions
    results.forEach(r => {
      if (r.userId && r.prizeWon > 0) {
        const userRef = doc(db, "users", r.userId)
        const txRef = doc(collection(db, "transactions"))

        // Increment balance
        batch.update(userRef, {
          balance: increment(r.prizeWon)
        })

        // Record transaction
        batch.set(txRef, {
          userId: r.userId,
          userName: r.ign || "Unknown Player",
          amount: r.prizeWon,
          type: "credit",
          category: "match_prize",
          description: `Won ₹${r.prizeWon} in ${selectedTournament.matchName}`,
          matchId: tid,
          timestamp: Date.now()
        })
      }
    })

    try {
      await batch.commit()
      alert("Results published and prizes distributed successfully!")
    } catch (err) {
      console.error("Publish results error:", err)
      alert("Failed to publish results. Please check logs.")
    }

    // Optional: add a broadcast or a subtle notification
    resetForm()
  }

  return {
    totalUsers,
    totalMatches,
    reviews,
    users,
    tournaments,
    selectedTournament,
    selectTournamentForEdit,
    players,
    updateStatus,
    matchType,
    setMatchType,
    matchName,
    setMatchName,
    gameMode,
    setGameMode,
    map,
    setMap,
    entryFee,
    setEntryFee,
    withdrawHistory,

    prizePool,
    setPrizePool,
    slots,
    setSlots,
    transactions,
    withdrawals,
    updateWithdrawStatus,
    date,
    setDate,
    time,
    setTime,
    roomId,
    setRoomId,
    roomPassword,
    setRoomPassword,
    broadcastTitle,
    setBroadcastTitle,
    broadcastMessage,
    setBroadcastMessage,
    broadcastType,
    setBroadcastType,
    sendBroadcast,
    analytics,
    activeTab,
    setActiveTab,
    isEditing,
    createMatch,
    updateMatch,
    deleteMatch,

    // Publish Results
    matchResults,
    resultsProof,
    setResultsProof,
    resultsProofUrl,
    isUploadingProof,
    adminOverview,
    addResultRow,
    addPlayerToResults,
    updateResultRow,
    removeResultRow,
    publishResults,

    resetForm,
    zoomImage,
    setZoomImage,
    gameKey,
    logout: () => auth.signOut().then(() => navigate("/"))
  }
}
