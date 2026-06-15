// netlify/functions/funder-data.js
// Returns filtered applicants for a specific funder

const FUNDERS = {
  'ukzn-financial-aid': { name: 'UKZN Financial Aid', minScore: 60, field: 'all' },
  'eskom-bursaries':    { name: 'Eskom Bursary Programme', minScore: 65, field: 'Engineering' },
  'nsfas-portal':       { name: 'NSFAS', minScore: 50, field: 'all' },
}

exports.handler = async (event) => {
  const token = event.headers.authorization?.replace('Bearer ', '')
  if (!token) return { statusCode: 401, body: 'Unauthorized' }

  const [username, password] = Buffer.from(token, 'base64').toString().split(':')
  const funder = FUNDERS[username]
  if (!funder) return { statusCode: 401, body: 'Invalid token' }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    let query = `${SUPABASE_URL}/rest/v1/applications?select=full_name,institution,field_of_study,score,avg,bursaries,province,results_url,updated_at,s_math,s_science,s_english&score=gte.${funder.minScore}&order=score.desc`
    if (funder.field !== 'all') query += `&field_of_study=ilike.*${funder.field}*`

    const res = await fetch(query, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    })
    const data = await res.json()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ funder: funder.name, count: data.length, applicants: data })
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
