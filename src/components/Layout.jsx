// src/components/Layout.jsx
import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'

export const ADMIN_EMAILS = ['bongani3012@gmail.com']
export const BURSARY_ADMIN_EMAILS = ['nsfas@bursaries.gov.za','bursaries@eskom.co.za','nrf@research.ac.za','bursaries@transnet.net','bursaries@health.gov.za','funder@bursaryoffice.co.za']

export function isAdmin(s) { return ADMIN_EMAILS.includes(s?.user?.email) }
export function isBursaryAdmin(s) { return BURSARY_ADMIN_EMAILS.includes(s?.user?.email) }

export function RequireAdmin({ session }) {
  if (!isAdmin(session)) return (
    <div style={{ padding:'80px 40px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
      <h2 style={{ marginBottom:8 }}>Admin Only</h2>
      <p className="muted">You don't have permission to access this page.</p>
    </div>
  )
  return null
}

const STUDENT_NAV = [
  { to:'/',            icon:'⬡', label:'Dashboard'    },
  { to:'/apply',       icon:'✦', label:'Application'   },
  { to:'/career',      icon:'◈', label:'Career Match'  },
  { to:'/studenthub',  icon:'📚', label:'StudentHub'   },
  { to:'/news',        icon:'◉', label:'News Feed'     },
]
const ADMIN_NAV = [
  ...STUDENT_NAV,
  { to:'/analytics',   icon:'◎', label:'Analytics',       adminOnly:true },
  { to:'/review',      icon:'▣', label:'Review',           adminOnly:true },
  { to:'/accounts',    icon:'◑', label:'Accounts',         adminOnly:true },
]
const BURSARY_NAV = [
  { to:'/bursary-admin', icon:'🏛️', label:'My Applicants'  },
]

function SidebarContent({ session, onClose }) {
  const navigate = useNavigate()
  const admin = isAdmin(session)
  const bursaryAdmin = isBursaryAdmin(session)
  const NAV = bursaryAdmin ? BURSARY_NAV : admin ? ADMIN_NAV : STUDENT_NAV
  const name = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Student'

  const portalLabel = bursaryAdmin ? '🏛️ Funder Portal' : admin ? '👑 Admin Portal' : 'SA Student Portal'
  const portalColor = bursaryAdmin ? 'var(--blue)' : admin ? 'var(--purple)' : 'var(--muted)'

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ padding:'24px 20px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontFamily:'Space Grotesk', fontSize:20, fontWeight:700, color:'var(--gold)' }}>
            Bursary<span style={{ color:'var(--text)' }}>Link</span>
          </div>
          <div style={{ fontSize:11, color:portalColor, marginTop:3, letterSpacing:'0.5px' }}>{portalLabel}</div>
        </div>
        {onClose && <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--muted)',fontSize:20,cursor:'pointer' }}>✕</button>}
      </div>

      <nav style={{ flex:1, padding:'8px 12px', overflowY:'auto' }}>
        {admin && !bursaryAdmin && <div style={{ fontSize:10,color:'var(--muted)',padding:'6px 12px 4px',letterSpacing:'1px',textTransform:'uppercase' }}>Student</div>}
        {NAV.filter(n=>!n.adminOnly).map(n=>(
          <NavLink key={n.to} to={n.to} end={n.to==='/'} onClick={onClose}
            style={({isActive})=>({ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,marginBottom:2,fontSize:14,fontWeight:500,textDecoration:'none',color:isActive?'var(--gold)':'var(--muted)',background:isActive?'var(--gold-dim)':'transparent',transition:'all 0.15s' })}>
            <span style={{ fontSize:16,opacity:0.8 }}>{n.icon}</span>{n.label}
          </NavLink>
        ))}
        {admin && !bursaryAdmin && (
          <>
            <div style={{ fontSize:10,color:'var(--purple)',padding:'14px 12px 4px',letterSpacing:'1px',textTransform:'uppercase' }}>Admin</div>
            {NAV.filter(n=>n.adminOnly).map(n=>(
              <NavLink key={n.to} to={n.to} onClick={onClose}
                style={({isActive})=>({ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,marginBottom:2,fontSize:14,fontWeight:500,textDecoration:'none',color:isActive?'var(--purple)':'var(--muted)',background:isActive?'rgba(188,140,255,0.08)':'transparent',transition:'all 0.15s' })}>
                <span style={{ fontSize:16,opacity:0.8 }}>{n.icon}</span>{n.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div style={{ padding:'16px 20px', borderTop:'1px solid var(--border)' }}>
        <div style={{ fontSize:13,fontWeight:500,marginBottom:3 }}>{name}</div>
        <div style={{ fontSize:11,color:'var(--muted)',marginBottom:12,overflow:'hidden',textOverflow:'ellipsis' }}>{session?.user?.email}</div>
        <button className="btn btn-outline btn-sm" style={{ width:'100%' }} onClick={async()=>{ await signOut(); navigate('/auth') }}>Sign Out</button>
      </div>
    </div>
  )
}

export default function Layout({ session }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <div className="mobile-header" style={{ position:'fixed',top:0,left:0,right:0,zIndex:300,background:'var(--dark-2)',borderBottom:'1px solid var(--border)',padding:'12px 16px',alignItems:'center',justifyContent:'space-between' }}>
        <div style={{ fontFamily:'Space Grotesk',fontSize:18,fontWeight:700,color:'var(--gold)' }}>Bursary<span style={{ color:'var(--text)' }}>Link</span></div>
        <button onClick={()=>setMenuOpen(true)} style={{ background:'none',border:'none',color:'var(--text)',fontSize:22,cursor:'pointer' }}>☰</button>
      </div>
      {menuOpen && <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:199 }} onClick={()=>setMenuOpen(false)} />}
      <aside className={`sidebar${menuOpen?' open':''}`} style={{ width:'var(--sidebar-w)',background:'var(--dark-2)',borderRight:'1px solid var(--border)',height:'100vh',flexShrink:0 }}>
        <SidebarContent session={session} onClose={()=>setMenuOpen(false)} />
      </aside>
      <main className="main-content" style={{ flex:1,overflow:'auto',maxWidth:'calc(100vw - var(--sidebar-w))' }}>
        <div className="mobile-header" style={{ height:56 }} />
        <Outlet />
      </main>
    </div>
  )
}
