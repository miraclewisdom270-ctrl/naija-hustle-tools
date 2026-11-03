(function () {
  const today = new Date().toISOString().slice(0, 10);
  const modal = document.getElementById('pay-modal');
  const downloadButtons = document.querySelectorAll('[data-download]');
  function resetDailyUsage() {
    if (localStorage.getItem('lastUsageDate') !== today) {
      localStorage.setItem('usageCountToday', '0');
      localStorage.setItem('lastUsageDate', today);
    }
  }
  function premiumIsActive() {
    const expiry = localStorage.getItem('premiumExpiryDate');
    if (localStorage.getItem('isPremium') === 'true' && expiry && new Date(expiry) >= new Date(today + 'T00:00:00')) return true;
    localStorage.setItem('isPremium', 'false');
    return false;
  }
  const api = (action, data = {}) => fetch('/api/usage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) }).then((response) => response.json());
  async function requestVerificationCode() {
    const email = document.getElementById('access-email').value.trim();
    const button = document.getElementById('send-code');
    const message = document.getElementById('access-message');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { message.textContent = 'Enter a valid email address first.'; return; }
    button.disabled = true;
    message.textContent = 'Sending verification code…';
    try {
      const result = await api('request', { email });
      if (!result.ok) throw new Error(result.error || 'Unable to send verification code');
      document.getElementById('code-step').hidden = false;
      message.textContent = 'Code sent. Check your email.';
    } catch (error) {
      message.textContent = error.message || 'Unable to send verification code';
    } finally {
      button.disabled = false;
    }
  }
  window.requestVerificationCode = requestVerificationCode;
  window.checkAccess = async function () {
    resetDailyUsage();
    let remote;
    try { remote = await api('status'); } catch { remote = null; }
    if (!remote || remote.error === 'Verify your email first') {
      if (modal) modal.hidden = false;
      return false;
    }
    if (remote.email) localStorage.setItem('verifiedEmail', remote.email);
    const active = remote?.premium === true || premiumIsActive();
    const count = remote?.usageCount ?? Number(localStorage.getItem('usageCountToday') || 0);
    document.querySelectorAll('[data-premium-badge]').forEach((badge) => {
      badge.textContent = active ? 'Premium Active till ' + new Date(localStorage.getItem('premiumExpiryDate')).toLocaleDateString('en-NG') : 'Free plan · ' + Math.max(0, 3 - count) + ' downloads left today';
      badge.classList.toggle('active', active);
    });
    if (!active && count >= 3) {
      if (modal) {
        modal.hidden = false;
        document.getElementById('upgrade-step').hidden = false;
        document.getElementById('verify-step').hidden = true;
      }
      return false;
    }
    return true;
  };
  window.recordDownload = async function () {
    const result = await api('consume');
    if (result.allowed === false) { if (modal) modal.hidden = false; return false; }
    if (premiumIsActive()) return true;
    resetDailyUsage();
    const next = Number(localStorage.getItem('usageCountToday') || 0) + 1;
    localStorage.setItem('usageCountToday', String(next));
    window.checkAccess();
  };
  window.payWithPaystack = async function () {
    const emailField = document.getElementById('access-email');
    const paymentEmailField = document.getElementById('payment-email');
    const email = (paymentEmailField ? paymentEmailField.value.trim() : '') || (emailField ? emailField.value.trim() : '') || localStorage.getItem('verifiedEmail') || '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { window.alert('Please enter a valid email address.'); return; }
    const paymentMessage = document.getElementById('payment-message');
    try {
      const PaystackPop = window.PaystackPop || await window.paystackReady;
      PaystackPop.setup({
      key: 'pk_live_1b5fcde560c6d3a00ee2fe9feb4c53632583ffc0',
      email: email,
      amount: 350000,
      currency: 'NGN',
      ref: 'NAIJA-' + Math.floor(Math.random() * 1000000000),
      callback: async function (response) {
        try {
          const activation = await api('activate', { reference: response.reference });
          if (!activation.ok) throw new Error(activation.error || 'Access activation failed');
          localStorage.setItem('isPremium', 'true');
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);
          localStorage.setItem('premiumExpiryDate', expiry.toISOString());
          window.alert('Payment Successful! You now have unlimited access for 30 days');
          if (modal) modal.hidden = true;
          window.location.reload();
        } catch (error) {
          const paymentMessage = document.getElementById('payment-message');
          if (paymentMessage) paymentMessage.textContent = error.message || 'Payment activation failed.';
        }
      },
        onClose: function () {}
      }).openIframe();
    } catch (error) {
      if (paymentMessage) paymentMessage.textContent = error.message || 'Payment service is unavailable.';
    }
  };
  function init() {
    resetDailyUsage();
    document.querySelectorAll('[data-close-paywall]').forEach((button) => button.addEventListener('click', () => { if (modal) modal.hidden = true; }));
    const sendCode = document.getElementById('send-code');
    const newAccount = document.getElementById('new-account');
    const backToLogin = document.getElementById('back-to-login');
    const loginAccount = document.getElementById('login-account');
    const verifyCode = document.getElementById('verify-code');
    const message = document.getElementById('access-message');
    if (sendCode) sendCode.onclick = requestVerificationCode;
    if (newAccount) newAccount.onclick = () => {
      document.getElementById('login-fields').hidden = true;
      document.getElementById('signup-fields').hidden = false;
      document.getElementById('access-title').textContent = 'Create your account.';
      document.getElementById('access-description').textContent = 'We will email one code, then you create a password for future sign-ins.';
    };
    if (backToLogin) backToLogin.onclick = () => {
      document.getElementById('login-fields').hidden = false;
      document.getElementById('signup-fields').hidden = true;
      document.getElementById('access-title').textContent = 'Sign in to continue.';
      document.getElementById('access-description').textContent = 'Use your email and password. New users can verify their email once and create a password.';
    };
    if (loginAccount) loginAccount.addEventListener('click', async () => {
      const email = document.getElementById('access-email').value.trim();
      const password = document.getElementById('access-password').value;
      loginAccount.disabled = true;
      try { const result = await api('login', { email, password }); if (!result.ok) throw new Error(result.error); localStorage.setItem('verifiedEmail', email); modal.hidden = true; window.location.reload(); } catch (error) { message.textContent = error.message; } finally { loginAccount.disabled = false; }
    });
    if (verifyCode) verifyCode.addEventListener('click', async () => {
      const email = document.getElementById('access-email').value.trim();
      try { const result = await api('verify', { email, code: document.getElementById('access-code').value, password: document.getElementById('new-password').value }); if (!result.ok) throw new Error(result.error); localStorage.setItem('verifiedEmail', email); modal.hidden = true; window.location.reload(); } catch (error) { message.textContent = error.message; }
    });
    const payButton = document.getElementById('pay-btn');
    if (payButton) payButton.addEventListener('click', window.payWithPaystack);
    const savedEmail = localStorage.getItem('verifiedEmail');
    const emailField = document.getElementById('access-email');
    if (emailField && savedEmail) emailField.value = savedEmail;
    const paymentEmailField = document.getElementById('payment-email');
    if (paymentEmailField && savedEmail) paymentEmailField.value = savedEmail;
    if (emailField && paymentEmailField) emailField.addEventListener('input', () => { paymentEmailField.value = emailField.value; });
    window.checkAccess();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
