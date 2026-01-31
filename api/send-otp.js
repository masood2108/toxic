import nodemailer from "nodemailer"
import { db } from "../../lib/firebaseAdmin"

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false })
    }

    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 5 * 60 * 1000

    await db.collection("otp_requests").doc(email).set({
      otp,
      expiresAt
    })

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    })

    await transporter.sendMail({
      from: `"ToxicRush 🔥" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your ToxicRush OTP",
      html: `<h1>${otp}</h1>`
    })

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error("SEND OTP ERROR", err)
    return res.status(500).json({ success: false })
  }
}
