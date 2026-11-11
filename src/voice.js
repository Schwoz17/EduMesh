// Pre-recorded Nigerian voices (YarnGPT) for everything RootPath says.
// Every spoken piece gets a stable id from its language + exact words; if a clip with that id
// exists in voice/clips/, it is played, otherwise the device's own voice reads the words.
(function (root) {
  // Which YarnGPT voice reads each language (Pidgin uses a Nigerian-English voice).
  const VOICES = {
    en: { lang: 'english', speaker: 'idera' },
    pcm: { lang: 'english', speaker: 'jude' },
    yo: { lang: 'yoruba', speaker: 'yoruba_female2' },
    ig: { lang: 'igbo', speaker: 'igbo_female2' },
    ha: { lang: 'hausa', speaker: 'hausa_female1' },
  };
  const norm = (s) => String(s).normalize('NFC').replace(/\s+/g, ' ').trim();
  /** Stable id for a spoken piece (FNV-1a, 32-bit), e.g. "pcm-1a2b3c4d". */
  function clipId(lang, text) {
    let h = 0x811c9dc5;
    const s = lang + '|' + norm(text);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return lang + '-' + h.toString(16).padStart(8, '0');
  }

  /** Browser player: plays clips in order, falling back to speech synthesis per piece. */
  function createPlayer({ base = 'voice/clips/', index = 'voice/clips/index.json', onState = () => {} } = {}) {
    let have = new Set(), loaded = false, run = 0, audio = null;
    const ready = fetch(index).then((r) => (r.ok ? r.json() : [])).then((ids) => { have = new Set(ids); loaded = true; }).catch(() => { loaded = true; });
    const synth = root.speechSynthesis;
    const pickVoice = (lang) => {
      if (!synth) return null;
      const v = synth.getVoices(), base2 = lang.split('-')[0];
      return v.find((x) => x.lang === lang) || v.find((x) => x.lang && x.lang.startsWith(base2 + '-')) || v.find((x) => x.lang === 'en-NG') || v.find((x) => x.lang === 'en-GB') || v.find((x) => /^en/.test(x.lang)) || null;
    };
    const speakOne = (text, ttsLang, rate) => new Promise((done) => {
      if (!synth) return done();
      const u = new SpeechSynthesisUtterance(text), v = pickVoice(ttsLang);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-NG';
      u.rate = rate; u.onend = u.onerror = () => done();
      synth.speak(u);
    });
    const playClip = (id) => new Promise((done) => {
      audio = new Audio(base + id + '.mp3');
      audio.onended = audio.onerror = () => done();
      audio.play().catch(() => done());
    });
    return {
      ready,
      has: (lang, text) => have.has(clipId(lang, text)),
      count: () => have.size,
      stop() { run++; if (audio) { audio.pause(); audio = null; } if (synth) synth.cancel(); onState(false); },
      /** Play pieces one after another. lang: en|pcm|yo|ig|ha; ttsLang: e.g. en-NG. */
      async play(pieces, lang, { ttsLang = 'en-NG', rate = 1, muted = false } = {}) {
        this.stop();
        if (muted) return;
        const my = ++run;
        await ready;
        onState(true);
        for (const p of pieces) {
          if (my !== run) return;
          if (!p) continue;
          const id = clipId(lang, p);
          if (have.has(id)) await playClip(id); else await speakOne(p, ttsLang, rate);
        }
        if (my === run) onState(false);
      },
      get loaded() { return loaded; },
    };
  }

  const api = { VOICES, clipId, createPlayer };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RootPathVoice = api;
})(typeof self !== 'undefined' ? self : this);
