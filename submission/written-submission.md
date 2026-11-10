# EduMesh AI — Written Submission

**Wale Lab NextGen AI Hackathon 2026 · Track 1: AI for "Zero-Bandwidth" & Localised Learning**

- **Team:** [Team name]
- **Members:** [Names and roles]
- **Live app:** [your live link]
- **Code:** https://github.com/Schwoz17/EduMesh
- **Pitch deck:** [deck link]
- **Demo video:** [video link]

---

## One-line summary

EduMesh AI is a free AI tutor that students open once from a link and then use anywhere, with no internet and no data. It follows the WAEC/NECO/JAMB syllabus, speaks five Nigerian language modes, and blind and low-vision students can use it on their own.

## The problem

Students who want help outside class need three things that often fail in Nigeria:

1. **Affordable data.** Online tutors and AI chatbots need a data plan that many families cannot pay for every month.
2. **A network that stays up.** In rural areas, weak signal and power cuts stop online tools mid-lesson.
3. **A tool that fits them.** Popular chatbots don't follow the Nigerian syllabus. They use foreign examples, don't speak Pidgin or local languages, and are hard for blind learners to use.

## Our solution

EduMesh is an installable web app (a Progressive Web App).

1. A student opens our link once, anywhere there is Wi-Fi.
2. The app, the textbooks and quizzes, and (on capable phones) a small AI model are saved on the phone.
3. From then on it works in airplane mode, and every question costs **zero data**.

### Three ways to answer, chosen automatically

| Mode | Where the AI runs | Best for |
|---|---|---|
| 📱 **Phone AI** | Inside the phone's browser (Llama 3.2 1B or Qwen2.5 0.5B, 4-bit, via WebLLM) | Newer phones; works anywhere |
| 🏫 **Classroom Hub** | One laptop running Ollama, shared over a local Wi-Fi router with no internet | Classrooms with weak phones |
| 📖 **Textbook Mode** | No model: answers come straight from the saved textbook | Any phone; automatic fallback |

Every question first searches the textbooks saved on the phone (local retrieval, or "RAG"). The AI is told to answer from those passages, and each answer shows its textbook source. This keeps answers on the syllabus and reduces made-up facts. If the AI fails, Textbook Mode answers instead, so a student is never left with nothing.

## Key features

- **Curriculum-grounded answers** with the source shown, e.g. "📖 Biology — Photosynthesis".
- **Five language modes:** English, Nigerian Pidgin, and Yoruba, Hausa or Igbo mixed with English. Examples are local: markets, naira, danfo, farming.
- **Accessibility for blind and low-vision learners:**
  - A voice explains the app the first time it opens.
  - Double-tap anywhere to turn on Voice Mode: high contrast, large text, and every answer read aloud.
  - Quizzes are read out and can be answered by saying A–D.
- **Learns the student's habits on the phone:**
  - After 3 questions in a row in one language, that language becomes the default.
  - After 3 voice questions in a row, the app turns voice-first.
  - Weak topics are tracked, put first in quizzes, and explained more simply.
- **Exam-readiness prediction:** a linear-regression trend over quiz scores predicts the next score. It also sets the tutor's level (Foundation, Standard or Advanced).
- **Teacher lesson packs:** teachers write a lesson and quiz in the app and share it by Xender, Bluetooth or WhatsApp. Students import it with zero data.
- **Privacy:** no accounts, no tracking; scores and questions never leave the phone.

## What is innovative

- **Offline AI that still works on cheap phones.** Most offline-AI projects need either a strong device or special hardware. EduMesh picks the best option automatically, from in-browser AI down to Textbook Mode, so it works on any phone.
- **Zero-data distribution end to end:** one visit to install, phone-to-phone lesson packs, and no server needed to learn.
- **Accessibility as a first-class feature.** A blind student can start the app and learn without anyone's help.
- **On-device adaptation.** Language preference, voice-first behaviour, weak-topic tracking and score prediction all run on the phone, with no student data collected.

## Feasibility and proof

- **It is a working prototype, not a mock-up.** It includes 6 subjects (Mathematics, Physics, Chemistry, Biology, English, Economics), 58 exam-style questions, and an example Agricultural Science lesson pack.
- **38 automated tests** cover:
  - textbook search
  - prompt building
  - prediction
  - the learner profile
  - lesson packs
  - the teacher pack builder
  - hub server safety and streaming
- **Browser tests** cover install → cut the network → reload → ask (still answers), plus language adaptation, quizzes, prediction, pack import and Voice Mode.
- **No paid services.** It runs on free static hosting (GitHub Pages or Vercel), and the hub is an existing laptop with free, open-source Ollama.
- **Size:** the app is about 0.2 MB. The optional Phone AI model is about 0.3–0.9 GB, downloaded once.

## Impact and sustainability

- **Students:** free forever, with no data costs.
- **Schools:** reuse a laptop they already have as the classroom hub.
- **Partners:** state education boards, NGOs and education funders can sponsor curriculum lesson packs, hub kits and teacher training.
- **Our ask:** a one-term pilot in [__] schools in [state]. We would measure weekly use and quiz-score improvement.

## Honest limitations

- Small offline models are weaker than ChatGPT at hard, multi-step reasoning. Textbook grounding narrows the gap.
- The first download needs internet once, ideally Wi-Fi.
- Phone AI needs a reasonably modern phone (roughly 4 GB+ RAM with WebGPU). Weaker phones use the Classroom Hub or Textbook Mode.
- Read-aloud works offline, but voice *input* in some browsers (e.g. Chrome) still needs data. Typing always works.
- The Yoruba, Hausa and Igbo modes mix the language into English. Fluent speakers still need to review them.
- The built-in curriculum is a demonstration set. A real rollout would load full approved textbooks.

## Technology

- **Front end:** vanilla JavaScript PWA with a service worker, with no framework and no build step.
- **Phone AI:** WebLLM running Llama 3.2 1B Instruct or Qwen2.5 0.5B Instruct, 4-bit, in a Web Worker.
- **Classroom Hub:** a Node.js server with zero dependencies that relays to Ollama.
- **Retrieval:** BM25 keyword search over Markdown curriculum files, all on the device.
- **Speech:** the Web Speech API for read-aloud and voice input.
- **Prediction:** least-squares linear regression on the phone.
- **Tests:** `node:test`, plus Playwright browser checks.
