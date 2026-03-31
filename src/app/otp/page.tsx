'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ArrowRight, MessageCircle, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const phone = typeof window !== 'undefined' ? sessionStorage.getItem('itop_phone') : null

  useEffect(() => {
    if (!phone) router.replace('/login')
    refs.current[0]?.focus()
  }, [phone, router])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setError('أدخل الكود كاملاً (6 أرقام)'); return }
    setLoading(true)
    setError('')
    try {
      // التحقق من الكود
      const { data: otpData } = await supabase
        .from('otps')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!otpData) { setError('الكود غير صحيح أو منتهي'); setLoading(false); return }

      // تعيين الكود كـ مستخدم
      await supabase.from('otps').update({ used: true }).eq('id', otpData.id)

      // البحث عن المستخدم أو إنشاؤه
      let { data: user } = await supabase.from('users').select('*').eq('phone', phone!).single()
      if (!user) {
        const { data: newUser } = await supabase.from('users').insert({ phone, name: phone! }).select().single()
        user = newUser
      }

      if (user?.is_banned) { setError('هذا الحساب محظور'); setLoading(false); return }

      setSuccess(true)
      setTimeout(() => {
        setUser(user)
        if (user?.name === user?.phone) {
          router.push('/setup-profile')
        } else if (user?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/chat')
        }
      }, 1000)
    } catch {
      setError('حدث خطأ. حاول مرة أخرى')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* خلفية */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FFD700, transparent)', top: '-5%', right: '-5%' }}
          animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 7, repeat: Infinity }} />
        <motion.div className="absolute w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF3B30, transparent)', bottom: '10%', left: '-5%' }}
          animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 9, repeat: Infinity }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-4 relative z-10">
        <div className="rounded-3xl p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>

          {/* لوجو */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF3B30)' }}>
              <MessageCircle size={40} color="#000" />
            </div>
            <h1 className="text-4xl font-black itop-gradient">ITOP</h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>كود التحقق</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              تم إرسال كود إلى <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{phone}</span>
              <br />
              <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                (اطلب الكود من مشرف التطبيق)
              </span>
            </p>
          </motion.div>

          {/* خانات OTP */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex gap-3 justify-center mb-6 flex-row-reverse">
            {otp.map((digit, i) => (
              <motion.input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                whileFocus={{ scale: 1.05 }}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl transition-all duration-200"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `2px solid ${digit ? 'var(--color-primary)' : 'var(--border-color)'}`,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxShadow: digit ? '0 0 10px rgba(255,215,0,0.2)' : 'none',
                }}
              />
            ))}
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="text-sm mb-4 text-center" style={{ color: 'var(--color-danger)' }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* زر التحقق */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: success ? '0 0 25px rgba(52,199,89,0.4)' : '0 0 25px rgba(255,215,0,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleVerify}
            disabled={loading || success}
            className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
            style={{
              background: success
                ? 'linear-gradient(135deg, #34C759, #2AAA4B)'
                : loading
                ? 'var(--bg-elevated)'
                : 'linear-gradient(135deg, #FFD700, #E6C000)',
              color: loading ? 'var(--text-secondary)' : '#000',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {success ? (
              <><ShieldCheck size={20} /> تم التحقق! جاري الدخول...</>
            ) : loading ? (
              <><motion.div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent"
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                جاري التحقق...</>
            ) : (
              <><ShieldCheck size={20} /> تحقق من الكود</>
            )}
          </motion.button>

          {/* رجوع */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            onClick={() => router.push('/login')}
            className="w-full mt-3 py-3 rounded-2xl font-medium flex items-center justify-center gap-2"
            style={{ background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', border: '1px solid var(--border-color)', fontSize: '14px' }}>
            <ArrowRight size={16} />
            تغيير رقم الهاتف
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
