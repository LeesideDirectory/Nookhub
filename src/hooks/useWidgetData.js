import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Syncs a named piece of widget data to Supabase user_data table.
// Falls back to localStorage if Supabase isn't configured.
export function useWidgetData(userId, key, defaultValue) {
  const [data, setDataState] = useState(defaultValue)
  const [ready, setReady] = useState(false)
  const storageKey = `nook_${key}`

  useEffect(() => {
    async function load() {
      if (supabase && userId) {
        const { data: row } = await supabase
          .from('user_data')
          .select('value')
          .eq('user_id', userId)
          .eq('key', key)
          .single()

        if (row?.value !== undefined) {
          setDataState(row.value)
        } else {
          // First load — try migrating from localStorage
          try {
            const local = localStorage.getItem(storageKey)
            if (local) setDataState(JSON.parse(local))
          } catch {}
        }
      } else {
        // Demo mode — use localStorage
        try {
          const local = localStorage.getItem(storageKey)
          if (local) setDataState(JSON.parse(local))
        } catch {}
      }
      setReady(true)
    }
    load()
  }, [userId, key])

  const setData = useCallback(async (valueOrUpdater) => {
    setDataState(prev => {
      const next = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev)
        : valueOrUpdater

      // Persist async
      if (supabase && userId) {
        supabase.from('user_data').upsert({
          user_id: userId,
          key,
          value: next,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,key' })
      } else {
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      }

      return next
    })
  }, [userId, key])

  return [data, setData, ready]
}
