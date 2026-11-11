# RootPath: pitch and demo script (3 minutes)

**Hook (20s).** "Tunde fails equations in JSS1. The real gap is equivalent fractions from Primary 5. Re-teaching equations never fixes it. RootPath finds it in 10 questions, with no internet."

**Demo (90s, phone in airplane mode).**
1. Pidgin, topic "Find x for fraction equations", answer wrong on purpose. Show the misconception fix after each mistake.
2. Results: root cause = Equivalent fractions, path = Equivalent > Add (different bottoms) > Equations with fractions. Show the SMS progress code.
3. Lesson, then practice: the root skill goes from about 3% to 90%.
4. Feature-phone tab: the same engine as a USSD session (no data, no smartphone).
5. Send the APK/HTML to a second phone by Xender or Bluetooth.

**Judging map.** Offline: whole app is ~100 KB with no dependencies. Learning-gap identification: skill graph + BKT, explainable, 32 tests. Local language: five languages (English, Pidgin, Yoruba, Igbo, Hausa), switchable on any screen; USSD is folded to plain GSM ASCII so tone marks and Hausa hooked letters do not break feature phones. USSD/SMS: stateless USSD session. AI in low-resource settings: AI drafts content at build time, humans review, only reviewed items reach children (`servable()`); runtime routing cache > on-device > cloud > queue. Scales: algebra, physics and English grammar were added as data packs with no engine change. Cross-subject demo: a physics speed problem with fractions traced back to a Primary 3 division gap.

**Evidence slide.** Run 5-10 learners, record the teacher's view of each child's gap (`teacherRoots`), then `npm run report -- results.json` prints agreement and mastery gain. Put those two numbers on the slide.

**Honest limits.** Pidgin, Yoruba, Igbo and Hausa text are drafts awaiting native-speaker review; only UI, skill names and core lessons are translated in the three new languages, the rest falls back to English and the app says so. On-device LM is not shipped. Content is a prototype slice: fractions, early algebra, 5 physics skills, 5 grammar skills.
