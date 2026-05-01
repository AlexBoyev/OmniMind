import { jarvisApi } from '@/api/jarvis'
import { useJarvisStore } from '@/store/jarvisStore'

export function useJarvis() {
  const store = useJarvisStore()

  const sendMessage = async (text: string) => {
    if (!text.trim() || store.isLoading) return

    store.addMessage({ role: 'user', content: text })
    store.setLoading(true)

    try {
      const res = await jarvisApi.chat(text, store.conversationId ?? undefined)
      if (!store.conversationId) {
        store.setConversationId(res.conversation_id)
      }
      store.addMessage({ role: 'assistant', content: res.reply })
    } catch {
      store.addMessage({
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      })
    } finally {
      store.setLoading(false)
    }
  }

  return { sendMessage, ...store }
}
