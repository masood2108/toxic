import admin from "firebase-admin"

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  })
}

export const auth = admin.auth()
export const db = admin.firestore()
console.log("PROJECT ID:", process.env.FIREBASE_PROJECT_ID)
console.log("CLIENT EMAIL:", process.env.FIREBASE_CLIENT_EMAIL)
console.log("PRIVATE KEY EXISTS:", !!process.env.FIREBASE_PRIVATE_KEY)