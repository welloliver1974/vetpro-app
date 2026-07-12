'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    function handleOnline() { setIsOnline(true) }
    function handleOffline() { setIsOnline(false) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="bg-amber-600 text-amber-50 text-xs font-medium text-center py-1.5 px-4 flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Você está offline. Os dados exibidos são da última visita.</span>
    </div>
  )
}
