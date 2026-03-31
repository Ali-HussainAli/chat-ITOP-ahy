import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          name: string
          avatar_url: string | null
          bio: string | null
          last_seen: string
          is_online: boolean
          verification_color: string | null
          role: 'user' | 'admin'
          is_banned: boolean
          is_active: boolean
          created_at: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string | null
          media_url: string | null
          media_type: 'image' | 'video' | 'audio' | null
          deleted_for_everyone: boolean
          expires_at: string | null
          reply_to_id: string | null
          created_at: string
        }
      }
      chats: {
        Row: {
          id: string
          type: 'direct'
          created_at: string
        }
      }
      otps: {
        Row: {
          id: string
          phone: string
          code: string
          created_at: string
          used: boolean
        }
      }
      stories: {
        Row: {
          id: string
          user_id: string
          media_url: string
          media_type: 'image' | 'video'
          expires_at: string
          created_at: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          status: 'pending' | 'reviewed' | 'dismissed'
          created_at: string
        }
      }
    }
  }
}
