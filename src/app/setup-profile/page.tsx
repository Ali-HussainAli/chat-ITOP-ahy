'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Camera, Check, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function SetupProfilePage() {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, setUser } = useAuthStore()
  const router = useRouter()

  const handleSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .update({ name: name.trim(), bio: bio.trim() })
      .eq('id', user?.id)
      .select()
      .single()
    if (data) {
      setUser(data)
      router.push('/chat')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }} className="w-full max-w-md mx-4">
        <div className="rounded-3xl p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF3B30)' }}>
              <MessageCircle size={40} color="#000" />
            </div>
            <h1 className="text-3xl font-black itop-gradient">إعداد الملف الشخصي</h1>
            <p className="mt-1 text-center" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              كمّل ملفك الشخصي للبدء
            </p>
          </div>

          {/* صورة البروفايل */}
          <div className="flex justify-center mb-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative w-24 h-24 rounded-full cursor-pointer flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-color)' }}>
              <User size={40} style={{ color: 'var(--text-tertiary)' }} />
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-primary)' }}>
                <Camera size={14} color="#000" />
              </div>
            </motion.div>
          </div>

          {/* الاسم */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>الاسم *</label>
            <input type="text" placeholder="أدخل اسمك" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full py-4 px-4 rounded-2xl text-right transition-all duration-300"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '16px' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)' }} />
          </div>

          {/* النبذة */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>النبذة الشخصية (اختياري)</label>
            <textarea placeholder="اكتب شيئاً عن نفسك..." value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full py-3 px-4 rounded-2xl text-right resize-none transition-all duration-300"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '15px' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)' }} />
          </div>

          <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,215,0,0.4)' }}
            whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={!name.trim() || loading}
            className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
            style={{ background: !name.trim() || loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #FFD700, #E6C000)', color: !name.trim() || loading ? 'var(--text-secondary)' : '#000', border: 'none', cursor: !name.trim() ? 'not-allowed' : 'pointer' }}>
            {loading ? <motion.div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} /> : <><Check size={20} /> ابدأ التواصل</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
