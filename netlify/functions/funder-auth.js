// netlify/functions/funder-auth.js
// Simple funder portal authentication using env-stored credentials
// Funders get a username+password, no Supabase account needed

const FUNDERS = {
  'ukzn-financial-aid': { password: process.env.FUNDER_PASS_UKZN || 'ukzn2025', name: 'UKZN Financial Aid', filter: { field: 'all', minScore: 60 } },
  'eskom-bursaries':    { password: process.env.FUNDER_PASS_ESKOM || 'eskom2025', name: 'Eskom Bursary Programme', filter: { field: 'Engineering', minScore: 65 } },
  'nsfas-portal':       { password: process.env.FUNDER_PASS_NSFAS || 'nsfas2025', name: 'NSFAS', filter: { field: 'all', minScore: 50 } },
}

exports.handler = async (event) => {
  const { username, password } = JSON.parse(event.body || '{}')
  const funder = FUNDERS[username]
  if (!funder || funder.password !== password) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) }
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ name: funder.name, username, filter: funder.filter, token: Buffer.from(`${username}:${password}`).toString('base64') })
  }
}
