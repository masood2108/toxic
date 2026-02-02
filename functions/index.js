import functions from "firebase-functions"
import admin from "firebase-admin"
import Razorpay from "razorpay"

admin.initializeApp()
const db = admin.firestore()

const razorpay = new Razorpay({
  key_id: functions.config().razorpay.key_id,
  key_secret: functions.config().razorpay.key_secret
})

export const approveWithdrawal = functions.https.onCall(
  async ({ withdrawalId }, context) => {

    // 🔐 SECURITY: only admin
    const email = context.auth?.token?.email
    if (!email || ![
      "masoodhussainr8@gmail.com",
      "officialtoxicrush.esports@gmail.com"
    ].includes(email)) {
      throw new functions.https.HttpsError("permission-denied")
    }

    const ref = db.collection("withdrawals").doc(withdrawalId)
    const snap = await ref.get()

    if (!snap.exists) {
      throw new functions.https.HttpsError("not-found")
    }

    const w = snap.data()
    if (w.status !== "pending") {
      throw new functions.https.HttpsError("failed-precondition")
    }

    // 💳 Razorpay payout
    const payout = await razorpay.payouts.create({
      account_number: "23232300232323",
      amount: w.amount * 100,
      currency: "INR",
      mode: "UPI",
      purpose: "payout",
      fund_account: {
        account_type: "vpa",
        vpa: { address: w.upiId }
      },
      reference_id: withdrawalId,
      narration: "ToxicRush Withdrawal"
    })

    // ✅ Update Firestore
    await ref.update({
      status: "approved",
      razorpayPayoutId: payout.id,
      processedAt: Date.now(),
      processedBy: email
    })

    return { success: true }
  }
)
