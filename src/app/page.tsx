'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'

export default function HomePage() {
  const { user, theme } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const timer = setTimeout(() => {
      if (!user) router.replace('/login')
      else if (user.role === 'admin') router.replace('/admin')
      else router.replace('/chat')
    }, 1200)
    return () => clearTimeout(timer)
  }, [user, router, theme])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FFD700, #FF3B30)' }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MessageCircle size={48} color="#000" />
        </motion.div>
        <h1 className="text-5xl font-black itop-gradient">ITOP</h1>
        <motion.div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-2 h-2 rounded-full"
              style={{ background: 'var(--color-primary)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
