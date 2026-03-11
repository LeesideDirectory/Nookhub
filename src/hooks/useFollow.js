import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useFollow(userId) {
  const [following, setFollowing] = useState([])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .then(({ data }) => {
        if (data) setFollowing(data.map(r => r.following_id))
      })
  }, [userId])

  async function toggleFollow(targetId) {
    if (!userId) return
    const isFollowing = following.includes(targetId)
    if (isFollowing) {
      setFollowing(f => f.filter(id => id !== targetId))
      await supabase.from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetId)
    } else {
      setFollowing(f => [...f, targetId])
      await supabase.from('follows').insert({
        follower_id: userId,
        following_id: targetId,
        created_at: new Date().toISOString()
      })
    }
  }

  return { following, toggleFollow }
}
