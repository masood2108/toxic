import express from "express"
import cors from "cors"
import nodemailer from "nodemailer"
import admin from "firebase-admin"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

/* ================= PATH ================= */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* ================= FIREBASE ADMIN ================= */
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8")
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

/* ================= APP ================= */
const app = express()
app.use(cors())
app.use(express.json())

/* ================= STORES ================= */
const otpStore = new Map()

/* ================= MAIL ================= */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "masoodhussainr8@gmail.com",
    pass: "aswu zfmc rfrs akfe"
  }
})

/* ================= SEND OTP ================= */
app.post("/send-otp", async (req, res) => {
  const { email } = req.body
  if (!email) return res.json({ success: false, message: "Email required" })

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 })

  await transporter.sendMail({
    from: `"ToxicRush 🔥" <masoodhussainr8@gmail.com>`,
    to: email,
    subject: "Your ToxicRush OTP",
c    })

  res.json({ success: true, message: "OTP sent" })
})

/* ================= VERIFY OTP ================= */
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body
  const record = otpStore.get(email)

  if (!record || record.otp !== otp)
    return res.json({ success: false, message: "Invalid OTP" })

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
})

/* ================= START ================= */
app.listen(5001, () => {
  console.log("✅ Backend running on http://localhost:5001")
})