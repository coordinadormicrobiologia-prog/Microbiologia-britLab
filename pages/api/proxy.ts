// pages/api/proxy.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_ORIGIN = process.env.PROXY_ALLOWED_ORIGIN || '*';
const GAS_URL = process.env.GOOGLE_SCRIPT_URL || '';

function setCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-store');
}

async function tryParseBody(body: any) {
  if (body && typeof body === 'object') return body;
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch (e) {}
    try {
      const params = new URLSearchParams(body);
      const obj: any = {};
      for (const [k,v] of params.entries()) obj[k] = v;
      return obj;
    } catch (e) {}
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  console.info('[proxy] incoming', { method: req.method, query: req.query, headers: req.headers });
  let action: string | undefined = undefined;

  // 1) from query
  if (req.query && req.query.action) action = String(req.query.action);

  // 2) from body (robust)
  const parsedBody = await tryParseBody(req.body) || {};
  if (!action && parsedBody && parsedBody.action) action = String(parsedBody.action);

  // 3) nested data (e.g. { data: '{"action":"..."}' })
  if (!action && parsedBody && parsedBody.data) {
    try {
      const maybe = typeof parsedBody.data === 'string' ? JSON.parse(parsedBody.data) : parsedBody.data;
      if (maybe && maybe.action) action = String(maybe.action);
    } catch (e) {}
  }

  console.info('[proxy] resolved action', { action, parsedBody });

  if (!action) return res.status(400).json({ ok: false, error: 'Unknown or malformed action', hint: 'action missing in query or body' });

  // forward to GAS or handle special actions
  if (!GAS_URL) return res.status(400).json({ ok: false, error: 'no_gas_url' });

  try {
    const forwardUrl = req.method === 'GET'
      ? GAS_URL + (GAS_URL.includes('?') ? '&' : '?') + new URLSearchParams(req.query as Record<string,string>).toString()
      : GAS_URL;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (req.method === 'POST') fetchOptions.body = JSON.stringify(parsedBody && Object.keys(parsedBody).length ? parsedBody : req.body);

    console.info('[proxy] forwarding to', forwardUrl);
    const proxyRes = await fetch(forwardUrl, fetchOptions);
    const text = await proxyRes.text();
    try { return res.status(proxyRes.status).json(JSON.parse(text)); } catch (e) { res.status(proxyRes.status).setHeader('Content-Type','text/plain'); return res.send(text); }
  } catch (err: any) {
    console.error('[proxy] forward error', err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
