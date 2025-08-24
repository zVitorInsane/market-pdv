async function addMarket(){
  const name = $$('#marketName').value.trim();
  if(!name) return;
  const id = uid();
  db.markets.push({id,name});
  if(!db.session.marketId) db.session.marketId=id;
  await save();
  $$('#marketName').value='';
  renderMarkets();
  renderProducts();
}

function setCurrentMarket(id){ 
  db.session.marketId=id; 
  save().then(()=>{
    renderMarkets();
    renderProducts();
  });
}

async function removeMarket(){
  const id = $$('#marketSelect').value; if(!id) return;
  if(!confirm('Remover mercado e seus produtos?')) return;
  db.products = db.products.filter(p=>p.marketId!==id);
  delete db.counters.productIdByMarket[id];
  db.markets = db.markets.filter(m=>m.id!==id);
  if(db.session.marketId===id) db.session.marketId = db.markets[0]?.id || null;
  await save();
  renderMarkets(); 
  renderProducts();
}

function renderMarkets(){
  const sel = $$('#marketSelect');
  sel.innerHTML = db.markets.map(m=>`<option value="${m.id}" ${m.id===db.session.marketId?'selected':''}>${m.name}</option>`).join('');
  $$('#marketCurrent').textContent = (db.markets.find(m=>m.id===db.session.marketId)?.name)||'—';
}
