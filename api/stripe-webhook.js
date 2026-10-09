import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  try {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      const nombre = session.customer_details?.name || 'Socio/a';
      
      const amount = (session.amount_total || 0) / 100;
      
      // Intentamos leer la descripción o nombre del producto enviada por Stripe
      const lineItemDescription = session.line_items?.data?.[0]?.description?.toLowerCase() || '';
      
      let modalidad = 'gilda de café';

      // Identificación por descripción o por importe exacto
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
        modalidad = 'gilda de café'; // por defecto para 5€
      }

      if (email) {
        // Usamos upsert para insertar o actualizar según el email
        const { error } = await supabase
          .from('profiles')
          .upsert(
            { email, nombre, modalidad },
            { onConflict: 'email' }
          );

        if (error) {
          console.error('Error insertando en Supabase:', error.message);
          return res.status(500).json({ error: error.message });
        }

        console.log(`Socio/a registrado/a con éxito: ${email} -> ${modalidad}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error en Webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}