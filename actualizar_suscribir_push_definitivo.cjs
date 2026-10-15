const fs = require("fs");

const nuevoSuscribirPush = `import React, { useState, useEffect } from 'react';

export default function SuscribirPush({ sesion, supabase }) {
  const [estado, setEstado] = useState('cargando'); // 'cargando', 'desactivado', 'activado', 'denegado', 'no_soportado'
  const [mensaje, setMensaje] = useState('');

  const publicVapidKey = import.meta.env.VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY;

  useEffect(() => {
    async function comprobarEstado() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setEstado('no_soportado');
        return;
      }

      if (Notification.permission === 'denied') {
        setEstado('denegado');
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription && Notification.permission === 'granted') {
          setEstado('activado');
        } else {
          setEstado('desactivado');
        }
      } catch (err) {
        setEstado(Notification.permission === 'granted' ? 'activado' : 'desactivado');
      }
    }

    comprobarEstado();
  }, [sesion]);

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
      setMensaje('Error: Clave VAPID_PUBLIC_KEY no configurada en Vercel.');
      console.error('Falta la variable de entorno VAPID_PUBLIC_KEY o VITE_VAPID_PUBLIC_KEY');
      return;
    }

    try {
      setEstado('cargando');
      setMensaje('');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setEstado('denegado');
        setMensaje('Permiso denegado en la configuración del navegador.');
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
      setMensaje('¡Notificaciones activadas correctamente!');
    } catch (err) {
      console.error('Error al activar push:', err);
      setEstado('desactivado');
      setMensaje('Error al activar: ' + (err.message || 'Revisa los permisos del navegador'));
    }
  };

  const desactivarNotificaciones = async () => {
    try {
      setEstado('cargando');
      setMensaje('');

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();

          if (supabase && endpoint) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
          }
        }
      }

      setEstado('desactivado');
      setMensaje('Notificaciones desactivadas.');
    } catch (err) {
      console.error('Error al desactivar push:', err);
      setEstado('activado');
      setMensaje('No se pudo desactivar en este momento.');
    }
  };

  if (estado === 'no_soportado') return null;

  return (
    <div className="p-4 my-3 bg-[#fbf9f5] border border-[#e8e4d9] rounded-xl text-center shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-left max-w-lg">
          <p className="text-xs font-semibold text-[#23211e] tracking-tight">Centro de Notificaciones Push</p>
          <p className="text-[11px] text-[#75706b] leading-tight mt-1">
            Avisos de chat privado y menciones, comentarios en capítulos desbloqueados, alertas de «Aquí y ahora» (estilo BeReal), nuevas fechas de Cafecito Virtual, resultados de votaciones y respuestas en el buzón.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {estado === 'activado' ? (
            <button
              onClick={desactivarNotificaciones}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#849673]/15 text-[#849673] hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer flex items-center gap-1.5"
              title="Haz clic para desactivar"
            >
              <span className="w-2 h-2 rounded-full bg-[#849673]"></span>
              Activadas (Desactivar)
            </button>
          ) : estado === 'denegado' ? (
            <span className="text-[11px] text-red-600 font-medium">Bloqueado en el navegador</span>
          ) : (
            <button
              onClick={activarNotificaciones}
              disabled={estado === 'cargando'}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#849673] text-white hover:bg-[#6e7e5f] transition-all disabled:opacity-50 cursor-pointer"
            >
              {estado === 'cargando' ? 'Procesando...' : 'Activar notificaciones'}
            </button>
          )}
        </div>
      </div>

      {mensaje && (
        <p className={\`mt-2 text-[11px] text-left \${estado === 'activado' ? 'text-[#849673]' : 'text-[#75706b]'}\`}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
`;

fs.writeFileSync("src/components/SuscribirPush.jsx", nuevoSuscribirPush);
console.log("✅ SuscribirPush.jsx recreado exitosamente con soporte para activar/desactivar y todos los eventos.");
