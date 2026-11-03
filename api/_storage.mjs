function storageConfig() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Vercel storage is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN.');
  return { url, token };
}

export async function command(parts) {
  const { url, token } = storageConfig();
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(parts)
  });
  if (!response.ok) throw new Error('Vercel storage request failed');
  const result = await response.json();
  return result.result;
}

export const getJson = async (key) => {
  const value = await command(['GET', key]);
  return value ? JSON.parse(value) : null;
};
export const setJson = (key, value) => command(['SET', key, JSON.stringify(value)]);
export const deleteKey = (key) => command(['DEL', key]);

export async function listKeys(pattern) {
  const keys = [];
  let cursor = '0';
  do {
    const result = await command(['SCAN', cursor, 'MATCH', pattern, 'COUNT', '100']);
    cursor = String(result[0]);
    keys.push(...result[1]);
  } while (cursor !== '0');
  return keys;
}
