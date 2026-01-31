import admin from "firebase-admin"

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    )
  })
}

const otpStore = global.otpStore || new Map()
global.otpStore = otpStore

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false })
  }

  const { email, otp } = req.body
  const record = otpStore.get(email)

  if (!record || record.otp !== otp) {
    return res.json({ success: false, message: "Invalid OTP" })
  }

  if (Date.now() > record.expires) {
    otpStore.delete(email)
    return res.json({ success: false, message: "OTP expired" })
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

  res.json({
    success: true,
    token,
    needsPassword
  })
}
