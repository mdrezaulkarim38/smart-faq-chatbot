import { useEffect, useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import type { UiMessage } from '../types'

interface ChatWindowProps {
  messages: UiMessage[]
  loading: boolean
  isEmpty: boolean
  onSuggest: (text: string) => void
}

const SUGGESTIONS = [
  'What is your refund policy?',
  'Give me a C# encapsulation example',
  'How do I reset my password?',
]

export function ChatWindow({ messages, loading, isEmpty, onSuggest }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  if (isEmpty) {
    return (
      <div className="chat-scroll">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            💬
          </div>
          <h2 className="empty-title">How can I help?</h2>
          <p className="empty-subtitle">
            Ask a question to get an instant answer. I keep the conversation context, so you can
            ask follow-ups.
          </p>
          <div className="suggest-row">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="suggest-chip"
                onClick={() => onSuggest(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-scroll" ref={scrollRef}>
      <div className="msg-list">
        {loading && <div className="loading-line">Loading conversation…</div>}
        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
      </div>
    </div>
  )
}
