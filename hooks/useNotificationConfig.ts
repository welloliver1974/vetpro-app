'use client'

import { useState, useEffect } from 'react'
import { loadNotifyConfigAsync, saveNotifyConfig, clearNotifyConfig, type NotificationConfig } from '@/lib/notification/config'

export function useNotificationConfig() {
  const [config, setConfig] = useState<NotificationConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifyConfigAsync().then((cfg) => {
      setConfig(cfg)
      setLoading(false)
    })
  }, [])

  async function save(updated: NotificationConfig) {
    await saveNotifyConfig(updated)
    setConfig(updated)
  }

  async function clear() {
    await clearNotifyConfig()
    setConfig(null)
  }

  return { config, save, clear, loading }
}
