'use client'

export function useNotifications() {
  async function requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  function scheduleReminder(title: string, dateTime: Date, body?: string) {
    const now = new Date()
    const delay = dateTime.getTime() - now.getTime()

    // Only schedule if it's in the future and within 24h
    if (delay < 0 || delay > 24 * 60 * 60 * 1000) return

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body || 'Você tem um atendimento agendado',
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
        })
      }
    }, delay)
  }

  function notifyNow(title: string, body?: string, url?: string) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
        data: url ? { url } : undefined,
      })
    }
  }

  return { requestPermission, scheduleReminder, notifyNow }
}
