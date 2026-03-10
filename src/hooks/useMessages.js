import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * useMessages — real Supabase chat matching your actual schema
 *
 * Your schema uses:
 *   conversations.type  ('dm' | 'group')   — NOT is_group boolean
 *   chat_messages       — new table created by migration
 *     .id, .conversation_id, .sender_id, .content, .created_at
 *   conversation_members.joined_at  — extra column (fine, ignored)
 *
 * Returns:
 *   conversations       – with displayName, lastMessage, unreadCount
 *   activeConversation  – currently selected conversation
 *   messages            – for active conversation
 *   loading / messagesLoading
 *   error
 *   selectConversation  – (id) => void
 *   sendMessage         – (content) => Promise
 *   startDM             – (userId) => Promise<{conversationId}>
 *   startGroupChat      – (userIds, name?) => Promise<{conversationId}>
 *   typingUsers         – [{user_id, name}]
 *   setTyping           – (bool) => void
 *   totalUnread
 *   refresh
 */

const TYPING_THROTTLE_MS = 2000

export function useMessages() {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [error, setError] = useState(null)
  const [typingUsers, setTypingUsers] = useState([])
  const typingTimeoutRef = useRef(null)
  const lastTypingSentRef = useRef(0)
  const messageChannelRef = useRef(null)
  const typingChannelRef = useRef(null)

  // ─── Fetch conversations ──────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    if (!supabase || !user) return
    setLoading(true)

    try {
      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError
      if (!memberData?.length) { setConversations([]); setLoading(false); return }

      const convIds = memberData.map(m => m.conversation_id)

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          id, type, name, created_at,
          conversation_members (
            user_id, joined_at,
            profiles:user_id ( id, name, handle, avatar_color, avatar_url )
          )
        `)
        .in('id', convIds)

      if (convError) throw convError

      const withMeta = await Promise.all((convData || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, sender_id, profiles:sender_id (name, handle)')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { count: unreadCount } = await supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)

        const otherMembers = conv.conversation_members
          .filter(m => m.user_id !== user.id)
          .map(m => m.profiles)

        // conversations.type is 'dm' or 'group'
        const isGroup = conv.type === 'group'
        const displayName = isGroup
          ? (conv.name || otherMembers.map(m => m?.name).filter(Boolean).join(', '))
          : (otherMembers[0]?.name || 'Unknown')

        return {
          ...conv,
          isGroup,
          displayName,
          displayAvatar: isGroup ? null : otherMembers[0],
          otherMembers,
          lastMessage: lastMsg || null,
          unreadCount: unreadCount || 0,
        }
      }))

      withMeta.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at
        const bTime = b.lastMessage?.created_at || b.created_at
        return new Date(bTime) - new Date(aTime)
      })

      setConversations(withMeta)
    } catch (err) {
      console.error('useMessages fetchConversations error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchConversations() }, [user?.id])

  // ─── Fetch messages ───────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (conversationId) => {
    if (!supabase || !conversationId) return
    setMessagesLoading(true)
    try {
      const { data, error: msgError } = await supabase
        .from('chat_messages')
        .select(`
          id, content, created_at, sender_id,
          profiles:sender_id ( id, name, handle, avatar_color, avatar_url )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError
      setMessages(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  // ─── Select conversation + subscribe ─────────────────────────────────────

  const selectConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId)
    setTypingUsers([])

    if (messageChannelRef.current) supabase?.removeChannel(messageChannelRef.current)
    if (typingChannelRef.current) supabase?.removeChannel(typingChannelRef.current)

    if (!conversationId || !supabase) return

    fetchMessages(conversationId)

    // Realtime: new chat messages
    const msgChannel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('chat_messages')
          .select(`id, content, created_at, sender_id,
            profiles:sender_id (id, name, handle, avatar_color, avatar_url)`)
          .eq('id', payload.new.id)
          .single()

        if (data) {
          setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
          setConversations(prev => prev.map(c => c.id !== conversationId ? c : {
            ...c,
            lastMessage: data,
            unreadCount: data.sender_id !== user?.id ? c.unreadCount + 1 : c.unreadCount,
          }))
        }
      })
      .subscribe()

    messageChannelRef.current = msgChannel

    // Broadcast: typing indicators
    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id === user?.id) return
        setTypingUsers(prev => {
          const without = prev.filter(u => u.user_id !== payload.user_id)
          return payload.is_typing ? [...without, { user_id: payload.user_id, name: payload.name }] : without
        })
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.user_id !== payload.user_id))
        }, 3000)
      })
      .subscribe()

    typingChannelRef.current = typingChannel
  }, [user, fetchMessages])

  useEffect(() => {
    return () => {
      if (messageChannelRef.current) supabase?.removeChannel(messageChannelRef.current)
      if (typingChannelRef.current) supabase?.removeChannel(typingChannelRef.current)
    }
  }, [])

  // ─── Send message ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content) => {
    if (!supabase || !user || !activeConversationId) return { error: 'Not ready' }
    if (!content?.trim()) return { error: 'Message cannot be empty' }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: activeConversationId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select(`id, content, created_at, sender_id,
        profiles:sender_id (id, name, handle, avatar_color, avatar_url)`)
      .single()

    if (error) return { error: error.message }
    setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
    return { data }
  }, [user, activeConversationId])

  // ─── Typing indicator ─────────────────────────────────────────────────────

  const setTyping = useCallback((isTyping) => {
    if (!typingChannelRef.current || !user || !profile) return
    const now = Date.now()
    if (isTyping && now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return
    lastTypingSentRef.current = now

    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, name: profile.name || profile.handle, is_typing: isTyping },
    })

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000)
    }
  }, [user, profile])

  // ─── Start DM ─────────────────────────────────────────────────────────────

  const startDM = useCallback(async (targetUserId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    if (targetUserId === user.id) return { error: "Can't DM yourself" }

    // Check for existing DM
    const { data: myConvs } = await supabase
      .from('conversation_members').select('conversation_id').eq('user_id', user.id)
    const myConvIds = (myConvs || []).map(c => c.conversation_id)

    if (myConvIds.length > 0) {
      const { data: shared } = await supabase
        .from('conversation_members').select('conversation_id')
        .eq('user_id', targetUserId).in('conversation_id', myConvIds)

      for (const s of (shared || [])) {
        const { data: conv } = await supabase
          .from('conversations').select('id, type')
          .eq('id', s.conversation_id).maybeSingle()
        if (conv?.type === 'dm') return { conversationId: conv.id }
      }
    }

    // Create new DM
    const { data: conv, error: convError } = await supabase
      .from('conversations').insert({ type: 'dm' }).select().single()
    if (convError) return { error: convError.message }

    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: targetUserId },
    ])

    await fetchConversations()
    return { conversationId: conv.id }
  }, [user, fetchConversations])

  // ─── Start group chat ─────────────────────────────────────────────────────

  const startGroupChat = useCallback(async (userIds, name = '') => {
    if (!supabase || !user) return { error: 'Not authenticated' }

    const { data: conv, error: convError } = await supabase
      .from('conversations').insert({ type: 'group', name: name || null }).select().single()
    if (convError) return { error: convError.message }

    const members = [user.id, ...userIds.filter(id => id !== user.id)]
    await supabase.from('conversation_members').insert(
      members.map(uid => ({ conversation_id: conv.id, user_id: uid }))
    )

    await fetchConversations()
    return { conversationId: conv.id }
  }, [user, fetchConversations])

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    messagesLoading,
    error,
    selectConversation,
    sendMessage,
    startDM,
    startGroupChat,
    typingUsers,
    setTyping,
    totalUnread,
    refresh: fetchConversations,
  }
}
