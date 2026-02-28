import nodemailer from "nodemailer"
import { db } from "../lib/firebaseAdmin"

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
  from: `"ToxicRush Esports 🔥" <${process.env.MAIL_USER}>`,
  to: email,
  subject: "Your ToxicRush OTP Code",
  html: `
  <div style="margin:0;padding:0;background-color:#0f0f0f;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          
          <table width="500" cellpadding="0" cellspacing="0" 
            style="background:linear-gradient(135deg,#ff0057,#7b2ff7);
                   border-radius:20px;
                   padding:40px;
                   text-align:center;
                   color:white;">
            
            <tr>
              <td>
                <h1 style="margin:0;font-size:32px;font-weight:800;">
                  🔥 ToxicRush Esports
                </h1>
                <p style="margin:10px 0 30px 0;font-size:14px;opacity:0.9;">
                  Compete. Dominate. Win.
                </p>

                <p style="font-size:16px;margin-bottom:10px;">
                  Your One-Time Password
                </p>

                <div style="
                  display:inline-block;
                  background:white;
                  color:#111;
                  padding:18px 35px;
                  border-radius:12px;
                  font-size:28px;
                  font-weight:bold;
                  letter-spacing:6px;
                  margin:20px 0;">
                  ${otp}
                </div>

                <p style="font-size:14px;opacity:0.9;margin-top:20px;">
                  This OTP is valid for 5 minutes.
                </p>

                <p style="font-size:12px;opacity:0.7;margin-top:30px;">
                  If you didn’t request this, you can safely ignore this email.
                </p>

              </td>
            </tr>
          </table>

          <p style="color:#888;font-size:12px;margin-top:20px;">
            © ${new Date().getFullYear()} ToxicRush Esports
          </p>

        </td>
      </tr>
    </table>
  </div>
  `
})

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error("SEND OTP ERROR:", err)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}