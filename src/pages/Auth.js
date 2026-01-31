import { useState, useRef, useEffect } from "react"
import { auth, db } from "../firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

const ADMIN_EMAILS = [
  "masoodhussainr8@gmail.com",
  "officialtoxicrush.esports@gmail.com"
]

// 🔥 keep behaviour configurable
const PRESERVE_FIELDS_AFTER_SIGNUP = true

export default function Auth() {

  /* ================= STATE ================= */
  const [mode, setMode] = useState("login") // login | signup
  const [useOtp, setUseOtp] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const passwordRef = useRef(null)
  const navigate = useNavigate()

  /* ================= ERROR MAPPER ================= */
  const getErrorMessage = (error) => {
    const code = error?.code
    if (code === "auth/email-already-in-use") return "EMAIL ALREADY REGISTERED"
    if (code === "auth/invalid-email") return "INVALID EMAIL FORMAT"
    if (code === "auth/weak-password") return "PASSWORD TOO WEAK (MIN 6 CHARS)"
    if (code === "auth/user-not-found") return "ACCOUNT NOT FOUND"
    if (code === "auth/wrong-password") return "INCORRECT PASSWORD"
    return "AUTHENTICATION FAILED"
  }

  /* ================= SAFE FIRESTORE WRITE ================= */
  const safeSetUserDoc = async (uid, data) => {
    try {
      await setDoc(doc(db, "users", uid), data)
    } catch (err) {
      console.warn("Firestore write failed:", err)
    }
  }

  /* ================= SIGNUP ================= */
  const signup = async () => {
    if (!name || !email || !password || !phone) {
      setIsError(true)
      setMessage("PLEASE FILL ALL FIELDS")
      return
    }

    setLoading(true)
    setMessage("")
    setIsError(false)

    let cred
    try {
      cred = await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setIsError(true)
      setMessage(getErrorMessage(error))
      setLoading(false)
      return
    }

    await safeSetUserDoc(cred.user.uid, {
      name,
      email,
      phone,
      role: ADMIN_EMAILS.includes(email) ? "admin" : "user",
      createdAt: Date.now()
    })

    await signOut(auth)

    setMode("login")
    setIsError(false)
    setMessage("ACCOUNT CREATED — LOGIN TO CONTINUE")

    if (!PRESERVE_FIELDS_AFTER_SIGNUP) {
      setName("")
      setPassword("")
      setPhone("")
    }

    setLoading(false)
  }

  /* ================= LOGIN ================= */
  const login = async () => {
    if (useOtp) {
      setIsError(true)
      setMessage("OTP LOGIN COMING SOON")
      return
    }

    if (!email || !password) {
      setIsError(true)
      setMessage("ENTER EMAIL AND PASSWORD")
      return
    }

    setLoading(true)
    setMessage("")
    setIsError(false)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/games")
    } catch (error) {
      setIsError(true)
      setMessage(getErrorMessage(error))
    }

    setLoading(false)
  }

  /* ================= FORGOT PASSWORD ================= */
  const forgotPassword = async () => {
    if (!email) {
      setIsError(true)
      setMessage("ENTER EMAIL FIRST")
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setIsError(false)
      setMessage("RESET LINK SENT TO EMAIL")
    } catch {
      setIsError(true)
      setMessage("FAILED TO SEND RESET LINK")
    }
  }

  /* ================= UX HELPERS ================= */
  useEffect(() => {
    if (mode === "login" && passwordRef.current) {
      passwordRef.current.focus()
    }
  }, [mode])

  useEffect(() => {
    setUseOtp(false) // reset OTP when switching tab
  }, [mode])

  useEffect(() => {
    if (message && !isError) {
      const t = setTimeout(() => setMessage(""), 3000)
      return () => clearTimeout(t)
    }
  }, [message, isError])

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,77,0,0.12),transparent_60%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">

        <div className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">

          <h1 className="text-center font-orbitron text-4xl tracking-widest mb-2">
            <span className="text-white">TOXIC</span>
            <span className="text-toxic">RUSH</span>
          </h1>

          <p className="text-center text-gray-400 font-rajdhani tracking-widest mb-8">
            {mode === "login" ? "ENTER THE ARENA" : "CREATE YOUR ID"}
          </p>

          {/* MODE SWITCH */}
          <div className="grid grid-cols-2 mb-6 bg-black/40 rounded-full p-1">
            <button
              onClick={() => setMode("login")}
              className={`py-2 rounded-full transition ${
                mode === "login"
                  ? "bg-toxic text-black"
                  : "text-gray-400"
              }`}
            >
              LOGIN
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`py-2 rounded-full transition ${
                mode === "signup"
                  ? "bg-toxic text-black"
                  : "text-gray-400"
              }`}
            >
              SIGN UP
            </button>
          </div>

          <div className="space-y-5">

            {/* SIGNUP */}
            {mode === "signup" && (
              <>
                <input className="auth-input" placeholder="FULL NAME" value={name} onChange={e => setName(e.target.value)} />
                <input className="auth-input" placeholder="MOBILE (+91XXXXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} />
                <input className="auth-input" placeholder="EMAIL" value={email} onChange={e => setEmail(e.target.value)} />
                <input className="auth-input" type="password" placeholder="PASSWORD" value={password} onChange={e => setPassword(e.target.value)} />
              </>
            )}

            {/* LOGIN */}
            {mode === "login" && (
              <>
                <input className="auth-input" placeholder="EMAIL" value={email} onChange={e => setEmail(e.target.value)} />

                {!useOtp && (
                  <input
                    ref={passwordRef}
                    className="auth-input"
                    type="password"
                    placeholder="PASSWORD"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                )}

                {useOtp && (
                  <input
                    className="auth-input"
                    placeholder="ENTER MOBILE NUMBER"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                )}

                <button
                  type="button"
                  onClick={() => setUseOtp(prev => !prev)}
                  className="text-xs text-toxic hover:underline"
                >
                  {useOtp ? "Login with Password" : "Login with OTP"}
                </button>

                <button
                  onClick={forgotPassword}
                  className="text-xs text-gray-400 hover:text-toxic"
                >
                  Forgot password?
                </button>
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

          {/* ACTION */}
          <button
            onClick={mode === "login" ? login : signup}
            disabled={loading}
            className="mt-8 w-full py-3 rounded-xl bg-toxic text-black font-orbitron tracking-widest"
          >
            {loading ? "PROCESSING..." : mode === "login" ? "ENTER" : "CREATE ACCOUNT"}
          </button>

        </div>
      </div>
    </div>
  )
}
