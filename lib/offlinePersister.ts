import { get, set, del } from 'idb-keyval'
import type { PersistedClient } from '@tanstack/react-query-persist-client'

const CACHE_KEY = 'vetpro-query-cache'

export const queryPersister = {
  persistClient: async (client: PersistedClient) => {
    try {
      await set(CACHE_KEY, client)
    } catch (err) {
      console.error('[offline] Failed to persist query cache:', err)
    }
  },
  restoreClient: async () => {
    try {
      return await get<PersistedClient>(CACHE_KEY)
    } catch {
      return undefined
    }
  },
  removeClient: async () => {
    try {
      await del(CACHE_KEY)
    } catch { /* noop */ }
  },
}
