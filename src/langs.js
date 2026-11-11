// Yoruba, Igbo, Hausa packs. STATUS: DRAFT. Machine-drafted, not yet reviewed by native speakers/teachers.
// Missing strings fall back to English (see coverage() in pack.js). All strings are NFC-normalised on load.
(function (root) {
  const ids = 'mult div frac equiv simp lcm addl addu multf fofq word ints like solve1 solve2 leqf'.split(' ');
  const zip = (a) => Object.fromEntries(ids.map((k, i) => [k, a[i]]));
  const raw = {
    yo: {
      label: 'Yorùbá',
      ui: { sub: 'Wá ìdí gidi tí ìṣirò fi le, lẹ́yìn náà tẹ̀lé ọ̀nà láti tún un ṣe. Ó ń ṣiṣẹ́ láì ní íńtánẹ́ẹ̀tì.', name: 'Orúkọ rẹ àkọ́kọ́', topic: 'Kí ni ó ṣòro fún ọ?', start: 'Bẹ̀rẹ̀ àyẹ̀wò', nq: 'Kò tọ̀nà', next: 'Tẹ̀síwájú', gap: 'Ibi tí àlàfo ti bẹ̀rẹ̀', nogap: 'Kò sí àlàfo. O mọ ẹ̀kọ́ yìí!', path: 'Ọ̀nà rẹ', go: 'Bẹ̀rẹ̀ ọ̀nà mi', lesson: 'Kọ́', practice: 'Ṣe ìdánrawò', again: 'Ṣe àyẹ̀wò ẹ̀kọ́ mìíràn', res: 'èsì rẹ' },
      name: zip(['Tábìlì ìsodipúpọ̀', 'Pínpín dọ́gba', 'Ìtumọ̀ ìpín', 'Àwọn ìpín tó dọ́gba', 'Dín ìpín kù', 'Ọ̀pọ̀ ìsodipúpọ̀ tó wọ́pọ̀ (LCM)', 'Àfikún ìpín tí ìsàlẹ̀ jọra', 'Àfikún ìpín tí ìsàlẹ̀ yàtọ̀', 'Ìsodipúpọ̀ ìpín', 'Apá kan nínú nǹkan', 'Ìbéèrè ìtàn lórí ìpín', 'Nọ́ńbà dídára àti àìdára', 'Àkójọ òǹkà tó jọra', 'Wá x (ìgbésẹ̀ kan)', 'Wá x (ìgbésẹ̀ méjì)', 'Wá x nínú ìdọ́gba ìpín']),
      lesson: {
        mult: '6 × 7 túmọ̀ sí ẹgbẹ́ 6 ti 7 kọ̀ọ̀kan: 7, 14, 21, 28, 35, 42.', div: 'Pínpín dọ́gba ni pípín. Súìtì 12 fún ọmọdé 3: 12 ÷ 3 = 4 ọ̀kọ̀ọ̀kan.',
        frac: 'Ìsàlẹ̀ ń ka gbogbo apá tó dọ́gba; òkè ń ka apá tí o mú. Jẹ ègé àkàrà 3 nínú 8: 3/8.', equiv: 'Sọ òkè àti ìsàlẹ̀ di púpọ̀ pẹ̀lú nọ́ńbà kan náà. 1/2 × 4/4 = 4/8, nítorí náà 1/2 = 4/8. Má ṣe fi kún un.',
        addu: 'Kọ́kọ́ ṣe kí ìsàlẹ̀ dọ́gba. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.', leqf: 'Òfin kan náà, pẹ̀lú ìpín. x + 1/2 = 3/4 → x = 3/4 − 2/4 = 1/4.' },
    },
    ig: {
      label: 'Igbo',
      ui: { sub: 'Chọpụta ihe kpatara mgbakọ ji sie gị ike, soro ụzọ idozi ya. Ọ na-arụ ọrụ na-enweghị ịntanetị.', name: 'Aha gị mbụ', topic: 'Isiokwu nke siri gị ike?', start: 'Malite nlele', nq: 'O ezighi ezi', next: "Gaa n'ihu", gap: 'Ebe oghere malitere', nogap: 'Enweghị oghere. Ị maara isiokwu a!', path: 'Ụzọ gị', go: 'Malite ụzọ m', lesson: 'Mụta', practice: 'Mee ọmụmụ', again: 'Lelee isiokwu ọzọ', res: 'nsonaazụ gị' },
      name: zip(['Tebụl ịmụba', "Kesaa n'ụzọ hà nhata", 'Ihe ebe pụtara', 'Ebe hà nhata', 'Belata ebe', 'Ọtụtụ ọnụọgụ yiri ya (LCM)', 'Gbakwunye ebe ala yiri ya', 'Gbakwunye ebe ala dị iche', 'Ịmụba ebe', 'Akụkụ nke ihe', 'Ajụjụ akụkọ banyere ebe', 'Ọnụọgụ dị mma na ọjọọ', 'Jikọta mkpụrụedemede yiri ya', 'Chọta x (nzọụkwụ otu)', 'Chọta x (nzọụkwụ abụọ)', 'Chọta x n’ebe']),
      lesson: {
        mult: '6 × 7 pụtara otu 6 nke 7 nke ọ bụla: 7, 14, 21, 28, 35, 42.', div: 'Ikesa n’ụzọ hà nhata bụ nkesa. Swiiti 12 maka ụmụaka 3: 12 ÷ 3 = 4 nke ọ bụla.',
        frac: 'Ala na-ele akụkụ niile hà nhata; elu na-ele akụkụ ị were. Rie akụkụ 3 n’ime 8 nke achịcha: 3/8.', equiv: 'Mụba elu na ala site n’otu ọnụọgụ ahụ. 1/2 × 4/4 = 4/8, ya mere 1/2 = 4/8. Agbakwunyela.',
        addu: 'Buru ụzọ mee ka ala hà nhata. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.', leqf: 'Iwu otu ahụ, mana na ebe. x + 1/2 = 3/4 → x = 3/4 − 2/4 = 1/4.' },
    },
    ha: {
      label: 'Hausa',
      ui: { sub: 'Gano ainihin dalilin da lissafi ke yi maka wahala, sannan ka bi hanya don gyarawa. Yana aiki ba tare da intanet ba.', name: 'Sunanka na farko', topic: 'Wane batu ne ya yi maka wahala?', start: 'Fara gwaji', nq: 'Ba daidai ba', next: 'Gaba', gap: 'Inda gibin ya fara', nogap: 'Babu gibi. Ka san wannan batun!', path: 'Hanyarka', go: 'Fara hanyata', lesson: 'Koyi', practice: 'Yi atisaye', again: 'Gwada wani batu', res: 'sakamakonka' },
      name: zip(['Tebur na ninkawa', 'Raba daidai-daida', 'Ma’anar juzu’i', 'Juzu’i masu daidaito', 'Rage juzu’i', 'Mafi ƙarancin ɗimbin lamba (LCM)', 'Haɗa juzu’i masu ƙasa ɗaya', 'Haɗa juzu’i masu ƙasa daban', 'Ninka juzu’i', 'Juzu’i na wani abu', 'Tambayoyin labari na juzu’i', 'Lambobi masu ƙari da ragi', 'Haɗa haruffa iri ɗaya', 'Nemo x (mataki ɗaya)', 'Nemo x (mataki biyu)', 'Nemo x a lissafin juzu’i']),
      lesson: {
        mult: '6 × 7 yana nufin rukuni 6 na 7 kowanne: 7, 14, 21, 28, 35, 42.', div: 'Raba daidai shi ne rarrabawa. Alawa 12 ga yara 3: 12 ÷ 3 = 4 kowanne.',
        frac: 'Ƙasa na ƙirga dukkan sassa daidai; sama na ƙirga sassan da ka ɗauka. Ka ci 3 daga cikin 8 na kosai: 3/8.', equiv: 'Ninka sama da ƙasa da lamba ɗaya. 1/2 × 4/4 = 4/8, don haka 1/2 = 4/8. Kada ka haɗa.',
        addu: 'Da farko ka daidaita ƙasa. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.', leqf: 'Doka ɗaya, amma da juzu’i. x + 1/2 = 3/4 → x = 3/4 − 2/4 = 1/4.' },
    },
  };
  const nfc = (v) => (typeof v === 'string' ? v.normalize('NFC') : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nfc(x)])));
  const langs = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, { ...nfc(v), status: 'draft' }]));
  if (typeof module !== 'undefined' && module.exports) module.exports = langs; else root.RootPathLangs = langs;
})(typeof self !== 'undefined' ? self : this);
