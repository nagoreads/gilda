// Ejemplo de Serverless Function protegida para Cron-Job.org
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  const CRON_SECRET = process.env.CRON_SECRET;

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Lógica del Cron Job
  return res.status(200).json({ success: true, timestamp: new Date().toISOString() });
}
