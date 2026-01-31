import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState } from "react"
import Lobby from "./pages/Lobby"

import AdminGameSelect  from "./pages/AdminGameSelect"
import AdminGameDashboard  from "./pages/AdminGameDashboard"
import Profile from "./pages/Profile"
import FinishLogin from "./pages/FinishLogin"


import LoadingScreen from "./components/LoadingScreen"
import ProtectedRoute from "./components/ProtectedRoute"

import Auth from "./pages/Auth"
import Games from "./pages/Games"

export default function App() {

  const [loading, setLoading] = useState(true)

  if (loading) {
    return <LoadingScreen onFinish={() => setLoading(false)} />
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Auth />} />

        {/* PROTECTED GAME SCREEN */}
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <Games />
            </ProtectedRoute>
          }
        />
        <Route
  path="/lobby/:gameId"
  element={
    <ProtectedRoute>
      <Lobby />
    </ProtectedRoute>
  }
/>
<Route path="/admin" element={<AdminGameSelect />} />
<Route path="/admin/game/:gameId" element={<AdminGameDashboard />} />
<Route path="/profile" element={<Profile />} />

<Route path="/finish-login" element={<FinishLogin />} />

      </Routes>
    </BrowserRouter>
  )
}
