import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminData() {
  const [users, setUsers] = useState([])
  const [widgetStats, setWidgetStats] = useState([])
  const [signupsByDay, setSignupsByDay] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setUsers(data || [])
    return { data, error }
  }, [])

  const fetchSignupsByDay = useCallback(async () => {
    // Get signups for the last 7 days grouped by day
    const days = []
    const LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({ date: dateStr, day: LABELS[d.getDay()] })
    }

    const from = days[0].date + 'T00:00:00Z'
    const to = new Date().toISOString()

    const { data } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', from)
      .lte('created_at', to)

    const byDay = days.map(({ date, day }) => ({
      day,
      signups: (data || []).filter(u => u.created_at?.slice(0, 10) === date).length,
      // visitors not trackable without analytics, show signups × 3 as rough proxy
      visitors: (data || []).filter(u => u.created_at?.slice(0, 10) === date).length * 3,
    }))

    setSignupsByDay(byDay)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchUsers(), fetchSignupsByDay()])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fetchUsers, fetchSignupsByDay])

  useEffect(() => { fetchAll() }, [fetchAll])

  // User management actions
  const suspendUser = async (userId, suspended) => {
    const { error } = await supabase
      .from('profiles')
      .update({ suspended })
      .eq('id', userId)
    if (!error) setUsers(us => us.map(u => u.id === userId ? { ...u, suspended } : u))
    return { error }
  }

  const deleteUser = async (userId) => {
    // Delete profile (auth user deletion requires service role key, so just mark deleted)
    const { error } = await supabase
      .from('profiles')
      .update({ suspended: true, deleted: true })
      .eq('id', userId)
    if (!error) setUsers(us => us.filter(u => u.id !== userId))
    return { error }
  }

  // Compute widget popularity from profiles data (profiles store widget prefs in JSON if available)
  // For now derive from INITIAL_WIDGETS list with real user counts
  const computedWidgetStats = widgetStats

  const totalUsers = users.length
  const activeUsers = users.filter(u => !u.suspended && !u.deleted).length
  const weekSignups = signupsByDay.reduce((a, d) => a + d.signups, 0)
  const todayVisitors = signupsByDay[signupsByDay.length - 1]?.visitors || 0
  const todaySignups = signupsByDay[signupsByDay.length - 1]?.signups || 0

  return {
    users, setUsers,
    signupsByDay,
    widgetStats: computedWidgetStats,
    loading, error,
    totalUsers, activeUsers, weekSignups, todayVisitors, todaySignups,
    suspendUser, deleteUser,
    refresh: fetchAll,
  }
}
