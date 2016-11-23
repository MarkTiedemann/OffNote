
const CACHE = 'cache-v0.1.0'

// PRECACHE ON INSTALLATION

self.addEventListener('install', event => {
    console.log('Service worker installed')

    event.waitUntil(
        caches.open(CACHE)
        .then(cache => cache.addAll(['/']))
        .then(self.skipWaiting())
        .then(() => console.log('Precaching successful'))
        .catch(error => console.error('Precaching failed unexpectedly:', error))
    )
})

// DELETE OUT OF DATE CACHES ON ACTIVATION (NOT NEEDED YET)

self.addEventListener('activate', event => {
    console.log('Service worker activated')

    event.waitUntil(
        caches.keys()
        .then(names => {
            return Promise.all(names.map(name => {
                if (name !== CACHE) {
                    console.log('Deleting out of date cache:', name)
                    return caches.delete(name)
                }
            }))
        })
        .then(() => self.clients.claim())
        .catch(error => console.error('Deleting failed unexpectedly:', error))
    )
})

// HANDLE FETCH WITH FASTEST-FIRST STRATEGY (BUT ALWAYS UPDATE CACHE)

self.addEventListener('fetch', event => {
    console.log('Handling fetch for:', event.request.url)

    let getResponse = callback => {
        caches.open(CACHE).then(cache => {
            console.log('Opening cache:', CACHE)

            let notYetResponded = true

            // FETCH FROM NETWORK

            fetch(event.request.clone())
            .then(response => {
                if (response.status < 400) {
                    console.log('Network request succeeded, updating cache:', response)
                    cache.put(event.request, response.clone())
                    return response
                }
            })
            .then(response => {
                if (response && notYetResponded) {
                    console.log('Responding from network:', response)
                    callback(response)
                    notYetResponded = false
                }
            })
            .catch(error => console.error('Using network failed unexpectedly:', error))

            // MATCH IN CACHE

            cache.match(event.request.clone())
            .then(response => {
                if (response) {
                    console.log('Found response in cache:', response)
                    return response
                }
            })
            .then(response => {
                if (response && notYetResponded) {
                    console.log('Responding from cache:', response)
                    callback(response)
                    notYetResponded = false
                }
            })
            .catch(error => console.error('Using cache failed unexpectedly:', error))

        })
        .catch(error => console.error('Opening cache failed unexpectedly:', error))
    }

    event.respondWith(new Promise(resolve => getResponse(resolve)))

})
