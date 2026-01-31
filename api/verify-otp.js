import admin from "firebase-admin"

/* ================= INIT FIREBASE ADMIN ================= */
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env variable missing")
  }

  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  })
}

/* ================= OTP STORE ================= */
const otpStore = global.otpStore || new Map()
global.otpStore = otpStore

/* ================= HANDLER ================= */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" })
  }

  const { email, otp } = req.body

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP required" })
  }

  const record = otpStore.get(email)

  if (!record || record.otp !== otp) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid OTP" })
  }

  if (Date.now() > record.expires) {
    otpStore.delete(email)
    return res
      .status(401)
      .json({ success: false, message: "OTP expired" })
  }

  otpStore.delete(email)

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
