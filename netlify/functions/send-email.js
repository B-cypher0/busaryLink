// netlify/functions/send-email.js
// Sends emails via Resend (free tier: 3000 emails/month)
// Sign up at resend.com and add RESEND_API_KEY to Netlify env vars

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }

  const { to, subject, html } = JSON.parse(event.body || '{}')
  if (!to || !subject || !html) return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'BursaryLink <notifications@bursarylink-sa.netlify.app>',
        to: [to], subject, html
      })
    })
    const data = await res.json()
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
