'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, ArrowLeft, Shield, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

  const handleSendOTP = async () => {
    if (!phone || phone.length < 8) {
      setError('يرجى إدخال رقم هاتف صحيح')
      return
    }
    setLoading(true)
    setError('')
    const code = generateOTP()
    try {
      await supabase.from('otps').insert({ phone, code })
      sessionStorage.setItem('itop_phone', phone)
      router.push('/otp')
    } catch {
      setError('حدث خطأ. حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" 
      style={{ background: 'var(--bg-base)', direction: 'rtl' }}
    >
      {/* Background Animated Blobs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <motion.div
           className="absolute w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] opacity-20"
           style={{ background: 'var(--color-primary)', top: '10%' }}
           animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
           transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
           className="absolute w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full blur-[90px] opacity-20"
           style={{ background: 'var(--color-danger)', bottom: '-10%', right: '10%' }}
           animate={{ scale: [1.1, 1, 1.1], rotate: [90, 0, 90] }}
           transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 mx-auto"
      >
        <div 
          className="rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center backdrop-blur-2xl"
          style={{ 
            background: 'var(--bg-elevated)', // fallback
            backgroundColor: 'rgba(28, 28, 30, 0.7)', 
            border: '1px solid rgba(255, 215, 0, 0.15)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Logo Section */}
          <div className="flex flex-col items-center w-full gap-4 mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FFD700, #FF3B30)' }}
            >
              <MessageCircle size={38} color="#000" />
            </motion.div>
            
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-4xl font-black tracking-tight drop-shadow-md" style={{ color: 'var(--color-primary)' }}>ITOP</h1>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>تواصل بلا حدود</p>
            </div>
          </div>

          {/* Title Area */}
          <div className="w-full flex flex-col items-center gap-2 mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>تسجيل الدخول</h2>
            <p className="text-sm text-center max-w-[260px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              أدخل رقم هاتفك بشكل صحيح لتسجيل الدخول بأمان
            </p>
          </div>

          {/* Input field */}
          <div className="w-full flex flex-col gap-3 mb-6">
            <div 
              className="relative w-full flex items-center bg-black/40 rounded-2xl border transition-all duration-300 overflow-hidden focus-within:border-[#FFD700] hover:border-[#FFD700] group" 
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)', height: '60px' }}
            >
              <div className="w-14 h-full flex items-center justify-center transition-colors group-focus-within:text-[#FFD700]" style={{ color: 'var(--text-tertiary)' }}>
                <Phone size={20} />
              </div>
              <input
                type="tel"
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                className="w-full h-full pr-4 bg-transparent text-lg font-bold outline-none font-mono"
                style={{ color: 'var(--text-primary)' }}
                dir="auto"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm font-medium flex justify-center w-full"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
            style={{
              background: loading ? 'rgba(255, 255, 255, 0.1)' : 'var(--color-primary)',
              color: loading ? 'var(--text-tertiary)' : '#000',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {loading ? (
              <motion.div
                className="w-6 h-6 rounded-full border-2 border-black border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                <span>إرسال رمز التحقق</span>
                <ArrowLeft size={22} strokeWidth={2.5} />
              </>
            )}
          </motion.button>

          {/* Footer Warning */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <Shield size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              منصة آمنة ومحمية بالكامل
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
