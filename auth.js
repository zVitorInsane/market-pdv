async function registerUser(){
  const name = $$('#regName').value.trim();
  const pass = $$('#regPass').value;
  if(!name||!pass) return msg('authMsg','Preencha nome e senha.',true);

  let code;
  do { code = Math.floor(1000+Math.random()*9000).toString(); } 
  while(db.users.some(u=>u.code===code));

  db.users.push({ id:uid(), name, pass, code });
  await save();
  msg('authMsg',`Usuário criado! Seu ID é <b>${code}</b>. Guarde-o para login.`);
  $$('#regName').value=''; $$('#regPass').value='';
}

async function login(){
  const code = $$('#loginId').value.trim();
  const pass = $$('#loginPass').value;
  const u = db.users.find(x=>x.code===code && x.pass===pass);
  if(!u) return msg('authMsg','ID ou senha inválidos.',true);

  db.session = { userId:u.id, marketId:null };
  await save();
  startApp();
}

function logout(){ 
  db.session=null; 
  save().then(()=>location.reload());
}

function msg(id,html,err=false){ 
  const el=$$('#'+id); 
  el.innerHTML=html; 
  el.className = (err? 'err muted':'ok muted'); 
}

async function initAuth(){
  await loadDB();
  if(db.session?.userId) startApp();
}

function startApp(){
  $$('#auth').classList.add('hidden');
  $$('#app').classList.remove('hidden');
  const user = db.users.find(u=>u.id===db.session.userId);
  $$('#whoami').textContent = user?.name||'—';
  renderMarkets();
  renderProducts();
}

initAuth();
