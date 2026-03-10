import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
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
    setLoading(false)
  }

  async function signUp({ email, password, name, handle }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, handle } }
      })
      if (error) return { error: error.message }

      // Create profile row
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

  return { user, profile, loading, signUp, signIn, signOut, updateProfile }
}
