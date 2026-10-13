import { createClient } from '@supabase/supabase-js';
import webPush from 'web-push';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

webPush.setVapidDetails(
  'mailto:ndnagore@gmail.com',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  try {
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split('T')[0];

    // 1. Consultar si existe configuración para el día de hoy
    let { data: config } = await supabase
      .from('momento_gilda_config')
      .select('*')
      .eq('fecha', hoyStr)
      .maybeSingle();

    // 2. Si no existe, fijar una hora aleatoria entre 07:00 y 23:59
    if (!config) {
      const horaMinimaMs = new Date(`${hoyStr}T07:00:00`).getTime();
      const horaMaximaMs = new Date(`${hoyStr}T23:59:00`).getTime();
      const disparoAleatorioMs = horaMinimaMs + Math.random() * (horaMaximaMs - horaMinimaMs);

      const { data: nuevaConfig } = await supabase
        .from('momento_gilda_config')
        .insert([{
          fecha: hoyStr,
          hora_disparo: new Date(disparoAleatorioMs).toISOString(),
          notificacion_enviada: false
        }])
        .select()
        .single();

      config = nuevaConfig;
    }

    // 3. Si la hora de disparo ha llegado y no se ha enviado aún
    if (config && !config.notificacion_enviada && ahora >= new Date(config.hora_disparo)) {
      const { data: subs } = await supabase.from('push_subscriptions').select('*');

      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title: 'aquí y ahora ✦',
          body: 'Es el momento. Comparte tu instantánea de lectura con el club.',
          url: '/'
        });

        await Promise.allSettled(
          subs.map(s => webPush.sendNotification(s.subscription, payload))
        );
      }

      await supabase
        .from('momento_gilda_config')
        .update({ notificacion_enviada: true })
        .eq('id', config.id);

      return res.status(200).json({ status: 'Notificaciones enviadas con éxito' });
    }

    return res.status(200).json({
      status: 'A la espera del momento fijado',
      hora_disparo: config?.hora_disparo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}