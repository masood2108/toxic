import useAuthLogic from "../auth/UseAuthLogic"

export default function Auth() {
  const {
    mode,
    useOtp,
    name,
    phone,
    email,
    password,
    otp,
    otpSent,
    loading,
    message,
    isError,

    setMode,
    setUseOtp,
    setName,
    setPhone,
    setEmail,
    setPassword,
    setOtp,

    signup,
    loginWithPassword,
    sendEmailOtp,
    verifyEmailOtp,
    forgotPassword
  } = useAuthLogic()

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      {/* BACKGROUND ENERGY */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,77,0,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,122,0,0.08),transparent_60%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">

        {/* CARD */}
        <div
          className="w-full max-w-md rounded-3xl p-8
          bg-black/70 backdrop-blur-xl
          border border-white/10
          shadow-[0_0_60px_rgba(255,77,0,0.15)]
          animate-floatSlow"
        >

          {/* LOGO */}
          <h1 className="text-center font-orbitron text-4xl tracking-[0.35em] mb-2">
            <span className="text-white">TOXIC</span>
            <span className="text-[#ff4d00]">RUSH</span>
          </h1>

          <p className="text-center text-gray-400 tracking-[0.3em] mb-8 text-xs">
            {mode === "login" ? "ENTER THE ARENA" : "CREATE YOUR ID"}
          </p>

          {/* MODE SWITCH */}
          <div className="grid grid-cols-2 mb-6 bg-black/50 rounded-full p-1 border border-white/10">
            {["login", "signup"].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2 rounded-full text-xs tracking-widest transition-all
                  ${
                    mode === m
                      ? "bg-[#ff4d00] text-black shadow-[0_0_20px_rgba(255,77,0,0.6)]"
                      : "text-gray-400 hover:text-white"
                  }`}
              >
                {m === "login" ? "LOGIN" : "SIGN UP"}
              </button>
            ))}
          </div>

          <div className="space-y-5">

            {/* ================= SIGNUP ================= */}
            {mode === "signup" && (
              <>
                <input
                  className="auth-input"
                  placeholder="FULL NAME"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />

                <input
                  className="auth-input"
                  placeholder="MOBILE (+91XXXXXXXXXX)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />

                <input
                  className="auth-input"
                  placeholder="EMAIL"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />

                <input
                  className="auth-input"
                  type="password"
                  placeholder="PASSWORD"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </>
            )}

            {/* ================= LOGIN ================= */}
            {mode === "login" && (
              <>
                <input
                  className="auth-input"
                  placeholder="EMAIL"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />

                {!useOtp && (
                  <input
                    className="auth-input"
                    type="password"
                    placeholder="PASSWORD"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                )}

                {useOtp && otpSent && (
                  <input
                    className="auth-input"
                    placeholder="ENTER OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                  />
                )}

                {/* LOGIN OPTIONS ROW */}
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseOtp(p => !p)
                      setPassword("")
                      setOtp("")
                    }}
                    className="text-xs tracking-widest text-[#ff4d00] hover:text-white transition"
                  >
                    {useOtp ? "LOGIN WITH PASSWORD" : "LOGIN WITH OTP"}
                  </button>

                  {!useOtp && (
                    <button
                      onClick={forgotPassword}
                      className="text-xs tracking-widest text-gray-400 hover:text-[#ff4d00] transition"
                    >
                      FORGOT PASSWORD?
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ================= MESSAGE ================= */}
          {message && (
            <div
              className={`mt-5 flex gap-3 px-4 py-3 rounded-xl text-sm border
                ${
                  isError
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-green-500/10 border-green-500/30 text-green-400"
                }`}
            >
              <span className="text-lg">{isError ? "✖" : "✔"}</span>
              <span>{message}</span>
            </div>
          )}

          {/* ================= CTA ================= */}
          <button
            onClick={
              mode === "login"
                ? useOtp
                  ? otpSent
                    ? verifyEmailOtp
                    : sendEmailOtp
                  : loginWithPassword
                : signup
            }
            disabled={loading}
            className="mt-8 w-full py-3 rounded-xl font-orbitron tracking-[0.3em]
              text-black btn-toxic transition-all"
          >
            {loading
              ? "PROCESSING..."
              : mode === "login"
              ? useOtp
                ? otpSent
                  ? "VERIFY OTP"
                  : "GET OTP"
                : "ENTER"
              : "CREATE ACCOUNT"}
          </button>

        </div>
      </div>
    </div>
  )
}
