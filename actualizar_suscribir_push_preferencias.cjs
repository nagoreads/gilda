const fs = require("fs");

const nuevoSuscribirPush = `import React, { useState, useEffect } from 'react';

export default function SuscribirPush({ sesion, supabase }) {
  const [estado, setEstado] = useState('cargando'); // 'cargando', 'desactivado', 'activado', 'denegado', 'no_soportado'
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Estado de las preferencias individuales
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

          // Cargar preferencias guardadas en Supabase
          if (supabase && sesion?.email) {
            const { data } = await supabase
              .from('push_subscriptions')
              .select('preferencias')
              .eq('endpoint', subscription.endpoint)
              .maybeSingle();

            if (data?.preferencias) {
              setPreferencias(data.preferencias);
            }
          }
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

  const activarNotificaciones = async () => {
    if (!sesion?.email) {
      setMensaje('Debes iniciar sesión para activar las notificaciones.');
      return;
    }

    if (!publicVapidKey) {
      setMensaje('Error: Clave VAPID_PUBLIC_KEY no configurada en Vercel.');
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
      await guardarEnSupabase(subscription.endpoint, subData, preferencias);

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

  const togglePreferencia = async (clave) => {
    const nuevasPrefs = { ...preferencias, [clave]: !preferencias[clave] };
    setPreferencias(nuevasPrefs);

    if (estado === 'activado') {
      try {
        setGuardando(true);
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await guardarEnSupabase(subscription.endpoint, subscription.toJSON(), nuevasPrefs);
        }
      } catch (e) {
        console.error('Error guardando preferencia:', e);
      } finally {
        setGuardando(false);
      }
    }
  };

  if (estado === 'no_soportado') return null;

  const listaOpciones = [
    { id: 'chat', label: 'Chat privado y menciones directas' },
    { id: 'capitulos', label: 'Comentarios en capítulos desbloqueados' },
    { id: 'aquiAhora', label: 'Alertas de «Aquí y ahora»' },
    { id: 'cafecito', label: 'Nuevas fechas de Cafecito Virtual' },
    { id: 'votaciones', label: 'Resultados de votaciones y propuestas' },
    { id: 'buzon', label: 'Respuestas y notas en el buzón' },
  ];

  return (
    <div className="p-4 my-3 bg-[#fbf9f5] border border-[#e8e4d9] rounded-xl text-left shadow-sm transition-all">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-[#e8e4d9]">
        <div>
          <p className="text-xs font-semibold text-[#23211e] tracking-tight">Centro de Notificaciones Push</p>
          <p className="text-[11px] text-[#75706b] leading-tight mt-0.5">
            Selecciona qué avisos deseas recibir en tu dispositivo.
          </p>
        </div>

        <div>
          {estado === 'activado' ? (
            <button
              onClick={desactivarNotificaciones}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#849673]/15 text-[#849673] hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-[#849673]"></span>
              Activadas (Desactivar todas)
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

      {/* Grid de Selección de Categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
        {listaOpciones.map((opcion) => {
          const activa = preferencias[opcion.id];
          return (
            <button
              key={opcion.id}
              type="button"
              onClick={() => togglePreferencia(opcion.id)}
              className={\`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all cursor-pointer \${
                activa
                  ? 'bg-white border-[#849673] text-[#23211e] shadow-2xs'
                  : 'bg-[#f4f1ea] border-[#e8e4d9] text-[#75706b] opacity-70'
              }\`}
            >
              <span>{opcion.label}</span>
              <span
                className={\`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ml-2 shrink-0 transition-colors \${
                  activa ? 'bg-[#849673] text-white' : 'bg-[#e8e4d9] text-[#75706b]'
                }\`}
              >
                {activa ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {mensaje && (
        <p className={\`mt-3 text-[11px] \${estado === 'activado' ? 'text-[#849673]' : 'text-[#75706b]'}\`}>
          {mensaje} {guardando && '(guardando cambios...)'}
        </p>
      )}
    </div>
  );
}
`;

fs.writeFileSync("src/components/SuscribirPush.jsx", nuevoSuscribirPush);
console.log("✅ SuscribirPush.jsx actualizado con panel de preferencias granulares.");
