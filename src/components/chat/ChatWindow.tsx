'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Phone, Video, MoreVertical, Send, Paperclip,
  Mic, Smile, Image, X, Reply, Trash2, MessageCircle, User, Clock, CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useChatStore, Message } from '@/store/chatStore'
import VerificationBadge from '@/components/ui/VerificationBadge'

const EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🔥']
const VERIFICATION_MESSAGES: Record<string, string> = {
  gold: '⭐ هذا الحساب شخصية عامة مشهورة وتم التحقق من هويتها من قِبل فريق ITOP.',
  blue: '✅ هذا حساب موثق. تم التحقق من هذا الحساب كشخص حقيقي أو جهة موثوقة.',
  red: '🏛️ هذا حساب رسمي لمؤسسة أو حكومة أو هيئة. المحتوى رسمي ومعتمد.',
  green: '🤝 هذا الحساب شريك رسمي لـ ITOP.',
  purple: '🎨 هذا منشئ محتوى مميز على ITOP.',
}

export default function ChatWindow() {
  const { user } = useAuthStore()
  const { activeChat, setActiveChat, messages, setMessages, addMessage, typingUsers, setTypingUsers } = useChatStore()
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null)
  const [emojiMenu, setEmojiMenu] = useState<string | null>(null)
  const [verifyMsg, setVerifyMsg] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [timerMenu, setTimerMenu] = useState(false)
  const [deleteTimer, setDeleteTimer] = useState<number>(0)
  const [nowTick, setNowTick] = useState<number>(Date.now())
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Update tick every 10s to auto-hide expired messages live
  useEffect(() => {
    const int = setInterval(() => setNowTick(Date.now()), 10000)
    return () => clearInterval(int)
  }, [])

  useEffect(() => {
    const savedTimer = localStorage.getItem('itop_timer')
    if (savedTimer) setDeleteTimer(Number(savedTimer))
  }, [])

  const loadMessages = useCallback(async () => {
    if (!activeChat) return
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users(name, avatar_url)')
      .eq('chat_id', activeChat.id)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) || [])

    // إذا كان الآخر موثق - إظهار رسالة التوثيق مرة واحدة
    if (activeChat.other_user?.verification_color) setVerifyMsg(true)
  }, [activeChat, setMessages])

  useEffect(() => {
    loadMessages()
    if (!activeChat) return

    // Realtime subscription
    const sub = supabase
      .channel(`chat-${activeChat.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChat.id}` },
        (payload) => { addMessage(payload.new as Message) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChat.id}` },
        () => { loadMessages() })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [activeChat, loadMessages, addMessage])

  // Scroll للأسفل عند وصول رسالة جديدة
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // مؤشر الكتابة
  const handleTyping = (val: string) => {
    setText(val)
    if (!isTyping) setIsTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => setIsTyping(false), 2000)
  }

  const sendMessage = async () => {
    const content = text.trim()
    if (!content || !activeChat || !user) return
    setText('')
    setReplyTo(null)

    const msg = {
      chat_id: activeChat.id,
      sender_id: user.id,
      content,
      reply_to_id: replyTo?.id || null,
      expires_at: deleteTimer > 0 ? new Date(Date.now() + deleteTimer * 60000).toISOString() : null,
    }
    await supabase.from('messages').insert(msg)
  }

  const handleTimerSelect = async (minutes: number) => {
    setDeleteTimer(minutes)
    setTimerMenu(false)
    localStorage.setItem('itop_timer', minutes.toString())

    if (!user) return
    // Update existing messages for this user immediately
    if (minutes > 0) {
      const expiresAt = new Date(Date.now() + minutes * 60000).toISOString()
      await supabase.from('messages').update({ expires_at: expiresAt }).eq('sender_id', user.id).is('deleted_for_everyone', false)
    } else {
      await supabase.from('messages').update({ expires_at: null }).eq('sender_id', user.id).is('deleted_for_everyone', false)
    }
    loadMessages()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeChat || !user) return
    const ext = file.name.split('.').pop()
    const path = `chat-media/${activeChat.id}/${Date.now()}.${ext}`
    const { data: uploadData } = await supabase.storage.from('chat-media').upload(path, file)
    if (uploadData) {
      const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path)
      await supabase.from('messages').insert({
        chat_id: activeChat.id,
        sender_id: user.id,
        media_url: urlData.publicUrl,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
        expires_at: deleteTimer > 0 ? new Date(Date.now() + deleteTimer * 60000).toISOString() : null,
      })
    }
  }

  const deleteForEveryone = async (msgId: string) => {
    await supabase.from('messages').update({ deleted_for_everyone: true }).eq('id', msgId)
    setContextMenu(null)
  }

  const addReaction = async (msgId: string, emoji: string) => {
    await supabase.from('reactions').upsert({ message_id: msgId, user_id: user?.id, emoji }, { onConflict: 'message_id,user_id' })
    setEmojiMenu(null)
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center chat-bg" style={{ background: 'var(--bg-base)' }}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FF3B30)' }}>
            <MessageCircle size={48} color="#000" />
          </div>
          <h2 className="text-3xl font-black itop-gradient">ITOP</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>اختر محادثة للبدء</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setActiveChat(null)} className="md:hidden"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
          <ArrowRight size={18} style={{ color: 'var(--text-primary)' }} />
        </motion.button>

        {/* صورة ومعلومات */}
        <div className="flex items-center gap-3 flex-1 flex-row-reverse relative">
          
          <div className="relative">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} 
              onClick={() => setTimerMenu(!timerMenu)}
              title="رسائل ذاتية الاختفاء"
              className="absolute -right-12 top-1 w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-sm"
              style={{ background: deleteTimer > 0 ? 'rgba(255,215,0,0.15)' : 'var(--bg-elevated)', border: `1px solid ${deleteTimer > 0 ? 'var(--color-primary)' : 'var(--border-color)'}`, cursor: 'pointer', zIndex: 10 }}>
              <Clock size={16} style={{ color: deleteTimer > 0 ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
            </motion.button>

            {/* Timer Menu Dropdown */}
            <AnimatePresence>
              {timerMenu && (
                 <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }}
                   className="absolute top-12 -right-12 z-50 rounded-2xl shadow-2xl py-2 min-w-[200px]"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                   <div className="px-4 py-2 border-b mb-1" style={{ borderColor: 'var(--border-color)' }}>
                     <p className="text-right text-xs font-bold" style={{ color: 'var(--color-primary)' }}>رسائل ذاتية الاختفاء</p>
                     <p className="text-right text-[10px]" style={{ color: 'var(--text-tertiary)' }}>سيتم حذف الرسائل القديمة تلقائياً حسب الموعد المحدد</p>
                   </div>
                   {[
                     { label: 'إيقاف (احتفاظ بكل شيء)', val: 0 },
                     { label: 'بعد 5 دقائق', val: 5 },
                     { label: 'بعد 30 دقيقة', val: 30 },
                     { label: 'بعد ساعة', val: 60 }
                   ].map(opt => (
                     <button key={opt.val} className="w-full px-4 py-2.5 flex items-center justify-end gap-3 text-sm transition-colors text-right relative"
                       style={{ color: 'var(--text-primary)', cursor: 'pointer', background: 'none', border: 'none' }}
                       onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                       onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                       onClick={() => handleTimerSelect(opt.val)}>
                       {opt.label}
                       {deleteTimer === opt.val && <CheckCircle size={14} style={{ color: 'var(--color-primary)' }} />}
                     </button>
                   ))}
                 </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center"
              style={{ border: `2px solid ${activeChat.other_user?.verification_color ? `var(--verify-${activeChat.other_user.verification_color})` : 'var(--border-color)'}` }}>
              {activeChat.other_user?.avatar_url
                ? <img src={activeChat.other_user.avatar_url} className="w-full h-full object-cover" alt="" />
                : <User size={20} style={{ color: 'var(--text-tertiary)' }} />}
            </div>
            {activeChat.other_user?.is_online && (
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{ background: '#34C759', borderColor: 'var(--bg-surface)' }} />
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 flex-row-reverse">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{activeChat.other_user?.name}</span>
              <VerificationBadge color={activeChat.other_user?.verification_color ?? null} />
            </div>
            <AnimatePresence mode="wait">
              {typingUsers.length > 0 ? (
                <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-1 flex-row-reverse">
                  <span className="text-xs" style={{ color: 'var(--color-primary)' }}>يكتب...</span>
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
                  </div>
                </motion.div>
              ) : (
                <motion.p key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs" style={{ color: activeChat.other_user?.is_online ? '#34C759' : 'var(--text-tertiary)' }}>
                  {activeChat.other_user?.is_online ? 'متصل الآن' : 'غير متصل'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* رسالة التوثيق */}
      <AnimatePresence>
        {verifyMsg && activeChat.other_user?.verification_color && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-2 p-3 rounded-2xl flex items-start gap-2 justify-end"
            style={{ background: 'var(--bg-elevated)', border: `1px solid var(--verify-${activeChat.other_user.verification_color})33`, fontSize: '13px', color: 'var(--text-secondary)' }}>
            <button onClick={() => setVerifyMsg(false)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer', background: 'none', border: 'none' }}><X size={14} /></button>
            <p className="text-right flex-1">{VERIFICATION_MESSAGES[activeChat.other_user.verification_color]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* الرسائل */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-bg" style={{ display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            // Client-side auto-delete filter
            if (msg.expires_at && new Date(msg.expires_at).getTime() < nowTick) {
              return null;
            }

            const isMine = msg.sender_id === user?.id
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex ${isMine ? 'justify-start' : 'justify-end'}`}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ msg, x: e.clientX, y: e.clientY }) }}>

                <div className={`message-bubble ${isMine ? 'sent' : 'received'}`}>
                  {/* الرد على رسالة */}
                  {msg.reply_to_id && (
                    <div className="mb-2 p-2 rounded-xl text-xs" style={{ background: 'rgba(255,215,0,0.08)', borderRight: '3px solid var(--color-primary)' }}>
                      <p style={{ color: 'var(--text-tertiary)' }}>رداً على رسالة سابقة</p>
                    </div>
                  )}

                  {msg.deleted_for_everyone ? (
                    <p className="italic text-sm" style={{ color: 'var(--text-tertiary)' }}>🚫 تم حذف هذه الرسالة</p>
                  ) : msg.media_url ? (
                    <div className="rounded-xl overflow-hidden">
                      {msg.media_type === 'image'
                        ? <img src={msg.media_url} alt="media" className="max-w-xs rounded-xl cursor-pointer" onClick={() => window.open(msg.media_url!, '_blank')} />
                        : <video src={msg.media_url} controls className="max-w-xs rounded-xl" />}
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{msg.content}</p>
                  )}

                  <p className="text-xs mt-1 flex items-center gap-1 flex-row-reverse" style={{ color: 'var(--text-tertiary)', justifyContent: isMine ? 'flex-start' : 'flex-end' }}>
                    <span>{formatTime(msg.created_at)}</span>
                    {msg.expires_at && <Clock size={10} style={{ color: 'var(--color-primary)' }} />}
                    {isMine && <span className="mr-1">{msg.status === 'read' ? ' ✓✓' : msg.status === 'delivered' ? ' ✓✓' : ' ✓'}</span>}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* قائمة السياق */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 rounded-2xl shadow-2xl py-2 min-w-44"
            style={{ top: contextMenu.y, left: contextMenu.x, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
            <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-[var(--bg-hover)] transition-colors text-right"
              style={{ color: 'var(--text-primary)', cursor: 'pointer', background: 'none', border: 'none' }}
              onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null) }}>
              <Reply size={15} /> رد
            </button>
            <div className="flex px-3 py-2 gap-2">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => addReaction(contextMenu.msg.id, e)}
                  className="text-lg hover:scale-125 transition-transform cursor-pointer"
                  style={{ background: 'none', border: 'none' }}>{e}</button>
              ))}
            </div>
            {contextMenu.msg.sender_id === user?.id && !contextMenu.msg.deleted_for_everyone && (
              <button className="w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors"
                style={{ color: 'var(--color-danger)', cursor: 'pointer', background: 'none', border: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => deleteForEveryone(contextMenu.msg.id)}>
                <Trash2 size={15} /> حذف للجميع
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* رد على رسالة محددة */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-4 p-3 rounded-2xl flex items-center gap-2 justify-between"
            style={{ background: 'var(--bg-elevated)', borderRight: '3px solid var(--color-primary)' }}>
            <button onClick={() => setReplyTo(null)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer', background: 'none', border: 'none' }}><X size={16} /></button>
            <p className="text-sm text-right flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--color-primary)' }}>رداً على: </span>{replyTo.content || '📎 وسائط'}
            </p>
            <Reply size={16} style={{ color: 'var(--color-primary)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input الكتابة */}
      <div className="p-4 flex items-end gap-3" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)' }}>
        {/* إرسال */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,215,0,0.4)' }}
          whileTap={{ scale: 0.9 }}
          onClick={sendMessage} disabled={!text.trim()}
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: text.trim() ? 'linear-gradient(135deg, #FFD700, #E6C000)' : 'var(--bg-elevated)', border: 'none', cursor: text.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.3s' }}>
          <Send size={18} color={text.trim() ? '#000' : 'var(--text-tertiary)'} />
        </motion.button>

        {/* حقل الكتابة */}
        <div className="flex-1 relative">
          <textarea
            rows={1}
            placeholder="اكتب رسالة..."
            value={text}
            onChange={(e) => { handleTyping(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            className="chat-input resize-none text-right"
            style={{ maxHeight: '120px', overflow: 'auto', padding: '12px 16px' }}
          />
        </div>

        {/* أزرار المرفقات */}
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => fileRef.current?.click()}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <Image size={16} style={{ color: 'var(--text-secondary)' }} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <Mic size={16} style={{ color: 'var(--text-secondary)' }} />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
