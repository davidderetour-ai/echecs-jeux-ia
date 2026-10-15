const CACHE="alicia-shell-v3";
const FILES=["./","./index.html","./styles.css","./app.js","./avatar.js","./tool-finder.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE).map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||event.request.url.includes("/.netlify/functions/"))return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)))});
