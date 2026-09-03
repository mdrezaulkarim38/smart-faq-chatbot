import type { Message, Session, StreamChunk } from '../types'

const BASE = '/api'

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `Request failed with status ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function listSessions(): Promise<Session[]> {
  return handle(await fetch(`${BASE}/sessions`))
}

export async function createSession(title?: string): Promise<Session> {
  return handle(
    await fetch(`${BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),
  )
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${BASE}/sessions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete session (${res.status})`)
}

export async function getMessages(id: string): Promise<Message[]> {
  return handle(await fetch(`${BASE}/sessions/${id}/messages`))
}

export async function sendMessage(sessionId: string | null, content: string): Promise<{ sessionId: string; content: string }> {
  return handle(
    await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, content }),
    }),
  )
}

export async function streamMessage(
  sessionId: string | null,
  content: string,
  onDelta: (chunk: StreamChunk) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, content }),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`Failed to stream (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sepIndex: number
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, sepIndex)
      buffer = buffer.slice(sepIndex + 2)
      const dataLine = event.split('\n').find((l) => l.startsWith('data:'))
      if (!dataLine) continue
      const data = dataLine.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const raw = JSON.parse(data) as StreamChunk
        const chunk: StreamChunk = {
          role: raw.role ?? raw.Role ?? 'assistant',
          content: raw.content ?? raw.Content ?? '',
          done: raw.done ?? raw.Done ?? false,
        }
        full += chunk.content
        onDelta(chunk)
      } catch {
        // ignore malformed events
      }
    }
  }

  return full
}
