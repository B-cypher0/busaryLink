// src/pages/Auth.jsx
import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setMsg({ type: 'error', text: 'Email and password required.' }); return }
    setLoading(true); setMsg(null)
    try {
      if (mode === 'login') {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
      } else {
        if (!form.full_name) { setMsg({ type: 'error', text: 'Full name required.' }); setLoading(false); return }
        const { error } = await signUp(form.email, form.password, { full_name: form.full_name })
        if (error) throw error
        setMsg({ type: 'success', text: 'Account created! Check your email to confirm, then sign in.' })
        setMode('login')
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--dark)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      {/* BG accent */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 32, fontWeight: 700, color: 'var(--gold)' }}>
            Bursary<span style={{ color: 'var(--text)' }}>Link</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
            South Africa's Smart Student Portal
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--dark-3)', borderRadius: 8,
            padding: 3, marginBottom: 28, gap: 3,
          }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setMsg(null) }} style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: 6,
                fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                background: mode === m ? 'var(--dark-4)' : 'transparent',
                color: mode === m ? 'var(--gold)' : 'var(--muted)',
                transition: 'all 0.15s',
              }}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

          {mode === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input placeholder="e.g. Sipho Dlamini" value={form.full_name}
                onChange={e => set('full_name', e.target.value)} />
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@email.com" value={form.email}
              onChange={e => set('email', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <button className="btn btn-gold btn-lg" style={{ width: '100%', marginTop: 8 }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--muted)' }}>
          By continuing you agree to BursaryLink's terms of use.
        </div>
      </div>
    </div>
  )
}
