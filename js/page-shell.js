(function () {
  document.body.style.visibility = 'hidden';
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../service-worker.js?v=3');
  fetch('/api/usage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'status' }) })
    .then(function (response) { return response.json(); })
    .then(function (result) {
      if (!result.ok) { window.location.replace('../signup.html'); return; }
      document.body.style.visibility = 'visible';
    })
    .catch(function () { window.location.replace('../signup.html'); });
  const modal = document.createElement('div');
  modal.id = 'pay-modal';
  modal.className = 'pay-modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="pay-box"><button data-close-paywall class="pay-close" type="button">×</button><div id="verify-step"><span class="premium-tag">YOUR ACCOUNT</span><h2 id="access-title">Sign in to continue.</h2><p id="access-description">Use your email and password. New users can verify their email once and create a password.</p><label class="pay-email-label" for="access-email">Email address</label><input id="access-email" class="pay-email" type="email" placeholder="you@example.com" autocomplete="email"><div id="login-fields"><label class="pay-email-label" for="access-password">Password</label><input id="access-password" class="pay-email" type="password" placeholder="At least 8 characters" autocomplete="current-password"><button id="login-account" class="button button-dark" type="button">Sign in</button><button id="new-account" class="button button-light" type="button">New account / reset password</button></div><div id="signup-fields" hidden><button id="send-code" class="button button-dark" type="button">Send verification code</button><div id="code-step" hidden><label class="pay-email-label" for="access-code">Verification code</label><input id="access-code" class="pay-email" inputmode="numeric" placeholder="6-digit code"><label class="pay-email-label" for="new-password">Create password</label><input id="new-password" class="pay-email" type="password" placeholder="At least 8 characters" autocomplete="new-password"><button id="verify-code" class="button button-dark" type="button">Verify and create password</button></div><button id="back-to-login" class="button button-light" type="button">Back to sign in</button></div><p id="access-message" class="access-message" role="alert"></p></div><div id="upgrade-step" hidden><span class="premium-tag">PRO ACCESS</span><h2>Unlock unlimited access.</h2><p>Pay ₦3,500 for 30 days of unlimited downloads.</p><label class="pay-email-label" for="payment-email">Verified email</label><input id="payment-email" class="pay-email" type="email" placeholder="you@example.com" autocomplete="email"><button id="pay-btn" class="button button-dark" type="button">Pay ₦3,500 with Paystack</button><p id="payment-message" class="access-message" role="alert"></p></div></div>';
  document.body.appendChild(modal);
  const header = document.querySelector('.site-header');
  if (header) {
    const signout = document.createElement('button');
    signout.className = 'header-link header-button';
    signout.type = 'button';
    signout.textContent = 'Sign out';
    signout.addEventListener('click', async () => {
      await fetch('/api/usage', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
      localStorage.removeItem('verifiedEmail');
      localStorage.removeItem('isPremium');
      localStorage.removeItem('premiumExpiryDate');
      window.location.href = '../index.html';
    });
    header.appendChild(signout);
  }
  window.paystackReady = new Promise((resolve, reject) => {
    if (window.PaystackPop) { resolve(window.PaystackPop); return; }
    const existing = document.querySelector('script[src*="js.paystack.co/v1/inline.js"]');
    const paystack = existing || document.createElement('script');
    if (!existing) {
      paystack.src = 'https://js.paystack.co/v1/inline.js';
      paystack.async = true;
      document.head.appendChild(paystack);
    }
    paystack.addEventListener('load', () => window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error('Paystack loaded without checkout support')));
    paystack.addEventListener('error', () => reject(new Error('Paystack could not load. Check your internet connection or content blocker.')));
  });
  ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', '../js/paywall.js?v=4', '../js/tools.js?v=4'].forEach(function (src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.body.appendChild(script);
  });
})();
