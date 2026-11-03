(function () {
  const tool = document.body.dataset.tool;
  const key = 'naijatools-' + tool;
  const state = Object.assign({ business: '', name: '', contact: '', note: '', items: [{ description: 'Service or product', qty: 1, price: 0 }] }, JSON.parse(localStorage.getItem(key) || 'null'));
  const $ = (id) => document.getElementById(id);
  const money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const values = { business: 'business', name: 'name', contact: 'contact', note: 'note' };

  function itemsEditor() {
    const list = $('items-list');
    if (!list) return;
    list.innerHTML = state.items.map((item, i) => `<div class="item-editor"><input data-i="${i}" data-field="description" value="${esc(item.description)}" aria-label="Description"><input data-i="${i}" data-field="qty" type="number" min="1" value="${item.qty}" aria-label="Quantity"><input data-i="${i}" data-field="price" type="number" min="0" value="${item.price}" aria-label="Price"><button class="remove-item" data-remove="${i}" type="button">×</button></div>`).join('');
  }
  function documentMarkup(title, label, rows, total, note) {
    return `<div class="doc-top"><div><div class="doc-brand">${esc(state.business) || 'Your Business'}<span>.</span></div><div style="font-size:11px;color:#69706a;margin-top:5px">${esc(state.contact)}</div></div><div class="doc-meta"><strong>${title}</strong><span>${label}</span><br><span>${new Date().toLocaleDateString('en-NG')}</span></div></div><div class="bill-to"><small>${tool === 'salary-slip' ? 'Employee' : 'Prepared for'}</small><strong>${esc(state.name) || 'Name / client'}</strong></div><table class="doc-table"><thead><tr><th>Description</th><th style="width:60px">Qty</th><th style="width:135px">Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="doc-total"><div class="grand"><span>${tool === 'salary-slip' ? 'Net pay' : 'Total'}</span><span>${money(total)}</span></div></div><div class="doc-footer">${esc(note) || 'Thank you for your business.'}</div>`;
  }
  function render() {
    if (tool === 'business-name') return renderNames();
    if (tool === 'qr') return renderQr();
    const total = state.items.reduce((sum, i) => sum + Number(i.qty || 0) * Number(i.price || 0), 0);
    const rows = state.items.map((i) => `<tr><td>${esc(i.description) || 'Item'}</td><td>${i.qty || 0}</td><td>${money(Number(i.qty || 0) * Number(i.price || 0))}</td></tr>`).join('');
    $('extra-preview').innerHTML = documentMarkup(tool === 'salary-slip' ? 'SALARY SLIP' : tool === 'price-list' ? 'PRICE LIST' : 'QUOTATION', tool === 'salary-slip' ? 'PAY PERIOD · ' + new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : 'NT-' + String(Date.now()).slice(-6), rows, total, state.note);
  }
  function renderNames() {
    const base = (state.name || 'Your').trim().split(/\s+/)[0] || 'Your';
    const suffixes = ['Works', 'Hub', 'House', 'Collective', 'Concepts', 'Ventures', 'Studio', 'Market'];
    const ideas = suffixes.map((s, i) => `${base} ${s}${i % 2 ? ' NG' : ''}`);
    $('extra-preview').innerHTML = `<div style="border-bottom:3px solid #101412;padding-bottom:24px"><div class="doc-label">Name ideas for</div><div style="font:700 32px 'Space Grotesk',sans-serif;margin-top:8px">${esc(state.name) || 'Your business'}</div></div><div style="display:grid;gap:12px;margin-top:25px">${ideas.map((idea, i) => `<div style="display:flex;justify-content:space-between;border-bottom:1px solid #d8d9d3;padding:13px 0;font:600 18px 'Space Grotesk',sans-serif"><span>${idea}</span><small style="font:10px 'DM Mono',monospace;color:#14b866">0${i + 1}</small></div>`).join('')}</div><div class="doc-footer">${esc(state.note) || 'A fresh list of ideas for your next big move.'}</div>`;
  }
  function renderQr() {
    $('extra-preview').innerHTML = `<div style="text-align:center"><div class="doc-label">Scan to connect</div><div id="qr-output" style="display:grid;place-items:center;margin:35px auto"></div><div class="doc-brand">${esc(state.business) || 'Your Business'}<span>.</span></div><p style="font-size:12px;color:#69706a">${esc(state.note) || 'Scan this code to visit us.'}</p></div>`;
    if (window.QRCode) new QRCode($('qr-output'), { text: state.contact || 'https://naijatools.netlify.app', width: 190, height: 190, colorDark: '#101412', colorLight: '#ffffff' });
  }
  document.querySelectorAll('[data-field]').forEach((input) => { const field = input.dataset.field; input.value = state[values[field] || field] || ''; input.addEventListener('input', () => { state[values[field] || field] = input.value; save(); render(); }); });
  if ($('items-list')) {
    itemsEditor();
    $('add-item').addEventListener('click', () => { state.items.push({ description: 'New item', qty: 1, price: 0 }); save(); itemsEditor(); render(); });
    $('items-list').addEventListener('input', (e) => { if (e.target.dataset.i !== undefined) { const i = e.target.dataset.i; state.items[i][e.target.dataset.field] = e.target.dataset.field === 'description' ? e.target.value : Number(e.target.value); save(); render(); } });
    $('items-list').addEventListener('click', (e) => { if (e.target.dataset.remove !== undefined && state.items.length > 1) { state.items.splice(Number(e.target.dataset.remove), 1); save(); itemsEditor(); render(); } });
  }
  $('download-pdf').addEventListener('click', async () => { const button = $('download-pdf'); button.textContent = 'Preparing…'; const canvas = await html2canvas($('extra-preview'), { scale: 2, backgroundColor: '#fff' }); const { jsPDF } = window.jspdf; const pdf = new jsPDF('p', 'mm', 'a4'); const width = 190; pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, width, width * canvas.height / canvas.width); pdf.save('naijatools-' + tool + '.pdf'); button.textContent = 'Download PDF ↓'; });
  render();
})();
