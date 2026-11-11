// RootPath content pack: skill graph, misconceptions, question bank (fractions, Primary 3 -> JSS1)
(function (root) {
  const skills = [
    { id: 'mult', lvl: 0, name: 'Multiplication facts', pre: [] },
    { id: 'div', lvl: 0, name: 'Division and sharing', pre: [] },
    { id: 'frac', lvl: 1, name: 'What a fraction means', pre: ['div'] },
    { id: 'equiv', lvl: 2, name: 'Equivalent fractions', pre: ['mult', 'frac'] },
    { id: 'simp', lvl: 2, name: 'Simplifying fractions', pre: ['equiv'] },
    { id: 'lcm', lvl: 2, name: 'Common multiples (LCM)', pre: ['mult'] },
    { id: 'addl', lvl: 2, name: 'Adding fractions (same bottom)', pre: ['frac'] },
    { id: 'addu', lvl: 3, name: 'Adding fractions (different bottoms)', pre: ['equiv', 'lcm', 'addl'] },
    { id: 'multf', lvl: 3, name: 'Multiplying fractions', pre: ['simp'] },
    { id: 'fofq', lvl: 4, name: 'Fraction of a quantity', pre: ['frac'] },
    { id: 'word', lvl: 4, name: 'Fraction word problems', pre: ['addu', 'fofq'] },
  ];
  // id: [name, one-line fix shown to the learner]
  const misconceptions = {
    add_mult: ['Adds instead of multiplying', '6 × 7 means 6 groups of 7, not 6 + 7.'],
    wrong_op: ['Uses the wrong operation when sharing', 'Sharing equally means divide.'],
    flip: ['Writes the fraction upside down', 'Parts you take go on top; total parts go on the bottom.'],
    part_part: ['Compares the part to the rest, not the whole', 'The bottom number counts ALL the parts.'],
    big_den: ['Thinks a bigger bottom means a bigger fraction', 'More pieces means smaller pieces: 1/5 is less than 1/2.'],
    add_equiv: ['Adds the same number to top and bottom', "Multiply, don't add: 1/2 = 4/8 because both were ×4."],
    sub_simp: ['Subtracts instead of dividing when simplifying', 'Divide top and bottom by the same number.'],
    part_simp: ['Stops simplifying too early', 'Keep dividing until no number divides both.'],
    hcf_lcm: ['Mixes up LCM and HCF', 'The LCM is a multiple, so it is at least as big as both numbers.'],
    add_lcm: ['Adds the numbers instead of finding a common multiple', 'List each times table; find the first number in both.'],
    prod_lcm: ['Uses the product, not the smallest common multiple', "The product works but isn't always the smallest."],
    add_across: ['Adds the tops and adds the bottoms', 'The bottom names the size of the pieces: never add it.'],
    ignore_den: ['Ignores the different bottom numbers', 'Make the bottoms the same before adding.'],
    cross: ['Cross-multiplies when multiplying fractions', 'Top × top, bottom × bottom.'],
    mult_add: ['Adds when multiplying fractions', 'For ×, multiply straight across.'],
    forget_num: ['Divides by the bottom but forgets the top', 'Two steps: ÷ bottom, then × top.'],
    mult_den: ['Multiplies by the bottom instead of dividing', 'A fraction of something is smaller: divide by the bottom.'],
    partial: ['Answers only part of the question', 'Did you use every part the question gave you?'],
    used_left: ['Mixes up what was used and what is left', 'Underline the last words of the question: used, or left?'],
    wrong_op_frac: ['Multiplies when the story needs adding', "'Morning AND afternoon' means put together: add."],
  };
  // o: [text, isCorrect, misconceptionId?]
  const Q = (id, s, q, ...o) => ({ id, s, q, o });
  const bank = [
    Q('mult1', 'mult', '6 × 7 = ?', ['42', 1], ['13', 0, 'add_mult'], ['36', 0], ['48', 0]),
    Q('mult2', 'mult', '8 × 4 = ?', ['32', 1], ['12', 0, 'add_mult'], ['24', 0], ['36', 0]),
    Q('mult3', 'mult', '9 × 5 = ?', ['45', 1], ['14', 0, 'add_mult'], ['54', 0], ['40', 0]),
    Q('div1', 'div', '12 sweets are shared equally among 3 children. Each gets?', ['4', 1], ['36', 0, 'wrong_op'], ['9', 0], ['15', 0, 'wrong_op']),
    Q('div2', 'div', '20 ÷ 4 = ?', ['5', 1], ['80', 0, 'wrong_op'], ['16', 0], ['24', 0]),
    Q('div3', 'div', '18 yams go equally into 6 bags. Yams per bag?', ['3', 1], ['108', 0, 'wrong_op'], ['12', 0], ['24', 0]),
    Q('frac1', 'frac', '3 of 4 equal parts are shaded. Which fraction?', ['3/4', 1], ['4/3', 0, 'flip'], ['3/7', 0, 'part_part'], ['1/4', 0]),
    Q('frac2', 'frac', 'A puff-puff is cut into 8 equal pieces. You eat 5. Fraction eaten?', ['5/8', 1], ['8/5', 0, 'flip'], ['5/3', 0, 'part_part'], ['3/8', 0]),
    Q('frac3', 'frac', 'Which is bigger: 1/2 or 1/5?', ['1/2', 1], ['1/5', 0, 'big_den'], ['They are equal', 0], ['Cannot tell', 0]),
    Q('equiv1', 'equiv', '1/2 = ?/8', ['4', 1], ['7', 0, 'add_equiv'], ['6', 0], ['2', 0]),
    Q('equiv2', 'equiv', '2/3 = ?/12', ['8', 1], ['11', 0, 'add_equiv'], ['6', 0], ['9', 0]),
    Q('equiv3', 'equiv', '3/5 = 9/?', ['15', 1], ['11', 0, 'add_equiv'], ['14', 0], ['12', 0]),
    Q('simp1', 'simp', 'Simplify 6/8', ['3/4', 1], ['4/6', 0, 'sub_simp'], ['3/8', 0], ['6/4', 0]),
    Q('simp2', 'simp', 'Simplify 12/18', ['2/3', 1], ['6/9', 0, 'part_simp'], ['6/12', 0, 'sub_simp'], ['9/12', 0]),
    Q('simp3', 'simp', 'Simplify 20/30', ['2/3', 1], ['10/15', 0, 'part_simp'], ['10/20', 0, 'sub_simp'], ['20/3', 0]),
    Q('lcm1', 'lcm', 'LCM of 4 and 6', ['12', 1], ['10', 0, 'add_lcm'], ['24', 0, 'prod_lcm'], ['2', 0, 'hcf_lcm']),
    Q('lcm2', 'lcm', 'LCM of 3 and 5', ['15', 1], ['8', 0, 'add_lcm'], ['1', 0, 'hcf_lcm'], ['30', 0]),
    Q('lcm3', 'lcm', 'LCM of 6 and 8', ['24', 1], ['14', 0, 'add_lcm'], ['48', 0, 'prod_lcm'], ['2', 0, 'hcf_lcm']),
    Q('addl1', 'addl', '2/7 + 3/7 = ?', ['5/7', 1], ['5/14', 0, 'add_across'], ['6/7', 0], ['1/7', 0]),
    Q('addl2', 'addl', '1/5 + 2/5 = ?', ['3/5', 1], ['3/10', 0, 'add_across'], ['2/5', 0], ['1/5', 0]),
    Q('addl3', 'addl', '3/8 + 4/8 = ?', ['7/8', 1], ['7/16', 0, 'add_across'], ['12/8', 0], ['1/8', 0]),
    Q('addu1', 'addu', '1/2 + 1/3 = ?', ['5/6', 1], ['2/5', 0, 'add_across'], ['2/3', 0, 'ignore_den'], ['1/6', 0, 'mult_add']),
    Q('addu2', 'addu', '1/4 + 1/2 = ?', ['3/4', 1], ['2/6', 0, 'add_across'], ['2/4', 0, 'ignore_den'], ['1/8', 0, 'mult_add']),
    Q('addu3', 'addu', '1/3 + 1/6 = ?', ['1/2', 1], ['2/9', 0, 'add_across'], ['2/6', 0, 'ignore_den'], ['1/18', 0, 'mult_add']),
    Q('multf1', 'multf', '1/2 × 1/3 = ?', ['1/6', 1], ['5/6', 0, 'mult_add'], ['3/2', 0, 'cross'], ['2/6', 0]),
    Q('multf2', 'multf', '2/3 × 3/4 = ?', ['1/2', 1], ['17/12', 0, 'mult_add'], ['8/9', 0, 'cross'], ['5/7', 0]),
    Q('multf3', 'multf', '1/4 × 2/5 = ?', ['1/10', 1], ['13/20', 0, 'mult_add'], ['5/8', 0, 'cross'], ['3/9', 0]),
    Q('fofq1', 'fofq', '1/4 of 20 mangoes = ?', ['5', 1], ['80', 0, 'mult_den'], ['4', 0], ['24', 0]),
    Q('fofq2', 'fofq', '3/4 of 20 naira notes = ?', ['15', 1], ['5', 0, 'forget_num'], ['80', 0, 'mult_den'], ['17', 0]),
    Q('fofq3', 'fofq', '2/5 of 30 tomatoes = ?', ['12', 1], ['6', 0, 'forget_num'], ['150', 0, 'mult_den'], ['32', 0]),
    Q('word1', 'word', 'Ada ate 1/2 a loaf in the morning and 1/4 in the afternoon. How much in all?', ['3/4', 1], ['1/8', 0, 'wrong_op_frac'], ['2/6', 0, 'add_across'], ['1/4', 0, 'partial']),
    Q('word2', 'word', 'Ada had 1 loaf. She ate 1/2 and then 1/4. How much is LEFT?', ['1/4', 1], ['3/4', 0, 'used_left'], ['1/8', 0, 'wrong_op_frac'], ['1/2', 0, 'partial']),
    Q('word3', 'word', 'Ada ate 1/3 of a cake and Bola ate 1/6. Together?', ['1/2', 1], ['1/18', 0, 'wrong_op_frac'], ['2/9', 0, 'add_across'], ['1/6', 0, 'partial']),
  ];
  const pack = { skills, misconceptions, bank };
  if (typeof module !== 'undefined' && module.exports) module.exports = pack;
  else root.RootPathContent = pack;
})(typeof self !== 'undefined' ? self : this);
