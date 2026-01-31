import nodemailer from "nodemailer"
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

    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" })
    }

    /* ================= GENERATE OTP ================= */
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes

    /* ================= STORE OTP ================= */
    await db.collection("otp_requests").doc(email).set({
      otp,
      expiresAt,
      createdAt: Date.now()
    })

    /* ================= MAILER ================= */
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
            html: `
  <div style="
    width:100%;
    background:#0d0d0d;
    padding:40px 0;
    font-family: 'Segoe UI', Arial, sans-serif;
  ">
    <div style="
      max-width:680px;
      margin:0 auto;
      background:#0d0d0d;
      border-left:6px solid #ff4d00;
      padding:40px 50px;
      color:#ffffff;
    ">

      <h1 style="
        margin:0 0 24px 0;
        font-size:34px;
        font-weight:700;
      ">
        Verify Your Account
      </h1>

      <p style="
        margin:0 0 40px 0;
        font-size:18px;
        color:#d0d0d0;
      ">
        Your OTP for <strong>TOXICRUSH</strong> registration is:
      </p>

      <div style="
        font-size:48px;
        font-weight:800;
        letter-spacing:10px;
        color:#ff4d00;
        margin-bottom:50px;
      ">
        ${otp}
      </div>

      <p style="
        font-size:14px;
        color:#9a9a9a;
        line-height:1.6;
      ">
        This OTP is valid for <strong>5 minutes</strong>.<br/>
        Please do not share this code with anyone.
      </p>

    </div>
  </div>
` })

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully"
    })

  } catch (err) {
    console.error("SEND OTP ERROR:", err)
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    })
  }
}
