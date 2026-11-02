/* The walkthrough on the parent and Today demos, a copy of the portal's
   (api/src/core16_api/portal/static/tour.js, and _tour.html for the markup). One card
   at a time over the real page, with what it describes left undimmed. The portal goes
   to another page for a card on another tab; here a tab is a render, so opts.open draws
   the card's view and the subject is found afresh afterwards. Each page holds its own
   wording, since it has to say the record is sample data. */
window.C16Tour = function (opts) {
  'use strict';
  var starters = document.querySelectorAll('[data-tour-start]');
  var dialog = document.createElement('dialog');
  if (!dialog.showModal) return;

  var GAP = 16, OUTSET = 6, current = 0, steps = opts.steps;
  dialog.className = 'tour';
  dialog.setAttribute('aria-label', 'Core16 walkthrough');
  dialog.innerHTML =
    '<svg class="tour-dim" aria-hidden="true" focusable="false"><mask id="tour-mask"><rect width="100%" height="100%" fill="white"/><rect data-tour-hole fill="black"/></mask>' +
    '<rect class="shade" width="100%" height="100%" mask="url(#tour-mask)"/><rect class="ring" data-tour-ring/></svg>' +
    '<div class="tour-card"><div aria-live="polite"><section class="tour-step"><div class="tour-title"><h2></h2></div><p></p></section></div>' +
    '<button type="button" class="linkbtn tour-skip">Skip</button>' +
    '<div class="tour-foot"><ol class="tour-dots" aria-hidden="true">' + steps.map(function () { return '<li></li>'; }).join('') + '</ol>' +
    '<span class="visually-hidden" data-tour-count></span><button type="button" class="linkbtn tour-back">Back</button><button type="button" class="primary tour-next">Next</button></div></div>';
  document.body.appendChild(dialog);

  function part(selector) { return dialog.querySelector(selector); }
  var card = part('.tour-card'), hole = part('[data-tour-hole]'), ring = part('[data-tour-ring]');
  var back = part('.tour-back'), next = part('.tour-next'), skip = part('.tour-skip'), count = part('[data-tour-count]');
  var dots = dialog.querySelectorAll('.tour-dots li');

  /* The first on the page that's showing: on a phone the month's table gives way to its list. */
  function subject() {
    var found = document.querySelectorAll('[data-tour="' + steps[current].key + '"]');
    for (var i = 0; i < found.length; i++) if (found[i].getClientRects().length > 0) return found[i];
    return null;
  }

  function setBox(shape, x, y, width, height, radius) {
    shape.setAttribute('x', x); shape.setAttribute('y', y);
    shape.setAttribute('width', width); shape.setAttribute('height', height);
    shape.setAttribute('rx', radius);
  }

  /* Follows the page, which can still be scrolled to see a tall subject. */
  function draw() {
    if (!dialog.open) return;
    var element = subject();
    if (!element) { setBox(hole, 0, 0, 0, 0, 0); setBox(ring, 0, 0, 0, 0, 0); return; }
    var box = element.getBoundingClientRect();
    var x = box.left - OUTSET, y = box.top - OUTSET, width = box.width + OUTSET * 2, height = box.height + OUTSET * 2;
    setBox(hole, x, y, width, height, 14);
    setBox(ring, x, y, width, height, 14);
  }

  /* Brings the subject into the room the card leaves, with the card at the foot of the
     window, or at the top if the subject can't get clear of it there. */
  function place() {
    card.classList.remove('top');
    var element = subject();
    if (!element) { window.scrollTo(0, 0); draw(); return; }
    var room = window.innerHeight - card.offsetHeight - GAP * 3;
    var before = element.getBoundingClientRect();
    var wanted = before.height < room ? GAP + (room - before.height) / 2 : GAP;
    window.scrollBy(0, before.top - wanted);
    var box = element.getBoundingClientRect();
    var covered = box.top + box.height + OUTSET > window.innerHeight - card.offsetHeight - GAP;
    card.classList.toggle('top', covered && box.top > card.offsetHeight + GAP * 2);
    draw();
  }

  function show(index) {
    current = index;
    var step = steps[index];
    if (opts.now() !== step.view) opts.open(step.view);
    part('.tour-title h2').textContent = step.title;
    part('.tour-step p').textContent = step.message;
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === index);
    count.textContent = 'Step ' + (index + 1) + ' of ' + steps.length;
    back.hidden = index === 0;
    skip.hidden = index === steps.length - 1;
    next.textContent = index === steps.length - 1 ? 'Get started' : 'Next';
    place();
    next.focus();
  }

  function start() {
    if (!dialog.open) dialog.showModal();
    show(0);
  }
  function finish() {
    dialog.close();
    window.scrollTo(0, 0);
  }

  next.addEventListener('click', function () { if (current === steps.length - 1) finish(); else show(current + 1); });
  back.addEventListener('click', function () { show(current - 1); });
  skip.addEventListener('click', finish);
  dialog.addEventListener('cancel', function (event) { event.preventDefault(); finish(); });
  /* A click off the card points back at it, rather than seeming to do nothing. */
  part('.tour-dim').addEventListener('click', function () {
    card.classList.remove('nudge');
    void card.offsetWidth;
    card.classList.add('nudge');
  });
  window.addEventListener('scroll', draw, {passive: true});
  window.addEventListener('resize', function () { if (dialog.open) place(); });
  /* The page's fonts arrive after the first card has measured it. */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (dialog.open) place(); });

  starters.forEach(function (button) { button.addEventListener('click', start); });

  /* Shown once in this browser, unasked. Where nothing can be remembered, not at all: it
     would otherwise open on every visit. Show me around is still there. */
  try {
    if (localStorage.getItem('core16-demo-tour-' + opts.name)) return;
    localStorage.setItem('core16-demo-tour-' + opts.name, '1');
  } catch (error) {
    return;
  }
  start();
};
