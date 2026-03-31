-- ==========================================
-- ITOP Database Schema
-- انسخ كل هذا الكود والصقه في Supabase SQL Editor
-- ثم اضغط Run
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. جدول المستخدمين
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  verification_color TEXT DEFAULT NULL, -- null=unverified, 'gold'=celebrity, 'blue'=verified, 'red'=official
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. جدول أكواد OTP
-- ==========================================
CREATE TABLE IF NOT EXISTS otps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. جدول المحادثات
-- ==========================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT DEFAULT 'direct' CHECK (type IN ('direct')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. جدول أعضاء المحادثة
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- ==========================================
-- 5. جدول الرسائل
-- ==========================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'audio')),
  deleted_for_everyone BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. جدول التفاعلات
-- ==========================================
CREATE TABLE IF NOT EXISTS reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- ==========================================
-- 7. جدول الحالات (Stories)
-- ==========================================
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. جدول الحظر
-- ==========================================
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ==========================================
-- 9. جدول البلاغات
-- ==========================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- تفعيل الـ Realtime على الجداول المهمة
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE stories;

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة/الكتابة للجميع مؤقتاً (سنضبطها لاحقاً)
CREATE POLICY "Allow all for now" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON chat_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON reactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON otps FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- إنشاء حساب الأدمن الافتراضي
-- ==========================================
INSERT INTO users (phone, name, role, is_active, verification_color)
VALUES ('+20000000000', 'Admin ITOP', 'admin', true, 'gold')
ON CONFLICT (phone) DO NOTHING;
