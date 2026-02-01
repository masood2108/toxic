import { motion } from "framer-motion"

export default function Rules() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-black text-white px-10 py-12"
    >
      {/* TITLE */}
      <h1 className="text-4xl font-bold flex items-center gap-3 mb-10">
        📜 RULES & REGULATIONS
      </h1>

      {/* ===== MATCH RULES ===== */}
      <div className="bg-white/5 rounded-3xl p-8 mb-10 border-l-4 border-red-500">
        <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2 mb-5">
          🎮 MATCH RULES
        </h2>

        <ul className="space-y-3 text-gray-200">
          <li>• Entry fee must be paid before match starts</li>
          <li>• Room ID & password will be shared 10 mins before match</li>
          <li>• Late entries will not be refunded</li>
          <li>• Screenshot proof required for disputes</li>
          <li>• Admin decision is final</li>
        </ul>
      </div>

      {/* ===== WALLET RULES ===== */}
      <div className="bg-white/5 rounded-3xl p-8 mb-10 border-l-4 border-red-500">
        <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2 mb-5">
          💰 WALLET RULES
        </h2>

        <ul className="space-y-3 text-gray-200">
          <li>• Minimum deposit: ₹20</li>
          <li>• Minimum withdrawal: ₹20</li>
          <li>• Withdrawals processed within 24–48 hours</li>
          <li>• UPI only for withdrawals</li>
          <li>• Verify UPI ID before requesting withdrawal</li>
        </ul>
      </div>

      {/* ===== PRIZE DISTRIBUTION ===== */}
      <div className="bg-white/5 rounded-3xl p-8 mb-10 border-l-4 border-red-500">
        <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2 mb-5">
          🏆 PRIZE DISTRIBUTION
        </h2>

        <ul className="space-y-3 text-gray-200">
          <li>• Top 3 winners get prizes</li>
          <li>• Prize money credited within 1 hour after match</li>
          <li>• Must share result screenshot to claim prize</li>
          <li>• Cheating will result in ban & no refund</li>
        </ul>
      </div>

      {/* ===== IMPORTANT ===== */}
      <div className="bg-white/5 rounded-3xl p-8 border-l-4 border-red-500">
        <h2 className="text-2xl font-bold text-red-500 flex items-center gap-2 mb-5">
          ⚠️ IMPORTANT
        </h2>

        <ul className="space-y-3 text-gray-200">
          <li>• No emulator allowed</li>
          <li>• No hacking / modding</li>
          <li>• Be respectful to all players</li>
          <li>• Contact admin for any issues</li>
        </ul>
      </div>

      {/* FOOTER */}
      <div className="mt-14 flex justify-between text-sm text-gray-400">
        <span>Terms & Support</span>
        <span>Privacy Policy</span>
        <span className="italic">Designed with Canva</span>
      </div>
    </motion.div>
  )
}
