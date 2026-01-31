import admin from "firebase-admin"

/* ================= FIREBASE ADMIN INIT ================= */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  })
}

const db = admin.firestore()

/* ================= API ================= */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" })
    }

    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP required"
      })
    }

    const ref = db.collection("otp_requests").doc(email)
    const snap = await ref.get()

    if (!snap.exists) {
      return res.status(401).json({
        success: false,
        message: "OTP expired or not found"
      })
    }

    const { otp: savedOtp, expiresAt } = snap.data()

    if (savedOtp !== otp || Date.now() > expiresAt) {
      await ref.delete()
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP"
      })
    }

    /* ================= DELETE OTP ================= */
    await ref.delete()

    /* ================= FIREBASE USER ================= */
    let user
    let needsPassword = false

    try {
      user = await admin.auth().getUserByEmail(email)
    } catch {
      user = await admin.auth().createUser({
        email,
        emailVerified: true
      })
      needsPassword = true
    }

    const token = await admin.auth().createCustomToken(user.uid)

    return res.status(200).json({
      success: true,
      token,
      needsPassword
    })

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err)
    return res.status(500).json({
      success: false,
      message: "OTP verification failed"
    })
  }
}
