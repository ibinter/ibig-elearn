const CACHE_NAME = 'ibig-elearn-v2'
const STATIC_ASSETS = [
  '/',
  '/tableau-de-bord',
  '/mes-formations',
  '/manifest.json',
  '/offline.html',
]

// ——— Install : mettre en cache les assets statiques ———
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

// ——— Activate : supprimer anciens caches ———
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ——— Fetch : stratégies par type de ressource ———
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer : non-GET, API, auth, Supabase, assets externes
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('anthropic') ||
    url.hostname.includes('stripe') ||
    (url.hostname !== self.location.hostname && !url.pathname.startsWith('/_next/'))
  ) return

  // Assets Next.js statiques → Cache First (immutables)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()))
          return res
        })
      })
    )
    return
  }

  // Pages de leçons → Stale-While-Revalidate (offline learning)
  if (url.pathname.startsWith('/apprendre/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone())
          return res
        }).catch(() => cached || fetch('/offline.html'))
        return cached || fetchPromise
      })
    )
    return
  }

  // Navigation → Network First, fallback cache puis offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached || caches.match('/offline.html'))
        )
    )
  }
})

// ——— Message : forcer la mise à jour ———
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
