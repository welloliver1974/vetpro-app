'use client'

import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { onlineManager } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { queryPersister } from '@/lib/offlinePersister'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
            refetchOnWindowFocus: false,
          },
          mutations: {
            networkMode: 'offlineFirst',
          },
        },
      })
  )

  useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      function handleOnline() { setOnline(true) }
      function handleOffline() { setOnline(false) }
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    })
  }, [])

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}