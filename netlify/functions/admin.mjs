import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

const json = (body, status = 200, headers = {}) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  body: JSON.stringify(body)
});
const cookieValue = (cookie, name) => cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='))?.slice(name.length + 1);
const tokenKey = (token) => `admin-session:${token}`;
const getUsageStore = () => {
  if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) throw new Error('Netlify Blobs is not configured. Add NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN in Netlify.');
  return getStore({ name: 'naija-usage', consistency: 'strong', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
};

async function adminSession(event, store) {
  const token = cookieValue(event.headers.cookie || event.headers.Cookie, 'nt_admin');
  if (!token) return null;
  const session = await store.get(tokenKey(token), { type: 'json' });
  if (!session || session.expiresAt < Date.now()) return null;
  return session;
}

async function getStats(store) {
  const listed = await store.list({ prefix: 'user:' });
  const users = listed.blobs || [];
  let premiumUsers = 0;
  let downloadsToday = 0;
  const date = new Date().toISOString().slice(0, 10);
  for (const blob of users) {
    const user = await store.get(blob.key, { type: 'json' });
    if (!user) continue;
    if (user.premiumExpiry && user.premiumExpiry >= date) premiumUsers += 1;
    if (user.usageDate === date) downloadsToday += Number(user.usageCount || 0);
  }
  const notice = await store.get('site:notice', { type: 'json' });
  return { users: users.length, premiumUsers, downloadsToday, notice: notice?.text || '' };
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return json({ error: 'POST required' }, 405);
  const store = getUsageStore();
  let input;
  try { input = JSON.parse(event.body || '{}'); } catch { return json({ error: 'Invalid request' }, 400); }
  try {
    if (input.action === 'login') {
      if (!process.env.ADMIN_PASSWORD) return json({ error: 'ADMIN_PASSWORD is not configured in Netlify' }, 500);
      if (typeof input.password !== 'string' || input.password !== process.env.ADMIN_PASSWORD) return json({ error: 'Invalid admin password' }, 401);
      const token = crypto.randomBytes(32).toString('hex');
      await store.setJSON(tokenKey(token), { expiresAt: Date.now() + 86400000 });
      return json({ ok: true }, 200, { 'Set-Cookie': `nt_admin=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/` });
    }
    if (input.action === 'logout') {
      const token = cookieValue(event.headers.cookie || event.headers.Cookie, 'nt_admin');
      if (token) await store.delete(tokenKey(token));
      return json({ ok: true }, 200, { 'Set-Cookie': 'nt_admin=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/' });
    }
    if (!await adminSession(event)) return json({ error: 'Admin login required' }, 401);
    if (input.action === 'status') return json({ ok: true, ...(await getStats()) });
    if (input.action === 'notice') {
      const text = typeof input.text === 'string' ? input.text.trim().slice(0, 500) : '';
      await store.setJSON('site:notice', { text, updatedAt: new Date().toISOString() });
      return json({ ok: true, notice: text });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    return json({ error: error.message || 'Admin service unavailable' }, 500);
  }
}
