// English grammar pack (Standard English; Pidgin contrast is a future extension).
(function (root) {
  const skills = [
    { id: 'noun', lvl: 0, name: 'Nouns and verbs', pre: [] },
    { id: 'subv', lvl: 1, name: 'Subject-verb agreement', pre: ['noun'] },
    { id: 'tense', lvl: 1, name: 'Simple past tense', pre: ['noun'] },
    { id: 'pron', lvl: 1, name: 'Pronouns (I and me)', pre: ['noun'] },
    { id: 'cond', lvl: 2, name: 'If-sentences', pre: ['subv', 'tense'] },
  ];
  const misconceptions = {
    verb_noun: ['Confuses nouns and verbs', 'A noun names a thing; a verb shows an action.'],
    plural_s: ['Wrong verb form for the subject', 'One person goes; many people go. The children are, my brother is.'],
    regular_ed: ['Adds -ed to irregular verbs', 'Some verbs change completely: go → went, buy → bought.'],
    pron_case: ['Uses the wrong pronoun form', 'Use I for the doer (Ada and I) and me after a verb or to (to Tunde and me).'],
    tense_mix: ['Mixes tenses in if-sentences', 'If + present → will (If it rains, we will stay). If + past → would.'],
  };
  const lessons = {
    noun: 'A noun names a person, place or thing (market). A verb shows action (run, sells).',
    subv: 'The verb must match the subject: one person goes, many people go; the children are, my brother is.',
    tense: 'Many past-tense verbs add -ed (played), but irregular ones change: go → went, buy → bought.',
    pron: 'Use I as the doer (Ada and I went) and me after a verb or "to" (to Tunde and me).',
    cond: 'If + present, then will: If it rains, we will stay. If + past, then would: If I had money, I would buy a car.',
  };
  const Q = (id, s, q, ...o) => ({ id, s, q, o });
  const bank = [
    Q('noun1', 'noun', 'Which word is a verb?', ['run', 1], ['bread', 0, 'verb_noun'], ['green', 0], ['Lagos', 0]),
    Q('noun2', 'noun', 'Which word is a noun?', ['market', 1], ['jump', 0, 'verb_noun'], ['quickly', 0], ['blue', 0]),
    Q('noun3', 'noun', 'In "Ada sells yams", the verb is:', ['sells', 1], ['Ada', 0, 'verb_noun'], ['yams', 0, 'verb_noun'], ['none', 0]),
    Q('subv1', 'subv', 'The children ___ playing football.', ['are', 1], ['is', 0, 'plural_s'], ['be', 0], ['am', 0]),
    Q('subv2', 'subv', 'My brother ___ to school every day.', ['goes', 1], ['go', 0, 'plural_s'], ['going', 0], ['gone', 0]),
    Q('subv3', 'subv', 'Chinedu and Bola ___ friends.', ['are', 1], ['is', 0, 'plural_s'], ['was', 0], ['am', 0]),
    Q('tense1', 'tense', 'Yesterday, I ___ to the market.', ['went', 1], ['goed', 0, 'regular_ed'], ['go', 0], ['going', 0]),
    Q('tense2', 'tense', 'Last week she ___ a new phone.', ['bought', 1], ['buyed', 0, 'regular_ed'], ['buy', 0], ['buys', 0]),
    Q('tense3', 'tense', 'They ___ football yesterday.', ['played', 1], ['plays', 0, 'tense_mix'], ['play', 0], ['playing', 0]),
    Q('pron1', 'pron', 'Ada and ___ went to church.', ['I', 1], ['me', 0, 'pron_case'], ['my', 0], ['mine', 0]),
    Q('pron2', 'pron', 'The teacher gave a book to Tunde and ___.', ['me', 1], ['I', 0, 'pron_case'], ['my', 0], ['mine', 0]),
    Q('pron3', 'pron', '___ is my sister.', ['She', 1], ['Her', 0, 'pron_case'], ['Hers', 0], ['Herself', 0]),
    Q('cond1', 'cond', 'If it rains, we ___ at home.', ['will stay', 1], ['stayed', 0, 'tense_mix'], ['staying', 0], ['stays', 0]),
    Q('cond2', 'cond', 'If I ___ money, I would buy a car.', ['had', 1], ['have', 0, 'tense_mix'], ['has', 0], ['will have', 0, 'tense_mix']),
    Q('cond3', 'cond', 'If she ___ hard, she will pass.', ['studies', 1], ['study', 0, 'plural_s'], ['studied', 0, 'tense_mix'], ['will study', 0, 'tense_mix']),
  ];
  const pack = { skills, misconceptions, bank, lessons };
  if (typeof module !== 'undefined' && module.exports) module.exports = pack; else root.RootPathEnglish = pack;
})(typeof self !== 'undefined' ? self : this);
