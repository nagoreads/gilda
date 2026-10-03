import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método no permitido');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Error de firma de Webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const stripeSessionId = session.id;
    const userId = session.client_reference_id; 

    if (userId) {
      const { error: insertError } = await supabase
        .from('payments_log')
        .insert([{ user_id: userId, stripe_session_id: stripeSessionId, status: 'pagado' }]);

      if (insertError) console.error('Error insertando en Supabase:', insertError);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plan: 'premium' })
        .eq('id', userId);

      if (updateError) console.error('Error actualizando perfil:', updateError);
    }
  }

  res.status(200).json({ received: true });
}