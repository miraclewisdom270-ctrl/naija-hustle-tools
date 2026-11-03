(function () {
  const key = 'naijatools-invoice';
  const defaults = { business: '', client: '', contact: '', note: '', logo: '', items: [{ description: 'Service or product', qty: 1, price: 0 }] };
  let state = JSON.parse(localStorage.getItem(key) || 'null') || defaults;
  const $ = (id) => document.getElementById(id);
  const money = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function save() { localStorage.setItem(key, JSON.stringify(state)); }
  function renderItems() {
    $('items-list').innerHTML = state.items.map((item, i) => `<div class="item-editor"><input data-i="${i}" data-field="description" value="${esc(item.description)}" aria-label="Item description"><input data-i="${i}" data-field="qty" type="number" min="1" value="${item.qty}" aria-label="Quantity"><input data-i="${i}" data-field="price" type="number" min="0" value="${item.price}" aria-label="Price"><button class="remove-item" data-remove="${i}" type="button" aria-label="Remove item">×</button></div>`).join('');
  }
  function esc(value) { return String(value || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
  function render() {
    const total = state.items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
    $('invoice-preview').innerHTML = `<div class="doc-top"><div>${state.logo ? `<img src="${state.logo}" alt="Business logo" style="max-height:48px;max-width:150px;margin-bottom:12px">` : ''}<div class="doc-brand">${esc(state.business) || 'Your Business'}<span>.</span></div><div style="font-size:11px;color:#69706a;margin-top:5px">${esc(state.contact)}</div></div><div class="doc-meta"><strong>INVOICE</strong><span>NO. NT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}</span><br><span>${new Date().toLocaleDateString('en-NG')}</span></div></div><div class="bill-to"><small>Bill to</small><strong>${esc(state.client) || 'Client name'}</strong></div><table class="doc-table"><thead><tr><th>Description</th><th style="width:60px">Qty</th><th style="width:135px">Amount</th></tr></thead><tbody>${state.items.map((item) => `<tr><td>${esc(item.description) || 'Item'}</td><td>${item.qty || 0}</td><td>${money(Number(item.qty || 0) * Number(item.price || 0))}</td></tr>`).join('')}</tbody></table><div class="doc-total"><div><span>Subtotal</span><span>${money(total)}</span></div><div><span>VAT</span><span>—</span></div><div class="grand"><span>Total due</span><span>${money(total)}</span></div></div><div class="doc-footer">${esc(state.note) || 'Thank you for your business.'}</div>`;
  }
  function sync() { state.business = $('business-name').value; state.client = $('client-name').value; state.contact = $('business-email').value; state.note = $('invoice-note').value; save(); render(); }
  ['business-name', 'client-name', 'business-email', 'invoice-note'].forEach((id) => $(id).addEventListener('input', sync));
  $('add-item').addEventListener('click', () => { state.items.push({ description: 'New item', qty: 1, price: 0 }); save(); renderItems(); render(); });
  $('items-list').addEventListener('input', (e) => { const i = e.target.dataset.i; if (i !== undefined) { state.items[i][e.target.dataset.field] = e.target.dataset.field === 'description' ? e.target.value : Number(e.target.value); save(); render(); } });
  $('items-list').addEventListener('click', (e) => { if (e.target.dataset.remove !== undefined && state.items.length > 1) { state.items.splice(Number(e.target.dataset.remove), 1); save(); renderItems(); render(); } });
  $('logo-upload').addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { state.logo = reader.result; save(); render(); }; reader.readAsDataURL(file); });
  $('download-pdf').addEventListener('click', async () => { const button = $('download-pdf'); button.textContent = 'Preparing…'; const canvas = await html2canvas($('invoice-preview'), { scale: 2, backgroundColor: '#ffffff' }); const { jsPDF } = window.jspdf; const pdf = new jsPDF('p', 'mm', 'a4'); const width = 190; pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, width, width * canvas.height / canvas.width); pdf.save('naijatools-invoice.pdf'); button.textContent = 'Download PDF ↓'; });
  $('business-name').value = state.business; $('client-name').value = state.client; $('business-email').value = state.contact; $('invoice-note').value = state.note; if (state.logo) $('logo-preview').src = state.logo; renderItems(); render();
})();
