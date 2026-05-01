import { apiClient } from './client'

export interface JarvisMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
  conversation_id: string
  message_id: string
  tokens_in: number
  tokens_out: number
}

export interface ConversationSummary {
  id: string
  title: string | null
  last_message_preview: string
  updated_at: string
}

export const jarvisApi = {
  chat: async (message: string, conversationId?: string): Promise<ChatResponse> => {
    const { data } = await apiClient.post<ChatResponse>('/jarvis/chat', {
      message,
      conversation_id: conversationId ?? null,
    })
    return data
  },

  listConversations: async (): Promise<ConversationSummary[]> => {
    const { data } = await apiClient.get<ConversationSummary[]>('/jarvis/conversations')
    return data
  },

  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/jarvis/conversations/${id}`)
  },
}
