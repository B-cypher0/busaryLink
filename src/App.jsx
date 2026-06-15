// src/App.jsx
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Apply from './pages/Apply'
import Career from './pages/Career'
import News from './pages/News'
import Review from './pages/Review'
import Accounts from './pages/Accounts'
import Analytics from './pages/Analytics'
import FunderPortal from './pages/FunderPortal'
import StudentHub from './pages/StudentHub'
import BursaryAdmin from './pages/BursaryAdmin'
import Layout, { RequireAdmin } from './components/Layout'
import './index.css'

function AdminRoute({ session, children }) {
  return <><RequireAdmin session={session} />{children}</>
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div className="loading-screen">
      <div className="logo-big">Bursary<span>Link</span></div>
      <div className="spinner" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        {!session ? (
          <><Route path="/auth" element={<Auth />} /><Route path="*" element={<Navigate to="/auth" />} /></>
        ) : (
          <Route element={<Layout session={session} />}>
            <Route path="/"              element={<Dashboard session={session} />} />
            <Route path="/apply"         element={<Apply session={session} />} />
            <Route path="/career"        element={<Career />} />
            <Route path="/news"          element={<News />} />
            <Route path="/studenthub"    element={<StudentHub />} />
            <Route path="/bursary-admin" element={<BursaryAdmin session={session} />} />
            <Route path="/funder"        element={<FunderPortal session={session} />} />
            <Route path="/analytics"     element={<AdminRoute session={session}><Analytics /></AdminRoute>} />
            <Route path="/review"        element={<AdminRoute session={session}><Review /></AdminRoute>} />
            <Route path="/accounts"      element={<AdminRoute session={session}><Accounts /></AdminRoute>} />
            <Route path="*"              element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}
