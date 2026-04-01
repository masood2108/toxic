import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import AISupportChat from "../components/AISupportChat"

export default function Profile() {

  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  const navigate = useNavigate()

  /* ================= WITHDRAW STATE ================= */
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [upiId, setUpiId] = useState("")
  const [withdrawStatus, setWithdrawStatus] = useState(null)
  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [transactions, setTransactions] = useState([])

  /* ================= PROFILE STATE ================= */
  const [data, setData] = useState(null)
  const [matches, setMatches] = useState([])
  const [editing, setEditing] = useState(false)

  /* ================= AI SUPPORT ================= */
  const [showAI, setShowAI] = useState(false)

  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    bgmiUid: "",
    freeFireUid: ""
  })

  /* ================= REQUEST WITHDRAW ================= */
  const requestWithdraw = async () => {
    if (!withdrawAmount || !upiId) {
      alert("Enter amount and UPI ID")
      return
    }

    const amountNum = Number(withdrawAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Invalid amount")
      return
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid)
        const userSnap = await transaction.get(userRef)

        if (!userSnap.exists()) throw new Error("User not found")
        const currentBalance = Number(userSnap.data().balance || 0)

        if (currentBalance < amountNum) {
          throw new Error("Insufficient balance")
        }

        // 1. Subtract balance
        transaction.update(userRef, {
          balance: currentBalance - amountNum
        })

        // 2. Add withdrawal document
        const withdrawRef = doc(collection(db, "withdrawals"))
        transaction.set(withdrawRef, {
          userId: user.uid,
          name: data.name,
          email: data.email,
          amount: amountNum,
          method: "upi",
          upiId,
          status: "pending",
          requestedAt: Date.now()
        })

        // 3. Add transaction log
        const txRef = doc(collection(db, "transactions"))
        transaction.set(txRef, {
          userId: user.uid,
          userName: data.name,
          amount: -amountNum,
          type: "debit",
          category: "withdraw_request",
          status: "pending",
          timestamp: serverTimestamp(),
          description: `Withdrawal request for ₹${amountNum}`
        })
      })

      setWithdrawAmount("")
      setUpiId("")
      setWithdrawOpen(false)
      alert("Withdrawal request submitted successfully!")
    } catch (err) {
      console.error("Withdraw error:", err)
      alert("Error: " + err)
    }
  }

  /* ================= PAGE TITLE ================= */
  useEffect(() => {
    document.title = data?.name
      ? `ToxicRush • ${data.name}'s Profile`
      : "ToxicRush • Profile"
  }, [data])

  /* ================= REALTIME PROFILE ================= */
  useEffect(() => {
    if (!user) return

    const ref = doc(db, "users", user.uid)

    const unsub = onSnapshot(ref, async snap => {
      // 🔥 USER DOC DOES NOT EXIST → CREATE IT
      if (!snap.exists()) {
        await setDoc(ref, {
          name: user.displayName || "New User",
          email: user.email,
          whatsapp: "",
          bgmiUid: "",
          freeFireUid: "",
          role: "user",
          createdAt: Date.now()
        })
        return
      }

      const d = snap.data()

      setData(d)
      setForm({
        name: d.name || "",
        whatsapp: d.whatsapp || "",
        bgmiUid: d.bgmiUid || "",
        freeFireUid: d.freeFireUid || ""
      })
    })

    return () => unsub()
  }, [user])


  /* ================= WITHDRAW STATUS ================= */
  /* ================= WITHDRAW STATUS + HISTORY ================= */
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "withdrawals"),
      where("userId", "==", user.uid)
    )

    const unsub = onSnapshot(q, snap => {
      const history = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.requestedAt - a.requestedAt)

      setWithdrawHistory(history)

      const pending = history.find(w => w.status === "pending")
      setWithdrawStatus(pending || null)
    })

    return () => unsub()
  }, [user])

  /* ================= TRANSACTION HISTORY ================= */
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    )

    const unsub = onSnapshot(q, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => console.error("Transaction listener error:", err))

    return () => unsub()
  }, [user])

  /* ================= MATCH HISTORY ================= */
  useEffect(() => {
    if (!user) return

    const unsub = onSnapshot(collection(db, "tournaments"), async snap => {
      const result = []

      for (const tDoc of snap.docs) {
        const playerSnap = await getDoc(
          doc(db, "tournamentPlayers", tDoc.id, "players", user.uid)
        )

        if (playerSnap.exists()) {
          result.push({
            id: tDoc.id,
            ...tDoc.data(),
            ...playerSnap.data()
          })
        }
      }

      result.sort((a, b) => b.joinedAt - a.joinedAt)
      setMatches(result)
    })

    return () => unsub()
  }, [user])

  /* ================= SAVE PROFILE ================= */
  /* ================= SAVE PROFILE ================= */
  const saveProfile = async () => {
    await updateDoc(doc(db, "users", user.uid), form)
    setEditing(false)
  }

  /* ✅ ADD THIS HERE */
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading profile...
      </div>
    )
  }

  if (!data) return null


  return (
    <div className="min-h-screen bg-black text-white container-responsive py-8 pb-24">

      {/* ================= PROFILE CARD ================= */}
      <div className="mt-6 md:mt-10 bg-gradient-to-br from-black to-[#120900]
        border border-toxic/40 rounded-3xl p-6 md:p-8 text-center">

        <div className="w-24 h-24 mx-auto rounded-full border-2 border-toxic
          flex items-center justify-center text-3xl">
          👤
        </div>

        <h2 className="mt-4 text-2xl font-bold">{data.name}</h2>
        <p className="text-gray-400 text-sm">{data.email}</p>

        {/* 💳 WALLET BALANCE */}
        <div className="mt-6 inline-block bg-toxic/10 border border-toxic/40 rounded-2xl px-8 py-4">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Wallet Balance</p>
          <h3 className="text-3xl font-orbitron text-toxic">₹{data.balance || 0}</h3>
        </div>
      </div>

      {/* ================= INFO ================= */}
      <div className="mt-8 space-y-4">
        <Info label="WhatsApp" value={data.whatsapp || "Not Set"} />
        <Info label="BGMI UID" value={data.bgmiUid || "Not Set"} />
        <Info label="Free Fire UID" value={data.freeFireUid || "Not Set"} />
      </div>

      {/* ================= WITHDRAW STATUS ================= */}
      {withdrawStatus && (
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500 rounded-xl p-4">
          <p className="text-yellow-400 font-semibold">
            Withdrawal Pending
          </p>
          <p className="text-sm text-gray-300">
            Amount: ₹{withdrawStatus.amount}
          </p>
        </div>
      )}

      {/* ================= MATCH HISTORY ================= */}
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
              className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-base md:text-lg">
                    {m.game?.toUpperCase()} • {m.map}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Status: {m.paymentStatus?.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TRANSACTION HISTORY ================= */}
      <div className="mt-12">
        <h2 className="font-orbitron text-lg mb-4 tracking-widest text-toxic">
          TRANSACTION HISTORY
        </h2>

        {transactions.length === 0 && (
          <p className="text-gray-400 text-sm">
            No transactions yet.
          </p>
        )}

        <div className="space-y-4">
          {transactions.map(t => (
            <div
              key={t.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center hover:border-toxic/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${t.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                  {t.category === 'match_prize' ? '🏆' : t.category === 'withdraw_request' ? '📤' : t.category === 'withdraw_refund' ? '🔄' : '💰'}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-wide uppercase">
                    {(t.category || "Transaction").replace(/_/g, ' ')}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {t.timestamp?.seconds
                      ? new Date(t.timestamp.seconds * 1000).toLocaleString()
                      : new Date(t.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg ${t.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </p>
                {t.status === 'pending' && (
                  <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="mt-10 space-y-4">
        <button
          onClick={() => setEditing(true)}
          className="w-full bg-white text-black py-3 rounded-xl font-bold"
        >
          EDIT PROFILE
        </button>

        <button
          onClick={() => setWithdrawOpen(true)}
          className="w-full bg-green-500 text-black py-3 rounded-xl font-bold"
        >
          💸 WITHDRAW PRIZE MONEY
        </button>

        <button
          onClick={() => setShowAI(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600
                     text-white py-3 rounded-xl font-bold"
        >
          🤖 AI SUPPORT
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

      {/* ================= AI SUPPORT ================= */}
      <AISupportChat open={showAI} onClose={() => setShowAI(false)} />

      {/* ================= WITHDRAW MODAL ================= */}
      {withdrawOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0b0b0b] border border-green-500 rounded-2xl p-6 w-full max-w-md">

            <h2 className="font-orbitron text-lg mb-4">
              WITHDRAW PRIZE
            </h2>

            <input
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="admin-input mb-3"
            />

            <input
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              placeholder="UPI ID (example@upi)"
              className="admin-input mb-3"
            />

            <button
              onClick={requestWithdraw}
              className="w-full bg-green-500 text-black py-3 rounded-xl font-bold"
            >
              REQUEST WITHDRAW
            </button>

            <button
              onClick={() => setWithdrawOpen(false)}
              className="w-full mt-2 text-gray-400"
            >
              Cancel
            </button>

          </div>
        </div>
      )}

      {/* ================= WITHDRAW HISTORY ================= */}
      <div className="mt-12">
        <h2 className="font-orbitron text-lg mb-4 tracking-widest">
          WITHDRAWAL HISTORY
        </h2>

        {withdrawHistory.length === 0 && (
          <p className="text-gray-400 text-sm">
            No withdrawals requested yet.
          </p>
        )}

        <div className="space-y-4">
          {withdrawHistory.map(w => (
            <div
              key={w.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">₹{w.amount}</p>
                  <p className="text-xs text-gray-400">UPI: {w.upiId}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(w.requestedAt).toLocaleString()}
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold
                  ${w.status === "approved"
                    ? "bg-green-500/20 text-green-400"
                    : w.status === "rejected"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {w.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editing && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center px-4">
          <div className="bg-[#0b0b0b] border border-toxic rounded-2xl p-6 w-full max-w-md">

            <h2 className="font-orbitron text-lg mb-4">
              EDIT PROFILE
            </h2>

            {["name", "whatsapp", "bgmiUid", "freeFireUid"].map(key => (
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

const Info = ({ label, value }) => (
  <div className="flex justify-between bg-white/5 rounded-xl p-4">
    <span className="text-gray-400">{label}</span>
    <span className="text-white">{value}</span>
  </div>
)
