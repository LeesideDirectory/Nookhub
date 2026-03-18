import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Client-side rate limiting — localStorage-backed sliding window.
// Acts as a first line of defence (UX guard) before the request ever hits
// the Netlify Edge Function. Limits are intentionally slightly tighter than
// the server-side limits so users get fast feedback.
//
// Limits (per operation, per browser):
//   login          — 5 attempts per 15 minutes
//   signup         — 3 attempts per hour
//   reset-password — 3 attempts per 15 minutes
// ---------------------------------------------------------------------------
const CLIENT_LIMITS = {
  login:           { max: 5, windowMs: 15 * 60 * 1000 },
  signup:          { max: 3, windowMs: 60 * 60 * 1000 },
  'reset-password':{ max: 3, windowMs: 15 * 60 * 1000 },
}

function clientRateLimit(operation) {
  const limit = CLIENT_LIMITS[operation]
  if (!limit) return { allowed: true }
  const key = `nook_rl_${operation}`
  const now = Date.now()
  const cutoff = now - limit.windowMs
  let times = []
  try {
    times = JSON.parse(localStorage.getItem(key) || '[]').filter(t => t > cutoff)
  } catch { /* treat as empty */ }
  if (times.length >= limit.max) {
    const retryAfterSec = Math.ceil((times[0] + limit.windowMs - now) / 1000)
    const mins = Math.ceil(retryAfterSec / 60)
    return { allowed: false, message: `Too many attempts. Please try again in ${mins} minute${mins !== 1 ? 's' : ''}.` }
  }
  try {
    localStorage.setItem(key, JSON.stringify([...times, now]))
  } catch { /* localStorage full — allow the request */ }
  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Auth proxy helper — calls /api/auth/<operation> (Netlify Edge Function).
// Falls back to direct Supabase calls in local dev (when Netlify isn't running
// and /api/auth/* returns 404).
// ---------------------------------------------------------------------------
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://nook-hub.com'

async function proxyAuth(operation, body, queryParams = '') {
  const url = `/api/auth/${operation}${queryParams}`
  let resp
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return { networkError: true }
  }
  // 404 means we're in local dev without Netlify CLI — signal fallback
  if (resp.status === 404) return { localDev: true }
  const data = await resp.json().catch(() => ({}))
  return { status: resp.status, data }
}

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
  const [passwordRecovery, setPasswordRecovery] = useState(false)

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
      // PASSWORD_RECOVERY fires when user clicks a password reset link.
      // Mark recovery mode so App can show the reset-password form.
      if (_event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
        setUser(session?.user ?? null)
        setLoading(false)
        return
      }
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
    // Client-side guard first
    const guard = clientRateLimit('signup')
    if (!guard.allowed) return { error: guard.message }

    try {
      // Try proxy first
      const redirectTo = SITE_URL
      const result = await proxyAuth('signup', { email, password, data: { name, handle } }, `?redirect_to=${encodeURIComponent(redirectTo)}`)

      let data, error

      if (result.localDev || result.networkError) {
        // Fallback: direct Supabase (local dev without Netlify CLI)
        const res = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, handle }, emailRedirectTo: redirectTo },
        })
        data = res.data
        error = res.error
        if (error) return { error: error.message }
      } else if (result.status === 429) {
        return { error: 'Too many sign-up attempts. Please try again later.' }
      } else if (result.status >= 400) {
        return { error: result.data?.error_description || result.data?.msg || 'Sign-up failed. Please try again.' }
      } else {
        // Proxy returned a Supabase session/user payload
        data = result.data
        // Inject the session into the Supabase client if tokens were returned
        if (data?.access_token && data?.refresh_token) {
          await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token })
        }
        error = null
      }

      const user = data?.user ?? data
      if (user?.id) {
        await supabase.from('profiles').upsert({
          id: user.id,
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
    // Client-side guard first
    const guard = clientRateLimit('login')
    if (!guard.allowed) return { error: guard.message }

    try {
      // Try proxy first
      const result = await proxyAuth('login', { email, password })

      if (result.localDev || result.networkError) {
        // Fallback: direct Supabase (local dev without Netlify CLI)
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: error.message }
        return { data, error: null }
      }

      if (result.status === 429) {
        return { error: 'Too many login attempts. Please try again later.' }
      }
      if (result.status >= 400) {
        return { error: result.data?.error_description || result.data?.msg || 'Login failed. Please check your credentials.' }
      }

      // Proxy returned Supabase token payload — inject into client
      const { access_token, refresh_token } = result.data || {}
      if (access_token && refresh_token) {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) return { error: error.message }
        return { data, error: null }
      }

      return { data: result.data, error: null }
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

  // Send a password-reset email. The link redirects back to the site with type=recovery.
  async function resetPassword(email) {
    // Client-side guard first
    const guard = clientRateLimit('reset-password')
    if (!guard.allowed) return { error: guard.message }

    try {
      const redirectTo = SITE_URL
      const result = await proxyAuth('reset-password', { email, redirectTo })

      if (result.localDev || result.networkError) {
        // Fallback: direct Supabase (local dev without Netlify CLI)
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
        if (error) return { error: error.message }
        return { error: null }
      }

      if (result.status === 429) {
        return { error: 'Too many password reset attempts. Please try again later.' }
      }
      if (result.status >= 400) {
        return { error: result.data?.error_description || result.data?.msg || 'Password reset failed. Please try again.' }
      }

      return { error: null }
    } catch (e) {
      return { error: e.message }
    }
  }

  // Update the user's password (called after PASSWORD_RECOVERY flow).
  async function updatePassword(password) {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: error.message }
      setPasswordRecovery(false)
      return { error: null }
    } catch (e) {
      return { error: e.message }
    }
  }

  return { user, profile, loading, profileLoading, signUp, signIn, signOut, updateProfile, passwordRecovery, resetPassword, updatePassword }
}
