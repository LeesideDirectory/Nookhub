import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * useFeed — Supabase feed matching your actual schema
 *
 * Your schema uses:
 *   posts.payload    (jsonb)  — rich content
 *   posts.content    (text)   — plain text (added by migration)
 *   posts.type       (text)   — 'post', 'widget', etc.
 *   posts.is_public  (bool)
 *   comments.body    (text)   — NOT content
 *   conversations.type ('dm' | 'group')
 */

const PAGE_SIZE = 20

export function useFeed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [feedFilter, setFeedFilter] = useState('all')

  const normalise = useCallback((post, currentUserId) => {
    const text = post.content || post.payload?.text || post.payload?.content || ''
    const imageUrl = post.image_url || post.payload?.image_url || post.payload?.imageUrl || null
    return {
      ...post,
      content: text,
      image_url: imageUrl,
      comments: (post.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
      likeCount: (post.likes || []).length,
      isLiked: currentUserId ? (post.likes || []).some(l => l.user_id === currentUserId) : false,
      commentCount: (post.comments || []).length,
    }
  }, [])

  const fetchPosts = useCallback(async (pageNum = 0, filter = feedFilter, append = false) => {
    if (!supabase) return
    if (pageNum === 0) setLoading(true)
    setError(null)

    try {
      let userIdsFilter = null

      if (filter === 'following' && user) {
        const { data: followData } = await supabase
          .from('follows').select('following_id').eq('follower_id', user.id)
        const ids = (followData || []).map(f => f.following_id)
        // Do NOT include the current user's own posts in the following feed
        userIdsFilter = ids
      }

      let query = supabase
        .from('posts')
        .select(`
          id, type, content, image_url, payload, is_public, created_at, user_id,
          profiles:user_id ( id, name, handle, avatar_color, avatar_url ),
          likes ( user_id ),
          comments (
            id, body, created_at, user_id,
            profiles:user_id ( id, name, handle, avatar_color, avatar_url )
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, pageNum * PAGE_SIZE + PAGE_SIZE - 1)

      if (userIdsFilter) {
        query = query.in('user_id', userIdsFilter.length > 0
          ? userIdsFilter
          : ['00000000-0000-0000-0000-000000000000'])
      } else if (user) {
        // 'all' filter: exclude the current user's own posts
        query = query.neq('user_id', user.id)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      const normalised = (data || []).map(p => normalise(p, user?.id))
      setHasMore((data || []).length === PAGE_SIZE)
      setPosts(prev => append ? [...prev, ...normalised] : normalised)
    } catch (err) {
      console.error('useFeed error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, feedFilter, normalise])

  useEffect(() => {
    setPage(0)
    fetchPosts(0, feedFilter, false)
  }, [user?.id, feedFilter])

  // Realtime: prepend new public posts
  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('feed-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          if (!payload.new.is_public) return
          const { data } = await supabase
            .from('posts')
            .select(`id, type, content, image_url, payload, is_public, created_at, user_id,
              profiles:user_id (id, name, handle, avatar_color, avatar_url),
              likes (user_id),
              comments (id, body, created_at, user_id,
                profiles:user_id (id, name, handle, avatar_color, avatar_url))`)
            .eq('id', payload.new.id).single()
          if (data) {
            setPosts(prev => {
              if (prev.some(p => p.id === data.id)) return prev
              return [normalise(data, user?.id), ...prev]
            })
          }
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id, normalise])

  const createPost = useCallback(async (text, options = {}) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    if (!text?.trim() && !options.payload) return { error: 'Post cannot be empty' }
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        type: options.type || 'post',
        content: text?.trim() || null,
        image_url: options.imageUrl || null,
        payload: options.payload || null,
        is_public: options.isPublic !== false,
      })
      .select().single()
    if (error) return { error: error.message }
    return { data }
  }, [user])

  const deletePost = useCallback(async (postId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    setPosts(prev => prev.filter(p => p.id !== postId))
    const { error } = await supabase.from('posts').delete()
      .eq('id', postId).eq('user_id', user.id)
    if (error) { fetchPosts(0, feedFilter, false); return { error: error.message } }
    return {}
  }, [user, feedFilter, fetchPosts])

  const toggleLike = useCallback(async (postId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    const post = posts.find(p => p.id === postId)
    if (!post) return { error: 'Post not found' }
    const wasLiked = post.isLiked

    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p, isLiked: !wasLiked, likeCount: wasLiked ? p.likeCount - 1 : p.likeCount + 1,
    }))

    if (wasLiked) {
      const { error } = await supabase.from('likes').delete()
        .eq('post_id', postId).eq('user_id', user.id)
      if (error) {
        setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, isLiked: true, likeCount: p.likeCount + 1 }))
        return { error: error.message }
      }
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: user.id })
      if (error) {
        setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, isLiked: false, likeCount: p.likeCount - 1 }))
        return { error: error.message }
      }
    }
    return {}
  }, [user, posts])

  // Note: comments use "body" not "content"
  const addComment = useCallback(async (postId, body) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    if (!body?.trim()) return { error: 'Comment cannot be empty' }
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, body: body.trim() })
      .select(`id, body, created_at, user_id,
        profiles:user_id (id, name, handle, avatar_color, avatar_url)`)
      .single()
    if (error) return { error: error.message }
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      comments: [...(p.comments || []), data],
      commentCount: p.commentCount + 1,
    }))
    return { data }
  }, [user])

  const deleteComment = useCallback(async (commentId, postId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      comments: (p.comments || []).filter(c => c.id !== commentId),
      commentCount: p.commentCount - 1,
    }))
    const { error } = await supabase.from('comments').delete()
      .eq('id', commentId).eq('user_id', user.id)
    if (error) { fetchPosts(0, feedFilter, false); return { error: error.message } }
    return {}
  }, [user, feedFilter, fetchPosts])

  const toggleFollow = useCallback(async (targetUserId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    if (targetUserId === user.id) return { error: "Can't follow yourself" }
    const { data: existing } = await supabase.from('follows').select('follower_id')
      .eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle()
    if (existing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', targetUserId)
      return { following: false }
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
      return { following: true }
    }
  }, [user])

  const isFollowing = useCallback(async (targetUserId) => {
    if (!supabase || !user) return false
    const { data } = await supabase.from('follows').select('follower_id')
      .eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle()
    return !!data
  }, [user])

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return
    const next = page + 1
    setPage(next)
    fetchPosts(next, feedFilter, true)
  }, [hasMore, loading, page, feedFilter, fetchPosts])

  const refresh = useCallback(() => {
    setPage(0)
    fetchPosts(0, feedFilter, false)
  }, [feedFilter, fetchPosts])

  return {
    posts, loading, error, hasMore,
    createPost, deletePost,
    toggleLike,
    addComment, deleteComment,
    toggleFollow, isFollowing,
    loadMore, refresh,
    feedFilter, setFeedFilter,
  }
}
