import { db, auth } from "../../lib/firebaseAdmin"

export default async function handler(req, res) {
  try {
    const { email, otp } = req.body

    const ref = db.collection("otp_requests").doc(email)
    const snap = await ref.get()

    if (!snap.exists) {
      return res.status(401).json({ success: false })
    }

    const { otp: savedOtp, expiresAt } = snap.data()

    if (savedOtp !== otp || Date.now() > expiresAt) {
      await ref.delete()
      return res.status(401).json({ success: false })
    }

    await ref.delete()

    let user
    let needsPassword = false

    try {
      user = await auth.getUserByEmail(email)
    } catch {
      user = await auth.createUser({
        email,
        emailVerified: true
      })
      needsPassword = true
    }

    const token = await auth.createCustomToken(user.uid)

    return res.status(200).json({
      success: true,
      token,
      needsPassword
    })

  } catch (err) {
    console.error("VERIFY OTP ERROR", err)
    return res.status(500).json({ success: false })
  }
}
