import crypto from 'node:crypto';
import { deleteKey, getJson, setJson } from './_storage.mjs';

const emailKey = (email) => crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
const cookieValue = (cookie, name) => cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
const today = () => new Date().toISOString().slice(0, 10);
const sessionEmail = async (event) => {
  const token = cookieValue(event.headers.cookie || event.headers.Cookie, 'nt_session');
  if (!token) return null;
  const session = await getJson(`session:${token}`);
  return session && session.expiresAt >= Date.now() ? session.email : null;
};

async function sendCode(email, code) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) throw new Error('Email service is not configured');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL,
      to: [email],
      subject: 'Your NaijaTools verification code',
      html: `<p>Your NaijaTools verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:5px">${code}</p><p>This code expires in 10 minutes.</p>`
    })
  });
  if (!response.ok) {
    let message = '';
    try {
      const details = await response.json();
      message = typeof details.message === 'string' ? `: ${details.message}` : '';
    } catch {}
    throw new Error(`Email provider rejected the request${message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const input = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  try {
    if (input.action === 'request') {
      const email = String(input.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address' });
      const code = String(crypto.randomInt(100000, 1000000));
      await setJson(`code:${emailKey(email)}`, { email, code, expiresAt: Date.now() + 600000 });
      await sendCode(email, code);
      return res.status(200).json({ ok: true });
    }
    if (input.action === 'verify') {
      const email = String(input.email || '').trim().toLowerCase();
      const record = await getJson(`code:${emailKey(email)}`);
      if (!record || record.expiresAt < Date.now() || record.code !== String(input.code || '').trim()) return res.status(400).json({ error: 'That verification code is invalid or expired' });
      const token = crypto.randomBytes(32).toString('hex');
      await setJson(`session:${token}`, { email, expiresAt: Date.now() + 2592000000 });
      await deleteKey(`code:${emailKey(email)}`);
      res.setHeader('Set-Cookie', `nt_session=${token}; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000; Path=/`);
      return res.status(200).json({ ok: true });
    }
    const email = await sessionEmail({ headers: req.headers });
    if (!email) return res.status(401).json({ error: 'Verify your email first' });
    const userKey = `user:${emailKey(email)}`;
    const user = (await getJson(userKey)) || { email, usageDate: today(), usageCount: 0, premiumExpiry: null };
    if (user.usageDate !== today()) { user.usageDate = today(); user.usageCount = 0; }
    if (input.action === 'status') return res.status(200).json({ ok: true, email, usageCount: user.usageCount, premium: user.premiumExpiry && user.premiumExpiry >= today(), premiumExpiry: user.premiumExpiry });
    if (input.action === 'consume') {
      if (!(user.premiumExpiry && user.premiumExpiry >= today()) && user.usageCount >= 3) return res.status(200).json({ allowed: false, reason: 'limit' });
      if (!(user.premiumExpiry && user.premiumExpiry >= today())) user.usageCount += 1;
      await setJson(userKey, user);
      return res.status(200).json({ allowed: true, remaining: user.premiumExpiry ? null : 3 - user.usageCount });
    }
    if (input.action === 'activate') {
      if (!process.env.PAYSTACK_SECRET_KEY || !input.reference) return res.status(500).json({ error: 'Payment verification is not configured' });
      const paymentResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(input.reference)}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      const payment = await paymentResponse.json();
      if (!paymentResponse.ok || payment.data?.status !== 'success' || payment.data.amount !== 350000 || payment.data.currency !== 'NGN' || payment.data.customer?.email?.toLowerCase() !== email) return res.status(400).json({ error: 'Payment could not be verified' });
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      user.premiumExpiry = expiry.toISOString().slice(0, 10);
      await setJson(userKey, user);
      return res.status(200).json({ ok: true, premiumExpiry: user.premiumExpiry });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Service unavailable' });
  }
}
