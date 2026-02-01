import useAuthLogic from "../auth/UseAuthLogic"
import { useEffect } from "react"

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

  useEffect(() => {
    document.title =
      mode === "login"
        ? "ToxicRush • Login"
        : "ToxicRush • Sign Up"
  }, [mode])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden px-4">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b0b0b] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,128,0.18),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md text-center">

        {/* TITLE */}
        <h1 className="text-5xl font-extrabold mb-3 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          ToxicRush Esports
        </h1>

        <p className="text-white text-lg mb-1">
          Join the rush. Dominate the game.
        </p>
        <p className="text-red-500 font-semibold mb-10">
          Compete. Dominate. Win.
        </p>

        {/* CARD */}
        <div className="rounded-3xl p-8 bg-gradient-to-br from-pink-500 to-purple-600 shadow-2xl">

          {/* MODE SWITCH */}
          <div className="flex bg-white/10 rounded-full p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-full font-semibold transition
                ${mode === "login"
                  ? "bg-[#ff6a5c] text-white"
                  : "text-white/70 hover:text-white"}
              `}
            >
              LOGIN
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-full font-semibold transition
                ${mode === "signup"
                  ? "bg-[#ff6a5c] text-white"
                  : "text-white/70 hover:text-white"}
              `}
            >
              SIGN UP
            </button>
          </div>

          {/* INPUTS */}
          <div className="space-y-4">

            {mode === "signup" && (
              <>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-white/60 outline-none"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />

                <input
                  className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-white/60 outline-none"
                  placeholder="Mobile (+91XXXXXXXXXX)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </>
            )}

            <input
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-white/60 outline-none"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            {!useOtp && (
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-white/60 outline-none"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            )}

            {useOtp && otpSent && (
              <input
                className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-white/60 outline-none"
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
            )}
          </div>

          {/* OPTIONS */}
          {mode === "login" && (
            <div className="flex justify-between mt-4 text-sm text-white/80">
              <button
                onClick={() => {
                  setUseOtp(p => !p)
                  setPassword("")
                  setOtp("")
                }}
                className="hover:text-white transition"
              >
                {useOtp ? "Login with Password" : "Login with OTP"}
              </button>

              {!useOtp && (
                <button
                  onClick={forgotPassword}
                  className="hover:text-white transition"
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-5 p-3 rounded-xl text-sm text-center
                ${isError ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}
              `}
            >
              {message}
            </div>
          )}

          {/* CTA */}
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
            className="mt-8 w-full py-4 rounded-xl bg-[#ff6a5c] text-white font-bold text-lg tracking-wide hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading
              ? "PROCESSING..."
              : mode === "login"
              ? useOtp
                ? otpSent
                  ? "VERIFY OTP"
                  : "GET OTP"
                : "LOGIN"
              : "CREATE ACCOUNT"}
          </button>

        </div>
      </div>
    </div>
  )
}
