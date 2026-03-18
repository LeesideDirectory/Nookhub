import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Synchronously read the cached Supabase session from localStorage.
// Supabase JS v2 stores it under a key matching /sb-.*-auth-token/.
// This lets us bootstrap user + loading state on the very first render,
// so returning users never see the loading spinner at all.
// ---------------------------------------------------------------------------
function getCachedUser() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (/^sb-.+-auth-token$/.test(key)) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const session = JSON.parse(raw)
        const user = session?.user
        const expiresAt = session?.expires_at   // Unix seconds
        // Treat as valid only if token is not expired (with 30s buffer)
        if (user?.id && (!expiresAt || Date.now() / 1000 + 30 < expiresAt)) {
          return user
        }
      }
    }
  } catch {}
  return null
}

export function useAuth() {
  // Bootstrap synchronously from localStorage cache so we never block the
  // first render for users who already have a valid session.
  const [user,    setUser]    = useState(() => getCachedUser())
  const [profile, setProfile] = useState(null)
  // loading = false if we already have a cached user (no spinner needed).
  // loading = true  if we have no cached user (must wait for getSession).
  const [loading, setLoading] = useState(() => !getCachedUser())
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    // Confirm / refresh the session in the background.
    // If the cached user was valid, this is just a background verification.
    // If the token was actually expired, this corrects user → null.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)       // always unblock after first real check
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setProfileLoading(false) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // INITIAL_SESSION is handled by the explicit getSession() call above.
      // Skipping it here prevents a race condition where INITIAL_SESSION fires
      // asynchronously *after* getSession() has already confirmed a valid user,
      // briefly setting user → null and unmounting DashboardPage permanently.
      if (_event === 'INITIAL_SESSION') return
      setUser(session?.user ?? null)
      setLoading(false)       // unblock on every auth state change
      if (session?.user) {
        setProfileLoading(true)
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setProfileLoading(false)
  }

  async function signUp({ email, password, name, handle }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, handle },
          emailRedirectTo: import.meta.env.VITE_SITE_URL || 'https://nook-hub.com',
        }
      })
      if (error) return { error: error.message }

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          name: name || email.split('@')[0],
          handle: handle || '@' + email.split('@')[0],
          bio: '',
          avatar_color: ['#C9B8F0','#B4E8D8','#F8CEBA','#B8D8F0','#F0B8C8'][Math.floor(Math.random()*5)],
          created_at: new Date().toISOString()
        })
      }
      return { data, error: null }
    } catch (e) {
      return { error: e.message }
    }
  }

  async function signIn({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { data, error: null }
    } catch (e) {
      return { error: e.message }
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
    if (error) throw error
    setProfile(prev => ({ ...prev, ...updates }))
  }

  return { user, profile, loading, profileLoading, signUp, signIn, signOut, updateProfile }
}
