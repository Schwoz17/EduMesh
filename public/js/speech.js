// Text-to-speech and voice input using the browser's built-in engines.
// Speech synthesis uses voices installed on the phone, so it works offline.
// Speech recognition: on-device where the browser supports it (processLocally);
// otherwise some browsers (e.g. Chrome) send audio to an online service, so it may
// not work with data off. The app always keeps typing available as a fallback.

import { DIALECTS } from './prompts.js';

const synth = globalThis.speechSynthesis;

export const canSpeak = !!synth;
const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
export const canListen = !!Recognition;

function pickVoice(lang) {
  const voices = synth.getVoices();
  const base = lang.split('-')[0];
  return (
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang?.startsWith(base + '-')) ||
    voices.find((v) => v.lang === 'en-NG') ||
    voices.find((v) => v.lang === 'en-GB') ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    null
  );
}

export function cleanForSpeech(text) {
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '') // emoji
    .replace(/[*_#`>]/g, '')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/₦\s?([\d,]+)/g, '$1 naira')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Speak text; long text is split into sentences (some engines cut off long utterances). */
export function speak(text, dialect = 'english', { onend } = {}) {
  if (!synth) {
    onend?.();
    return;
  }
  synth.cancel();
  const d = DIALECTS[dialect] || DIALECTS.english;
  const voice = pickVoice(d.ttsLang);
  const parts = cleanForSpeech(text).match(/[^.!?]+[.!?]*/g) || [];
  if (!parts.length) {
    onend?.();
    return;
  }
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p.trim());
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else u.lang = 'en-NG';
    u.rate = d.ttsRate;
    if (i === parts.length - 1 && onend) {
      u.onend = onend;
      u.onerror = onend;
    }
    synth.speak(u);
  });
}

export function stopSpeaking() {
  synth?.cancel();
}

export function isSpeaking() {
  return !!synth?.speaking;
}

/** Listen once. Resolves with the transcript (or '' on no speech); rejects with a readable Error. */
export function listen({ lang = 'en-NG' } = {}) {
  return new Promise((resolve, reject) => {
    if (!Recognition) return reject(new Error('Voice input is not supported in this browser. Please type your question.'));
    const r = new Recognition();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    if ('processLocally' in r) r.processLocally = true; // on-device recognition where available
    let done = false;
    r.onresult = (e) => {
      done = true;
      resolve(e.results[0][0].transcript);
    };
    r.onerror = (e) => {
      if (done) return;
      done = true;
      const msg =
        e.error === 'network'
          ? 'Voice input needs internet on this browser. Please type your question instead.'
          : e.error === 'not-allowed'
            ? 'Microphone permission was denied.'
            : e.error === 'no-speech'
              ? ''
              : `Voice input failed (${e.error}).`;
      msg ? reject(new Error(msg)) : resolve('');
    };
    r.onend = () => {
      if (!done) resolve('');
    };
    r.start();
  });
}
