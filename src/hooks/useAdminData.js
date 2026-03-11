import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminData() {
  const [users, setUsers] = useState([])
  const [signupsByDay, setSignupsByDay] = useState([])
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
    // Without created_at column, return empty chart data
    const LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({ date: d.toISOString().slice(0, 10), day: LABELS[d.getDay()] })
    }
    setSignupsByDay(days.map(({ day }) => ({ day, signups: 0, visitors: 0 })))
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchUsers(), fetchSignupsByDay()])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [fetchUsers, fetchSignupsByDay])

  useEffect(() => { fetchAll() }, [fetchAll])

  const suspendUser = async (userId, suspended) => {
    // suspended column may not exist yet — attempt update, ignore error
    const { error } = await supabase
      .from('profiles')
      .update({ suspended })
      .eq('id', userId)
    if (!error) setUsers(us => us.map(u => u.id === userId ? { ...u, suspended } : u))
    return { error }
  }

  const totalUsers   = users.length
  const activeUsers  = users.filter(u => !u.suspended).length
  const weekSignups  = signupsByDay.reduce((a, d) => a + d.signups, 0)
  const todaySignups = signupsByDay[signupsByDay.length - 1]?.signups || 0

  return {
    users, setUsers,
    signupsByDay,
    loading, error,
    totalUsers, activeUsers, weekSignups, todaySignups,
    suspendUser,
    refresh: fetchAll,
  }
}
