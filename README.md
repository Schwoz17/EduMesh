# RootPath
Offline root-cause maths tutor. `npm test` (Node 18+, no dependencies) runs 47 tests. Open `index.html` to use the app.
- `src/content.js`, `src/algebra.js`, `src/physics.js`, `src/english.js`: three subjects, 26 skills, 78 questions, 33 misconceptions. Physics links to maths (speed needs division; speed with fractions needs fraction-of-a-quantity).
- `src/pcm.js`: Nigerian Pidgin strings and mini-lessons (draft, needs native review)
- `src/langs.js`: Yoruba, Igbo, Hausa: full UI, all 16 skill names, 6 core lessons each (draft). Everything else falls back to English; `coverage(lang)` reports the gap.
- `src/engine.js`: BKT, root-cause search, path builder, practice rounds, student simulator
- `src/ussd.js`: stateless USSD channel; `src/router.js`: review gate, answer routing, SMS code, field-test agreement
- `tools/generate_content.js`: AI drafting of Pidgin explanations (needs ANTHROPIC_API_KEY; outputs reviewed:false)
- `tools/report.js` + `field-test/`: evidence report from real-learner sessions
- `PITCH.md`: demo script and judging map
