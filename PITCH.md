# RootPath: pitch script and demo flow

The deck is in `pitch/RootPath_Deck.pptx` (11 slides; speaker notes on every slide).
The live demo is at **https://edumesh-eta.vercel.app/**.

---

## Pitch script (about 3½ minutes)

Speak calmly, about 140 words a minute. **[Brackets]** are stage directions.

**[Slide 1 · Cover] (15 s)**
Good day, judges. I'm Muiz, and this is **RootPath**. A child dials a free number from **any phone**, even a basic one with no data. An AI tutor talks with them in their own language, finds the real reason they're stuck, and keeps teaching them all week by SMS.

**[Slide 2 · The problem] (25 s)**
Meet Tunde. He's in JSS1 and he can't solve *x + ½ = ¾*. Re-teaching equations won't help, because his real gap is **equivalent fractions, from Primary 5**. Teachers rarely spot that, and Tunde can't name it. And most help needs what Tunde doesn't have: data, a smartphone, or a teacher with time for one child.

**[Slide 3 · What works] (25 s)**
We didn't guess the format. Randomised trials by J-PAL and Youth Impact in six countries found that **a short phone call plus SMS, teaching each child at their level**, produced large learning gains for about twelve dollars a child. SMS alone did little. Those trials used human tutors. **RootPath is that tutor, automated.**

**[Slide 4 · One child, one week] (25 s)**
- **Monday:** Tunde dials the free number, and the tutor talks with him in Pidgin.
- **Tuesday to Friday:** one practice SMS a day on his gap. He replies A to D.
- **Saturday:** RootPath calls *him* back for a short check.
- **Sunday:** his parent and teacher get his progress by SMS.

No data, no smartphone, no app.

**[Live demo] (60 s)** *(switch to the browser; follow the demo flow below)*

**[Slide 5 · The AI] (20 s)**
That map is the AI. Every key press updates a mastery probability for that skill; this is called Bayesian Knowledge Tracing. Weak skills send the search down the skill map until it finds the root. For Tunde, that took **12 questions**. Teachers can see every step. Generative AI is only used before release, to draft local-language lessons that humans approve. There's no free chat near children.

**[Slide 6 · Teacher view] (15 s)**
Every call places the child on the class map, grouped by **root gap**, not by age. One tap sends each group its practice SMS. That's "teaching at the right level", the same method the trials used. *(The demo class is simulated by the real engine; Tunde's call is real.)*

**[Slide 7 · Any phone] (10 s)**
It works by voice call, SMS, USSD, or an offline app, in English and Pidgin, with Yoruba, Igbo and Hausa in native-speaker review.

**[Slide 8 · Built and tested] (10 s)**
It's real code with 56 tests. An Africa's Talking voice adapter already serves the same tutor to a real phone line; going live only needs a number.

**[Slide 9 · Field test] (10 s)** *(only if you have real numbers; otherwise skip this slide)*
We tested it with [N] learners. RootPath agreed with the teacher on [__]% of them, and mastery rose [__] points.

**[Slide 10 · Scale] (15 s)**
It's free for the child. Partners such as state education boards, NGOs and telcos sponsor the toll-free line and SMS. Next is a one-term pilot with a live number.

**[Slide 11 · Close] (10 s)**
A child shouldn't need data or a smartphone to get a tutor. With RootPath, any phone is enough. Scan the code and call the tutor yourself. Thank you.

---

## Demo flow (60 seconds, live or recorded)

**Setup:**
1. Open **https://edumesh-eta.vercel.app/#reset**. The `#reset` clears earlier demo data.
2. Use Chrome on a laptop, with the **sound on**.
3. Zoom the browser to 90% so the phone, the AI map and the story buttons fit on one screen.

**The demo:**
1. **Call (30 s).** Click **📞** on the phone ("0800 ROOTPATH").
   - Press **2** for Pidgin, **1** for Maths, **5** for "Find x for fraction equations".
   - **Answer wrong on fraction questions on purpose.** The tutor explains each mistake aloud ("No add, multiply…").
   - **Point at the skill map on the right.** It lights up as the AI searches downward: orange is a gap, green is mastered. It ends on **ROOT GAP: Equivalent fractions**.
   - Tunde's pattern: answer **wrong** on anything with fractions, and **right** on basic skills (times tables, sharing, negative numbers, one-step equations).
2. **SMS (10 s).** Click **"Tue–Fri · Daily practice SMS"**. The phone opens Messages with a question. Tap a reply (A–D) to get instant feedback. Click it once more for Day 2.
3. **Call-back (10 s).** Click **"Saturday · RootPath calls back"**. The phone rings; tap the green button and answer two or three questions. It ends with "your level went from … to … percent".
4. **Report and class (10 s).** Click **"Sunday · Report to parent & teacher"**. Show the parent SMS, then the class bars with **Tunde** tagged in "Equivalent fractions", and the group cards with "Send group SMS".
5. *(Optional)* Tap **USSD** on the phone to show the same engine on a basic phone. **Offline app** (top right) opens the installable app.

**If something goes wrong:**
- **No sound:** the captions show everything; keep going.
- **A key does nothing:** press **\*** to repeat the question.
- **Start again:** reload with `#reset`.

---

## How to test it yourself

1. **Laptop:** open https://edumesh-eta.vercel.app/ in Chrome, turn the sound on, and follow the demo flow above.
2. **Phone:** open the same link on Android.
   - The page shows one section at a time; use the tabs at the bottom (**Phone · AI view · Teacher**).
   - The story buttons are below the phone; scroll down.
3. **Offline:** open the link once, then turn on **airplane mode** and reload. It still works, voice included, because the voice comes from your phone's built-in voices.
4. **Voice answers:** tap **🎙** during a call and say "two". This often needs data in Chrome, so use the keypad offline.
5. **Code tests:** `npm test` (Node 18+) runs 56 tests.
6. **A real phone line** (optional, needs an Africa's Talking account and voice number):
   1. Run `PORT=8080 PUBLIC_URL=https://<your-host>/voice node tools/at-voice.js` on a public server.
   2. Set your Africa's Talking number's voice callback to that URL.
   3. Call the number.

## Judging map
- **Zero bandwidth:** works over a voice call, SMS and USSD on any phone, plus an offline app.
- **Personalised and adaptive:** Bayesian Knowledge Tracing plus root-cause search, with a daily SMS on the child's own gap.
- **Learning-gap identification:** the root gap and the path back up, shown live on the skill map.
- **Local language and Pidgin:** five languages; English and Pidgin voice prompts are complete, the others are in review.
- **AI in low-resource settings:** explainable on-device reasoning; generative AI drafts lessons only behind human review.
- **Scale:** a teacher class view, a real phone-line adapter, and a partner-sponsored model.
- **Evidence:** builds on randomised trials of phone tutoring; the field-test tool measures agreement with teachers.

## Honest limits
- The demo voice is the browser's. A live line uses the telephony provider's voice.
- Yoruba, Igbo and Hausa voice prompts are partial; all local-language text is in native-speaker review.
- The class in the teacher view is simulated until real calls come in.
- Fill in, or remove, the field-test slide before submitting.
