const CACHE = 'vetpro-v1'

const offlineUrl = '/offline'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(offlineUrl))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)

  // Only cache same-origin GET requests
  if (request.method !== 'GET' || url.origin !== location.origin) return

  // Don't cache /auth pages or API calls
  if (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/')) return

  e.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE).then((cache) => cache.put(request, clone))
        return res
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match(offlineUrl)))
  )
})

self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? { title: 'VetPro', body: '' }
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    data: data.url ? { url: data.url } : undefined,
  })
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(clients.openWindow(url))
})
