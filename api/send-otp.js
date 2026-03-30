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
  <div style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Inter',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background-color:#0a0a0a;">
      <tr>
        <td align="center">
          
          <table width="480" cellpadding="0" cellspacing="0" 
            style="background-color:#141414;
                   border: 1px solid #2a2a2a;
                   border-top: 4px solid #ff0057;
                   border-radius:12px;
                   padding:40px 30px;
                   text-align:center;
                   color:white;
                   box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
            
            <tr>
              <td>
                <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">
                  <span style="color:#ff0057;">Toxic</span>Rush Esports
                </h1>
                <p style="margin:8px 0 32px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">
                  Compete • Dominate • Win
                </p>

                <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;color:#eeeeee;">
                  Authentication Required
                </h2>
                <p style="font-size:15px;color:#a0a0a0;line-height:1.5;margin-bottom:28px;max-width:350px;margin-left:auto;margin-right:auto;">
                  Use the One-Time Password below to securely access your account and get back into the action.
                </p>

                <div style="
                  display:inline-block;
                  background-color: #1a1a1a;
                  border: 1px solid #ff0057;
                  color:#ff0057;
                  padding:18px 32px;
                  border-radius:8px;
                  font-size:32px;
                  font-weight:800;
                  letter-spacing:8px;
                  margin:10px 0;">
                  ${otp}
                </div>

                <div style="margin-top:32px;border-top:1px solid #2a2a2a;padding-top:24px;">
                  <p style="font-size:14px;color:#888;margin:0 0 8px 0;">
                    ⏳ This OTP expires in <strong style="color:#ddd;">5 minutes</strong>.
                  </p>
                  <p style="font-size:13px;color:#ff4444;margin:0;font-weight:500;">
                    ⚠️ Never share this code with anyone.
                  </p>
                </div>

              </td>
            </tr>
          </table>

          <table width="480" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr>
              <td align="center">
                <p style="color:#666;font-size:12px;line-height:1.6;margin:0;">
                  If you didn’t request this code, you can safely ignore this email. Someone may have typed your email address by mistake.<br><br>
                  © ${new Date().getFullYear()} ToxicRush Esports. All rights reserved.
                </p>
              </td>
            </tr>
          </table>

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