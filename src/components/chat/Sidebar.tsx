'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageCircle, Sun, Moon, User, LogOut, Plus, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useChatStore, Chat } from '@/store/chatStore'
import { useRouter } from 'next/navigation'
import VerificationBadge from '@/components/ui/VerificationBadge'

export default function Sidebar() {
  const { user, theme, setTheme, setUser } = useAuthStore()
  const { chats, setChats, setActiveChat, activeChat } = useChatStore()
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; phone: string; avatar_url: string | null; verification_color: string | null }[]>([])
  const [searching, setSearching] = useState(false)
  const router = useRouter()

  const loadChats = useCallback(async () => {
    if (!user) return
    const { data: participations } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user.id)

    if (!participations) return
    const chatIds = participations.map((p) => p.chat_id)

    const chatsWithDetails: Chat[] = []
    for (const chatId of chatIds) {
      const { data: otherParticipant } = await supabase
        .from('chat_participants')
        .select('user_id, users(*)')
        .eq('chat_id', chatId)
        .neq('user_id', user.id)
        .single()

      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('deleted_for_everyone', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (otherParticipant?.users) {
        const otherUser = otherParticipant.users as unknown as { id: string; name: string; avatar_url: string | null; is_online: boolean; last_seen: string; verification_color: string | null }
        chatsWithDetails.push({
          id: chatId,
          type: 'direct',
          created_at: '',
          other_user: otherUser,
          last_message: lastMessage || null,
        })
      }
    }
    setChats(chatsWithDetails)
  }, [user, setChats])

  useEffect(() => {
    loadChats()
    // Realtime subscription للمحادثات
    const sub = supabase
      .channel('messages-sidebar')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => loadChats())
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [loadChats])

  const handleSearch = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    const { data } = await supabase
      .from('users')
      .select('id, name, phone, avatar_url, verification_color')
      .neq('id', user?.id)
      .eq('is_banned', false)
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(10)
    setSearchResults(data || [])
    setSearching(false)
  }

  const startChat = async (targetUserId: string) => {
    // تحقق إذا المحادثة موجودة
    const { data: existing } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user?.id)

    for (const p of existing || []) {
      const { data: other } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', p.chat_id)
        .eq('user_id', targetUserId)
        .single()
      if (other) {
        await loadChats()
        const found = chats.find(c => c.id === p.chat_id)
        if (found) setActiveChat(found)
        setSearch(''); setSearchResults([])
        return
      }
    }

    // إنشاء محادثة جديدة
    const { data: newChat } = await supabase.from('chats').insert({ type: 'direct' }).select().single()
    if (newChat) {
      await supabase.from('chat_participants').insert([
        { chat_id: newChat.id, user_id: user?.id },
        { chat_id: newChat.id, user_id: targetUserId },
      ])
      await loadChats()
    }
    setSearch(''); setSearchResults([])
  }

  const handleLogout = () => {
    setUser(null)
    router.push('/login')
  }

  const filteredChats = chats.filter((c) =>
    c.other_user?.name.toLowerCase().includes(search.toLowerCase())
  )
  const displayList = search && searchResults.length > 0 ? null : filteredChats

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FF3B30)' }}>
            <MessageCircle size={18} color="#000" />
          </div>
          <span className="text-xl font-black itop-gradient">ITOP</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            {theme === 'dark' ? <Sun size={16} style={{ color: 'var(--color-primary)' }} /> : <Moon size={16} style={{ color: 'var(--text-secondary)' }} />}
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => router.push('/profile')}
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', border: '2px solid var(--color-primary)', cursor: 'pointer' }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              : <User size={16} style={{ color: 'var(--text-secondary)' }} />}
          </motion.button>
        </div>
      </div>

      {/* البحث */}
      <div className="p-3">
        <div className="relative">
          <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="ابحث عن شخص أو محادثة..." value={search} onChange={(e) => handleSearch(e.target.value)}
            className="w-full py-3 pr-10 pl-4 rounded-2xl text-right text-sm transition-all duration-300"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)' }} />
        </div>
      </div>

      {/* نتائج البحث */}
      <AnimatePresence>
        {search && searchResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="px-3 pb-2">
            <p className="text-xs mb-2 px-1" style={{ color: 'var(--text-tertiary)' }}>نتائج البحث</p>
            {searchResults.map((u) => (
              <motion.div key={u.id} whileHover={{ backgroundColor: 'var(--bg-hover)' }}
                onClick={() => startChat(u.id)}
                className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                    : <User size={18} style={{ color: 'var(--text-tertiary)' }} />}
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                    <VerificationBadge color={u.verification_color} />
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{u.phone}</p>
                </div>
                <Plus size={16} style={{ color: 'var(--color-primary)' }} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* قائمة المحادثات */}
      <div className="flex-1 overflow-y-auto">
        {(displayList || filteredChats).length === 0 && !search ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
              <MessageCircle size={28} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="text-center" style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
              لا يوجد محادثات بعد<br />
              <span style={{ fontSize: '12px' }}>ابحث عن شخص لبدء المحادثة</span>
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {(displayList || filteredChats).map((chat, i) => (
              <motion.div key={chat.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setActiveChat(chat)}
                className="flex items-center gap-3 p-4 cursor-pointer transition-all duration-200 relative"
                style={{
                  background: activeChat?.id === chat.id ? 'var(--bg-active)' : 'transparent',
                  borderRight: activeChat?.id === chat.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                }}
                whileHover={{ backgroundColor: 'var(--bg-hover)' }}>

                {/* صورة المستخدم */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ border: `2px solid ${chat.other_user?.verification_color ? `var(--verify-${chat.other_user.verification_color})` : 'var(--border-color)'}` }}>
                    {chat.other_user?.avatar_url
                      ? <img src={chat.other_user.avatar_url} className="w-full h-full object-cover" alt="" />
                      : <User size={22} style={{ color: 'var(--text-tertiary)' }} />}
                  </div>
                  {/* مؤشر الاتصال */}
                  {chat.other_user?.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 notification-pulse"
                      style={{ background: '#34C759', borderColor: 'var(--bg-surface)' }} />
                  )}
                </div>

                {/* معلومات المحادثة */}
                <div className="flex-1 text-right min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      {chat.last_message ? new Date(chat.last_message.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                    <div className="flex items-center gap-1 min-w-0 justify-end">
                      <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {chat.other_user?.name}
                      </span>
                      <VerificationBadge color={chat.other_user?.verification_color ?? null} size={13} />
                    </div>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {chat.last_message?.deleted_for_everyone ? '🚫 تم حذف الرسالة' : chat.last_message?.content || (chat.last_message?.media_type === 'image' ? '📷 صورة' : chat.last_message?.media_type === 'video' ? '🎬 فيديو' : 'ابدأ المحادثة')}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer - تسجيل الخروج */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border-color)' }}>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleLogout}
          className="w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
          style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
          <LogOut size={14} />
          تسجيل الخروج
        </motion.button>
      </div>
    </div>
  )
}
