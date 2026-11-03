import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const store = getStore({ name: 'naija-usage', consistency: 'strong' });
const json = (body, status = 200, headers = {}) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  body: JSON.stringify(body)
});
const emailKey = (email) => crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
const cookieValue = (cookie, name) => cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='))?.slice(name.length + 1);
const emailFromSession = async (event) => {
  const token = cookieValue(event.headers.cookie || event.headers.Cookie, 'nt_session');
  if (!token) return null;
  const session = await store.get(`session:${token}`, { type: 'json' });
  if (!session || session.expiresAt < Date.now()) return null;
  return session.email;
};
const today = () => new Date().toISOString().slice(0, 10);

async function sendCode(email, code) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) throw new Error('Email service is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.FROM_EMAIL, to: [email], subject: 'Your NaijaTools verification code', html: `<p>Your NaijaTools verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:5px">${code}</p><p>This code expires in 10 minutes.</p>` })
  });
  if (!response.ok) throw new Error('Email provider rejected the request');
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json({ error: 'POST required' }, 405);
  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json({ error: 'Invalid request' }, 400); }
  const action = input.action;
  try {
    if (action === 'request') {
      const email = String(input.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Enter a valid email address' }, 400);
      const code = String(crypto.randomInt(100000, 1000000));
      await store.setJSON(`code:${emailKey(email)}`, { email, code, expiresAt: Date.now() + 600000 });
      await sendCode(email, code);
      return json({ ok: true });
    }
    if (action === 'verify') {
      const email = String(input.email || '').trim().toLowerCase();
      const record = await store.get(`code:${emailKey(email)}`, { type: 'json' });
      if (!record || record.expiresAt < Date.now() || record.code !== String(input.code || '').trim()) return json({ error: 'That verification code is invalid or expired' }, 400);
      const token = crypto.randomBytes(32).toString('hex');
      await store.setJSON(`session:${token}`, { email, expiresAt: Date.now() + 2592000000 });
      await store.delete(`code:${emailKey(email)}`);
      return json({ ok: true }, 200, { 'Set-Cookie': `nt_session=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/` });
    }
    const email = await emailFromSession(event);
    if (!email) return json({ error: 'Verify your email first' }, 401);
    const userKey = `user:${emailKey(email)}`;
    const user = (await store.get(userKey, { type: 'json' })) || { email, usageDate: today(), usageCount: 0, premiumExpiry: null };
    if (user.usageDate !== today()) { user.usageDate = today(); user.usageCount = 0; }
    if (action === 'status') return json({ ok: true, email, usageCount: user.usageCount, premium: user.premiumExpiry && user.premiumExpiry >= today(), premiumExpiry: user.premiumExpiry });
    if (action === 'consume') {
      if (!(user.premiumExpiry && user.premiumExpiry >= today()) && user.usageCount >= 3) return json({ allowed: false, reason: 'limit' });
      if (!(user.premiumExpiry && user.premiumExpiry >= today())) user.usageCount += 1;
      await store.setJSON(userKey, user);
      return json({ allowed: true, remaining: user.premiumExpiry ? null : 3 - user.usageCount });
    }
    if (action === 'activate') {
      if (!process.env.PAYSTACK_SECRET_KEY || !input.reference) return json({ error: 'Payment verification is not configured' }, 500);
      const paymentResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok || payment.data?.status !== 'success' || payment.data.amount !== 350000 || payment.data.currency !== 'NGN' || payment.data.customer?.email?.toLowerCase() !== email) {
        return json({ error: 'Payment could not be verified' }, 400);
      }
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      user.premiumExpiry = expiry.toISOString().slice(0, 10);
      await store.setJSON(userKey, user);
      return json({ ok: true, premiumExpiry: user.premiumExpiry });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error.message || 'Service unavailable' }, 500);
  }
}
