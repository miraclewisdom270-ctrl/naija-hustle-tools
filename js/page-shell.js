(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../service-worker.js?v=3');
  const modal = document.createElement('div');
  modal.id = 'pay-modal';
  modal.className = 'pay-modal';
  modal.hidden = true;
  modal.innerHTML = '<div class="pay-box"><button data-close-paywall class="pay-close" type="button">×</button><div id="verify-step"><span class="premium-tag">YOUR ACCOUNT</span><h2>Sign in to continue.</h2><p>Use your email and password. New users can verify their email once and create a password.</p><label class="pay-email-label" for="access-email">Email address</label><input id="access-email" class="pay-email" type="email" placeholder="you@example.com" autocomplete="email"><label class="pay-email-label" for="access-password">Password</label><input id="access-password" class="pay-email" type="password" placeholder="At least 8 characters" autocomplete="current-password"><button id="login-account" class="button button-dark" type="button">Sign in</button><button id="send-code" class="button button-light" type="button">New account / reset password</button><div id="code-step" hidden><label class="pay-email-label" for="access-code">Verification code</label><input id="access-code" class="pay-email" inputmode="numeric" placeholder="6-digit code"><label class="pay-email-label" for="new-password">Create password</label><input id="new-password" class="pay-email" type="password" placeholder="At least 8 characters" autocomplete="new-password"><button id="verify-code" class="button button-dark" type="button">Verify and create password</button></div><p id="access-message" class="access-message" role="alert"></p></div><div id="upgrade-step" hidden><span class="premium-tag">PRO ACCESS</span><h2>Unlock unlimited access.</h2><p>Pay ₦3,500 for 30 days of unlimited downloads.</p><label class="pay-email-label" for="payment-email">Verified email</label><input id="payment-email" class="pay-email" type="email" placeholder="you@example.com" autocomplete="email"><button id="pay-btn" class="button button-dark" type="button">Pay ₦3,500 with Paystack</button><p id="payment-message" class="access-message" role="alert"></p></div></div>';
  document.body.appendChild(modal);
  if (!window.PaystackPop) {
    const paystack = document.createElement('script');
    paystack.src = 'https://js.paystack.co/v1/inline.js';
    paystack.async = true;
    document.head.appendChild(paystack);
  }
  ['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', '../js/paywall.js?v=3', '../js/tools.js?v=3'].forEach(function (src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.body.appendChild(script);
  });
})();
