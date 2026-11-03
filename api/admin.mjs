import crypto from 'node:crypto';
import { deleteKey, getJson, listKeys, setJson } from './_storage.mjs';

const cookieValue = (cookie, name) => cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
const session = async (req) => {
  const token = cookieValue(req.headers.cookie, 'nt_admin');
  if (!token) return null;
  const record = await getJson(`admin-session:${token}`);
  return record && record.expiresAt >= Date.now() ? record : null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const input = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  try {
    if (input.action === 'login') {
      if (!process.env.ADMIN_PASSWORD) return res.status(500).json({ error: 'ADMIN_PASSWORD is not configured' });
      if (input.password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid admin password' });
      const token = crypto.randomBytes(32).toString('hex');
      await setJson(`admin-session:${token}`, { expiresAt: Date.now() + 86400000 });
      res.setHeader('Set-Cookie', `nt_admin=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`);
      return res.status(200).json({ ok: true });
    }
    if (input.action === 'logout') {
      const token = cookieValue(req.headers.cookie, 'nt_admin');
      if (token) await deleteKey(`admin-session:${token}`);
      res.setHeader('Set-Cookie', 'nt_admin=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/');
      return res.status(200).json({ ok: true });
    }
    if (!await session(req)) return res.status(401).json({ error: 'Admin login required' });
    if (input.action === 'status') {
      const users = await listKeys('user:*');
      const date = new Date().toISOString().slice(0, 10);
      let premiumUsers = 0;
      let downloadsToday = 0;
      for (const key of users) {
        const user = await getJson(key);
        if (user?.premiumExpiry >= date) premiumUsers += 1;
        if (user?.usageDate === date) downloadsToday += Number(user.usageCount || 0);
      }
      const notice = await getJson('site:notice');
      return res.status(200).json({ ok: true, users: users.length, premiumUsers, downloadsToday, notice: notice?.text || '' });
    }
    if (input.action === 'notice') {
      const text = typeof input.text === 'string' ? input.text.trim().slice(0, 500) : '';
      await setJson('site:notice', { text, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, notice: text });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Admin service unavailable' });
  }
}
