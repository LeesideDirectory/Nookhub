import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)      // Supabase user object
  const [profile, setProfile] = useState(null) // our profiles table row
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        else { setProfile(null); setLoading(false) }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signUp({ email, password, name, handle }) {
    if (!supabase) return { error: null, demo: true }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        name: name || email.split('@')[0],
        handle: handle || '@' + email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        bio: '',
        avatar_color: '#C9B8F0',
        joined: new Date().toISOString(),
      })
    }
    return { error: null }
  }

  async function signIn({ email, password }) {
    if (!supabase) return { error: null, demo: true }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    if (!supabase || !user) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (data) setProfile(data)
    return { error }
  }

  return { user, profile, loading, signUp, signIn, signOut, updateProfile }
}
