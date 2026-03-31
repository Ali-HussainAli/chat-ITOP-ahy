'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Camera, ArrowRight, Shield, Edit2, Phone, FileText, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import VerificationBadge from '@/components/ui/VerificationBadge'

const VERIFY_LABELS: Record<string, string> = {
  gold: '⭐ شخصية مشهورة',
  blue: '✅ حساب موثق',
  red: '🏛️ جهة رسمية',
  green: '🤝 شريك ITOP',
  purple: '🎨 منشئ محتوى',
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!user) router.replace('/login')
    else {
      setName(user.name || '')
      setBio(user.bio || '')
    }
  }, [user, router, mounted])

  const handleSave = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .update({ name: name.trim(), bio: bio.trim() })
      .eq('id', user?.id)
      .select()
      .single()
    if (data) setUser(data)
    setEditing(false)
    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const path = `avatars/${user.id}.${file.name.split('.').pop()}`
    const { data } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (data) {
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const { data: updated } = await supabase
        .from('users')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id)
        .select()
        .single()
      if (updated) setUser(updated)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{ background: editing ? 'linear-gradient(135deg, #FFD700, #E6C000)' : 'var(--bg-elevated)', color: editing ? '#000' : 'var(--text-secondary)', border: `1px solid ${editing ? 'transparent' : 'var(--border-color)'}`, cursor: 'pointer', fontWeight: 600 }}>
          <Edit2 size={14} />
          {editing ? 'إلغاء' : 'تعديل'}
        </motion.button>
        <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>الملف الشخصي</h1>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
          <ArrowRight size={16} style={{ color: 'var(--text-secondary)' }} />
        </motion.button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* صورة البروفايل */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 flex flex-col items-center gap-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
              style={{ border: `3px solid ${user.verification_color ? `var(--verify-${user.verification_color})` : 'var(--color-primary)'}`, boxShadow: `0 0 20px ${user.verification_color ? `var(--verify-${user.verification_color})` : 'var(--color-primary)'}40` }}>
              {user.avatar_url
                ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                : <User size={48} style={{ color: 'var(--text-tertiary)' }} />}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #FFD700, #E6C000)' }}>
              <Camera size={15} color="#000" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <VerificationBadge color={user.verification_color} size={20} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
            </div>
            {user.verification_color && (
              <p className="text-sm mt-1" style={{ color: `var(--verify-${user.verification_color})` }}>
                {VERIFY_LABELS[user.verification_color]}
              </p>
            )}
          </div>
        </motion.div>

        {/* معلومات قابلة للتعديل */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-5 space-y-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>

          {/* الاسم */}
          <div>
            <label className="flex items-center gap-2 justify-end text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              الاسم <User size={14} />
            </label>
            {editing
              ? <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full py-3 px-4 rounded-2xl text-right transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--color-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              : <p className="text-right font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>}
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="flex items-center gap-2 justify-end text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              رقم الهاتف <Phone size={14} />
            </label>
            <p className="text-right font-medium" style={{ color: 'var(--text-tertiary)' }}>{user.phone}</p>
          </div>

          {/* النبذة */}
          <div>
            <label className="flex items-center gap-2 justify-end text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              النبذة <FileText size={14} />
            </label>
            {editing
              ? <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  className="w-full py-3 px-4 rounded-2xl text-right resize-none transition-all"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--color-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              : <p className="text-right" style={{ color: user.bio ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{user.bio || 'لا يوجد نبذة'}</p>}
          </div>

          {editing && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave} disabled={loading}
              className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FFD700, #E6C000)', color: '#000', border: 'none', cursor: 'pointer' }}>
              {loading ? <motion.div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} /> : 'حفظ التغييرات'}
            </motion.button>
          )}
        </motion.div>

        {/* الأمان والخصوصية */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-3xl p-5 space-y-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-bold text-right mb-4" style={{ color: 'var(--text-primary)' }}>🔒 الأمان والخصوصية</h3>
          <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'var(--bg-elevated)' }}>
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ background: user.is_active ? '#34C75920' : '#FF3B3020', color: user.is_active ? '#34C759' : '#FF3B30' }}>
              {user.is_active ? 'نشط' : 'غير نشط'}
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>حالة الحساب</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'var(--bg-elevated)' }}>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(user.created_at).toLocaleDateString('ar')}
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>تاريخ الانضمام</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
