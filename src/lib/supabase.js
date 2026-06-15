// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Auth helpers ──────────────────────────────────────────────
export const signUp = (email, password, meta) =>
  supabase.auth.signUp({ email, password, options: { data: meta } })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Applications ──────────────────────────────────────────────
export const saveApplication = async (data) => {
  const user = await getUser()
  return supabase.from('applications').upsert({
    ...data,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  })
}

export const getMyApplication = async () => {
  const user = await getUser()
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .single()
  return data
}

export const getAllApplications = async () => {
  const { data } = await supabase
    .from('applications')
    .select('*')
    .order('score', { ascending: false })
  return data || []
}

// ── File uploads ──────────────────────────────────────────────
export const uploadResultsDoc = async (file) => {
  const user = await getUser()
  const ext = file.name.split('.').pop()
  const path = `${user.id}/results.${ext}`
  const { error } = await supabase.storage
    .from('results-docs')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('results-docs').getPublicUrl(path)
  return data.publicUrl
}
