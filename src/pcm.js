// Nigerian Pidgin layer + mini-lessons. Pidgin text is a DRAFT: needs native-speaker review before release.
(function (root) {
  const name = { mult: 'Times table', div: 'How to share things equal equal', frac: 'Wetin fraction mean', equiv: 'Fractions wey be the same', simp: 'How to make fraction small', lcm: 'Number wey two numbers share (LCM)', addl: 'Add fractions wey get same bottom', addu: 'Add fractions wey bottom no be the same', multf: 'Multiply fractions', fofq: 'Part of one thing', word: 'Fraction story questions', ints: 'Positive and negative numbers', like: 'Join the same kind of letters', solve1: 'Find x (one step)', solve2: 'Find x (two steps)', leqf: 'Find x for fraction equations' };
  const fix = {
    add_mult: '6 × 7 mean 6 groups of 7, no be 6 + 7.', wrong_op: 'To share equal equal, na divide you go use.',
    flip: 'The part wey you take go on top; all the parts go under.', part_part: 'The bottom number dey count ALL the parts, even the ones wey you take.',
    big_den: 'Pieces wey plenty mean each piece small: 1/5 small pass 1/2.', add_equiv: 'No add, multiply: 1/2 na 4/8 because we multiply both by 4.',
    sub_simp: 'No subtract, divide top and bottom by the same number.', part_simp: 'Continue to divide until no number fit divide both again.',
    hcf_lcm: 'LCM na multiple, so e big reach or pass the two numbers.', add_lcm: 'No add am. Write the times table of each one, pick the first one wey dey both.',
    prod_lcm: 'To multiply the two go work, but e no too dey the smallest.', add_across: 'The bottom number na the size of the piece, you no go add am.',
    ignore_den: 'Make the bottom numbers the same before you add.', cross: 'Top times top, bottom times bottom.',
    mult_add: 'For multiply, multiply straight across. Add na another work.', forget_num: 'Two steps: divide by the bottom, then multiply by the top.',
    mult_den: 'Part of something small pass am: divide by the bottom.', partial: 'Check am: you don use everything wey the question give you?',
    used_left: 'Look the last words of the question: na wetin dem use or wetin remain?', wrong_op_frac: "'Morning AND afternoon' mean put am together: add.",
    neg_sign: 'Look the minus sign well: 4 − 7 go go under zero.', like_add: 'Na only the same kind of letter you fit add together.',
    wrong_inverse: 'Use the opposite to comot am: + with −, × with ÷.', one_step: 'E get two steps: comot the plus or minus first, then the times.',
  };
  const q = {
    frac1: '3 out of 4 equal parts dey shaded. Which fraction be that?', frac2: 'Dem cut puff-puff into 8 equal pieces. You chop 5. Which fraction you chop?',
    frac3: 'Which big pass: 1/2 or 1/5?', div1: 'Dem share 12 sweet equal equal for 3 pikin. Each pikin go get how many?',
    div3: 'Dem put 18 yam equal equal inside 6 bag. How many yam dey one bag?', fofq1: '1/4 of 20 mango = ?', fofq2: '3/4 of 20 naira note = ?', fofq3: '2/5 of 30 tomato = ?',
    word1: 'Ada chop 1/2 of bread for morning and 1/4 for afternoon. How much she chop for all?', word2: 'Ada get 1 bread. She chop 1/2 then 1/4. How much REMAIN?',
    word3: 'Ada chop 1/3 of cake and Bola chop 1/6. Together, how much?',
  };
  // [English, Pidgin]
  const lesson = {
    mult: ['6 × 7 means 6 groups of 7: 7, 14, 21, 28, 35, 42. Six bags of 7 oranges is 42 oranges.', '6 × 7 mean 6 groups of 7: 7, 14, 21, 28, 35, 42. Six bag wey get 7 orange each na 42 orange.'],
    div: ['Sharing equally is division. 12 sweets for 3 children: 12 ÷ 3 = 4 each.', 'To share equal equal na divide. 12 sweet for 3 pikin: 12 ÷ 3 = 4 each.'],
    frac: ['The bottom counts all the equal parts; the top counts the parts you take. Eat 3 of 8 puff-puff pieces: 3/8.', 'The bottom dey count all the equal parts; the top dey count wetin you take. You chop 3 from 8 puff-puff pieces: 3/8.'],
    equiv: ['Multiply top and bottom by the same number. 1/2 × 4/4 = 4/8, so 1/2 = 4/8. Never add.', 'Multiply top and bottom by the same number. 1/2 × 4/4 = 4/8, so 1/2 na 4/8. No add.'],
    simp: ['Divide top and bottom by the same number until you cannot. 12/18 ÷ 6 = 2/3.', 'Divide top and bottom by the same number till e no fit again. 12/18 ÷ 6 = 2/3.'],
    lcm: ['List each times table and find the first number in both. 4: 4, 8, 12. 6: 6, 12. LCM = 12.', 'Write each times table, find the first number wey dey both. 4: 4, 8, 12. 6: 6, 12. LCM na 12.'],
    addl: ['Same bottom: add the tops, keep the bottom. 2/7 + 3/7 = 5/7.', 'Same bottom: add the tops, keep the bottom. 2/7 + 3/7 = 5/7.'],
    addu: ['Make the bottoms equal first. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.', 'Make the bottoms the same first. 1/2 + 1/3 = 3/6 + 2/6 = 5/6.'],
    multf: ['Top × top, bottom × bottom, then simplify. 2/3 × 3/4 = 6/12 = 1/2.', 'Top times top, bottom times bottom, then make am small. 2/3 × 3/4 = 6/12 = 1/2.'],
    fofq: ['Divide by the bottom, then multiply by the top. 3/4 of 20: 20 ÷ 4 = 5, 5 × 3 = 15.', 'Divide by the bottom, then multiply by the top. 3/4 of 20: 20 ÷ 4 = 5, 5 × 3 = 15.'],
    word: ['Underline what is asked: total, used or left. Then choose add or subtract.', 'Underline wetin dem ask: total, wetin dem use or wetin remain. Then choose add or subtract.'],
    ints: ['On a number line, minus moves left. 4 − 7 = −3.', 'For number line, minus dey go left. 4 − 7 = −3.'],
    like: ['Add only terms with the same letter. 3x + 2x = 5x, but 3x + 2 stays.', 'Add only the terms wey get the same letter. 3x + 2x = 5x, but 3x + 2 no change.'],
    solve1: ['Undo with the opposite. x + 5 = 12 → x = 12 − 5 = 7.', 'Use the opposite to comot am. x + 5 = 12 → x = 12 − 5 = 7.'],
    solve2: ['Undo plus or minus first, then times. 2x + 3 = 11 → 2x = 8 → x = 4.', 'Comot plus or minus first, then times. 2x + 3 = 11 → 2x = 8 → x = 4.'],
    leqf: ['Same rule, with fractions. x + 1/2 = 3/4 → x = 3/4 − 2/4 = 1/4.', 'Same rule, but with fractions. x + 1/2 = 3/4 → x = 3/4 − 2/4 = 1/4.'],
  };
  const pcm = { name, fix, q, lesson };
  if (typeof module !== 'undefined' && module.exports) module.exports = pcm; else root.RootPathPcm = pcm;
})(typeof self !== 'undefined' ? self : this);
