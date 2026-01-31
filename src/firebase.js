// Firebase core
import { initializeApp } from "firebase/app"

// Firebase services you will use
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZLk8SOJ6vI1Z2knZOKanvMlBX825o5tw",
  authDomain: "toxic-2004d.firebaseapp.com",
  projectId: "toxic-2004d",
  storageBucket: "toxic-2004d.firebasestorage.app",
  messagingSenderId: "660451932741",
  appId: "1:660451932741:web:d3ccc887e1d84c1f06012c"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Export Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
