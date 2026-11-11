# RootPath — call a tutor from any phone

**Live demo:** https://edumesh-eta.vercel.app/ (works offline after one visit)

A child dials a toll-free number from **any phone**, even a basic one with no data. An AI tutor talks with them in English, Pidgin, Yoruba, Igbo or Hausa. It asks a few questions answered by keypad or voice, and finds the **root** of the learning gap. For example, Tunde fails fraction equations in JSS1 because of equivalent fractions from Primary 5.

RootPath then keeps teaching on its own:
- one practice question **by SMS every day**;
- a **weekly check-in call**;
- an **SMS report** to the parent and teacher.

The teacher sees the whole class grouped by root gap, ready to *teach at the right level*.

Why this design: phone-call tutoring plus SMS, targeted to each child's level, produced large learning gains in randomised trials across six countries, where SMS alone did little ([J-PAL / Youth Impact](https://www.povertyactionlab.org/node/8131252)).

## What's in the demo (`index.html`)
- **Phone simulator:** call the tutor (it speaks; captions are always shown), answer with the keypad or by voice, receive SMS and reply A–D, accept RootPath's weekly call, and use the USSD menu.
- **Inside the AI, live:** the skill map lights up as RootPath searches: checking, mastered, gap, and the root gap. It also shows the mastery probabilities from Bayesian Knowledge Tracing.
- **Teacher view:** the class grouped by root gap. It includes 30 *simulated* learners diagnosed by the real engine (clearly labelled), plus real calls. Learners can be added from their SMS progress codes.
- **Offline app** (`app.html`): the same engine as an installable web app.

## Code
- `src/call.js`: the voice-call tutor as a pure state machine (diagnosis call and weekly check-in call; turns maths into speech, e.g. "1/2" → "1 over 2").
- `src/sms.js`: the result SMS, daily questions, reply marking and parent/teacher reports. All GSM-safe for basic phones.
- `src/classroom.js`: groups learners by root gap, rebuilds learners from SMS codes, and generates the simulated demo class.
- `src/engine.js`: Bayesian Knowledge Tracing, root-cause search and practice. `src/ussd.js`: the USSD channel.
- `src/content.js`, `algebra.js`, `physics.js`, `english.js`, `pcm.js`, `langs.js`: 26 skills, 78 questions and 33 misconceptions in five languages. Pidgin, Yoruba, Igbo and Hausa are drafts awaiting native-speaker review.
- `tools/at-voice.js`: **real phone calls.** It serves the same call engine to Africa's Talking Voice: answers with `<Say>` + `<GetDigits>` XML, one session per call. Run it with:

  ```bash
  PORT=8080 PUBLIC_URL=https://your-host/voice node tools/at-voice.js
  ```

  Then set your Africa's Talking voice number's callback URL to `PUBLIC_URL`.
- `tools/report.js` + `field-test/`: field-test evidence (engine vs teacher agreement, mastery gain).

`npm test` runs 56 tests (Node 18+, no dependencies).

## Honest limits
- The demo uses the browser's voice. A live line uses the telephony provider's text-to-speech, which needs an Africa's Talking account and number.
- Local-language prompts are drafts awaiting native-speaker review.
- The teacher view's class is simulated until real calls come in.
