// The three answer engines behind one interface:
//   generate(ctx, { signal }) -> async iterator of text pieces
//   ctx = { messages, question, passages, dialect }
//
//  1. PhoneAI    — model runs inside the phone's browser (WebLLM + WebGPU). Offline anywhere.
//  2. Ollama     — model runs on a classroom hub or the demo laptop (Ollama). Fast; for weak phones.
//  3. Textbook   — no model: answers straight from the retrieved textbook passages. Works on any phone.

import { extractiveAnswer } from './rag.js';
import { DIALECTS } from './prompts.js';

// ---------------------------------------------------------------- Textbook mode
export const textbookEngine = {
  id: 'textbook',
  label: 'Textbook Mode',
  icon: '📖',
  async available() {
    return true;
  },
  async *generate({ question, passages, dialect }) {
    const intro = (DIALECTS[dialect] || DIALECTS.english).textbookIntro;
    if (!passages.length) {
      yield "I couldn't find that in the textbooks saved on this phone. Try different words, choose another subject, or import an update pack from your teacher.";
      return;
    }
    const answer = extractiveAnswer(question, passages) || passages[0].text.split('\n')[0];
    yield `${intro}\n\n${answer}`;
  },
};

// ---------------------------------------------------------------- Ollama (hub / laptop)
async function fetchWithTimeout(url, opts = {}, ms = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export function createOllamaEngine({ id, label, icon, baseUrl, model }) {
  let resolvedModel = model;
  return {
    id,
    label,
    icon,
    baseUrl,
    get model() {
      return resolvedModel;
    },
    /** Reachable AND has at least one model. Picks the preferred model if installed. */
    async available() {
      try {
        const res = await fetchWithTimeout(`${baseUrl}/api/tags`, { cache: 'no-store' });
        if (!res.ok) return false;
        const { models = [] } = await res.json();
        if (!models.length) return false;
        const names = models.map((m) => m.name);
        resolvedModel = names.find((n) => n === model || n.startsWith(model + ':')) || names.find((n) => /llama3\.2|qwen2\.5|gemma/.test(n)) || names[0];
        return true;
      } catch {
        return false;
      }
    },
    async *generate({ messages }, { signal } = {}) {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: resolvedModel, messages, stream: true, options: { temperature: 0.3, num_predict: 400 } }),
        signal,
      });
      if (!res.ok || !res.body) throw new Error(`Ollama error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const msg = JSON.parse(line);
          if (msg.error) throw new Error(msg.error);
          if (msg.message?.content) yield msg.message.content;
          if (msg.done) return;
        }
      }
    },
  };
}

// ---------------------------------------------------------------- Phone AI (WebLLM, in-browser)
export const PHONE_MODELS = {
  lite: { family: 'Qwen2.5-0.5B-Instruct', label: 'Lite — Qwen2.5 0.5B (smaller download, faster)' },
  standard: { family: 'Llama-3.2-1B-Instruct', label: 'Standard — Llama 3.2 1B (better answers)' },
};

let webllmModule = null;
async function loadWebLLM() {
  webllmModule ||= await import('../vendor/web-llm/index.js');
  return webllmModule;
}

/** Returns { ok, f16, reason } — whether this browser can run Phone AI. */
export async function webgpuSupport() {
  if (!globalThis.isSecureContext) return { ok: false, reason: 'Phone AI needs the app opened over https (the hosted link), not a local http address.' };
  if (!navigator.gpu) return { ok: false, reason: 'This browser has no WebGPU. Use Chrome 121+ on Android 12+ or a recent desktop browser.' };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { ok: false, reason: 'No compatible graphics chip found on this device.' };
    return { ok: true, f16: adapter.features.has('shader-f16') };
  } catch (e) {
    return { ok: false, reason: `WebGPU failed: ${e.message}` };
  }
}

export function modelIdFor(size, f16) {
  const fam = (PHONE_MODELS[size] || PHONE_MODELS.lite).family;
  return `${fam}-${f16 ? 'q4f16_1' : 'q4f32_1'}-MLC`;
}

export function createPhoneEngine() {
  let engine = null;
  let loadedId = null;
  let loading = null;

  return {
    id: 'phone',
    label: 'Phone AI',
    icon: '📱',
    modelId: null,

    async isDownloaded(modelId) {
      try {
        const lib = await loadWebLLM();
        return await lib.hasModelInCache(modelId);
      } catch {
        return false;
      }
    },

    /** Download (first time) and load the model. onProgress({ progress: 0..1, text }). */
    async load(modelId, onProgress = () => {}) {
      if (engine && loadedId === modelId) return;
      if (loading) return loading;
      loading = (async () => {
        const lib = await loadWebLLM();
        if (engine) await engine.unload().catch(() => {});
        const worker = new Worker(new URL('./llm-worker.js', import.meta.url), { type: 'module' });
        engine = await lib.CreateWebWorkerMLCEngine(worker, modelId, {
          initProgressCallback: (r) => onProgress({ progress: r.progress ?? 0, text: r.text || '' }),
        });
        loadedId = modelId;
        this.modelId = modelId;
      })();
      try {
        await loading;
      } finally {
        loading = null;
      }
    },

    async remove(modelId) {
      const lib = await loadWebLLM();
      if (engine && loadedId === modelId) {
        await engine.unload().catch(() => {});
        engine = null;
        loadedId = null;
      }
      await lib.deleteModelAllInfoInCache(modelId);
    },

    async available() {
      return !!engine || (this.modelId ? await this.isDownloaded(this.modelId) : false);
    },

    async *generate({ messages }, { signal } = {}) {
      if (!engine) await this.load(this.modelId);
      const stream = await engine.chat.completions.create({ messages, stream: true, temperature: 0.3, max_tokens: 400 });
      for await (const chunk of stream) {
        if (signal?.aborted) {
          engine.interruptGenerate();
          return;
        }
        const piece = chunk.choices?.[0]?.delta?.content;
        if (piece) yield piece;
      }
    },
  };
}
