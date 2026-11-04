(function () {
  const tool = document.body.dataset.tool;
  const key = 'naijatools-data-' + tool;
  const esc = (value) => String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const configs = {
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
  const styleField = '<div class="field"><label for="field-style">Template style</label><select id="field-style" data-field="style"><option value="professional">Professional</option><option value="bold">Bold Naija</option></select></div>';
  $('extended-form').innerHTML = `<div class="form-intro"><span class="tool-kicker">${config.eyebrow}</span><h2>${config.title}</h2><p>${config.use || 'Create something clear, useful and ready to share with confidence.'}</p></div>${fieldMarkup}${styleField}<p class="save-note">Saved automatically on this device.</p>`;
  const setState = (name, value) => { state[name] = value; localStorage.setItem(key, JSON.stringify(state)); render(); };
  document.querySelectorAll('[data-field]').forEach((input) => { input.value = state[input.dataset.field] || (input.dataset.field === 'style' ? 'professional' : ''); input.addEventListener('input', () => setState(input.dataset.field, input.value)); });
  function documentBody() {
    const title = esc(state.title || config.title);
    if (tool === 'flyer') return `<div class="promo-preview"><span class="premium-tag">SPECIAL OFFER</span><h2>${title}</h2><p>${esc(state.summary) || 'Your offer deserves attention.'}</p><strong>${esc(state.note) || 'Message us today'}</strong><small>${esc(state.business) || 'Your brand'} · ${esc(state.contact)}</small></div>`;
    const paragraphs = String(state.body || '').split(/\r?\n/).filter(Boolean).map((line) => `<p>${esc(line)}</p>`).join('');
    return `<div class="doc-cover"><span class="tool-kicker">${config.eyebrow}</span><div class="doc-brand">${esc(state.business) || 'Your Business'}<span>.</span></div><h2>${title}</h2><p>${esc(state.summary) || 'A clear, professional document made for your next move.'}</p></div><div class="doc-section"><div class="doc-meta"><span>${new Date().toLocaleDateString('en-NG')}</span><strong>${esc(state.client) || 'Client / recipient'}</strong></div>${paragraphs || '<p>Add the details your client needs to make a decision.</p>'}</div><div class="doc-footer">${esc(state.note) || 'Thank you for your consideration.'}<br><strong>${esc(state.business) || 'Your Business'}</strong></div>`;
  }
  function render() {
    $('tool-preview').classList.toggle('bold-template', state.style === 'bold');
    $('tool-preview').innerHTML = documentBody();
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
