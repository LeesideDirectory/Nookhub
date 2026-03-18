import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Strip ASCII control characters (null bytes, form feeds, etc.) from user text.
// React auto-escapes HTML in JSX so no HTML encoding is needed — this is purely
// data hygiene to prevent null-byte / control-char smuggling into the database.
const sanitizeText = (str) => {
  if (!str || typeof str !== 'string') return str
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * useMessages — real Supabase chat matching your actual schema
 *
 * Your schema uses:
 *   conversations.type  ('dm' | 'group')   — NOT is_group boolean
 *   chat_messages       — new table created by migration
 *     .id, .conversation_id, .sender_id, .content, .created_at
 *   conversation_members.conversation_id + user_id
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

// ─── Per-user "last read" timestamp helpers ───────────────────────────────
// Stored in localStorage as { [conversationId]: ISO-string }
// A conversation's unread count is the number of messages from others that
// arrived AFTER the stored timestamp, so reading a conversation and then
// navigating away keeps the badge cleared on the next fetch.
function getReadTimestamps(userId) {
  if (!userId) return {}
  try {
    const raw = localStorage.getItem(`nook_msg_read_${userId}`)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveReadTimestamp(userId, conversationId) {
  if (!userId || !conversationId) return
  try {
    const ts = getReadTimestamps(userId)
    ts[conversationId] = new Date().toISOString()
    localStorage.setItem(`nook_msg_read_${userId}`, JSON.stringify(ts))
  } catch {}
}

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
  const activeConversationIdRef = useRef(null) // mirrors activeConversationId for closure access

  // ─── Fetch conversations ──────────────────────────────────────────────────
  // Uses flat queries instead of nested joins to avoid requiring FK constraints
  // in PostgREST (which would 400 if conversation_members.user_id -> profiles.id
  // foreign key isn't registered in the DB schema).

  const fetchConversations = useCallback(async () => {
    if (!supabase || !user) return
    setLoading(true)

    try {
      // Step 1: Get conversation IDs the user belongs to (including last_read_at for unread counts)
      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)

      if (memberError) throw memberError
      if (!memberData?.length) { setConversations([]); setLoading(false); return }

      const convIds = memberData.map(m => m.conversation_id)

      // Build a DB-sourced read-timestamp map; merge with localStorage (DB wins for cross-device accuracy)
      const dbReadTimestamps = Object.fromEntries(
        (memberData || []).map(m => [m.conversation_id, m.last_read_at]).filter(([, ts]) => ts)
      )

      // Step 2: Get conversations (flat — no nested join)
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('id, type, name, created_at')
        .in('id', convIds)

      if (convError) throw convError
      if (!convData?.length) { setConversations([]); setLoading(false); return }

      // Step 3: Get all members for these conversations
      const { data: allMembers, error: allMembersError } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id')
        .in('conversation_id', convIds)

      if (allMembersError) throw allMembersError

      // Step 4: Get profiles for all member user IDs
      const allUserIds = [...new Set((allMembers || []).map(m => m.user_id))]
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, handle, avatar_color, avatar_url')
        .in('id', allUserIds)

      if (profilesError) throw profilesError

      const profilesById = Object.fromEntries((profilesData || []).map(p => [p.id, p]))

      // Step 5: For each conversation, fetch last message + assemble metadata
      // Merge localStorage (instant cache) with DB timestamps (DB wins as cross-device source of truth)
      const readTimestamps = { ...getReadTimestamps(user.id), ...dbReadTimestamps }

      const withMeta = await Promise.all((convData || []).map(async (conv) => {
        const convMembers = (allMembers || []).filter(m => m.conversation_id === conv.id)

        const { data: lastMsg } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Only count messages that arrived after the user last read this conversation.
        // If no timestamp exists (never opened), count everything from others.
        const lastRead = readTimestamps[conv.id]
        let unreadQuery = supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
        if (lastRead) unreadQuery = unreadQuery.gt('created_at', lastRead)
        const { count: unreadCount } = await unreadQuery

        const otherMembers = convMembers
          .filter(m => m.user_id !== user.id)
          .map(m => profilesById[m.user_id] || null)

        const isGroup = conv.type === 'group'
        const displayName = isGroup
          ? (conv.name || otherMembers.map(m => m?.name).filter(Boolean).join(', ') || 'Group Chat')
          : (otherMembers[0]?.name || 'Unknown')

        return {
          ...conv,
          isGroup,
          displayName,
          displayAvatar: isGroup ? null : otherMembers[0],
          otherMembers,
          lastMessage: lastMsg ? { ...lastMsg, profiles: profilesById[lastMsg.sender_id] || null } : null,
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
      // Get messages flat first, then fetch profiles separately
      const { data: msgData, error: msgError } = await supabase
        .from('chat_messages')
        .select('id, content, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgError) throw msgError
      if (!msgData?.length) { setMessages([]); setMessagesLoading(false); return }

      // Fetch profiles for all senders
      const senderIds = [...new Set(msgData.map(m => m.sender_id))]
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, name, handle, avatar_color, avatar_url')
        .in('id', senderIds)

      const profilesById = Object.fromEntries((senderProfiles || []).map(p => [p.id, p]))

      const enriched = msgData.map(msg => ({
        ...msg,
        profiles: profilesById[msg.sender_id] || null,
      }))

      setMessages(enriched)
    } catch (err) {
      setError(err.message)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  // ─── Select conversation + subscribe ─────────────────────────────────────

  const selectConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId)
    activeConversationIdRef.current = conversationId  // keep ref in sync for closure access
    setTypingUsers([])

    // Clear unread count and persist the read timestamp so it survives navigation + cross-device
    if (conversationId) {
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ))
      // Persist to localStorage (instant, in-session)
      saveReadTimestamp(user?.id, conversationId)
      // Persist to Supabase (cross-device: next login on any browser will read this)
      if (user?.id) {
        supabase
          .from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .then(({ error }) => { if (error) console.warn('[Nook] last_read_at update error', error) })
      }
    }

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
        // Fetch the sender profile separately
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('id, name, handle, avatar_color, avatar_url')
          .eq('id', payload.new.sender_id)
          .maybeSingle()

        const data = { ...payload.new, profiles: senderProfile || null }

        setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data])
        // If this conversation is active the user is reading it right now —
        // keep unread at 0 and update the read timestamp so future fetches agree.
        const isActive = activeConversationIdRef.current === conversationId
        if (isActive && data.sender_id !== user?.id) {
          saveReadTimestamp(user?.id, conversationId)
        }
        setConversations(prev => prev.map(c => c.id !== conversationId ? c : {
          ...c,
          lastMessage: data,
          unreadCount: (data.sender_id !== user?.id && !isActive) ? c.unreadCount + 1 : c.unreadCount,
        }))
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
  // Uses client-side UUID + insert-without-select to avoid RLS SELECT timing issues

  const sendMessage = useCallback(async (content) => {
    if (!supabase || !user || !activeConversationId) return { error: 'Not ready' }
    if (!content?.trim()) return { error: 'Message cannot be empty' }

    const clean = sanitizeText(content.trim())
    const msgId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        id: msgId,
        conversation_id: activeConversationId,
        sender_id: user.id,
        content: clean,
      })

    if (insertError) return { error: insertError.message }

    // Optimistically add message to state using known data
    const optimisticMsg = {
      id: msgId,
      conversation_id: activeConversationId,
      sender_id: user.id,
      content: clean,
      created_at: new Date().toISOString(),
      profiles: profile ? {
        id: user.id,
        name: profile.name,
        handle: profile.handle,
        avatar_color: profile.avatar_color,
        avatar_url: profile.avatar_url,
      } : null,
    }
    setMessages(prev => prev.some(m => m.id === msgId) ? prev : [...prev, optimisticMsg])
    return { data: optimisticMsg }
  }, [user, profile, activeConversationId])

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

  // ─── Delete conversation ──────────────────────────────────────────────────

  const deleteConversation = useCallback(async (conversationId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }

    const { error: delError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (delError) return { error: delError.message }

    setConversations(prev => prev.filter(c => c.id !== conversationId))
    if (activeConversationId === conversationId) {
      setActiveConversationId(null)
      setMessages([])
    }
    return {}
  }, [user, activeConversationId])

  // ─── Delete message ───────────────────────────────────────────────────────

  const deleteMessage = useCallback(async (messageId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }

    const { error: delError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id) // safety: can only delete own messages

    if (delError) return { error: delError.message }

    setMessages(prev => prev.filter(m => m.id !== messageId))

    // Update lastMessage in conversations list if this was the last message
    setConversations(prev => prev.map(c => {
      if (c.lastMessage?.id !== messageId) return c
      return { ...c, lastMessage: null }
    }))

    return {}
  }, [user])

  // ─── Start DM ─────────────────────────────────────────────────────────────

  const startDM = useCallback(async (targetUserId) => {
    if (!supabase || !user) return { error: 'Not authenticated' }
    if (targetUserId === user.id) return { error: "Can't DM yourself" }

    // Check for existing DM using already-loaded conversations list
    const existingDM = conversations.find(c =>
      !c.isGroup && c.otherMembers?.some(m => m?.id === targetUserId)
    )
    if (existingDM) return { conversationId: existingDM.id }

    // Generate UUID client-side so we never need SELECT after INSERT
    const convId = crypto.randomUUID()
    const { error: convError } = await supabase
      .from('conversations').insert({ id: convId, type: 'dm' })
    if (convError) return { error: convError.message }

    const { error: memberError } = await supabase.from('conversation_members').insert([
      { conversation_id: convId, user_id: user.id },
      { conversation_id: convId, user_id: targetUserId },
    ])
    if (memberError) return { error: memberError.message }

    await fetchConversations()
    return { conversationId: convId }
  }, [user, conversations, fetchConversations])

  // ─── Start group chat ─────────────────────────────────────────────────────

  const startGroupChat = useCallback(async (userIds, name = '') => {
    if (!supabase || !user) return { error: 'Not authenticated' }

    const convId = crypto.randomUUID()
    const { error: convError } = await supabase
      .from('conversations').insert({ id: convId, type: 'group', name: name || null })
    if (convError) return { error: convError.message }

    const members = [user.id, ...userIds.filter(id => id !== user.id)]
    const { error: memberError } = await supabase.from('conversation_members').insert(
      members.map(uid => ({ conversation_id: convId, user_id: uid }))
    )
    if (memberError) return { error: memberError.message }

    await fetchConversations()
    return { conversationId: convId }
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
    deleteMessage,
    deleteConversation,
    startDM,
    startGroupChat,
    typingUsers,
    setTyping,
    totalUnread,
    refresh: fetchConversations,
  }
}
