import express from 'express';
import cors from 'cors';
import { ObjectId } from 'mongodb';
import { timingSafeEqual } from 'node:crypto';

const fields = ['name', 'description', 'category', 'image', 'price', 'quantity', 'storeId'];
function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Produto inválido.';
  if (Object.keys(body).some(key => !fields.includes(key))) return 'Campo desconhecido.';
  for (const field of ['name', 'description', 'category', 'image']) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > 2000) return `Campo ${field} inválido.`;
  }
  try { if (!['http:', 'https:'].includes(new URL(body.image).protocol)) return 'URL de imagem inválida.'; }
  catch { return 'URL de imagem inválida.'; }
  if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0 || body.price > 10000000) return 'Preço inválido.';
  if (!Number.isSafeInteger(body.quantity) || body.quantity < 0) return 'Estoque inválido.';
  if (!Number.isInteger(body.storeId) || body.storeId < 1 || body.storeId > 4) return 'Loja inválida.';
}
function output(doc) { const { _id, ...rest } = doc; return { ...rest, id: _id.toHexString() }; }
export function createApp({ db, adminToken, origins = [] }) {
  if (!adminToken) throw new Error('ADMIN_TOKEN obrigatório.');
  const app = express();
  const products = db.collection('products');
  app.disable('x-powered-by');
  app.use(cors({ origin(origin, callback) { callback(null, !origin || origins.includes(origin)); } }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', async (_req, res) => { await db.command({ ping: 1 }); res.json({ status: 'ok' }); });
  app.get('/api/products', async (_req, res) => res.json((await products.find().sort({ createdAt: -1, _id: -1 }).toArray()).map(output)));
  app.param('id', (req, res, next, id) => {
    if (!/^[a-f\d]{24}$/i.test(id)) return res.status(400).json({ error: 'ID inválido.' });
    req.productId = new ObjectId(id); next();
  });
  app.get('/api/products/:id', async (req, res) => {
    const doc = await products.findOne({ _id: req.productId });
    if (!doc) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(output(doc));
  });
  function authorize(req, res, next) {
    const actual = Buffer.from(req.get('authorization') || '');
    const expected = Buffer.from(`Bearer ${adminToken}`);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'Chave de administração inválida.' });
    next();
  }
  app.post('/api/products', authorize, async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const doc = { ...req.body, createdAt: new Date(), updatedAt: new Date() };
    const { insertedId } = await products.insertOne(doc);
    res.status(201).json(output({ ...doc, _id: insertedId }));
  });
  app.put('/api/products/:id', authorize, async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const doc = await products.findOneAndUpdate({ _id: req.productId }, { $set: { ...req.body, updatedAt: new Date() } }, { returnDocument: 'after' });
    if (!doc) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(output(doc));
  });
  app.delete('/api/products/:id', authorize, async (req, res) => {
    const result = await products.deleteOne({ _id: req.productId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.status(204).end();
  });
  app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use((error, _req, res, _next) => {
    const status = error.status === 400 ? 400 : error.status === 413 ? 413 : 503;
    res.status(status).json({ error: status === 400 ? 'JSON inválido.' : status === 413 ? 'Corpo muito grande.' : 'Serviço indisponível. Tente novamente.' });
  });
  return app;
}
