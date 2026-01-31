import useAuthLogic from "../auth/UseAuthLogic"

export default function Auth() {
const {
  mode,
  useOtp,
  name,
  email,
  password,
  phone,        // ✅ added
  otp,
  otpSent,
  loading,
  message,
  isError,

  setMode,
  setUseOtp,
  setName,
  setEmail,
  setPassword,
  setPhone,     // ✅ added
  setOtp,

  signup,
  loginWithPassword,
  sendEmailOtp,
  verifyEmailOtp,
  forgotPassword
} = useAuthLogic()


  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.12),transparent_60%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">

          <h1 className="text-center font-orbitron text-4xl tracking-widest mb-2">
            <span className="text-white">TOXIC</span>
            <span className="text-toxic">RUSH</span>
          </h1>

          <p className="text-center text-gray-400 tracking-widest mb-8">
            {mode === "login" ? "ENTER THE ARENA" : "CREATE YOUR ID"}
          </p>

          {/* MODE SWITCH */}
          <div className="grid grid-cols-2 mb-6 bg-black/40 rounded-full p-1">
            <button
              onClick={() => setMode("login")}
              className={`py-2 rounded-full ${
                mode === "login" ? "bg-toxic text-black" : "text-gray-400"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`py-2 rounded-full ${
                mode === "signup" ? "bg-toxic text-black" : "text-gray-400"
              }`}
            >
              SIGN UP
            </button>
          </div>

          <div className="space-y-5">

            {/* SIGNUP */}
          {mode === "signup" && (
  <>
    <input
      className="auth-input"
      placeholder="FULL NAME"
      value={name}
      onChange={e => setName(e.target.value)}
    />

    {/* ✅ PHONE NUMBER */}
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


            {/* LOGIN */}
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

                <button
                  type="button"
                  onClick={() => setUseOtp(p => !p)}
                  className="text-xs text-toxic hover:underline"
                >
                  {useOtp ? "Login with Password" : "Login with OTP"}
                </button>

                {!useOtp && (
                  <button
                    onClick={forgotPassword}
                    className="text-xs text-gray-400 hover:text-toxic"
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
          </div>

          {/* MESSAGE */}
          {message && (
            <div className={`mt-5 auth-message ${isError ? "auth-error" : "auth-success"}`}>
              <span>{isError ? "⚠️" : "✅"}</span>
              <span>{message}</span>
            </div>
          )}

          {/* ACTION BUTTON */}
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
            className="mt-8 w-full py-3 rounded-xl bg-toxic text-black font-orbitron tracking-widest"
          >
            {loading
              ? "PROCESSING..."
              : mode === "login"
                ? useOtp
                  ? otpSent ? "VERIFY OTP" : "GET OTP"
                  : "ENTER"
                : "CREATE ACCOUNT"}
          </button>

        </div>
      </div>
    </div>
  )
}
