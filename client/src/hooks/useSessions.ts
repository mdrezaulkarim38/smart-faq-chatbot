import { useCallback, useEffect, useState } from 'react'
import * as api from '../services/api'
import type { Session } from '../types'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setSessions(await api.listSessions())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(async () => {
    const session = await api.createSession()
    setSessions((prev) => [session, ...prev])
    return session
  }, [])

  const remove = useCallback(async (id: string) => {
    await api.deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { sessions, loading, refresh, create, remove }
}
