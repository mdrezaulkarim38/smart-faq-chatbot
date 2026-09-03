import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../services/api'
import type { Message, UiMessage } from '../types'

function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function useChat() {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const streamRef = useRef('')

  const selectSession = useCallback(async (sessionId: string) => {
    abortRef.current?.abort()
    setActiveSessionId(sessionId)
    setLoadingHistory(true)
    setError(null)
    try {
      const history = await api.getMessages(sessionId)
      setMessages(
        history.map((m: Message) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      )
    } catch {
      setError('Failed to load conversation history.')
      setMessages([])
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    setActiveSessionId(null)
    setMessages([])
    setError(null)
    setStreaming(false)
  }, [])

  const loadSessionAfterSend = useCallback(async (sessionId: string) => {
    try {
      const history = await api.getMessages(sessionId)
      setMessages(
        history.map((m: Message) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      )
      setActiveSessionId(sessionId)
    } catch {
      // ignore
    }
  }, [])

  const send = useCallback(
    async (text: string, onCreateSession?: (sessionId: string) => void) => {
      const content = text.trim()
      if (!content || streaming) return

      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      setError(null)
      const userMsg: UiMessage = { id: uid(), role: 'user', content }
      const assistantMsg: UiMessage = {
        id: uid(),
        role: 'assistant',
        content: '',
        streaming: true,
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setStreaming(true)

      let sessionId = activeSessionId

      if (!sessionId) {
        try {
          const res = await api.sendMessage(null, content)
          sessionId = res.sessionId
          onCreateSession?.(sessionId)
          await loadSessionAfterSend(sessionId)
          setStreaming(false)
          return
        } catch (e) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, streaming: false, error: true, content: 'Something went wrong sending your message.' }
                : m,
            ),
          )
          setStreaming(false)
          setError(e instanceof Error ? e.message : 'Request failed')
          return
        }
      }

      streamRef.current = ''
      const updateDelta = (chunk: { content: string }) => {
        streamRef.current += chunk.content
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: streamRef.current } : m)),
        )
      }

      try {
        const full = await api.streamMessage(sessionId, content, updateDelta, signal)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, content: full, streaming: false } : m,
          ),
        )
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, streaming: false, error: true, content: 'Failed to receive a reply. Please try again.' }
              : m,
          ),
        )
        setError(e instanceof Error ? e.message : 'Request failed')
      } finally {
        setStreaming(false)
      }
    },
    [activeSessionId, streaming, loadSessionAfterSend],
  )

  return {
    messages,
    activeSessionId,
    streaming,
    loadingHistory,
    error,
    send,
    selectSession,
    newChat,
  }
}
