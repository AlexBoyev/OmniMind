import { Brain, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useJarvis } from '@/hooks/useJarvis'

export function JarvisWidget() {
  const { isOpen, toggle, messages, isLoading, sendMessage, clearConversation } = useJarvis()

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Open Jarvis"
      >
        <Brain className="h-7 w-7" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-600 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5" />
              <span className="font-semibold">Jarvis</span>
              <span className="text-xs text-indigo-200">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="rounded p-1 text-indigo-200 hover:text-white"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={toggle}
                className="rounded p-1 text-indigo-200 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <MessageList messages={messages} isLoading={isLoading} />

          {/* Input */}
          <MessageInput onSend={sendMessage} disabled={isLoading} />
        </div>
      )}
    </>
  )
}
