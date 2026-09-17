import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
const html = await readFile('index.html', 'utf8');
const script = await readFile('js/lojinha.js', 'utf8');
const initialProduct = { id: '012345678901234567890123', name: 'Bola teste', price: 30, quantity: 5, category: 'Equipamentos', description: 'Bola de treino', image: 'https://example.com/bola.png', storeId: 1 };
async function setup() {
  const dom = new JSDOM(html, { url: 'http://localhost:8080', runScripts: 'outside-only' });
  await new Promise(resolve => dom.window.addEventListener('load', resolve));
  const window = dom.window;
  window.alert = () => {};
  window.confirm = () => true;
  let records = [structuredClone(initialProduct)];
  const requests = [];
  let fail = false;
  window.fetch = async (url, options) => {
    const method = options.method || 'GET'; requests.push({ url, method });
    if (fail) throw new Error('Falha simulada');
    if (method === 'PUT') records = [{ ...JSON.parse(options.body), id: initialProduct.id }];
    if (method === 'POST') records.unshift({ ...JSON.parse(options.body), id: '112345678901234567890123' });
    if (method === 'DELETE') { records = []; return { status: 204 }; }
    return { status: method === 'POST' ? 201 : 200, ok: true, json: async () => structuredClone(method === 'GET' ? records : records[0]) };
  };
  window.localStorage.setItem('currentUser', JSON.stringify({ id: 1, name: 'Teste', type: 'seller' }));
  window.eval(script);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await new Promise(resolve => setTimeout(resolve, 0));
  return { window, requests, fail: () => { fail = true; }, close: () => window.close() };
}
test('IDs únicos e sessão restaurada abre aplicação sem voltar ao login', async () => {
  const app = await setup();
  try {
    const ids = [...app.window.document.querySelectorAll('[id]')].map(el => el.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(app.window.document.getElementById('login-page').style.display, 'none');
    assert.equal(app.window.document.getElementById('app').style.display, 'block');
  } finally { app.close(); }
});
test('editar e cancelar não exclui; salvar usa PUT e mantém o ID', async () => {
  const app = await setup(); const w = app.window;
  try {
    w.editProduct(initialProduct.id); w.cancelEdit();
    assert.ok(!app.requests.some(r => r.method === 'DELETE'));
    w.editProduct(initialProduct.id);
    w.document.getElementById('productName').value = 'Bola editada';
    w.document.getElementById('productQuantity').value = '0';
    await w.addProduct();
    assert.equal(app.requests.at(-1).method, 'PUT');
    assert.ok(app.requests.at(-1).url.endsWith(initialProduct.id));
    assert.match(w.document.getElementById('productsList').textContent, /Bola editada/);
    assert.equal(w.document.getElementById('saveProduct').disabled, false);
  } finally { app.close(); }
});
test('falha ao salvar conserva formulário e registro; texto de produto não executa HTML', async () => {
  const app = await setup(); const w = app.window;
  try {
    w.editProduct(initialProduct.id);
    w.document.getElementById('productName').value = '<img src=x onerror=alert(1)>';
    await w.addProduct();
    assert.match(w.document.getElementById('productsList').textContent, /<img src=x/);
    assert.equal(w.document.querySelectorAll('img[onerror]').length, 0);
    w.editProduct(initialProduct.id); app.fail();
    w.document.getElementById('productName').value = 'Preservar';
    await w.addProduct();
    assert.equal(w.document.getElementById('productName').value, 'Preservar');
    assert.equal(w.document.getElementById('saveProduct').disabled, false);
  } finally { app.close(); }
});
test('criar usa POST, excluir usa DELETE e atualiza o catálogo', async () => {
  const app = await setup(); const w = app.window;
  try {
    for (const [field, value] of Object.entries(initialProduct)) {
      const input = w.document.getElementById('product' + field[0].toUpperCase() + field.slice(1));
      if (input) input.value = value;
    }
    await w.addProduct();
    assert.equal(app.requests.at(-1).method, 'POST');
    await w.deleteProduct('112345678901234567890123');
    assert.equal(app.requests.at(-1).method, 'DELETE');
    assert.equal(w.document.querySelectorAll('#productsList .product-card').length, 1);
  } finally { app.close(); }
});
