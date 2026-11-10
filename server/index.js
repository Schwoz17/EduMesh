#!/usr/bin/env node
// EduMesh Classroom Hub (optional).
// Serves the same app over a local Wi-Fi network and relays AI requests to Ollama,
// so weak phones can use a laptop's model with zero internet. No npm packages needed.
//
//   OLLAMA_HOST=http://127.0.0.1:11434 PORT=8080 node server/index.js

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join, normalize, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const OLLAMA = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '').replace(/^(?!https?:\/\/)/, 'http://');
const MAX_BODY = 256 * 1024;
const OLLAMA_ROUTES = new Set(['/api/tags', '/api/chat', '/api/version']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

export function resolveStatic(urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  if (p.includes('\0')) return null;
  if (p.endsWith('/')) p += 'index.html';
  const full = normalize(join(PUBLIC_DIR, p));
  if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + sep)) return null; // path traversal guard
  return full;
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function serveStatic(req, res) {
  const file = resolveStatic(new URL(req.url, 'http://x').pathname);
  if (!file) return send(res, 400, 'Bad path');
  let st;
  try {
    st = statSync(file);
  } catch {
    return send(res, 404, 'Not found');
  }
  if (!st.isFile()) return send(res, 404, 'Not found');
  res.writeHead(200, {
    'Content-Type': MIME[extname(file)] || 'application/octet-stream',
    'Content-Length': st.size,
    'Cache-Control': file.includes(`${sep}vendor${sep}`) ? 'public, max-age=604800' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

async function proxyOllama(req, res, route) {
  if (!OLLAMA_ROUTES.has(route)) return send(res, 404, 'Not found');
  let body;
  if (req.method === 'POST') {
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      if (size > MAX_BODY) return send(res, 413, 'Request too large');
      chunks.push(c);
    }
    body = Buffer.concat(chunks);
  } else if (req.method !== 'GET') {
    return send(res, 405, 'Method not allowed');
  }
  try {
    const upstream = await fetch(OLLAMA + route, {
      method: req.method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body,
    });
    res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' });
    if (!upstream.body) return res.end();
    for await (const chunk of upstream.body) res.write(chunk); // stream tokens as they arrive
    res.end();
  } catch {
    if (!res.headersSent) send(res, 502, JSON.stringify({ error: 'Ollama is not running on the hub.' }), 'application/json');
    else res.end();
  }
}

export function createHub() {
  return createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    const m = path.match(/\/ollama(\/api\/[a-z]+)$/);
    if (m) {
      proxyOllama(req, res, m[1]).catch(() => res.end());
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    serveStatic(req, res);
  });
}

function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createHub().listen(PORT, HOST, async () => {
    console.log('\n  📚 EduMesh Classroom Hub is running\n');
    console.log(`  On this computer:   http://localhost:${PORT}`);
    for (const ip of lanAddresses()) console.log(`  Students on Wi-Fi:  http://${ip}:${PORT}`);
    try {
      const r = await fetch(`${OLLAMA}/api/tags`);
      const { models = [] } = await r.json();
      console.log(`\n  🧠 Ollama: ${models.length ? models.map((m) => m.name).join(', ') : 'running, but no models — run: ollama pull llama3.2:1b'}`);
    } catch {
      console.log(`\n  ⚠️  Ollama not reachable at ${OLLAMA}. Students will get Textbook Mode until you start it.`);
    }
    console.log('');
  });
}
