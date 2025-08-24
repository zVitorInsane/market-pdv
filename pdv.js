// ===== Produtos =====
function nextProdId(marketId){
  const c = db.counters.productIdByMarket[marketId]||0;
  const n=c+1; 
  db.counters.productIdByMarket[marketId]=n; 
  return n.toString().padStart(3,'0');
}

function addProduct(){
  const marketId = db.session.marketId; 
  if(!marketId) return alert('Crie um mercado primeiro.');
  const name = $$('#prodName').value.trim();
  const price = parseFloat($$('#prodPrice').value);
  if(!name||!(price>=0)) return;
  const id = nextProdId(marketId);
  db.products.push({ id, name, price, marketId });
  save();
  $$('#prodName').value=''; $$('#prodPrice').value='';
  renderProducts?.();
}

function removeProduct(pid){
  db.products = db.products.filter(p=>!(p.id===pid && p.marketId===db.session.marketId));
  save(); 
  renderProducts?.();
}

function renderProducts(){
  const tbody = $$('#productTable tbody');
  const list = db.products.filter(p=>p.marketId===db.session.marketId);
  tbody.innerHTML = list.map((p,idx)=>`
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${money(p.price)}</td>
      <td><button class="secondary" onclick="removeProduct('${p.id}')">Remover</button></td>
    </tr>`).join('');
}

// ===== Carrinho / Pagamentos / Vendas =====
let cart=[], payments=[];

function addItemById(){
  const marketId = db.session.marketId; 
  if(!marketId) return alert('Selecione/crie um mercado.');
  const pid = $$('#scanId').value.trim();
  const qty = Math.max(1, parseInt($$('#scanQty').value||'1',10));
  const p = db.products.find(x=>x.id===pid && x.marketId===marketId);
  if(!p) { alert('Produto não encontrado neste mercado.'); return; }
  const existing = cart.find(x=>x.id===pid);
  if(existing) existing.qty += qty; 
  else cart.push({ id:p.id, name:p.name, price:p.price, qty, discount:{type:'$', value:0} });
  $$('#scanId').value=''; $$('#scanQty').value='1';
  renderCart();
}

function setDiscount(idx, raw){
  let t='$', v=0;
  if(!raw) { cart[idx].discount = {type:'$', value:0}; return renderCart(); }
  raw = raw.replace(',','.');
  if(raw.endsWith('%')) { t='%'; v=parseFloat(raw.slice(0,-1)); }
  else { v=parseFloat(raw); t='$'; }
  if(!(v>=0)) v=0;
  cart[idx].discount={type:t,value:v};
  renderCart();
}

function subtotal(item){
  const base = item.price*item.qty;
  const off = item.discount.type==='%'? base*(item.discount.value/100): item.discount.value;
  return Math.max(0, base - off);
}

function total(){ return cart.reduce((s,i)=>s+subtotal(i),0); }

function renderCart(){
  const tbody = $$('#cartTable tbody');
  tbody.innerHTML = cart.map((it,idx)=>`
    <tr>
      <td>${it.id}</td>
      <td>${it.name}</td>
      <td>${money(it.price)}</td>
      <td><input style="width:80px" type="number" min="1" value="${it.qty}" onchange="cart[${idx}].qty=parseInt(this.value||'1',10); renderCart()"/></td>
      <td><input style="width:140px" placeholder="ex: 2.50 ou 10%" value="${it.discount.type==='%'?it.discount.value+'%':(it.discount.value||'')}" onchange="setDiscount(${idx},this.value)"/></td>
      <td>${money(subtotal(it))}</td>
      <td><button class="secondary" onclick="cart.splice(${idx},1); renderCart()">Remover</button></td>
    </tr>`).join('');
  
  const t = total();
  $$('#totalValue').textContent = money(t);
  const paid = payments.reduce((s,p)=>s+p.amount,0);
  $$('#dueValue').textContent = money(Math.max(0, t - paid));
  renderPayments();
}

// ===== Pagamentos =====
function addPayment(){
  const amount = parseFloat($$('#payAmount').value);
  if(!(amount>0)) return;
  const method = $$('#payMethod').value;
  payments.push({ method, amount });
  $$('#payAmount').value='';
  renderCart();
}

function clearPayments(){ payments=[]; renderCart(); }

function renderPayments(){
  const div = $$('#payments');
  if(!payments.length){ div.innerHTML='<span class="muted">Sem pagamentos ainda.</span>'; return; }
  div.innerHTML = payments.map((p,i)=>`<div class="pill">${p.method}: <b>${money(p.amount)}</b> <button class="secondary" onclick="payments.splice(${i},1); renderCart()">remover</button></div>`).join('');
}

// ===== Finalização =====
function cancelSale(){ 
  if(confirm('Cancelar venda atual?')){ cart=[]; payments=[]; renderCart(); } 
}

function finalizeSale(){
  if(!cart.length) return alert('Carrinho vazio.');
  const t = total();
  const paid = payments.reduce((s,p)=>s+p.amount,0);
  if(paid<=0) if(!confirm('Nenhum pagamento lançado. Continuar mesmo assim?')) return;
  if(paid<t){ if(!confirm('Pagamento inferior ao total. Continuar?')) return; }
  const sale = {
    id: (db.sales.length+1),
    date: new Date().toISOString(),
    marketId: db.session.marketId,
    items: cart.map(i=>({id:i.id,name:i.name,price:i.price,qty:i.qty,discount:i.discount,subtotal:subtotal(i)})),
    total: t,
    payments: payments.map(p=>({...p}))
  };
  db.sales.push(sale); save();
  cart=[]; payments=[]; renderCart(); renderSales();
}

function renderSales(){
  const tbody = $$('#salesTable tbody');
  tbody.innerHTML = db.sales.slice().reverse().map(s=>{
    const market = db.markets.find(m=>m.id===s.marketId)?.name || '—';
    const payTxt = s.payments.map(p=>`${p.method}:${money(p.amount)}`).join(', ');
    return `<tr><td>${s.id}</td><td>${new Date(s.date).toLocaleString('pt-BR')}</td><td>${market}</td><td>${s.items.length}</td><td>${money(s.total)}</td><td>${payTxt||'—'}</td></tr>`;
  }).join('');
  const grand = db.sales.reduce((s,x)=>s+x.total,0);
  $$('#grandTotal').textContent = money(grand);
}

// ===== Exportação CSV =====
function exportCSV(){
  const rows = [['id','data','mercado','itens','total','pagamentos']];
  for(const s of db.sales){
    const market = db.markets.find(m=>m.id===s.marketId)?.name||'';
    const pays = s.payments.map(p=>`${p.method}:${p.amount}`).join('|');
    rows.push([s.id, new Date(s.date).toLocaleString('pt-BR'), market, s.items.length, s.total, pays]);
  }
  const csv = rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vendas.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
