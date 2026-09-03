import { useEffect } from 'react'
import { ChatInput } from './components/ChatInput'
import { ChatWindow } from './components/ChatWindow'
import { SessionList } from './components/SessionList'
import { ThemeToggle } from './components/ThemeToggle'
import { useChat } from './hooks/useChat'
import { useSessions } from './hooks/useSessions'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { theme, toggle } = useTheme()
  const { sessions, refresh, create, remove } = useSessions()
  const { messages, activeSessionId, streaming, loadingHistory, error, send, selectSession, newChat } =
    useChat()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        document.querySelector<HTMLTextAreaElement>('.chat-input')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleNew = async () => {
    newChat()
    try {
      const s = await create()
      await selectSession(s.id)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    if (id === activeSessionId) newChat()
    await remove(id)
  }

  const handleSend = (text: string) => {
    void send(text, () => {
      void refresh()
    })
  }

  return (
    <div className="app-shell d-flex vh-100">
      <aside className="sidebar d-flex flex-column border-end">
        <SessionList
          sessions={sessions}
          activeId={activeSessionId}
          onSelect={(id) => void selectSession(id)}
          onNew={() => void handleNew()}
          onDelete={(id) => void handleDelete(id)}
        />
      </aside>

      <main className="chat-main d-flex flex-column flex-grow-1 min-vw-0">
        <header className="chat-header d-flex align-items-center justify-content-between px-3 px-md-4">
          <div className="d-flex align-items-center gap-2 min-vw-0">
            <span className="brand-dot" aria-hidden="true" />
            <div className="min-vw-0">
              <h1 className="brand-title mb-0 text-truncate">Smart FAQ Chatbot</h1>
              <p className="brand-subtitle mb-0 text-truncate">Ask anything — I remember the conversation</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="model-badge d-none d-md-inline-flex" title="Active model">
              <span className="model-pulse" aria-hidden="true" />
              qwen3:8b · local
            </span>
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
        </header>

        {error && (
          <div className="alert alert-danger chat-alert mx-3 mx-md-4 mt-3 mb-0 py-2 small" role="alert">
            {error}
          </div>
        )}

        <div className="chat-column flex-grow-1 d-flex flex-column min-h-0">
          <ChatWindow
            messages={messages}
            loading={loadingHistory}
            isEmpty={messages.length === 0 && !loadingHistory}
            onSuggest={handleSend}
          />

          <ChatInput onSend={handleSend} disabled={streaming || loadingHistory} />
        </div>
      </main>
    </div>
  )
}
