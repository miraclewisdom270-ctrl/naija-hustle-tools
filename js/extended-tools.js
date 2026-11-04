(function () {
  const tool = document.body.dataset.tool;
  const key = 'naijatools-data-' + tool;
  const money = (value) => '₦' + Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const configs = {
    expense: { title: 'Expense Tracker', eyebrow: '09 / money control', fields: [['business', 'Business name', 'text'], ['income', 'Monthly income', 'number'], ['rent', 'Rent / workspace', 'number'], ['stock', 'Stock / supplies', 'number'], ['transport', 'Transport', 'number'], ['other', 'Other expenses', 'number']] },
    profit: { title: 'Profit & Loss', eyebrow: '10 / money control', fields: [['business', 'Business name', 'text'], ['revenue', 'Sales revenue', 'number'], ['cost', 'Cost of goods / services', 'number'], ['expenses', 'Operating expenses', 'number']] },
    cashflow: { title: 'Cashflow Planner', eyebrow: '11 / money control', fields: [['business', 'Business name', 'text'], ['opening', 'Opening cash balance', 'number'], ['inflows', 'Expected money in', 'number'], ['outflows', 'Expected money out', 'number']] },
    loan: { title: 'Loan Calculator', eyebrow: '12 / finance essentials', fields: [['business', 'Your name / business', 'text'], ['principal', 'Loan amount', 'number'], ['rate', 'Annual interest rate (%)', 'number'], ['months', 'Repayment period (months)', 'number']] },
    payroll: { title: 'Payroll Calculator', eyebrow: '13 / people operations', fields: [['business', 'Business name', 'text'], ['employee', 'Employee name', 'text'], ['gross', 'Gross monthly salary', 'number'], ['bonus', 'Bonus / allowance', 'number']] },
    tax: { title: 'VAT & Tax Calculator', eyebrow: '14 / finance essentials', fields: [['business', 'Business name', 'text'], ['subtotal', 'Price before VAT', 'number'], ['vat', 'VAT rate (%)', 'number']] },
    proposal: { title: 'Proposal Maker', eyebrow: '15 / win better work', fields: [['business', 'Your business', 'text'], ['client', 'Client name', 'text'], ['title', 'Project title', 'text'], ['summary', 'The client challenge', 'textarea'], ['body', 'Your proposed solution', 'textarea'], ['note', 'Price / next step', 'textarea']] },
    contract: { title: 'Agreement Maker', eyebrow: '16 / protect your work', fields: [['business', 'Your name / business', 'text'], ['client', 'Client / partner', 'text'], ['title', 'Agreement title', 'text'], ['body', 'Scope, payment and key terms', 'textarea'], ['note', 'Sign-off note', 'textarea']] },
    flyer: { title: 'Social Flyer', eyebrow: '17 / get attention', fields: [['business', 'Brand name', 'text'], ['title', 'Main offer', 'text'], ['summary', 'Short description', 'textarea'], ['contact', 'Phone / WhatsApp / location', 'text'], ['note', 'Call to action', 'text']] },
    programme: { title: 'Event Programme', eyebrow: '18 / event essentials', fields: [['business', 'Organiser / host', 'text'], ['title', 'Event name', 'text'], ['client', 'Date and venue', 'text'], ['summary', 'Welcome message', 'textarea'], ['body', 'Programme schedule', 'textarea'], ['note', 'Contact / closing note', 'textarea']] }
  };
  const config = configs[tool];
  if (!config) return;
  let state = Object.assign({}, JSON.parse(localStorage.getItem(key) || '{}'));
  const $ = (id) => document.getElementById(id);
  const fieldMarkup = config.fields.map(([name, label, type]) => `<div class="field"><label for="field-${name}">${label}</label>${type === 'textarea' ? `<textarea id="field-${name}" data-field="${name}" placeholder="${label}"></textarea>` : `<input id="field-${name}" data-field="${name}" type="${type}" min="0" placeholder="${label}">`}</div>`).join('');
  const isCalculator = ['expense', 'profit', 'cashflow', 'loan', 'payroll', 'tax'].includes(tool);
  const styleField = isCalculator ? '' : '<div class="field"><label for="field-style">Template style</label><select id="field-style" data-field="style"><option value="professional">Professional</option><option value="bold">Bold Naija</option></select></div>';
  $('extended-form').innerHTML = `<h2>Build your ${config.title.toLowerCase()}</h2>${fieldMarkup}${styleField}<p class="save-note">Saved automatically on this device.</p>`;
  const setState = (name, value) => { state[name] = value; localStorage.setItem(key, JSON.stringify(state)); render(); };
  document.querySelectorAll('[data-field]').forEach((input) => { input.value = state[input.dataset.field] || (input.dataset.field === 'style' ? 'professional' : ''); input.addEventListener('input', () => setState(input.dataset.field, input.value)); });
  function calculation() {
    if (tool === 'expense') {
      const total = ['rent', 'stock', 'transport', 'other'].reduce((sum, item) => sum + Number(state[item] || 0), 0);
      return { label: 'Total monthly expenses', value: total, details: `Income: ${money(state.income)} · Remaining: ${money(Number(state.income || 0) - total)}` };
    }
    if (tool === 'profit') {
      const gross = Number(state.revenue || 0) - Number(state.cost || 0);
      const net = gross - Number(state.expenses || 0);
      return { label: net >= 0 ? 'Estimated net profit' : 'Estimated loss', value: net, details: `Gross profit: ${money(gross)} · Margin: ${state.revenue ? Math.round((net / Number(state.revenue)) * 100) : 0}%` };
    }
    if (tool === 'cashflow') {
      const balance = Number(state.opening || 0) + Number(state.inflows || 0) - Number(state.outflows || 0);
      return { label: 'Projected closing balance', value: balance, details: `Opening: ${money(state.opening)} · Net movement: ${money(Number(state.inflows || 0) - Number(state.outflows || 0))}` };
    }
    if (tool === 'loan') {
      const principal = Number(state.principal || 0); const months = Number(state.months || 0); const monthlyRate = Number(state.rate || 0) / 100 / 12;
      const payment = monthlyRate && months ? principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1) : (months ? principal / months : 0);
      return { label: 'Estimated monthly repayment', value: payment, details: `Total repayment: ${money(payment * months)} · Interest: ${money(payment * months - principal)}` };
    }
    if (tool === 'payroll') {
      const gross = Number(state.gross || 0) + Number(state.bonus || 0); const pension = gross * 0.08; const tax = Math.max(0, (gross - 200000) * 0.05);
      return { label: 'Estimated take-home pay', value: gross - pension - tax, details: `Gross: ${money(gross)} · Pension estimate: ${money(pension)} · PAYE estimate: ${money(tax)}` };
    }
    if (tool === 'tax') {
      const subtotal = Number(state.subtotal || 0); const vat = subtotal * (Number(state.vat || 7.5) / 100);
      return { label: 'Customer price including VAT', value: subtotal + vat, details: `VAT: ${money(vat)} · Before VAT: ${money(subtotal)}` };
    }
    return null;
  }
  function documentBody() {
    const title = esc(state.title || config.title);
    if (tool === 'flyer') return `<div class="promo-preview"><span class="premium-tag">SPECIAL OFFER</span><h2>${title}</h2><p>${esc(state.summary) || 'Your offer deserves attention.'}</p><strong>${esc(state.note) || 'Message us today'}</strong><small>${esc(state.business) || 'Your brand'} · ${esc(state.contact)}</small></div>`;
    const paragraphs = String(state.body || '').split(/\r?\n/).filter(Boolean).map((line) => `<p>${esc(line)}</p>`).join('');
    return `<div class="doc-top"><div><div class="doc-brand">${esc(state.business) || 'Your Business'}<span>.</span></div></div><div class="doc-meta"><strong>${title}</strong><span>${new Date().toLocaleDateString('en-NG')}</span></div></div><div class="bill-to"><small>Prepared for</small><strong>${esc(state.client) || 'Client / recipient'}</strong></div><h2>${title}</h2><p>${esc(state.summary) || 'Add a clear introduction or purpose.'}</p>${paragraphs || '<p>Add the details your client needs to make a decision.</p>'}<div class="doc-footer">${esc(state.note) || 'Thank you for your consideration.'}<br><strong>${esc(state.business) || 'Your Business'}</strong></div>`;
  }
  function render() {
    const result = calculation();
    $('tool-preview').classList.toggle('bold-template', state.style === 'bold');
    $('tool-preview').innerHTML = result ? `<div class="doc-top"><div><div class="doc-brand">${esc(state.business) || 'Your Business'}<span>.</span></div><div style="font-size:11px;color:#69706a;margin-top:5px">Naija Hustle Tools</div></div><div class="doc-meta"><strong>${config.title}</strong><span>${new Date().toLocaleDateString('en-NG')}</span></div></div><div class="result-card"><small>${result.label}</small><strong>${money(result.value)}</strong><p>${result.details}</p></div><div class="doc-footer">Use this estimate to make a better business decision. Update your numbers as they change.</div>` : documentBody();
  }
  document.querySelector('[data-download]').addEventListener('click', async () => {
    if (!(await window.checkAccess())) return;
    const button = document.querySelector('[data-download]'); button.textContent = 'Preparing…';
    const canvas = await html2canvas($('tool-preview'), { scale: 2, backgroundColor: '#ffffff' });
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4'); const width = 190;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, width, width * canvas.height / canvas.width); pdf.save('naijatools-' + tool + '.pdf');
    await window.recordDownload(); button.textContent = 'Download PDF ↓';
  });
  render();
})();
