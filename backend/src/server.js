import { MongoClient } from 'mongodb';
import { createApp } from './app.js';
const { MONGODB_URI, MONGODB_DB = 'lojinha', ADMIN_TOKEN, FRONTEND_ORIGIN = 'http://localhost:8080', PORT = '3000' } = process.env;
if (!MONGODB_URI || !ADMIN_TOKEN) { console.error('Configure MONGODB_URI e ADMIN_TOKEN no backend/.env ou no ambiente.'); process.exit(1); }
const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const app = createApp({ db: client.db(MONGODB_DB), adminToken: ADMIN_TOKEN, origins: FRONTEND_ORIGIN.split(',').map(s => s.trim()) });
  const server = app.listen(Number(PORT), '0.0.0.0', () => console.log(`API disponível na porta ${PORT}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await client.close(); process.exit(0); }));
} catch { console.error('Não foi possível conectar ao MongoDB. Confira URI, credenciais e acesso de rede.'); await client.close(); process.exit(1); }
