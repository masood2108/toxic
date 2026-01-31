import { useState, useEffect } from "react"
import { auth } from "../firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  sendPasswordResetEmail,
  updatePassword
} from "firebase/auth"
import { useNavigate } from "react-router-dom"

export default function useAuthLogic() {
  /* ================= MODE ================= */
  const [mode, setMode] = useState("login")
  const [useOtp, setUseOtp] = useState(false)

  /* ================= SIGNUP DATA ================= */
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")

  /* ================= AUTH DATA ================= */
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)

  /* ================= UI ================= */
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const navigate = useNavigate()

  /* ================= HELPERS ================= */
  const success = (msg) => {
    setIsError(false)
    setMessage(msg)
  }

  const error = (msg) => {
    setIsError(true)
    setMessage(msg)
  }

  /* ================= SIGNUP ================= */
  const signup = async () => {
    if (!name || !email || !password) {
      error("Please fill in all fields to continue.")
      return
    }

    setLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      success("Account created successfully. Please log in to continue.")
      setMode("login")
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        error("This email is already registered. Try logging in.")
      } else if (e.code === "auth/weak-password") {
        error("Password must be at least 6 characters long.")
      } else if (e.code === "auth/invalid-email") {
        error("Please enter a valid email address.")
      } else {
        error("Signup failed. Please try again.")
      }
    }
    setLoading(false)
  }

  /* ================= PASSWORD LOGIN ================= */
  const loginWithPassword = async () => {
    if (!email || !password) {
      error("Please enter both email and password.")
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      success("Welcome back! Logging you in…")
      navigate("/games")
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        error("No account found with this email.")
      } else if (e.code === "auth/wrong-password") {
        error("Incorrect password. Please try again.")
      } else {
        error("Login failed. Please try again.")
      }
    }
    setLoading(false)
  }

  /* ================= SEND OTP ================= */
  const sendEmailOtp = async () => {
    if (!email) {
      error("Please enter your email address first.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message)

      setOtpSent(true)
      success("OTP sent to your email. Check inbox & spam 📩")
    } catch (e) {
      error(
        e.message ||
          "Failed to send OTP. Please wait and try again."
      )
    }
    setLoading(false)
  }

  /* ================= VERIFY OTP ================= */
  const verifyEmailOtp = async () => {
    if (!otp) {
      error("Please enter the OTP sent to your email.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message)

      await signInWithCustomToken(auth, data.token)

      if (data.needsPassword) {
        success("OTP verified. Please set your password.")
        navigate("/set-password")
      } else {
        success("Login successful. Welcome back!")
        navigate("/games")
      }
    } catch (e) {
      error(
        e.message ||
          "Invalid or expired OTP. Please try again."
      )
    }
    setLoading(false)
  }

  /* ================= SET PASSWORD ================= */
  const setNewPassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      error("Password must be at least 6 characters long.")
      return
    }

    setLoading(true)
    try {
      await updatePassword(auth.currentUser, newPassword)
      success("Password set successfully. Redirecting…")
      navigate("/games")
    } catch (e) {
      error("Failed to set password. Please try again.")
    }
    setLoading(false)
  }

  /* ================= FORGOT PASSWORD ================= */
  const forgotPassword = async () => {
    if (!email) {
      error("Please enter your email to reset password.")
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      success("Password reset link sent to your email 📧")
    } catch {
      error("Failed to send reset link. Please try again.")
    }
  }

  /* ================= RESET ON MODE / METHOD CHANGE ================= */
  useEffect(() => {
    setPassword("")
    setOtp("")
    setOtpSent(false)
    setMessage("")
    setIsError(false)
  }, [useOtp, mode])

  /* ================= EXPORT ================= */
  return {
    /* state */
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

    /* setters */
    setMode,
    setUseOtp,
    setName,
    setPhone,
    setEmail,
    setPassword,
    setOtp,

    /* actions */
    signup,
    loginWithPassword,
    sendEmailOtp,
    verifyEmailOtp,
    setNewPassword,
    forgotPassword
  }
}
