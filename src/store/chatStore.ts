import { create } from 'zustand'

export type Message = {
  id: string
  chat_id: string
  sender_id: string
  content: string | null
  media_url: string | null
  media_type: 'image' | 'video' | 'audio' | null
  deleted_for_everyone: boolean
  expires_at: string | null
  reply_to_id: string | null
  status: 'sent' | 'delivered' | 'read'
  created_at: string
  sender?: {
    name: string
    avatar_url: string | null
  }
}

export type Chat = {
  id: string
  type: 'direct'
  created_at: string
  other_user?: {
    id: string
    name: string
    avatar_url: string | null
    is_online: boolean
    last_seen: string
    verification_color: string | null
  }
  last_message?: Message | null
  unread_count?: number
}

type ChatStore = {
  chats: Chat[]
  activeChat: Chat | null
  messages: Message[]
  typingUsers: string[]
  setChats: (chats: Chat[]) => void
  setActiveChat: (chat: Chat | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, data: Partial<Message>) => void
  setTypingUsers: (users: string[]) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  typingUsers: [],
  setChats: (chats) => set({ chats }),
  setActiveChat: (chat) => set({ activeChat: chat, messages: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, data) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...data } : m)),
    })),
  setTypingUsers: (users) => set({ typingUsers: users }),
}))
