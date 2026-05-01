import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Brain, Send, Trash2, MessageSquare, ChevronRight, Plus, Loader,
} from 'lucide-react'
import { jarvisApi, type ConversationSummary } from '@/api/jarvis'
import { Button } from '@/components/ui/button'
import { useJarvis } from '@/hooks/useJarvis'
import { format } from 'date-fns'

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark as any}
              language={match[1]}
              PreTag="div"
              className="!mt-2 !mb-2 !rounded-lg !text-xs"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-foreground" {...props}>
              {children}
            </code>
          )
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-4 text-sm space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 text-sm space-y-1">{children}</ol>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  )
}

export function JarvisPage() {
  const [input, setInput] = useState('')
  const qc = useQueryClient()
  const { messages, isLoading, sendMessage, clearConversation, conversationId } = useJarvis()

  const { data: conversations } = useQuery({
    queryKey: ['jarvis', 'conversations'],
    queryFn: () => jarvisApi.listConversations(),
    staleTime: 30_000,
  })

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const msg = input
    setInput('')
    await sendMessage(msg)
    qc.invalidateQueries({ queryKey: ['jarvis', 'conversations'] })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar — conversation list */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-border md:flex">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Conversations</span>
          <Button size="icon" variant="ghost" onClick={clearConversation} title="New chat">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {conversations?.length === 0 && (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">No conversations yet</p>
          )}
          {conversations?.map((conv: ConversationSummary) => (
            <button
              key={conv.id}
              className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-accent ${
                conv.id === conversationId ? 'bg-primary/10 border-l-2 border-primary' : ''
              }`}
              onClick={() => {
                clearConversation()
                // TODO: load conversation messages
              }}
            >
              <p className="text-xs font-medium text-foreground truncate">{conv.title ?? 'Untitled'}</p>
              <p className="text-xs text-muted-foreground truncate">{conv.last_message_preview}</p>
              <time className="text-[10px] text-muted-foreground">
                {format(new Date(conv.updated_at), 'MMM d')}
              </time>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Jarvis</p>
              <p className="text-xs text-muted-foreground">AI Assistant · claude-opus-4-7</p>
            </div>
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearConversation}>
                <Trash2 className="h-3.5 w-3.5" /> New chat
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 gap-4">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">How can I help you?</h2>
                <p className="text-sm text-muted-foreground">Ask me anything about OmniMind, request data, or chat.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {['How many users are registered?', 'What is your purpose?', 'Show recent failed logins'].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s) }}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    <ChevronRight className="h-3 w-3" />{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                    <Brain className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground'
                }`}>
                  {msg.role === 'assistant'
                    ? <MarkdownContent content={msg.content} />
                    : <p className="text-sm">{msg.content}</p>
                  }
                </div>
                {msg.role === 'user' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15">
                <Brain className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-3">
                <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <textarea
              className="input-dark flex-1 resize-none font-mono text-sm"
              rows={1}
              placeholder="Ask Jarvis anything… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{ maxHeight: 120 }}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
