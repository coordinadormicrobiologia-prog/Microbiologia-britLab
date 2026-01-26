export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    const API_KEY = process.env.API_KEY;

    if (!SCRIPT_URL) throw new Error("Missing GOOGLE_SCRIPT_URL");
    if (!API_KEY) throw new Error("Missing API_KEY");

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req.body, api_key: API_KEY }),
    });

    const text = await response.text();

    try {
      const json = JSON.parse(text);
      res.status(200).json(json);
    } catch {
      res.status(200).json({ ok: false, raw: text });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
}
