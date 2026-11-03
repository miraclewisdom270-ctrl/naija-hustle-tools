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
  const api = (action, data = {}) => fetch('/.netlify/functions/usage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) }).then((response) => response.json());
  window.checkAccess = async function () {
    resetDailyUsage();
    let remote;
    try { remote = await api('status'); } catch { remote = null; }
    if (!remote || remote.error === 'Verify your email first') {
      if (modal) modal.hidden = false;
      return false;
    }
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
  window.payWithPaystack = function () {
    const emailField = document.getElementById('access-email');
    const email = emailField ? emailField.value.trim() : '';
    if (!email || !email.includes('@')) { window.alert('Please enter a valid email address.'); return; }
    if (!window.PaystackPop) { window.alert('Payment service is not loaded. Please try again.'); return; }
    window.PaystackPop.setup({
      key: 'pk_live_1b5fcde560c6d3a00ee2fe9feb4c53632583ffc0',
      email: email,
      amount: 350000,
      currency: 'NGN',
      ref: 'NAIJA-' + Math.floor(Math.random() * 1000000000),
      callback: async function (response) {
        const activation = await api('activate', { reference: response.reference });
        if (!activation.ok) { window.alert('Payment received, but access activation failed. Please contact support.'); return; }
        localStorage.setItem('isPremium', 'true');
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        localStorage.setItem('premiumExpiryDate', expiry.toISOString());
        window.alert('Payment Successful! You now have unlimited access for 30 days');
        if (modal) modal.hidden = true;
        window.location.reload();
      },
      onClose: function () { window.alert('Payment cancelled'); }
    }).openIframe();
  };
  function init() {
    resetDailyUsage();
    document.querySelectorAll('[data-close-paywall]').forEach((button) => button.addEventListener('click', () => { if (modal) modal.hidden = true; }));
    const sendCode = document.getElementById('send-code');
    const verifyCode = document.getElementById('verify-code');
    const message = document.getElementById('access-message');
    if (sendCode) sendCode.addEventListener('click', async () => {
      const email = document.getElementById('access-email').value.trim();
      sendCode.disabled = true;
      try { const result = await api('request', { email }); if (!result.ok) throw new Error(result.error); document.getElementById('code-step').hidden = false; message.textContent = 'Code sent. Check your email.'; } catch (error) { message.textContent = error.message; } finally { sendCode.disabled = false; }
    });
    if (verifyCode) verifyCode.addEventListener('click', async () => {
      const email = document.getElementById('access-email').value.trim();
      try { const result = await api('verify', { email, code: document.getElementById('access-code').value }); if (!result.ok) throw new Error(result.error); modal.hidden = true; window.location.reload(); } catch (error) { message.textContent = error.message; }
    });
    const payButton = document.getElementById('pay-btn');
    if (payButton) payButton.addEventListener('click', window.payWithPaystack);
    window.checkAccess();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
