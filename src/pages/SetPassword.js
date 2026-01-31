import { useState } from "react"
import useAuthLogic from "../auth/UseAuthLogic"

export default function SetPassword() {
  const [newPassword, setNewPassword] = useState("")
  const { setNewPassword: savePassword, loading, message, isError } = useAuthLogic()

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-white/5 p-8 rounded-xl w-96">
        <h2 className="text-white text-xl mb-4">Set Password</h2>

        <input
          type="password"
          placeholder="New Password"
          className="auth-input"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />

        <button
          onClick={() => savePassword(newPassword)}
          className="w-full mt-4 bg-toxic py-2 rounded"
          disabled={loading}
        >
          SET PASSWORD
        </button>

        {message && (
          <p className={isError ? "text-red-500" : "text-green-500"}>{message}</p>
        )}
      </div>
    </div>
  )
}
