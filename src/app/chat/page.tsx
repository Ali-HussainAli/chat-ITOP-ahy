'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/chat/Sidebar'
import ChatWindow from '@/components/chat/ChatWindow'
import { useChatStore } from '@/store/chatStore'

export default function ChatPage() {
  const { user, theme } = useAuthStore()
  const { activeChat } = useChatStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // تطبيق الثيم المحفوظ
    document.documentElement.setAttribute('data-theme', theme)
    // التحقق من تسجيل الدخول
    if (!user) router.replace('/login')
    else if (user.is_banned) router.replace('/login')
  }, [user, router, theme, mounted])

  if (!mounted || !user) return null

  return (
    <div className="app-container">
      {/* الشريط الجانبي */}
      <div className={`sidebar ${activeChat ? 'hidden md:flex' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        <Sidebar />
      </div>

      {/* منطقة الدردشة */}
      <div className="chat-area" style={{ display: activeChat || window.innerWidth >= 768 ? 'flex' : 'none', flexDirection: 'column' }}>
        <ChatWindow />
      </div>
    </div>
  )
}
