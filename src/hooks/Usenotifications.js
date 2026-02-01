import { useEffect, useState, useRef } from "react"
import { auth, db } from "../firebase"
import {
  collection,
  collectionGroup,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore"

export default function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [toasts, setToasts] = useState([])
  const previousStatuses = useRef({})

  /* ======================================================
     PAYMENT STATUS NOTIFICATIONS (APPROVE / REJECT)
     ====================================================== */
  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collectionGroup(db, "players"),
      where("email", "==", auth.currentUser.email)
    )

    const unsub = onSnapshot(q, snapshot => {
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data()
        const id = docSnap.id

        const currentStatus = data.paymentStatus
        const prevStatus = previousStatuses.current[id]

        if (
          prevStatus &&
          prevStatus !== currentStatus &&
          currentStatus &&
          currentStatus !== "pending"
        ) {
          const toast = {
            id: `${id}-${Date.now()}`,
            type: currentStatus,
            title:
              currentStatus === "approved"
                ? "Payment Accepted"
                : "Payment Rejected",
            message:
              currentStatus === "approved"
                ? "Room details will be shared shortly."
                : "Please re-upload your payment screenshot."
          }

          // Toast
          setToasts(prev => [...prev, toast])

          // Bell notification
          setNotifications(prev => [
            {
              ...toast,
              time: new Date().toLocaleTimeString()
            },
            ...prev
          ])

          // Auto-remove toast
          setTimeout(() => {
            setToasts(prev =>
              prev.filter(t => t.id !== toast.id)
            )
          }, 4000)
        }

        previousStatuses.current[id] = currentStatus
      })
    })

    return () => unsub()
  }, [])

  /* ======================================================
     BROADCAST NOTIFICATIONS (ADMIN → USERS)
     ====================================================== */
  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collection(db, "broadcasts"),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(q, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const data = change.doc.data()

          const toast = {
            id: change.doc.id,
            type: data.type || "info",
            title: data.title || "Announcement",
            message: data.message || ""
          }

          // Toast
          setToasts(prev => [...prev, toast])

          // Bell notification
          setNotifications(prev => [
            {
              ...toast,
              time: new Date().toLocaleTimeString()
            },
            ...prev
          ])

          // Auto-remove toast
          setTimeout(() => {
            setToasts(prev =>
              prev.filter(t => t.id !== toast.id)
            )
          }, 4000)
        }
      })
    })

    return () => unsub()
  }, [])

  /* ======================================================
     PUBLIC API
     ====================================================== */
  return {
    notifications,
    toasts,
    unreadCount: notifications.length,
    clearNotifications: () => setNotifications([]),
    removeToast: id =>
      setToasts(prev => prev.filter(t => t.id !== id))
  }
}
