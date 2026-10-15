const fs = require('fs');
const path = require('path');

console.log("=== 🛠️ INICIANDO REPARACIÓN INTEGRAL PRE-PWA (GILDA) ===");

// 1. SOLUCIÓN CRÍTICA 1: CREAR / ACTUALIZAR VERCEL.JSON CON REESCRITURAS SPA
const vercelConfig = {
  "version": 2,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" },
        { "key": "Content-Type", "value": "application/javascript" }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" }
      ]
    }
  ]
};
fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2), 'utf8');
console.log("✅ 1. vercel.json reescrito con rutas SPA y cabeceras de Service Worker.");

// 2. SOLUCIÓN CRÍTICA 2: RECOMPONER PUBLIC/SW.JS CON CACHÉ Y PUSH ROBUSTO
const swAvanzado = `// Service Worker Profesional PWA - Gilda
const CACHE_NAME = 'gilda-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/babydoll.ttf'
];

// Instalar Service Worker y precargar shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Precarga parcial de assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia Network-First con Fallback a Cache para navegación PWA
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/supabase') || event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Gestión de Notificaciones Push
self.addEventListener('push', (event) => {
  let data = { title: 'Gilda', body: 'Tienes una nueva novedad en el club.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    tag: 'gilda-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gilda', options)
  );
});

// Click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
`;
fs.writeFileSync('public/sw.js', swAvanzado, 'utf8');
console.log("✅ 2. public/sw.js actualizado con caché offline y gestión Push PWA.");

// 3. SOLUCIÓN CRÍTICA 3: REVISAR VITE.CONFIG.JS Y SOPORTE DE ENVPREFIX
let viteContent = fs.existsSync('vite.config.js') ? fs.readFileSync('vite.config.js', 'utf8') : '';
if (!viteContent) {
  viteContent = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'VAPID_'],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});`;
  fs.writeFileSync('vite.config.js', viteContent, 'utf8');
  console.log("✅ 3. vite.config.js creado con soporte para envPrefix.");
} else if (!viteContent.includes("envPrefix")) {
  viteContent = viteContent.replace(
    /defineConfig\(\{/,
    "defineConfig({\n  envPrefix: ['VITE_', 'VAPID_'],"
  );
  fs.writeFileSync('vite.config.js', viteContent, 'utf8');
  console.log("✅ 3. vite.config.js actualizado con envPrefix.");
}

// 4. LIMPIEZA DE MANIFIESTOS Y BASURA EN PUBLIC/
if (fs.existsSync('public/manifest.webmanifest')) {
  fs.unlinkSync('public/manifest.webmanifest');
  console.log("✅ 4. Eliminado public/manifest.webmanifest redundante.");
}

// 5. PLANTILLA DE SEGURIDAD PARA CRON-JOBS (SI EXISTE CARPETA API)
const apiDir = fs.existsSync('api') ? 'api' : (fs.existsSync('src/api') ? 'src/api' : null);
if (apiDir) {
  const cronEjemplo = path.join(apiDir, 'ejemplo-cron-protegido.js');
  const codigoCron = `// Ejemplo de Serverless Function protegida para Cron-Job.org
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const CRON_SECRET = process.env.CRON_SECRET;

  if (CRON_SECRET && authHeader !== \`Bearer \${CRON_SECRET}\`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Lógica del Cron Job
  return res.status(200).json({ success: true, timestamp: new Date().toISOString() });
}
`;
  if (!fs.existsSync(cronEjemplo)) {
    fs.writeFileSync(cronEjemplo, codigoCron, 'utf8');
    console.log(`✅ 5. Creada plantilla de seguridad Cron en ${cronEjemplo}`);
  }
}

console.log("\n✨ AUDITORÍA Y CORRECCIÓN COMPLETADAS CON ÉXITO.");
