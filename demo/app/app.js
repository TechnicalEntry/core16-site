/* The Core16 iPhone app, as a web demo: the five tabs, Profile, the sheets and alerts, drawn from
   the SwiftUI views in ios/Core16/Views and run on the shared sample record (../shared/core16-demo.js).
   The phone is the record, so figures here recompute as the record changes. */
(function () {
  'use strict';
  var C = window.C16, h = C.escapeHTML, EPS = 1e-6;
  var phone = document.getElementById('phone'), glass = document.getElementById('glass'), screen = document.getElementById('screen'), tabsEl = document.getElementById('tabs');
  var ov = document.createElement('div'); ov.id = 'ov'; glass.appendChild(ov);
  var al = document.createElement('div'); al.id = 'al'; glass.appendChild(al);
  var data, fig, ui;

  function start() {
    data = C.makeStudent();
    ui = {tab: 'overview', push: null, sheet: null, alert: null, flash: null, scroll: {},
          marks: {day: null, course: 'all', reportOpen: false}, hockey: {allUp: false, allLog: false},
          prefs: {theme: 'dark', showAP: false, showIB: false, notify: true, calendar: false, showTaps: false}};
    render();
  }
  function recompute() { fig = C.figures(data); }

  /* ---------- icons ---------- */
  var I = {
    house: '<svg viewBox="0 0 20 20"><path d="M3.5 9.5 10 4l6.5 5.5"/><path d="M5.5 8.5V16h9V8.5"/><path d="M8.5 16v-4h3v4"/></svg>',
    books: '<svg viewBox="0 0 20 20"><rect x="3.5" y="4" width="3" height="12" rx=".6"/><rect x="8" y="4" width="3" height="12" rx=".6"/><path d="m12.4 5.2 2.9-.8 3 11.6-2.9.8z"/></svg>',
    cal: '<svg viewBox="0 0 20 20"><rect x="3" y="4.5" width="12" height="11" rx="1.5"/><path d="M3 8.5h12M6.5 3v3M11.5 3v3"/><circle cx="15" cy="14.5" r="3.5" fill="var(--ground)"/><path d="M15 12.8v1.9l1.3.8"/></svg>',
    chart: '<svg viewBox="0 0 20 20"><path d="M3 16.5h14"/><rect x="4" y="9" width="3" height="5"/><rect x="8.5" y="5" width="3" height="9"/><rect x="13" y="11" width="3" height="3"/></svg>',
    hockey: '<svg viewBox="0 0 20 20"><path d="M13.5 3 7.6 13.6a2.2 2.2 0 0 1-2 1.1H3.5"/><ellipse cx="14.5" cy="15.5" rx="2.5" ry="1.2"/></svg>',
    plus: '<svg viewBox="0 0 20 20"><path d="M10 4v12M4 10h12"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 8 14"><path d="m1.5 1.5 5 5-5 5"/></svg>',
    chevLeft: '<svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8"/></svg>',
    video: '<svg viewBox="0 0 20 20"><rect x="2.5" y="5.5" width="10" height="9" rx="2"/><path d="m12.5 9 5-2.5v7l-5-2.5"/></svg>',
    arrowUp: '<svg viewBox="0 0 20 20"><path d="M6 14 14 6M8 6h6v6"/></svg>',
    bulb: '<svg viewBox="0 0 20 20"><path d="M7 15h6M8 17.5h4"/><path d="M10 2.5a5 5 0 0 0-3 9l.6 1.5h4.8l.6-1.5a5 5 0 0 0-3-9z"/></svg>',
    warn: '<svg viewBox="0 0 20 20"><path d="M10 3 2.5 16h15z" fill="currentColor" stroke="none"/><path d="M10 8v4M10 14.2v.3" stroke="var(--on-ink)" stroke-width="1.8"/></svg>',
    info: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5"/><path d="M10 9v5M10 6.5v.3"/></svg>',
    tick: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/><path d="m6.5 10.3 2.4 2.4 4.8-5"/></svg>',
    check: '<svg viewBox="0 0 14 14"><path d="m2.5 7.5 3 3 6-6.5"/></svg>',
    mag: '<svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4.5 4.5"/></svg>',
    pencil: '<svg viewBox="0 0 20 20"><path d="M4 16h12"/><path d="m5 13 8-8 2.5 2.5-8 8H5z"/></svg>',
    clock: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="currentColor"/><path d="M10 5.5V10l3 2" stroke="#fff" fill="none" stroke-width="1.8"/></svg>',
    excl: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/><path d="M10 6v5M10 13.5v.3" stroke="#fff" fill="none" stroke-width="2"/></svg>',
    tri: '<svg viewBox="0 0 20 20"><path d="M10 3 2 17h16z"/><path d="M10 8v4M10 14v.3" stroke="#fff" fill="none" stroke-width="1.8"/></svg>'
  };

  /* ---------- small helpers ---------- */
  function displayCode(c) { return c.code && data.profile.province === 'ON' ? c.code : c.title; }
  function markOf(c) { return C.markFor(data, c); }
  function status(c) { return C.matchStatus(c); }
  function unitsCaption(c) { return C.SUBJECT[c.category] + (c.units < 1 && C.isCore(c) ? ' · ' + C.unitsWord(c.units) : ''); }
  function alert(title, message, buttons) { ui.alert = {title: title, message: message, buttons: buttons || [{label: 'Got it', style: 'b'}]}; paintAlert(); }
  function closeAlert() { ui.alert = null; paintAlert(); }
  function openSheet(s) { ui.sheet = s; paintSheet(); }
  function closeSheet() { ui.sheet = null; paintSheet(); }
  function go(tab) { ui.tab = tab; ui.push = null; render(); }
  function cellCourse(c) { return 'c-' + c.id; }

  /* ---------- the tab bar ---------- */
  function badges() {
    var marks = C.unmarked(data).filter(function (a) { return C.daysBetween(C.today, a.due) <= 0; }).length;
    return {marks: marks, gpa: fig.cliffs.length + fig.concerns.length, hockey: fig.clashes.length};
  }
  function tabBar() {
    var b = badges();
    return [['overview', 'Overview', I.house, 0], ['courses', 'Courses', I.books, 0], ['marks', 'Marks', I.cal, b.marks], ['gpa', 'GPA', I.chart, b.gpa], ['hockey', 'Hockey', I.hockey, b.hockey]]
      .map(function (t) { return '<button type="button" class="' + (ui.tab === t[0] ? 'on' : '') + '" data-act="tab" data-arg="' + t[0] + '" aria-label="' + t[1] + '">' + t[2] + t[1] + (t[3] ? '<span class="n">' + t[3] + '</span>' : '') + '</button>'; }).join('');
  }

  /* ---------- Overview ---------- */
  function ringSVG(size, counted, done, required) {
    var r = (size - 11) / 2, circ = 2 * Math.PI * r;
    return '<svg viewBox="0 0 ' + size + ' ' + size + '"><circle class="track" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '"/>' +
      '<circle class="now" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-dasharray="' + (circ * Math.min(1, counted / required)).toFixed(2) + ' ' + circ.toFixed(2) + '"/>' +
      '<circle class="done" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-dasharray="' + (circ * Math.min(1, done / required)).toFixed(2) + ' ' + circ.toFixed(2) + '"/></svg>';
  }
  function reviewMessage() {
    var r = fig.review;
    if (r.length === 1) return displayCode(r[0]) + ' isn’t on NCAA’s approved list, so it doesn’t count toward your 16 core courses or your GPA.\n\nCheck it in Courses for a typo. If it’s right, ask your school counsellor about a course that counts.';
    return r.length + ' of your courses aren’t on NCAA’s approved list, so they don’t count toward your 16 core courses or your GPA.\n\nCheck them in Courses for typos. If they’re right, ask your school counsellor about courses that count.';
  }
  function paceMessage() {
    var p = fig.pace;
    return C.num(p.units) + ' core courses through Grade ' + p.grade + '. Four a year toward the 16 makes ' + p.target + '.' + (p.behind ? ' Check next term has enough core courses, and add any earlier ones missing from the app.' : ' You’re on pace.') + '\n\nPlanned courses count. A guide, not an NCAA rule.';
  }
  function clockValue() {
    var p = data.profile;
    if (!p.birthMonth && !p.birthYear) return {text: 'Add birth month', amber: true};
    if (!p.birthMonth) return {text: 'Add birth month', amber: true};
    if (!p.birthYear) return {text: 'Add birth year', amber: true};
    return {text: 'Fall ' + fig.clock.startYear, amber: false};
  }
  function assignmentRow(a, opts) {
    opts = opts || {};
    var c = C.courseOf(data, a), u = C.urgency(a.due), scored = a.score != null;
    var colour = scored || u.key === 'later' ? '' : (u.key === 'overdue' || u.key === 'today' || u.key === 'tomorrow' ? ' ucol-' + u.key : '');
    var right = scored ? '<span class="code">' + C.num(a.score) + '/' + C.num(a.outOf) + '</span><span class="caption2 secondary">' + C.num(C.roundDown(a.score / a.outOf * 100, 1)) + '%</span>' :
      u.key === 'later' ? '<span class="caption secondary">' + u.label + '</span>' :
      '<span class="flag ' + u.key + '">' + (u.key === 'overdue' ? I.tri : u.key === 'today' ? I.excl : u.key === 'tomorrow' ? I.clock : '') + u.label + '</span>';
    var stripe = !scored && u.key !== 'later' ? '<i class="ustripe ubg-' + u.key + '"></i>' : '';
    var urgent = !scored && (u.key === 'overdue' || u.key === 'today');
    return '<button type="button" class="cell stripe' + (urgent ? ' urgent' : '') + '" style="' + (urgent ? '--ucol:var(--bad)' : '') + '" data-act="' + (opts.act || 'editAssignment') + '" data-arg="' + a.id + '">' + stripe +
      '<span class="datebox"><span class="m">' + C.fmt(a.due, '%b') + '</span><span class="d' + colour + '">' + a.due.getDate() + '</span></span>' +
      '<span class="main"><b>' + h(a.title) + '</b><span class="sub">' + h(displayCode(c)) + ' · ' + h(a.type) + ' · ' + C.num(a.weight) + '%</span>' + (a.by ? '<span class="sub caption2">Added by ' + h(a.by) + ' from the web</span>' : '') + '</span>' +
      '<span class="side">' + right + '</span></button>';
  }
  function overview() {
    var p = data.profile, t = fig.alloc.totals, g = fig.gpa, min = fig.minimum;
    var chip = fig.review.length ? '<button type="button" class="chip bad standing-chip" data-act="alert" data-arg="review">Needs review ' + I.info + '</button>' :
      g.gpa != null ? '<span class="chip ' + (fig.above ? 'good' : 'bad') + ' standing-chip">' + (fig.above ? 'Above' : 'Below') + ' ' + min + ' minimum</span>' : '<span class="chip standing-chip">No marks yet</span>';
    var clk = clockValue();
    var rows = '<div class="rows">' +
      '<div class="r"><span class="l">Core GPA</span><span class="v ' + (g.gpa == null ? 'secondary' : fig.above ? 'good' : 'bad') + '"><small>min ' + min + '</small>' + C.gpaText(g.gpa) + '</span></div>' +
      '<div class="r tap"><span class="l">To review</span>' + (fig.review.length ? '<button type="button" class="v bad dotted" data-act="alert" data-arg="toReview">' + fig.review.length + '</button>' : '<span class="v">0</span>') + '</div>' +
      (fig.tenSeven ? '<div class="r"><span class="l">10/7 rule</span><span class="v ' + (fig.tenSeven.met ? 'good' : 'ambertext') + '">' + (fig.tenSeven.met ? 'On track' : 'In progress') + '</span></div>' : '') +
      (fig.pace ? '<div class="r tap"><span class="l">Core pace</span><button type="button" class="v dotted ' + (fig.pace.behind ? 'ambertext' : 'good') + '" data-act="alert" data-arg="pace">' + (fig.pace.behind ? 'Light' : 'On pace') + '</button></div>' : '') +
      '<div class="r tap"><span class="l">5-year clock</span><button type="button" class="v dotted ' + (clk.amber ? 'ambertext' : 'secondary') + '" data-act="alert" data-arg="clock">' + clk.text + '</button></div></div>';
    var out = '<div class="hdr"><div><span class="eyebrow">' + h(p.name) + ' · Gr ' + p.grade + ' · ' + p.province + '</span><div class="title">Overview</div></div><button type="button" class="initials" data-act="push" data-arg="profile" aria-label="Profile">' + h(p.initials) + '</button></div>';
    out += '<div class="panel"><div class="stand"><button type="button" class="ring" data-act="tab" data-arg="courses" aria-label="' + C.num(t.counted) + ' of 16 core courses">' + ringSVG(113, t.counted, t.completed, t.required) + '<span class="centre"><b>' + C.num(t.counted) + '</b><span class="eyebrow">of ' + t.required + ' core</span></span></button><div>' + chip + rows + '</div></div>' +
      '<div class="key"><span><i style="background:var(--ink)"></i>Complete<b>' + C.num(t.completed) + '</b></span><span><i style="background:var(--amber)"></i>In progress<b>' + C.num(t.inProgress) + '</b></span></div>' +
      '<div class="divider"></div><p class="caption secondary" style="margin:0">Tracks what you’ve entered. Only the NCAA Eligibility Center certifies.</p></div>';
    var booking = data.bookings.filter(function (b) { return b.booked && b.date >= C.today; }).sort(function (a, b) { return a.date - b.date; })[0];
    out += '<button type="button" class="card" data-act="alert" data-arg="session"><span class="icon">' + I.video + '</span><span class="body"><b>' + (booking ? 'Session with ' + h(booking.mentor.name) : 'One-to-one sessions') + '</b><span>' + (booking ? C.fmt(booking.date, '%a') + ', ' + booking.date.getDate() + ' ' + C.fmt(booking.date, '%b') + ' at ' + C.clock(booking.start) : 'Hockey mentor, sports psychology and more') + '</span></span>' + I.chev + '</button>';
    var open = C.unmarked(data);
    out += '<div class="panel"><div class="head"><span class="eyebrow strong">Next up</span>' + (open.length ? '<span class="eyebrow">' + open.length + ' open</span>' : '') + '</div>' +
      (open.length ? '<div class="group">' + open.slice(0, 2).map(function (a) { return assignmentRow(a, {act: 'tabMarks'}); }).join('') + '</div>' : '<p class="secondary" style="margin:0">Nothing due.</p>') + '</div>';
    if (fig.cliffs.length) { var cl = fig.cliffs[0]; out += '<button type="button" class="card" data-act="tab" data-arg="gpa"><span class="icon amber">' + I.arrowUp + '</span><span class="body"><b>' + h(C.cliffHeadline(cl)) + '</b><span>Core GPA would go to ' + C.gpaText(cl.projected) + '</span></span>' + I.chev + '</button>'; }
    if (data.ice.length) {
      var w = fig.ice.week, cap = fig.clashes.length ? '<span class="ambertext">' + (fig.clashes.length === 1 ? '1 due date lands on a heavy stretch' : fig.clashes.length + ' due dates land on heavy stretches') + '</span>' : w.planned ? C.hours(w.planned) + ' h still to come' : C.hours(fig.ice.season) + ' h this season';
      out += '<button type="button" class="card" data-act="tab" data-arg="hockey"><span class="icon">' + I.hockey + '</span><span class="body"><b>' + C.hours(w.minutes) + ' h of hockey this week</b><span>' + cap + '</span></span>' + I.chev + '</button>';
    }
    var current = data.courses.filter(function (c) { return c.status === 'inProgress' && C.isCore(c); });
    if (current.length) out += '<div class="panel"><div class="head"><span class="eyebrow strong">This year</span><span class="eyebrow">latest marks</span></div><div class="tiles">' + current.map(function (c) { var m = markOf(c); return '<button type="button" class="tile" data-act="tab" data-arg="courses"><span class="c">' + h(displayCode(c)) + '</span><span class="v">' + (m ? C.markText(m) : '—') + '</span></button>'; }).join('') + '</div></div>';
    return out;
  }

  /* ---------- Courses ---------- */
  function boxes(bar) {
    return '<span class="boxes">' + bar.slots.map(function (s) {
      var border = s.full ? 'full' : s.empty ? 'b-empty' : s.done ? 'b-done' : s.now ? 'b-now' : 'b-later';
      var fills = s.full ? '<i class="f done" style="left:0;width:100%"></i>' + I.check : (s.done ? '<i class="f done" style="left:0;width:' + (s.done * 100) + '%"></i>' : '') + (s.now ? '<i class="f now" style="left:' + (s.done * 100) + '%;width:' + (s.now * 100) + '%"></i>' : '') + (s.later ? '<i class="f later" style="left:' + ((s.done + s.now) * 100) + '%;width:' + (s.later * 100) + '%"></i>' : '');
      return '<span class="box ' + border + '">' + fills + '</span>';
    }).join('') + '</span>';
  }
  function suggestions() {
    var out = [];
    fig.alloc.bars.forEach(function (bar) {
      var have = bar.counted + bar.planned;
      if (have >= bar.need - EPS) return;
      var subj = {english: 'english', math: 'math', science: 'science', social: 'social', extra: 'science', additional: 'language'}[bar.key];
      var taking = data.courses.some(function (c) { return c.category === subj && c.grade === data.profile.grade; });
      var grade = Math.min(12, data.profile.grade + (taking ? 1 : 0));
      var reason = bar.key === 'extra' ? 'Counts toward extra English/math/science' : bar.key === 'additional' ? 'Counts toward the additional core courses' : 'Fills ' + bar.label + ': ' + C.num(have) + ' of ' + bar.need + ' so far';
      out.push({subject: subj, grade: grade, reason: reason});
    });
    return out.slice(0, 5);
  }
  function courseRow(c) {
    var ms = status(c), core = C.isCore(c), m = markOf(c);
    var counts = core && ms === 'approved';
    var sub = '';
    if (counts) sub += '<span role="button" tabindex="0" class="tick ' + (c.status === 'planned' ? 'outline' : 'solid') + '" data-act="alert" data-arg="counts:' + c.id + '" aria-label="Counts toward the 16">' + I.tick + '</span>';
    sub += '<span>' + (core ? h(unitsCaption(c)) : 'Not NCAA core') + '</span>';
    if (ms === 'excluded') sub += '<span role="button" tabindex="0" class="chip" data-act="alert" data-arg="excluded:' + c.id + '">Not approved ' + I.info + '</span>';
    else if (ms === 'unrecognized' && core) sub += '<span class="chip bad">Unrecognized</span>';
    else if (ms === 'unrecognized') sub += '<span role="button" tabindex="0" class="chip" data-act="alert" data-arg="notlisted:' + c.id + '">Not on NCAA’s list ' + I.info + '</span>';
    var side = c.status === 'completed' ? '<span class="code">' + (m ? C.markText(m) : '—') + '</span>' : c.status === 'inProgress' ? '<span class="chip now">Now</span>' : '<span class="chip">Planned</span>';
    return '<button type="button" class="cell' + (ui.flash === c.id ? ' flash' : '') + '" id="' + cellCourse(c) + '" data-act="editCourse" data-arg="' + c.id + '">' + (data.profile.province === 'ON' ? '<span class="lead">' + h(c.code) + '</span>' : '') + '<span class="main"><b>' + h(c.title) + '</b><span class="sub">' + sub + '</span></span><span class="side">' + side + '</span></button>';
  }
  function courses() {
    var t = fig.alloc.totals, toGo = t.required - t.counted;
    var out = '<div class="hdr"><div><span class="eyebrow">' + C.num(t.counted) + ' core counted · ' + C.num(t.completed) + ' complete</span><div class="title">Courses</div></div><button type="button" class="plus" data-act="addCourse" aria-label="Add course">' + I.plus + '</button></div><div class="list">';
    out += '<div class="sec"><div class="group"><div class="cell plain pad"><div class="head" style="display:flex;justify-content:space-between;margin-bottom:12px"><span class="eyebrow strong">The 16 core courses</span><span class="eyebrow">' + (toGo > EPS ? C.num(toGo) + ' to go' : 'all counted') + '</span></div>' +
      '<div class="slots-grid">' + fig.alloc.bars.map(function (bar) { return '<button type="button" class="slotcell" data-act="bucket" data-arg="' + bar.key + '"><span class="lab"><span>' + bar.label + '</span><span class="n dotted">' + C.num(bar.counted) + '/' + bar.need + '</span></span>' + boxes(bar) + '</button>'; }).join('') + '</div>' +
      '<div class="legend"><span><i style="background:var(--ink)"></i>Complete</span><span><i style="background:var(--amber)"></i>In progress</span><span><i style="background:rgba(128,145,166,.5)"></i>Planned</span></div><p class="caption secondary" style="margin:8px 0 0">Tap a subject to see what’s filling it.</p>';
    if (fig.tenSeven) out += '<div class="divider"></div><div class="rule-row"><div><div class="t">10/7 rule before Grade 12 <button type="button" data-act="alert" data-arg="tenSeven" aria-label="About the 10/7 rule">' + I.info + '</button></div><div class="c">' + C.num(Math.min(fig.tenSeven.core, 10)) + ' of 10 core · ' + C.num(Math.min(fig.tenSeven.ems, 7)) + ' of 7 English/math/science</div></div><span class="chip ' + (fig.tenSeven.met ? 'good' : 'now') + '">' + (fig.tenSeven.met ? 'On track' : 'In progress') + '</span></div>';
    if (fig.pace) out += '<div class="divider"></div><div class="rule-row"><div><div class="t">Core courses through Grade ' + fig.pace.grade + ' <button type="button" data-act="alert" data-arg="keepPace" aria-label="About keeping pace">' + I.info + '</button></div><div class="c">' + C.num(fig.pace.units) + ' of ' + fig.pace.target + ' · four a year keeps pace for 16</div></div><span class="chip ' + (fig.pace.behind ? 'now' : 'good') + '">' + (fig.pace.behind ? 'Light' : 'On pace') + '</span></div>';
    out += '</div></div></div>';
    var sug = suggestions();
    out += '<div class="sec"><div class="sec-h">Suggested for you</div><div class="group">' + (sug.length ? sug.map(function (s, i) { return '<button type="button" class="cell" data-act="push" data-arg="picker:' + i + '"><span class="lead">Gr ' + s.grade + '</span><span class="main"><b>' + C.SUBJECT[s.subject] + '</b><span class="sub">' + h(s.reason) + '</span></span>' + I.chev + '</button>'; }).join('') : '<div class="empty">Every NCAA core area is covered by your current plan.</div>') + '</div><div class="sec-f">Suggestions come from your province’s catalog. Check each course is on your school’s NCAA-approved list.</div></div>';
    [12, 11, 10, 9].forEach(function (g) {
      var list = data.courses.filter(function (c) { return c.grade === g; });
      if (!list.length) return;
      out += '<div class="sec"><div class="sec-h">Grade ' + g + '</div><div class="group">' + list.map(courseRow).join('') + '</div></div>';
    });
    return out + '</div>';
  }

  /* ---------- Marks ---------- */
  function marks() {
    var m = ui.marks, current = data.courses.filter(function (c) { return c.status === 'inProgress' && C.isCore(c); });
    var out = '<div class="hdr"><div><span class="eyebrow">Week of ' + C.fmt(C.today, '%b %-d') + '</span><div class="title">Marks</div></div><button type="button" class="plus" data-act="addAssignment" aria-label="Add assignment"' + (current.length ? '' : ' disabled') + '>' + I.plus + '</button></div>';
    var open = C.unmarked(data);
    out += '<div class="strip">';
    for (var i = 0; i < 7; i++) {
      var d = C.day(i), due = open.filter(function (a) { return C.daysBetween(d, a.due) === 0 || (i === 0 && a.due < C.today); });
      var worst = due.length ? due.map(function (a) { return C.urgency(a.due); }).sort(function (x, y) { return x.days - y.days; })[0] : null;
      out += '<button type="button" class="' + (m.day === i ? 'sel' : '') + '" data-act="markDay" data-arg="' + i + '"><span class="dw' + (i === 0 ? ' today' : '') + '">' + C.fmt(d, '%a') + '</span><span class="dn">' + d.getDate() + '</span><span class="dot' + (worst ? ' ubg-' + worst.key : '') + '"></span></button>';
    }
    out += '</div><div class="list">';
    out += '<div class="filters"><button type="button" class="' + (m.course === 'all' ? 'sel' : '') + '" data-act="markCourse" data-arg="all">All</button>' + current.map(function (c) { return '<button type="button" class="' + (m.course === c.id ? 'sel' : '') + '" data-act="markCourse" data-arg="' + c.id + '">' + h(displayCode(c)) + '</button>'; }).join('') + '</div>';
    var filtered = current.filter(function (c) { return m.course === 'all' || c.id === m.course; });
    if (filtered.length) {
      var entered = filtered.filter(function (c) { return c.mark; }).length;
      out += '<div class="sec"><button type="button" class="collapse' + (m.reportOpen ? ' open' : '') + '" data-act="toggleReport">Report card marks <span class="n">' + entered + ' of ' + filtered.length + '</span><svg viewBox="0 0 8 12"><path d="m1.5 1.5 4.5 4.5-4.5 4.5"/></svg></button>';
      if (m.reportOpen) out += '<div class="group">' + filtered.map(function (c) {
        var cap = !c.mark ? 'Not entered yet' : c.mark.received ? 'Report card · ' + C.fmt(c.mark.received, '%b %-d') : 'Report card';
        return '<button type="button" class="cell" data-act="editCourse" data-arg="' + c.id + '"><span class="main"><b>' + h(c.title) + '</b><span class="sub">' + cap + '</span></span><span class="side">' + (c.mark ? '<span class="code">' + C.markText(c.mark) + '</span>' : '<span class="footnote accent" style="font-weight:500">Add</span>') + '</span>' + I.chev + '</button>';
      }).join('') + '</div><div class="sec-f">Got a report card? Enter the mark here — it replaces the estimate from your assignments for that course.</div>';
      out += '</div>';
    }
    var list = open.filter(function (a) { return (m.course === 'all' || a.courseID === m.course) && (m.day == null || C.daysBetween(C.day(m.day), a.due) === 0 || (m.day === 0 && a.due < C.today)); });
    var heading = m.day == null ? 'Upcoming & due' : 'Due ' + C.fmt(C.day(m.day), '%a, %b %-d');
    out += '<div class="sec"><div class="sec-h plain">' + heading + '</div><div class="group">' + (list.length ? list.map(function (a) { return assignmentRow(a); }).join('') : '<div class="empty">' + (m.day == null ? 'Nothing due. Tap + to add an assignment.' : 'Nothing due that day.') + '</div>') + '</div></div>';
    var done = C.marked(data).filter(function (a) { return m.course === 'all' || a.courseID === m.course; });
    out += '<div class="sec"><div class="sec-h plain">Marked</div><div class="group">' + (done.length ? done.map(function (a) { return assignmentRow(a); }).join('') : '<div class="empty">No marks yet.</div>') + '</div></div>';
    return out + '</div>';
  }

  /* ---------- GPA ---------- */
  function gpa() {
    var g = fig.gpa, min = fig.minimum, division = data.profile.division === 'd1' ? 'Division I' : 'Division II';
    var chip = fig.review.length ? '<button type="button" class="chip bad" data-act="alert" data-arg="review">Needs review ' + I.info + '</button>' : g.gpa != null ? '<span class="chip ' + (fig.above ? 'good' : 'bad') + '">' + (fig.above ? 'Above' : 'Below') + ' ' + min + '</span>' : '';
    var out = '<div class="hdr"><div><span class="eyebrow">NCAA ' + division + ' · minimum ' + min + '</span><div class="title">GPA</div></div></div><div class="list">';
    out += '<div class="sec"><div class="group"><div class="cell plain pad"><div class="gpabig"><b>' + C.gpaText(g.gpa) + '</b><span class="sub">core GPA<br>' + C.num(g.units) + ' core units</span>' + chip + '</div>' +
      '<div class="scale"><span class="fill" style="width:' + (g.gpa != null ? (g.gpa / 4 * 100).toFixed(1) : 0) + '%"></span><span class="min" style="left:' + (min / 4 * 100).toFixed(1) + '%"></span></div><div class="scale-labels"><span>0.0</span><span>1.0</span><span>2.0</span><span>3.0</span><span>4.0</span></div></div></div>' +
      '<div class="sec-f">Uses completed final marks plus your current averages in NCAA core courses. The amber line is the ' + division + ' minimum.</div></div>';
    var focus = fig.cliffs.map(function (cl) {
      var span = cl.next.min - cl.current.min, prog = Math.min(1, (cl.percent - cl.current.min) / span);
      return '<div class="cell plain pad"><div style="display:flex;gap:10px;align-items:flex-start"><span class="good" style="flex:none;display:inline-grid"><svg viewBox="0 0 20 20" width="22" height="22"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="M7 13 13 7M8.5 7H13v4.5" fill="none" stroke="var(--surface)" stroke-width="1.8" stroke-linecap="round"/></svg></span><div style="flex:1"><div class="subhead">' + h(C.cliffHeadline(cl)) + '</div><div class="caption secondary" style="margin-top:2px">Now ' + C.percentText(cl.percent) + ' · core GPA would go to ' + C.gpaText(cl.projected) + '</div>' +
        '<div class="cliffbar"><span class="fill" style="width:' + (prog / 1.2 * 100).toFixed(1) + '%"></span><span class="mark" style="left:' + (100 / 1.2).toFixed(1) + '%"></span></div><div class="cliff-labels"><span>' + cl.current.min + ' · ' + cl.current.letter + '</span><b>' + cl.next.min + ' · ' + cl.next.letter + '</b></div></div></div></div>';
    }).join('') + fig.concerns.map(function (cc) {
      return '<div class="cell"><span class="ambertext" style="flex:none;display:inline-grid;width:22px">' + I.bulb.replace('<svg', '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"') + '</span><span class="main"><b>Repeated tough marks in ' + C.SUBJECT[cc.category] + '</b><span class="sub">' + cc.count + ' courses at a C or below — might be worth extra support there.</span></span></div>';
    }).join('');
    out += '<div class="sec"><div class="sec-h plain">Where to focus</div><div class="group">' + (focus || '<div class="empty">Nothing urgent right now — keep it up.</div>') + '</div><div class="sec-f">Cliff nudges only show for in-progress, percentage-graded courses within 5 points of the next grade band — not for finished courses, and not for BC grade 9 proficiency marks.</div></div>';
    var rows = data.courses.filter(function (c) { return C.isCore(c) && c.status !== 'planned'; }).sort(function (a, b) { return b.grade - a.grade || b.title.localeCompare(a.title); });
    out += '<div class="sec"><div class="sec-h plain">By course</div><div class="group">' + rows.map(function (c) {
      var ms = status(c), m = markOf(c), right;
      if (ms !== 'approved') right = ms === 'excluded' ? '<span class="chip">Not NCAA-approved</span>' : '<span class="chip bad">Unrecognized</span>';
      else if (!m) right = '<span class="chip ' + (c.status === 'completed' ? '' : 'now') + '">No marks</span>';
      else right = (m.kind === 'percentage' ? '<span class="code">' + C.percentText(m.value) + '</span>' : '') + '<span class="chip ' + (c.status === 'completed' ? 'core' : 'now') + '">' + C.letterText(m) + ' · ' + C.points(m).toFixed(1) + '</span>';
      return '<div class="cell"><span class="lead">' + (data.profile.province === 'ON' ? h(c.code) : 'Gr ' + c.grade) + '</span><span class="main"><b>' + h(c.title) + '</b><span class="sub">Grade ' + c.grade + ' · ' + C.markBasis(data, c) + '</span></span><span class="side">' + right + '</span></div>';
    }).join('') + '</div><div class="sec-f">Amber means the course is still in progress, so its mark can move before the course ends. Plain marks are final.</div></div>';
    out += '<div class="sec"><div class="sec-h plain">Conversion used</div><div class="group">' + C.BANDS.map(function (b) { return '<div class="cell"><span class="main">' + b.range + '</span><span class="chip core">' + b.letter + ' <span class="code">' + b.points.toFixed(1) + '</span></span></div>'; }).join('') + '</div><div class="sec-f">From the NCAA Eligibility Center’s BC outline (Sep 2026). Grade 9 marks issued 2023 and after use proficiency descriptors, not percentages, and aren’t covered by this scale.</div></div>';
    return out + '</div>';
  }

  /* ---------- Hockey ---------- */
  function sessionRow(s) {
    var title = C.KIND[s.kind] + (s.title ? ' · ' + s.title : '');
    var cap = [C.fmt(s.date, '%a')].concat(s.start != null ? [C.clock(s.start)] : [], [C.duration(s.minutes)], s.travel ? ['+' + C.duration(s.travel) + ' travel'] : []).join(' · ');
    var played = s.kind === 'game' && s.date <= C.today;
    var right = played ? (s.toi != null ? '<span class="code">' + C.toi(s.toi) + '</span><span class="caption2 secondary">on ice</span>' : '<span class="footnote accent" style="font-weight:500">Add time</span>') : '';
    return '<button type="button" class="cell" data-act="editSession" data-arg="' + s.id + '"><span class="datebox"><span class="m">' + C.fmt(s.date, '%b') + '</span><span class="d">' + s.date.getDate() + '</span></span><span class="main"><b>' + h(title) + '</b><span class="sub">' + h(cap) + '</span>' + (s.by ? '<span class="sub caption2">Added by ' + h(s.by) + ' from the web</span>' : '') + '</span><span class="side">' + right + '</span></button>';
  }
  function hockey() {
    var ice = fig.ice, w = ice.week;
    var out = '<div class="hdr"><div><span class="eyebrow">' + ice.seasonLabel + ' season</span><div class="title">Hockey</div></div><button type="button" class="plus" data-act="addSession" aria-label="Add session">' + I.plus + '</button></div><div class="list">';
    var max = Math.max(60, Math.max.apply(null, ice.weeks.map(function (x) { return x.logged + x.planned; })));
    out += '<div class="sec"><div class="group"><div class="cell plain" style="padding:14px"><div class="stats">' +
      '<div class="stat"><div class="l">This week</div><div class="v">' + C.hours(w.minutes) + '<small>h</small></div><div class="n">' + (w.planned ? C.hours(w.planned) + ' h to come' : '') + '</div></div>' +
      '<div class="stat"><div class="l">This month</div><div class="v">' + C.hours(ice.month) + '<small>h</small></div><div class="n"></div></div>' +
      '<div class="stat"><div class="l">Season</div><div class="v">' + C.hours(ice.season) + '<small>h</small></div><div class="n">' + (ice.seasonTravel ? '+' + C.hours(ice.seasonTravel) + ' h travel' : '') + '</div></div></div>' +
      '<div class="chart">' + ice.weeks.map(function (x) {
        var tot = x.logged + x.planned, pl = Math.round(x.logged / max * 72), up = Math.round(x.planned / max * 72);
        return '<div class="col"><span class="hl">' + (tot ? C.hours(tot) : '') + '</span><span class="bar">' + (tot ? (up ? '<i class="up" style="height:' + up + 'px"></i>' : '') + (pl ? '<i class="pl" style="height:' + pl + 'px"></i>' : '') : '<i class="z"></i>') + '</span><span class="bl' + (x.current ? ' now' : '') + '">' + (x.current ? 'NOW' : C.fmt(x.start, '%m/%d')) + '</span></div>';
      }).join('') + '</div><div class="ckey"><span><i style="background:var(--ink)"></i>Played</span><span><i style="background:var(--amber)"></i>Coming up</span><span class="r">Hours a week</span></div></div></div></div>';
    if (fig.clashes.length) out += '<div class="sec"><div class="sec-h plain">Heads up</div><div class="group">' + fig.clashes.map(function (cl) {
      var c = C.courseOf(data, cl.assignment);
      return '<button type="button" class="cell" data-act="tabMarks" data-arg="' + cl.assignment.id + '" style="align-items:flex-start"><span class="icon" style="width:32px;height:32px;border-radius:10px;background:rgba(245,163,0,.16);display:grid;place-items:center;color:var(--amber-text);flex:none">' + I.warn.replace('var(--on-ink)', 'var(--surface)') + '</span><span class="main"><b>' + h(cl.assignment.title) + '</b><span class="sub">' + h(displayCode(c)) + ' · ' + cl.dueText + '</span><span class="sub">' + h(cl.conflict) + '</span><span class="sub ambertext" style="font-weight:600">' + h(cl.advice) + '</span></span>' + I.chev + '</button>';
    }).join('') + '</div><div class="sec-f">Work due in the next two weeks with 5 hours or more of hockey, travel included, on the due date and the two days before it.</div></div>';
    if (ice.gamesPlayed) out += '<div class="sec"><div class="sec-h plain">Games this season</div><div class="group"><div class="cell"><span class="main">Played</span><span class="code">' + ice.gamesPlayed + '</span></div>' +
      '<div class="cell"><span class="main">Average time on ice</span><span class="side">' + (ice.averageTOI != null ? '<span class="code">' + C.toi(ice.averageTOI) + '</span><span class="caption2 secondary">over ' + ice.toiGames + ' ' + (ice.toiGames === 1 ? 'game' : 'games') + '</span>' : '<span class="caption secondary">—</span>') + '</span></div>' +
      '<div class="cell"><span class="main">Last game</span><span class="code">' + (ice.lastTOI != null ? C.toi(ice.lastTOI) : '—') + '</span></div></div></div>';
    function block(title, list, all, key, emptyText) {
      var shown = all ? list : list.slice(0, 6);
      return '<div class="sec"><div class="sec-h plain">' + title + '</div><div class="group">' + (list.length ? shown.map(sessionRow).join('') + (list.length > 6 ? '<button type="button" class="showmore" data-act="showMore" data-arg="' + key + '">' + (all ? 'Show fewer' : 'Show all ' + list.length) + '</button>' : '') : '<div class="empty">' + emptyText + '</div>') + '</div></div>';
    }
    out += block('Coming up', ice.upcoming, ui.hockey.allUp, 'allUp', 'Nothing scheduled. Tap + to add a practice or a game.') + block('Logged', ice.logged, ui.hockey.allLog, 'allLog', 'Nothing logged yet.');
    return out + '</div>';
  }

  /* ---------- Profile and the subject picker (pushed screens) ---------- */
  function navbar(title) { return '<div class="navbar"><button type="button" class="back" data-act="pop">' + I.chevLeft + 'Back</button><span class="ttl">' + title + '</span><span></span></div>'; }
  function toggle(on, act) { return '<button type="button" class="toggle' + (on ? ' on' : '') + '" role="switch" aria-checked="' + on + '" data-act="' + act + '"></button>'; }
  function profile() {
    var p = data.profile, clk = fig.clock, pr = ui.prefs;
    var months = ['Not set'].concat(C.MONTHS), years = [];
    for (var y = 2005; y <= 2014; y++) years.push(y);
    var out = navbar('Profile') + '<div class="list"><div style="display:grid;justify-items:center;gap:8px;padding:6px 0 4px"><span class="initials big">' + h(p.initials) + '</span><span class="display" style="font-size:26px">' + h(p.name) + '</span><span class="eyebrow">Gr ' + p.grade + ' · ' + p.provinceName + ' · ' + (p.division === 'd1' ? 'Division I' : 'Division II') + '</span></div>';
    out += '<div class="sec"><div class="group"><div class="cell"><span class="main">Core16 advisor</span><span class="chip good">Linked</span>' + I.chev + '</div></div><div class="sec-f">Link this phone to your advisor and send your record for review.</div></div>';
    out += '<div class="sec form"><div class="sec-h">Student</div><div class="group">' +
      '<label class="field wide"><span class="lab">Name</span><input type="text" value="' + h(p.name) + '" data-bind="name"></label>' +
      '<div class="field"><span class="lab">Province</span><span class="val">' + p.provinceName + '</span></div>' +
      '<label class="field"><span class="lab">Current grade</span><select data-bind="grade">' + [9, 10, 11, 12].map(function (g) { return '<option value="' + g + '"' + (g === p.grade ? ' selected' : '') + '>Grade ' + g + '</option>'; }).join('') + '</select></label>' +
      '<label class="field wide"><span class="lab">School</span><input type="text" value="' + h(p.school) + '" data-bind="school"></label></div><div class="sec-f">Your province sets which courses and suggestions you see. The demo stays in British Columbia: the sample record is Maya’s.</div></div>';
    out += '<div class="sec form"><div class="sec-h">Athletics</div><div class="group">' +
      '<label class="field"><span class="lab">Graduation year</span><select data-bind="gradYear">' + [2026, 2027, 2028, 2029, 2030, 2031].map(function (y) { return '<option value="' + y + '"' + (y === p.gradYear ? ' selected' : '') + '>' + y + ' · from Sept ' + (y - 4) + '</option>'; }).join('') + '</select></label>' +
      '<div class="field"><span class="lab">Target division</span><span class="seg small" style="width:180px"><button type="button" class="' + (p.division === 'd1' ? 'sel' : '') + '" data-act="division" data-arg="d1">Division I</button><button type="button" class="' + (p.division === 'd2' ? 'sel' : '') + '" data-act="division" data-arg="d2">Division II</button></span></div>' +
      (p.division === 'd1' ? '<div class="field"><span class="lab">US high school</span>' + toggle(p.attendsUSSchool, 'toggleUS') + '</div>' : '') + '</div>' +
      '<div class="sec-f">' + (p.division === 'd1' ? 'Division I: 16 core courses and a 2.3 core GPA. Turn on US high school if you’ve attended, or plan to attend, a US school for any part of high school — for example a prep year. Only then does NCAA also require 10 core courses (7 in English, math or science) done before Grade 12.' : 'Division II: 16 core courses and a 2.2 core GPA.') + '</div></div>';
    out += '<div class="sec form"><div class="sec-h">Five-year clock</div><div class="group">' +
      '<label class="field"><span class="lab">Birth month</span><select data-bind="birthMonth">' + months.map(function (m, i) { return '<option value="' + i + '"' + (i === (p.birthMonth || 0) ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span class="lab">Birth year</span><select data-bind="birthYear"><option value="0"' + (!p.birthYear ? ' selected' : '') + '>Not set</option>' + years.map(function (y) { return '<option value="' + y + '"' + (y === p.birthYear ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select></label>' +
      '<div class="field"><span class="lab">Clock starts</span><span class="val">' + (clk ? 'Fall ' + clk.startYear : !p.birthMonth && !p.birthYear ? 'Add both to see' : !p.birthMonth ? 'Add birth month to see' : 'Add birth year to see') + '</span></div></div><div class="sec-f">' + h(C.clockExplanation(p)).replace(/\n\n/g, '<br><br>') + '</div></div>';
    out += '<div class="sec form"><div class="sec-h">NCAA Eligibility Center</div><div class="group"><label class="field wide"><span class="lab">NCAA ID</span><input type="text" value="' + h(p.ncaaID) + '" data-bind="ncaaID" placeholder="From eligibilitycenter.org"></label>' +
      '<div class="cell plain"><div class="callout">' + I.warn.replace('currentColor', 'var(--amber)').replace('var(--on-ink)', 'var(--surface)') + '<div><b>Use this as your BC transcript security answer</b>When the Eligibility Center pulls your transcript from the BC Ministry of Education, staff have to answer a security question. The outline says to set that answer to your NCAA ID — missing it stalls processing for weeks.</div></div></div></div><div class="sec-f">Register at eligibilitycenter.org to get your NCAA ID.</div></div>';
    out += '<div class="sec form"><div class="sec-h">Course picker</div><div class="group"><div class="field"><span class="lab">Show AP courses</span>' + toggle(pr.showAP, 'pref:showAP') + '</div><div class="field"><span class="lab">Show IB Diploma courses</span>' + toggle(pr.showIB, 'pref:showIB') + '</div></div><div class="sec-f">Off by default — most students aren’t enrolled in either program, so hiding them keeps the Add-course picker to what applies to you. Turn one on if you are.</div></div>';
    out += '<div class="sec form"><div class="sec-h">Appearance</div><div class="group"><div class="field"><span class="seg small" style="width:100%">' + ['system', 'dark', 'light'].map(function (t) { return '<button type="button" class="' + (pr.theme === t ? 'sel' : '') + '" data-act="theme" data-arg="' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>'; }).join('') + '</span></div></div><div class="sec-f">Core16 follows your phone’s light or dark setting. Choose Dark or Light to keep it one way.</div></div>';
    out += '<div class="sec form"><div class="sec-h">Notifications</div><div class="group"><div class="field"><span class="lab">Remind me about due assignments</span>' + toggle(pr.notify, 'pref:notify') + '</div>' + (pr.notify ? '<div class="field"><button type="button" class="accent" data-act="alert" data-arg="testNotify">Send a test notification</button></div>' : '') + '</div><div class="sec-f">A reminder the evening before and the morning an assignment is due, for anything not yet marked.' + (pr.notify ? ' The test notification arrives in about 5 seconds.' : '') + '</div></div>';
    out += '<div class="sec form"><div class="sec-h">Calendar</div><div class="group"><div class="field"><span class="lab">Add assignments to Calendar</span>' + toggle(pr.calendar, 'pref:calendar') + '</div></div><div class="sec-f">Adds unmarked assignments to a dedicated "Core16" calendar, with an alert timed by the "Remind me" choice on each one.</div></div>';
    out += '<div class="sec form"><div class="sec-h">Getting started</div><div class="group"><div class="field"><button type="button" class="accent" data-act="alert" data-arg="notInDemo">Show me around</button></div></div><div class="sec-f">The quick look at each tab that the app opened with.</div></div>';
    out += '<div class="sec form"><div class="sec-h">Demo</div><div class="group"><div class="field"><span class="lab">Show taps</span>' + toggle(pr.showTaps, 'pref:showTaps') + '</div>' +
      [['Jordan Reyes', 'Ontario · Grade 9 · second semester'], ['Theo Okafor', 'Ontario · Grade 11 in progress'], ['Ava Dhillon', 'British Columbia · Grade 9 · second semester'], ['Maya Chen', 'British Columbia · Grade 11 in progress']].map(function (d) { return '<div class="field" style="min-height:52px"><button type="button" class="destructive" data-act="alert" data-arg="persona:' + d[0] + '"><span style="display:block;font-weight:500">' + d[0] + '</span><span class="caption secondary" style="display:block">' + d[1] + '</span></button></div>'; }).join('') + '</div>' +
      '<div class="sec-f">Show taps draws a circle wherever you touch, so people watching a mirrored or recorded screen can follow along. Sample students and marks are fictional. The grade 9 students are in their first year of high school with one semester finished, which is who the app is aimed at; the grade 11 students have two years of marks behind them.</div></div>';
    out += '<div class="sec form"><div class="group"><div class="field"><button type="button" class="destructive" data-act="alert" data-arg="resetApp">Reset Core16</button></div></div><div class="sec-f">Clears everything and opens on the welcome, as a new install would. Notification and Calendar permissions stay as you set them in the phone’s Settings.</div></div>';
    out += '<div class="sec"><div class="group"><div class="cell"><span class="main">Core16</span><span class="secondary">0.2 (demo)</span></div></div></div></div>';
    return out;
  }
  function subjectPicker(i) {
    var s = suggestions()[i];
    if (!s) { ui.push = null; return courses(); }
    var list = BC_COURSES.approved.filter(function (c) { return c.category === s.subject && c.grade === s.grade; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
    var groups = s.subject === 'language' ? languageGroups(list) : [[null, list]];
    return navbar(C.SUBJECT[s.subject]) + '<div class="list">' + groups.map(function (g) { return '<div class="sec">' + (g[0] ? '<div class="sec-h">' + g[0] + '</div>' : '') + '<div class="group">' + g[1].map(function (c) {
      var on = data.courses.some(function (x) { return C.normalizeTitle(x.title) === C.normalizeTitle(c.title); });
      return '<button type="button" class="cell' + (on ? ' prow dim' : '') + '" data-act="' + (on ? 'none' : 'pickSuggested') + '" data-arg="' + h(c.title) + '|' + c.grade + '"><span class="main"><b>' + h(c.title) + '</b>' + (on ? '<span class="sub">On your timetable</span>' : '') + '</span></button>';
    }).join('') + '</div></div>'; }).join('') + '</div>';
  }
  function languageGroups(list) {
    var groups = {'Core French': [], 'Extended French': [], 'French Immersion': [], 'French (Native Language)': [], 'Other languages': []};
    list.forEach(function (c) {
      var t = c.title.toLowerCase();
      if (t.indexOf('core french') === 0) groups['Core French'].push(c);
      else if (t.indexOf('extended french') === 0) groups['Extended French'].push(c);
      else if (t.indexOf('immersion') >= 0 || t.indexOf('langue seconde') >= 0) groups['French Immersion'].push(c);
      else if (t.indexOf('langue première') >= 0 || t.indexOf('études littéraires') >= 0 || t.indexOf('français') === 0) groups['French (Native Language)'].push(c);
      else groups['Other languages'].push(c);
    });
    return Object.keys(groups).filter(function (k) { return groups[k].length; }).map(function (k) { return [k, groups[k]]; });
  }

  /* ---------- sheets ---------- */
  function sheetShell(opts) {
    return '<div class="overlay" data-act="closeSheetBackdrop"><div class="sheet' + (opts.medium ? ' medium' : '') + '" data-stop="1"><div class="grab"></div><div class="sh-nav"><span>' + (opts.left || '') + '</span><span class="ttl">' + opts.title + '</span><span class="r">' + (opts.right || '') + '</span></div>' +
      (opts.top ? '<div class="sh-top" id="sh-top">' + opts.top + '</div>' : '') + '<div class="sh-body" id="sh-body">' + opts.body + '</div>' + (opts.foot ? '<div class="sh-foot" id="sh-foot">' + opts.foot + '</div>' : '') + '</div></div>';
  }
  function paintSheet() {
    var s = ui.sheet;
    if (!s) { ov.innerHTML = ''; return; }
    var html = {add: addSheet, edit: editSheet, bucket: bucketSheet, assignment: assignmentSheet, session: sessionSheet}[s.kind]();
    ov.innerHTML = html;
  }
  function refreshSheetParts() {
    var s = ui.sheet; if (!s) return;
    var html = {add: addSheet, edit: editSheet, bucket: bucketSheet, assignment: assignmentSheet, session: sessionSheet}[s.kind]();
    var tmp = document.createElement('div'); tmp.innerHTML = html;
    ['sh-body', 'sh-foot'].forEach(function (id) { var a = document.getElementById(id), b = tmp.querySelector('#' + id); if (a && b && !(s.kind === 'add' && s.form.mode === 'typed' && id === 'sh-body')) a.innerHTML = b.innerHTML; });
  }

  /* Add course */
  function pickerGroups(grade, query) {
    var q = C.normalizeTitle(query), list = BC_COURSES.approved.filter(function (c) { return c.grade === grade; });
    var pr = ui.prefs;
    function matches(c, groupName) { if (!q) return true; return C.normalizeTitle(c.title).indexOf(q) >= 0 || (c.code && c.code.toLowerCase().indexOf(q) >= 0) || groupName.toLowerCase().indexOf(q) === 0; }
    var defs = [['English', function (c) { return c.category === 'english' && !/first peoples|^efp/i.test(c.title); }],
                ['English First Peoples', function (c) { return c.category === 'english' && /first peoples|^efp/i.test(c.title); }],
                ['Math', function (c) { return c.category === 'math'; }], ['Science', function (c) { return c.category === 'science'; }], ['Social science', function (c) { return c.category === 'social'; }]];
    var groups = [];
    var isAP = function (c) { return /^AP /.test(c.title); }, isIB = function (c) { return /^IB /.test(c.title) || /^(Extended Essay|Theory of Knowledge)/.test(c.title); };
    var plain = list.filter(function (c) { return !isAP(c) && !isIB(c); });
    defs.forEach(function (d) { var g = plain.filter(function (c) { return d[1](c) && matches(c, d[0]); }); if (g.length) groups.push([d[0], g, 'Approved', 'good']); });
    languageGroups(plain.filter(function (c) { return c.category === 'language'; })).forEach(function (g) { var m = g[1].filter(function (c) { return matches(c, g[0]); }); if (m.length) groups.push([g[0], m, 'Approved', 'good']); });
    var nc = plain.filter(function (c) { return c.category === 'nonCore' && matches(c, 'Not NCAA core'); }); if (nc.length) groups.push(['Not NCAA core', nc, 'Not approved', '']);
    if (pr.showAP) { var ap = list.filter(function (c) { return isAP(c) && matches(c, 'AP'); }); if (ap.length) groups.push(['AP', ap, 'Approved', 'good']); }
    if (pr.showIB) { var ib = list.filter(function (c) { return isIB(c) && matches(c, 'IB Diploma'); }); if (ib.length) groups.push(['IB Diploma', ib, 'Approved', 'good']); }
    groups.forEach(function (g) { g[1].sort(function (a, b) { return a.title.localeCompare(b.title); }); });
    return groups;
  }
  function onTimetable(title) { return data.courses.some(function (x) { return C.normalizeTitle(x.title) === C.normalizeTitle(title); }); }
  function ministryMatches(grade, query) {
    var q = C.normalizeTitle(query); if (!q) return [];
    return BC_COURSES.ministry.filter(function (c) { return c.grade === grade && C.normalizeTitle(c.title).indexOf(q) >= 0; }).sort(function (a, b) { return a.title.localeCompare(b.title); });
  }
  var MINISTRY_SUBJECT = {'english-language-arts': 'english', 'mathematics': 'math', 'science': 'science', 'social-studies': 'social', 'languages': 'language', 'fral': 'language', 'francais-langue-premiere': 'language'};
  var SUBJECT_OPTIONS = [['', 'Choose'], ['english', 'English'], ['math', 'Math'], ['science', 'Science'], ['social', 'Social science'], ['language', 'Language, philosophy or religion'], ['nonCore', 'Other subject (arts, phys ed, tech…)']];
  function prow(c, picked, extra) {
    var on = onTimetable(c.title);
    return '<button type="button" class="prow' + (picked ? ' sel' : '') + (on ? ' dim' : '') + '" data-act="' + (on ? 'none' : 'pick') + '" data-arg="' + h(c.title) + '|' + c.grade + '">' + (c.code ? '<span class="lead">' + h(c.code) + '</span>' : '') + '<span class="main">' + h(c.title) + (extra ? '<span class="cap">' + extra + '</span>' : '') + '</span>' + (on ? '<span class="on">On your timetable</span>' : '<span class="radio">' + (picked ? I.check : '') + '</span>') + '</button>';
  }
  function typedResolve(f) {
    var t = f.typed.title.trim(); if (!t) return {state: 'empty'};
    var entry = C.catalogEntry(t);
    if (entry) return {state: 'catalog', entry: entry};
    var st = C.bcStatus(t);
    return {state: st === 'excluded' ? 'excluded' : 'unrecognized'};
  }
  function pickedCourse(f) {
    if (f.mode === 'typed') {
      var r = typedResolve(f); if (r.state === 'empty') return null;
      if (r.state === 'catalog') return Object.assign({}, r.entry, {typed: false});
      var units = {4: 1, 3: 0.75, 2: 0.5, 1: 0.25}[f.typed.credit] || 1;
      return {title: f.typed.title.trim(), code: f.typed.code.trim(), grade: f.grade, category: r.state === 'excluded' ? 'nonCore' : (f.typed.subject || null), units: r.state === 'excluded' ? 1 : units, typed: true, needsSubject: !f.typed.subject && r.state !== 'excluded'};
    }
    return f.picked;
  }
  function addSheet() {
    var f = ui.sheet.form, grade = f.grade, hasCodes = false;
    var top = '<div class="seg">' + [9, 10, 11, 12].map(function (g) { return '<button type="button" class="' + (g === grade ? 'sel' : '') + '" data-act="addGrade" data-arg="' + g + '">Gr ' + g + '</button>'; }).join('') + '</div>' +
      (f.mode === 'list' ? '<div class="search' + (f.query ? ' has' : '') + '" id="search">' + I.mag + '<input type="text" placeholder="Search by name" value="' + h(f.query) + '" data-bind="query" autocomplete="off" aria-label="Search"><button type="button" class="clear" data-act="clearQuery" aria-label="Clear">✕</button></div>' : '');
    var body = '';
    if (f.mode === 'list') {
      var groups = pickerGroups(grade, f.query);
      groups.forEach(function (g) { body += '<div class="pcard"><div class="ph"><span class="eyebrow strong">' + h(g[0]) + '</span><span class="chip ' + g[3] + '">' + g[2] + '</span></div>' + g[1].map(function (c) { return prow(c, f.picked && f.picked.title === c.title && f.picked.grade === c.grade); }).join('') + '</div>'; });
      var mins = ministryMatches(grade, f.query);
      if (mins.length) body += '<div class="pcard"><div class="ph"><span class="eyebrow strong">Other British Columbia courses</span></div>' + mins.map(function (c) { var on = onTimetable(c.title); return '<button type="button" class="prow' + (on ? ' dim' : '') + '" data-act="' + (on ? 'none' : 'typedFrom') + '" data-arg="' + h(c.title) + '|' + (MINISTRY_SUBJECT[c.subject] || '') + '"><span class="main">' + h(c.title) + '</span>' + (on ? '<span class="on">On your timetable</span>' : '<span class="chip">Not on NCAA’s list</span>') + '</button>'; }).join('') + '</div><p class="pnote">Courses British Columbia offers in this grade that aren’t in NCAA’s list above. Choosing one adds it as a typed-in course, checked against NCAA’s list.</p>';
      if (!groups.length && f.query) {
        var others = BC_COURSES.approved.filter(function (c) { return c.grade !== grade && C.normalizeTitle(c.title).indexOf(C.normalizeTitle(f.query)) >= 0; }).sort(function (a, b) { return a.grade - b.grade || a.title.localeCompare(b.title); });
        if (others.length) body += '<div class="pcard"><div class="ph"><span class="eyebrow strong">NCAA’s list, other grades</span></div>' + others.map(function (c) { return prow(c, false, 'Grade ' + c.grade); }).join('') + '</div><p class="pnote">Nothing in this grade matches. Choosing one of these switches to its grade.</p>';
        var mothers = BC_COURSES.ministry.filter(function (c) { return c.grade !== grade && C.normalizeTitle(c.title).indexOf(C.normalizeTitle(f.query)) >= 0; }).sort(function (a, b) { return a.grade - b.grade || a.title.localeCompare(b.title); });
        if (mothers.length) body += '<div class="pcard"><div class="ph"><span class="eyebrow strong">Other British Columbia courses, other grades</span></div>' + mothers.map(function (c) { return '<button type="button" class="prow" data-act="typedFromGrade" data-arg="' + h(c.title) + '|' + (MINISTRY_SUBJECT[c.subject] || '') + '|' + c.grade + '"><span class="main">' + h(c.title) + '<span class="cap">Grade ' + c.grade + '</span></span><span class="chip">Not on NCAA’s list</span></button>'; }).join('') + '</div><p class="pnote">Not in NCAA’s list. Choosing one switches to its grade and adds it as a typed-in course, checked against NCAA’s list.</p>';
      }
      var nothing = !groups.length && !mins.length && f.query;
      body += '<div class="pcard"><button type="button" class="linkbtn" data-act="typedMode">' + I.pencil + (f.query ? 'Enter “' + h(f.query) + '” yourself' : 'Enter a course that isn’t listed') + '</button></div><p class="pnote">' + (nothing ? 'No course in the list matches that. You can type it in instead, and it’s checked against NCAA’s list as you go.' : 'For a course that isn’t in the list, like a locally developed or board-authorized course. It’s checked against NCAA’s list as you type.') + '</p>';
    } else {
      var r = typedResolve(f), needs = r.state === 'unrecognized' || (r.state === 'empty');
      body = '<div class="form"><div class="group"><label class="field wide"><span class="lab">Course name</span><input type="text" value="' + h(f.typed.title) + '" data-bind="typed.title" placeholder="As the report card shows it"></label><label class="field wide"><span class="lab">Course code</span><input type="text" value="' + h(f.typed.code) + '" data-bind="typed.code" placeholder="Optional" style="text-transform:uppercase"></label>' +
        (needs ? '<label class="field"><span class="lab">NCAA subject</span><select data-bind="typed.subject">' + SUBJECT_OPTIONS.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f.typed.subject ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
          (grade >= 10 ? '<label class="field"><span class="lab">Credit</span><select data-bind="typed.credit">' + [4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (String(n) === String(f.typed.credit) ? ' selected' : '') + '>' + n + ' ' + (n === 1 ? 'credit' : 'credits') + '</option>'; }).join('') + '</select></label>' : '') : '') +
        '</div></div><button type="button" class="linkbtn" data-act="listMode">Choose from the course list instead</button><p class="pnote" id="typed-note">' + typedNote(f) + '</p>';
    }
    var picked = pickedCourse(f), foot = '';
    if (picked) foot += '<div class="pending">' + (picked.code ? '<span class="code accent">' + h(picked.code) + '</span>' : '') + '<span class="nm">' + h(picked.title) + '</span><span class="det">' + (picked.category ? C.SUBJECT[picked.category] + ' · ' + C.unitsWord(picked.units) : 'Subject to choose') + '</span></div>';
    else foot += '<div class="pending secondary">' + (f.mode === 'typed' ? 'Fill in the course below' : 'Choose a course from the list') + '</div>';
    if (picked && C.bcStatus(picked.title) === 'excluded') foot += '<p class="caption secondary" style="margin:0">NCAA names this course as not core, so it won’t count toward your 16 core courses or your core GPA.</p>';
    if (f.error) foot += '<p class="err" style="margin:0">' + h(f.error) + '</p>';
    if (f.status === 'completed') foot += (grade === 9 ? '<div class="field"><span>Proficiency</span><select data-bind="proficiency"><option value="">Not yet assessed</option>' + Object.keys(C.PROFICIENCY).map(function (k) { return '<option value="' + k + '"' + (f.proficiency === k ? ' selected' : '') + '>' + C.PROFICIENCY[k][0] + '</option>'; }).join('') + '</select></div><p class="caption secondary" style="margin:0">BC grade 9 (2023 curriculum) reports a proficiency level instead of a percentage.</p>' :
      '<div class="field"><span>Final mark (%)</span><input type="text" inputmode="decimal" placeholder="e.g. 84" value="' + h(f.mark) + '" data-bind="mark"></div><p class="caption secondary" style="margin:0">Enter the final percentage from your report card.</p>');
    foot += '<div class="seg">' + [['planned', 'Planned'], ['inProgress', 'Taking now'], ['completed', 'Completed']].map(function (s) { return '<button type="button" class="' + (f.status === s[0] ? 'sel' : '') + '" data-act="addStatus" data-arg="' + s[0] + '">' + s[1] + '</button>'; }).join('') + '</div>';
    foot += '<button type="button" class="primary" data-act="addConfirm">' + (picked ? 'Add ' + h(picked.title) : 'Add course') + '</button>';
    return sheetShell({title: 'Add course', left: '<button type="button" data-act="closeSheet">Cancel</button>', right: '<span class="eyebrow">BC</span>', top: top, body: body, foot: foot});
  }
  function typedNote(f) {
    var r = typedResolve(f), t = f.typed;
    if (r.state === 'empty') return 'Enter the name exactly as your report card shows it. BC courses are matched to NCAA’s list by name.';
    if (r.state === 'catalog') return 'That’s ' + h(r.entry.title) + ', Grade ' + r.entry.grade + ', which is already in the course list, so it will be added as that course.' + (r.entry.category === 'nonCore' ? ' NCAA doesn’t accept it as a core course.' : '');
    if (r.state === 'excluded') return 'NCAA doesn’t accept this course as core, so it won’t count toward your 16 core courses.';
    var guessed = t.subjectGuessed ? ' Subject filled in from BC’s course list. Change it if your school files it differently.' : '';
    if (!t.subject) return 'Choose the course’s NCAA subject.' + guessed;
    if (t.subject === 'nonCore') return 'This course isn’t on NCAA’s approved list. Filed under Other subject, it doesn’t count toward your 16 core courses or GPA and doesn’t affect "On track", though your Core16 advisor will still see it. If it’s really an English, math, science, social science or language course, choose that subject instead.' + guessed;
    if (f.status === 'planned') return 'This course isn’t on NCAA’s approved list, so it wouldn’t count toward your 16 core courses or GPA. Now is the easy time to change it: ask your school counsellor or Core16 advisor about an approved course to take instead.' + guessed;
    if (f.status === 'completed') return 'This course isn’t on NCAA’s approved list, so it doesn’t count toward your 16 core courses or GPA. It also holds back "On track" while it’s here. Your school can ask NCAA to look at it, using the ministry’s own description of the course — your Core16 advisor or school counsellor can start that. NCAA may still say no, so plan to reach your 16 core courses without it. Check the code and name against your report card first. If they’re right, leave it here so your advisor sees it.' + guessed;
    return 'This course isn’t on NCAA’s approved list, so it doesn’t count toward your 16 core courses or GPA. It also holds back "On track" while it’s here. NCAA decides courses outside its list case by case, so don’t count on this one. Check the code and name against your report card first. If they’re right, ask your school counsellor whether you can still switch.' + guessed;
  }
  function addCourseNow(picked, f) {
    var mark = null;
    if (f.status === 'completed') mark = f.grade === 9 ? {kind: 'proficiency', level: f.proficiency} : {kind: 'percentage', value: Number(f.mark)};
    data.courses.push({id: C.nextID(), title: picked.title, code: picked.code || '', grade: picked.grade, category: picked.category, units: picked.units, status: f.status, mark: mark, typed: !!picked.typed});
    closeSheet(); render();
  }

  /* Edit course */
  function editSheet() {
    var s = ui.sheet, c = s.course, f = s.form, ms = status(c), core = C.isCore(c);
    var body = '<div class="form"><div class="group"><div class="field"><span class="lab">Course</span><span class="val">' + (c.code ? h(c.code) + ' · ' : '') + h(c.title) + '</span></div><div class="field"><span class="lab">NCAA</span><span class="val">' + C.SUBJECT[c.category] + '</span></div>' +
      (core ? '<div class="field"><span class="lab">NCAA match</span><span class="chip ' + (ms === 'approved' ? 'good' : ms === 'excluded' ? '' : 'bad') + '">' + (ms === 'approved' ? 'Approved' : ms === 'excluded' ? 'Not approved' : 'Unrecognized') + '</span></div>' : '') +
      '<label class="field"><span class="lab">Status</span><select data-bind="status">' + [['completed', 'Completed'], ['inProgress', 'Taking now'], ['planned', 'Planned']].map(function (o) { return '<option value="' + o[0] + '"' + (f.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' +
      (ms === 'excluded' && core ? '<p class="pnote">NCAA doesn’t accept this course as core, so it doesn’t count toward your 16 core courses.</p>' : ms === 'unrecognized' && core ? '<p class="pnote">This course isn’t on NCAA’s approved list, so it doesn’t count toward your 16 core courses or GPA. It also holds back "On track" while it’s here. If it was mistyped, remove it and add it again. If not, ' + (c.status === 'completed' ? 'your school can ask NCAA to look at it, using the ministry’s own description of the course — your Core16 advisor or school counsellor can start that.' : 'ask your school counsellor whether you can still switch to a course NCAA counts.') + '</p>' : '') + '</div>';
    if (f.status !== 'planned') {
      if (c.grade === 9) body += '<div class="form"><div class="group"><label class="field"><span class="lab">' + (f.status === 'completed' ? 'Proficiency' : 'Latest proficiency') + '</span><select data-bind="proficiency"><option value="">Not yet assessed</option>' + Object.keys(C.PROFICIENCY).map(function (k) { return '<option value="' + k + '"' + (f.proficiency === k ? ' selected' : '') + '>' + C.PROFICIENCY[k][0] + '</option>'; }).join('') + '</select></label>' + (f.status === 'inProgress' && f.proficiency ? '<label class="field"><span class="lab">Report card date</span><input type="date" value="' + f.received + '" data-bind="received"></label>' : '') + '</div><p class="pnote">' + (f.status === 'completed' ? 'BC grade 9 (2023 curriculum) reports a proficiency level instead of a percentage.' : 'Optional. BC grade 9 reports a proficiency level each term rather than a percentage — add the most recent one if you have it, and it will count toward your core GPA. Leave it unassessed until then.') + '</p></div>';
      else if (f.status === 'inProgress') body += '<div class="form"><div class="group"><label class="field"><span class="lab">Report card mark (%)</span><input type="text" inputmode="decimal" value="' + h(f.mark) + '" data-bind="mark" placeholder="Optional"></label>' + (f.mark ? '<label class="field"><span class="lab">Report card date</span><input type="date" value="' + f.received + '" data-bind="received"></label>' : '') + '</div><p class="pnote">Optional. If you’ve had a report card for this course, enter that mark — it’s what your school will send on, and it counts everything your teacher counted. Without one, the GPA tab estimates from the assignments you’ve entered instead.</p></div>';
      else body += '<div class="form"><div class="group"><label class="field"><span class="lab">Final mark (%)</span><input type="text" inputmode="decimal" value="' + h(f.mark) + '" data-bind="mark" placeholder="e.g. 84"></label></div><p class="pnote">Enter the final percentage from your report card.</p></div>';
    }
    if (f.error) body += '<p class="err">' + h(f.error) + '</p>';
    body += '<div class="form"><div class="group"><div class="field"><button type="button" class="destructive" data-act="removeCourse">Remove course</button></div></div><p class="pnote">A planned course you remove becomes eligible to appear under "Suggested for you" again.</p></div>';
    return sheetShell({title: 'Edit course', left: '<button type="button" data-act="closeSheet">Cancel</button>', right: '<button type="button" data-act="saveCourse">Save</button>', body: body});
  }

  /* Bucket detail */
  var BUCKET_WHY = {english: 'English courses count here first. Any beyond what NCAA asks for move to Extra E/M/S.', math: 'Math courses count here first. Any beyond what NCAA asks for move to Extra E/M/S.', science: 'Science courses count here first. Any beyond what NCAA asks for move to Extra E/M/S.', extra: 'English, math and science courses land here once those three requirements are full.', social: 'Social science: history, geography, law, politics and the like.', additional: 'Whatever core is left over — another social science, a language, philosophy, world religions.'};
  function bucketSheet() {
    var key = ui.sheet.key, bar = fig.alloc.bars.filter(function (b) { return b.key === key; })[0], el = fig.alloc.elsewhere;
    var body = '<div class="pcard"><span class="lab" style="display:flex;gap:6px;font-size:13px;color:var(--text2);margin-bottom:6px">' + bar.label + ' <span class="code">' + C.num(bar.counted) + '/' + bar.need + '</span></span>' + boxes(bar) + '<p class="footnote secondary" style="margin:10px 0 0">' + BUCKET_WHY[key] + '</p></div>';
    var part = false;
    var rows = bar.placements.map(function (p) {
      var c = p.course, els = (el[c.id] || []).filter(function (e) { return e.bucket !== key; });
      if (p.units < 1 - EPS) part = true;
      var cap = [c.code ? c.code : null, 'Gr ' + c.grade, (key === 'extra' || key === 'additional') ? C.SUBJECT[c.category] : null, C.STATUS[c.status]].filter(Boolean).join(' · ');
      return '<div class="cell"><span class="swatch ' + (c.status === 'completed' ? 'done' : c.status === 'inProgress' ? 'now' : 'later') + '"></span><span class="main"><b>' + h(c.title) + '</b><span class="sub">' + h(cap) + '</span>' + els.map(function (e) { return '<span class="sub">Another ' + C.unitsWord(e.units).replace(/ units?$/, '') + ' of it counts under ' + C.BUCKET_LONG[e.bucket] + '.</span>'; }).join('') + '</span><span class="code">' + C.unitsWord(p.units) + '</span></div>';
    });
    var left = bar.need - bar.placements.reduce(function (t, p) { return t + p.units; }, 0);
    if (left > EPS) rows.push('<div class="cell"><span class="swatch empty"></span><span class="main secondary">Still to fill</span><span class="code secondary">' + C.unitsWord(left) + '</span></div>');
    body += '<div class="sec"><div class="sec-h plain">What’s filling it</div><div class="group">' + (rows.length ? rows.join('') : '<div class="empty">Nothing counts toward this yet.</div>') + '</div>' + (part ? '<div class="sec-f">NCAA counts credits, not courses. A course worth part of a credit — Ontario’s Civics is half of one — fills part of a box, and whatever comes next fills the rest.</div>' : '') + '</div>';
    var subj = {english: 'english', math: 'math', science: 'science', social: 'social', additional: 'language'}[key];
    if (subj) {
      var elsewhere = data.courses.filter(function (c) { return c.category === subj && status(c) === 'approved' && (el[c.id] || []).some(function (e) { return e.bucket !== key; }) && !(el[c.id] || []).some(function (e) { return e.bucket === key; }); });
      if (elsewhere.length) body += '<div class="sec"><div class="sec-h plain">Counting elsewhere</div><div class="group">' + elsewhere.map(function (c) { var e = el[c.id][0]; return '<div class="cell"><span class="swatch ' + (c.status === 'completed' ? 'done' : c.status === 'inProgress' ? 'now' : 'later') + '"></span><span class="main"><b>' + h(c.title) + '</b><span class="sub">Counts under ' + C.BUCKET_LONG[e.bucket] + '</span></span><span class="code">' + C.unitsWord(e.units) + '</span></div>'; }).join('') + '</div><div class="sec-f">This requirement is full, so NCAA counts these under another one.</div></div>';
      var not = data.courses.filter(function (c) { return c.category === subj && status(c) !== 'approved'; });
      if (not.length) body += '<div class="sec"><div class="sec-h plain">Not counting</div><div class="group">' + not.map(function (c) { return '<div class="cell"><span class="main"><b>' + h(c.title) + '</b><span class="sub">' + (c.code ? h(c.code) + ' · ' : '') + 'Gr ' + c.grade + '</span></span>' + (status(c) === 'excluded' ? '<span class="chip">Not approved</span>' : '<span class="chip bad">Unrecognized</span>') + '</div>'; }).join('') + '</div><div class="sec-f">A course NCAA doesn’t accept fills nothing here, however good the mark is.</div></div>';
    }
    return sheetShell({title: bar.label, right: '<button type="button" data-act="closeSheet">Done</button>', body: body, medium: false});
  }

  /* Assignment editor */
  var TYPES = ['Assignment', 'Quiz', 'Test', 'Lab', 'Essay', 'Presentation', 'Exam', 'Culminating'];
  var REMIND = ['Don’t remind me', '1 week before', '5 days before', '3 days before', '2 days before', '1 day before'];
  function assignmentSheet() {
    var s = ui.sheet, f = s.form, current = data.courses.filter(function (c) { return c.status === 'inProgress' && C.isCore(c); });
    var body = '<div class="form"><div class="group"><label class="field"><span class="lab">Course</span><select data-bind="courseID">' + current.map(function (c) { return '<option value="' + c.id + '"' + (f.courseID === c.id ? ' selected' : '') + '>' + h(displayCode(c)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="field wide"><input type="text" value="' + h(f.title) + '" data-bind="title" placeholder="Title, e.g. Unit 2 test"></label>' +
      '<label class="field"><span class="lab">Type</span><select data-bind="type">' + TYPES.map(function (t) { return '<option' + (f.type === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span class="lab">Due date</span><input type="date" value="' + f.due + '" data-bind="due"></label>' +
      '<label class="field"><span class="lab">Weight (% of course)</span><input type="text" inputmode="decimal" value="' + h(f.weight) + '" data-bind="weight" placeholder="e.g. 10"></label>' +
      '<label class="field"><span class="lab">Remind me</span><select data-bind="remind">' + REMIND.map(function (r, i) { return '<option value="' + i + '"' + (f.remind === i ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></label></div><p class="pnote">Adds a Calendar event with an alert, if Calendar sync is on in Profile.</p></div>';
    body += '<div class="form"><div class="sec-h">Mark received</div><div class="group"><div class="field"><span class="seg small" style="width:100%"><button type="button" class="' + (f.mode === 'score' ? 'sel' : '') + '" data-act="markMode" data-arg="score">Score out of</button><button type="button" class="' + (f.mode === 'percent' ? 'sel' : '') + '" data-act="markMode" data-arg="percent">Percentage</button></span></div>' +
      (f.mode === 'score' ? '<label class="field"><span class="lab">Score</span><input type="text" inputmode="decimal" value="' + h(f.score) + '" data-bind="score" placeholder="Not marked yet"></label><label class="field"><span class="lab">Out of</span><input type="text" inputmode="decimal" value="' + h(f.outOf) + '" data-bind="outOf" placeholder="e.g. 20"></label>' :
        '<label class="field"><span class="lab">Percent</span><input type="text" inputmode="decimal" value="' + h(f.percent) + '" data-bind="percent" placeholder="Not marked yet"></label>') + '</div><p class="pnote">' + (f.mode === 'score' ? 'Leave the score blank until the work is handed back.' : 'Leave blank until the work is handed back. Use this if your teacher only gives a percentage, not a score out of something.') + '</p></div>';
    if (f.error) body += '<p class="err">' + h(f.error) + '</p>';
    if (s.assignment) body += '<div class="form"><div class="group"><div class="field"><button type="button" class="destructive" data-act="deleteAssignment">Delete assignment</button></div></div></div>';
    return sheetShell({title: s.assignment ? 'Edit assignment' : 'New assignment', left: '<button type="button" data-act="closeSheet">Cancel</button>', right: '<button type="button" data-act="saveAssignment">Save</button>', body: body});
  }

  /* Session editor */
  function sessionSheet() {
    var s = ui.sheet, f = s.form, isNew = !s.session, playedGame = f.kind === 'game' && C.parseISO(f.date) <= C.today;
    var body = '<div class="form"><div class="group"><label class="field"><span class="lab">Type</span><select data-bind="kind">' + Object.keys(C.KIND).map(function (k) { return '<option value="' + k + '"' + (f.kind === k ? ' selected' : '') + '>' + C.KIND[k] + '</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span class="lab">Date</span><input type="date" value="' + f.date + '" data-bind="date"></label>' +
      '<div class="field"><span class="lab">Start time</span>' + toggle(f.hasStart, 'toggleStart') + '</div>' + (f.hasStart ? '<label class="field"><span class="lab">Starts</span><input type="time" value="' + f.start + '" data-bind="start" step="300"></label>' : '') +
      '<label class="field wide"><input type="text" value="' + h(f.title) + '" data-bind="title" placeholder="' + (f.kind === 'game' ? 'Opponent, e.g. vs Nepean' : 'Note (optional)') + '"></label></div></div>';
    body += '<div class="form"><div class="group"><div class="field"><span class="lab">Length</span><span style="display:flex;align-items:center;gap:10px"><span class="val">' + C.duration(f.minutes) + '</span><span class="stepper"><button type="button" data-act="step" data-arg="minutes:-15">−</button><button type="button" data-act="step" data-arg="minutes:15">+</button></span></span></div>' +
      '<div class="field"><span class="lab">Travel</span><span style="display:flex;align-items:center;gap:10px"><span class="val">' + (f.travel ? C.duration(f.travel) : 'None') + '</span><span class="stepper"><button type="button" data-act="step" data-arg="travel:-15">−</button><button type="button" data-act="step" data-arg="travel:15">+</button></span></span></div></div><p class="pnote">Length is your time at the rink, warm-up included. Travel is there and back. It isn’t added to your hours, but it counts when the app checks a due date against a heavy stretch of hockey.</p></div>';
    if (playedGame) body += '<div class="form"><div class="group"><label class="field"><span class="lab">Time on ice</span><input type="text" value="' + h(f.toi) + '" data-bind="toi" placeholder="e.g. 14:30"></label></div><p class="pnote">Minutes and seconds you played, off the scoresheet if your league keeps it. Leave it blank if you don’t know; a blank game is left out of your average.</p></div>';
    if (isNew) {
      var n = 1; if (f.repeats && f.until) { var d = C.addDays(C.parseISO(f.date), 7), u = C.parseISO(f.until); while (d <= u) { n++; d = C.addDays(d, 7); } }
      body += '<div class="form"><div class="group"><div class="field"><span class="lab">Repeats weekly</span>' + toggle(f.repeats, 'toggleRepeats') + '</div>' + (f.repeats ? '<label class="field"><span class="lab">Until</span><input type="date" value="' + f.until + '" data-bind="until"></label>' : '') + '</div>' + (f.repeats ? '<p class="pnote">Adds ' + n + ' sessions, one a week. Each can be changed on its own afterwards, and deleted alone or with the weeks after it.</p>' : '') + '</div>';
    }
    if (f.error) body += '<p class="err">' + h(f.error) + '</p>';
    if (!isNew) body += '<div class="form"><div class="group"><div class="field"><button type="button" class="destructive" data-act="deleteSession">Delete session</button></div></div></div>';
    return sheetShell({title: isNew ? 'New session' : 'Edit session', left: '<button type="button" data-act="closeSheet">Cancel</button>', right: '<button type="button" data-act="saveSession">Save</button>', body: body});
  }

  /* ---------- alerts ---------- */
  function paintAlert() {
    var a = ui.alert;
    if (!a) { al.innerHTML = ''; return; }
    var stack = a.buttons.length > 2 || a.buttons.some(function (b) { return b.label.length > 14; });
    al.innerHTML = '<div class="alert-wrap"><div class="alert" role="alertdialog" aria-labelledby="al-t"><div class="at" id="al-t">' + h(a.title) + '</div><div class="am">' + h(a.message) + '</div><div class="ab' + (stack ? ' stack' : '') + '">' + a.buttons.map(function (b, i) { return '<button type="button" class="' + (b.style || '') + '" data-act="alertButton" data-arg="' + i + '">' + h(b.label) + '</button>'; }).join('') + '</div></div></div>';
  }
  function namedAlert(key) {
    var p = data.profile, parts = key.split(':'), id = parts[1], c = id && data.courses.filter(function (x) { return x.id === id; })[0];
    switch (parts[0]) {
      case 'review': return alert('Needs review', reviewMessage());
      case 'toReview': return alert('To review', fig.review.map(function (x) { return x.code ? x.code + ' — ' + x.title : x.title; }).join('\n') + '\n\n' + (fig.review.length === 1 ? 'This course isn’t on NCAA’s approved list, so it doesn’t count toward your 16 core courses or your GPA.' : 'These courses aren’t on NCAA’s approved list, so they don’t count toward your 16 core courses or your GPA.'),
        [{label: 'Open Courses', style: 'b', act: function () { ui.flash = fig.review[0].id; go('courses'); setTimeout(function () { var el = document.getElementById(cellCourse(fig.review[0])); if (el) el.scrollIntoView({block: 'center', behavior: 'smooth'}); ui.flash = null; }, 50); }}, {label: 'Got it'}]);
      case 'pace': return alert('Core pace', paceMessage());
      case 'keepPace': return alert('Keeping pace', paceMessage());
      case 'clock': return alert('Five-year clock', C.clockExplanation(p));
      case 'tenSeven': return alert('10/7 rule', 'NCAA Division I requires students who attend a US high school to have 10 of their 16 core courses — including 7 in English, math, or science — completed or in progress before the start of Grade 12. This locks in academic progress early, so a shaky final year can’t sink your eligibility. Division II doesn’t have this rule.');
      case 'session': return alert('Sessions', 'One-to-one video sessions are booked here and joined from the phone, once a second adult is on the call. In this demo the Sessions screen isn’t built; the School laptop demo shows booking.');
      case 'counts': {
        var el = (fig.alloc.elsewhere[c.id] || []), where = el.length > 1 ? 'is split between your ' + el.map(function (e) { return C.BUCKET_LONG[e.bucket]; }).join(' and ') + ' requirements' : 'fills your ' + C.BUCKET_LONG[el[0].bucket] + ' requirement';
        return alert(c.title, (c.status === 'planned' ? c.title + ' is on NCAA’s approved list and will count toward your 16 core courses once you take it. As planned, it ' + where + '.' : c.title + ' is on NCAA’s approved list and counts toward your 16 core courses. It ' + where + '.') + ' That can shift as you add or remove courses. Only the NCAA Eligibility Center certifies.');
      }
      case 'excluded': {
        var subjectWord = {english: 'an English course', math: 'a math course', science: 'a science course', social: 'a social science course'}[c.category === 'nonCore' ? guessSubject(c) : c.category];
        var examples = subjectWord ? BC_COURSES.approved.filter(function (x) { return x.grade === c.grade && x.category === (c.category === 'nonCore' ? guessSubject(c) : c.category); }).slice(0, 2).map(function (x) { return x.title; }) : [];
        return alert(c.title, c.title + ' is on NCAA’s list of courses that don’t count toward your 16 core courses or your core GPA.' + (c.status !== 'completed' && subjectWord ? '\n\nIf you need a core credit, ask your school counsellor about switching to ' + subjectWord + ' NCAA accepts.' + (examples.length ? ' Approved ones at this grade include ' + examples.join(' and ') + '.' : '') : ''));
      }
      case 'notlisted': return alert(c.title, 'This course isn’t on NCAA’s approved list. Filed as not NCAA core, it doesn’t count toward your 16 core courses or GPA and doesn’t affect "On track", though your Core16 advisor will still see it. If it’s really an English, math, science, social science or language course, remove it and add it again under that subject.');
      case 'testNotify': return alert('Test notification', 'On a phone this arrives in about 5 seconds. The web demo has nowhere to send one.');
      case 'notInDemo': return alert('Not in this demo', 'The tour replays on a phone. Everything else on this screen works.');
      case 'persona': return alert('Replace everything with ' + id + ', the ' + {'Jordan Reyes': 'Ontario Grade 9', 'Theo Okafor': 'Ontario Grade 11', 'Ava Dhillon': 'BC Grade 9', 'Maya Chen': 'BC Grade 11'}[id] + ' sample student?', id === 'Maya Chen' ? 'The demo goes back to how it opened.' : 'The web demo carries only Maya Chen’s record. The iPhone app has all four.', [{label: 'Reset', style: 'd', act: function () { if (id === 'Maya Chen') start(); }}, {label: 'Cancel', style: 'b'}]);
      case 'resetApp': return alert('Reset Core16?', 'This phone goes back to how it was when Core16 was first installed, and opens on the welcome. Everything on it is cleared: courses, marks, ice time and settings. In the demo it opens on Maya again.', [{label: 'Reset', style: 'd', act: start}, {label: 'Cancel', style: 'b'}]);
    }
  }
  function guessSubject(c) { var t = c.title.toLowerCase(); return /math/.test(t) ? 'math' : /english|communications|literacy/.test(t) ? 'english' : /science|biology|chemistry|physics/.test(t) ? 'science' : /studies|history|geography|civic/.test(t) ? 'social' : null; }

  /* ---------- actions ---------- */
  var actions = {
    tab: function (t) { go(t); },
    tabMarks: function () { go('marks'); },
    push: function (arg) { ui.push = arg; render(); },
    pop: function () { ui.push = null; render(); },
    alert: namedAlert,
    alertButton: function (i) { var b = ui.alert.buttons[+i]; closeAlert(); if (b.act) b.act(); },
    none: function () {},
    bucket: function (key) { openSheet({kind: 'bucket', key: key}); },
    closeSheet: closeSheet,
    closeSheetBackdrop: function (arg, ev) { if (ev.target.classList.contains('overlay')) closeSheet(); },
    addCourse: function () { openSheet({kind: 'add', form: {grade: data.profile.grade, query: '', mode: 'list', picked: null, status: 'inProgress', mark: '', proficiency: '', error: '', typed: {title: '', code: '', subject: '', credit: '4', subjectGuessed: false}}}); setTimeout(function () { var i = ov.querySelector('[data-bind=query]'); if (i) i.focus(); }, 60); },
    addGrade: function (g) { var f = ui.sheet.form; f.grade = +g; if (f.picked && f.picked.grade !== f.grade) f.picked = null; f.error = ''; paintSheet(); },
    clearQuery: function () { ui.sheet.form.query = ''; paintSheet(); },
    pick: function (arg) { var p = arg.split('|'), f = ui.sheet.form, entry = BC_COURSES.approved.filter(function (c) { return c.title === p[0] && c.grade === +p[1]; })[0]; f.picked = entry; f.grade = entry.grade; f.error = ''; paintSheet(); },
    typedMode: function () { var f = ui.sheet.form, q = f.query.trim(); f.mode = 'typed'; if (/^[A-Za-z0-9 ]{4,8}$/.test(q) && /[A-Za-z]/.test(q) && /\d/.test(q)) f.typed.code = q.toUpperCase(); else f.typed.title = q; f.picked = null; f.error = ''; paintSheet(); },
    typedFrom: function (arg) { var p = arg.split('|'), f = ui.sheet.form; f.mode = 'typed'; f.typed.title = p[0]; f.typed.subject = p[1] || ''; f.typed.subjectGuessed = !!p[1]; f.picked = null; f.error = ''; paintSheet(); },
    typedFromGrade: function (arg) { var p = arg.split('|'), f = ui.sheet.form; f.grade = +p[2]; actions.typedFrom(p[0] + '|' + p[1]); },
    listMode: function () { var f = ui.sheet.form; f.mode = 'list'; f.error = ''; paintSheet(); },
    addStatus: function (s) { var f = ui.sheet.form; f.status = s; f.error = ''; paintSheet(); if (f.mode === 'typed') { var n = document.getElementById('typed-note'); if (n) n.innerHTML = typedNote(f); } },
    addConfirm: function () {
      var f = ui.sheet.form, picked = pickedCourse(f);
      function fail(m) { f.error = m; refreshSheetParts(); }
      if (!picked) return fail(f.mode === 'typed' ? 'Enter the course name from your report card.' : 'Choose a course first.');
      if (onTimetable(picked.title)) return fail('That course is already on your list.');
      if (picked.needsSubject) return fail('Choose the course’s NCAA subject.');
      if (f.status === 'completed') {
        if (f.grade === 9 && !f.proficiency) return fail('Choose a proficiency level before saving a completed course.');
        if (f.grade !== 9) { if (f.mark.trim() === '') return fail('Enter your final mark before saving a completed course.'); var v = Number(f.mark); if (isNaN(v) || v < 0 || v > 100) return fail('Final mark should be a number from 0 to 100.'); }
      }
      var st = C.bcStatus(picked.title);
      if (picked.typed && st === 'unrecognized' && picked.category !== 'nonCore' && f.status !== 'completed') {
        return alert('Not on NCAA’s approved list', 'This course won’t count toward your 16 core courses or your core GPA unless NCAA accepts it, and that’s decided case by case. ' + (f.status === 'planned' ? 'Now is the easy time to swap it for an approved course.' : 'Ask your school counsellor whether you can still switch.'), [{label: 'Go back', style: 'b'}, {label: 'Add anyway', style: 'd', act: function () { addCourseNow(picked, f); }}]);
      }
      if (st === 'excluded' && f.status !== 'completed') {
        return alert('NCAA doesn’t count this course', picked.title + ' is on NCAA’s list of courses that don’t count toward your 16 core courses or your core GPA. ' + (f.status === 'planned' ? 'Now is the easy time to swap it for an approved course. Your school counsellor can tell you which ones fit your timetable.' : 'If you still need the core course, ask your school counsellor whether you can still switch to an approved one.'), [{label: 'Go back', style: 'b'}, {label: 'Add anyway', act: function () { addCourseNow(picked, f); }}]);
      }
      addCourseNow(picked, f);
    },
    editCourse: function (id) {
      var c = data.courses.filter(function (x) { return x.id === id; })[0];
      openSheet({kind: 'edit', course: c, form: {status: c.status, mark: c.mark && c.mark.kind === 'percentage' ? C.num(c.mark.value) : '', proficiency: c.mark && c.mark.kind === 'proficiency' ? c.mark.level : '', received: c.mark && c.mark.received ? C.iso(c.mark.received) : C.iso(C.today), error: ''}});
    },
    saveCourse: function () {
      var s = ui.sheet, c = s.course, f = s.form;
      function fail(m) { f.error = m; paintSheet(); }
      if (f.status === 'planned') { c.status = 'planned'; c.mark = null; }
      else if (c.grade === 9) { if (f.status === 'completed' && !f.proficiency) return fail('Choose a proficiency level before saving a completed course.'); c.status = f.status; c.mark = f.proficiency ? {kind: 'proficiency', level: f.proficiency, received: f.status === 'inProgress' ? C.parseISO(f.received) : null} : null; }
      else {
        var t = f.mark.trim();
        if (f.status === 'completed' && t === '') return fail('Enter your final mark before saving a completed course.');
        if (t !== '') { var v = Number(t); if (isNaN(v) || v < 0 || v > 100) return fail(f.status === 'completed' ? 'Final mark should be a number from 0 to 100.' : 'Report card mark should be a number from 0 to 100.'); }
        c.status = f.status; c.mark = t === '' ? null : {kind: 'percentage', value: Number(t), received: f.status === 'inProgress' ? C.parseISO(f.received) : null};
      }
      closeSheet(); render();
    },
    removeCourse: function () { var c = ui.sheet.course; alert('Remove this course?', '', [{label: 'Remove', style: 'd', act: function () { data.courses = data.courses.filter(function (x) { return x !== c; }); data.assignments = data.assignments.filter(function (a) { return a.courseID !== c.id; }); closeSheet(); render(); }}, {label: 'Cancel', style: 'b'}]); },
    pickSuggested: function (arg) { var p = arg.split('|'), entry = BC_COURSES.approved.filter(function (c) { return c.title === p[0] && c.grade === +p[1]; })[0]; data.courses.push({id: C.nextID(), title: entry.title, code: entry.code, grade: entry.grade, category: entry.category, units: entry.units, status: entry.grade === data.profile.grade ? 'inProgress' : 'planned', mark: null, typed: false}); ui.push = null; render(); },
    markDay: function (i) { ui.marks.day = ui.marks.day === +i ? null : +i; render(); },
    markCourse: function (id) { ui.marks.course = id; render(); },
    toggleReport: function () { ui.marks.reportOpen = !ui.marks.reportOpen; render(); },
    addAssignment: function () { var current = data.courses.filter(function (c) { return c.status === 'inProgress' && C.isCore(c); }); if (!current.length) return; var first = ui.marks.course !== 'all' ? ui.marks.course : current[0].id; openSheet({kind: 'assignment', assignment: null, form: {courseID: first, title: '', type: 'Assignment', due: C.iso(C.day(7)), weight: '', remind: 5, mode: 'score', score: '', outOf: '', percent: '', error: ''}}); },
    editAssignment: function (id) { var a = data.assignments.filter(function (x) { return x.id === id; })[0]; openSheet({kind: 'assignment', assignment: a, form: {courseID: a.courseID, title: a.title, type: a.type, due: C.iso(a.due), weight: a.weight ? C.num(a.weight) : '', remind: 5, mode: 'score', score: a.score != null ? C.num(a.score) : '', outOf: a.outOf != null ? C.num(a.outOf) : '', percent: '', error: ''}}); },
    markMode: function (m) { ui.sheet.form.mode = m; paintSheet(); },
    saveAssignment: function () {
      var s = ui.sheet, f = s.form;
      function fail(m) { f.error = m; paintSheet(); }
      function numberOf(v) { v = String(v || '').trim(); return v === '' ? null : isNaN(Number(v)) ? NaN : Number(v); }
      if (!f.courseID) return fail('Choose a course.');
      if (!f.title.trim()) return fail('Add a title so you can find this later.');
      var weight = numberOf(f.weight), score = null, outOf = null;
      if (f.mode === 'score') { score = numberOf(f.score); outOf = numberOf(f.outOf); } else { var pc = numberOf(f.percent); if (pc != null) { if (isNaN(pc) || pc < 0 || pc > 100) return fail('Percent should be between 0 and 100.'); score = pc; outOf = 100; } }
      if (score != null) {
        if (weight == null) return fail('Enter this assignment’s weight.');
        if (isNaN(weight) || weight < 0 || weight > 100) return fail('Weight should be a number from 0 to 100.');
        if (outOf == null) return fail('Enter what the score was out of.');
        if (isNaN(score) || score < 0 || score > outOf * 1.2) return fail('Score should be between 0 and ' + C.num(outOf) + '.');
      } else if (weight != null && (isNaN(weight) || weight < 0 || weight > 100)) return fail('Weight should be a number from 0 to 100.');
      function commit() {
        if (s.assignment) { var a = s.assignment; a.courseID = f.courseID; a.title = f.title.trim(); a.type = f.type; a.due = C.parseISO(f.due); a.weight = weight || 0; a.score = score; a.outOf = outOf != null ? outOf : a.outOf; }
        else data.assignments.push({id: C.nextID(), courseID: f.courseID, title: f.title.trim(), type: f.type, due: C.parseISO(f.due), weight: weight || 0, score: score, outOf: outOf, by: null});
        closeSheet(); render();
      }
      if (score != null && score > outOf) return alert('Above the maximum', 'That’s above the maximum (' + C.num(outOf) + '). Bonus marks are allowed — save it anyway?', [{label: 'Save anyway', style: 'b', act: commit}, {label: 'Cancel'}]);
      commit();
    },
    deleteAssignment: function () { var a = ui.sheet.assignment; alert('Delete this assignment?', '', [{label: 'Delete', style: 'd', act: function () { data.assignments = data.assignments.filter(function (x) { return x !== a; }); closeSheet(); render(); }}, {label: 'Cancel', style: 'b'}]); },
    showMore: function (key) { ui.hockey[key] = !ui.hockey[key]; render(); },
    addSession: function () { openSheet({kind: 'session', session: null, form: {kind: 'practice', date: C.iso(C.day(1)), hasStart: false, start: '18:00', title: '', minutes: 90, minutesTouched: false, travel: 0, toi: '', repeats: false, until: C.iso(C.day(56)), error: ''}}); },
    editSession: function (id) { var s = data.ice.filter(function (x) { return x.id === id; })[0]; openSheet({kind: 'session', session: s, form: {kind: s.kind, date: C.iso(s.date), hasStart: s.start != null, start: s.start != null ? pad2(Math.floor(s.start / 60)) + ':' + pad2(s.start % 60) : '18:00', title: s.title, minutes: s.minutes, minutesTouched: true, travel: s.travel || 0, toi: s.toi != null ? C.toi(s.toi) : '', repeats: false, until: '', error: ''}}); },
    toggleStart: function () { ui.sheet.form.hasStart = !ui.sheet.form.hasStart; paintSheet(); },
    toggleRepeats: function () { ui.sheet.form.repeats = !ui.sheet.form.repeats; paintSheet(); },
    step: function (arg) { var p = arg.split(':'), f = ui.sheet.form, lim = p[0] === 'minutes' ? [15, 600] : [0, 900]; f[p[0]] = Math.max(lim[0], Math.min(lim[1], f[p[0]] + (+p[1]))); if (p[0] === 'minutes') f.minutesTouched = true; paintSheet(); },
    saveSession: function () {
      var s = ui.sheet, f = s.form;
      function fail(m) { f.error = m; paintSheet(); }
      var toi = null;
      if (f.toi.trim()) { var m = /^(\d{1,3}):(\d{2})$/.exec(f.toi.trim()); if (!m || +m[2] >= 60) return fail('Enter time on ice as minutes and seconds, like 14:30.'); toi = (+m[1]) * 60 + (+m[2]); if (toi > f.minutes * 60) return fail('Time on ice can’t be longer than the game.'); }
      var start = f.hasStart ? (+f.start.split(':')[0]) * 60 + (+f.start.split(':')[1]) : null;
      if (s.session) { var x = s.session; x.kind = f.kind; x.date = C.parseISO(f.date); x.start = start; x.title = f.title.trim(); x.minutes = f.minutes; x.travel = f.travel; x.toi = f.kind === 'game' ? toi : null; }
      else { var d = C.parseISO(f.date), until = f.repeats && f.until ? C.parseISO(f.until) : null, series = f.repeats ? C.nextID() : null; do { data.ice.push({id: C.nextID(), date: d, kind: f.kind, start: start, title: f.title.trim(), minutes: f.minutes, travel: f.travel, toi: null, series: series, by: null}); d = C.addDays(d, 7); } while (until && d <= until); }
      closeSheet(); render();
    },
    deleteSession: function () {
      var s = ui.sheet.session, later = s.series ? data.ice.filter(function (x) { return x.series === s.series && x.date > s.date; }).length : 0;
      function remove(withLater) { data.ice = data.ice.filter(function (x) { return x !== s && !(withLater && x.series === s.series && x.date > s.date); }); closeSheet(); render(); }
      if (later) alert('Delete this session?', 'It’s one week of a weekly repeat, with ' + later + ' more ' + (later === 1 ? 'week' : 'weeks') + ' after it. Earlier weeks stay either way.', [{label: 'This Week Only', style: 'd', act: function () { remove(false); }}, {label: 'This and Later Weeks', style: 'd', act: function () { remove(true); }}, {label: 'Cancel', style: 'b'}]);
      else alert('Delete this session?', '', [{label: 'Delete', style: 'd', act: function () { remove(false); }}, {label: 'Cancel', style: 'b'}]);
    },
    division: function (d) { data.profile.division = d; render(); },
    toggleUS: function () { data.profile.attendsUSSchool = !data.profile.attendsUSSchool; render(); },
    theme: function (t) { ui.prefs.theme = t; render(); },
    pref: function (k) { ui.prefs[k] = !ui.prefs[k]; render(); }
  };
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------- binding form fields ---------- */
  function bind(name, value, el) {
    var s = ui.sheet;
    if (ui.push === 'profile' && !s) {
      var p = data.profile;
      if (name === 'name') { p.name = value; p.initials = value.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('') || 'MC'; }
      else if (name === 'school') p.school = value;
      else if (name === 'grade') { p.grade = +value; render(); }
      else if (name === 'gradYear') { p.gradYear = +value; render(); }
      else if (name === 'birthMonth') { p.birthMonth = +value || 0; render(); }
      else if (name === 'birthYear') { p.birthYear = +value || 0; render(); }
      else if (name === 'ncaaID') p.ncaaID = value;
      return;
    }
    if (!s) return;
    var f = s.form;
    if (name.indexOf('typed.') === 0) { f.typed[name.slice(6)] = value; if (name === 'typed.subject') f.typed.subjectGuessed = false; var n = document.getElementById('typed-note'); if (n) n.innerHTML = typedNote(f); refreshSheetParts(); return; }
    f[name] = name === 'remind' ? +value : value;
    if (name === 'query') { var box = document.getElementById('search'); if (box) box.classList.toggle('has', !!value); refreshSheetParts(); }
    else if (s.kind === 'add' && (name === 'mark' || name === 'proficiency')) { /* keep focus */ }
    else if (s.kind === 'edit' && (name === 'status' || name === 'proficiency')) paintSheet();
    else if (s.kind === 'edit' && name === 'mark' && (value === '' || value.length === 1) && el.type !== 'date') { var had = !!el.getAttribute('data-had'); if ((value !== '') !== had) { paintSheet(); var i = ov.querySelector('[data-bind=mark]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } }
    else if (s.kind === 'session' && (name === 'kind' || name === 'date')) { if (name === 'kind' && !f.minutesTouched) f.minutes = {practice: 90, game: 150, skills: 60, offIce: 60}[value]; paintSheet(); }
    else if (s.kind === 'session' && name === 'until') refreshSheetParts();
  }
  glass.addEventListener('input', function (e) { var el = e.target.closest('[data-bind]'); if (el && el.tagName !== 'SELECT') bind(el.getAttribute('data-bind'), el.value, el); });
  glass.addEventListener('change', function (e) { var el = e.target.closest('[data-bind]'); if (el && (el.tagName === 'SELECT' || el.type === 'date' || el.type === 'time')) bind(el.getAttribute('data-bind'), el.value, el); });
  glass.addEventListener('keydown', function (e) { var el = e.target.closest('[role=button][data-act]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); } });
  glass.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el || !glass.contains(el)) return;
    var act = el.getAttribute('data-act'), arg = el.getAttribute('data-arg');
    if (act === 'closeSheetBackdrop' && e.target !== el) return;
    e.stopPropagation();
    if (act.indexOf('pref:') === 0) { actions.pref(act.slice(5)); return; }
    if (actions[act]) { e.preventDefault(); actions[act](arg, e); }
  });
  glass.addEventListener('click', function (e) { if (ui.prefs.showTaps) { var r = glass.getBoundingClientRect(), d = document.createElement('span'); d.style.cssText = 'position:absolute;width:28px;height:28px;border-radius:50%;border:2px solid var(--accent);pointer-events:none;z-index:50;left:' + (e.clientX - r.left - 14) + 'px;top:' + (e.clientY - r.top - 14) + 'px;transition:opacity .5s'; glass.appendChild(d); setTimeout(function () { d.style.opacity = '0'; }, 50); setTimeout(function () { d.remove(); }, 600); } });
  document.getElementById('reset').addEventListener('click', start);

  /* ---------- render ---------- */
  function render() {
    recompute();
    var theme = ui.prefs.theme === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : ui.prefs.theme;
    phone.setAttribute('data-app-theme', theme);
    var key = ui.push || ui.tab, keep = ui.scroll[key] || 0;
    if (ui.push === 'profile') screen.innerHTML = profile();
    else if (ui.push && ui.push.indexOf('picker:') === 0) screen.innerHTML = subjectPicker(+ui.push.split(':')[1]);
    else screen.innerHTML = {overview: overview, courses: courses, marks: marks, gpa: gpa, hockey: hockey}[ui.tab]();
    tabsEl.innerHTML = tabBar();
    screen.scrollTop = keep;
    paintSheet(); paintAlert();
  }
  screen.addEventListener('scroll', function () { ui.scroll[ui.push || ui.tab] = screen.scrollTop; });
  /* Scale the whole phone to the window: at most 0.8 of full size, so a tall monitor doesn't get a towering phone, smaller on a laptop, never below 0.55. On a
     narrow screen the glass fills the page instead, so no scaling. */
  function fit() {
    if (window.innerWidth <= 480) { phone.style.removeProperty('--fit'); return; }
    var room;
    var bar = document.querySelector('.demo-bar'), hint = document.querySelector('.hint'), beside = window.innerWidth >= 900;
    room = window.innerHeight - (bar ? bar.offsetHeight : 0) - (!beside && hint ? hint.offsetHeight + 36 : 0) - 48;
    phone.style.setProperty('--fit', String(Math.max(0.55, Math.min(0.8, room / 870))));
  }
  fit(); window.addEventListener('resize', fit);
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (ui.prefs.theme === 'system') render(); });
  start();
})();
