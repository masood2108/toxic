import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import useLobbyLogic from "../pages/UseLobbyLogic"
import { auth } from "../firebase"
import Profile from "../pages/Profile"

export default function Lobby() {
  const {
    gameId,
    navigate,

    tournaments,
    selectedTournament,
    setSelectedTournament,
    setSelectedTournamentId,

    alreadyJoined,
    userStatus,

    roomId,
    roomPassword,

    loading,
    showJoinModal,
    setShowJoinModal,

    teamPlayers,
    setTeamPlayers,

    confirmJoin,
    joining,
    message,
    leaderboard,
    myPastMatches,
    notifications,
    markNotificationAsRead,
    userStats,
    userName,
    announcements,
    getTimeLeft
  } = useLobbyLogic()

  const [showNotifModal, setShowNotifModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedMatchResults, setSelectedMatchResults] = useState(null)


  const gameTabName = gameId ? gameId.toUpperCase() : "MATCHES"
  const [activeTab, setActiveTab] = useState(gameTabName)

  // Initialize teamPlayers when tournament is selected
  useEffect(() => {
    if (showJoinModal && selectedTournament) {
      const mode = (selectedTournament.gameMode || "").toUpperCase()
      let count = 1
      if (mode.includes("DUO") || mode.includes("2 VS 2")) count = 2
      if (mode.includes("SQUAD") || mode.includes("4 VS 4")) count = 4

      setTeamPlayers(Array.from({ length: count }).map((_, idx) => ({
        ign: "",
        bgmiUid: "",
        ...(idx === 0 ? { screenshot: null, previewUrl: "" } : {})
      })))
    }
  }, [showJoinModal, selectedTournament, setTeamPlayers])

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
      <div className="border-b border-red-500 top-bar">
        <h1 className="text-2xl font-heading font-bold text-red-500 tracking-widest">
          TOXICRUSH
        </h1>

        <div className="flex items-center gap-4">


          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 bg-red-500 rounded-lg font-semibold"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="container-responsive py-8 space-y-10">
        {/* WELCOME */}
        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-lg">
            Welcome,{" "}
            <span className="text-red-500 font-semibold">
              {userName ||
                auth.currentUser?.displayName ||
                auth.currentUser?.email ||
                "Player"}
            </span>
          </p>

          {/* NOTIFICATION BELL */}
          <button
            onClick={() => setShowNotifModal(true)}
            className="relative p-2 bg-black/40 rounded-xl border border-white/10 hover:border-red-500 transition-all group"
          >
            <span className="text-xl">🔔</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-black text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>

        {/* ================= QUICK STATS BAR ================= */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Matches Played</p>
            <p className="text-2xl font-black text-white">{userStats.matchesPlayed}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Winnings</p>
            <p className="text-2xl font-black text-green-500">₹{userStats.totalWinnings}</p>
          </div>
        </div>

        {/* GAME ID */}
        <p className="text-sm tracking-widest text-gray-500">
          {gameId.toUpperCase()} DASHBOARD
        </p>

        {/* ================= NEWS MARQUEE ================= */}
        {announcements.length > 0 && (
          <div className="relative h-10 bg-red-600/10 border-y border-red-500/20 overflow-hidden flex items-center">
            <div className="absolute left-0 top-0 bottom-0 px-3 bg-red-600 text-black text-[10px] font-black z-10 flex items-center uppercase tracking-widest">
              LATEST NEWS
            </div>
            <motion.div
              animate={{ x: [1000, -2000] }}
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              className="whitespace-nowrap text-xs font-bold text-white/80"
            >
              {announcements.map(a => `🔥 ${a.message} • `).join("")}
            </motion.div>
          </div>
        )}

        {/* TABS */}
        <div className="tabs-scroll">
          {[
            { name: gameTabName, icon: "🎮" },
            { name: "LIVE/CLOSED", icon: "🔴" },
            { name: "LEADERBOARD", icon: "🏆" },
            { name: "RULES", icon: "📜" },
            { name: "PROFILE", icon: "👤" }
          ].map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-6 py-3 rounded-xl border flex items-center gap-2 font-heading
                ${activeTab === tab.name
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
                className="bg-white/5 rounded-3xl p-6 md:p-8 border-l-4 border-red-500"
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
          <div className="bg-white/5 rounded-3xl p-5 sm:p-10 text-white shadow-xl">
            <h2 className="text-xl md:text-2xl font-heading font-bold mb-8 text-yellow-500 flex items-center gap-3">
              🏆 TOP EARNERS
            </h2>

            {leaderboard.length === 0 ? (
              <p className="text-gray-400 text-center py-12">No earnings recorded yet. Play and win to get on the board!</p>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((player, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={player.userId}
                    className="flex items-center justify-between p-4 bg-black/60 border border-white/10 rounded-2xl hover:bg-black/80 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`font-black text-xl w-8 text-center ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : index === 1 ? 'text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]' : index === 2 ? 'text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]' : 'text-gray-500'}`}>
                        #{index + 1}
                      </span>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${index === 0 ? 'bg-yellow-500/20 shadow-yellow-500/50' : index === 1 ? 'bg-gray-300/20 shadow-gray-300/50' : index === 2 ? 'bg-amber-600/20 shadow-amber-600/50' : 'bg-white/5'}`}>
                        {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{player.name}</p>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">{player.email ? player.email.replace(/(.{2})(.*)(?=@)/, "$1***") : "Player"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl text-green-400 tracking-wide">₹{player.earnings}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">Total Won</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= GAME MATCHES ================= */}
        {activeTab === gameTabName && (
          <>
            {/* REGISTERED MATCHES */}
            <div className="card-responsive">
              <h2 className="text-xl md:text-2xl font-heading font-semibold mb-6">
                🎮 MY REGISTERED MATCHES
              </h2>

              {alreadyJoined && selectedTournament ? (
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <p className="font-semibold">
                    {selectedTournament.map} • {selectedTournament.gameMode || selectedTournament.type}
                  </p>
                  <p className="text-sm text-yellow-400 mt-1">
                    Status: {userStatus?.toUpperCase()}
                  </p>

                  {selectedTournament.status === "completed" && (
                    <button
                      onClick={() => {
                        setSelectedMatchResults(selectedTournament)
                        setShowResultsModal(true)
                      }}
                      className="mt-4 w-full py-2 bg-green-500 text-black rounded-lg font-black text-xs uppercase tracking-widest"
                    >
                      🏆 VIEW MATCH RESULTS
                    </button>
                  )}

                  {userStatus === "approved" && (
                    <div className="mt-4 bg-black/50 border border-green-500/30 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-green-400 font-semibold">🎮 Room Details</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`ID: ${roomId} Pass: ${roomPassword}`)
                              alert("Copied Room Details!")
                            }}
                            className="bg-green-500/10 text-green-500 text-[10px] px-2 py-1 rounded border border-green-500/30 hover:bg-green-500 hover:text-black transition-all font-bold"
                          >
                            COPY ALL
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-white mt-1 flex justify-between">
                        <span>Room ID: <span className="font-mono text-green-400">{roomId}</span></span>
                      </p>
                      <p className="text-sm text-white flex justify-between">
                        <span>Password: <span className="font-mono text-green-400">{roomPassword}</span></span>
                      </p>
                      <p className="text-xs text-gray-400 mt-2">Use these details to enter the game</p>
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
            <div className="bg-white/5 rounded-3xl p-5 md:p-10">
              <h2 className="text-xl md:text-2xl font-heading font-semibold mb-6">
                🔥 AVAILABLE MATCHES
              </h2>

              {tournaments.map(t => {
                const progress = Math.round(
                  (t.joinedCount / t.maxPlayers) * 100
                )

                const isSelected = selectedTournament?.id === t.id
                const isJoined = alreadyJoined && isSelected
                const isClosed = t.status !== "open"
                const timeLeft = getTimeLeft(t.startTimeClient)
                const mapImg =
                  t.map?.toUpperCase().includes("ERANGEL") ? "https://imgs.search.brave.com/FxC6yJ3MP-Sl1sOQkkH1dsrYXZJOldMUuBnrp2XeTHA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93MC5wZWFrcHguY29tL3dhbGxwYXBlci8xMi8zOTQvSEQtd2FsbHBhcGVyLWJhdHRsZWdyb3VuZHMtZXJhbmdlbC1tYXAtcHViZy5qcGc" :
                    t.map?.toUpperCase().includes("MIRAMAR") ? "https://imgs.search.brave.com/wlBk5iUtfXZVLBdbJ8TPjgNi7bjWqEKRpJ4FlgTXHlM/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxscGFwZXJhY2Nlc3MuY29tL2Z1bGwvOTI1MDMwMC5qcGc" :
                      t.map?.toUpperCase().includes("SANHOK") ? "https://imgs.search.brave.com/oAJpuSfA0aNKFgec7DUEl51MgPLXqcwApxisvVZy4mk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxscGFwZXJjYXZlLmNvbS93cC93cDM3MDI2NzMuanBn" :
                        t.map?.toUpperCase().includes("VIKENDI") ? "https://imgs.search.brave.com/FjmMtihEEhqomoDasFOLkRBQmwWPXYKt1tYu-3ywykY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxscGFwZXJjYXZlLmNvbS93cC93cDM4NzE3NDguanBn" :
                          t.map?.toUpperCase().includes("LIVIK") ? "https://imgs.search.brave.com/N7ygKDVyjLjTUmXZpZrhfmcAsZQ8yL2GYDSOHB4eqic/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly93YWxscGFwZXJhY2Nlc3MuY29tL2Z1bGwvOTM3NTE5NS5qcGc" :
                            "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800"

                return (
                  <motion.div
                    key={t.id}
                    whileHover={{ scale: 1.01 }}
                    className="relative overflow-hidden border rounded-3xl p-6 mb-6 transition-all group"
                  >
                    {/* MAP BACKGROUND IMAGE */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={mapImg}
                        alt="map"
                        className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:opacity-30 transition-all duration-700"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br from-black via-black/80 to-transparent ${t.map?.toUpperCase().includes("ERANGEL") ? "to-emerald-900/50" :
                        t.map?.toUpperCase().includes("MIRAMAR") ? "to-amber-900/50" :
                          "to-red-900/50"
                        }`} />
                    </div>

                    <div className="relative z-10">
                      {/* STATUS BADGE */}
                      <div className="absolute top-4 right-4">
                        {isClosed ? (
                          <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">CLOSED</span>
                        ) : progress >= 90 ? (
                          <span className="bg-red-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">FILLING FAST!</span>
                        ) : (
                          <span className="bg-green-500/20 text-green-500 border border-green-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">OPEN</span>
                        )}
                      </div>

                      <div className="flex justify-between items-start">
                        <h3 className="font-heading text-xl tracking-wide group-hover:text-red-500 transition-colors">
                          {t.map} • {t.gameMode || t.type}
                        </h3>
                        {!isClosed && timeLeft && (
                          <div className="text-right">
                            <p className="text-[9px] uppercase font-black text-gray-500 tracking-widest">Starts In</p>
                            <p className="text-sm font-black text-white">{timeLeft}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-6 mt-2">
                        <p className="text-xs text-gray-400 flex flex-col">
                          <span className="text-[9px] uppercase font-black text-gray-600">Entry Fee</span>
                          <span className="text-white font-bold">₹{t.entryFee}</span>
                        </p>
                        <p className="text-xs text-gray-400 flex flex-col">
                          <span className="text-[9px] uppercase font-black text-gray-600">Prize Pool</span>
                          <span className="text-green-400 font-bold">₹{t.prize}</span>
                        </p>
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2">
                            SLOTS: <span className="text-white">{t.joinedCount} / {t.maxPlayers}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold">{progress}% FULL</p>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full transition-all duration-1000 ${progress >= 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-red-600'}`}
                          />
                        </div>
                      </div>

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
                        ${isJoined
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
                    </div>{/* end relative z-10 */}
                  </motion.div>
                )
              })}
            </div>

            {/* MY PAST MATCHES */}
            {myPastMatches.length > 0 && (
              <div className="bg-white/5 rounded-3xl p-10 mt-10">
                <h2 className="text-2xl font-heading font-semibold mb-6 flex items-center gap-2">
                  📜 MY PAST MATCHES
                </h2>

                <div className="space-y-4">
                  {myPastMatches.map(m => {
                    const myResult = m.results?.find(r => r.userId === auth.currentUser?.uid)

                    return (
                      <div
                        key={m.id}
                        className="bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div>
                          <h3 className="font-semibold text-base md:text-lg text-gray-300">
                            {m.map} • {m.gameMode || m.matchType || m.type || "Tournament"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Prize Pool: <span className="text-gray-300">₹{m.prize}</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-2">
                            Join Status: {m.paymentStatus?.toUpperCase() || "UNKNOWN"}
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          {myResult ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-lg text-right">
                              <p className="text-yellow-400 font-bold text-lg">Rank #{myResult.rank}</p>
                              <p className="text-xs text-gray-300 mb-1">Kills: {myResult.kills}</p>
                              <p className="text-sm font-bold text-green-400">Won: ₹{myResult.prizeWon}</p>
                            </div>
                          ) : (
                            <span className="bg-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm font-semibold">
                              COMPLETED
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
              className="bg-black w-full max-w-md max-h-[90vh] rounded-2xl border border-white/10 overflow-hidden flex flex-col"
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
              <div className="p-6 space-y-5 flex-1 overflow-y-auto">

                {/* PAYMENT QR */}
                {selectedTournament?.entryFee > 0 && (
                  <div className="bg-white rounded-xl p-4 flex flex-col items-center">
                    <p className="text-black text-sm font-semibold mb-2">
                      Pay Entry Fee (₹{selectedTournament.entryFee})
                    </p>

                    <img
                      src="/qr.jpeg"
                      alt="Payment QR"
                      className="w-28 h-28 object-contain"
                    />

                    <p className="text-xs text-gray-600 mt-2 text-center pb-2">
                      Scan & complete payment, then upload screenshot
                    </p>
                  </div>
                )}

                {/* TEAM PLAYERS FIELDS */}
                <div className="space-y-10 overflow-y-auto pr-2 custom-scrollbar pt-4 flex-1">
                  {teamPlayers.map((p, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl relative mt-4">
                      <div className="absolute -top-3 left-4 bg-red-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        Player {i + 1} {i === 0 ? "(Captain)" : ""}
                      </div>

                      <div className="space-y-4 mt-2">
                        {/* IGN */}
                        <input
                          value={p.ign}
                          onChange={e => {
                            const newPlayers = [...teamPlayers]
                            newPlayers[i].ign = e.target.value
                            setTeamPlayers(newPlayers)
                          }}
                          placeholder="In-Game Name (IGN)"
                          className="w-full px-4 py-2 rounded-lg bg-black border border-white/20
                               text-white outline-none focus:border-red-500 text-sm"
                        />

                        {/* UID */}
                        <input
                          value={p.bgmiUid}
                          onChange={e => {
                            const newPlayers = [...teamPlayers]
                            newPlayers[i].bgmiUid = e.target.value
                            setTeamPlayers(newPlayers)
                          }}
                          placeholder="Game UID"
                          className="w-full px-4 py-2 rounded-lg bg-black border border-white/20
                               text-white outline-none focus:border-red-500 text-sm"
                        />

                      </div>
                    </div>
                  ))}
                </div>

                {/* PAYMENT SCREENSHOT — separate section after all players */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl relative mt-6">
                  <div className="absolute -top-3 left-4 bg-yellow-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    💳 Payment Proof
                  </div>
                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block ml-1">
                      Upload Payment Screenshot
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files[0]
                        if (!file) return
                        const newPlayers = [...teamPlayers]
                        newPlayers[0].screenshot = file
                        newPlayers[0].previewUrl = URL.createObjectURL(file)
                        setTeamPlayers(newPlayers)
                      }}
                      className="w-full text-[10px] text-gray-400
                           file:bg-white/10 file:text-white
                           file:px-3 file:py-1
                           file:rounded-md file:border-0
                           cursor-pointer"
                    />
                    {teamPlayers[0]?.previewUrl && (
                      <img
                        src={teamPlayers[0].previewUrl}
                        alt="Payment Preview"
                        className="rounded-lg h-24 w-full object-cover border border-white/10 mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* ERROR / MESSAGE */}
                {message && (
                  <p className="text-center text-sm font-bold text-red-500 bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                    {message}
                  </p>
                )}

                {/* ACTION BUTTONS */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={confirmJoin}
                    disabled={joining}
                    className="w-full py-4 rounded-xl bg-red-500 text-black
                         font-black uppercase tracking-widest text-sm
                         shadow-[0_0_20px_rgba(239,68,68,0.3)]
                         disabled:opacity-40"
                  >
                    {joining ? "UPLOADING ALL DETAILS..." : "CONFIRM TEAM REGISTRATION"}
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
        {/* ================= NOTIFICATION MODAL ================= */}
        {showNotifModal && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center px-4">
            <div className="bg-[#0b0b0b] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col shadow-[0_0_50px_rgba(255,255,255,0.05)]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-heading text-lg tracking-widest text-red-500">NOTIFICATIONS</h2>
                <button onClick={() => setShowNotifModal(false)} className="text-gray-400 text-xl font-light">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-10 italic">No notifications yet</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${n.read ? 'bg-white/5 border-white/10 opacity-60' : 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-white">{n.title}</h4>
                        {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                      <p className="text-[9px] text-gray-600 mt-2 uppercase tracking-widest font-bold">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MATCH RESULTS MODAL ================= */}
        {showResultsModal && selectedMatchResults && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center px-4">
            <div className="bg-[#0b0b0b] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.1)]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-green-500/10 to-transparent">
                <div>
                  <h2 className="font-heading text-lg tracking-widest text-green-500 uppercase">🏆 {selectedMatchResults.map} RESULTS</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-1">{selectedMatchResults.gameMode}</p>
                </div>
                <button onClick={() => setShowResultsModal(false)} className="bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-all">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* PROOF SCREENSHOT */}
                {selectedMatchResults.resultsProofUrl ? (
                  <div className="space-y-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center gap-2">
                      <span className="w-4 h-[1px] bg-gray-500"></span> MATCH PROOF SCREENSHOT
                    </p>
                    <a href={selectedMatchResults.resultsProofUrl} target="_blank" rel="noreferrer" className="block relative group rounded-2xl overflow-hidden border border-white/10">
                      <img src={selectedMatchResults.resultsProofUrl} alt="Results Proof" className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest">View Full Size 🔍</span>
                      </div>
                    </a>
                  </div>
                ) : (
                  <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center">
                    <p className="text-gray-500 italic text-sm">No official proof image uploaded yet.</p>
                  </div>
                )}

                {/* WINNERS TABLE */}
                <div className="space-y-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-gray-500"></span> STANDINGS & WINNINGS
                  </p>
                  <div className="grid gap-3">
                    {(selectedMatchResults.results || []).map((res, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${res.userId === auth.currentUser?.uid ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`font-black text-xl w-8 text-center ${res.rank === 1 ? 'text-yellow-400' : res.rank === 2 ? 'text-gray-300' : res.rank === 3 ? 'text-amber-600' : 'text-gray-500'}`}>
                            #{res.rank}
                          </span>
                          <div>
                            <p className="font-bold text-white tracking-wide">{res.ign}</p>
                            <div className="flex gap-3 text-[10px] mt-1 font-black">
                              <span className="text-red-500 uppercase">KILLS: {res.kills}</span>
                              <span className="text-green-500 uppercase">WON: ₹{res.prizeWon}</span>
                            </div>
                          </div>
                        </div>
                        {res.rank === 1 && <span className="text-2xl animate-bounce">👑</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </AnimatePresence>

    </motion.div>
  )
}
