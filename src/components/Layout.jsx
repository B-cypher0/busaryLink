// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'

const ADMIN_EMAILS = [
  'bongani3012@gmail.com',
]

export function isAdmin(session) {
  return ADMIN_EMAILS.includes(session?.user?.email)
}

export function RequireAdmin({ session }) {
  if (!isAdmin(session)) {
    return (
      <div style={{ padding: '80px 48px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 22, marginBottom: 8, color: 'var(--text)' }}>Admin Only</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>You do not have permission to access this page.</p>
      </div>
    )
  }
  return null
}

const STUDENT_NAV = [
  { to: '/',       icon: '⬡', label: 'Dashboard'   },
  { to: '/apply',  icon: '✦', label: 'Application'  },
  { to: '/career', icon: '◈', label: 'Career Match' },
  { to: '/news',   icon: '◉', label: 'News Feed'    },
]

const ADMIN_NAV = [
  ...STUDENT_NAV,
  { to: '/review',   icon: '▣', label: 'Review',   adminOnly: true },
  { to: '/accounts', icon: '◑', label: 'Accounts', adminOnly: true },
]

export default function Layout({ session }) {
  const navigate = useNavigate()
  const admin = isAdmin(session)
  const NAV = admin ? ADMIN_NAV : STUDENT_NAV
  const name = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Student'

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 225, background: 'var(--dark-2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0
      }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
            Bursary<span style={{ color: 'var(--text)' }}>Link</span>
          </div>
          <div style={{ fontSize: 11, color: admin ? 'var(--purple)' : 'var(--muted)', marginTop: 4, letterSpacing: '0.5px' }}>
            {admin ? '👑 Admin Portal' : 'SA Student Portal'}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {admin && (
            <div style={{ fontSize: 10, color: 'var(--muted)', padding: '6px 12px 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Student
            </div>
          )}
          {NAV.filter(n => !n.adminOnly).map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: isActive ? 'var(--gold)' : 'var(--muted)',
                background: isActive ? 'var(--gold-dim)' : 'transparent',
                transition: 'all 0.15s',
              })}>
              <span style={{ fontSize: 16, opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}

          {admin && (
            <>
              <div style={{ fontSize: 10, color: 'var(--purple)', padding: '14px 12px 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Admin
              </div>
              {NAV.filter(n => n.adminOnly).map(n => (
                <NavLink key={n.to} to={n.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                    fontSize: 14, fontWeight: 500, textDecoration: 'none',
                    color: isActive ? 'var(--purple)' : 'var(--muted)',
                    background: isActive ? 'rgba(188,140,255,0.08)' : 'transparent',
                    transition: 'all 0.15s',
                  })}>
                  <span style={{ fontSize: 16, opacity: 0.8 }}>{n.icon}</span>
                  {n.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session?.user?.email}
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleSignOut} style={{ width: '100%' }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', maxWidth: 'calc(100vw - 225px)' }}>
        <Outlet />
      </main>
    </div>
  )
}
