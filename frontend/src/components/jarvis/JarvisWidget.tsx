import { Link } from 'react-router-dom'
import { Brain, X, Trash2, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Open Jarvis"
      >
        <Brain className="h-7 w-7" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-primary/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4.5 w-4.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Jarvis</span>
                <span className="text-xs text-muted-foreground">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  to="/jarvis"
                  onClick={toggle}
                  className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Open full chat"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Link>
                {messages.length > 0 && (
                  <button onClick={clearConversation} className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors" title="Clear">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={toggle} className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <MessageList messages={messages} isLoading={isLoading} />
            <MessageInput onSend={sendMessage} disabled={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
