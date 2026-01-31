import { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  sendPasswordResetEmail
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { sendSignInLinkToEmail } from "firebase/auth"

const ADMIN_EMAILS = [
  "masoodhussainr8@gmail.com",
  "officialtoxicrush.esports@gmail.com"
]

export default function useAuthLogic() {
  /* ================= STATE ================= */
  const [mode, setMode] = useState("login")
  const [useOtp, setUseOtp] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isError, setIsError] = useState(false)

  const navigate = useNavigate()

  /* ================= HELPERS ================= */
  const errorText = (e) => {
    const c = e?.code
    if (c === "auth/email-already-in-use") return "EMAIL ALREADY REGISTERED"
    if (c === "auth/invalid-email") return "INVALID EMAIL"
    if (c === "auth/weak-password") return "WEAK PASSWORD"
    if (c === "auth/user-not-found") return "ACCOUNT NOT FOUND"
    if (c === "auth/wrong-password") return "WRONG PASSWORD"
    return "AUTH FAILED"
  }

  const saveUser = async (uid, data) => {
    await setDoc(doc(db, "users", uid), data, { merge: true })
  }

  /* ================= SIGNUP ================= */
  const signup = async () => {
    if (!name || !email || !password) {
      setIsError(true)
      setMessage("PLEASE FILL ALL FIELDS")
      return
    }

    setLoading(true)
    setIsError(false)

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)

      await saveUser(cred.user.uid, {
        name,
        email,
        role: ADMIN_EMAILS.includes(email) ? "admin" : "user",
        createdAt: Date.now()
      })

      await signOut(auth)
      setMode("login")
      setMessage("ACCOUNT CREATED — LOGIN TO CONTINUE")
    } catch (e) {
      setIsError(true)
      setMessage(errorText(e))
    }

    setLoading(false)
  }

  /* ================= PASSWORD LOGIN ================= */
  const loginWithPassword = async () => {
    if (!email || !password) {
      setIsError(true)
      setMessage("ENTER EMAIL AND PASSWORD")
      return
    }

    setLoading(true)
    setIsError(false)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/games")
    } catch (e) {
      setIsError(true)
      setMessage(errorText(e))
    }

    setLoading(false)
  }

  /* ================= EMAIL OTP SEND ================= */
  const sendEmailOtp = async () => {
  if (!email) {
    setIsError(true)
    setMessage("ENTER EMAIL")
    return
  }

  setLoading(true)
  setIsError(false)

  try {
    const actionCodeSettings = {
      url: "http://localhost:3000/finish-login",
      handleCodeInApp: true
    }

    await sendSignInLinkToEmail(auth, email, actionCodeSettings)

    localStorage.setItem("emailForSignIn", email)
    setMessage("OTP LINK SENT TO EMAIL")
  } catch (err) {
    setIsError(true)
    setMessage("FAILED TO SEND OTP")
  }

  setLoading(false)
}


  /* ================= EMAIL OTP VERIFY ================= */
  const verifyEmailOtp = async () => {
    if (!otp) return

    setLoading(true)
    setIsError(false)

    try {
      const res = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      })

      const data = await res.json()
      if (!data.success) throw new Error()

      await signInAnonymously(auth)
      navigate("/games")
    } catch {
      setIsError(true)
      setMessage("INVALID OTP")
    }

    setLoading(false)
  }

  /* ================= FORGOT PASSWORD ================= */
  const forgotPassword = async () => {
    if (!email) return
    await sendPasswordResetEmail(auth, email)
    setMessage("RESET LINK SENT TO EMAIL")
  }

  useEffect(() => {
    setOtp("")
    setOtpSent(false)
  }, [useOtp, mode])

  /* ================= EXPORT ================= */
  return {
    mode,
    useOtp,
    name,
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
    setEmail,
    setPassword,
    setOtp,

    signup,
    loginWithPassword,
    sendEmailOtp,
    verifyEmailOtp,
    forgotPassword
  }
}
