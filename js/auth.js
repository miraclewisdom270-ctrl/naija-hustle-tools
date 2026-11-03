(function () {
  const api = (action, data) => fetch('/api/usage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) }).then((response) => response.json());
  const message = document.getElementById('auth-message');
  const show = (id) => { document.getElementById('auth-login').hidden = id !== 'login'; document.getElementById('auth-signup').hidden = id !== 'signup'; message.textContent = ''; };
  document.getElementById('show-signup').addEventListener('click', () => show('signup'));
  document.getElementById('show-login').addEventListener('click', () => show('login'));
  document.getElementById('auth-login-button').addEventListener('click', async () => {
    const email = document.getElementById('auth-login-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-login-password').value;
    message.textContent = 'Signing in…';
    try {
      const result = await api('login', { email, password });
      if (!result.ok) throw new Error(result.error || 'Unable to sign in');
      localStorage.setItem('verifiedEmail', email);
      sessionStorage.setItem('naijaToolsStarted', 'true');
      window.location.href = 'dashboard.html';
    } catch (error) { message.textContent = error.message; }
  });
  document.getElementById('auth-send-code').addEventListener('click', async () => {
    const email = document.getElementById('auth-signup-email').value.trim().toLowerCase();
    message.textContent = 'Sending verification code…';
    try {
      const result = await api('request', { email });
      if (!result.ok) throw new Error(result.error || 'Unable to send verification code');
      document.getElementById('auth-code-step').hidden = false;
      message.textContent = 'Code sent. Check your email.';
    } catch (error) { message.textContent = error.message; }
  });
  document.getElementById('auth-create-button').addEventListener('click', async () => {
    const email = document.getElementById('auth-signup-email').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value;
    if (password !== document.getElementById('auth-password-confirm').value) { message.textContent = 'Passwords do not match.'; return; }
    message.textContent = 'Creating your account…';
    try {
      const result = await api('verify', { email, code: document.getElementById('auth-code').value.trim(), password });
      if (!result.ok) throw new Error(result.error || 'Unable to create account');
      localStorage.setItem('verifiedEmail', email);
      sessionStorage.setItem('naijaToolsStarted', 'true');
      window.location.href = 'dashboard.html';
    } catch (error) { message.textContent = error.message; }
  });
})();
