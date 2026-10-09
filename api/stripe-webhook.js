import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Error: Faltan variables de entorno de Supabase en Vercel');
      return res.status(500).json({ error: 'Configuración incompleta de variables en Vercel' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      const nombre = session.customer_details?.name || 'Socio/a';
      const amount = (session.amount_total || 0) / 100;
      const stripeSessionId = session.id;
      
      const lineItemDescription = session.line_items?.data?.[0]?.description?.toLowerCase() || '';
      
      let modalidad = 'gilda de café';

      if (lineItemDescription.includes('nube')) {
        modalidad = 'gilda de nube';
      } else if (lineItemDescription.includes('café') || lineItemDescription.includes('cafe')) {
        modalidad = 'gilda de café';
      } else if (lineItemDescription.includes('satélite') || lineItemDescription.includes('satelite') || amount === 1) {
        modalidad = 'gilda satélite';
      } else if (lineItemDescription.includes('virtual') || amount === 8) {
        modalidad = 'gilda virtual';
      } else if (lineItemDescription.includes('papel') || amount === 10) {
        modalidad = 'gilda de papel';
      } else if (lineItemDescription.includes('absoluta') || amount === 12) {
        modalidad = 'gilda absoluta';
      } else if (amount === 5) {
        modalidad = 'gilda de café';
      }

      if (email) {
        // 1. Guardar/actualizar en la tabla profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            { email, nombre, modalidad },
            { onConflict: 'email' }
          );

        if (profileError) {
          console.error('Error insertando en profiles:', profileError.message);
          return res.status(500).json({ error: profileError.message });
        }

        // 2. Guardar el registro de pago en payment_log
        const { error: logError } = await supabase
          .from('payment_log')
          .insert([
            {
              email: email,
              amount: amount,
              modalidad: modalidad,
              stripe_session_id: stripeSessionId,
              created_at: new Date().toISOString()
            }
          ]);

        if (logError) {
          console.error('Error insertando en payment_log:', logError.message);
          // Registramos el error en consola sin bloquear la respuesta de Stripe
        } else {
          console.log(`Pago registrado en payment_log para ${email}`);
        }

        console.log(`Socio/a registrado/a con éxito: ${email} -> ${modalidad}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error en ejecución del webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
}