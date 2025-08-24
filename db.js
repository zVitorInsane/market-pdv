let db = null;

async function loadDB() {
  const res = await fetch('/api/db');
  db = await res.json();
  return db;
}

async function saveDB() {
  if(!db) return;
  await fetch('/api/db', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify(db)
  });
}

// Alias para compatibilidade com os outros scripts
const save = saveDB;
