import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import useLobbyLogic from "../pages/UseLobbyLogic"
import { auth } from "../firebase"
import Profile from "../pages/Profile"
import useNotifications from "../hooks/Usenotifications"

export default function Lobby() {
  const {
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
} = useLobbyLogic()


  const [activeTab, setActiveTab] = useState("BGMI")
const {
  notifications,
  unreadCount,
  clearNotifications
} = useNotifications()

const [showNotifications, setShowNotifications] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        LOADING...
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white"
    >
      {/* ================= TOP BAR ================= */}
<div className="px-10 py-6 border-b border-red-500 top-bar">
        <h1 className="text-2xl font-heading font-bold text-red-500 tracking-widest">
          TOXICRUSH
        </h1>

        <div className="flex items-center gap-4">
          <div className="relative">
  <button
    onClick={() => setShowNotifications(p => !p)}
    className="relative border border-white/20 rounded-lg p-2"
  >
    🔔
    {unreadCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-1 rounded-full">
        {unreadCount}
      </span>
    )}
  </button>

  {/* DROPDOWN */}
  {showNotifications && (
    <div className="absolute right-0 mt-3 w-80 bg-black border border-white/10 rounded-xl shadow-lg z-50">
      <div className="px-4 py-3 border-b border-white/10 flex justify-between">
        <span className="font-semibold">Notifications</span>
        <button
          onClick={clearNotifications}
          className="text-xs text-gray-400 hover:text-white"
        >
          Clear
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {notifications.length === 0 && (
          <p className="text-center text-gray-400 py-6">
            No notifications
          </p>
        )}

        {notifications.map(n => (
          <div
            key={n.id}
            className="px-4 py-3 border-b border-white/5 text-sm"
          >
            <p
              className={
                n.type === "approved"
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {n.message}
            </p>
            <span className="text-xs text-gray-500">
              {n.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )}
</div>


          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-red-500 rounded-lg font-semibold"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
<div className="page space-y-10">
        {/* WELCOME */}
        <p className="text-lg">
          Welcome,{" "}
          <span className="text-red-500 font-semibold">
            {auth.currentUser?.displayName ||
              auth.currentUser?.email ||
              "Player"}
          </span>
        </p>

        {/* GAME ID */}
        <p className="text-sm tracking-widest text-gray-500">
          {gameId.toUpperCase()} DASHBOARD
        </p>

        {/* TABS */}
<div className="tabs">
          {[
            { name: "BGMI", icon: "🎮" },
            { name: "LEADERBOARD", icon: "🏆" },
            { name: "RULES", icon: "📜" },
            { name: "PROFILE", icon: "👤" }
          ].map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-6 py-3 rounded-xl border flex items-center gap-2 font-heading
                ${
                  activeTab === tab.name
                    ? "bg-red-500 text-black"
                    : "border-white/20 text-gray-400"
                }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        {/* ================= RULES ================= */}
        {activeTab === "RULES" && (
          <div className="space-y-8">
            {[
              {
                title: "🎮 MATCH RULES",
                items: [
                  "Entry fee must be paid before match starts",
                  "Room ID & password shared 10 mins before match",
                  "Late entries will not be refunded",
                  "Screenshot proof required",
                  "Admin decision is final"
                ]
              },
              {
                title: "💰 WALLET RULES",
                items: [
                  "Minimum deposit: ₹20",
                  "Minimum withdrawal: ₹20",
                  "Withdrawals in 24–48 hours",
                  "UPI only",
                  "Verify UPI ID before withdrawal"
                ]
              },
              {
                title: "🏆 PRIZE DISTRIBUTION",
                items: [
                  "Top 3 winners get prizes",
                  "Prize credited within 1 hour",
                  "Screenshot required",
                  "Cheating = ban + no refund"
                ]
              },
              {
                title: "⚠️ IMPORTANT",
                items: [
                  "No emulator allowed",
                  "No hacking / modding",
                  "Respect all players",
                  "Contact admin for issues"
                ]
              }
            ].map(section => (
              <div
                key={section.title}
                className="bg-white/5 rounded-3xl p-8 border-l-4 border-red-500"
              >
                <h2 className="text-2xl font-heading font-bold text-red-500 mb-4">
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.items.map(i => (
                    <li key={i}>• {i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* ================= PROFILE ================= */}
        {activeTab === "PROFILE" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Profile />
          </motion.div>
        )}

        {/* ================= LEADERBOARD ================= */}
        {activeTab === "LEADERBOARD" && (
          <div className="bg-white/5 rounded-3xl p-10 text-center text-gray-400">
            🏆 Leaderboard coming soon
          </div>
        )}

        {/* ================= BGMI ================= */}
        {activeTab === "BGMI" && (
          <>
            {/* REGISTERED MATCHES */}
<div className="bg-white/5 card section">
              <h2 className="text-2xl font-heading font-semibold mb-6">
                🎮 MY REGISTERED MATCHES
              </h2>

              {alreadyJoined && selectedTournament ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <p className="font-semibold">
                    {selectedTournament.map} • {selectedTournament.type}
                  </p>
                  <p className="text-sm text-yellow-400 mt-1">
  Status: {userStatus?.toUpperCase()}
</p>

{userStatus === "approved" && (
  <div className="mt-4 bg-black/50 border border-green-500/30 rounded-lg p-3">
    <p className="text-sm text-green-400 font-semibold">
      🎮 Room Details
    </p>
    <p className="text-sm text-white mt-1">
      Room ID: <span className="font-mono">{roomId}</span>
    </p>
    <p className="text-sm text-white">
      Password: <span className="font-mono">{roomPassword}</span>
    </p>
    <p className="text-xs text-gray-400 mt-2">
      Use these details to enter the game
    </p>
  </div>
)}

                </div>
              ) : (
                <p className="text-gray-400 text-center">
                  No registered matches yet.
                </p>
              )}
            </div>

            {/* AVAILABLE MATCHES */}
            <div className="bg-white/5 rounded-3xl p-10">
              <h2 className="text-2xl font-heading font-semibold mb-6">
                🔥 AVAILABLE MATCHES
              </h2>

              {tournaments.map(t => {
                const progress = Math.round(
                  (t.joinedCount / t.maxPlayers) * 100
                )

                const isSelected = selectedTournament?.id === t.id
                const isJoined = alreadyJoined && isSelected
                const isClosed = t.status !== "open"

                return (
                  <motion.div
                    key={t.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-black/40 border border-white/10 rounded-2xl p-6 mb-6"
                  >
                    <h3 className="font-semibold text-lg">
                      {t.map} • {t.type}
                    </h3>

                    <p className="text-sm text-gray-400 mt-1">
                      Entry: ₹{t.entryFee} • Prize: ₹{t.prize}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      Players Joined: {t.joinedCount}/{t.maxPlayers}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Match Status:{" "}
                      <span className="text-white">
                        {t.status?.toUpperCase()}
                      </span>
                    </p>

                    {userStatus && isSelected && (
                      <p className="text-xs text-yellow-400 mt-2">
                        Your Status: {userStatus.toUpperCase()}
                      </p>
                    )}

                    <div className="h-2 bg-gray-800 rounded mt-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-red-500"
                      />
                    </div>

                    <button
                      onClick={() => {
  setSelectedTournament(t)
  setSelectedTournamentId(t.id)
  setShowJoinModal(true)
}}

                      disabled={isJoined || isClosed}
                      className={`mt-4 px-6 py-2 rounded-lg
                        ${
                          isJoined
                            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                            : isClosed
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-red-500 text-black"
                        }`}
                    >
                      {isJoined
                        ? "JOINED"
                        : isClosed
                        ? "ENTRY CLOSED"
                        : "JOIN"}
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ================= JOIN MODAL ================= */}
     <AnimatePresence>
  {showJoinModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 px-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="bg-black w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-heading text-lg tracking-widest">
            JOIN MATCH
          </h2>

          <button
            onClick={() => setShowJoinModal(false)}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5">

          {/* PAYMENT QR */}
          <div className="bg-white rounded-xl p-4 flex flex-col items-center">
            <p className="text-black text-sm font-semibold mb-2">
              Pay Entry Fee
            </p>

            <img
              src="/qr.png"
              alt="Payment QR"
              className="w-40 h-40 object-contain"
            />

            <p className="text-xs text-gray-600 mt-2 text-center">
              Scan & complete payment, then upload screenshot
            </p>
          </div>

          {/* IGN */}
          <input
            value={ign}
            onChange={e => setIgn(e.target.value)}
            placeholder="In-Game Name (IGN)"
            className="w-full px-4 py-2 rounded-lg bg-black border border-white/20
                       text-white outline-none focus:border-red-500"
          />

          {/* BGMI UID */}
          <input
            value={bgmiUid}
            onChange={e => setBgmiUid(e.target.value)}
            placeholder="BGMI UID"
            className="w-full px-4 py-2 rounded-lg bg-black border border-white/20
                       text-white outline-none focus:border-red-500"
          />

          {/* SCREENSHOT UPLOAD */}
          <input
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files[0]
              if (!file) return
              setPaymentScreenshot(file)
              setPreviewUrl(URL.createObjectURL(file))
            }}
            className="w-full text-sm text-gray-300
                       file:bg-red-500 file:text-black
                       file:px-4 file:py-2
                       file:rounded-lg file:border-0
                       cursor-pointer"
          />

          {/* PREVIEW */}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Payment Preview"
              className="rounded-lg max-h-52 mx-auto"
            />
          )}

          {/* UPLOAD PROGRESS */}
          {isUploading && (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Uploading… {uploadProgress}%
              </p>
              <div className="h-1 bg-gray-700 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-red-500"
                />
              </div>
            </div>
          )}

          {/* ERROR / MESSAGE */}
          {message && (
            <p className="text-center text-sm text-red-400">
              {message}
            </p>
          )}

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-2">
            <button
              onClick={confirmJoin}
              disabled={joining || !paymentScreenshot}
              className="w-full py-3 rounded-xl bg-red-500 text-black
                         font-heading tracking-widest
                         disabled:opacity-40"
            >
              {joining ? "PROCESSING..." : "CONFIRM JOIN"}
            </button>

            <button
              onClick={() => setShowJoinModal(false)}
              className="w-full py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

    </motion.div>
  )
}
