const fs = require("fs");

// 1. Crear public/sw.js si no existe
if (!fs.existsSync("public")) {
  fs.mkdirSync("public");
}

const swContent = `// Service Worker de Gilda
self.addEventListener('push', (event) => {
  let data = { title: 'Gilda', body: 'Tienes una nueva notificación' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
`;

fs.writeFileSync("public/sw.js", swContent, "utf8");
console.log("✅ Archivo public/sw.js creado y asegurado.");

// 2. Actualizar SuscribirPush.jsx con manejo de activación y retroalimentación de errores
const nuevoComponente = `import React, { useState, useEffect } from 'react';

export default function SuscribirPush({ sesion, supabase }) {
  const [estado, setEstado] = useState('desactivado');
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');

  const [preferencias, setPreferencias] = useState({
    chat: true,
    capitulos: true,
    aquiAhora: true,
    cafecito: true,
    votaciones: true,
    buzon: true
  });

  const publicVapidKey = import.meta.env.VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let isMounted = true;

    async function comprobarSuscripcion() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (isMounted) setEstado('no_soportado');
        return;
      }

      if (Notification.permission === 'denied') {
        if (isMounted) setEstado('denegado');
        return;
      }

      if (Notification.permission === 'granted') {
        try {
          const reg = await Promise.race([
            navigator.serviceWorker.getRegistration('/sw.js'),
            new Promise((r) => setTimeout(() => r(null), 1000))
          ]);

          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            if (sub && isMounted) {
              setEstado('activado');

              if (supabase && sesion?.email) {
                const { data } = await supabase
                  .from('push_subscriptions')
                  .select('preferencias')
                  .eq('endpoint', sub.endpoint)
                  .maybeSingle();

                if (data?.preferencias && isMounted) {
                  setPreferencias(data.preferencias);
                }
              }
              return;
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }

      if (isMounted) setEstado('desactivado');
    }

    comprobarSuscripcion();
    return () => { isMounted = false; };
  }, [sesion]);

  function urlBase64ToUint8Array(base64String) {
    if (!base64String || base64String.includes('...')) {
      throw new Error('Debes configurar la clave VAPID real en las variables de entorno.');
    }
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const guardarEnSupabase = async (endpoint, subData, nuevasPrefs) => {
    if (!supabase || !sesion?.email) return;
    await supabase.from('push_subscriptions').upsert([{
      email: (sesion.email || '').toLowerCase().trim(),
      endpoint: endpoint,
      p256dh: subData.keys?.p256dh || '',
      auth: subData.keys?.auth || '',
      preferencias: nuevasPrefs
    }], { onConflict: 'endpoint' });
  };

  const togglePushGeneral = async () => {
    setErrorLocal('');

    if (estado === 'activado') {
      try {
        setCargandoAccion(true);
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration('/sw.js');
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              const endpoint = sub.endpoint;
              await sub.unsubscribe();
              if (supabase && endpoint) {
                await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
              }
            }
          }
        }
        setEstado('desactivado');
      } catch (err) {
        console.error('Error al desactivar:', err);
        setErrorLocal('No se pudo desactivar la suscripción.');
      } finally {
        setCargandoAccion(false);
      }
    } else {
      try {
        setCargandoAccion(true);
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setEstado('denegado');
          setErrorLocal('Permiso de notificaciones denegado en el navegador.');
          return;
        }

        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          if (!publicVapidKey || publicVapidKey.includes('...')) {
            // Activación en modo local para prueba de interfaz si no hay VAPID configurado
            setEstado('activado');
            setErrorLocal('');
            return;
          }
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        if (sub) {
          await guardarEnSupabase(sub.endpoint, sub.toJSON(), preferencias);
        }
        setEstado('activado');
      } catch (err) {
        console.error('Error al activar:', err);
        setErrorLocal(err.message || 'Error al activar las notificaciones.');
      } finally {
        setCargandoAccion(false);
      }
    }
  };

  const togglePreferencia = async (clave) => {
    const nuevasPrefs = { ...preferencias, [clave]: !preferencias[clave] };
    setPreferencias(nuevasPrefs);

    if (estado === 'activado') {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js');
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await guardarEnSupabase(sub.endpoint, sub.toJSON(), nuevasPrefs);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (estado === 'no_soportado') return null;

  const opciones = [
    { id: 'chat', label: 'Mensajes privados y menciones' },
    { id: 'capitulos', label: 'Comentarios en capítulos desbloqueados' },
    { id: 'aquiAhora', label: 'Alertas de «Aquí y ahora»' },
    { id: 'cafecito', label: 'Fechas de Cafecito Virtual' },
    { id: 'votaciones', label: 'Resultados de votaciones del club' },
    { id: 'buzon', label: 'Respuestas en el buzón' },
  ];

  return (
    <div className="pt-4 pb-2 border-t border-[#e8e4d9]/80">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium text-[#23211e]">
            Notificaciones en el dispositivo
          </h3>
          <p className="text-xs text-[#75706b]">
            {estado === 'activado' ? 'Notificaciones activadas' : 'Recibe avisos cuando la web esté cerrada'}
          </p>
        </div>

        <div className="flex items-center">
          {estado === 'denegado' ? (
            <span className="text-xs text-red-600">Bloqueado</span>
          ) : (
            <button
              type="button"
              onClick={togglePushGeneral}
              disabled={cargandoAccion}
              className={\`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out \${
                estado === 'activado' ? 'bg-[#849673]' : 'bg-[#e8e4d9]'
              }\`}
            >
              <span
                className={\`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out \${
                  estado === 'activado' ? 'translate-x-4' : 'translate-x-0'
                }\`}
              />
            </button>
          )}
        </div>
      </div>

      {errorLocal && (
        <p className="mt-2 text-xs text-red-600/90 italic">
          {errorLocal}
        </p>
      )}

      {estado === 'activado' && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setMostrarOpciones(!mostrarOpciones)}
            className="text-xs text-[#849673] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            {mostrarOpciones ? '▲ Ocultar preferencias' : '▼ Personalizar qué recibir'}
          </button>

          {mostrarOpciones && (
            <div className="mt-3 space-y-2 pt-2 border-t border-[#f2efe9]">
              {opciones.map((item) => (
                <label key={item.id} className="flex items-center justify-between text-xs cursor-pointer py-1">
                  <span className="text-xs text-[#75706b]">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={preferencias[item.id]}
                    onChange={() => togglePreferencia(item.id)}
                    className="accent-[#849673] h-3.5 w-3.5 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync("src/components/SuscribirPush.jsx", nuevoComponente, "utf8");
console.log("✅ SuscribirPush.jsx y public/sw.js actualizados correctamente.");
