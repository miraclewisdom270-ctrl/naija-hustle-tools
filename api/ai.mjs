import crypto from 'node:crypto';
import { getJson } from './_storage.mjs';

const emailKey = (email) => crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
const cookieValue = (cookie, name) => cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);

async function sessionUser(req) {
  const token = cookieValue(req.headers.cookie || req.headers.Cookie, 'nt_session');
  if (!token) return null;
  const session = await getJson(`session:${token}`);
  if (!session || session.expiresAt < Date.now()) return null;
  return getJson(`user:${emailKey(session.email)}`);
}

const prompts = {
  cv: 'Improve this CV information for a Nigerian job seeker. Keep claims truthful, use strong achievement-focused language, and return JSON with summary, body, education, note, and title.',
  proposal: 'Write a persuasive but honest business proposal for a Nigerian client. Return JSON with summary, body, and note. Include a clear scope, deliverables, timeline suggestion, and next step.',
  letter: 'Write a polished professional business letter. Return JSON with title, body, and note. Use a respectful tone and keep it ready to send.',
  contract: 'Draft a plain-language starter agreement, not legal advice. Return JSON with title, summary, body, and note. Include scope, payment, timeline, revisions, cancellation, and signatures.',
  flyer: 'Write concise high-converting social flyer copy for a Nigerian business. Return JSON with title, summary, note, and contact. Avoid unverifiable claims.'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  try {
    const user = await sessionUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in to use AI assistance' });
    if (!user.premiumExpiry || user.premiumExpiry < new Date().toISOString().slice(0, 10)) return res.status(402).json({ error: 'AI assistance is available with Premium access' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'AI service is not configured yet' });
    const tool = String(req.body?.tool || '');
    if (!prompts[tool]) return res.status(400).json({ error: 'AI is not available for this tool yet' });
    const input = JSON.stringify(req.body?.fields || {});
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: `${prompts[tool]} Return only valid JSON.` }, { role: 'user', content: input }]
      })
    });
    const payload = await response.json();
    if (!response.ok) return res.status(502).json({ error: payload.error?.message || 'AI provider unavailable' });
    return res.status(200).json({ ok: true, fields: JSON.parse(payload.choices?.[0]?.message?.content || '{}') });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'AI service unavailable' });
  }
}
