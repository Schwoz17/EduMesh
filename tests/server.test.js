import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHub, resolveStatic } from '../server/index.js';

test('static path resolution blocks traversal', () => {
  assert.equal(resolveStatic('/../package.json'), null);
  assert.equal(resolveStatic('/%2e%2e/%2e%2e/etc/passwd'), null);
  assert.equal(resolveStatic('/..%2fserver%2findex.js'), null);
  assert.equal(resolveStatic('/a%00b'), null);
  assert.equal(resolveStatic('/%E0%A4%A'), null);
  assert.match(resolveStatic('/'), /public[\\/]index\.html$/);
});

test('hub serves the app and streams Ollama replies through /ollama', async (t) => {
  // Fake Ollama that streams two NDJSON tokens.
  const fake = createServer((req, res) => {
    if (req.url === '/api/tags') return res.end(JSON.stringify({ models: [{ name: 'llama3.2:1b' }] }));
    if (req.url === '/api/chat') {
      res.write(JSON.stringify({ message: { content: 'Hello ' } }) + '\n');
      res.end(JSON.stringify({ message: { content: 'student' }, done: true }) + '\n');
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
  process.env.OLLAMA_HOST = `http://127.0.0.1:${fake.address().port}`;
  const { createHub: create } = await import(`../server/index.js?fresh=${Date.now()}`);
  const hub = create();
  await new Promise((r) => hub.listen(0, '127.0.0.1', r));
  t.after(() => {
    hub.close();
    fake.close();
  });
  const base = `http://127.0.0.1:${hub.address().port}`;

  const page = await fetch(base + '/');
  assert.equal(page.status, 200);
  assert.match(await page.text(), /EduMesh AI/);

  const tags = await (await fetch(base + '/ollama/api/tags')).json();
  assert.equal(tags.models[0].name, 'llama3.2:1b');

  const chat = await fetch(base + '/ollama/api/chat', { method: 'POST', body: '{}' });
  const lines = (await chat.text()).trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines.map((l) => l.message.content).join(''), 'Hello student');

  assert.equal((await fetch(base + '/ollama/api/pull', { method: 'POST', body: '{}' })).status, 404); // only safe routes
  assert.equal((await fetch(base + '/nope.html')).status, 404);
});

test('createHub is exported', () => assert.equal(typeof createHub, 'function'));
