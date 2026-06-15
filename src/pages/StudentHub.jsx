// src/pages/StudentHub.jsx
import { useState, useEffect } from 'react'
import { supabase, getUser } from '../lib/supabase'

const SA_COURSES = {
  'BSc Computer Science': { years:3, modules: {
    1: ['Introduction to Programming','Discrete Mathematics','Computer Architecture','English Communication','Mathematics 1A','Mathematics 1B'],
    2: ['Data Structures & Algorithms','Operating Systems','Database Systems','Software Engineering','Networks','Statistics'],
    3: ['Artificial Intelligence','Machine Learning','Computer Security','Distributed Systems','Project Management','Final Year Project'],
  }},
  'BCom Accounting': { years:3, modules: {
    1: ['Financial Accounting 1','Business Management','Economics 1A','Economics 1B','Commercial Law','Business Statistics'],
    2: ['Financial Accounting 2','Management Accounting','Taxation 1','Auditing 1','Corporate Law','Financial Management'],
    3: ['Financial Accounting 3','Management Accounting 3','Taxation 2','Auditing 2','Strategic Management','Research Project'],
  }},
  'BEng Electrical': { years:4, modules: {
    1: ['Engineering Mathematics 1','Physics 1','Engineering Drawing','Introduction to EE','Computer Programming','Chemistry'],
    2: ['Engineering Mathematics 2','Circuit Theory','Electronics','Electromagnetics','Signals & Systems','Thermodynamics'],
    3: ['Control Systems','Power Systems','Digital Electronics','Communications','Instrumentation','Engineering Management'],
    4: ['Power Electronics','Renewable Energy','Advanced Control','VLSI Design','Research Methodology','Final Year Project'],
  }},
  'MBChB Medicine': { years:6, modules: {
    1: ['Anatomy','Physiology','Biochemistry','Medical Ethics','Psychology','Community Health'],
    2: ['Pathology','Pharmacology','Microbiology','Clinical Skills','Immunology','Genetics'],
    3: ['Internal Medicine','Surgery','Paediatrics','Obstetrics & Gynaecology','Psychiatry','Family Medicine'],
    4: ['Clinical Rotations — Internal Medicine','Clinical Rotations — Surgery','Emergency Medicine','Radiology','Dermatology','Ophthalmology'],
    5: ['Advanced Clinical Rotations','Research Project','Public Health','Forensic Medicine','Elective','Community Health'],
    6: ['Internship Preparation','Advanced Pathology','Clinical Research','Professional Practice','Ethics & Law','Final Examinations'],
  }},
  'LLB Law': { years:4, modules: {
    1: ['Introduction to Law','Constitutional Law','Legal Writing','Criminal Law','Law of Persons','Jurisprudence'],
    2: ['Contract Law','Law of Delict','Property Law','Administrative Law','Family Law','Legal Research'],
    3: ['Commercial Law','Labour Law','Tax Law','Procedural Law','Intellectual Property','Environmental Law'],
    4: ['Advanced Constitutional Law','International Law','Legal Practice','Moot Court','Dissertation','Professional Ethics'],
  }},
  'BA Education': { years:4, modules: {
    1: ['Introduction to Education','Child Development','Philosophy of Education','Communication Skills','Mathematics Education','Literacy Education'],
    2: ['Curriculum Studies','Educational Psychology','Assessment & Evaluation','Inclusive Education','ICT in Education','Teaching Practice 1'],
    3: ['Specialisation Subject 1','Specialisation Subject 2','Research Methodology','Teaching Practice 2','Education Management','Community Engagement'],
    4: ['Advanced Specialisation','Education Policy','Leadership in Education','Teaching Practice 3','Research Project','Professional Development'],
  }},
}

const GRADE_OPTS = ['A+ (90-100)','A (80-89)','B+ (75-79)','B (70-74)','C+ (65-69)','C (60-64)','D (50-59)','F (Below 50)']

function gradeToNum(g) {
  const map = {'A+ (90-100)':95,'A (80-89)':84,'B+ (75-79)':77,'B (70-74)':72,'C+ (65-69)':67,'C (60-64)':62,'D (50-59)':54,'F (Below 50)':40}
  return map[g] || 0
}

function gpa(results) {
  const vals = Object.values(results).map(gradeToNum).filter(v=>v>0)
  if (!vals.length) return 0
  return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)
}

export default function StudentHub() {
  const [profile, setProfile] = useState(null)
  const [course, setCourse] = useState('')
  const [currentYear, setCurrentYear] = useState(1)
  const [results, setResults] = useState({}) // { 'year_semester': { module: grade } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [activeYear, setActiveYear] = useState(1)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const user = await getUser()
    if (!user) return
    const { data } = await supabase.from('student_hub').select('*').eq('user_id', user.id).single().catch(()=>({data:null}))
    if (data) { setProfile(data); setCourse(data.course||''); setCurrentYear(data.current_year||1); setResults(data.results||{}); setActiveYear(data.current_year||1) }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true); setMsg(null)
    const user = await getUser()
    await supabase.from('student_hub').upsert({ user_id:user.id, course, current_year:currentYear, results, updated_at:new Date().toISOString() })
    setMsg({ type:'success', text:'✅ Progress saved!' })
    setSaving(false)
    setTimeout(()=>setMsg(null), 3000)
  }

  const setGrade = (year, module, grade) => {
    const key = `year_${year}`
    setResults(prev => ({ ...prev, [key]: { ...(prev[key]||{}), [module]: grade } }))
  }

  const courseData = SA_COURSES[course]
  const yearModules = courseData?.modules[activeYear] || []
  const yearResults = results[`year_${activeYear}`] || {}

  // Overall GPA across all years
  const allGrades = Object.values(results).flatMap(yr => Object.values(yr)).map(gradeToNum).filter(v=>v>0)
  const overallGPA = allGrades.length ? (allGrades.reduce((a,b)=>a+b,0)/allGrades.length).toFixed(1) : null

  // At-risk check
  const yearGpa = gpa(yearResults)
  const atRisk = parseFloat(yearGpa) < 60 && Object.keys(yearResults).length > 0

  if (loading) return <div style={{ padding:80, textAlign:'center' }}><div className="spinner" style={{ margin:'0 auto' }} /></div>

  return (
    <div className="page-wrap">
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26, marginBottom:6 }}>StudentHub</h1>
        <p className="muted" style={{ fontSize:14 }}>Track your university modules, semester results and academic progress.</p>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
      {atRisk && <div className="alert alert-error" style={{ marginBottom:16 }}>⚠️ <strong>At-Risk Alert:</strong> Your Year {activeYear} average is below 60%. Consider reaching out to your academic advisor or student support services.</div>}

      {/* Course Setup */}
      {!course ? (
        <div className="card">
          <h2 style={{ fontSize:16, marginBottom:6 }}>Set Up Your Course</h2>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>Select your qualification to load your expected modules automatically.</p>
          <div className="form-group">
            <label>Your Qualification</label>
            <select value={course} onChange={e=>setCourse(e.target.value)}>
              <option value="">Select your degree…</option>
              {Object.keys(SA_COURSES).map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Current Year of Study</label>
            <select value={currentYear} onChange={e=>setCurrentYear(Number(e.target.value))}>
              {[1,2,3,4,5,6].map(y=><option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <button className="btn btn-gold" onClick={saveProfile} disabled={!course || saving}>{saving?'Saving…':'Set Up My Hub'}</button>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }} className="stats-grid">
            {[
              { label:'Qualification', value:course.replace('BSc','').replace('BCom','').replace('BEng','').replace('MBChB','').replace('LLB','').replace('BA','').trim(), color:'var(--gold)' },
              { label:'Current Year', value:`Year ${currentYear}`, color:'var(--blue)' },
              { label:'Year '+activeYear+' Average', value: Object.keys(yearResults).length ? yearGpa+'%' : '—', color: parseFloat(yearGpa)>=70?'var(--green)':parseFloat(yearGpa)>=60?'var(--gold)':'var(--red)' },
              { label:'Overall GPA', value: overallGPA ? overallGPA+'%' : '—', color:'var(--purple)' },
            ].map(s=>(
              <div key={s.label} className="card" style={{ padding:'16px 18px', margin:0 }}>
                <div style={{ fontSize:22, fontWeight:700, fontFamily:'Space Grotesk', color:s.color, marginBottom:4 }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Progress bar per year */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <h3 style={{ fontSize:15 }}>Academic Progress — {course}</h3>
              <button className="btn btn-outline btn-sm" onClick={()=>{setCourse('');setResults({})}}>Change Course</button>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
              {Array.from({length:courseData.years},(_,i)=>i+1).map(y=>(
                <button key={y} onClick={()=>setActiveYear(y)}
                  className={`btn btn-sm ${activeYear===y?'btn-gold':'btn-outline'}`}>
                  Year {y} {results[`year_${y}`] && Object.keys(results[`year_${y}`]).length>0 ? '✓' : ''}
                </button>
              ))}
            </div>

            {/* Modules for active year */}
            <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>
              Year {activeYear} — {yearModules.length} modules. Enter your results below.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {yearModules.map(mod => {
                const grade = yearResults[mod] || ''
                const num = gradeToNum(grade)
                const col = num>=75?'var(--green)':num>=60?'var(--gold)':num>0?'var(--red)':'var(--border)'
                return (
                  <div key={mod} style={{ background:'var(--dark-3)', border:`1px solid ${grade?col:'var(--border)'}`, borderRadius:8, padding:'12px 14px', transition:'border-color 0.2s' }}>
                    <div style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>{mod}</div>
                    <select value={grade} onChange={e=>setGrade(activeYear,mod,e.target.value)}
                      style={{ fontSize:12, padding:'6px 10px' }}>
                      <option value="">Not yet entered</option>
                      {GRADE_OPTS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-gold" onClick={saveProfile} disabled={saving}>{saving?'Saving…':'Save Progress'}</button>
          </div>
        </>
      )}
    </div>
  )
}
