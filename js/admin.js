(function () {
  const api = (action, data) => fetch('/.netlify/functions/admin', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) }).then((response) => response.json());
  const loginPanel = document.getElementById('login-panel');
  const adminPanel = document.getElementById('admin-panel');
  const message = document.getElementById('admin-message');
  async function loadAdmin() {
    const result = await api('status');
    if (!result.ok) return;
    loginPanel.hidden = true;
    adminPanel.hidden = false;
    document.getElementById('stat-users').textContent = result.users;
    document.getElementById('stat-premium').textContent = result.premiumUsers;
    document.getElementById('stat-downloads').textContent = result.downloadsToday;
    document.getElementById('site-notice').value = result.notice || '';
  }
  document.getElementById('admin-login').addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Signing in…';
    const result = await api('login', { password: document.getElementById('admin-password').value });
    if (!result.ok) { message.textContent = result.error || 'Unable to sign in'; return; }
    await loadAdmin();
  });
  document.getElementById('admin-logout').addEventListener('click', async () => { await api('logout'); window.location.reload(); });
  document.getElementById('save-notice').addEventListener('click', async () => {
    const result = await api('notice', { text: document.getElementById('site-notice').value });
    document.getElementById('notice-message').textContent = result.ok ? 'Notice saved.' : (result.error || 'Unable to save notice');
  });
  loadAdmin().catch(() => { message.textContent = 'Admin service unavailable'; });
})();
