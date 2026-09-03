import clsx from 'clsx'

interface SessionListProps {
  sessions: SessionItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

interface SessionItem {
  id: string
  title: string
  updatedAt: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function initial(title: string): string {
  const t = title.trim()
  return t ? t.charAt(0).toUpperCase() : '•'
}

export function SessionList({ sessions, activeId, onSelect, onNew, onDelete }: SessionListProps) {
  return (
    <div className="d-flex flex-column h-100 min-h-0">
      <div className="sidebar-brand px-3 pt-3 pb-2">
        <div className="d-flex align-items-center gap-2">
          <span className="brand-dot" aria-hidden="true" />
          <span className="sidebar-title">Conversations</span>
        </div>
        <button onClick={onNew} className="btn btn-primary new-chat-btn w-100 mt-3" type="button">
          <span aria-hidden="true">＋</span> <span className="new-chat-label">New chat</span>
        </button>
      </div>

      <div className="session-scroll flex-grow-1 px-2 pb-2">
        {sessions.length === 0 && (
          <div className="empty-sessions">
            <p className="mb-1">No conversations yet</p>
            <p className="mb-0 small">Start a new chat to begin.</p>
          </div>
        )}
        {sessions.map((s) => {
          const title = s.title?.trim() || 'Untitled chat'
          const active = activeId === s.id
          return (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelect(s.id)
              }}
              className={clsx('session-item', active && 'active')}
              title={title}
            >
              <span className="session-avatar" aria-hidden="true">
                {initial(title)}
              </span>
              <span className="session-meta min-vw-0">
                <span className="session-title text-truncate">{title}</span>
                <span className="session-date">{formatDate(s.updatedAt)}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(s.id)
                }}
                className="session-delete"
                title="Delete conversation"
                type="button"
                aria-label={`Delete ${title}`}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
