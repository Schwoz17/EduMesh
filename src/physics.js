// Physics pack. Linked to maths: speed needs division, speed with fractions needs "fraction of a quantity".
(function (root) {
  const skills = [
    { id: 'unit', lvl: 0, name: 'Units and measuring', pre: [] },
    { id: 'speed', lvl: 1, name: 'Speed, distance and time', pre: ['div', 'unit'] },
    { id: 'force', lvl: 1, name: 'Force (mass × acceleration)', pre: ['mult', 'unit'] },
    { id: 'work', lvl: 2, name: 'Work (force × distance)', pre: ['force'] },
    { id: 'spdf', lvl: 5, name: 'Speed with fractions of an hour', pre: ['speed', 'fofq'] },
  ];
  const misconceptions = {
    unit_mix: ['Mixes up units', 'Check the unit first: km and m are distance, s and h are time, kg is mass.'],
    flip_speed: ['Divides time by distance', 'Speed = distance ÷ time. Distance goes on top.'],
    add_not_mult: ['Adds instead of multiplying', 'Force = mass × acceleration and work = force × distance. Multiply, never add.'],
    frac_time: ['Multiplies by the fraction of an hour', 'Dividing by 1/2 asks how many halves fit: 6 ÷ 1/2 = 12.'],
  };
  const lessons = {
    unit: 'Check the unit first: km and m measure distance, s and h measure time, kg measures mass. 1 km = 1000 m; 1 hour = 60 minutes.',
    speed: 'Speed = distance ÷ time. 100 km in 2 hours: 100 ÷ 2 = 50 km/h.',
    force: 'Force = mass × acceleration. 4 kg at 3 m/s²: 4 × 3 = 12 N. Multiply, never add.',
    work: 'Work = force × distance. 10 N over 3 m: 10 × 3 = 30 J.',
    spdf: 'Dividing by a fraction asks how many fit. 6 km in 1/2 hour: 6 ÷ 1/2 = 12 km/h.',
  };
  const Q = (id, s, q, ...o) => ({ id, s, q, o });
  const bank = [
    Q('unit1', 'unit', 'Which unit measures distance?', ['km', 1], ['kg', 0, 'unit_mix'], ['s', 0], ['N', 0]),
    Q('unit2', 'unit', '1 km = ? m', ['1000', 1], ['100', 0, 'unit_mix'], ['10', 0], ['10000', 0]),
    Q('unit3', 'unit', '2 hours = ? minutes', ['120', 1], ['200', 0, 'unit_mix'], ['60', 0], ['20', 0]),
    Q('speed1', 'speed', 'A car goes 100 km in 2 hours. Speed?', ['50 km/h', 1], ['0.02 km/h', 0, 'flip_speed'], ['200 km/h', 0], ['102 km/h', 0]),
    Q('speed2', 'speed', 'A trader walks 12 km in 3 hours. Speed?', ['4 km/h', 1], ['0.25 km/h', 0, 'flip_speed'], ['36 km/h', 0], ['15 km/h', 0]),
    Q('speed3', 'speed', 'A bus travels 90 km in 3 hours. Speed?', ['30 km/h', 1], ['0.03 km/h', 0, 'flip_speed'], ['270 km/h', 0], ['93 km/h', 0]),
    Q('force1', 'force', 'F = m × a. m = 4 kg, a = 3 m/s². F = ?', ['12 N', 1], ['7 N', 0, 'add_not_mult'], ['1.3 N', 0], ['43 N', 0]),
    Q('force2', 'force', 'F = m × a. m = 5 kg, a = 2 m/s². F = ?', ['10 N', 1], ['7 N', 0, 'add_not_mult'], ['2.5 N', 0], ['52 N', 0]),
    Q('force3', 'force', 'F = m × a. m = 6 kg, a = 4 m/s². F = ?', ['24 N', 1], ['10 N', 0, 'add_not_mult'], ['1.5 N', 0], ['64 N', 0]),
    Q('work1', 'work', 'Work = force × distance. 10 N over 3 m. Work?', ['30 J', 1], ['13 J', 0, 'add_not_mult'], ['3.3 J', 0], ['103 J', 0]),
    Q('work2', 'work', 'Work = force × distance. 8 N over 5 m. Work?', ['40 J', 1], ['13 J', 0, 'add_not_mult'], ['1.6 J', 0], ['85 J', 0]),
    Q('work3', 'work', 'Work = force × distance. 20 N over 4 m. Work?', ['80 J', 1], ['24 J', 0, 'add_not_mult'], ['5 J', 0], ['204 J', 0]),
    Q('spdf1', 'spdf', 'A cyclist rides 6 km in 1/2 hour. Speed?', ['12 km/h', 1], ['3 km/h', 0, 'frac_time'], ['6.5 km/h', 0], ['1/12 km/h', 0, 'flip_speed']),
    Q('spdf2', 'spdf', 'A boy runs 10 km in 1/4 hour. Speed?', ['40 km/h', 1], ['2.5 km/h', 0, 'frac_time'], ['14 km/h', 0], ['0.025 km/h', 0, 'flip_speed']),
    Q('spdf3', 'spdf', 'A bike goes 15 km in 3/4 hour. Speed?', ['20 km/h', 1], ['11.25 km/h', 0, 'frac_time'], ['18.75 km/h', 0], ['0.05 km/h', 0, 'flip_speed']),
  ];
  const pack = { skills, misconceptions, bank, lessons };
  if (typeof module !== 'undefined' && module.exports) module.exports = pack; else root.RootPathPhysics = pack;
})(typeof self !== 'undefined' ? self : this);
