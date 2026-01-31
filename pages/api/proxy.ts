// pages/api/proxy.ts  (modo DEBUG - temporal)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Log para Vercel logs
  console.info('[proxy-debug] headers:', req.headers);
  console.info('[proxy-debug] query:', req.query);
  console.info('[proxy-debug] raw body (type):', typeof req.body);

  // Respondemos con lo que llegó para inspección
  return res.status(200).json({
    ok: true,
    note: 'ECHO - debug only. Remove this handler after debugging.',
    query: req.query,
    body: req.body
  });
}
