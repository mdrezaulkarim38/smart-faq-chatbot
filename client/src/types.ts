export interface ChatRequest {
  sessionId: string | null
  content: string
}

export interface ChatResponse {
  sessionId: string
  content: string
}

export interface StreamChunk {
  role: string
  content: string
  done: boolean
  // Accept legacy PascalCase payloads defensively; normalized in api.ts
  Role?: string
  Content?: string
  Done?: boolean
}

export interface Session {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  error?: boolean
}
