// netlify/functions/get-users.js
// Server-side function that uses the service role key to read auth.users
// This never exposes the service role key to the browser

exports.handler = async (event) => {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Service role key not configured' }) }
  }

  try {
    // Fetch all auth users
    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    })
    const usersData = await usersRes.json()
    const users = usersData.users || []

    // Fetch all applications
    const appsRes = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=user_id,full_name,institution,field_of_study,score,bursaries,updated_at,results_url,avg,province`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    const apps = await appsRes.json()

    // Merge: every auth user + their application if exists
    const appMap = {}
    if (Array.isArray(apps)) {
      apps.forEach(a => { appMap[a.user_id] = a })
    }

    const merged = users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || appMap[u.id]?.full_name || null,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      has_application: !!appMap[u.id],
      application: appMap[u.id] || null,
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(merged),
    }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
