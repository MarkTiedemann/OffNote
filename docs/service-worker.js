
const VERSION = '0.2.0'
const PREFETCH_CACHE = `offnote-prefetch-cache-v${VERSION}`
const RUNTIME_CACHE = `offnote-runtime-cache-v${VERSION}`
const DEV_ENV = location.href.startsWith('http://localhost:3000/')
const PREFETCH_RESOURCES = [
  '/',
  '/favicon.png'
]
.map(res => DEV_ENV ? res : '/offnote' + res)

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PREFETCH_CACHE)
      .then(cache => cache.addAll(PREFETCH_RESOURCES))
      .then(() => self.skipWaiting())
      .catch(e => DEV_ENV ? console.error('Failed to prefetch:', e) : 0)
  )
})

self.addEventListener('activate', event => {
  const currentCaches = [PREFETCH_CACHE, RUNTIME_CACHE]
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete)
      }))
    })
    .then(() => self.clients.claim())
    .catch(e => DEV_ENV ? console.error('Failed to delete:', e) : 0)
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse
      }

      return caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(event.request).then(response => {
          return cache.put(event.request, response.clone()).then(() => {
            return response
          })
        }).catch(e => DEV_ENV ? console.error('Failed to fetch:', e) : 0)
      })
    })
  )
})
