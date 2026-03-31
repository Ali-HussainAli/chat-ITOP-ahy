'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, MessageSquare, TrendingUp, Shield, Ban, Trash2,
  Check, X, Eye, ChevronDown, LogOut, BarChart2, Flag, Key
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

type User = {
  id: string; phone: string; name: string; avatar_url: string | null;
  is_banned: boolean; is_active: boolean; role: string;
  verification_color: string | null; created_at: string; last_seen: string
}
type OTP = { id: string; phone: string; code: string; used: boolean; created_at: string }
type Report = { id: string; reporter_id: string; reported_id: string; reason: string; status: string; created_at: string }
type AdminMessage = { id: string; content: string; media_url: string | null; deleted_for_everyone: boolean; created_at: string; sender: { name: string; phone: string } }
type Stats = { users: number; messages: number; activeToday: number; reports: number }

const VERIFY_COLORS = [
  { label: 'بدون', value: null },
  { label: '⭐ شهير (ذهبي)', value: 'gold' },
  { label: '✅ موثق (أزرق)', value: 'blue' },
  { label: '🏛️ رسمي (أحمر)', value: 'red' },
  { label: '🤝 شريك (أخضر)', value: 'green' },
  { label: '🎨 منشئ (بنفسجي)', value: 'purple' },
]

const tabs = [
  { id: 'stats', label: 'الإحصائيات', icon: BarChart2 },
  { id: 'users', label: 'المستخدمون', icon: Users },
  { id: 'messages', label: 'الرسائل', icon: MessageSquare },
  { id: 'otps', label: 'أكواد OTP', icon: Key },
  { id: 'reports', label: 'البلاغات', icon: Flag },
]

export default function AdminPage() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('stats')
  const [users, setUsers] = useState<User[]>([])
  const [otps, setOtps] = useState<OTP[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [allMessages, setAllMessages] = useState<AdminMessage[]>([])
  const [stats, setStats] = useState<Stats>({ users: 0, messages: 0, activeToday: 0, reports: 0 })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!user || user.role !== 'admin') {
      router.replace('/chat')
    } else {
      loadAll()
    }
  }, [user, router, mounted])

  const loadAll = async () => {
    setLoading(true)
    const [usersRes, otpsRes, reportsRes, msgsCountRes, msgsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('otps').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('id', { count: 'exact' }),
      supabase.from('messages').select('*, sender:users!sender_id(name, phone)').order('created_at', { ascending: false }).limit(200),
    ])
    const today = new Date().toISOString().split('T')[0]
    const activeToday = usersRes.data?.filter(u => u.last_seen?.startsWith(today)).length || 0
    setUsers(usersRes.data || [])
    setOtps(otpsRes.data || [])
    setReports(reportsRes.data || [])
    setAllMessages((msgsRes.data as unknown as AdminMessage[]) || [])
    setStats({
      users: usersRes.data?.length || 0,
      messages: msgsCountRes.count || 0,
      activeToday,
      reports: reportsRes.data?.filter(r => r.status === 'pending').length || 0,
    })
    setLoading(false)
  }

  const toggleBan = async (u: User) => {
    await supabase.from('users').update({ is_banned: !u.is_banned }).eq('id', u.id)
    await loadAll()
  }

  const deleteUser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return
    await supabase.from('users').delete().eq('id', id)
    await loadAll()
  }

  const deleteMessageGlobal = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الرسالة للجميع نهائياً؟')) return
    await supabase.from('messages').update({ deleted_for_everyone: true }).eq('id', id)
    await loadAll()
  }

  const setVerification = async (userId: string, color: string | null) => {
    await supabase.from('users').update({ verification_color: color }).eq('id', userId)
    await loadAll()
  }

  const toggleActive = async (u: User) => {
    await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id)
    await loadAll()
  }

  const handleReportAction = async (id: string, status: string) => {
    await supabase.from('reports').update({ status }).eq('id', id)
    await loadAll()
  }

  const handleLogout = () => { setUser(null); router.push('/login') }

  const statCards = [
    { label: 'إجمالي المستخدمين', value: stats.users, icon: Users, color: '#FFD700' },
    { label: 'إجمالي الرسائل', value: stats.messages, icon: MessageSquare, color: '#1DA1F2' },
    { label: 'نشطون اليوم', value: stats.activeToday, icon: TrendingUp, color: '#34C759' },
    { label: 'بلاغات معلقة', value: stats.reports, icon: Flag, color: '#FF3B30' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(12px)' }}>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleLogout}
          className="flex items-center gap-2 py-2 px-4 rounded-xl text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <LogOut size={14} /> خروج
        </motion.button>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-black text-right itop-gradient">ITOP Admin</h1>
            <p className="text-xs text-right" style={{ color: 'var(--text-tertiary)' }}>لوحة التحكم الرئيسية</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #FFD700, #FF3B30)' }}>
            <Shield size={20} color="#000" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <motion.button key={tab.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 py-2 px-5 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #FFD700, #E6C000)' : 'var(--bg-surface)',
                color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${activeTab === tab.id ? 'transparent' : 'var(--border-color)'}`,
                cursor: 'pointer',
              }}>
              <tab.icon size={15} />
              {tab.label}
              {tab.id === 'reports' && stats.reports > 0 && (
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ background: '#FF3B30', color: '#fff' }}>{stats.reports}</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Stats */}
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((s, i) => (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="rounded-3xl p-5 text-right"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: `0 0 30px ${s.color}15` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
                        <s.icon size={20} color={s.color} />
                      </div>
                    </div>
                    <p className="text-3xl font-black" style={{ color: s.color }}>{loading ? '...' : s.value.toLocaleString()}</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
                  </motion.div>
                ))}
              </div>
              <div className="rounded-3xl p-6 text-right" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>آخر المستخدمين المسجلين</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl" style={{ background: 'var(--bg-elevated)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(u.created_at).toLocaleDateString('ar')}</span>
                      <div className="text-right">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{u.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>إجمالي: {users.length}</span>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>إدارة المستخدمين</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {users.map((u) => (
                    <div key={u.id} className="p-4 flex items-center gap-3 flex-wrap" style={{ direction: 'rtl' }}>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="flex items-center gap-2 justify-start mb-1">
                          {u.role === 'admin' && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FFD70020', color: '#FFD700' }}>أدمن</span>}
                          {u.is_banned && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FF3B3020', color: '#FF3B30' }}>محظور</span>}
                          {!u.is_active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#66666620', color: '#999' }}>معطل</span>}
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{u.name}</p>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{u.phone}</p>
                      </div>

                      {/* التوثيق */}
                      <select value={u.verification_color || ''} onChange={(e) => setVerification(u.id, e.target.value || null)}
                        className="text-xs rounded-xl px-3 py-2"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                        {VERIFY_COLORS.map(c => <option key={c.value || 'none'} value={c.value || ''}>{c.label}</option>)}
                      </select>

                      {/* أزرار الإجراءات */}
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => toggleActive(u)} title={u.is_active ? 'تعطيل' : 'تفعيل'}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: u.is_active ? '#34C75920' : 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                          <Check size={14} color={u.is_active ? '#34C759' : 'var(--text-tertiary)'} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => toggleBan(u)} title={u.is_banned ? 'فك الحظر' : 'حظر'}
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: u.is_banned ? '#FF3B3020' : 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                          <Ban size={14} color={u.is_banned ? '#FF3B30' : 'var(--text-tertiary)'} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => deleteUser(u.id)} title="حذف"
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                          <Trash2 size={14} color="#FF3B30" />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages Monitoring Tab */}
          {activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="p-4 text-right flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', direction: 'rtl' }}>
                  <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Eye size={18} style={{ color: 'var(--color-primary)' }} />
                    مراقبة آخر الرسائل المرسلة
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,59,48,0.1)', color: '#FF3B30' }}>
                    صلاحية الأدمن فقط
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {allMessages.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>لا يوجد رسائل مسجلة</div>
                  ) :allMessages.map((msg) => (
                    <div key={msg.id} className="p-4 flex gap-3 flex-row-reverse" style={{ direction: 'rtl' }}>
                      <div className="flex-1 text-right">
                        <div className="flex items-center gap-2 mb-1 justify-start">
                          <p className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                            {msg.sender?.name || 'مجهول'}
                            <span className="text-xs font-normal mx-2" style={{ color: 'var(--text-tertiary)' }}>
                              ({msg.sender?.phone})
                            </span>
                          </p>
                          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                            {new Date(msg.created_at).toLocaleString('ar')}
                          </span>
                        </div>
                        {msg.deleted_for_everyone ? (
                          <p className="text-sm italic" style={{ color: 'var(--color-danger)' }}>🚫 تم حذف الرسالة</p>
                        ) : msg.media_url ? (
                          <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mt-1">
                            <img src={msg.media_url} className="w-full h-full object-cover" alt="media" />
                          </div>
                        ) : (
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{msg.content}</p>
                        )}
                      </div>
                      
                      {!msg.deleted_for_everyone && (
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => deleteMessageGlobal(msg.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                          title="حذف هذه الرسالة للجميع"
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--color-danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} color="var(--color-danger)" />
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* OTPs Tab */}
          {activeTab === 'otps' && (
            <motion.div key="otps" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="p-4 text-right" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>أكواد التحقق OTP</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>شارك الكود مع المستخدم يدوياً لإتمام تسجيل الدخول</p>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {otps.map((o) => (
                    <div key={o.id} className="p-4 flex items-center gap-4 flex-row-reverse">
                      <div className="flex-1 text-right">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{o.phone}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(o.created_at).toLocaleString('ar')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {o.used && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#34C75920', color: '#34C759' }}>مستخدم</span>}
                        <span className="font-mono text-2xl font-black tracking-widest px-4 py-2 rounded-2xl"
                          style={{ background: o.used ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #FFD700, #E6C000)', color: o.used ? 'var(--text-tertiary)' : '#000' }}>
                          {o.code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
                <div className="p-4 text-right" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>البلاغات</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {reports.length === 0
                    ? <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>لا يوجد بلاغات</div>
                    : reports.map((r) => (
                      <div key={r.id} className="p-4 flex items-start gap-3 flex-row-reverse">
                        <div className="flex-1 text-right">
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{r.reason}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{new Date(r.created_at).toLocaleDateString('ar')}</p>
                        </div>
                        {r.status === 'pending' && (
                          <div className="flex gap-2">
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => handleReportAction(r.id, 'reviewed')}
                              className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{ background: '#34C75920', border: 'none', cursor: 'pointer' }}>
                              <Check size={14} color="#34C759" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => handleReportAction(r.id, 'dismissed')}
                              className="w-8 h-8 rounded-xl flex items-center justify-center"
                              style={{ background: '#FF3B3020', border: 'none', cursor: 'pointer' }}>
                              <X size={14} color="#FF3B30" />
                            </motion.button>
                          </div>
                        )}
                        <span className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: r.status === 'pending' ? '#FFD70020' : r.status === 'reviewed' ? '#34C75920' : '#66666620',
                            color: r.status === 'pending' ? '#FFD700' : r.status === 'reviewed' ? '#34C759' : '#999'
                          }}>
                          {r.status === 'pending' ? 'معلق' : r.status === 'reviewed' ? 'مراجع' : 'مرفوض'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
