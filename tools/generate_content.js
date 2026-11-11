// Build-time AI drafting: asks an LLM for Pidgin explanations, writes drafts flagged reviewed:false.
// Works with Groq (set GROQ_API_KEY) or Anthropic (set ANTHROPIC_API_KEY). Run it on your laptop, never inside the app.
// Usage: GROQ_API_KEY=... node tools/generate_content.js > field-test/drafts.json
// Drafts are NEVER served until a teacher/native speaker flips "reviewed" to true (see src/router.js servable()).
const pack = require('../src/pack');
const GROQ = process.env.GROQ_API_KEY;
const MODEL = process.env.ROOTPATH_MODEL || (GROQ ? 'llama-3.3-70b-versatile' : 'claude-sonnet-5-5'); // check your provider's current model list
async function ask(prompt) {
  const r = GROQ
    ? await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + GROQ }, body: JSON.stringify({ model: MODEL, max_tokens: 300, messages: [{ role: 'user', content: prompt }] }) })
    : await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: MODEL, max_tokens: 300, messages: [{ role: 'user', content: prompt }] }) });
  if (!r.ok) throw new Error(`API ${r.status}`);
  const j = await r.json();
  return (GROQ ? j.choices[0].message.content : j.content.map((c) => c.text || '').join('')).trim();
}
async function draft(m) {
  const [name, fix] = pack.misconceptions[m];
  return ask(`A Nigerian primary/JSS child makes this mistake: "${name}". Official fix: "${fix}". Write a 2-sentence explanation in simple Nigerian Pidgin using a market, football or farm example. Reply with the text only.`);
}
(async () => {
  if (!GROQ && !process.env.ANTHROPIC_API_KEY) throw new Error('Set GROQ_API_KEY or ANTHROPIC_API_KEY');
  const out = [];
  for (const m of Object.keys(pack.misconceptions)) out.push({ key: 'pcm:' + m, lang: 'pcm', text: await draft(m), model: MODEL, reviewed: false });
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error(e.message); process.exit(1); });
