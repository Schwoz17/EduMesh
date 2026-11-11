// Second topic pack: algebra, linked to fractions (equations with fractions need equivalent fractions).
(function (root) {
  const skills = [
    { id: 'ints', lvl: 0, name: 'Positive and negative numbers', pre: [] },
    { id: 'like', lvl: 1, name: 'Collecting like terms', pre: ['ints'] },
    { id: 'solve1', lvl: 1, name: 'One-step equations', pre: ['ints', 'div'] },
    { id: 'solve2', lvl: 2, name: 'Two-step equations', pre: ['solve1', 'like'] },
    { id: 'leqf', lvl: 4, name: 'Equations with fractions', pre: ['solve1', 'addu'] },
  ];
  const misconceptions = {
    neg_sign: ['Drops the minus sign', 'Watch the minus sign: 4 − 7 goes below zero.'],
    like_add: ['Adds unlike terms', 'Only add terms with the same letter: 3x and 2 are different kinds.'],
    wrong_inverse: ['Undoes with the wrong operation', 'Undo with the opposite: + with −, × with ÷.'],
    one_step: ['Stops after one step', 'Two steps: undo the plus or minus first, then the times.'],
  };
  const Q = (id, s, q, ...o) => ({ id, s, q, o });
  const bank = [
    Q('ints1', 'ints', '−3 + 5 = ?', ['2', 1], ['−2', 0, 'neg_sign'], ['8', 0], ['−8', 0]),
    Q('ints2', 'ints', '4 − 7 = ?', ['−3', 1], ['3', 0, 'neg_sign'], ['11', 0], ['−11', 0]),
    Q('ints3', 'ints', '−2 − 6 = ?', ['−8', 1], ['4', 0, 'neg_sign'], ['8', 0], ['−4', 0]),
    Q('like1', 'like', '3x + 2x = ?', ['5x', 1], ['5x²', 0, 'like_add'], ['6x', 0], ['5', 0]),
    Q('like2', 'like', '4a + 3b − a = ?', ['3a + 3b', 1], ['6ab', 0, 'like_add'], ['7ab', 0, 'like_add'], ['4a + 2b', 0]),
    Q('like3', 'like', '5y + 2 + 3y = ?', ['8y + 2', 1], ['10y', 0, 'like_add'], ['8y²', 0], ['5y + 5', 0]),
    Q('solve11', 'solve1', 'x + 5 = 12. x = ?', ['7', 1], ['17', 0, 'wrong_inverse'], ['−7', 0], ['60', 0]),
    Q('solve12', 'solve1', '3x = 18. x = ?', ['6', 1], ['54', 0, 'wrong_inverse'], ['15', 0], ['21', 0]),
    Q('solve13', 'solve1', 'x − 4 = 9. x = ?', ['13', 1], ['5', 0, 'wrong_inverse'], ['−5', 0], ['36', 0]),
    Q('solve21', 'solve2', '2x + 3 = 11. x = ?', ['4', 1], ['8', 0, 'one_step'], ['7', 0, 'wrong_inverse'], ['5', 0]),
    Q('solve22', 'solve2', '3x − 5 = 10. x = ?', ['5', 1], ['15', 0, 'one_step'], ['5/3', 0, 'wrong_inverse'], ['−5', 0]),
    Q('solve23', 'solve2', '5x + 2 = 17. x = ?', ['3', 1], ['15', 0, 'one_step'], ['19/5', 0, 'wrong_inverse'], ['4', 0]),
    Q('leqf1', 'leqf', 'x + 1/2 = 3/4. x = ?', ['1/4', 1], ['5/4', 0, 'wrong_inverse'], ['2/6', 0, 'add_across'], ['3/8', 0]),
    Q('leqf2', 'leqf', 'x + 1/3 = 5/6. x = ?', ['1/2', 1], ['7/6', 0, 'wrong_inverse'], ['4/3', 0, 'add_across'], ['2/3', 0]),
    Q('leqf3', 'leqf', 'x − 1/4 = 1/2. x = ?', ['3/4', 1], ['1/4', 0, 'wrong_inverse'], ['2/6', 0, 'add_across'], ['1/8', 0]),
  ];
  const pack = { skills, misconceptions, bank };
  if (typeof module !== 'undefined' && module.exports) module.exports = pack; else root.RootPathAlgebra = pack;
})(typeof self !== 'undefined' ? self : this);
