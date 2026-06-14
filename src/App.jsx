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
import Layout from './components/Layout'
import './index.css'

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
          <>
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/auth" />} />
          </>
        ) : (
          <Route element={<Layout session={session} />}>
            <Route path="/" element={<Dashboard session={session} />} />
            <Route path="/apply" element={<Apply session={session} />} />
            <Route path="/career" element={<Career />} />
            <Route path="/news" element={<News />} />
            <Route path="/review" element={<Review />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}
