// netlify/functions/notify.js
// Sends email notification when a student is shortlisted
// Uses Resend (free tier: 3000 emails/month) — sign up at resend.com

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  const RESEND_KEY = process.env.RESEND_API_KEY
  if (!RESEND_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }

  const { to, studentName, score, bursaries } = JSON.parse(event.body || '{}')
  if (!to || !studentName) return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0B0F17;color:#E6EDF3;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#1C2333,#141923);padding:32px;text-align:center;border-bottom:1px solid #2A3347">
        <div style="font-size:28px;font-weight:700;color:#C9A84C">BursaryLink</div>
        <div style="font-size:13px;color:#7A8799;margin-top:4px">SA Student Portal</div>
      </div>
      <div style="padding:32px">
        <h2 style="color:#3FB950;margin-bottom:8px">🎉 Congratulations, ${studentName}!</h2>
        <p style="color:#7A8799;font-size:14px;line-height:1.7;margin-bottom:20px">
          You have been <strong style="color:#E6EDF3">shortlisted</strong> by BursaryLink based on your application.
          Your eligibility score of <strong style="color:#C9A84C">${score}/100</strong> qualifies you for further consideration.
        </p>
        ${bursaries?.length > 0 ? `
        <div style="background:#1C2333;border:1px solid #2A3347;border-radius:8px;padding:16px;margin-bottom:20px">
          <div style="font-size:11px;color:#7A8799;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Matched Bursaries</div>
          ${bursaries.map(b => `<span style="display:inline-block;background:rgba(88,166,255,0.1);color:#58A6FF;border:1px solid rgba(88,166,255,0.2);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;margin:3px">${b}</span>`).join('')}
        </div>` : ''}
        <div style="background:#1C2333;border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:16px;margin-bottom:24px">
          <div style="font-size:13px;color:#C9A84C;font-weight:600;margin-bottom:6px">⚡ Next Steps</div>
          <ul style="font-size:13px;color:#7A8799;line-height:1.8;padding-left:18px;margin:0">
            <li>Log in to BursaryLink to check your application status</li>
            <li>Make sure your results document is uploaded</li>
            <li>Watch for further communication from our team</li>
          </ul>
        </div>
        <a href="https://bursarylink-sa.netlify.app" style="display:block;text-align:center;background:#C9A84C;color:#0B0F17;padding:13px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none">
          Log In to BursaryLink →
        </a>
      </div>
      <div style="padding:20px;text-align:center;font-size:11px;color:#7A8799;border-top:1px solid #2A3347">
        BursaryLink — South Africa's Smart Student Portal
      </div>
    </div>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BursaryLink <notifications@bursarylink.co.za>',
        to: [to],
        subject: `🎉 You've been shortlisted — BursaryLink`,
        html,
      })
    })
    const data = await res.json()
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
