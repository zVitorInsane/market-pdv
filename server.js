const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, js, css

const DB_FILE = path.join(__dirname, 'db.json');

// Inicializa DB se não existir
let db = { users: [], markets: [], products: [], sales: [], session: null, counters: { productIdByMarket: {} } };
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
else fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

// GET /api/db
app.get('/api/db', (req, res) => res.json(db));

// POST /api/db
app.post('/api/db', (req, res) => {
  db = req.body;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
