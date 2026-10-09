import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Mapa con las identificaciones de tus enlaces de pago en App.jsx
const MODALIDADES_POR_ENLACE = {
  'cNi4gtfqV8cxeju0WV6Ri01': 'gilda satélite (1 €/mes)',
  '3cI5kx0w1gJ3fny4976Ri02': 'gilda de café (5 €/mes)',
  'cNi5kx92xcsNb7i3536Ri03': 'gilda de nube (5 €/mes)',
  'bJe8wJ7Yt50l1wIbBz6Ri04': 'gilda de papel (10 €/mes)',
  'bJe9ANguZ9gB6R27lj6Ri05': 'gilda virtual (8 €/mes)',
  '14A5kxemReAV2AMcFD6Ri08': 'gilda absoluta (12 €/mes)',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método no permitido');

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Error en la firma del Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
    const nombre = session.customer_details?.name || email.split('@')[0];

    // 1. Intentar identificar la modalidad mediante el ID del enlace de pago de Stripe
    let modalidad = null;
    const paymentLinkId = session.payment_link;

    if (paymentLinkId) {
      // Buscar coincidencia en el diccionario de enlaces de App.jsx
      for (const [key, val] of Object.entries(MODALIDADES_POR_ENLACE)) {
        if (paymentLinkId.includes(key)) {
          modalidad = val;
          break;
        }
      }
    }

    // 2. Si no se detecta por enlace, buscar por los productos de la sesión
    if (!modalidad) {
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const description = (lineItems.data[0]?.description || '').toLowerCase();

        if (description.includes('nube')) modalidad = 'gilda de nube (5 €/mes)';
        else if (description.includes('café') || description.includes('cafe')) modalidad = 'gilda de café (5 €/mes)';
        else if (description.includes('satélite') || description.includes('satelite')) modalidad = 'gilda satélite (1 €/mes)';
        else if (description.includes('papel')) modalidad = 'gilda de papel (10 €/mes)';
        else if (description.includes('virtual')) modalidad = 'gilda virtual (8 €/mes)';
        else if (description.includes('absoluta')) modalidad = 'gilda absoluta (12 €/mes)';
      } catch (e) {
        console.warn('No se pudieron obtener los line_items de Stripe:', e);
      }
    }

    // 3. Respaldo por importe si los métodos anteriores no devuelven resultado
    if (!modalidad) {
      const precio = session.amount_total / 100;
      if (precio === 1) modalidad = 'gilda satélite (1 €/mes)';
      else if (precio === 8) modalidad = 'gilda virtual (8 €/mes)';
      else if (precio === 10) modalidad = 'gilda de papel (10 €/mes)';
      else if (precio === 12) modalidad = 'gilda absoluta (12 €/mes)';
      else modalidad = 'gilda de café (5 €/mes)'; // valor por defecto para 5 €
    }

    if (email) {
      const { error } = await supabaseAdmin.from('profiles').upsert(
        {
          email,
          nombre,
          modalidad,
          ultima_conexion: new Date().toISOString()
        },
        { onConflict: 'email' }
      );

      if (error) {
        console.error('Error actualizando perfil en Supabase:', error);
      } else {
        console.log(`Perfil actualizado con éxito para ${email} -> ${modalidad}`);
      }
    }
  }

  res.status(200).json({ received: true });
}