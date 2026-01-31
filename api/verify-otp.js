import admin from "firebase-admin"

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  })
}

const db = admin.firestore()

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false })
  }

  const { email, otp } = req.body

  const ref = db.collection("otp_requests").doc(email)
  const snap = await ref.get()

  if (!snap.exists) {
    return res.status(401).json({
      success: false,
      message: "OTP expired or not found"
    })
  }

  const data = snap.data()

  if (data.otp !== otp || Date.now() > data.expiresAt) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired OTP"
    })
  }

  // ✅ DELETE OTP AFTER USE
  await ref.delete()

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

  return res.json({
    success: true,
    token,
    needsPassword
  })
}
