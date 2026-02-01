import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

/* ================= CUSTOM AI ANSWERS ================= */
const AI_ANSWERS = {
  withdrawals: `💰 WITHDRAWALS HELP

• Minimum withdrawal: ₹20
• Processing time: 24–48 hours
• Only UPI supported
• Ensure WhatsApp number is correct
• Contact admin if delayed

⚠️ Fake activity = permanent ban`,

  deposits: `💳 DEPOSITS HELP

• Pay using the QR shown in match join
• Upload CLEAR payment screenshot
• Edited / fake screenshots are rejected
• Entry fee is non-refundable
• One payment = one match entry`,

  matches: `🎮 MATCHES HELP

• Join before slots are full
• Status flow: PENDING → APPROVED
• Room ID & Password visible ONLY after approval
• No emulator / hacks allowed
• Late entry = disqualification`,

  prizes: `🏆 PRIZES HELP

• Prize credited within 1 hour after match
• Screenshot proof required
• Cheating = prize cancelled
• Prize amount shown before joining`,

  rules: `📜 RULES SUMMARY

• No hacking / modding
• No emulator
• Respect all players
• Multiple accounts = ban
• Admin decision is final`
}

export default function AISupportChat({ open, onClose }) {
  const [chat, setChat] = useState([
    {
      from: "ai",
      text:
        "👋 Hi! I'm your AI support assistant.\n\n" +
        "I can help with:\n" +
        "💰 Withdrawals\n" +
        "💳 Deposits\n" +
        "🎮 Matches\n" +
        "🏆 Prizes\n" +
        "📜 Rules\n\n" +
        "What do you need help with?"
    }
  ])

  const [input, setInput] = useState("")
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat])

  const sendUserMessage = text => {
    if (!text.trim()) return

    const key = text.toLowerCase()

    setChat(prev => [
      ...prev,
      { from: "user", text },
      {
        from: "ai",
        text:
          AI_ANSWERS[key] ||
          "🤖 Please choose one of these:\nWithdrawals, Deposits, Matches, Prizes, Rules"
      }
    ])

    setInput("")
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 30 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-xl h-[80vh]
                       rounded-3xl
                       bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700
                       shadow-2xl
                       flex flex-col"   /* 🔑 IMPORTANT */
          >

            {/* HEADER */}
            <div className="flex justify-between items-center px-6 py-4
                            border-b border-white/20 shrink-0">
              <h2 className="text-white font-bold tracking-widest flex items-center gap-2">
                🤖 AI SUPPORT CHAT
              </h2>
              <button
                onClick={onClose}
                className="text-white text-2xl hover:scale-110 transition"
              >
                ✕
              </button>
            </div>

            {/* CHAT BODY (SCROLLS) */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4
                         scrollbar-thin scrollbar-thumb-white/30"
            >
              {chat.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] px-4 py-3 rounded-2xl whitespace-pre-line text-sm
                    ${
                      m.from === "ai"
                        ? "bg-white/20 text-white border border-white/20"
                        : "bg-gradient-to-r from-orange-400 to-red-500 text-black ml-auto"
                    }`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* QUICK ACTIONS */}
            <div className="px-5 py-3 grid grid-cols-2 gap-3
                            border-t border-white/20 shrink-0">
              {["Withdrawals", "Deposits", "Matches", "Prizes", "Rules"].map(b => (
                <button
                  key={b}
                  onClick={() => sendUserMessage(b)}
                  className="bg-black/30 text-white border border-white/30
                             hover:bg-white/20 transition
                             py-2 rounded-xl text-sm"
                >
                  {b}
                </button>
              ))}
            </div>

            {/* INPUT */}
            <div className="px-4 py-3 flex gap-3
                            border-t border-white/20 shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-black/40 text-white px-4 py-3
                           rounded-xl outline-none placeholder:text-gray-300"
              />
              <button
                onClick={() => sendUserMessage(input)}
                className="px-6 py-3 rounded-xl font-bold
                           bg-gradient-to-r from-orange-400 to-red-500
                           text-black"
              >
                SEND
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
