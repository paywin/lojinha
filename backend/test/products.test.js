import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { createApp } from '../src/app.js';
let mongo, client, server, base;
const token = 'test-only-admin-key';
const product = { name: 'Bola de futebol', description: 'Bola de treino', category: 'Equipamentos', price: 99.9, quantity: 5, image: 'https://example.com/bola.png', storeId: 1 };
const request = (path = '', options = {}) => fetch(base + '/api/products' + path, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
before(async () => {
  mongo = await MongoMemoryServer.create();
  client = await new MongoClient(mongo.getUri()).connect();
  const app = createApp({ db: client.db('test'), adminToken: token, origins: ['http://localhost:8080'] });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await client?.close(); await mongo?.stop(); });
test('CRUD persiste no MongoDB, mantém ID ao editar e exclui', async () => {
  let response = await request('', { method: 'POST', body: JSON.stringify(product) });
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.match(created.id, /^[a-f\d]{24}$/);
  assert.equal((await client.db('test').collection('products').findOne({ name: product.name })).quantity, 5);
  assert.equal((await (await request('/' + created.id)).json()).name, product.name);
  assert.ok((await (await request()).json()).some(p => p.id === created.id));
  response = await request('/' + created.id, { method: 'PUT', body: JSON.stringify({ ...product, price: 0, quantity: 0, name: 'Bola editada' }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, created.id);
  const persisted = await (await request('/' + created.id)).json();
  assert.equal(persisted.name, 'Bola editada'); assert.equal(persisted.quantity, 0);
  assert.equal((await request('/' + created.id, { method: 'DELETE' })).status, 204);
  assert.equal((await request('/' + created.id)).status, 404);
  assert.equal((await request('/' + created.id, { method: 'PUT', body: JSON.stringify(product) })).status, 404);
  assert.equal((await request('/' + created.id, { method: 'DELETE' })).status, 404);
});
test('bloqueia escrita sem autorização e aceita leitura pública', async () => {
  assert.equal((await request('', { method: 'POST', headers: { Authorization: '' }, body: JSON.stringify(product) })).status, 401);
  for (const method of ['PUT', 'DELETE']) assert.equal((await request('/012345678901234567890123', { method, headers: { Authorization: 'Bearer wrong' }, body: JSON.stringify(product) })).status, 401);
  assert.equal((await request('', { headers: { Authorization: '' } })).status, 200);
});
test('rejeita dados inválidos, IDs inválidos e JSON malformado', async () => {
  for (const patch of [{ price: -1 }, { price: '10' }, { quantity: 1.5 }, { quantity: -1 }, { name: ' ' }, { image: 'javascript:alert(1)' }, { storeId: 999 }, { extra: true }]) {
    assert.equal((await request('', { method: 'POST', body: JSON.stringify({ ...product, ...patch }) })).status, 400);
  }
  assert.equal((await request('/not-an-id')).status, 400);
  assert.equal((await request('', { method: 'POST', body: '{' })).status, 400);
});
test('health check consulta banco e CORS libera apenas origem configurada', async () => {
  assert.equal((await fetch(base + '/api/health')).status, 200);
  assert.equal((await request('', { headers: { Origin: 'http://localhost:8080' } })).headers.get('access-control-allow-origin'), 'http://localhost:8080');
  assert.equal((await request('', { headers: { Origin: 'https://untrusted.example' } })).headers.get('access-control-allow-origin'), null);
});
