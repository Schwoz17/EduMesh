# Finale plan: 10 minutes, Team Neptune

**Rule:** 10 minutes in total, including the judges' questions, with one presenter.
**Plan:** talk and demo for about **5½ minutes**, then leave **4½ minutes for questions**. Judges score the Q&A heavily, so don't run over.

---

## Before 2:50 PM (setup checklist)

1. **Two Chrome tabs:**
   - **Tab 1:** the deck. Open `RootPath_Deck.pptx` in PowerPoint or Google Slides.
   - **Tab 2:** https://rootpath-eta.vercel.app/#reset (clears earlier demo data).
2. **Sound for the judges.** This is the most important step. If you share the wrong way, the judges see the call but never hear the Nigerian voices.
   - **Windows:** in Meet, choose Present → **Entire screen** and tick **"Also share system audio"**.
   - **Mac:** Present → **A tab**, pick the demo tab and tick **"Also share tab audio"**. Show the slides from that same tab: open the deck in Google Slides in it, or switch the shared tab with "Share this tab instead".
3. Zoom the demo to **90%**, so the phone and the skill map both fit on screen.
4. Run one full practice call before 2:50, then reload with `#reset`.
5. **Backup:** keep a 1-minute screen recording of the demo ready to play if the internet fails. The site also works offline once it's loaded.
6. Charge your laptop, close other tabs, and turn off notifications.

---

## The 5½-minute run

| Time | Slide or screen | What you say (short version) |
|---|---|---|
| 0:00–0:20 | 1 · Cover | "A child dials a free number from **any phone**, even with no data. An AI tutor finds the real reason they're stuck and keeps teaching them all week." |
| 0:20–0:45 | 2 · Problem | Tunde can't solve x + ½ = ¾. His real gap is **equivalent fractions, from Primary 5**. Most help needs data, a smartphone or a free teacher. |
| 0:45–1:05 | 3 · What works | Trials (J-PAL / Youth Impact) found that **a phone call plus SMS, at the child's level, gives large gains for about $12 a child**, while SMS alone does little. "RootPath is that tutor, automated." |
| 1:05–3:05 | **Live demo** | See the steps below. |
| 3:05–3:35 | 5 · The AI | "That map is the AI: each answer updates a mastery probability (Bayesian Knowledge Tracing), and the search walks down to the root. Every step is explainable. There's no free chat near children." |
| 3:35–3:55 | 6 · Teacher | The class is grouped by root gap, and the teacher gets a weekly SMS summary on any phone. |
| 3:55–4:25 | 7–8 · Any phone, built | Voice, SMS, USSD and an offline app. Real Nigerian voices (YarnGPT). 60 tests. The phone-line adapter is built; going live needs a number. |
| 4:25–4:55 | 9 · Business | Children never pay. State boards, NGOs, telcos and private schools pay. No app and no tutor salaries. |
| 4:55–5:30 | 10–11 · Roadmap, close | "Next: a one-term pilot with a live number. A child shouldn't need data or a smartphone to get a tutor. With RootPath, any phone is enough. Thank you." |

### Live demo (2 minutes)
1. **Call (75 s).** Tap 📞, then press **2** (Pidgin), **1** (Maths), **5** (fraction equations).
   - Answer **wrong** on anything with fractions, including equivalent fractions.
   - Answer **right** on times tables, sharing and negative numbers.
   - Point at the map as it goes down. It ends on **ROOT GAP: Equivalent fractions**.
   - You don't need to let every sentence finish. Pressing the next key moves on.
2. **SMS (15 s).** Tap "Tue–Fri · Daily practice SMS", then tap a reply.
3. **Call-back (15 s).** Tap "Saturday · RootPath calls back", answer one or two questions, and show "your level went from … to …".
4. **Report (15 s).** Tap "Sunday · Report". Show the parent's SMS, then Tunde in the class group.

If anything goes wrong, say *"the captions show it all"* and keep going. Press **\*** to repeat a question; reload with `#reset` to start over.

---

## Likely judge questions: short, honest answers

**"Is this really AI, or just rules?"**
It's a probabilistic model. Bayesian Knowledge Tracing is a standard machine-learning model from education research: it updates the chance that a child knows each skill after every answer, allowing for lucky guesses and slips. Adaptive search then picks the most informative next question. YarnGPT, a neural text-to-speech model, gives the Nigerian voices. We chose explainable AI over a chatbot on purpose: a chatbot can make things up, needs data and costs money per call, and these are children.

**"How accurate is the diagnosis?"**
On simulated learners with a known gap, the engine finds the exact root every time; that's in the tests. We don't have results from real children yet. That's the pilot: we compare RootPath's diagnosis with the teacher's judgement and measure mastery before and after. The tool for that (`tools/report.js`) is already built.

**"Where do your model parameters come from?"**
They're standard starting values from the literature. Guess is 0.25 because there are four options. In the pilot we'll fit them from real answers.

**"What if a child just presses random keys?"**
The model expects some guessing and slips, so one lucky answer doesn't decide anything. It asks up to three questions per skill before deciding. Invalid keys get "Sorry, I didn't get that", and \* repeats the question.

**"How much does a call cost? Who pays?"**
The cost is network minutes plus a few SMS a week; there's no app, no data and no tutor salary. Human phone tutors cost about $12 per child in the trials, and we remove the tutor's time. Partners pay: state boards, NGOs, telcos (who may zero-rate the line), and private schools. Exact prices will come from the pilot.

**"Can it handle thousands of calls?"**
Africa's Talking handles the phone network. Our server only answers each key press with a little text (voice XML), so the load per call is tiny. Today one server keeps up to 5,000 calls in memory. To scale, we move call state into a shared store and run several servers.

**"Is the real phone line working?"**
The adapter is built and tested; it produces the exact voice XML Africa's Talking expects. It isn't connected to a live number yet. That needs an account and a voice number, and it's the first pilot step.

**"Do the local languages really work?"**
English and Pidgin are complete in the voice call, with real recorded voices. Yoruba, Igbo and Hausa greet the caller, then continue in English. The text drafts exist but need native-speaker review before children hear them. YarnGPT already supports those three languages.

**"Why not WhatsApp?"**
Many of the children who most need help have no smartphone or data. A voice call reaches every phone. The core engine is shared, so WhatsApp can be added as one more channel later.

**"Whose phone does the child use? What about safety and privacy?"**
Usually a parent's phone after school; the parent also gets the reports. We store very little: no accounts, just progress per phone number. There's no free chat, and only reviewed content is played. We'd follow Nigeria's Data Protection Act, with parental consent at sign-up.

**"How are you different from uLesson, Rori or Bakame?"**
uLesson needs data and a smartphone, and Rori needs WhatsApp. Bakame is a voice tutor in Rwanda. RootPath finds the **root gap across grade levels**, follows up every day by SMS, groups the class for the teacher, and speaks Nigerian English and Pidgin.

**"Why voice and keypad instead of speech recognition?"**
Keypad tones work on every phone and never mishear an accent. Speech answers can come later.

**"What would you do with the prize?"**
Get a live toll-free number and airtime, pay native speakers to review Yoruba, Igbo and Hausa, and run a one-term pilot in 5–10 classes.

**"How will you prove impact?"**
We'll measure each child's mastery before and after, check RootPath against teachers' judgement, and compare classes that use it with similar classes that don't.

### If you don't know an answer
Say: *"We haven't tested that yet. It's part of the pilot, and here's how we'd measure it…"* Judges trust honest limits more than big claims.
