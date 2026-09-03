import { useRef, useState, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const areaRef = useRef<HTMLTextAreaElement>(null)

  const autoGrow = () => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    requestAnimationFrame(() => {
      if (areaRef.current) areaRef.current.style.height = 'auto'
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={areaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            autoGrow()
          }}
          onKeyDown={onKeyDown}
          placeholder="Message the assistant… (Enter to send, Shift+Enter for a new line)"
          rows={1}
          className="form-control chat-input"
          disabled={disabled}
        />
        <button
          onClick={submit}
          className="btn btn-primary send-btn"
          disabled={disabled || !value.trim()}
          type="button"
          title="Send message"
          aria-label="Send message"
        >
          <span aria-hidden="true">↑</span>
        </button>
      </div>
      <p className="composer-hint mb-0">Streaming answers · history saved per session</p>
    </div>
  )
}
