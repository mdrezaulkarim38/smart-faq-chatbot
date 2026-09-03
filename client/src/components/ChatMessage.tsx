import clsx from 'clsx'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { UiMessage } from '../types'

export function ChatMessage({ message }: { message: UiMessage }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className={clsx('msg-row', isUser ? 'msg-user' : 'msg-assistant')}>
      <span className="msg-avatar" aria-hidden="true">
        {isUser ? '🧑' : '🤖'}
      </span>
      <div className="msg-body min-vw-0">
        <div className="msg-label">{isUser ? 'You' : 'Assistant'}</div>
        <div className={clsx('msg-bubble', isUser ? 'bubble-user' : 'bubble-assistant')}>
          {isUser ? (
            <div className="text-break msg-text">{message.content}</div>
          ) : message.content ? (
            <div className="markdown-body text-break">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : message.error ? (
            <div className="msg-error">Failed to load reply. Please try again.</div>
          ) : message.streaming ? (
            <div className="typing-indicator" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {message.content && (
            <button
              onClick={copy}
              className="btn btn-sm copy-btn"
              type="button"
              title="Copy message"
            >
              {copied ? '✓ Copied' : '⧉ Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
