import { useEffect, useRef } from 'react'
import { Brain, User } from 'lucide-react'
import type { ChatMessage } from '@/store/jarvisStore'

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
        <Brain className="h-10 w-10 text-indigo-300" />
        <p className="text-sm">Ask me anything about OmniMind</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {msg.role === 'assistant' && (
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Brain className="h-3.5 w-3.5 text-indigo-600" />
            </div>
          )}
          <div
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {msg.content}
          </div>
          {msg.role === 'user' && (
            <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <User className="h-3.5 w-3.5 text-indigo-600" />
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <Brain className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="flex gap-1 rounded-2xl bg-slate-100 px-3 py-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
