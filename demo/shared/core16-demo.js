/* Core16 demos: one sample student, Maya Chen, and enough of the eligibility engine to
   show her record the way the app and the portal do. Everything is worked out in the
   browser from today's date, so the demo never looks stale, and nothing is saved.

   The figures follow rules/eligibility.md: BC marks convert on the September 2026 BC
   outline (86/73/50), BC courses match on title, Workplace Mathematics 11 is a named
   exclusion, a typed-in course NCAA doesn't list is unrecognized, and the 16 fill the
   NCAA buckets completed first, then in progress, then planned. Maya's courses are the
   app's own BC Grade 11 persona (ios/Core16/Models/SampleData.swift). */
window.C16 = (function () {
  'use strict';

  /* ---------- dates ---------- */
  var DAY = 86400000;
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  var today = startOfDay(new Date());
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return startOfDay(x); }
  function day(n) { return addDays(today, n); }
  function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / DAY); }
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var DOWL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function fmt(d, pattern) {
    // "%a %-d %b", "%b %-d", "%A, %B %-d", "%a", "%m/%d", "%Y-%m-%d"
    return pattern.replace(/%A/g, DOWL[d.getDay()]).replace(/%a/g, DOW[d.getDay()])
      .replace(/%B/g, MONTHS[d.getMonth()]).replace(/%b/g, MON[d.getMonth()])
      .replace(/%-d/g, String(d.getDate())).replace(/%d/g, pad(d.getDate()))
      .replace(/%m/g, pad(d.getMonth() + 1)).replace(/%Y/g, String(d.getFullYear()));
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return fmt(d, '%Y-%m-%d'); }
  function parseISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function clock(minutes) {
    var h = Math.floor(minutes / 60), m = minutes % 60, ap = h >= 12 ? 'PM' : 'AM';
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + pad(m) + ' ' + ap;
  }
  function weekStart(d) { return addDays(d, -d.getDay()); } // Sunday-start weeks, as a Canadian phone has them

  /* ---------- numbers ---------- */
  var EPS = 1e-6;
  function roundDown(x, places) { var f = Math.pow(10, places); return Math.floor(x * f + EPS) / f; }
  function roundUp(x, places) { var f = Math.pow(10, places); return Math.ceil(x * f - EPS) / f; }
  function num(x) { return Number.isInteger(x) ? String(x) : String(roundDown(x, 1)); }   // Eligibility.format
  function gpaText(g) { return g == null ? '—' : roundDown(g, 2).toFixed(2); }
  function percentText(p) { return num(p) + '%'; }
  function unitsWord(u) { // "½ unit", "1 unit", "1½ units"
    var whole = Math.floor(u + EPS), frac = u - whole, glyph = {0: '', 0.25: '¼', 0.5: '½', 0.75: '¾'}[Math.round(frac * 4) / 4] || '';
    var text = (whole ? whole : '') + glyph;
    return text + (u <= 1 ? ' unit' : ' units');
  }
  function unitsNum(u) { return Number.isInteger(u) ? String(u) : String(u); }
  function hours(min) { var h = min / 60; if (Number.isInteger(h)) return String(h); var t = h.toFixed(2); return t.replace(/0$/, ''); }
  function duration(min) { var h = Math.floor(min / 60), m = min % 60; if (!h) return m + ' min'; return m ? h + ' h ' + m + ' min' : h + ' h'; }
  function toi(sec) { return Math.floor(sec / 60) + ':' + pad(sec % 60); }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }

  /* ---------- NCAA rules, BC ---------- */
  var BANDS = [
    {min: 86, letter: 'A', points: 4, range: '86–100%'},
    {min: 73, letter: 'B', points: 3, range: '73–85%'},
    {min: 50, letter: 'C', points: 2, range: '50–72%'},
    {min: 0, letter: 'F', points: 0, range: 'Below 50%'}
  ];
  var PROFICIENCY = {extending: ['Extending', 4], proficient: ['Proficient', 3], developing: ['Developing', 2], emerging: ['Emerging', 0]};
  var MINIMUM = {d1: 2.3, d2: 2.2};
  var REQUIREMENTS = {
    d1: [{key: 'english', label: 'English', need: 4}, {key: 'math', label: 'Math', need: 3}, {key: 'science', label: 'Science', need: 2},
         {key: 'extra', label: 'Extra E/M/S', need: 1}, {key: 'social', label: 'Social sci.', need: 2}, {key: 'additional', label: 'Additional', need: 4}],
    d2: [{key: 'english', label: 'English', need: 3}, {key: 'math', label: 'Math', need: 2}, {key: 'science', label: 'Science', need: 2},
         {key: 'extra', label: 'Extra E/M/S', need: 3}, {key: 'social', label: 'Social sci.', need: 2}, {key: 'additional', label: 'Additional', need: 4}]
  };
  var BUCKET_LONG = {english: 'English', math: 'Math', science: 'Science', extra: 'Extra E/M/S', social: 'Social science', additional: 'Additional'};
  var SUBJECT = {english: 'English', math: 'Math', science: 'Science', social: 'Social science', language: 'Language / other core', nonCore: 'Not NCAA core'};
  var PORTAL_CATEGORY = {english: 'English', math: 'Math', science: 'Science', social: 'Social science', language: 'Language', nonCore: 'Not NCAA core'};
  var STATUS = {completed: 'Completed', inProgress: 'Taking now', planned: 'Planned'};
  var PORTAL_STATUS = {completed: 'Complete', inProgress: 'In progress', planned: 'Planned'};

  function normalizeTitle(t) {
    t = (t || '').toLowerCase().normalize('NFC');
    BC_COURSES.modifiers.forEach(function (m) { t = t.split(m).join(' '); });
    return t.split(/\s+/).filter(Boolean).join(' ');
  }
  var approvedByTitle = {};
  BC_COURSES.approved.forEach(function (c) { approvedByTitle[normalizeTitle(c.title)] = c; });
  var exclusions = {};
  BC_COURSES.namedExclusions.forEach(function (t) { exclusions[t] = true; });
  function bcStatus(title) {
    var n = normalizeTitle(title);
    if (exclusions[n]) return 'excluded';
    if (approvedByTitle[n]) return 'approved';
    return 'unrecognized';
  }
  function catalogEntry(title) { return approvedByTitle[normalizeTitle(title)] || null; }
  function isCore(course) { return course.category !== 'nonCore'; }

  /* ---------- Maya's record ---------- */
  var nextID = 1;
  function course(title, grade, status, mark, extra) {
    var e = catalogEntry(title) || {};
    var c = {id: 'c' + (nextID++), title: title, code: e.code || '', grade: grade, category: e.category || (extra && extra.category) || 'nonCore',
             units: e.units != null ? e.units : (extra && extra.units) || 1, status: status, mark: mark || null, typed: !e.title};
    if (extra) Object.keys(extra).forEach(function (k) { c[k] = extra[k]; });
    return c;
  }
  function pct(v, received) { return {kind: 'percentage', value: v, received: received || null}; }
  function prof(level) { return {kind: 'proficiency', level: level}; }

  function makeStudent() {
    nextID = 1;
    var courses = [
      course('English Language Arts 9', 9, 'completed', prof('proficient')),
      course('Mathematics 9', 9, 'completed', prof('extending')),
      course('Science 9', 9, 'completed', prof('proficient')),
      course('Social Studies 9', 9, 'completed', prof('developing')),
      course('Core French 9', 9, 'completed', prof('extending')),
      course('Literary Studies 10', 10, 'completed', pct(78)),
      course('Composition 10', 10, 'completed', pct(81)),
      course('Foundations of Mathematics and Pre-calculus 10', 10, 'completed', pct(82)),
      course('Science 10', 10, 'completed', pct(90)),
      course('Social Studies 10', 10, 'completed', pct(75)),
      course('Core French 10', 10, 'completed', pct(70)),
      course('Literary Studies 11', 11, 'inProgress'),
      course('Workplace Mathematics 11', 11, 'inProgress'),
      course('Life Sciences 11', 11, 'inProgress'),
      course('Explorations in Social Studies 11', 11, 'inProgress'),
      course('Core French 11', 11, 'inProgress'),
      course('Punjabi 11', 11, 'inProgress', null, {category: 'language', units: 1}),
      course('Hockey Academy Skills 11', 11, 'inProgress', null, {category: 'nonCore', units: 1}),
      course('Punjabi 10', 10, 'completed', pct(88), {category: 'language', units: 1})
    ];
    var byTitle = {};
    courses.forEach(function (c) { byTitle[c.title] = c; });
    function a(courseTitle, title, type, due, weight, score, outOf) {
      return {id: 'a' + (nextID++), courseID: byTitle[courseTitle].id, title: title, type: type, due: day(due), weight: weight, score: score, outOf: outOf, by: null};
    }
    var assignments = [
      a('Literary Studies 11', 'Personal essay', 'Essay', -7, 5, 34, 40),
      a('Workplace Mathematics 11', 'Diagnostic quiz', 'Quiz', -3, 5, 22, 25),
      a('Life Sciences 11', 'Lab report', 'Lab', -1, 10, 43, 50),
      a('Explorations in Social Studies 11', 'Source analysis', 'Essay', -2, 10, 30, 40),
      a('Core French 11', 'Oral presentation', 'Presentation', 0, 10, null, 20),
      a('Literary Studies 11', 'Poetry analysis essay', 'Essay', 1, 10, null, 40),
      a('Workplace Mathematics 11', 'Unit 1 test', 'Test', 3, 15, null, 60),
      a('Life Sciences 11', 'Ecology quiz', 'Quiz', 5, 5, null, 30),
      a('Explorations in Social Studies 11', 'Case study presentation', 'Presentation', 7, 10, null, 25),
      a('Literary Studies 11', 'Novel study proposal', 'Assignment', 14, 5, null, 20)
    ];
    return {
      profile: {name: 'Maya Chen', first: 'Maya', initials: 'MC', province: 'BC', provinceName: 'British Columbia', grade: 11,
                school: 'Southridge Secondary', gradYear: 2028, division: 'd1', birthYear: 2010, birthMonth: 10, attendsUSSchool: false,
                parent: 'Claire Chen', parentFirst: 'Claire', ncaaID: ''},
      courses: courses,
      assignments: assignments,
      ice: makeIce(),
      bookings: makeBookings(),
      edits: []
    };
  }

  /* The hockey log the app seeds for every demo student: six weeks behind, two ahead.
     Practices Tuesday and Thursday, power skating every other Wednesday, a game each
     Saturday and every other one on the road, plus a road game two days out. */
  var OPPONENTS = ['vs Nepean', 'at Cornwall', 'vs Pembroke', 'at Brockville', 'vs Kanata', 'at Smiths Falls', 'vs Carleton Place', 'at Hawkesbury', 'vs Rockland'];
  var SHIFTS = [11 * 60 + 48, 12 * 60 + 30, 13 * 60 + 5, 12 * 60 + 52, 14 * 60 + 17, 15 * 60 + 2, 14 * 60 + 40];
  function makeIce() {
    var out = [];
    var road = day(2);
    out.push({id: 'i' + (nextID++), date: road, kind: 'game', title: 'at Kingston', minutes: 150, travel: 210, start: 19 * 60 + 30, toi: null, series: null, by: null});
    for (var off = -42; off <= 14; off++) {
      var d = day(off);
      if (daysBetween(d, road) === 0) continue;
      var week = Math.floor((off + 42) / 7), wd = d.getDay();
      if (wd === 2 || wd === 4) out.push({id: 'i' + (nextID++), date: d, kind: 'practice', title: '', minutes: 90, travel: 0, start: 18 * 60 + 30, toi: null, series: wd === 2 ? 'tue' : 'thu', by: null});
      else if (wd === 3 && week % 2 === 0) out.push({id: 'i' + (nextID++), date: d, kind: 'skills', title: 'Power skating', minutes: 60, travel: 0, start: 17 * 60, toi: null, series: null, by: null});
      else if (wd === 6) {
        var away = week % 2 === 1;
        out.push({id: 'i' + (nextID++), date: d, kind: 'game', title: OPPONENTS[week % OPPONENTS.length], minutes: 150, travel: away ? 120 : 0, start: 19 * 60,
                  toi: off <= 0 ? SHIFTS[week % SHIFTS.length] : null, series: null, by: null});
      }
    }
    return out;
  }
  var KIND = {practice: 'Practice', game: 'Game', skills: 'Skills session', offIce: 'Off-ice training'};

  /* One-to-one video sessions, as an advisor would have set them up for a demo. */
  var MENTORS = [
    {id: 'm1', name: 'Marc Delisle', specialty: 'hockey_mentor', label: 'Hockey mentor', credential: 'Former professional forward'},
    {id: 'm2', name: 'Renée Hollis', specialty: 'sports_psychology', label: 'Sports psychology', credential: 'Mental performance consultant'},
    {id: 'm3', name: 'Sam Ouellette', specialty: 'performance_coach', label: 'Performance coach', credential: 'Strength and conditioning coach'}
  ];
  function makeBookings() {
    var slots = [];
    function slot(mentorIndex, dayOffset, minuteOfDay, length, booked) {
      slots.push({id: 's' + (nextID++), mentor: MENTORS[mentorIndex], date: day(dayOffset), start: minuteOfDay, minutes: length, booked: !!booked, seat: null});
    }
    slot(0, 4, 19 * 60, 30, true);
    slot(0, 9, 18 * 60 + 30, 30); slot(0, 16, 19 * 60, 30);
    slot(1, 6, 17 * 60, 45); slot(1, 13, 17 * 60, 45);
    slot(2, 8, 16 * 60 + 30, 30); slot(2, 15, 16 * 60 + 30, 30);
    return slots;
  }
  var CREDITS = {hockey_mentor: 2, sports_psychology: 2, performance_coach: 2};

  /* ---------- the engine ---------- */
  function matchStatus(c) { return bcStatus(c.title); }
  function assignmentsFor(data, c) { return data.assignments.filter(function (a) { return a.courseID === c.id; }); }
  function markFor(data, c) {
    if (c.status === 'planned') return null;
    if (c.mark) return c.mark;
    var scored = assignmentsFor(data, c).filter(function (a) { return a.score != null && a.weight > 0 && a.outOf > 0; });
    if (!scored.length) return null;
    var w = 0, sum = 0;
    scored.forEach(function (a) { w += a.weight; sum += a.weight * (a.score / a.outOf * 100); });
    return {kind: 'percentage', value: Math.round(sum / w * 1e9) / 1e9, computed: true};
  }
  function markBasis(data, c) {
    if (c.status === 'completed') return 'final';
    if (c.mark && c.mark.kind === 'proficiency') return 'latest term';
    if (c.mark) return c.mark.received ? 'report card · ' + fmt(c.mark.received, '%b %-d') : 'report card';
    return 'average so far';
  }
  function band(percent) { for (var i = 0; i < BANDS.length; i++) if (percent >= BANDS[i].min) return BANDS[i]; return BANDS[BANDS.length - 1]; }
  function points(mark) { return mark.kind === 'proficiency' ? PROFICIENCY[mark.level][1] : band(mark.value).points; }
  function markText(mark) { return !mark ? '—' : mark.kind === 'proficiency' ? PROFICIENCY[mark.level][0] : percentText(mark.value); }
  function letterText(mark) { return mark.kind === 'proficiency' ? PROFICIENCY[mark.level][0] : band(mark.value).letter; }

  function coreGPA(data) {
    var units = 0, sum = 0;
    data.courses.forEach(function (c) {
      if (!isCore(c) || matchStatus(c) !== 'approved') return;
      var m = markFor(data, c); if (!m) return;
      units += c.units; sum += points(m) * c.units;
    });
    return {gpa: units ? sum / units : null, units: units};
  }

  var STATUS_ORDER = {completed: 0, inProgress: 1, planned: 2};
  function placementSort(a, b) {
    return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || (a.grade - b.grade) || a.title.localeCompare(b.title);
  }
  /* Fill NCAA's buckets the way both engines do: English, math and science first, surplus
     into Extra E/M/S then Additional, social science then its surplus into Additional,
     languages into Additional. Returns one bar per bucket with its boxes. */
  function allocate(data) {
    var reqs = REQUIREMENTS[data.profile.division];
    var need = {}; reqs.forEach(function (r) { need[r.key] = r.need; });
    var placed = {}; reqs.forEach(function (r) { placed[r.key] = []; });
    var room = Object.assign({}, need);
    var elsewhere = {}; // course id -> [{bucket, units}]
    function put(bucket, c, units) {
      if (units <= EPS) return 0;
      var take = Math.min(units, room[bucket]);
      if (take <= EPS) return 0;
      room[bucket] -= take;
      placed[bucket].push({course: c, units: take, status: c.status, grade: c.grade, title: c.title});
      (elsewhere[c.id] = elsewhere[c.id] || []).push({bucket: bucket, units: take});
      return take;
    }
    var approved = data.courses.filter(function (c) { return isCore(c) && matchStatus(c) === 'approved'; }).sort(placementSort);
    ['english', 'math', 'science'].forEach(function (subj) {
      approved.filter(function (c) { return c.category === subj; }).forEach(function (c) {
        var left = c.units - put(subj, c, c.units);
        left -= put('extra', c, left);
        put('additional', c, left);
      });
    });
    approved.filter(function (c) { return c.category === 'social'; }).forEach(function (c) {
      var left = c.units - put('social', c, c.units);
      put('additional', c, left);
    });
    approved.filter(function (c) { return c.category === 'language'; }).forEach(function (c) { put('additional', c, c.units); });

    var bars = reqs.map(function (r) {
      var list = placed[r.key].slice().sort(placementSort);
      var slots = [];
      for (var i = 0; i < Math.ceil(r.need); i++) slots.push({done: 0, now: 0, later: 0, courses: []});
      var pos = 0;
      list.forEach(function (p) {
        var left = p.units;
        while (left > EPS && pos < r.need - EPS) {
          var idx = Math.floor(pos + EPS), s = slots[idx];
          var space = (idx + 1) - pos, take = Math.min(left, space);
          if (p.status === 'completed') s.done += take; else if (p.status === 'inProgress') s.now += take; else s.later += take;
          s.courses.push({course: p.course, share: take});
          pos += take; left -= take;
        }
      });
      slots.forEach(function (s) { s.done = Math.min(1, s.done); s.now = Math.min(1, s.now); s.later = Math.min(1, s.later); s.empty = s.done + s.now + s.later <= EPS; s.full = s.done >= 1 - EPS; });
      var completed = 0, inProgress = 0, planned = 0;
      list.forEach(function (p) { if (p.status === 'completed') completed += p.units; else if (p.status === 'inProgress') inProgress += p.units; else planned += p.units; });
      return {key: r.key, label: r.label, long: BUCKET_LONG[r.key], need: r.need, placements: list, slots: slots,
              completed: completed, inProgress: inProgress, planned: planned, counted: completed + inProgress, met: completed + inProgress >= r.need - EPS};
    });
    var totals = {completed: 0, inProgress: 0, planned: 0, required: 0};
    bars.forEach(function (b) { totals.completed += b.completed; totals.inProgress += b.inProgress; totals.planned += b.planned; totals.required += b.need; });
    totals.counted = totals.completed + totals.inProgress;
    return {bars: bars, totals: totals, elsewhere: elsewhere};
  }

  function corePace(data, alloc) {
    var g = data.profile.grade;
    if (g >= 12) return null;
    var target = 4 * (g - 8);
    var units = 0;
    alloc.bars.forEach(function (b) { b.placements.forEach(function (p) { if (p.course.grade <= g) units += p.units; }); });
    return {units: units, target: target, grade: g, behind: units < target - EPS};
  }
  function tenSeven(data, alloc) {
    var p = data.profile;
    if (!p.attendsUSSchool || p.division !== 'd1' || p.grade > 11) return null;
    var core = 0, ems = 0;
    alloc.bars.forEach(function (b) { b.placements.forEach(function (pl) {
      if (pl.course.grade > 11 || pl.status === 'planned') return;
      core += pl.units; if (['english', 'math', 'science'].indexOf(pl.course.category) >= 0) ems += pl.units;
    }); });
    return {core: core, ems: ems, met: core >= 10 && ems >= 7};
  }
  function eligibilityClock(p) {
    if (!p.birthMonth || !p.birthYear) return null;
    var start = p.birthYear + (p.birthMonth <= 8 ? 19 : 20);
    return {startYear: start, seasonsBefore: start - p.gradYear, gradYear: p.gradYear};
  }
  function clockSummary(c) {
    var start = 'Starts fall ' + c.startYear;
    if (c.seasonsBefore < 0) return start + ', before Grade 12 ends · ' + (-c.seasonsBefore) + ' of the 5 years used by graduation';
    if (c.seasonsBefore === 0) return start + ', straight after Grade 12';
    return start + ', ' + (c.seasonsBefore === 1 ? '1 season' : c.seasonsBefore + ' seasons') + ' after Grade 12';
  }
  var CLOCK_RULE = "NCAA gives you five years to play, and they don't pause. They start the fall after you turn 19, or when you start college full time if that's sooner. A 19th birthday on or after September 1 means the following fall.";
  function clockExplanation(p) {
    var c = eligibilityClock(p);
    if (!c) {
      var missing = !p.birthMonth && !p.birthYear ? 'birth month and year' : !p.birthMonth ? 'birth month' : 'birth year';
      return CLOCK_RULE + '\n\nAdd your ' + missing + ' in Profile to see when yours start.';
    }
    var y = c.startYear, text = CLOCK_RULE + '\n\nYours start in fall ' + y + ' at the latest and run through the ' + (y + 4) + '–' + String(y + 5).slice(2) + ' season. ';
    if (c.seasonsBefore < 0) text += (c.seasonsBefore === -1 ? "That's before you finish Grade 12, so one of the five is gone before college can start." : "That's before you finish Grade 12, so " + (-c.seasonsBefore) + ' of the five are gone before college can start.');
    else if (c.seasonsBefore === 0) text += "That's the fall after Grade 12, so any season played before college uses one of the five.";
    else if (c.seasonsBefore === 1) text += 'That leaves one season after Grade 12. Each one after that uses one of the five.';
    else text += 'That leaves ' + c.seasonsBefore + ' seasons after Grade 12. Each one after that uses one of the five.';
    return text + '\n\nWorked out from your birth month. Only the NCAA decides.';
  }

  function cliffs(data, gpa) {
    if (gpa.gpa == null) return [];
    var out = [];
    data.courses.forEach(function (c) {
      if (c.status !== 'inProgress' || !isCore(c) || matchStatus(c) !== 'approved') return;
      var m = markFor(data, c); if (!m || m.kind !== 'percentage') return;
      var idx = BANDS.findIndex(function (b) { return m.value >= b.min; });
      if (idx <= 0) return;
      var cur = BANDS[idx], next = BANDS[idx - 1], needed = next.min - m.value;
      if (needed > 5) return;
      var impact = (next.points - cur.points) * c.units / gpa.units;
      out.push({course: c, percent: m.value, current: cur, next: next, pointsNeeded: needed, projected: gpa.gpa + impact});
    });
    return out.sort(function (a, b) { return b.projected - a.projected; });
  }
  function cliffHeadline(cl) {
    var n = roundUp(cl.pointsNeeded, 1), nText = num(n);
    return cl.course.title + ': ' + nText + ' more ' + (nText === '1' ? 'point' : 'points') + ' takes you from ' + cl.current.letter + ' to ' + cl.next.letter;
  }
  function categoryConcerns(data) {
    var out = [];
    ['english', 'math', 'science', 'social', 'language'].forEach(function (cat) {
      var n = data.courses.filter(function (c) {
        if (c.category !== cat || matchStatus(c) !== 'approved') return false;
        var m = markFor(data, c); return m && points(m) <= 2;
      }).length;
      if (n >= 2) out.push({category: cat, count: n});
    });
    return out;
  }
  function unrecognizedCore(data) { return data.courses.filter(function (c) { return isCore(c) && matchStatus(c) === 'unrecognized'; }); }

  /* ---------- due dates ---------- */
  function urgency(due) {
    var n = daysBetween(today, due);
    if (n < 0) return {key: 'overdue', days: n, label: n === -1 ? '1 day late' : (-n) + ' days late', solid: true};
    if (n === 0) return {key: 'today', days: 0, label: 'Due today', solid: true};
    if (n === 1) return {key: 'tomorrow', days: 1, label: 'Tomorrow', solid: true};
    if (n <= 3) return {key: 'three', days: n, label: 'In ' + n + ' days'};
    if (n <= 5) return {key: 'five', days: n, label: 'In ' + n + ' days'};
    if (n <= 7) return {key: 'week', days: n, label: 'In ' + n + ' days'};
    return {key: 'later', days: n, label: 'In ' + n + ' days'};
  }
  function courseOf(data, a) { return data.courses.find(function (c) { return c.id === a.courseID; }); }
  function unmarked(data) { return data.assignments.filter(function (a) { return a.score == null; }).sort(function (a, b) { return a.due - b.due; }); }
  function marked(data) { return data.assignments.filter(function (a) { return a.score != null; }).sort(function (a, b) { return b.due - a.due; }); }

  /* ---------- hockey ---------- */
  function iceTotal(s) { return s.minutes + (s.travel || 0); }
  function minutesIn(ice, from, to, throughToday) {
    var sum = 0;
    ice.forEach(function (s) { if (s.date >= from && s.date < to && (!throughToday || s.date <= today)) sum += s.minutes; });
    return sum;
  }
  function iceTime(data) {
    var ice = data.ice, ws = weekStart(today), we = addDays(ws, 7);
    var logged = 0, planned = 0;
    ice.forEach(function (s) { if (s.date >= ws && s.date < we) { if (s.date <= today) logged += s.minutes; else planned += s.minutes; } });
    var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    var seasonYear = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
    var seasonStart = new Date(seasonYear, 7, 1), seasonEnd = new Date(seasonYear + 1, 7, 1);
    var travel = 0; ice.forEach(function (s) { if (s.date >= seasonStart && s.date <= today) travel += s.travel || 0; });
    var weeks = [];
    for (var i = -5; i <= 2; i++) {
      var s0 = addDays(ws, i * 7), s1 = addDays(s0, 7), lg = 0, pl = 0;
      ice.forEach(function (s) { if (s.date >= s0 && s.date < s1) { if (s.date <= today) lg += s.minutes; else pl += s.minutes; } });
      weeks.push({start: s0, logged: lg, planned: pl, current: i === 0});
    }
    var played = ice.filter(function (s) { return s.kind === 'game' && s.date <= today; }).sort(function (a, b) { return a.date - b.date; });
    var withTOI = played.filter(function (s) { return s.toi != null; });
    var avg = withTOI.length ? Math.round(withTOI.reduce(function (t, s) { return t + s.toi; }, 0) / withTOI.length) : null;
    return {
      week: {logged: logged, planned: planned, minutes: logged + planned},
      month: minutesIn(ice, monthStart, addDays(today, 1), true),
      season: minutesIn(ice, seasonStart, seasonEnd, true), seasonTravel: travel, seasonLabel: seasonYear + '–' + String(seasonYear + 1).slice(2),
      weeks: weeks, gamesPlayed: played.length, averageTOI: avg, toiGames: withTOI.length,
      lastTOI: withTOI.length ? withTOI[withTOI.length - 1].toi : null,
      upcoming: ice.filter(function (s) { return s.date > today; }).sort(function (a, b) { return (a.date - b.date) || ((a.start || 0) - (b.start || 0)); }),
      logged: ice.filter(function (s) { return s.date <= today; }).sort(function (a, b) { return (b.date - a.date) || ((b.start || 0) - (a.start || 0)); })
    };
  }
  function clashes(data) {
    var out = [];
    unmarked(data).forEach(function (a) {
      var n = daysBetween(today, a.due);
      if (n < 0 || n > 14) return;
      var from = Math.max(0, n - 2);
      var sessions = data.ice.filter(function (s) { var d = daysBetween(today, s.date); return d >= from && d <= n; })
        .sort(function (x, y) { return x.date - y.date; });
      var minutes = sessions.reduce(function (t, s) { return t + iceTotal(s); }, 0);
      if (minutes < 300) return;
      var busy = {}; sessions.forEach(function (s) { busy[daysBetween(today, s.date)] = true; });
      var free = []; for (var d = 0; d < n; d++) if (!busy[d]) free.push(d);
      var advice;
      if (n === 0) advice = busy[0] ? 'Hockey today as well. Keep ' + DOWL[today.getDay()] + ' clear for this.' : 'Get it done before the rink.';
      else if (!free.length) advice = "No day without hockey before it's due. Start today, in whatever time there is.";
      else if (free.length === 1 && free[0] === 0) advice = 'Start today. Hockey takes over tomorrow.';
      else { var last = free[free.length - 1]; advice = last === 0 ? 'Get it done before the rink.' : 'Aim to be ready by ' + DOWL[day(last).getDay()] + ', before the hockey starts.'; }
      var parts = sessions.map(function (s) { return DOW[s.date.getDay()] + ' ' + KIND[s.kind].toLowerCase().replace('skills session', 'skills'); });
      out.push({assignment: a, sessions: sessions, minutes: minutes, days: n, advice: advice,
                conflict: hours(minutes) + ' h of hockey ' + (n === 0 ? 'today' : "just before it's due") + ': ' + parts.join(', '),
                dueText: n === 0 ? 'Due today' : n === 1 ? 'Due tomorrow' : 'Due ' + DOW[a.due.getDay()] + ', in ' + n + ' days'});
    });
    return out;
  }

  /* ---------- everything the screens read, in one place ---------- */
  function figures(data) {
    var gpa = coreGPA(data), alloc = allocate(data), review = unrecognizedCore(data);
    return {
      gpa: gpa, minimum: MINIMUM[data.profile.division], alloc: alloc, pace: corePace(data, alloc), tenSeven: tenSeven(data, alloc),
      clock: eligibilityClock(data.profile), cliffs: cliffs(data, gpa), concerns: categoryConcerns(data), review: review,
      ice: iceTime(data), clashes: clashes(data),
      above: gpa.gpa != null && gpa.gpa >= MINIMUM[data.profile.division] - EPS
    };
  }

  /* ---------- calendar events, as the portal pages list them ---------- */
  function events(data, from, to) {
    var out = [];
    data.assignments.forEach(function (a) {
      if (a.due < from || a.due >= to) return;
      var c = courseOf(data, a);
      out.push({kind: 'due', day: a.due, at: null, sortMinute: 0, title: a.title, detail: (c ? c.title : '') + ' · ' + a.type, done: a.score != null, item: a, waiting: !!a.by});
    });
    data.ice.forEach(function (s) {
      if (s.date < from || s.date >= to) return;
      out.push({kind: 'hockey', day: s.date, at: s.start != null ? clock(s.start) : null, sortMinute: s.start || 0,
                title: KIND[s.kind] + (s.title ? ' · ' + s.title : ''), detail: duration(s.minutes) + (s.travel ? ', ' + duration(s.travel) + ' travel' : ''), item: s, waiting: !!s.by});
    });
    data.bookings.forEach(function (b) {
      if (!b.booked || b.date < from || b.date >= to) return;
      out.push({kind: 'session', day: b.date, at: clock(b.start) + ' BC time', sortMinute: b.start, title: b.mentor.label, detail: 'With ' + b.mentor.name + ', ' + b.minutes + ' min', item: b});
    });
    return out.sort(function (a, b) { return (a.day - b.day) || (a.sortMinute - b.sortMinute) || a.title.localeCompare(b.title); });
  }

  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }

  return {
    today: today, day: day, addDays: addDays, daysBetween: daysBetween, fmt: fmt, iso: iso, parseISO: parseISO, clock: clock, weekStart: weekStart,
    MONTHS: MONTHS, MON: MON, DOW: DOW, DOWL: DOWL,
    roundDown: roundDown, roundUp: roundUp, num: num, gpaText: gpaText, percentText: percentText, unitsWord: unitsWord, hours: hours, duration: duration, toi: toi, plural: plural,
    BANDS: BANDS, PROFICIENCY: PROFICIENCY, REQUIREMENTS: REQUIREMENTS, BUCKET_LONG: BUCKET_LONG, SUBJECT: SUBJECT, PORTAL_CATEGORY: PORTAL_CATEGORY, STATUS: STATUS, PORTAL_STATUS: PORTAL_STATUS, KIND: KIND, MENTORS: MENTORS, CREDITS: CREDITS, MINIMUM: MINIMUM,
    normalizeTitle: normalizeTitle, bcStatus: bcStatus, catalogEntry: catalogEntry, isCore: isCore,
    makeStudent: makeStudent, matchStatus: matchStatus, markFor: markFor, markBasis: markBasis, band: band, points: points, markText: markText, letterText: letterText,
    coreGPA: coreGPA, allocate: allocate, corePace: corePace, eligibilityClock: eligibilityClock, clockSummary: clockSummary, clockExplanation: clockExplanation, CLOCK_RULE: CLOCK_RULE,
    cliffs: cliffs, cliffHeadline: cliffHeadline, urgency: urgency, courseOf: courseOf, unmarked: unmarked, marked: marked, assignmentsFor: assignmentsFor,
    iceTime: iceTime, iceTotal: iceTotal, clashes: clashes, figures: figures, events: events, escapeHTML: escapeHTML, nextID: function () { return 'n' + (nextID++); }
  };
})();
