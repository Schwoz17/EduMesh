# RootPath — call a tutor from any phone

**Live demo:** https://rootpath-eta.vercel.app/ (works offline after one visit)

Wale Lab NextGen AI Hackathon 2026 · Track 1: AI for Zero-Bandwidth & Localised Learning

A child dials a toll-free number from **any phone**, even a basic one with no data. An AI tutor talks with them in **English or Nigerian Pidgin** (Yoruba, Igbo and Hausa are in progress). It asks a few questions, answered by keypad or voice, and finds the **root** of the learning gap. For example, Tunde fails fraction equations in JSS1 because of equivalent fractions from Primary 5.

RootPath then keeps teaching on its own:
- one practice question **by SMS every day**, answered by replying A–D;
- a **weekly check-in call**;
- an **SMS report** to the parent and teacher.

The teacher sees the whole class grouped by root gap, ready to *teach at the right level*.

**Why this design:** in randomised trials across six countries, phone-call tutoring plus SMS, targeted to each child's level, produced large learning gains, while SMS alone did little ([J-PAL / Youth Impact](https://www.povertyactionlab.org/node/8131252)). Those trials used human tutors; RootPath automates the tutor.

## Try it
1. Open https://rootpath-eta.vercel.app/#reset in Chrome with the sound on. `#reset` clears earlier demo data.
2. Follow the **"One child, one week"** buttons: Monday call → daily SMS → Saturday call-back → Sunday report.

`PITCH.md` has the full 60-second demo flow and testing steps.

## What's in the demo (`index.html`)
- **Phone simulator:** call the tutor (it speaks; captions are always shown), answer with the keypad or by voice, receive SMS and reply A–D, accept RootPath's weekly call, and use the USSD menu.
- **Inside the AI, live:** the skill map lights up as RootPath searches (checking, mastered, gap) until it marks the **root gap**. It also shows the mastery probabilities from Bayesian Knowledge Tracing.
- **Teacher view:**
  - the class grouped by root gap, with teaching groups;
  - the teacher's weekly SMS summary;
  - the parent's SMS report.

  It includes 30 *simulated* learners diagnosed by the real engine (clearly labelled), plus the calls made in the demo. Learners can also be added from their SMS progress codes.
- **Offline app** (`app.html`): the same engine as an installable web app, with a Teacher check for field tests.

## How children install the offline app (smartphones)
Children with a basic phone don't install anything: they dial the number. For children with a smartphone:
1. While online, open **https://rootpath-eta.vercel.app/app.html** once (school Wi-Fi, a friend's hotspot, or a café).
2. **Android (Chrome):** tap the **⋮** menu, then **Add to Home screen** (or **Install app**). **iPhone (Safari):** tap **Share**, then **Add to Home Screen**.
3. A **RootPath** icon appears on the home screen. It opens with no internet from then on; progress is saved on the phone.

It's about 300 KB, so it uses almost no data.

## How the teacher sees the class
- **Any phone:** a weekly SMS summary listing the biggest root-gap groups (`teacherSms` in `src/classroom.js`). The plan is that she replies with a number to send that group its practice SMS. The demo shows this message; acting on her reply needs a live SMS gateway.
- **Smartphone:** the same class view as the demo, opened from a link.

## Code
| File | What it does |
|---|---|
| `src/call.js` | The voice-call tutor as a pure state machine: the diagnosis call and the weekly check-in call. It turns maths into speech ("1/2" → "1 over 2") and splits speech into reusable pieces. |
| `src/sms.js` | The result SMS, daily questions, reply marking, and the parent/teacher report. All GSM-safe for basic phones. |
| `src/classroom.js` | Groups learners by root gap, rebuilds learners from SMS codes, writes the teacher's weekly SMS, and generates the simulated demo class. |
| `src/engine.js` | Bayesian Knowledge Tracing, root-cause search and practice rounds. |
| `src/voice.js` | Plays recorded YarnGPT clips, falling back to the device voice. |
| `src/ussd.js`, `src/router.js` | The USSD channel; the review gate, SMS progress codes and field-test agreement. |
| `src/content.js`, `algebra.js`, `physics.js`, `english.js`, `pcm.js`, `langs.js` | 26 skills, 78 questions and 33 misconceptions. English is reviewed; Pidgin, Yoruba, Igbo and Hausa text are drafts awaiting native-speaker review. |
| `tools/at-voice.js` | **Real phone calls:** serves the same tutor to an Africa's Talking voice number (see below). |
| `tools/voice-lines.js`, `voice/` | The Nigerian voice pipeline (see below). |
| `tools/report.js`, `field-test/` | Field-test evidence: engine vs teacher agreement, and mastery gain. |
| `pitch/RootPath_Deck.pptx`, `PITCH.md` | The pitch deck (11 slides with speaker notes), and the script, demo flow and testing guide. |

`npm test` runs **60 tests** (Node 18+, no dependencies).

## Nigerian voices (YarnGPT) and translations
RootPath speaks with recorded Nigerian voices from [YarnGPT](https://github.com/saheedniyi02/yarngpt). **The demo call is fully recorded:** all 196 clips in English and Pidgin (`voice/clips/`, 2 MB), plus Yoruba, Igbo and Hausa greetings. Each spoken piece is recorded once, ahead of time. The app plays the clip when it exists and falls back to the device's voice otherwise. Clips are saved for offline use, and the phone line plays them too.

1. **Fix the words first.** Native speakers correct `voice/review.csv` (every line of the demo call) and fill in Yoruba, Igbo and Hausa in `voice/translate.csv`. The corrections are then applied to the source text.
2. **List the lines:** run `node tools/voice-lines.js` for the demo call (196 pieces), or add `--full` for everything (897). This writes `voice/manifest*.json`.
3. **Record:** [![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Schwoz17/RootPath/blob/main/voice/YarnGPT_RootPath.ipynb)
   1. Choose **Runtime → Change runtime type → T4 GPU**.
   2. Choose **Run all**. It records every line in GitHub's `voice/manifest.json`, which takes about 20–30 minutes.
   3. It then downloads `rootpath-voice.zip`.
4. **Add the clips:** unzip into `voice/clips/` (mp3 files plus `index.json`) and deploy.
5. **Listen and flag:** open `/voice/listen.html` on the site, play each clip next to its text, and mark the bad ones (cut off, wrong words). Bad clips are dropped from `index.json`, so the device voice says them instead. Paste their ids into `REDO_IDS` in the notebook to re-record only those. The notebook also re-tries clips that come out suspiciously fast, which usually means they were cut short.

Voices: English `idera`, Pidgin `jude` (YarnGPT has no Pidgin voice, so a Nigerian-English voice reads the Pidgin text), Yoruba `yoruba_female2`, Igbo `igbo_female2`, Hausa `hausa_female1`. To change them, edit `src/voice.js` and `SPEAKER_OVERRIDE` in the notebook.

Licence: YarnGPT's Yoruba, Igbo and Hausa voices are non-commercial (CC-BY-NC-SA). They're fine for the hackathon; ask the author before a commercial launch.

## Real phone line (Africa's Talking)
1. Run the adapter on a public server:
   ```bash
   PORT=8080 PUBLIC_URL=https://your-host/voice CLIPS_URL=https://rootpath-eta.vercel.app/voice/clips/ node tools/at-voice.js
   ```
2. Set your Africa's Talking voice number's callback URL to `PUBLIC_URL`.
3. Call the number. Each call keypress gets back voice XML: `<Play>` for recorded clips, `<Say>` otherwise, inside `<GetDigits>`.

This is built and tested, but not yet connected to a live number.

## Honest limits
- Only the demo call (196 pieces) is recorded. Other topics fall back to the device voice until `manifest-full.json` is recorded.
- The voice call is complete in English and Pidgin. Yoruba, Igbo and Hausa only greet the caller, then continue in English, until `voice/translate.csv` is filled in.
- All non-English text awaits native-speaker review.
- The teacher view's class is simulated until real calls come in.
- A live phone line and SMS need an Africa's Talking account, a number and an SMS sender ID.
- Accuracy results so far come from simulated learners. A real field test (`tools/report.js`) is next.
