# 📚 EduMesh AI — the offline AI tutor

**Wale Lab NextGen AI Hackathon 2026 · Track 1: AI for Zero-Bandwidth & Localised Learning**

EduMesh AI is a free AI tutor for Nigerian secondary-school students. A student opens a link **once**. After that it works **anywhere with no internet and no data**: at home, on the bus, in the village. It explains the WAEC/NECO/JAMB syllabus in **English, Pidgin, Yoruba, Hausa or Igbo**, reads answers aloud for blind and low-vision learners, and predicts exam readiness. Everything runs on the student's own phone.

> "A student shouldn't need a ₦5,000 data plan to ask a tutor a question."

---

## How it works

```
 ONE TIME (any Wi-Fi: school, café, a friend's hotspot)
 ┌──────────────────────────────────────────────────────────┐
 │ Open the EduMesh link → "Install app" → saves:            │
 │   • the app + all textbooks + quizzes   (≈ 0.2 MB)        │
 │   • optional Phone AI model             (≈ 0.3–0.9 GB)    │
 └──────────────────────────────────────────────────────────┘
                              │
                              ▼
 FOREVER AFTER (no internet, anywhere)
 ┌──────────────────────────────────────────────────────────┐
 │ Question ─► Local textbook search (RAG, on the phone)     │
 │          ─► Prompt: dialect + tutor level + weak topics   │
 │          ─► Best available AI engine ─► Answer + 🔊 voice │
 └──────────────────────────────────────────────────────────┘
```

### Three tiers, one app (chosen automatically)

| Tier | Where the AI runs | Needs | Works on |
|---|---|---|---|
| 📱 **Phone AI** | Inside the phone's browser (WebLLM + WebGPU) | One-time model download | Newer phones (≈4 GB+ RAM, Chrome 121+ / Android 12+) |
| 🏫 **Classroom Hub** | A laptop or Raspberry Pi running Ollama, shared over local Wi-Fi | A hub in the room (no internet) | Any phone with a browser |
| 📖 **Textbook Mode** | No model: answers straight from the saved textbooks | Nothing | Any phone, even very old ones |

If an AI engine fails mid-answer, the student automatically gets the textbook answer instead and is never left with nothing.

---

## Features

**Zero bandwidth**
- Installable PWA: a service worker saves the app, textbooks and quizzes for offline use.
- Phone AI: Llama 3.2 1B or Qwen2.5 0.5B (4-bit), running fully in the browser and cached after the first download.
- The AI runtime is bundled in `public/vendor/`, so nothing loads from a CDN.

**Curriculum-grounded answers (local RAG)**
- BM25 textbook search on the phone. Every answer shows its textbook source, e.g. 📖 *Biology — Photosynthesis*.
- The model is instructed to answer from those passages, which keeps it on the syllabus.
- Examples are Nigerian: Balogun market, okada fares, danfo buses, Kainji dam, NEPA bills.

**5 language modes (code-switching)**
- Standard English, Nigerian Pidgin, Yoruba + English, Hausa + English, Igbo + English.
- The same model is steered by the system prompt, so no extra language files are needed.
- Speech rate and voice language adjust for each mode.

**Accessibility (low vision and blind learners)**
- **Audio-first onboarding:** a voice explains the app; **double-tap anywhere** turns on Voice Mode.
- **Voice Mode:** high contrast (WCAG AAA colours), large text, and every answer read aloud.
- Quizzes are read aloud and can be answered by saying "A", "B", "C" or "D".
- Voice input via the microphone, plus keyboard shortcuts: `Alt+M` speak, `Alt+R` repeat, `Esc` stop.
- Large touch targets, screen-reader labels and live regions.

**Learns the student (stored only on the phone)**
- **Language:** after 3 questions in a row in one language, that language becomes the default.
- **Voice-first:** after 3 voice questions in a row, the mic becomes large and listening restarts automatically after each answer.
- **Weak topics:** topics with under 50% correct are flagged, put first in the next quiz, and sent to the AI so it explains them more simply.

**Predictive mastery layer**
- Quiz scores feed a linear-regression trend on the phone that predicts the next score.
- The prediction sets the tutor level:
  - *Foundation* when the predicted score is below 50%
  - *Standard* from 50% to 74%
  - *Advanced* (adds an exam challenge question) at 75% and above

**Zero-data curriculum updates ("Pass-It-On")**
- Teachers make a small `.edumesh.json` **update pack** and share it by Xender, ShareIt, Bluetooth or USB.
- Students tap *Import pack*. The new lessons and quizzes are searchable instantly, with no internet.

**Privacy**
- No accounts, no analytics, no server-side storage. *Reset my data* wipes the phone's profile.

---

## Run it

**Requirements:** Node.js 18+ (no `npm install` needed: zero dependencies).

### 1. Quick start on your laptop

```bash
npm start
```

Open http://localhost:8080. Textbook Mode works immediately.

### 2. Add a real AI (Ollama) on the laptop or classroom hub

```bash
ollama pull llama3.2:1b
```

```bash
npm start
```

The hub finds Ollama automatically and prints the Wi-Fi address for students, e.g. `http://192.168.0.10:8080`. Phones on the same Wi-Fi (even a router with **no internet**) open that address and use the laptop's AI.

Set `OLLAMA_HOST` or `PORT` if you need different values.

### 3. Host it so anyone can install it anywhere

The app is a static site: just the `public/` folder, served over **https** (offline install and Phone AI require https).

**Recommended: Vercel.** It gives a short link (e.g. `edumesh.vercel.app`) and a preview link for every branch, and works with private repos.
1. Go to vercel.com → **Add New → Project** → import `Schwoz17/EduMesh`.
2. Leave the settings as they are; `vercel.json` already sets them. It runs `npm test` as the build step, so a broken version is never published, and serves `public/`.
3. Click **Deploy**. Every push to `main` then redeploys automatically.

**Also set up: GitHub Pages.**
1. In the repo, go to **Settings → Pages → Source: GitHub Actions**.
2. `.github/workflows/pages.yml` runs the tests and publishes `public/` on every push to `main`, at `https://schwoz17.github.io/EduMesh/`.

**Not needed: Render.** Its strength is always-on servers, but EduMesh has no server to run in the cloud: the classroom hub runs on a laptop in the classroom, not online.

To use a laptop's Ollama from the hosted https site, start Ollama with `OLLAMA_ORIGINS=*` and choose **🏫 Classroom Hub / Laptop** in *Offline Setup*.

### Tests

```bash
npm test
```

38 tests cover:
- textbook search
- prompt building
- prediction and profile
- update packs
- hub server safety and streaming

### Edit the curriculum

1. Add or edit Markdown in `curriculum/`. Use `# Subject`, then `## Topic`, then an optional `Level:` line. Quiz questions go in `curriculum/quizzes.json`.
2. Rebuild the data files:

```bash
npm run build:data
```

### Make an update pack for students

```bash
npm run pack -- --id agric-basics --title "Agricultural Science basics" lesson.md --quizzes quizzes.json -o agric.edumesh.json
```

Try the example in `examples/agric-pack.edumesh.json`. Teachers can also make packs inside the app: **Setup → Teacher: make a lesson pack**, then **Share pack** opens the phone's share sheet (Xender, Bluetooth, WhatsApp).

---

## 3-minute demo script (for the judges' video)

1. **Hook.** Open the hosted link and tap *Install app*. In *Offline Setup*, tap **Download for offline**.
2. **Cut the internet.** Turn on airplane mode, close the app and reopen it. The top chip shows **✈️ Offline — still working**.
3. **Ask** "What is photosynthesis?" The answer streams in and shows its 📖 textbook source.
4. **Pidgin.** Switch to 🇳🇬 Pidgin and ask "Wetin be Ohm's law?" Ask 3 times and the app announces Pidgin is now the default.
5. **Accessibility.** Reset the onboarding (clear site data), double-tap the screen, and Voice Mode turns on: high contrast, large text, answers read aloud.
6. **Prediction.** Take two Biology quizzes. Readiness shows (e.g. "62% 📈 Improving") and weak topics appear. Tap one to get a simpler explanation.
7. **Pass-It-On.** Import `agric-pack.edumesh.json` (sent by Xender). Ask "What is loamy soil?" It answers with no data.

(*About → Load demo history* fills in a sample quiz history if time is short.)

---

## Honest limitations

- **First download needs internet once:** the app is tiny; the AI model is 0.3–0.9 GB, best on Wi-Fi.
- **Phone AI needs a capable phone.** Phones without WebGPU, or with little RAM, fall back to the Classroom Hub or Textbook Mode automatically.
- **Small models are less capable than ChatGPT.** Textbook grounding and short, focused prompts reduce mistakes but don't remove them.
- **Voice input is not offline in every browser.** Chrome may send speech to an online service; EduMesh asks for on-device recognition where supported and always lets students type. Read-aloud (text-to-speech) works offline with the phone's installed voices.
- Yoruba, Hausa and Igbo modes are *English with code-switching*. Small models are not fluent in these languages, and phones rarely have Yoruba/Hausa/Igbo voices, so speech falls back to an English (Nigeria) voice.
- The sample curriculum is a demo set (6 subjects, 58 questions, plus an example Agricultural Science pack) written for this prototype; a real rollout would load full approved textbooks.

## Project layout

```
public/                 ← the whole app (deploy this folder)
  index.html, styles.css, sw.js, manifest.webmanifest
  js/app.js             UI wiring, onboarding, quiz, packs
  js/rag.js             BM25 textbook search + extractive answers
  js/prompts.js         5 dialects, tutor tiers, prompt assembly
  js/mastery.js         linear-regression prediction + learner profile
  js/engines.js         Phone AI (WebLLM) · Ollama hub · Textbook engines
  js/speech.js          read-aloud + voice input
  js/packs.js           update-pack validation
  js/teacher.js         in-app teacher pack builder
  data/                 built textbooks + quizzes (from curriculum/)
  vendor/web-llm/       in-browser AI runtime (Apache-2.0)
server/index.js         optional classroom hub (static files + Ollama relay)
curriculum/             source lessons (Markdown) + quiz bank
scripts/                build-data.js, make-pack.js
examples/               sample lesson pack (Agricultural Science)
submission/             pitch script, demo-video plan, written submission
tests/                  node:test suites
```

## Credits

- [WebLLM](https://github.com/mlc-ai/web-llm) (Apache-2.0) for in-browser inference
- [Ollama](https://ollama.com) for hub inference
- Models: Meta Llama 3.2 1B, Qwen2.5 0.5B
