// src/lib/scoring.js

export function scoreApplicant(data) {
  let score = 0
  const avg = parseFloat(data.avg) || 0
  const income = parseFloat(data.monthly_income) || 0

  // Academic (35pts)
  if (avg >= 80) score += 35
  else if (avg >= 70) score += 28
  else if (avg >= 60) score += 20
  else if (avg >= 50) score += 10

  // Financial need (30pts)
  if (income <= 3000) score += 30
  else if (income <= 8000) score += 24
  else if (income <= 15000) score += 16
  else if (income <= 30000) score += 8

  // Equity (20pts)
  const raceScore = { African: 16, Coloured: 12, 'Indian/Asian': 12, White: 4 }
  score += raceScore[data.race] || 4
  if (data.gender === 'Female') score += 4

  // Statement quality (10pts)
  const words = (data.statement || '').trim().split(/\s+/).length
  if (words >= 100) score += 10
  else if (words >= 50) score += 6
  else if (words >= 20) score += 3

  // Disability (5pts)
  if (data.disability && data.disability !== 'None') score += 5

  return Math.min(100, score)
}

export function matchBursaries(data) {
  const matches = []
  const avg = parseFloat(data.avg) || 0
  const math = parseFloat(data.s_math) || 0
  const sci = parseFloat(data.s_science) || 0
  const income = parseFloat(data.monthly_income) || 999999
  const field = data.field_of_study || ''

  if (income <= 29167) matches.push('NSFAS')
  if (['Engineering', 'Computer Science / IT', 'Commerce / Accounting'].some(f => field.includes(f.split(' ')[0])) && math >= 60 && sci >= 60 && avg >= 65)
    matches.push('Eskom')
  if (avg >= 70) matches.push('NRF')
  if (avg >= 60 && ['Engineering', 'Computer', 'Commerce', 'Finance'].some(f => field.includes(f)))
    matches.push('Transnet')
  if (field.includes('Medicine') || field.includes('Health'))
    matches.push('Dept of Health')
  if (avg >= 65 && ['Engineering', 'Science', 'Computer'].some(f => field.includes(f)))
    matches.push('Sasol')
  return matches
}

// Career match scoring — returns array of {career, pct, reason}
export function careerMatches(subjects) {
  const math = parseFloat(subjects.math) || 0
  const sci = parseFloat(subjects.science) || 0
  const eng = parseFloat(subjects.english) || 0
  const acc = parseFloat(subjects.accounting) || 0
  const bio = parseFloat(subjects.biology) || 0

  const careers = [
    {
      career: 'Software Engineer',
      pct: Math.round((math * 0.5 + sci * 0.3 + eng * 0.2)),
      reason: 'Strong Maths & Science foundation required',
      bursaries: ['Eskom', 'Transnet', 'Vodacom'],
      field: 'Computer Science / IT',
    },
    {
      career: 'Civil / Structural Engineer',
      pct: Math.round((math * 0.55 + sci * 0.35 + eng * 0.1)),
      reason: 'Maths & Physical Sciences are core',
      bursaries: ['Eskom', 'Transnet', 'Aveng'],
      field: 'Engineering',
    },
    {
      career: 'Medical Doctor',
      pct: Math.round((bio * 0.45 + sci * 0.35 + eng * 0.2)),
      reason: 'Life Sciences & Chemistry critical',
      bursaries: ['Dept of Health', 'NSFAS'],
      field: 'Medicine / Health Sciences',
    },
    {
      career: 'Chartered Accountant (CA)',
      pct: Math.round((acc * 0.5 + math * 0.35 + eng * 0.15)),
      reason: 'Accounting & Mathematics are pillars',
      bursaries: ['SAICA', 'PwC', 'Deloitte', 'NSFAS'],
      field: 'Commerce / Accounting',
    },
    {
      career: 'Data Scientist',
      pct: Math.round((math * 0.55 + sci * 0.25 + eng * 0.2)),
      reason: 'Statistics & analytical reasoning key',
      bursaries: ['NRF', 'Standard Bank', 'Vodacom'],
      field: 'Computer Science / IT',
    },
    {
      career: 'Electrical Engineer',
      pct: Math.round((math * 0.5 + sci * 0.4 + eng * 0.1)),
      reason: 'Physics & Maths are critical',
      bursaries: ['Eskom', 'Transnet'],
      field: 'Engineering',
    },
    {
      career: 'Environmental Scientist',
      pct: Math.round((bio * 0.4 + sci * 0.35 + eng * 0.25)),
      reason: 'Life Sciences & Geography relevant',
      bursaries: ['NRF', 'Dept of Forestry'],
      field: 'Natural Sciences',
    },
    {
      career: 'Pharmacist',
      pct: Math.round((bio * 0.4 + sci * 0.4 + math * 0.2)),
      reason: 'Chemistry & Life Sciences essential',
      bursaries: ['Dept of Health', 'NSFAS'],
      field: 'Medicine / Health Sciences',
    },
    {
      career: 'Attorney / Lawyer',
      pct: Math.round((eng * 0.7 + math * 0.15 + (acc || 50) * 0.15)),
      reason: 'Language & critical thinking paramount',
      bursaries: ['NSFAS', 'Legal Aid SA'],
      field: 'Law',
    },
    {
      career: 'Teacher / Educator',
      pct: Math.round((eng * 0.4 + math * 0.3 + bio * 0.3)),
      reason: 'Communication & subject knowledge',
      bursaries: ['NSFAS', 'SACE Funza Lushaka'],
      field: 'Education',
    },
  ]

  return careers
    .map(c => ({ ...c, pct: Math.min(99, Math.max(10, c.pct)) }))
    .filter(c => c.pct >= 75)
    .sort((a, b) => b.pct - a.pct)
}
