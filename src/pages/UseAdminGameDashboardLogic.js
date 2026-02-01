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
  getDoc
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
const updateWithdrawStatus = async (id, status) => {
  await updateDoc(doc(db, "withdrawals", id), {
    status,
    processedAt: Date.now()
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
    resetForm()
  }

  const updateStatus = async (uid, status) => {
    await updateDoc(
      doc(db, "tournamentPlayers", selectedTournament.id, "players", uid),
      { paymentStatus: status }
    )
  }

  const sendBroadcast = async () => {
    await setDoc(doc(collection(db, "broadcasts")), {
      title: broadcastTitle,
      message: broadcastMessage,
      type: broadcastType,
      createdAt: Date.now()
    })
    setBroadcastTitle("")
    setBroadcastMessage("")
    setBroadcastType("info")
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
    resetForm,
    zoomImage,
    setZoomImage,
    gameKey,
    logout: () => auth.signOut().then(() => navigate("/"))
  }
}
