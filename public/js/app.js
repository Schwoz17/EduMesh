// EduMesh AI — main app wiring. Runs fully offline once installed.
import { buildIndex, search } from './rag.js';
import { DIALECTS, buildMessages, isDialect } from './prompts.js';
import { LearnerProfile, tierFor } from './mastery.js';
import { textbookEngine, createOllamaEngine, createPhoneEngine, webgpuSupport, modelIdFor, PHONE_MODELS } from './engines.js';
import { speak, stopSpeaking, listen, canListen, canSpeak } from './speech.js';
import { parsePack, packChunks } from './packs.js';

const $ = (id) => document.getElementById(id);
const SETTINGS_KEY = 'edumesh.settings.v1';
const PACKS_KEY = 'edumesh.packs.v1';
const TIER_LABEL = { foundation: 'Foundation (extra simple)', standard: 'Standard (WAEC level)', advanced: 'Advanced (exam challenge)' };

// ------------------------------------------------------------------ state
const settings = Object.assign(
  { mode: 'auto', modelSize: 'lite', fontScale: 1, contrast: false, onboarded: false, downloaded: {} },
  readJSON(SETTINGS_KEY, {})
);
const profile = new LearnerProfile();
const state = {
  index: null,
  chunks: [],
  questions: [],
  subjects: [],
  history: [],
  engine: textbookEngine,
  engineNote: '',
  busy: false,
  abort: null,
  voiceMode: false,
  lastAnswer: '',
  gpu: { ok: false, reason: 'Checking…' },
  quiz: null,
};

const hubEngine = createOllamaEngine({ id: 'hub', label: 'Classroom Hub', icon: '🏫', baseUrl: new URL('ollama', location.href).href.replace(/\/$/, ''), model: 'llama3.2:1b' });
const laptopEngine = createOllamaEngine({ id: 'laptop', label: 'Laptop AI (Ollama)', icon: '💻', baseUrl: 'http://localhost:11434', model: 'llama3.2:1b' });
const phoneEngine = createPhoneEngine();
const isLocalPage = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
function dialect() {
  return $('dialect').value;
}
function subject() {
  return $('subject').value;
}

// ------------------------------------------------------------------ data
async function loadData() {
  const [cur, quiz] = await Promise.all([fetch('data/curriculum.json').then((r) => r.json()), fetch('data/quizzes.json').then((r) => r.json())]);
  const packs = readJSON(PACKS_KEY, []);
  state.chunks = [...cur.chunks];
  state.questions = [...quiz.questions];
  for (const p of packs) {
    try {
      state.chunks.push(...packChunks(p));
      state.questions.push(...p.quizzes);
    } catch {
      /* skip a broken stored pack */
    }
  }
  state.index = buildIndex(state.chunks);
  state.subjects = [...new Set([...state.chunks.map((c) => c.subject), ...state.questions.map((q) => q.subject)])].sort();
  renderSubjects();
  renderPacks(packs);
}

function renderSubjects() {
  const sel = $('subject');
  const current = sel.value || 'all';
  sel.replaceChildren(new Option('📚 All subjects', 'all'), ...state.subjects.map((s) => new Option(s, s)));
  sel.value = state.subjects.includes(current) ? current : 'all';
}

// ------------------------------------------------------------------ engine selection
async function resolveEngine() {
  const size = settings.modelSize;
  phoneEngine.modelId = modelIdFor(size, state.gpu.f16);
  // Cheap check (a saved flag) so students who never use Phone AI don't download the AI library.
  const phoneReady = state.gpu.ok && !!settings.downloaded[phoneEngine.modelId];
  let engine = textbookEngine;
  let note = '';

  if (settings.mode === 'textbook') {
    engine = textbookEngine;
  } else if (settings.mode === 'hub') {
    if (await hubEngine.available()) engine = hubEngine;
    else if (await laptopEngine.available()) engine = laptopEngine;
    else note = 'No classroom hub or laptop AI found. Using Textbook Mode.';
  } else if (settings.mode === 'phone') {
    if (phoneReady) engine = phoneEngine;
    else note = state.gpu.ok ? 'Download the Phone AI model first. Using Textbook Mode for now.' : `Phone AI unavailable: ${state.gpu.reason} Using Textbook Mode.`;
  } else {
    // auto: fastest first
    if (await hubEngine.available()) engine = hubEngine;
    else if (isLocalPage && (await laptopEngine.available())) engine = laptopEngine;
    else if (phoneReady) engine = phoneEngine;
  }
  state.engine = engine;
  state.engineNote = note;
  const chip = $('engineChip');
  chip.textContent = `${engine.icon} ${engine.label}`;
  chip.title = engine.model ? `Model: ${engine.model}` : 'Change AI mode';
  if (note) toast(note);
  await renderPhoneSetup();
}

async function renderPhoneSetup() {
  const g = state.gpu;
  $('gpuStatus').textContent = g.ok ? `✅ This phone can run AI offline${g.f16 ? '' : ' (compatibility mode)'}.` : `⚠️ ${g.reason}`;
  const id = modelIdFor(settings.modelSize, g.f16);
  const have = g.ok && !!settings.downloaded[id];
  $('downloadBtn').disabled = !g.ok || have;
  $('downloadBtn').textContent = have ? '✅ Saved on this phone' : '⬇️ Download for offline';
  $('removeModelBtn').hidden = !have;
}

async function downloadModel() {
  const id = modelIdFor(settings.modelSize, state.gpu.f16);
  const bar = $('dlProgress');
  const txt = $('dlText');
  $('downloadBtn').disabled = true;
  bar.hidden = false;
  try {
    await navigator.storage?.persist?.(); // ask the browser not to evict the model
    await phoneEngine.load(id, ({ progress, text }) => {
      bar.value = progress;
      txt.textContent = text;
    });
    settings.downloaded[id] = true;
    saveSettings();
    txt.textContent = 'Done! Phone AI now works with no internet.';
    if (settings.mode === 'auto' || settings.mode === 'phone') state.engine = phoneEngine;
    toast('📱 Phone AI is ready — you can switch off data now.');
  } catch (e) {
    txt.textContent = `Download failed: ${e.message}. Check your connection and try again; progress is kept.`;
  } finally {
    bar.hidden = true;
    await resolveEngine();
    renderStorage();
  }
}

// ------------------------------------------------------------------ chat
function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const body = document.createElement('div');
  body.className = 'msg-body';
  body.textContent = text;
  div.append(body);
  $('chat').append(div);
  scrollChat();
  return div;
}

// Scroll only the chat box (scrollIntoView would also jump the whole page on phones).
function scrollChat() {
  const chat = $('chat');
  chat.scrollTop = chat.scrollHeight;
}

function addMeta(msgEl, { sources = [], engineLabel, text }) {
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'btn btn-sm';
  play.textContent = '🔊 Listen';
  play.setAttribute('aria-label', 'Read this answer aloud');
  play.addEventListener('click', () => speak(text, dialect()));
  if (canSpeak) meta.append(play);
  const seen = new Set();
  for (const s of sources) {
    const key = `${s.subject} — ${s.topic}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const span = document.createElement('span');
    span.className = 'source';
    span.textContent = `📖 ${key}`;
    meta.append(span);
  }
  if (engineLabel) {
    const e = document.createElement('span');
    e.textContent = engineLabel;
    meta.append(e);
  }
  msgEl.append(meta);
  scrollChat();
}

async function ask(question, inputType = 'text') {
  question = question.trim();
  if (!question || state.busy) return;
  state.busy = true;
  $('sendBtn').disabled = true;
  stopSpeaking();
  addMessage('student', question);

  const d = dialect();
  const changes = profile.recordQuestion({ dialect: d, inputType });
  if (changes.dialectAdopted) toast(`${DIALECTS[d].flag} ${DIALECTS[d].label} is now your default language.`);
  if (changes.voiceFirstEnabled) {
    applyVoiceFirst();
    toast('🎙️ You use your voice a lot — the microphone is now front and centre.');
  }

  const subj = subject();
  let passages = search(state.index, question, { k: 3, subject: subj });
  if (!passages.length && subj !== 'all') passages = search(state.index, question, { k: 3 });
  const pred = profile.prediction(subj);
  const tier = tierFor(pred ? pred.predicted : null);
  const weakTopics = profile.weakTopics(subj).map((w) => w.topic);
  const messages = buildMessages({ question, passages, dialect: d, tier, weakTopics, history: state.history });

  const msg = addMessage('ai', '');
  const body = msg.querySelector('.msg-body');
  body.classList.add('typing');
  let engine = state.engine;
  let text = '';
  let label = `${engine.icon} ${engine.label}`;
  state.abort = new AbortController();
  try {
    if (engine === phoneEngine) {
      body.textContent = 'Loading the AI on your phone…';
      await phoneEngine.load(phoneEngine.modelId, ({ text: t }) => (body.textContent = `Loading the AI on your phone… ${t}`));
      body.textContent = '';
    }
    for await (const piece of engine.generate({ messages, question, passages, dialect: d }, { signal: state.abort.signal })) {
      text += piece;
      body.textContent = text;
      scrollChat();
    }
  } catch (e) {
    if (!text) {
      // Never leave the student empty-handed: fall back to the textbook.
      engine = textbookEngine;
      label = '📖 Textbook Mode (AI unavailable)';
      for await (const piece of textbookEngine.generate({ question, passages, dialect: d })) text += piece;
      body.textContent = text;
      console.warn('Engine failed, used textbook fallback:', e);
    } else {
      text += ' …';
      body.textContent = text;
    }
  } finally {
    body.classList.remove('typing');
    state.busy = false;
    state.abort = null;
    $('sendBtn').disabled = false;
  }

  addMeta(msg, { sources: passages.slice(0, 2), engineLabel: label, text });
  state.lastAnswer = text;
  state.history.push({ role: 'user', content: question }, { role: 'assistant', content: text });
  state.history = state.history.slice(-8);

  if (state.voiceMode) {
    speak(text, d, {
      onend: () => {
        if (profile.data.voiceFirst && state.voiceMode && !state.quiz) startListening();
      },
    });
  }
}

async function startListening() {
  if (!canListen) {
    toast('Voice input is not supported in this browser. Please type your question.');
    return;
  }
  const mic = $('micBtn');
  mic.classList.add('listening');
  $('question').placeholder = '🎙️ Listening… speak now';
  stopSpeaking();
  try {
    const said = await listen();
    if (said) {
      $('question').value = '';
      await ask(said, 'voice');
    }
  } catch (e) {
    toast(e.message);
    if (state.voiceMode) speak(e.message, 'english');
  } finally {
    mic.classList.remove('listening');
    $('question').placeholder = 'Ask any school question…';
  }
}

// ------------------------------------------------------------------ accessibility
function setFontScale(v) {
  settings.fontScale = v;
  document.documentElement.style.setProperty('--font-scale', v);
  saveSettings();
}

function setContrast(on) {
  document.body.classList.toggle('high-contrast', on);
  $('contrastBtn').setAttribute('aria-pressed', String(on));
}

function enableVoiceMode({ announce = true } = {}) {
  state.voiceMode = true;
  profile.set('lowVision', true);
  document.body.classList.add('voice-mode');
  setContrast(true);
  if (settings.fontScale < 1.4) setFontScale(1.4);
  $('voiceModeBtn').setAttribute('aria-pressed', 'true');
  if (announce) {
    speak(
      'Voice Mode is on. Every answer will be read aloud. The microphone button is at the bottom left of the screen, or press Alt and M on a keyboard. To take a quiz, use the quiz button.',
      'english'
    );
  }
}

function disableVoiceMode() {
  state.voiceMode = false;
  profile.set('lowVision', false);
  document.body.classList.remove('voice-mode');
  setContrast(settings.contrast);
  $('voiceModeBtn').setAttribute('aria-pressed', 'false');
  stopSpeaking();
  toast('Voice Mode off.');
}

function applyVoiceFirst() {
  $('micBtn').classList.toggle('btn-lg', !!profile.data.voiceFirst);
}

// Audio-first onboarding: Start button for sighted users; tap anywhere = hear instructions;
// double-tap anywhere = Voice Mode.
const ONBOARD_SPEECH =
  'Welcome to Edu Mesh A I, your free tutor that works without internet. If you are blind or have low vision, double tap anywhere on the screen now to turn on Voice Mode. Otherwise, press the Start button in the middle of the screen.';

function showOnboarding() {
  const ov = $('onboard');
  ov.hidden = false;
  $('startStandard').focus();
  if (canSpeak) speak(ONBOARD_SPEECH, 'english'); // may be blocked until the first tap; we retry on tap
  let lastTap = 0;
  let spoke = false;
  const close = () => {
    ov.hidden = true;
    settings.onboarded = true;
    saveSettings();
    document.removeEventListener('keydown', onKey);
    $('question').focus();
  };
  const onKey = (e) => {
    if (e.key === 'Enter' && e.target === document.body) close();
    if (e.key.toLowerCase() === 'v' && !e.altKey && !e.ctrlKey) {
      close();
      enableVoiceMode();
    }
  };
  document.addEventListener('keydown', onKey);
  $('startStandard').addEventListener('click', (e) => {
    e.stopPropagation();
    stopSpeaking();
    close();
  });
  $('startVoice').addEventListener('click', (e) => {
    e.stopPropagation();
    close();
    enableVoiceMode();
  });
  ov.addEventListener('pointerup', (e) => {
    if (e.target.closest('button')) return;
    const now = Date.now();
    if (now - lastTap < 400) {
      close();
      enableVoiceMode();
      return;
    }
    lastTap = now;
    // First tap gives the browser permission to speak: read the instructions if they were blocked.
    setTimeout(() => {
      if (!ov.hidden && !spoke && Date.now() - lastTap >= 400) {
        spoke = true;
        speak(ONBOARD_SPEECH, 'english');
      }
    }, 420);
  });
}

// ------------------------------------------------------------------ mastery panel
function renderMastery() {
  const subj = subject();
  const scores = profile.scores(subj);
  const pred = profile.prediction(subj);
  const label = subj === 'all' ? 'all subjects' : subj;
  if (!pred) {
    $('prediction').textContent = '—';
    $('trend').textContent = scores.length ? `1 quiz done in ${label}. Take one more to unlock your prediction.` : `Take 2 quizzes in ${label} to unlock your prediction.`;
    $('tier').textContent = '';
  } else {
    $('prediction').textContent = `${pred.predicted}%`;
    $('prediction').setAttribute('aria-label', `Predicted next score ${pred.predicted} percent`);
    $('trend').textContent =
      pred.slope > 1 ? `📈 Improving (+${pred.slope.toFixed(1)} points per quiz).` : pred.slope < -1 ? `📉 Dropping (${pred.slope.toFixed(1)} per quiz) — revise weak topics below.` : '➡️ Steady. Push a little more!';
    $('tier').textContent = `Tutor level: ${TIER_LABEL[tierFor(pred.predicted)]}`;
  }
  // sparkline
  const svg = $('spark');
  svg.replaceChildren();
  const recent = scores.slice(-10);
  if (recent.length >= 2) {
    const pts = recent.map((s, i) => `${(i / (recent.length - 1)) * 116 + 2},${34 - (s / 100) * 32}`).join(' ');
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pl.setAttribute('points', pts);
    svg.append(pl);
  }
  // weak topics
  const weak = profile.weakTopics(subj).slice(0, 4);
  const box = $('weak');
  box.replaceChildren();
  if (weak.length) {
    const p = document.createElement('p');
    p.className = 'small';
    p.textContent = '⚠️ Needs revision (tap to learn):';
    box.append(p);
    for (const w of weak) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-sm';
      b.textContent = `${w.topic} · ${w.percent}%`;
      b.addEventListener('click', () => ask(`Explain ${w.topic} simply, step by step.`));
      box.append(b);
    }
  }
}

// ------------------------------------------------------------------ quiz
function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startQuiz() {
  const subj = subject();
  const pool = state.questions.filter((q) => subj === 'all' || q.subject === subj);
  if (!pool.length) return toast('No quiz questions for this subject yet.');
  const weak = new Set(profile.weakTopics(subj).map((w) => `${w.subject}|${w.topic}`));
  // Weak topics come first so the student practises what they keep missing.
  const items = shuffle(pool)
    .sort((a, b) => weak.has(`${b.subject}|${b.topic}`) - weak.has(`${a.subject}|${a.topic}`))
    .slice(0, 5);
  state.quiz = { subject: subj, items, i: 0, results: [] };
  stopSpeaking();
  $('quizDialog').showModal();
  renderQuizItem();
}

function quizSpeech(item) {
  return `${item.q} ${item.options.map((o, i) => `Option ${'ABCD'[i]}: ${o}.`).join(' ')} Say or press A, B, C or D.`;
}

function renderQuizItem() {
  const { items, i } = state.quiz;
  const item = items[i];
  $('quizProgress').textContent = `Question ${i + 1} of ${items.length}`;
  $('quizTopic').textContent = `${item.subject} · ${item.topic}`;
  $('quizQ').textContent = item.q;
  $('quizFeedback').textContent = '';
  $('quizNext').hidden = true;
  const box = $('quizOptions');
  box.replaceChildren(
    ...item.options.map((opt, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn';
      b.textContent = `${'ABCD'[idx]}. ${opt}`;
      b.addEventListener('click', () => answerQuiz(idx));
      return b;
    })
  );
  box.firstChild.focus();
  if (state.voiceMode) speak(quizSpeech(item), 'english', { onend: () => voiceQuizAnswer() });
}

async function voiceQuizAnswer() {
  if (!canListen || !state.quiz || !state.voiceMode || !$('quizNext').hidden) return;
  try {
    const said = (await listen()).trim().toLowerCase();
    const m = said.match(/\b(a|b|c|d)\b|option (a|b|c|d)|^(a|b|c|d)\b/);
    const letter = m && (m[1] || m[2] || m[3]);
    if (letter && $('quizNext').hidden) answerQuiz('abcd'.indexOf(letter));
  } catch {
    /* fall back to tapping */
  }
}

function answerQuiz(idx) {
  const q = state.quiz;
  const item = q.items[q.i];
  if (!$('quizNext').hidden || idx < 0 || idx >= item.options.length) return;
  const correct = idx === item.answer;
  q.results.push({ subject: item.subject, topic: item.topic, correct });
  [...$('quizOptions').children].forEach((b, i) => {
    b.disabled = true;
    if (i === item.answer) b.classList.add('correct');
    else if (i === idx) b.classList.add('wrong');
  });
  const fb = correct ? `✅ Correct! ${item.explain}` : `❌ Not quite. The answer is ${'ABCD'[item.answer]}. ${item.explain}`;
  $('quizFeedback').textContent = fb;
  const next = $('quizNext');
  next.textContent = q.i + 1 < q.items.length ? 'Next question' : 'See my result';
  next.hidden = false;
  next.focus();
  if (state.voiceMode) speak(`${fb} Press next to continue.`, 'english');
}

function nextQuiz() {
  const q = state.quiz;
  if (q.i + 1 < q.items.length) {
    q.i += 1;
    renderQuizItem();
    return;
  }
  const percent = profile.recordQuiz(q.subject, q.results);
  $('quizDialog').close();
  const msg = `Quiz finished: ${percent}% (${q.results.filter((r) => r.correct).length} of ${q.results.length}).`;
  addMessage('system', `📝 ${msg}`);
  renderMastery();
  const pred = profile.prediction(q.subject);
  if (state.voiceMode) speak(pred ? `${msg} Your predicted next score is ${pred.predicted} percent.` : msg, 'english');
}

// ------------------------------------------------------------------ packs
function renderPacks(packs) {
  const list = $('packList');
  list.replaceChildren(
    ...packs.map((p) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${p.title} (${p.curriculum.length} lessons, ${p.quizzes.length} questions)`;
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn btn-sm';
      rm.textContent = 'Remove';
      rm.setAttribute('aria-label', `Remove pack ${p.title}`);
      rm.addEventListener('click', async () => {
        localStorage.setItem(PACKS_KEY, JSON.stringify(readJSON(PACKS_KEY, []).filter((x) => x.id !== p.id)));
        await loadData();
        toast(`Removed ${p.title}.`);
      });
      li.append(name, rm);
      return li;
    })
  );
}

async function importPack(file) {
  try {
    const pack = parsePack(await file.text());
    const packs = readJSON(PACKS_KEY, []).filter((p) => p.id !== pack.id);
    packs.push(pack);
    localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
    await loadData();
    toast(`📦 Added "${pack.title}": ${pack.curriculum.length} lessons, ${pack.quizzes.length} questions.`);
  } catch (e) {
    toast(`Could not import: ${e.message}`);
  }
}

// ------------------------------------------------------------------ status
let toastTimer;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 4500);
}

function renderNet() {
  const chip = $('netChip');
  const on = navigator.onLine;
  chip.textContent = on ? '🌐 Online (not needed)' : '✈️ Offline — still working';
  chip.classList.toggle('offline', !on);
}

async function renderStorage() {
  const est = await navigator.storage?.estimate?.().catch(() => null);
  if (est?.usage != null) {
    $('storageStatus').textContent = `Storage used: ${(est.usage / 1e6).toFixed(0)} MB${est.quota ? ` of ${(est.quota / 1e9).toFixed(1)} GB available` : ''}`;
  }
}

async function registerServiceWorker() {
  const el = $('appStatus');
  if (!('serviceWorker' in navigator) || !isSecureContext) {
    el.textContent = isSecureContext ? 'App: this browser cannot save apps offline.' : '🏫 App: served by the classroom hub on this Wi-Fi.';
    return;
  }
  try {
    await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    el.textContent = '✅ App + textbooks saved for offline use';
  } catch (e) {
    el.textContent = `App: offline saving failed (${e.message}).`;
  }
}

// ------------------------------------------------------------------ init
function bindUI() {
  const dsel = $('dialect');
  dsel.replaceChildren(...Object.entries(DIALECTS).map(([k, d]) => new Option(`${d.flag} ${d.label}`, k)));
  dsel.value = isDialect(profile.data.preferredDialect) ? profile.data.preferredDialect : 'english';

  $('modelSize').replaceChildren(...Object.entries(PHONE_MODELS).map(([k, m]) => new Option(m.label, k)));
  $('modelSize').value = settings.modelSize;
  $('modelSize').addEventListener('change', async (e) => {
    settings.modelSize = e.target.value;
    saveSettings();
    await resolveEngine();
  });

  document.querySelectorAll('input[name="mode"]').forEach((r) => {
    r.checked = r.value === settings.mode;
    r.addEventListener('change', async () => {
      settings.mode = r.value;
      saveSettings();
      await resolveEngine();
      toast(`AI mode: ${state.engine.icon} ${state.engine.label}`);
    });
  });

  $('askForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('question').value;
    $('question').value = '';
    ask(q, 'text');
  });
  $('micBtn').addEventListener('click', startListening);
  $('subject').addEventListener('change', renderMastery);
  $('contrastBtn').addEventListener('click', () => {
    settings.contrast = !document.body.classList.contains('high-contrast');
    saveSettings();
    setContrast(settings.contrast);
  });
  $('textBtn').addEventListener('click', () => {
    const steps = [1, 1.15, 1.3, 1.5];
    setFontScale(steps[(steps.indexOf(settings.fontScale) + 1) % steps.length] || 1);
  });
  $('voiceModeBtn').addEventListener('click', () => (state.voiceMode ? disableVoiceMode() : enableVoiceMode()));
  $('engineChip').addEventListener('click', () => {
    $('setupCard').scrollIntoView({ behavior: 'smooth' });
    document.querySelector('input[name="mode"]:checked').focus();
  });
  $('downloadBtn').addEventListener('click', downloadModel);
  $('removeModelBtn').addEventListener('click', async () => {
    const id = modelIdFor(settings.modelSize, state.gpu.f16);
    await phoneEngine.remove(id);
    delete settings.downloaded[id];
    saveSettings();
    toast('Phone AI model removed.');
    await resolveEngine();
    renderStorage();
  });
  $('quizBtn').addEventListener('click', startQuiz);
  $('quizNext').addEventListener('click', nextQuiz);
  $('quizClose').addEventListener('click', () => {
    $('quizDialog').close();
  });
  $('quizDialog').addEventListener('close', () => {
    state.quiz = null;
    stopSpeaking();
  });
  $('quizDialog').addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
    if (k.length === 1 && idx >= 0 && state.quiz) answerQuiz(idx);
  });
  $('packInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) importPack(f);
    e.target.value = '';
  });
  $('demoBtn').addEventListener('click', () => {
    profile.data.quizzes = { Biology: [40, 45, 60, 65, 75], Mathematics: [80, 70, 65, 55], all: [50, 60, 65] };
    profile.data.topics = {
      'Biology|Photosynthesis': { right: 1, total: 4 },
      'Mathematics|Quadratic Equations': { right: 1, total: 3 },
      'Physics|Electric Current and Ohm\'s Law': { right: 2, total: 3 },
    };
    profile.save();
    renderMastery();
    toast('Demo quiz history loaded.');
  });
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Delete your quiz history and learning profile from this phone?')) return;
    profile.reset();
    state.history = [];
    renderMastery();
    toast('Your data was deleted from this phone.');
  });

  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      startListening();
    } else if (e.altKey && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      if (state.lastAnswer) speak(state.lastAnswer, dialect());
    } else if (e.key === 'Escape') {
      stopSpeaking();
      state.abort?.abort();
    }
  });

  window.addEventListener('online', renderNet);
  window.addEventListener('offline', renderNet);
  let deferredInstall;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    $('installBtn').hidden = false;
  });
  $('installBtn').addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    $('installBtn').hidden = true;
  });
}

async function init() {
  setFontScale(settings.fontScale);
  setContrast(settings.contrast);
  bindUI();
  renderNet();
  applyVoiceFirst();
  addMessage('ai', 'Welcome! I am your EduMesh tutor. I work with no internet. Choose your language and subject, then ask me anything from your WAEC/NECO syllabus — for example "What is photosynthesis?"');

  if (!settings.onboarded) showOnboarding();
  else if (profile.data.lowVision) enableVoiceMode({ announce: false });

  await loadData();
  renderMastery();
  registerServiceWorker();
  renderStorage();
  state.gpu = await webgpuSupport();
  await resolveEngine();
}

init().catch((e) => {
  console.error(e);
  addMessage('system', `Something went wrong while starting: ${e.message}`);
});
