import { precacheAndRoute } from 'workbox-precaching';

// 1. Vite inyectará aquí todos los archivos de tu app automáticamente para que funcione Offline
precacheAndRoute(self.__WB_MANIFEST);

// 2. Escuchar las notificaciones Push (Vital para tu mailclub)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Gilda', body: 'Tienes nuevas actualizaciones en el club.' };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon.svg', // Icono monocromo para la barra superior de Android
      data: { url: data.url || '/' }
    })
  );
});

// 3. Al hacer clic en la notificación, llevar a la chica a la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});