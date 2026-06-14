// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'


const NAV = [
  { to: '/',        icon: '⬡', label: 'Dashboard'   },
  { to: '/apply',   icon: '✦', label: 'Application'  },
  { to: '/career',  icon: '◈', label: 'Career Match' },
  { to: '/news',    icon: '◉', label: 'News Feed'    },
  { to: '/review',  icon: '▣', label: 'Review (Admin)' },
]

export default function Layout({ session }) {
  const navigate = useNavigate()
  const name = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Student'

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 220, background: 'var(--dark-2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0
      }}>
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
            Bursary<span style={{ color: 'var(--text)' }}>Link</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, letterSpacing: '0.5px' }}>SA Student Portal</div>
        </div>

        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                color: isActive ? 'var(--gold)' : 'var(--muted)',
                background: isActive ? 'var(--gold-dim)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16, opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session?.user?.email}
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleSignOut} style={{ width: '100%' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflow: 'auto', maxWidth: 'calc(100vw - 220px)' }}>
        <Outlet />
      </main>
    </div>
  )
}
