#!/usr/bin/env node
// Real phone calls: serves the RootPath call tutor to Africa's Talking Voice.
// Point your AT voice number's callback URL at this server. Each request carries sessionId,
// isActive and (after a key press) dtmfDigits; we answer with AT voice XML (Say + GetDigits).
//   PORT=8080 PUBLIC_URL=https://your-host/voice CLIPS_URL=https://edumesh-eta.vercel.app/voice/clips/ node tools/at-voice.js
const { CallSession } = require('../src/call');

const esc = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

const { clipId } = require('../src/voice');

/**
 * Speech for one prompt: recorded YarnGPT clips (<Play>) where available, the provider's voice (<Say>) otherwise.
 * clips: { base: 'https://your-host/voice/clips/', have: Set of clip ids }
 */
function speech(p, clips) {
  const pieces = p.segments || [p.say];
  if (!clips || !clips.have || !clips.have.size) return `<Say>${esc(p.say)}</Say>`;
  return pieces.map((t) => {
    const id = clipId(p.lang || 'en', t);
    return clips.have.has(id) ? `<Play url="${esc(clips.base + id + '.mp3')}"/>` : `<Say>${esc(t)}</Say>`;
  }).join('');
}

/** Convert one tutor prompt into Africa's Talking voice XML. */
function toXml(p, callbackUrl, clips) {
  if (p.end) return `<?xml version="1.0" encoding="UTF-8"?><Response>${speech(p, clips)}</Response>`;
  return `<?xml version="1.0" encoding="UTF-8"?><Response><GetDigits timeout="20" finishOnKey="#" numDigits="1" callbackUrl="${esc(callbackUrl)}">${speech(p, clips)}</GetDigits><Say>${esc('No answer received. Goodbye.')}</Say></Response>`;
}

/** Stateful handler: one CallSession per AT sessionId. */
function createHandler({ callbackUrl, clips, maxSessions = 5000 } = {}) {
  const sessions = new Map();
  return function handle(params) {
    const id = params.sessionId;
    if (!id) return { status: 400, body: 'missing sessionId' };
    if (params.isActive === '0') { sessions.delete(id); return { status: 200, body: '' }; }
    let s = sessions.get(id), p;
    if (!s) {
      if (sessions.size >= maxSessions) sessions.delete(sessions.keys().next().value);
      s = new CallSession({ caller: params.callerNumber || 'Learner' });
      sessions.set(id, s);
      p = s.start();
    } else {
      p = s.press(params.dtmfDigits || '*');
    }
    if (p.end) sessions.delete(id);
    return { status: 200, body: toXml(p, callbackUrl, clips), result: p.result };
  };
}

if (require.main === module) {
  const http = require('node:http');
  // CLIPS_URL: where voice/clips/ is served (e.g. https://edumesh-eta.vercel.app/voice/clips/) to play YarnGPT voices.
  let have = new Set();
  try { have = new Set(require('../voice/clips/index.json')); } catch (e) {}
  const clips = process.env.CLIPS_URL ? { base: process.env.CLIPS_URL.replace(/\/?$/, '/'), have } : null;
  const handle = createHandler({ callbackUrl: process.env.PUBLIC_URL || 'http://localhost:8080/voice', clips });
  http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e5) req.destroy(); });
    req.on('end', () => {
      const out = handle(Object.fromEntries(new URLSearchParams(raw)));
      if (out.result) console.log('Diagnosis:', JSON.stringify({ caller: out.result.caller, target: out.result.target, roots: out.result.roots }));
      res.writeHead(out.status, { 'Content-Type': 'application/xml' });
      res.end(out.body);
    });
  }).listen(Number(process.env.PORT) || 8080, () => console.log('RootPath voice webhook listening'));
}

module.exports = { toXml, createHandler };
