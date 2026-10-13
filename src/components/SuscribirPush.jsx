import { useEffect } from 'react';

export default function SuscribirPush({ sesion, supabase }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && sesion?.email) {
      registrarSuscripcion();
    }
  }, [sesion?.email]);

  const registrarSuscripcion = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const respuesta = await Notification.requestPermission();
        if (respuesta !== 'granted') return;

        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) return;

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      await supabase.from('push_subscriptions').upsert([{
        email: sesion.email,
        subscription: subscription
      }], { onConflict: 'email' });

    } catch (err) {
      console.error('Error suscribiendo a notificaciones:', err);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return null;
}