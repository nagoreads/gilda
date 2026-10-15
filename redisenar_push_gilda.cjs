const fs = require("fs");

const nuevoSuscribirPush = `import React, { useState, useEffect } from 'react';

export default function SuscribirPush({ sesion, supabase }) {
  const [estado, setEstado] = useState('desactivado'); // 'desactivado', 'activado', 'denegado', 'no_soportado', 'cargando'
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [mensaje, setMensaje] = useState('');

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
    let mounted = true;

    async function comprobarSuscripcion() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (mounted) setEstado('no_soportado');
        return;
      }

      if (Notification.permission === 'denied') {
        if (mounted) setEstado('denegado');
        return;
      }

      if (Notification.permission === 'granted') {
        try {
          // Chequeo rápido sin esperar infinitamente
          const reg = await Promise.race([
            navigator.serviceWorker.getRegistration('/sw.js'),
            new Promise((resolve) => setTimeout(() => resolve(null), 1500))
          ]);

          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            if (sub && mounted) {
              setEstado('activado');

              if (supabase && sesion?.email) {
                const { data } = await supabase
                  .from('push_subscriptions')
                  .select('preferencias')
                  .eq('endpoint', sub.endpoint)
                  .maybeSingle();

                if (data?.preferencias && mounted) {
                  setPreferencias(data.preferencias);
                }
              }
              return;
            }
          }
        } catch (e) {
          console.warn('Error comprobando push:', e);
        }
      }

      if (mounted) setEstado('desactivado');
    }

    comprobarSuscripcion();
    return () => { mounted = false; };
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

  const togglePushGeneral = async () => {
    setMensaje('');

    if (estado === 'activado') {
      // DESACTIVAR
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
        setMensaje('Notificaciones desactivadas.');
      } catch (err) {
        console.error(err);
        setMensaje('Error al desactivar.');
      } finally {
        setCargandoAccion(false);
      }
    } else {
      // ACTIVAR
      if (!sesion?.email) {
        setMensaje('Inicia sesión para activar.');
        return;
      }
      if (!publicVapidKey) {
        setMensaje('Falta configurar la clave VAPID en Vercel.');
        return;
      }

      try {
        setCargandoAccion(true);
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setEstado('denegado');
          setMensaje('Permiso denegado en el navegador.');
          return;
        }

        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        await guardarEnSupabase(sub.endpoint, sub.toJSON(), preferencias);
        setEstado('activado');
        setMensaje('¡Notificaciones activadas!');
      } catch (err) {
        console.error(err);
        setEstado('desactivado');
        setMensaje('No se pudieron activar las notificaciones.');
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
    <div className="py-4 px-1 my-2 border-t border-[#e8e4d9]/80 font-sans">
      {/* Fila Principal */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-serif font-medium text-[#23211e] tracking-wide">
            Notificaciones en el dispositivo
          </h4>
          <p className="text-[11px] text-[#75706b] mt-0.5">
            {estado === 'activado' ? 'Avisos activos' : 'Recibe avisos cuando la web esté cerrada'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {estado === 'denegado' ? (
            <span className="text-[11px] text-red-700/80">Bloqueado</span>
          ) : (
            <button
              type="button"
              onClick={togglePushGeneral}
              disabled={cargandoAccion}
              className={\`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden \${
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

      {/* Botón secundario para desplegar preferencias */}
      {estado === 'activado' && (
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => setMostrarOpciones(!mostrarOpciones)}
            className="text-[11px] text-[#849673] hover:underline flex items-center gap-1 cursor-pointer"
          >
            {mostrarOpciones ? '▲ Ocultar preferencias' : '▼ Personalizar qué recibir'}
          </button>

          {mostrarOpciones && (
            <div className="mt-3 space-y-2 pt-2 border-t border-[#f2efe9]">
              {opciones.map((item) => (
                <label key={item.id} className="flex items-center justify-between text-[11px] text-[#23211e] cursor-pointer py-1">
                  <span className="text-[#75706b]">{item.label}</span>
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

      {mensaje && (
        <p className="mt-2 text-[10px] text-[#75706b] italic">
          {mensaje}
        </p>
      )}
    </div>
  );
}
`;

fs.writeFileSync("src/components/SuscribirPush.jsx", nuevoSuscribirPush);
console.log("✅ SuscribirPush.jsx renovado con la estética de Gilda y switch fluido.");
