const fs = require("fs");

const nuevoSuscribirPush = `import React, { useState, useEffect } from 'react';

export default function SuscribirPush({ sesion, supabase }) {
  const [estado, setEstado] = useState('cargando'); // 'desactivado', 'activado', 'denegado', 'no_soportado'
  const [mensaje, setMensaje] = useState('');

  const publicVapidKey = import.meta.env.VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setEstado('no_soportado');
      return;
    }

    if (Notification.permission === 'granted') {
      setEstado('activado');
    } else if (Notification.permission === 'denied') {
      setEstado('denegado');
    } else {
      setEstado('desactivado');
    }
  }, []);

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

  const activarNotificaciones = async () => {
    if (!sesion?.email) {
      setMensaje('Debes iniciar sesión para activar las notificaciones.');
      return;
    }

    if (!publicVapidKey) {
      setMensaje('Error: Clave VAPID no configurada en Vercel.');
      console.error('Falta VAPID_PUBLIC_KEY o VITE_VAPID_PUBLIC_KEY');
      return;
    }

    try {
      setEstado('cargando');
      setMensaje('');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setEstado('denegado');
        setMensaje('Permiso de notificaciones denegado en el navegador.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      const subData = subscription.toJSON();

      if (supabase) {
        await supabase.from('push_subscriptions').upsert([{
          email: (sesion.email || '').toLowerCase().trim(),
          endpoint: subData.endpoint,
          p256dh: subData.keys?.p256dh || '',
          auth: subData.keys?.auth || ''
        }], { onConflict: 'endpoint' });
      }

      setEstado('activado');
      setMensaje('¡Notificaciones activadas con éxito!');
    } catch (err) {
      console.error('Error al suscribir a push:', err);
      setEstado('desactivado');
      setMensaje('Error al activar: ' + (err.message || 'Inténtalo de nuevo'));
    }
  };

  if (estado === 'no_soportado') return null;

  return (
    <div className="p-4 my-3 bg-[#fbf9f5] border border-[#e8e4d9] rounded-xl text-center shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-left">
          <p className="text-xs font-semibold text-[#23211e] tracking-tight">Notificaciones Push</p>
          <p className="text-[11px] text-[#75706b]">Recibe avisos al instante cuando te escriban por privado</p>
        </div>

        {estado === 'activado' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#849673]/15 text-[#849673]">
            <span className="w-2 h-2 rounded-full bg-[#849673]"></span>
            Activadas
          </span>
        ) : (
          <button
            onClick={activarNotificaciones}
            disabled={estado === 'cargando'}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#849673] text-white hover:bg-[#6e7e5f] transition-all disabled:opacity-50 cursor-pointer"
          >
            {estado === 'cargando' ? 'Activando...' : 'Activar notificaciones'}
          </button>
        )}
      </div>

      {mensaje && (
        <p className={\`mt-2 text-[11px] \${estado === 'activado' ? 'text-[#849673]' : 'text-red-600'}\`}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
`;

fs.writeFileSync("src/components/SuscribirPush.jsx", nuevoSuscribirPush);
console.log("✅ Componente SuscribirPush.jsx completamente renovado y visible.");
