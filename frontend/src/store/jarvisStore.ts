import { create } from 'zustand'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface JarvisState {
  isOpen: boolean
  conversationId: string | null
  messages: ChatMessage[]
  isLoading: boolean

  open: () => void
  close: () => void
  toggle: () => void
  setConversationId: (id: string) => void
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setLoading: (v: boolean) => void
  clearConversation: () => void
}

export const useJarvisStore = create<JarvisState>((set) => ({
  isOpen: false,
  conversationId: null,
  messages: [],
  isLoading: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setConversationId: (id) => set({ conversationId: id }),
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
      ],
    })),
  setLoading: (v) => set({ isLoading: v }),
  clearConversation: () => set({ conversationId: null, messages: [] }),
}))
