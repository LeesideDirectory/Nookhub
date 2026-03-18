import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminData() {
  const [users, setUsers] = useState([])
  const [signupsByDay, setSignupsByDay] = useState([])
  const [widgetUsage, setWidgetUsage] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('id', { ascending: false })
    if (error) {
      console.error('useAdminData fetchUsers error:', error)
      setError(`${error.message} (code: ${error.code})`)
    } else {
      setUsers(data || [])
    }
    return { data, error }
  }, [])

  const fetchSignupsByDay = useCallback(async () => {
    const LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ date: d.toISOString().slice(0, 10), day: LABELS[d.getDay()] })
    }

    // Attempt to use created_at if it exists; gracefully fall back to zeros if not
    const since = days[0].date + 'T00:00:00.000Z'
    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', since)

    if (error) {
      // created_at column may not exist — silently fall back to zeros
      setSignupsByDay(days.map(({ day }) => ({ day, signups: 0 })))
      return
    }

    const countsByDate = {}
    for (const row of (data || [])) {
      const date = row.created_at?.slice(0, 10)
      if (date) countsByDate[date] = (countsByDate[date] || 0) + 1
    }
    setSignupsByDay(days.map(({ day, date }) => ({ day, signups: countsByDate[date] || 0 })))
  }, [])

  const fetchWidgetUsage = useCallback(async () => {
    const { data, error } = await supabase
      .from('widget_configs')
      .select('widget_id, enabled')
    if (error || !data) return
    const counts = {}
    for (const row of data) {
      if (row.enabled) {
        counts[row.widget_id] = (counts[row.widget_id] || 0) + 1
      }
    }
    setWidgetUsage(counts)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchUsers(), fetchSignupsByDay(), fetchWidgetUsage()])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fetchUsers, fetchSignupsByDay, fetchWidgetUsage])

  useEffect(() => { fetchAll() }, [fetchAll])

  const suspendUser = async (userId, suspended) => {
    // Direct .update() is blocked by RLS (profiles_own_update: auth.uid() = id).
    // Use the SECURITY DEFINER RPC which bypasses RLS after verifying is_admin.
    const { error } = await supabase.rpc('admin_set_user_suspended', {
      target_user_id: userId,
      is_suspended: suspended,
    })
    if (error) {
      console.error('[Admin] suspendUser error:', error)
    } else {
      setUsers(us => us.map(u => u.id === userId ? { ...u, suspended } : u))
    }
    return { error }
  }

  const flagUser = async (userId, flagged) => {
    // Same RLS issue — use SECURITY DEFINER RPC.
    const { error } = await supabase.rpc('admin_set_user_flagged', {
      target_user_id: userId,
      is_flagged: flagged,
    })
    if (error) {
      console.error('[Admin] flagUser error:', error)
    } else {
      setUsers(us => us.map(u => u.id === userId ? { ...u, flagged } : u))
    }
    return { error }
  }

  const totalUsers    = users.length
  const activeUsers   = users.filter(u => !u.suspended).length
  const flaggedUsers  = users.filter(u => u.flagged).length
  const weekSignups   = signupsByDay.reduce((a, d) => a + d.signups, 0)
  const todaySignups  = signupsByDay[signupsByDay.length - 1]?.signups || 0

  return {
    users, setUsers,
    signupsByDay,
    widgetUsage,
    loading, error,
    totalUsers, activeUsers, flaggedUsers, weekSignups, todaySignups,
    suspendUser, flagUser,
    refresh: fetchAll,
  }
}
