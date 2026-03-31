import { useEffect } from "react"
import useAdminGameDashboardLogic from "./UseAdminGameDashboardLogic"

/* ================= CONSTANTS ================= */
const GAME_MODES = [
  "SOLO TPP",
  "SOLO FPP",
  "DUO TPP",
  "DUO FPP",
  "SQUAD TPP",
  "SQUAD FPP"
]

const MAPS_BY_GAME = {
  bgmi: ["Erangel", "Miramar", "Sanhok", "Vikendi", "Livik", "Nusa"],
  freefire: [
    "Bermuda",
    "Bermuda Remastered",
    "Purgatory",
    "Kalahari",
    "Alpine",
    "NeXTerra"
  ]
}

export default function AdminGameDashboard() {
  const d = useAdminGameDashboardLogic()

  useEffect(() => {
    if (!d.gameKey) return
  }, [d.gameKey])

  // ✅ ADDED SAFETY (does NOT remove anything)
  const usersSafe = d.users || []

  return (
    <div className="min-h-screen bg-black text-white page-container">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-10">
        <h1 className="text-3xl font-bold tracking-wide text-red-500">
          {d.gameKey?.toUpperCase()} ADMIN PANEL
        </h1>

        <button
          onClick={d.logout}
          className="px-6 py-2 bg-red-500 rounded-lg text-black font-bold"
        >
          LOGOUT
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        <Stat title="Total Users" value={d.totalUsers} color="text-red-400" />
        <Stat title="Total Matches" value={d.totalMatches} color="text-purple-400" />
        <Stat title="Reviews" value={d.reviews} color="text-green-400" />
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
        {[
          "MATCHES",
          "USERS",
          "TRANSACTIONS",
          "BROADCAST",
          "REVIEWS",
          "ANALYTICS"
        ].map(tab => (
          <button
            key={tab}
            onClick={() => d.setActiveTab(tab)}
            className={`px-6 py-2 rounded-xl font-semibold border transition
              ${d.activeTab === tab
                ? "bg-red-500 text-black border-red-500"
                : "border-white/20 text-white hover:border-red-500/40"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================= USERS ================= */}
      {d.activeTab === "USERS" && (
        <>
          <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
            👥 USER MANAGEMENT
          </h2>

          {usersSafe.length === 0 && (
            <p className="text-gray-400 text-center">
              No users found
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {usersSafe.map(u => (
              <div
                key={u.id}
                className="rounded-2xl border border-red-500/30 bg-black/60 p-6
                     hover:border-red-500 transition-all"
              >
                <p className="text-2xl font-bold text-red-400 mb-2">
                  {u.name || "Unnamed User"}
                </p>

                {u.username && (
                  <p className="text-gray-300 mb-2">
                    @{u.username}
                  </p>
                )}

                <p className="text-sm text-gray-400 mb-1">
                  📧 {u.email}
                </p>

                {u.phone && (
                  <p className="text-sm text-gray-400 mb-1">
                    📱 {u.phone}
                  </p>
                )}


              </div>
            ))}
          </div>
        </>
      )}


      {/* ================= MATCHES ================= */}
      {d.activeTab === "MATCHES" && (
        <>
          <h2 className="text-2xl font-bold mb-6">
            {d.isEditing ? "✏️ EDIT MATCH" : "➕ CREATE MATCH"}
          </h2>

          {/* ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-8">
            <Select label="Match Type" value={d.matchType} onChange={d.setMatchType}
              options={["Tournament", "Classic"]} />

            <Input label="Match Name" value={d.matchName} onChange={d.setMatchName} />

            <Select label="Game Mode" value={d.gameMode} onChange={d.setGameMode}
              options={GAME_MODES} />

            <Select label="Map" value={d.map} onChange={d.setMap}
              options={MAPS_BY_GAME[d.gameKey] || []} />

            <Input label="Entry Fee" value={d.entryFee} onChange={d.setEntryFee} />
          </div>

          {/* ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 md:gap-8">
            <Input label="Prize Pool" value={d.prizePool} onChange={d.setPrizePool} />
            <Input label="Total Slots" value={d.slots} onChange={d.setSlots} />
            <Input label="Date" type="date" value={d.date} onChange={d.setDate} />
            <Input label="Time" type="time" value={d.time} onChange={d.setTime} />
            <Input label="Room ID" value={d.roomId} onChange={d.setRoomId} />
          </div>

          <div className="max-w-md mb-10">
            <Input label="Room Password" value={d.roomPassword} onChange={d.setRoomPassword} />
          </div>

          <button
            onClick={d.isEditing ? d.updateMatch : d.createMatch}
            className="w-full bg-red-500 py-4 rounded-xl text-black font-bold text-lg mb-16"
          >
            {d.isEditing ? "UPDATE MATCH" : "CREATE MATCH"}
          </button>

          {/* ================= ALL MATCHES ================= */}
          <h2 className="text-2xl font-bold mb-6">ALL MATCHES</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {d.tournaments.map(t => {
              const active = d.selectedTournament?.id === t.id

              return (
                <div
                  key={t.id}
                  onClick={() => d.selectTournamentForEdit(t)}
                  className={`cursor-pointer rounded-2xl p-5 border transition
                    ${active
                      ? "border-red-500 bg-red-500/10"
                      : "border-white/10 bg-black/40 hover:border-red-500/40"
                    }`}
                >
                  <div className="flex justify-between mb-2">
                    <p className="font-semibold">{t.matchName}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-3 py-1 bg-white/10 rounded-full">
                        {t.status?.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          d.deleteMatch(t.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-red-500/20 rounded-full text-red-500 transition border border-transparent hover:border-red-500/40"
                        title="Delete Match"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400">
                    {t.map} • {t.gameMode}
                  </p>

                  <div className="flex justify-between mt-3 text-sm">
                    <span>₹{t.prize}</span>
                    <span>{t.joinedCount}/{t.maxPlayers}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ================= PLAYERS ================= */}
          {d.selectedTournament && (
            <>
              <h2 className="text-2xl font-bold mt-14 mb-6">
                PLAYERS – {d.selectedTournament.matchName}
              </h2>

              {d.players.map(p => (
                <div
                  key={p.id}
                  className="bg-black/50 border border-white/10 rounded-2xl p-6 mb-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{p.ign}</p>
                      <p className="text-xs text-gray-400">{p.email}</p>
                    </div>

                    <span
                      className={`px-4 py-1 rounded-full text-xs font-bold
                        ${p.paymentStatus === "approved"
                          ? "bg-green-500/20 text-green-400"
                          : p.paymentStatus === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                    >
                      {p.paymentStatus?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button
                      onClick={() => d.updateStatus(p.id, "approved")}
                      disabled={p.paymentStatus === "approved"}
                      className="px-5 py-2 rounded-lg bg-green-500 text-black font-bold"
                    >
                      APPROVE
                    </button>

                    <button
                      onClick={() => d.updateStatus(p.id, "rejected")}
                      disabled={p.paymentStatus === "rejected"}
                      className="px-5 py-2 rounded-lg bg-red-500 text-black font-bold"
                    >
                      REJECT
                    </button>
                  </div>

                  {p.paymentScreenshot && (
                    <img
                      src={p.paymentScreenshot}
                      alt="Payment screenshot"
                      className="mt-4 w-60 rounded-xl cursor-zoom-in hover:scale-105 transition"
                      onClick={() => d.setZoomImage(p.paymentScreenshot)}
                    />
                  )}
                </div>
              ))}

              {/* ================= PUBLISH RESULTS ================= */}
              <div className="bg-black/80 border border-red-500/50 rounded-3xl p-8 mt-12 mb-8 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                <h3 className="text-3xl font-black mb-6 text-red-500 flex items-center gap-3">
                  🏆 PUBLISH MATCH RESULTS
                </h3>
                <p className="text-sm text-gray-400 mb-8 font-medium">
                  Add the top players here to officially record their Rank, Kills, and Prize Won. Once published, this match will be marked as COMPLETED and prizes will show on their profile.
                </p>

                {d.matchResults.map((res, index) => (
                  <div key={index} className="flex flex-col lg:flex-row gap-5 mb-5 bg-white/5 p-6 rounded-2xl border border-white/10 items-end hover:border-red-500/30 transition-colors">
                    <div className="flex-1 w-full lg:w-auto">
                      <label className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2 block">Select Player</label>
                      <select
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-red-500 transition-colors"
                        value={res.userId}
                        onChange={e => {
                          const selectedUser = d.players.find(p => p.id === e.target.value)
                          d.updateResultRow(index, "userId", e.target.value)
                          d.updateResultRow(index, "ign", selectedUser ? selectedUser.ign : "")
                        }}
                      >
                        <option value="">-- Choose Player --</option>
                        {d.players.filter(p => p.paymentStatus === "approved").map(p => (
                          <option key={p.id} value={p.id}>{p.ign} ({p.uid?.slice(0, 6) || "player"})</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full lg:w-28">
                      <label className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2 block">Rank #</label>
                      <input
                        type="number"
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-red-500 transition-colors"
                        placeholder="1"
                        value={res.rank}
                        onChange={e => d.updateResultRow(index, "rank", e.target.value)}
                      />
                    </div>

                    <div className="w-full lg:w-28">
                      <label className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2 block">Kills</label>
                      <input
                        type="number"
                        className="w-full bg-black border border-white/20 rounded-xl px-4 py-3 text-white font-black outline-none focus:border-red-500 transition-colors"
                        placeholder="0"
                        value={res.kills}
                        onChange={e => d.updateResultRow(index, "kills", e.target.value)}
                      />
                    </div>

                    <div className="w-full lg:w-36">
                      <label className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-2 block">Prize (₹)</label>
                      <input
                        type="number"
                        className="w-full bg-black border border-red-500/50 rounded-xl px-4 py-3 text-red-400 font-black outline-none focus:border-red-500 transition-colors"
                        placeholder="₹0"
                        value={res.prizeWon}
                        onChange={e => d.updateResultRow(index, "prizeWon", e.target.value)}
                      />
                    </div>

                    <div className="w-full lg:w-auto mt-4 lg:mt-0">
                      <button
                        onClick={() => d.removeResultRow(index)}
                        className="w-full lg:w-14 h-12 flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black rounded-xl font-bold transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    onClick={d.addResultRow}
                    className="px-8 py-4 border-2 border-dashed border-gray-600 text-gray-400 font-bold uppercase tracking-widest hover:text-white hover:border-white rounded-xl transition-colors"
                  >
                    + Add Winner
                  </button>

                  <button
                    onClick={d.publishResults}
                    disabled={d.matchResults.length === 0}
                    className="flex-1 py-4 bg-red-500 text-black font-black text-lg tracking-widest rounded-xl hover:bg-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    SELECT TO PUBLISH MATCH
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {/* ================= BROADCAST ================= */}
      {d.activeTab === "BROADCAST" && (
        <>
          <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
            📢 BROADCAST MESSAGE
          </h2>

          <div className="max-w-2xl bg-black/60 border border-red-500/30 rounded-2xl p-8">
            {/* TITLE */}
            <div className="mb-6">
              <label className="admin-label">Title</label>
              <input
                className="admin-input"
                placeholder="Server Maintenance"
                value={d.broadcastTitle}
                onChange={e => d.setBroadcastTitle(e.target.value)}
              />
            </div>

            {/* MESSAGE */}
            <div className="mb-6">
              <label className="admin-label">Message</label>
              <textarea
                className="admin-input min-h-[120px]"
                placeholder="Servers will be down at 12 AM tonight"
                value={d.broadcastMessage}
                onChange={e => d.setBroadcastMessage(e.target.value)}
              />
            </div>

            {/* TYPE */}
            <div className="mb-8">
              <label className="admin-label">Type</label>
              <select
                className="admin-input"
                value={d.broadcastType}
                onChange={e => d.setBroadcastType(e.target.value)}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* SEND BUTTON */}
            <button
              onClick={d.sendBroadcast}
              className="w-full bg-red-500 py-4 rounded-xl text-black font-bold text-lg"
            >
              SEND BROADCAST
            </button>
          </div>
        </>
      )}

      {d.activeTab === "TRANSACTIONS" && (
        <>
          {/* ================= PENDING WITHDRAWALS ================= */}
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            💸 PENDING WITHDRAWALS
          </h2>

          {d.withdrawals.length === 0 ? (
            <p className="text-gray-400 text-center mb-12">
              No pending withdrawals
            </p>
          ) : (
            <div className="space-y-6 mb-16">
              {d.withdrawals.map(w => (
                <div
                  key={w.id}
                  className="bg-black/60 border border-yellow-500/30
           rounded-2xl p-4 md:p-6
           flex flex-col md:flex-row
           md:justify-between md:items-center
           gap-4"

                >
                  <div>
                    <p className="text-lg font-bold text-yellow-400">
                      {w.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      ₹{w.amount} • {w.upiId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(w.requestedAt).toLocaleString()}
                    </p>
                  </div>

                  {/* ===== BUTTON STATUS MODE ===== */}
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        d.updateWithdrawStatus(w.id, "approved")
                      }
                      disabled={w.status === "approved"}
                      className={`px-5 py-2 rounded-lg font-bold transition
                  ${w.status === "approved"
                          ? "bg-green-500 text-black cursor-default"
                          : "bg-green-500/30 text-green-400 hover:bg-green-500 hover:text-black"
                        }
                `}
                    >
                      {w.status === "approved" ? "ACCEPTED" : "APPROVE"}
                    </button>

                    <button
                      onClick={() =>
                        d.updateWithdrawStatus(w.id, "rejected")
                      }
                      disabled={w.status === "rejected"}
                      className={`px-5 py-2 rounded-lg font-bold transition
                  ${w.status === "rejected"
                          ? "bg-red-500 text-black cursor-default"
                          : "bg-red-500/30 text-red-400 hover:bg-red-500 hover:text-black"
                        }
                `}
                    >
                      {w.status === "rejected" ? "REJECTED" : "REJECT"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= ALL TRANSACTIONS ================= */}
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            📊 ALL TRANSACTIONS
          </h2>

          {d.transactions.length === 0 ? (
            <p className="text-gray-400 text-center">
              No transactions found
            </p>
          ) : (
            <div className="space-y-4">
              {d.transactions.map(tx => (
                <div
                  key={tx.id}
                  className="bg-black/60 border border-yellow-500/30
           rounded-2xl p-4 md:p-6
           flex flex-col md:flex-row
           md:justify-between md:items-center
           gap-4"

                >
                  <div>
                    <p className="font-semibold text-lg">
                      {tx.name}
                    </p>
                    <p className="text-sm text-gray-400">
                      {tx.type === "deposit"
                        ? "Money Added"
                        : "Withdrawal"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.time).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${tx.type === "deposit"
                        ? "text-green-400"
                        : "text-red-400"
                        }`}
                    >
                      {tx.type === "deposit" ? "+" : "-"}₹{tx.amount}
                    </p>

                    <p className="text-xs text-gray-400 uppercase">
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}


      {d.activeTab === "ANALYTICS" && (
        <>
          {/* ================= PLATFORM ANALYTICS ================= */}
          <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
            📊 PLATFORM ANALYTICS
          </h2>

          {/* TOP CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            <GradientCard
              title="Total Users"
              value={d.analytics.totalUsers}
              sub="Registered Players"
            />

            <GradientCard
              title="Total Matches"
              value={d.analytics.totalMatches}
              sub="Created Matches"
            />

            <GradientCard
              title="Total Deposits"
              value={`₹${d.analytics.totalDeposits}`}
              sub="Money Added by Users"
              valueClass="text-green-400"
            />

            <GradientCard
              title="Total Withdrawals"
              value={`₹${d.analytics.totalWithdrawals}`}
              sub="Completed Payouts"
              valueClass="text-red-400"
            />


            <GradientCard
              title="Total Prizes"
              value={`₹${d.analytics.totalPrizes}`}
              sub="Distributed to Winners"
              valueClass="text-yellow-400"
            />
          </div>

          {/* ================= FINANCIAL SUMMARY ================= */}
          <div className="bg-black/40 rounded-2xl p-8 mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              💰 FINANCIAL SUMMARY
            </h3>

            <SummaryRow
              label="Money In (Deposits)"
              value={`+₹${d.analytics.totalDeposits}`}
              color="green"
            />

            <SummaryRow
              label="Money Out (Withdrawals)"
              value={`-₹${d.analytics.totalWithdrawals}`}
              color="red"
            />


            <SummaryRow
              label="Prizes Distributed"
              value={`-₹${d.analytics.totalPrizes}`}
              color="yellow"
            />

            <div className="mt-6 border border-purple-500/40 rounded-xl p-5 flex justify-between">
              <span className="font-semibold">Net Revenue</span>
              <span className="font-bold text-red-400">
                ₹{d.analytics.netRevenue}
              </span>
            </div>
          </div>

          {/* ================= QUICK STATS ================= */}
          <div className="bg-black/40 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              📈 QUICK STATS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <QuickStat
                title="Total Reviews"
                value={d.reviews}
              />
              <QuickStat
                title="Total Transactions"
                value={d.analytics.totalTransactions}
              />
              <QuickStat
                title="Active Matches"
                value={d.tournaments.filter(t => t.status === "open").length}
              />
            </div>
          </div>
        </>
      )}




      {/* ================= ZOOM ================= */}
      {d.zoomImage && (
        <div
          onClick={() => d.setZoomImage(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        >
          <img
            src={d.zoomImage}
            alt="Payment screenshot preview"
            className="max-h-[90%] max-w-[90%] rounded-xl"
          />
        </div>
      )}
    </div>
  )
}


/* ================= SMALL COMPONENTS ================= */

function Stat({ title, value, color }) {
  return (
    <div className="bg-white/5 rounded-2xl p-6 text-center">
      <p className="text-gray-400">{title}</p>
      <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <input
        type={type}
        className="admin-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
function GradientCard({ title, value, sub, valueClass = "text-white" }) {
  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-pink-500/40 to-purple-600/60">
      <p className="text-sm opacity-80">{title}</p>
      <p className={`text-4xl font-bold mt-2 ${valueClass}`}>{value}</p>
      <p className="text-xs opacity-70 mt-1">{sub}</p>
    </div>
  )
}

function SummaryRow({ label, value, color }) {
  const colors = {
    green: "border-green-500/50 text-green-400",
    red: "border-red-500/50 text-red-400",
    yellow: "border-yellow-500/50 text-yellow-400"
  }

  return (
    <div className={`mb-4 p-4 border rounded-xl flex justify-between ${colors[color]}`}>
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function QuickStat({ title, value }) {
  return (
    <div className="bg-black/60 rounded-xl p-6 text-center">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-red-400 mt-2">{value}</p>
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <select
        className="admin-input"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
