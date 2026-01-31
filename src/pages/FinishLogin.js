import { useEffect } from "react"
import { auth } from "../firebase"
import {
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth"
import { useNavigate } from "react-router-dom"

export default function FinishLogin() {
  const navigate = useNavigate()

  useEffect(() => {
    const completeLogin = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const email = localStorage.getItem("emailForSignIn")

        if (!email) {
          alert("Email not found. Please login again.")
          return
        }

        try {
          await signInWithEmailLink(auth, email, window.location.href)
          localStorage.removeItem("emailForSignIn")
          navigate("/games")
        } catch {
          alert("Login failed")
        }
      }
    }

    completeLogin()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <p>Verifying OTP…</p>
    </div>
  )
}
