/*
  Baby's First Year — app logic.

  Plain ES5-ish JavaScript, no framework and no build step: what is committed is
  what runs. Content lives in data.js; this file holds state, rendering and the
  handful of small interactions.

  All data is kept in localStorage under a single key. Nothing is ever sent
  anywhere — there are no network requests in this app at all.
*/
(function () {
  'use strict';

  var D = window.BFY_DATA;
  var KEY = 'bfy.v1';

  /* =====================================================================
     Storage — localStorage with an in-memory fallback so a blocked storage
     jar (private browsing, cookies disabled) degrades instead of crashing.
     ===================================================================== */

  var memoryStore = null;
  var storageBlocked = false;

  function loadState() {
    var raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      storageBlocked = true;
      raw = memoryStore;
    }
    var parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    }
    return migrate(parsed);
  }

  function migrate(s) {
    s = s || {};
    return {
      version: 1,
      baby: s.baby || null,           // {name, dob, sex, dueDate, units, region,
                                      //  feedMode, dayStart, targetMl}
      appointments: s.appointments || [],
      feeds: s.feeds || [],           // {id, date, time, kind, ml, minutes, side, notes}
      measurements: s.measurements || [],
      milestones: s.milestones || {}, // id -> {date}
      activities: s.activities || {}, // "week:index" -> true
      notes: s.notes || {}            // week -> string
    };
  }

  function save() {
    var raw = JSON.stringify(S);
    memoryStore = raw;
    try {
      localStorage.setItem(KEY, raw);
    } catch (e) {
      storageBlocked = true;
    }
  }

  var S = loadState();
  var UI = {
    tab: 'today', week: null, calMonth: null, calDay: null, chart: 'weight',
    openCheckpoint: null, feedRange: 'day', feedMeasure: null, feedDay: null
  };

  /* =====================================================================
     Small helpers
     ===================================================================== */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(id) { return document.getElementById(id); }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  var MS_DAY = 86400000;

  /* Dates are handled as local calendar days: "YYYY-MM-DD" strings in, and
     Date objects pinned to local midday out, so daylight saving can never
     shunt a date onto the wrong day. */
  function parseDay(iso) {
    if (!iso) return null;
    var p = String(iso).split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  function toISO(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function today() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0, 0);
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12, 0, 0, 0);
  }

  function daysBetween(a, b) {
    return Math.round((b.getTime() - a.getTime()) / MS_DAY);
  }

  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  var DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function formatDay(d, opts) {
    if (!d) return '';
    var s = DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()].slice(0, 3);
    if (opts && opts.year) s += ' ' + d.getFullYear();
    return s;
  }

  function formatTime(t) {
    if (!t) return '';
    var p = t.split(':');
    if (p.length < 2) return t;
    return p[0] + ':' + p[1];
  }

  function relativeDay(d) {
    var n = daysBetween(today(), d);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n > 1 && n < 7) return 'In ' + n + ' days';
    if (n < -1 && n > -7) return n * -1 + ' days ago';
    if (n > 0) return 'In ' + (n < 60 ? Math.round(n / 7) + ' weeks' : Math.round(n / 30) + ' months');
    return (n * -1 < 60 ? Math.round(n / -7) + ' weeks' : Math.round(n / -30) + ' months') + ' ago';
  }

  /* Full months completed between two calendar days. */
  function monthsBetween(from, to) {
    var m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() < from.getDate()) m -= 1;
    return m;
  }

  function pluralise(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  /* =====================================================================
     Age
     ===================================================================== */

  /* A baby born early is measured two ways: actual age from birth, and
     corrected age from the due date. Clinicians use corrected age for
     development and growth through the first two years, so when a due date
     is recorded and it is at least a week after the birth date, that is what
     the plan and the charts follow. */
  function ageInfo(ref) {
    var dob = parseDay(S.baby && S.baby.dob);
    if (!dob) return null;
    ref = ref || today();
    var due = parseDay(S.baby.dueDate);
    var actualDays = Math.max(0, daysBetween(dob, ref));
    var preterm = due && daysBetween(dob, due) >= 7;
    var correctedDays = preterm ? Math.max(0, actualDays - daysBetween(dob, due)) : actualDays;
    return {
      dob: dob,
      preterm: !!preterm,
      actualDays: actualDays,
      days: correctedDays,
      weeks: Math.floor(correctedDays / 7),
      months: monthsBetween(preterm ? due : dob, ref),
      label: ageLabel(actualDays, dob, ref),
      correctedLabel: preterm ? ageLabel(correctedDays, due, ref) : null
    };
  }

  function ageLabel(days, from, ref) {
    if (days < 0) return 'not born yet';
    if (days < 14) return pluralise(days, 'day') + ' old';
    if (days < 63) {
      var w = Math.floor(days / 7), rd = days % 7;
      return pluralise(w, 'week') + (rd ? ', ' + pluralise(rd, 'day') : '') + ' old';
    }
    var m = monthsBetween(from, ref);
    if (m < 12) {
      var anchor = new Date(from.getFullYear(), from.getMonth() + m, from.getDate(), 12, 0, 0, 0);
      var extra = daysBetween(anchor, ref);
      return pluralise(m, 'month') + (extra ? ', ' + pluralise(extra, 'day') : '') + ' old';
    }
    var years = Math.floor(m / 12), rem = m % 12;
    return pluralise(years, 'year') + (rem ? ', ' + pluralise(rem, 'month') : '') + ' old';
  }

  function currentWeek() {
    var a = ageInfo();
    if (!a) return 0;
    return Math.max(0, Math.min(52, a.weeks));
  }

  /* =====================================================================
     Units — everything is stored in metric and converted only for display.
     ===================================================================== */

  function units() { return (S.baby && S.baby.units) || 'metric'; }

  function fmtWeight(kg) {
    if (kg == null || isNaN(kg)) return '—';
    if (units() === 'imperial') {
      var totalOz = kg * 35.27396;
      var lb = Math.floor(totalOz / 16);
      var oz = Math.round(totalOz - lb * 16);
      if (oz === 16) { lb += 1; oz = 0; }
      return lb + ' lb ' + oz + ' oz';
    }
    return kg.toFixed(2).replace(/0$/, '') + ' kg';
  }

  function fmtLength(cm) {
    if (cm == null || isNaN(cm)) return '—';
    if (units() === 'imperial') return (cm / 2.54).toFixed(1) + ' in';
    return cm.toFixed(1) + ' cm';
  }

  function weightAxis(kg) { return units() === 'imperial' ? kg * 2.20462 : kg; }
  function lengthAxis(cm) { return units() === 'imperial' ? cm / 2.54 : cm; }
  function weightUnitLabel() { return units() === 'imperial' ? 'lb' : 'kg'; }
  function lengthUnitLabel() { return units() === 'imperial' ? 'in' : 'cm'; }

  /* =====================================================================
     Appointments and the suggested schedule
     ===================================================================== */

  var APPT_TYPES = [
    { v: 'paediatrician', label: 'Paediatrician', emoji: '🩺' },
    { v: 'gp', label: 'GP / family doctor', emoji: '🏥' },
    { v: 'health-visitor', label: 'Health visitor / nurse', emoji: '🏠' },
    { v: 'midwife', label: 'Midwife', emoji: '👩‍⚕️' },
    { v: 'vaccine', label: 'Immunisation', emoji: '💉' },
    { v: 'screening', label: 'Screening test', emoji: '🔬' },
    { v: 'check', label: 'Development check', emoji: '✅' },
    { v: 'therapy', label: 'Therapy / specialist', emoji: '🧩' },
    { v: 'dentist', label: 'Dentist', emoji: '🦷' },
    { v: 'class', label: 'Class or group', emoji: '🧸' },
    { v: 'other', label: 'Something else', emoji: '📌' }
  ];

  function typeMeta(v) {
    for (var i = 0; i < APPT_TYPES.length; i++) if (APPT_TYPES[i].v === v) return APPT_TYPES[i];
    return APPT_TYPES[APPT_TYPES.length - 1];
  }

  function region() { return (S.baby && S.baby.region) || 'uk'; }
  function weekStartsMonday() { return region() !== 'us'; }

  function sortedAppointments() {
    return S.appointments.slice().sort(function (a, b) {
      if (a.date === b.date) return (a.time || '99:99') < (b.time || '99:99') ? -1 : 1;
      return a.date < b.date ? -1 : 1;
    });
  }

  function appointmentsOn(iso) {
    return sortedAppointments().filter(function (a) { return a.date === iso; });
  }

  function upcomingAppointments(limit) {
    var t = toISO(today());
    var list = sortedAppointments().filter(function (a) { return a.date >= t; });
    return limit ? list.slice(0, limit) : list;
  }

  function pastAppointments() {
    var t = toISO(today());
    return sortedAppointments().filter(function (a) { return a.date < t; }).reverse();
  }

  /* Suggested check-ups and jabs, dated from this baby's birthday. */
  function suggestions() {
    var a = ageInfo();
    if (!a) return [];
    var sched = D.SCHEDULES[region()] || D.SCHEDULES.generic;
    var done = {};
    S.appointments.forEach(function (ap) { if (ap.suggestionId) done[ap.suggestionId] = ap; });
    var t = today();
    return sched.items.map(function (item) {
      var date = addDays(a.dob, Math.round(item.w * 7));
      var latest = addDays(date, Math.round(item.win * 7));
      var status = 'upcoming';
      if (done[item.id]) status = 'booked';
      else if (latest < t) status = 'overdue';
      else if (date <= t) status = 'due';
      return { item: item, date: date, status: status, booked: done[item.id] || null };
    });
  }

  function suggestionsForWeek(week) {
    var dob = parseDay(S.baby && S.baby.dob);
    if (!dob) return [];
    return suggestions().filter(function (s) {
      return Math.floor(daysBetween(dob, s.date) / 7) === week;
    });
  }

  /* =====================================================================
     Growth reference lookup
     ===================================================================== */

  function referenceFor(metric) {
    var sex = S.baby && S.baby.sex;
    if (sex !== 'boy' && sex !== 'girl') return null;
    return D.GROWTH[sex][metric];
  }

  function interpolateRef(rows, months) {
    if (!rows) return null;
    var m = Math.max(0, Math.min(12, months));
    var lo = Math.floor(m), hi = Math.min(12, lo + 1), f = m - lo;
    var a = rows[lo], b = rows[hi];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  /* A rough centile read-off from the plotted 3rd / 50th / 97th reference
     lines. It is an estimate for context, never a clinical measurement. */
  function estimateCentile(value, ref) {
    if (!ref || value == null) return null;
    if (value < ref[0]) return { text: 'below the 3rd centile line', out: true };
    if (value > ref[2]) return { text: 'above the 97th centile line', out: true };
    var c = value < ref[1]
      ? 3 + (value - ref[0]) / (ref[1] - ref[0]) * 47
      : 50 + (value - ref[1]) / (ref[2] - ref[1]) * 47;
    return { text: 'around the ' + Math.round(c) + ordinal(Math.round(c)) + ' centile', out: false };
  }

  function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return 'th';
    var last = n % 10;
    return last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th';
  }

  function sortedMeasurements() {
    return S.measurements.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }

  /* =====================================================================
     Week content
     ===================================================================== */

  function bandFor(week) {
    for (var i = 0; i < D.BANDS.length; i++) {
      if (week >= D.BANDS[i].from && week <= D.BANDS[i].to) return D.BANDS[i];
    }
    return D.BANDS[D.BANDS.length - 1];
  }

  function weekAgeLabel(week) {
    if (week === 0) return 'First week';
    if (week < 9) return 'Week ' + week;
    var months = Math.round(week / 4.345 * 10) / 10;
    return 'Week ' + week + ' · about ' + (Math.round(months * 2) / 2) + ' months';
  }

  /* =====================================================================
     Rendering
     ===================================================================== */

  function render(scrollTop) {
    var host = el('view');
    if (!S.baby || !S.baby.dob) {
      el('topbar').hidden = true;
      el('tabbar').hidden = true;
      el('fab').hidden = true;
      host.innerHTML = welcomeView();
      return;
    }
    el('topbar').hidden = false;
    el('tabbar').hidden = false;
    el('fab').hidden = UI.tab === 'feeds';

    var a = ageInfo();
    el('babyName').textContent = S.baby.name || 'Baby';
    el('babyAge').textContent = a.label + (a.correctedLabel ? ' · ' + a.correctedLabel + ' corrected' : '');

    var views = {
      today: todayView, plan: planView, feeds: feedsView, calendar: calendarView,
      growth: growthView, milestones: milestonesView
    };
    host.innerHTML = (views[UI.tab] || todayView)();

    Array.prototype.forEach.call(el('tabbar').querySelectorAll('button'), function (b) {
      b.setAttribute('aria-selected', b.dataset.tab === UI.tab ? 'true' : 'false');
    });

    if (UI.tab === 'plan') {
      var chip = $('.weekstrip button[aria-current="true"]');
      if (chip && chip.scrollIntoView) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    if (scrollTop) window.scrollTo(0, 0);
  }

  /* --------------------------------------------------------- first run */

  function welcomeView() {
    return '' +
      '<div class="hero" style="margin-top:24px">' +
        '<div class="week-label">Birth to one year</div>' +
        '<h2>👶 Baby\'s First Year</h2>' +
        '<p class="small" style="margin:8px 0 0">A week-by-week plan, a calendar for appointments, growth charts and a record of every first. Set it up once — everything stays on this device.</p>' +
      '</div>' +
      '<div class="card">' +
        '<h3>Tell me about your baby</h3>' +
        babyFormFields({}) +
        '<button class="btn primary block" data-act="save-onboarding" type="button">Start the year</button>' +
        '<p class="tiny muted" style="margin-top:12px">Only the date of birth is required. Everything else can be added later, and nothing leaves your browser.</p>' +
      '</div>' +
      (storageBlocked ? '<div class="note alert small">This browser is blocking storage, so anything you enter will be lost when you close the tab. Private browsing is usually the cause.</div>' : '');
  }

  function babyFormFields(b) {
    var sex = b.sex || '';
    var reg = b.region || 'uk';
    var un = b.units || 'metric';
    var mode = b.feedMode || 'mixed';
    return '' +
      '<label class="field"><span>Baby\'s name</span>' +
        '<input type="text" id="f-name" value="' + esc(b.name || '') + '" placeholder="Optional" autocomplete="off" /></label>' +
      '<label class="field"><span>Date of birth</span>' +
        '<input type="date" id="f-dob" value="' + esc(b.dob || '') + '" max="' + toISO(today()) + '" /></label>' +
      '<label class="field"><span>Due date <span class="muted">— only if born early</span></span>' +
        '<input type="date" id="f-due" value="' + esc(b.dueDate || '') + '" /></label>' +
      '<label class="field"><span>Growth chart reference</span>' +
        '<select id="f-sex">' +
          '<option value=""' + (sex === '' ? ' selected' : '') + '>Prefer not to say (no reference lines)</option>' +
          '<option value="girl"' + (sex === 'girl' ? ' selected' : '') + '>Girl</option>' +
          '<option value="boy"' + (sex === 'boy' ? ' selected' : '') + '>Boy</option>' +
        '</select></label>' +
      '<label class="field"><span>Appointment schedule</span>' +
        '<select id="f-region">' +
          Object.keys(D.SCHEDULES).map(function (k) {
            return '<option value="' + k + '"' + (reg === k ? ' selected' : '') + '>' + esc(D.SCHEDULES[k].label) + '</option>';
          }).join('') +
        '</select></label>' +
      '<label class="field"><span>Units</span>' +
        '<select id="f-units">' +
          '<option value="metric"' + (un === 'metric' ? ' selected' : '') + '>Metric (kg, cm)</option>' +
          '<option value="imperial"' + (un === 'imperial' ? ' selected' : '') + '>Imperial (lb, oz, in)</option>' +
        '</select></label>' +
      '<label class="field"><span>How are you feeding?</span>' +
        '<select id="f-feedmode">' +
          '<option value="mixed"' + (mode === 'mixed' ? ' selected' : '') + '>Both breast and bottle</option>' +
          '<option value="breast"' + (mode === 'breast' ? ' selected' : '') + '>Breast — track minutes</option>' +
          '<option value="bottle"' + (mode === 'bottle' ? ' selected' : '') + '>Bottle — track millilitres</option>' +
        '</select></label>' +
      '<div class="field-row">' +
        '<label class="field"><span>First feed of the day</span>' +
          '<input type="time" id="f-daystart" value="' + esc(b.dayStart || '07:00') + '" /></label>' +
        '<label class="field"><span>Daily ml target <span class="muted">optional</span></span>' +
          '<input type="number" id="f-targetml" inputmode="numeric" min="0" max="1500" step="10" value="' +
            (b.targetMl || '') + '" placeholder="auto" /></label>' +
      '</div>' +
      '<p class="tiny muted" style="margin:-4px 0 12px">The suggested times are spaced out from the first feed. Leave the target blank and it is worked out from your baby\'s age and last weight.</p>';
  }

  /* -------------------------------------------------------------- today */

  function todayView() {
    var a = ageInfo();
    var week = currentWeek();
    var over = a.weeks > 52;
    var w = D.WEEKS[week];
    var band = bandFor(week);
    var pct = Math.max(2, Math.min(100, Math.round(a.days / 365 * 100)));

    var html = '' +
      '<section class="hero">' +
        '<div class="week-label">' + (over ? 'Past the first year' : weekAgeLabel(week)) + '</div>' +
        '<h2>' + esc(w.t) + '</h2>' +
        '<p class="small" style="margin:0">' + esc(w.n) + '</p>' +
        '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
        '<div class="progress-note">' + (over
          ? 'One year and counting — the plan below stays on the final week.'
          : esc(a.label) + ' · ' + (365 - a.days) + ' days to the first birthday') + '</div>' +
      '</section>';

    /* Next appointment */
    var next = upcomingAppointments(1)[0];
    html += '<section class="card"><h3>Next appointment</h3>';
    if (next) {
      html += appointmentItem(next, true);
    } else {
      var dueSuggestion = suggestions().filter(function (s) {
        return s.status === 'due' || s.status === 'upcoming';
      })[0];
      html += '<div class="empty">Nothing booked yet.' +
        (dueSuggestion
          ? '<br /><span class="tiny">' + (dueSuggestion.status === 'due'
              ? 'Due about now: ' + esc(dueSuggestion.item.title)
              : 'Next one usually due: ' + esc(dueSuggestion.item.title) + ', ' + formatDay(dueSuggestion.date)) + '</span>'
          : '') +
        '</div>' +
        '<button class="btn block sm" style="margin-top:10px" data-act="new-appointment" type="button">＋ Add an appointment</button>';
    }
    html += '</section>';

    /* Activities for this week */
    html += '<section class="card"><h3>Try this week</h3>' +
      band.activities.map(function (act, i) { return activityCheck(week, i, act); }).join('') +
      '</section>';

    /* What is happening */
    html += '<section class="card"><h3>What is happening — ' + esc(band.phase) + '</h3>' +
      '<ul class="bullets small">' + band.development.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' +
      '<button class="btn ghost sm" style="margin-top:8px;padding-left:0" data-act="goto-week" data-week="' + week + '" type="button">Open the full week →</button>' +
      '</section>';

    /* Feeding snapshot */
    var plan = feedingPlan();
    var iso = toISO(today());
    var tot = feedTotals(iso);
    var mlPct = plan.target.ml ? Math.min(100, Math.round(tot.ml / plan.target.ml * 100)) : 0;
    var nextSlot = null;
    var nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    for (var si = 0; si < plan.slots.length; si++) {
      if (plan.slots[si].at > nowMins && !feedNearest(plan.slots[si], iso)) { nextSlot = plan.slots[si]; break; }
    }
    html += '<section class="card"><h3>Feeding today</h3>' +
      '<div class="spread"><div><strong style="font-size:1.15rem">' +
        (tracksMl() ? tot.ml + ' / ' + plan.target.ml + ' ml' : pluralise(tot.feeds, 'feed') + ' · ' + tot.minutes + ' min') +
      '</strong><div class="small muted">' +
        pluralise(tot.feeds, 'feed') + ' logged' + (tot.meals ? ', ' + pluralise(tot.meals, 'meal') : '') +
        ' of about ' + plan.count + ' expected' + '</div></div>' +
      (nextSlot ? '<span class="pill accent">Next ' + fmtClock(nextSlot.at) + '</span>' : '') + '</div>' +
      (tracksMl() ? '<div class="progress" style="margin-top:12px"><i style="width:' + Math.max(2, mlPct) + '%"></i></div>' : '') +
      '<div class="row" style="gap:8px;margin-top:12px">' +
        '<button class="btn primary sm grow" data-act="new-feed" type="button">＋ Log a feed</button>' +
        '<button class="btn sm grow" data-act="tab" data-tab="feeds" type="button">See the chart</button>' +
      '</div></section>';

    /* Milestones snapshot */
    var cp = currentCheckpoint(a.months);
    var prog = checkpointProgress(cp);
    html += '<section class="card"><h3>Milestones</h3>' +
      '<div class="ring-row">' + ring(prog.pct) +
        '<div class="grow"><strong>' + esc(cp.label) + '</strong>' +
        '<div class="small muted">' + prog.done + ' of ' + prog.total + ' noticed so far. Every baby keeps their own timetable.</div></div>' +
      '</div>' +
      '<button class="btn block sm" style="margin-top:12px" data-act="tab" data-tab="milestones" type="button">Tick off what they can do</button>' +
      '</section>';

    /* Growth snapshot */
    var ms = sortedMeasurements();
    var last = ms[ms.length - 1];
    html += '<section class="card"><h3>Growth</h3>';
    if (last) {
      html += '<div class="spread"><div><strong>' + fmtWeight(last.weight) + '</strong>' +
        '<div class="small muted">' + formatDay(parseDay(last.date), { year: true }) + ' · ' +
        (last.length ? fmtLength(last.length) + ' long' : 'weight only') + '</div></div>' +
        '<button class="btn sm" data-act="new-measurement" type="button">＋ Add</button></div>';
    } else {
      html += '<div class="empty">No measurements yet. Add the birth weight to start the chart.</div>' +
        '<button class="btn block sm" style="margin-top:10px" data-act="new-measurement" type="button">＋ Add a measurement</button>';
    }
    html += '</section>';

    /* Parent care + help */
    html += '<section class="card"><h3>For you, not just the baby</h3><p class="small">' + esc(band.parent) + '</p></section>';
    html += helpCard();
    return html;
  }

  function activityCheck(week, i, act) {
    var key = week + ':' + i;
    var done = !!S.activities[key];
    return '<label class="check' + (done ? ' done' : '') + '">' +
      '<input type="checkbox"' + (done ? ' checked' : '') + ' data-act="toggle-activity" data-key="' + key + '" />' +
      '<span><span class="t">' + esc(act.t) + '</span><span class="w">' + esc(act.w) + '</span></span></label>';
  }

  function helpCard() {
    return '<details class="disclose"><summary>🚑 When to get help</summary><div class="body">' +
      '<p class="small" style="margin-top:0"><strong>Get urgent medical help</strong> — call your emergency number or go straight to A&amp;E — for any of these:</p>' +
      '<ul class="bullets small">' + D.HELP.urgent.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' +
      '<p class="small"><strong>Book a routine appointment</strong> for:</p>' +
      '<ul class="bullets small">' + D.HELP.routine.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' +
      '<p class="tiny muted">Trust your instinct. If something feels wrong, it is always worth asking — nobody will mind.</p>' +
      '</div></details>';
  }

  function ring(pct) {
    var r = 22, c = 2 * Math.PI * r;
    var off = c * (1 - pct / 100);
    return '<svg class="ring" viewBox="0 0 54 54" aria-hidden="true">' +
      '<circle class="track" cx="27" cy="27" r="' + r + '"></circle>' +
      '<circle class="val" cx="27" cy="27" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>' +
      '<text x="27" y="32">' + pct + '</text></svg>';
  }

  /* --------------------------------------------------------------- plan */

  function planView() {
    var week = UI.week == null ? currentWeek() : UI.week;
    var now = currentWeek();
    var w = D.WEEKS[week];
    var band = bandFor(week);
    var a = ageInfo();
    var start = addDays(a.dob, week * 7 + (a.preterm ? daysBetween(a.dob, parseDay(S.baby.dueDate)) : 0));

    var strip = '<div class="weekstrip">';
    for (var i = 0; i <= 52; i++) {
      strip += '<button type="button" data-act="goto-week" data-week="' + i + '"' +
        (i === week ? ' aria-current="true"' : '') + (i === now && i !== week ? ' class="is-now"' : '') +
        '><span class="n">WK</span>' + i + '</button>';
    }
    strip += '</div>';

    var html = '' +
      '<div class="weeknav">' +
        '<button class="icon-btn" type="button" data-act="goto-week" data-week="' + Math.max(0, week - 1) + '" aria-label="Previous week">‹</button>' +
        '<div class="grow center"><strong>' + esc(weekAgeLabel(week)) + '</strong>' +
          '<div class="tiny muted">from ' + formatDay(start) + (week === now ? ' · this week' : '') + '</div></div>' +
        '<button class="icon-btn" type="button" data-act="goto-week" data-week="' + Math.min(52, week + 1) + '" aria-label="Next week">›</button>' +
      '</div>' + strip +
      (week !== now ? '<button class="btn ghost sm block" style="margin-bottom:8px" data-act="goto-week" data-week="' + now + '" type="button">↩ Jump to this week</button>' : '') +
      '<section class="hero"><div class="week-label">' + esc(band.phase) + '</div>' +
        '<h2>' + esc(w.t) + '</h2><p class="small" style="margin:0">' + esc(w.n) + '</p></section>' +
      '<section class="card"><h3>Development</h3><ul class="bullets small">' +
        band.development.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="card"><h3>Feeding</h3><p class="small">' + esc(band.feeding) + '</p></section>' +
      '<section class="card"><h3>Sleep</h3><p class="small">' + esc(band.sleep) + '</p></section>' +
      '<section class="card"><h3>Activities for this age</h3>' +
        band.activities.map(function (act, i2) { return activityCheck(week, i2, act); }).join('') + '</section>';

    var sug = suggestionsForWeek(week);
    if (sug.length) {
      html += '<section class="card"><h3>Usually due around now</h3>' +
        sug.map(suggestionItem).join('') + '</section>';
    }

    html += '<section class="card"><h3>Keep an eye out</h3>' +
      '<ul class="bullets small">' + band.watch.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<p class="tiny muted" style="margin-top:8px">These are prompts to ask someone, not diagnoses. Wide variation is normal.</p></section>';

    html += '<section class="card"><h3>Your notes for week ' + week + '</h3>' +
      '<textarea id="weeknote" placeholder="What happened this week? First smile, a hard night, a question for the next appointment…" data-act="note-input" data-week="' + week + '">' +
        esc(S.notes[week] || '') + '</textarea>' +
      '<div class="tiny muted" id="notestatus" style="margin-top:6px">Saved automatically.</div></section>';

    html += '<section class="card"><h3>For you</h3><p class="small">' + esc(band.parent) + '</p></section>';
    return html;
  }

  /* ----------------------------------------------------------- calendar */

  function calendarView() {
    var t = today();
    var cursor = UI.calMonth ? parseDay(UI.calMonth + '-01') : new Date(t.getFullYear(), t.getMonth(), 1, 12, 0, 0, 0);
    var year = cursor.getFullYear(), month = cursor.getMonth();
    var first = new Date(year, month, 1, 12, 0, 0, 0);
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var offset = (first.getDay() - (weekStartsMonday() ? 1 : 0) + 7) % 7;

    var byDay = {};
    S.appointments.forEach(function (ap) { (byDay[ap.date] = byDay[ap.date] || []).push(ap); });
    var sugByDay = {};
    suggestions().forEach(function (s) {
      if (s.status === 'booked') return;
      var iso = toISO(s.date);
      (sugByDay[iso] = sugByDay[iso] || []).push(s);
    });

    var dows = weekStartsMonday()
      ? ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    var grid = '<div class="cal-grid">' + dows.map(function (d) { return '<div class="dow">' + d + '</div>'; }).join('');
    for (var b = 0; b < offset; b++) grid += '<div class="cal-cell blank"></div>';
    for (var day = 1; day <= daysInMonth; day++) {
      var d = new Date(year, month, day, 12, 0, 0, 0);
      var iso = toISO(d);
      var isToday = iso === toISO(t);
      var selected = UI.calDay === iso;
      var dots = '';
      if (byDay[iso]) dots += '<i></i>';
      if (sugByDay[iso]) dots += '<i class="suggested"></i>';
      grid += '<button class="cal-cell' + (isToday ? ' today' : '') + '" type="button" data-act="pick-day" data-date="' + iso + '"' +
        ' aria-pressed="' + (selected ? 'true' : 'false') + '"><span>' + day + '</span>' +
        '<span class="dots">' + dots + '</span></button>';
    }
    grid += '</div>';

    var html = '<section class="card">' +
      '<div class="cal-head">' +
        '<button class="icon-btn" type="button" data-act="cal-move" data-delta="-1" aria-label="Previous month">‹</button>' +
        '<strong>' + MONTH_NAMES[month] + ' ' + year + '</strong>' +
        '<button class="icon-btn" type="button" data-act="cal-move" data-delta="1" aria-label="Next month">›</button>' +
      '</div>' + grid +
      '<div class="row" style="margin-top:12px;gap:14px">' +
        '<span class="tiny muted"><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:5px"></i>Booked</span>' +
        '<span class="tiny muted"><i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--muted);margin-right:5px"></i>Suggested</span>' +
      '</div></section>';

    var dayISO = UI.calDay || toISO(t);
    var dayDate = parseDay(dayISO);
    var onDay = appointmentsOn(dayISO);
    var sugOnDay = sugByDay[dayISO] || [];
    html += '<section class="card">' +
      '<div class="spread" style="margin-bottom:10px"><h3 style="margin:0">' + formatDay(dayDate, { year: true }) + '</h3>' +
      '<button class="btn sm" data-act="new-appointment" data-date="' + dayISO + '" type="button">＋ Add</button></div>';
    if (!onDay.length && !sugOnDay.length) {
      html += '<div class="empty">Nothing on this day.</div>';
    } else {
      html += onDay.map(function (ap) { return appointmentItem(ap); }).join('');
      html += sugOnDay.map(suggestionItem).join('');
    }
    html += '</section>';

    var up = upcomingAppointments();
    html += '<h2 class="section-title">Coming up</h2>';
    html += up.length
      ? up.slice(0, 8).map(function (ap) { return appointmentItem(ap, true); }).join('')
      : '<div class="empty">No appointments booked. Add one, or book from the suggested schedule below.</div>';

    var past = pastAppointments();
    if (past.length) {
      html += '<details class="disclose" style="margin-top:10px"><summary>Earlier appointments <span class="pill">' + past.length + '</span></summary>' +
        '<div class="body">' + past.map(function (ap) { return appointmentItem(ap, true); }).join('') + '</div></details>';
    }
    if (S.appointments.length) {
      html += '<button class="btn block sm" style="margin-top:10px" data-act="export-ics-all" type="button">📤 Export appointments to a calendar file (.ics)</button>';
    }

    /* Items whose window has closed are folded away — by nine months there are
       a lot of them, and what is still ahead is what matters. */
    var sug = suggestions();
    var passed = sug.filter(function (x) { return x.status === 'overdue'; });
    var ahead = sug.filter(function (x) { return x.status !== 'overdue'; });
    html += '<h2 class="section-title">Suggested schedule <span class="pill">' + esc((D.SCHEDULES[region()] || D.SCHEDULES.generic).label) + '</span></h2>' +
      '<p class="small muted" style="margin:0 0 10px">Dated from your baby\'s birthday. Timings vary by country and by clinic — your own invitation letter always wins.</p>' +
      (ahead.length ? ahead.map(suggestionItem).join('') : '<div class="empty">Everything on this schedule has come and gone.</div>');
    if (passed.length) {
      html += '<details class="disclose" style="margin-top:10px">' +
        '<summary>Already passed <span class="pill">' + passed.length + '</span></summary>' +
        '<div class="body"><p class="tiny muted" style="margin-top:0">Add any of these you did attend, so the record is complete.</p>' +
        passed.map(suggestionItem).join('') + '</div></details>';
    }
    return html;
  }

  function appointmentItem(ap, showDate) {
    var meta = typeMeta(ap.type);
    var d = parseDay(ap.date);
    var when = (showDate ? formatDay(d, { year: false }) + ' · ' : '') +
      (ap.time ? formatTime(ap.time) : 'All day');
    var bits = [when];
    if (ap.location) bits.push(ap.location);
    if (ap.who) bits.push(ap.who);
    return '<button class="item" type="button" data-act="edit-appointment" data-id="' + esc(ap.id) + '">' +
      '<span class="lead">' + meta.emoji + '</span>' +
      '<span class="body"><strong>' + esc(ap.title) + '</strong><span>' + esc(bits.join(' · ')) + '</span></span>' +
      '<span class="pill' + (d < today() ? '' : ' accent') + '">' + esc(relativeDay(d)) + '</span></button>';
  }

  function suggestionItem(s) {
    var pillClass = s.status === 'booked' ? 'good' : s.status === 'overdue' ? 'warn' : s.status === 'due' ? 'accent' : '';
    var pillText = s.status === 'booked' ? 'Booked' : s.status === 'overdue' ? 'Was due' : s.status === 'due' ? 'Due now' : relativeDay(s.date);
    return '<div class="item" style="cursor:default">' +
      '<span class="lead">' + typeMeta(s.item.type).emoji + '</span>' +
      '<span class="body"><strong>' + esc(s.item.title) + '</strong>' +
        '<span>' + formatDay(s.date, { year: true }) + ' · ' + esc(s.item.note) + '</span>' +
        (s.status === 'booked'
          ? ''
          : '<button class="btn sm" style="margin-top:8px" type="button" data-act="book-suggestion" data-id="' + esc(s.item.id) + '">＋ Add to calendar</button>') +
      '</span>' +
      '<span class="pill ' + pillClass + '">' + esc(pillText) + '</span></div>';
  }

  /* ------------------------------------------------------------- growth */

  var METRICS = {
    weight: { key: 'weight', label: 'Weight', conv: weightAxis, unit: weightUnitLabel, fmt: fmtWeight },
    length: { key: 'length', label: 'Length', conv: lengthAxis, unit: lengthUnitLabel, fmt: fmtLength },
    head: { key: 'head', label: 'Head', conv: lengthAxis, unit: lengthUnitLabel, fmt: fmtLength }
  };

  function measurementMonths(m) {
    var a = ageInfo();
    var from = a.preterm ? parseDay(S.baby.dueDate) : a.dob;
    return Math.max(0, daysBetween(from, parseDay(m.date)) / 30.4375);
  }

  function growthView() {
    var metric = METRICS[UI.chart] || METRICS.weight;
    var ms = sortedMeasurements();
    var a = ageInfo();

    var html = '<section class="card">' +
      '<div class="seg" style="margin-bottom:14px">' +
        ['weight', 'length', 'head'].map(function (k) {
          return '<button type="button" data-act="chart" data-metric="' + k + '"' +
            ' aria-pressed="' + (UI.chart === k ? 'true' : 'false') + '">' +
            (k === 'head' ? 'Head' : METRICS[k].label) + '</button>';
        }).join('') +
      '</div>' + chartSvg(metric, ms) + '</section>';

    var withValue = ms.filter(function (m) { return m[metric.key] != null; });
    var last = withValue[withValue.length - 1];
    if (last) {
      var ref = referenceFor(metric.key);
      var c = ref ? estimateCentile(last[metric.key], interpolateRef(ref, measurementMonths(last))) : null;
      html += '<section class="card"><h3>Latest ' + metric.label.toLowerCase() + '</h3>' +
        '<div class="spread"><div><strong style="font-size:1.3rem">' + metric.fmt(last[metric.key]) + '</strong>' +
        '<div class="small muted">' + formatDay(parseDay(last.date), { year: true }) + '</div></div>' +
        (c ? '<span class="pill ' + (c.out ? 'warn' : 'accent') + '">' + esc(c.text) + '</span>' : '') + '</div>' +
        (c && c.out ? '<p class="small" style="margin-top:10px">Plenty of healthy babies sit outside the reference lines. What matters is the shape of the curve over time — mention it at your next check so it can be plotted properly.</p>' : '') +
        (!ref ? '<p class="tiny muted" style="margin-top:10px">Add a growth chart reference in settings to see the WHO centile band.</p>' : '') +
        '</section>';
    }

    html += '<div class="row" style="gap:8px;margin-bottom:14px">' +
      '<button class="btn primary grow" data-act="new-measurement" type="button">＋ Add a measurement</button></div>';

    if (ms.length) {
      html += '<section class="card"><h3>All measurements</h3><div class="table-wrap"><table class="data">' +
        '<thead><tr><th>Date</th><th>Age</th><th>Weight</th><th>Length</th><th>Head</th><th></th></tr></thead><tbody>' +
        ms.slice().reverse().map(function (m) {
          var mo = measurementMonths(m);
          return '<tr><td>' + formatDay(parseDay(m.date)) + '</td>' +
            '<td class="num muted">' + (mo < 2 ? Math.round(mo * 4.345) + 'w' : mo.toFixed(1) + 'm') + '</td>' +
            '<td class="num">' + (m.weight != null ? fmtWeight(m.weight) : '—') + '</td>' +
            '<td class="num">' + (m.length != null ? fmtLength(m.length) : '—') + '</td>' +
            '<td class="num">' + (m.head != null ? fmtLength(m.head) : '—') + '</td>' +
            '<td><button class="btn ghost sm" type="button" data-act="edit-measurement" data-id="' + esc(m.id) + '">Edit</button></td></tr>';
        }).join('') +
        '</tbody></table></div></section>';
    } else {
      html += '<div class="empty">No measurements yet. Start with the birth weight, then add each one from your clinic visits.</div>';
    }

    html += '<div class="note small" style="margin-top:14px">Babies rarely track one line exactly, and a single low or high reading is not a problem on its own. ' +
      'Your clinic plots the official chart — this one is for you to see the trend between visits.' +
      (a.preterm ? ' Ages here are corrected for prematurity, which is what growth charts use in the first two years.' : '') + '</div>';
    return html;
  }

  function chartSvg(metric, ms) {
    var W = 340, H = 210, padL = 36, padR = 8, padT = 10, padB = 24;
    var ref = referenceFor(metric.key);
    var points = ms.filter(function (m) { return m[metric.key] != null; }).map(function (m) {
      return { x: Math.min(12.4, measurementMonths(m)), y: metric.conv(m[metric.key]) };
    });

    if (!ref && !points.length) {
      return '<div class="empty">Nothing to plot yet. Add a measurement and the chart appears here.</div>';
    }

    var lo = Infinity, hi = -Infinity;
    if (ref) {
      ref.forEach(function (r) {
        lo = Math.min(lo, metric.conv(r[0]));
        hi = Math.max(hi, metric.conv(r[2]));
      });
    }
    points.forEach(function (p) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); });
    if (!isFinite(lo)) { lo = 0; hi = 1; }
    var span = hi - lo || 1;
    lo -= span * 0.08; hi += span * 0.08;

    function px(months) { return padL + (months / 12) * (W - padL - padR); }
    function py(v) { return H - padB - ((v - lo) / (hi - lo)) * (H - padT - padB); }

    var svg = '<div class="chart-wrap"><svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
      'aria-label="' + esc(metric.label) + ' chart from birth to twelve months">';

    /* horizontal gridlines and y labels */
    var ticks = 4;
    for (var i = 0; i <= ticks; i++) {
      var v = lo + (hi - lo) * (i / ticks);
      var y = py(v);
      svg += '<line class="gridline" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '"></line>' +
        '<text x="' + (padL - 5) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + (v >= 100 ? v.toFixed(0) : v.toFixed(1)) + '</text>';
    }
    /* x axis labels, every 2 months */
    for (var mth = 0; mth <= 12; mth += 2) {
      svg += '<text x="' + px(mth).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + mth + 'm</text>';
    }
    svg += '<line class="axis" x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '"></line>';

    if (ref) {
      var top = [], bottom = [], mid = [];
      for (var k = 0; k <= 12; k++) {
        top.push(px(k).toFixed(1) + ',' + py(metric.conv(ref[k][2])).toFixed(1));
        bottom.unshift(px(k).toFixed(1) + ',' + py(metric.conv(ref[k][0])).toFixed(1));
        mid.push(px(k).toFixed(1) + ',' + py(metric.conv(ref[k][1])).toFixed(1));
      }
      svg += '<polygon class="band" points="' + top.concat(bottom).join(' ') + '"></polygon>';
      svg += '<polyline class="median" points="' + mid.join(' ') + '"></polyline>';
    }

    if (points.length) {
      svg += '<polyline class="line" points="' + points.map(function (p) {
        return px(p.x).toFixed(1) + ',' + py(p.y).toFixed(1);
      }).join(' ') + '"></polyline>';
      svg += points.map(function (p) {
        return '<circle class="dot" cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="3"></circle>';
      }).join('');
    }

    svg += '</svg></div>' +
      '<div class="tiny muted" style="margin-top:6px">' +
        (ref ? 'Shaded band: WHO 3rd–97th centile, dashed line the 50th. ' : '') +
        metric.label + ' in ' + metric.unit() + ', age in months.</div>';
    return svg;
  }

  /* --------------------------------------------------------- milestones */

  function currentCheckpoint(months) {
    for (var i = 0; i < D.MILESTONES.length; i++) {
      if (months <= D.MILESTONES[i].month) return D.MILESTONES[i];
    }
    return D.MILESTONES[D.MILESTONES.length - 1];
  }

  function checkpointProgress(cp) {
    var total = 0, done = 0;
    cp.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        total++;
        if (S.milestones[it.id]) done++;
      });
    });
    return { total: total, done: done, pct: total ? Math.round(done / total * 100) : 0 };
  }

  function milestonesView() {
    var a = ageInfo();
    var cp = currentCheckpoint(a.months);
    var totalDone = Object.keys(S.milestones).length;

    var html = '<section class="hero"><div class="week-label">Achievements</div>' +
      '<h2>' + pluralise(totalDone, 'first') + ' recorded</h2>' +
      '<p class="small" style="margin:0">Tick things off as you notice them. The dates are yours to keep, and they are handy to have at reviews.</p></section>';

    html += D.MILESTONES.map(function (c) {
      var p = checkpointProgress(c);
      var open = UI.openCheckpoint === null ? c.id === cp.id : UI.openCheckpoint === c.id;
      return '<details class="disclose"' + (open ? ' open' : '') + '>' +
        '<summary data-act="open-checkpoint" data-id="' + c.id + '">' + esc(c.label) + ' <span class="pill' + (p.pct === 100 ? ' good' : open ? ' accent' : '') + '">' + p.done + '/' + p.total + '</span></summary>' +
        '<div class="body">' +
          c.groups.map(function (g) {
            return '<h4 class="tiny muted" style="margin:12px 0 6px;text-transform:uppercase;letter-spacing:.06em">' + esc(g.g) + '</h4>' +
              g.items.map(function (it) {
                var rec = S.milestones[it.id];
                return '<label class="check' + (rec ? ' done' : '') + '">' +
                  '<input type="checkbox"' + (rec ? ' checked' : '') + ' data-act="toggle-milestone" data-id="' + esc(it.id) + '" />' +
                  '<span><span class="t">' + esc(it.t) + '</span>' +
                  (rec && rec.date ? '<span class="w">Noticed ' + formatDay(parseDay(rec.date), { year: true }) + '</span>' : '') +
                  '</span></label>';
              }).join('') ;
          }).join('') +
          '<p class="tiny muted" style="margin-top:12px">Missing a few is common and usually fine. If a whole group is blank well past the age, or your baby has lost a skill they had, mention it at your next review.</p>' +
        '</div></details>';
    }).join('');

    return html;
  }

  /* =====================================================================
     Feeding — a suggested shape for the day, what actually happened, and
     the gap between the two.

     Totals run midnight to midnight so a day always means the same thing.
     Suggested times are generated from the day's first feed and wrapped
     into that same calendar day, so a round-the-clock newborn schedule
     shows its small-hours feeds at the start of the day rather than
     spilling into tomorrow.
     ===================================================================== */

  var FEED_KINDS = [
    { v: 'bottle', label: 'Bottle', short: 'Bottle', emoji: '🍼' },
    { v: 'breast', label: 'Breast', short: 'Breast', emoji: '🤱' },
    { v: 'solids', label: 'Solid food', short: 'Solids', emoji: '🥣' }
  ];

  function feedKindMeta(v) {
    for (var i = 0; i < FEED_KINDS.length; i++) if (FEED_KINDS[i].v === v) return FEED_KINDS[i];
    return FEED_KINDS[0];
  }

  function feedMode() { return (S.baby && S.baby.feedMode) || 'mixed'; }
  function tracksMl() { return feedMode() !== 'breast'; }
  function tracksMinutes() { return feedMode() !== 'bottle'; }

  function dayStartMinutes() {
    var t = (S.baby && S.baby.dayStart) || '07:00';
    return minutesOfDay(t);
  }

  function minutesOfDay(hhmm) {
    var p = String(hhmm || '').split(':');
    var m = (+p[0] || 0) * 60 + (+p[1] || 0);
    return isNaN(m) ? 420 : Math.max(0, Math.min(1439, m));
  }

  function fmtClock(mins) {
    var m = ((Math.round(mins) % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), r = m % 60;
    return (h < 10 ? '0' : '') + h + ':' + (r < 10 ? '0' : '') + r;
  }

  function feedBandFor(week) {
    var bands = D.FEEDING.bands;
    for (var i = 0; i < bands.length; i++) {
      if (week >= bands[i].from && week <= bands[i].to) return bands[i];
    }
    return bands[bands.length - 1];
  }

  function latestWeightKg() {
    var withWeight = sortedMeasurements().filter(function (m) { return m.weight != null; });
    return withWeight.length ? withWeight[withWeight.length - 1].weight : null;
  }

  /* The daily milk target, and — just as important — where it came from. */
  function dailyTarget() {
    var week = currentWeek();
    var band = feedBandFor(week);
    var override = S.baby && S.baby.targetMl;
    if (override) {
      return { ml: override, basis: 'your own target', band: band };
    }
    var kg = latestWeightKg();
    var F = D.FEEDING;
    /* The 150 ml/kg rule only holds once full feeds are established and
       before solid food starts taking over. */
    if (kg && week >= 2 && week <= F.weightRuleUntilWeek) {
      var ml = Math.min(F.maxDailyMl, Math.round(kg * F.mlPerKgPerDay / 10) * 10);
      return {
        ml: ml,
        basis: F.mlPerKgPerDay + ' ml per kg, from the last weight of ' + fmtWeight(kg),
        band: band
      };
    }
    /* Only offer the weight nudge when a weight would actually change the
       figure: outside weeks 2–26 the target comes from the age band either
       way, because solids take over from milk. */
    var wouldUseWeight = !kg && week >= 2 && week <= F.weightRuleUntilWeek;
    return {
      ml: Math.round((band.dailyMl[0] + band.dailyMl[1]) / 20) * 10,
      basis: 'typical for week ' + week + (wouldUseWeight ? ' — log a weight for a target scaled to your baby' : ''),
      band: band
    };
  }

  /* The projected day: one entry per suggested feed, sorted by clock time. */
  function feedingPlan() {
    var week = currentWeek();
    var band = feedBandFor(week);
    var target = dailyTarget();
    var count = band.count;
    var perFeedMl = Math.round(target.ml / count / 5) * 5;
    var perFeedMins = Math.round((band.minutes[0] + band.minutes[1]) / 2);
    var start = dayStartMinutes();
    var slots = [];
    for (var i = 0; i < count; i++) {
      /* Rounded to the nearest quarter hour: 09:30 is a time a person can
         actually aim for, 09:24 is noise. */
      var raw = start + i * band.interval * 60;
      var at = ((Math.round(raw / 15) * 15) % 1440 + 1440) % 1440;
      slots.push({ at: at, ml: perFeedMl, minutes: perFeedMins, night: at < 360 || at >= 1320 });
    }
    slots.sort(function (a, b) { return a.at - b.at; });
    return {
      week: week, band: band, target: target, count: count,
      perFeedMl: perFeedMl, perFeedMins: perFeedMins, slots: slots,
      dailyMinutes: perFeedMins * count
    };
  }

  function sortedFeeds() {
    return S.feeds.slice().sort(function (a, b) {
      if (a.date === b.date) return minutesOfDay(a.time) - minutesOfDay(b.time);
      return a.date < b.date ? -1 : 1;
    });
  }

  function feedsOn(iso) {
    return sortedFeeds().filter(function (f) { return f.date === iso; });
  }

  /* Solid meals are logged and counted, but never folded into the milk
     totals the projection is about. */
  function isMilk(f) { return f.kind !== 'solids'; }

  function feedTotals(iso) {
    var list = feedsOn(iso);
    var t = { ml: 0, minutes: 0, feeds: 0, meals: 0 };
    list.forEach(function (f) {
      if (!isMilk(f)) { t.meals++; return; }
      t.feeds++;
      if (f.ml) t.ml += f.ml;
      if (f.minutes) t.minutes += f.minutes;
    });
    return t;
  }

  var MEASURES = {
    ml: { label: 'Millilitres', short: 'ml', unit: 'ml' },
    minutes: { label: 'Minutes', short: 'min', unit: 'min' },
    feeds: { label: 'Feeds', short: 'feeds', unit: '' }
  };

  function availableMeasures() {
    var out = [];
    if (tracksMl()) out.push('ml');
    if (tracksMinutes()) out.push('minutes');
    out.push('feeds');
    return out;
  }

  function activeMeasure() {
    var avail = availableMeasures();
    return avail.indexOf(UI.feedMeasure) >= 0 ? UI.feedMeasure : avail[0];
  }

  function projectionBasis(measure, plan) {
    if (measure === 'ml') return plan.target.basis;
    if (measure === 'minutes') {
      return 'about ' + plan.band.minutes[0] + '–' + plan.band.minutes[1] + ' minutes a feed at this age';
    }
    return plan.band.feeds[0] + '–' + plan.band.feeds[1] + ' feeds a day at this age';
  }

  function targetFor(measure, plan) {
    if (measure === 'ml') return plan.target.ml;
    if (measure === 'minutes') return plan.dailyMinutes;
    return plan.count;
  }

  function actualFor(measure, iso) {
    var t = feedTotals(iso);
    return measure === 'ml' ? t.ml : measure === 'minutes' ? t.minutes : t.feeds;
  }

  function feedValue(f, measure) {
    if (measure === 'feeds') return isMilk(f) ? 1 : 0;
    if (!isMilk(f)) return 0;
    return (measure === 'ml' ? f.ml : f.minutes) || 0;
  }

  /* Round a maximum up so that dividing it into `ticks` gives clean labels:
     910 ml becomes 1000 (0/250/500/750/1000), not 983. */
  function niceCeil(value, ticks) {
    ticks = ticks || 4;
    if (!(value > 0)) return ticks;
    var raw = value / ticks;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 3 ? 3 : norm <= 5 ? 5 : 10) * mag;
    return step * ticks;
  }

  /* -------------------------------------------------------------- view */

  function feedsView() {
    var plan = feedingPlan();
    var iso = UI.feedDay || toISO(today());
    var d = parseDay(iso);
    var isToday = iso === toISO(today());
    var measure = activeMeasure();
    var totals = feedTotals(iso);
    var target = targetFor(measure, plan);
    var actual = actualFor(measure, iso);
    var pct = target ? Math.min(100, Math.round(actual / target * 100)) : 0;

    /* Only mention what was actually recorded — a parent logging bottles
       does not need "0 min" in the headline every day. */
    var summary = [];
    if (tracksMl() && totals.ml) summary.push(totals.ml + ' ml');
    if (tracksMinutes() && totals.minutes) summary.push(totals.minutes + ' min');
    if (totals.feeds) summary.push(pluralise(totals.feeds, 'feed'));
    if (totals.meals) summary.push(pluralise(totals.meals, 'meal'));
    if (!summary.length) summary.push('Nothing logged yet');

    var html = '<section class="hero">' +
      '<div class="week-label">' + (isToday ? 'Today' : formatDay(d, { year: true })) + '</div>' +
      '<h2>' + esc(summary.join(' · ')) + '</h2>' +
      '<p class="small" style="margin:0">Projected ' + (measure === 'feeds' ? plan.count + ' feeds' : target + ' ' + MEASURES[measure].unit) +
        ' across the day — ' + esc(projectionBasis(measure, plan)) + '.</p>' +
      '<div class="progress"><i style="width:' + Math.max(2, pct) + '%"></i></div>' +
      '<div class="progress-note">' + pct + '% of the projection' +
        (isToday ? ' so far today' : '') + '</div>' +
      '</section>';

    /* Chart: day or week, against the projection. */
    html += '<section class="card">' +
      '<div class="seg" style="margin-bottom:10px">' +
        '<button type="button" data-act="feed-range" data-range="day" aria-pressed="' + (UI.feedRange !== 'week' ? 'true' : 'false') + '">Day</button>' +
        '<button type="button" data-act="feed-range" data-range="week" aria-pressed="' + (UI.feedRange === 'week' ? 'true' : 'false') + '">Week</button>' +
      '</div>';
    if (availableMeasures().length > 1) {
      html += '<div class="seg" style="margin-bottom:14px">' +
        availableMeasures().map(function (m) {
          return '<button type="button" data-act="feed-measure" data-measure="' + m + '"' +
            ' aria-pressed="' + (measure === m ? 'true' : 'false') + '">' + MEASURES[m].label + '</button>';
        }).join('') + '</div>';
    }
    html += (UI.feedRange === 'week' ? weekChart(iso, measure, plan) : dayChart(iso, measure, plan));
    html += '<div class="row" style="justify-content:space-between;margin-top:12px">' +
        '<button class="btn sm" type="button" data-act="feed-day" data-delta="-1">‹ ' + (UI.feedRange === 'week' ? 'Previous week' : 'Previous day') + '</button>' +
        (isToday ? '' : '<button class="btn sm" type="button" data-act="feed-day" data-delta="0">Today</button>') +
        '<button class="btn sm" type="button" data-act="feed-day" data-delta="1"' + (isToday ? ' disabled style="opacity:.4"' : '') + '>' +
          (UI.feedRange === 'week' ? 'Next week' : 'Next day') + ' ›</button>' +
      '</div></section>';

    /* Suggested times for the day, each tickable straight into the log. */
    html += '<h2 class="section-title">Suggested times</h2>' +
      '<p class="small muted" style="margin:0 0 10px">' + plan.band.feeds[0] + '–' + plan.band.feeds[1] + ' feeds a day at this age, about ' +
      (plan.band.interval % 1 === 0 ? plan.band.interval : plan.band.interval.toFixed(1)) + ' hours apart' +
      (tracksMl() ? ', around ' + plan.perFeedMl + ' ml each' : '') +
      (tracksMinutes() ? ', roughly ' + plan.band.minutes[0] + '–' + plan.band.minutes[1] + ' minutes at the breast' : '') +
      '. Spaced out from your first feed of the day (' + esc((S.baby && S.baby.dayStart) || '07:00') +
      '), midnight to midnight.</p>' +
      plan.slots.map(function (slot) { return slotItem(slot, iso, plan); }).join('');

    if (plan.band.solids) {
      html += '<div class="note small" style="margin-top:12px"><strong>🥣 Solid food</strong><br />' + esc(plan.band.solids) + '</div>';
    }
    html += '<div class="note small" style="margin-top:10px">' + esc(plan.band.note) + '</div>';

    /* What actually happened. */
    var list = feedsOn(iso);
    html += '<h2 class="section-title">' + (isToday ? 'Logged today' : 'Logged on ' + formatDay(d)) +
      ' <span class="pill">' + list.length + '</span></h2>';
    html += list.length
      ? list.map(feedItem).join('')
      : '<div class="empty">Nothing logged for this day yet.</div>';
    html += '<button class="btn primary block" style="margin-top:12px" data-act="new-feed" data-date="' + iso + '" type="button">＋ Log a feed</button>';

    html += '<details class="disclose" style="margin-top:14px"><summary>How to read all this</summary><div class="body">' +
      '<ul class="bullets small" style="margin-top:6px">' +
        D.FEEDING.guidance.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') +
      '</ul>' +
      '<p class="small" style="margin-bottom:6px"><strong>Worth asking about:</strong></p>' +
      '<ul class="bullets small">' + D.FEEDING.flags.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '</div></details>';
    return html;
  }

  /* A suggested slot counts as taken if something was logged within 75
     minutes of it — close enough that showing it as missed would be wrong. */
  function feedNearest(slot, iso) {
    var best = null, bestGap = Infinity;
    feedsOn(iso).filter(isMilk).forEach(function (f) {
      var gap = Math.abs(minutesOfDay(f.time) - slot.at);
      if (gap < bestGap) { bestGap = gap; best = f; }
    });
    return bestGap <= 75 ? best : null;
  }

  function slotItem(slot, iso, plan) {
    var match = feedNearest(slot, iso);
    var nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    var isToday = iso === toISO(today());
    var passed = !isToday || slot.at <= nowMins;
    var detail = [];
    if (tracksMl()) detail.push('about ' + slot.ml + ' ml');
    if (tracksMinutes()) detail.push(plan.band.minutes[0] + '–' + plan.band.minutes[1] + ' min');
    var pill = match
      ? '<span class="pill good">Done</span>'
      : passed
        ? '<span class="pill warn">Not logged</span>'
        : '<span class="pill">' + (slot.night ? 'Night' : 'To come') + '</span>';
    return '<div class="item" style="cursor:default">' +
      '<span class="lead">' + (match ? '✓' : slot.night ? '🌙' : '🍼') + '</span>' +
      '<span class="body"><strong>' + fmtClock(slot.at) + '</strong>' +
        '<span>' + esc(detail.join(' · ')) +
          (match ? ' · logged at ' + esc(formatTime(match.time)) +
            (match.ml ? ', ' + match.ml + ' ml' : '') +
            (match.minutes ? ', ' + match.minutes + ' min' : '') : '') + '</span>' +
        (match ? '' : '<button class="btn sm" style="margin-top:8px" type="button" data-act="new-feed"' +
          ' data-date="' + iso + '" data-time="' + fmtClock(slot.at) + '" data-ml="' + slot.ml + '"' +
          ' data-minutes="' + slot.minutes + '">＋ Log this feed</button>') +
      '</span>' + pill + '</div>';
  }

  function feedItem(f) {
    var meta = feedKindMeta(f.kind);
    var bits = [];
    if (f.ml) bits.push(f.ml + ' ml');
    if (f.minutes) bits.push(f.minutes + ' min');
    if (f.side) bits.push(f.side);
    if (f.notes) bits.push(f.notes);
    return '<button class="item" type="button" data-act="edit-feed" data-id="' + esc(f.id) + '">' +
      '<span class="lead">' + meta.emoji + '</span>' +
      '<span class="body"><strong>' + esc(formatTime(f.time)) + ' · ' + esc(meta.label) + '</strong>' +
      '<span>' + esc(bits.join(' · ') || 'no detail') + '</span></span>' +
      '<span class="pill">Edit</span></button>';
  }

  /* ------------------------------------------------------------- charts */

  /* Cumulative through the day: the projection as a dashed staircase, what
     actually happened as a solid one. Works for ml, minutes or feed count. */
  function dayChart(iso, measure, plan) {
    var W = 340, H = 200, padL = 38, padR = 10, padT = 12, padB = 26;
    var list = feedsOn(iso).filter(function (f) { return feedValue(f, measure) > 0; });
    var target = targetFor(measure, plan);

    var projPts = [{ x: 0, y: 0 }];
    var running = 0;
    plan.slots.forEach(function (slot) {
      var v = measure === 'ml' ? slot.ml : measure === 'minutes' ? slot.minutes : 1;
      projPts.push({ x: slot.at, y: running });
      running += v;
      projPts.push({ x: slot.at, y: running });
    });
    projPts.push({ x: 1440, y: running });

    var actPts = [{ x: 0, y: 0 }];
    var run2 = 0;
    list.forEach(function (f) {
      var at = minutesOfDay(f.time);
      actPts.push({ x: at, y: run2 });
      run2 += feedValue(f, measure);
      actPts.push({ x: at, y: run2 });
    });
    var isToday = iso === toISO(today());
    var nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    actPts.push({ x: isToday ? Math.max(nowMins, 0) : 1440, y: run2 });

    var hi = niceCeil(Math.max(running, run2, target, 1) * 1.02, 4);
    function px(m) { return padL + (m / 1440) * (W - padL - padR); }
    function py(v) { return H - padB - (v / hi) * (H - padT - padB); }
    function path(pts) { return pts.map(function (p) { return px(p.x).toFixed(1) + ',' + py(p.y).toFixed(1); }).join(' '); }

    var svg = '<div class="chart-wrap"><svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      esc('Cumulative ' + MEASURES[measure].label.toLowerCase() + ' through the day against the projection') + '">';
    for (var i = 0; i <= 4; i++) {
      var v = hi * (i / 4), y = py(v);
      svg += '<line class="gridline" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '"></line>' +
        '<text x="' + (padL - 5) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + Math.round(v) + '</text>';
    }
    for (var h = 0; h <= 24; h += 6) {
      var anchor = h === 0 ? 'start' : h === 24 ? 'end' : 'middle';
      svg += '<text x="' + px(h * 60).toFixed(1) + '" y="' + (H - 9) + '" text-anchor="' + anchor + '">' +
        (h < 10 ? '0' : '') + h + ':00</text>';
    }
    svg += '<line class="axis" x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '"></line>';
    svg += '<polyline class="proj" points="' + path(projPts) + '"></polyline>';
    if (isToday) {
      svg += '<line class="now" x1="' + px(nowMins).toFixed(1) + '" y1="' + padT + '" x2="' + px(nowMins).toFixed(1) + '" y2="' + (H - padB) + '"></line>';
    }
    svg += '<polyline class="line" points="' + path(actPts) + '"></polyline>';
    svg += list.map(function (f, idx) {
      var upto = 0;
      for (var j = 0; j <= idx; j++) upto += feedValue(list[j], measure);
      return '<circle class="dot" cx="' + px(minutesOfDay(f.time)).toFixed(1) + '" cy="' + py(upto).toFixed(1) + '" r="3"></circle>';
    }).join('');
    svg += '</svg></div>' +
      '<div class="legend tiny muted"><span class="k-act">Logged</span><span class="k-proj">Projection</span>' +
      (isToday ? '<span class="k-now">Now</span>' : '') + '</div>' +
      '<div class="tiny muted" style="margin-top:4px">Running total of ' + MEASURES[measure].label.toLowerCase() +
      ' from midnight. Projection: ' + Math.round(running) + ' ' + (MEASURES[measure].unit || 'feeds') + ' over ' + plan.count + ' feeds.</div>';
    return svg;
  }

  /* Seven days of totals as bars, with the projection as a level line. */
  function weekChart(iso, measure, plan) {
    var W = 340, H = 200, padL = 38, padR = 10, padT = 12, padB = 30;
    var end = parseDay(iso);
    var days = [];
    for (var i = 6; i >= 0; i--) {
      var d = addDays(end, -i);
      var dIso = toISO(d);
      days.push({ iso: dIso, date: d, value: actualFor(measure, dIso), meals: feedTotals(dIso).meals });
    }
    var target = targetFor(measure, plan);
    var hi = niceCeil(Math.max(target, Math.max.apply(null, days.map(function (x) { return x.value; })), 1) * 1.04, 4);
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var slotW = plotW / 7, barW = Math.min(28, slotW * 0.56);

    function py(v) { return H - padB - (v / hi) * plotH; }

    var svg = '<div class="chart-wrap"><svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      esc('Daily ' + MEASURES[measure].label.toLowerCase() + ' for the last seven days against the projection') + '">';
    for (var g = 0; g <= 4; g++) {
      var v = hi * (g / 4), y = py(v);
      svg += '<line class="gridline" x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '"></line>' +
        '<text x="' + (padL - 5) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end">' + Math.round(v) + '</text>';
    }
    days.forEach(function (day, i) {
      var cx = padL + slotW * (i + 0.5);
      var h = day.value > 0 ? Math.max(1.5, py(0) - py(day.value)) : 0;
      var selected = day.iso === iso;
      if (h) {
        svg += '<rect class="bar' + (selected ? ' sel' : '') + '" x="' + (cx - barW / 2).toFixed(1) + '" y="' + py(day.value).toFixed(1) +
          '" width="' + barW.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3"></rect>';
      }
      svg += '<text x="' + cx.toFixed(1) + '" y="' + (H - 15) + '" text-anchor="middle">' + DOW_SHORT[day.date.getDay()].charAt(0) + '</text>';
      svg += '<text x="' + cx.toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle"' + (selected ? ' style="fill:var(--accent)"' : '') + '>' + day.date.getDate() + '</text>';
    });
    svg += '<line class="target" x1="' + padL + '" y1="' + py(target).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + py(target).toFixed(1) + '"></line>';
    svg += '<line class="axis" x1="' + padL + '" y1="' + (H - padB) + '" x2="' + (W - padR) + '" y2="' + (H - padB) + '"></line>';
    svg += '</svg></div>';

    var logged = days.filter(function (x) { return x.value > 0; });
    var avg = logged.length ? Math.round(logged.reduce(function (a, x) { return a + x.value; }, 0) / logged.length) : 0;
    svg += '<div class="legend tiny muted"><span class="k-act">Daily total</span><span class="k-proj">Projection (' + Math.round(target) + ')</span></div>' +
      '<div class="tiny muted" style="margin-top:4px">' +
        (logged.length
          ? 'Average over the ' + pluralise(logged.length, 'day') + ' with anything logged: <strong>' + avg + ' ' + (MEASURES[measure].unit || 'feeds') + '</strong> a day.'
          : 'Nothing logged in this week yet.') +
      '</div>';
    return svg;
  }

  /* =====================================================================
     Sheets
     ===================================================================== */

  function openSheet(title, bodyHtml) {
    el('sheetHost').innerHTML =
      '<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="grab"></div><h2>' + esc(title) + '</h2>' + bodyHtml + '</div></div>';
    document.body.style.overflow = 'hidden';
    var firstInput = $('.sheet input, .sheet select, .sheet textarea');
    if (firstInput && firstInput.type !== 'date') firstInput.focus();
  }

  function closeSheet() {
    el('sheetHost').innerHTML = '';
    document.body.style.overflow = '';
  }

  function appointmentSheet(ap) {
    var editing = !!ap.id;
    var opts = APPT_TYPES.map(function (t) {
      return '<option value="' + t.v + '"' + (ap.type === t.v ? ' selected' : '') + '>' + t.emoji + '  ' + esc(t.label) + '</option>';
    }).join('');
    var body = '' +
      '<input type="hidden" id="a-id" value="' + esc(ap.id || '') + '" />' +
      '<input type="hidden" id="a-suggestion" value="' + esc(ap.suggestionId || '') + '" />' +
      '<label class="field"><span>What is it?</span><input type="text" id="a-title" value="' + esc(ap.title || '') + '" placeholder="e.g. 8 week immunisations" /></label>' +
      '<label class="field"><span>Type</span><select id="a-type">' + opts + '</select></label>' +
      '<div class="field-row">' +
        '<label class="field"><span>Date</span><input type="date" id="a-date" value="' + esc(ap.date || toISO(today())) + '" /></label>' +
        '<label class="field"><span>Time <span class="muted">optional</span></span><input type="time" id="a-time" value="' + esc(ap.time || '') + '" /></label>' +
      '</div>' +
      '<label class="field"><span>Where <span class="muted">optional</span></span><input type="text" id="a-location" value="' + esc(ap.location || '') + '" placeholder="Surgery, clinic, address" /></label>' +
      '<label class="field"><span>Who with <span class="muted">optional</span></span><input type="text" id="a-who" value="' + esc(ap.who || '') + '" placeholder="Dr Patel, health visitor…" /></label>' +
      '<label class="field"><span>Notes <span class="muted">optional</span></span><textarea id="a-notes" placeholder="Questions to ask, what to bring, red book…">' + esc(ap.notes || '') + '</textarea></label>' +
      '<div class="sheet-actions">' +
        '<button class="btn" type="button" data-act="close-sheet">Cancel</button>' +
        '<button class="btn primary" type="button" data-act="save-appointment">Save</button>' +
      '</div>' +
      (editing
        ? '<div class="sheet-actions">' +
            '<button class="btn" type="button" data-act="appt-ics" data-id="' + esc(ap.id) + '">📤 To phone calendar</button>' +
            '<button class="btn danger" type="button" data-act="delete-appointment" data-id="' + esc(ap.id) + '">Delete</button></div>'
        : '');
    openSheet(editing ? 'Edit appointment' : 'New appointment', body);
  }

  function feedSheet(f) {
    var editing = !!f.id;
    var kind = f.kind || (feedMode() === 'breast' ? 'breast' : 'bottle');
    var now = new Date();
    var body = '' +
      '<input type="hidden" id="fd-id" value="' + esc(f.id || '') + '" />' +
      '<div class="seg" style="margin-bottom:14px">' +
        FEED_KINDS.map(function (k) {
          return '<button type="button" data-act="feed-kind" data-kind="' + k.v + '"' +
            ' aria-pressed="' + (kind === k.v ? 'true' : 'false') + '">' + k.emoji + ' ' + esc(k.short) + '</button>';
        }).join('') +
      '</div>' +
      '<input type="hidden" id="fd-kind" value="' + esc(kind) + '" />' +
      '<div class="field-row">' +
        '<label class="field"><span>Date</span><input type="date" id="fd-date" value="' +
          esc(f.date || UI.feedDay || toISO(today())) + '" max="' + toISO(today()) + '" /></label>' +
        '<label class="field"><span>Time</span><input type="time" id="fd-time" value="' +
          esc(f.time || fmtClock(now.getHours() * 60 + now.getMinutes())) + '" /></label>' +
      '</div>' +
      (kind === 'solids'
        ? '<label class="field"><span>What did they eat?</span><input type="text" id="fd-notes" value="' + esc(f.notes || '') +
            '" placeholder="Porridge and pear, a few spoons" /></label>'
        : '<div class="field-row">' +
            (kind === 'breast'
              ? ''
              : '<label class="field"><span>Millilitres taken</span><input type="number" id="fd-ml" inputmode="numeric" min="0" max="500" step="5" value="' +
                  (f.ml != null ? f.ml : '') + '" placeholder="e.g. ' + feedingPlan().perFeedMl + '" /></label>') +
            '<label class="field"><span>Minutes</span><input type="number" id="fd-minutes" inputmode="numeric" min="0" max="180" step="1" value="' +
              (f.minutes != null ? f.minutes : '') + '" placeholder="e.g. ' + feedingPlan().perFeedMins + '" /></label>' +
          '</div>' +
          (kind === 'breast'
            ? '<label class="field"><span>Side</span><select id="fd-side">' +
                ['', 'left', 'right', 'both'].map(function (sd) {
                  return '<option value="' + sd + '"' + ((f.side || '') === sd ? ' selected' : '') + '>' +
                    (sd === '' ? 'Not recorded' : sd.charAt(0).toUpperCase() + sd.slice(1)) + '</option>';
                }).join('') + '</select></label>'
            : '') +
          '<label class="field"><span>Notes <span class="muted">optional</span></span><input type="text" id="fd-notes" value="' +
            esc(f.notes || '') + '" placeholder="Fussy, fell asleep, big posset…" /></label>') +
      '<div class="sheet-actions">' +
        '<button class="btn" type="button" data-act="close-sheet">Cancel</button>' +
        '<button class="btn primary" type="button" data-act="save-feed">Save</button>' +
      '</div>' +
      (editing ? '<div class="sheet-actions"><button class="btn danger block" type="button" data-act="delete-feed" data-id="' +
        esc(f.id) + '">Delete this feed</button></div>' : '');
    openSheet(editing ? 'Edit feed' : 'Log a feed', body);
  }

  function measurementSheet(m) {
    var editing = !!m.id;
    var imperial = units() === 'imperial';
    var lb = '', oz = '';
    if (m.weight != null && imperial) {
      var totalOz = m.weight * 35.27396;
      lb = Math.floor(totalOz / 16);
      oz = Math.round(totalOz - lb * 16);
    }
    var weightField = imperial
      ? '<div class="field-row">' +
          '<label class="field"><span>Weight — pounds</span><input type="number" id="m-lb" inputmode="numeric" min="0" step="1" value="' + lb + '" placeholder="lb" /></label>' +
          '<label class="field"><span>Ounces</span><input type="number" id="m-oz" inputmode="decimal" min="0" max="15" step="0.5" value="' + oz + '" placeholder="oz" /></label>' +
        '</div>'
      : '<label class="field"><span>Weight (kg)</span><input type="number" id="m-weight" inputmode="decimal" min="0" step="0.01" value="' + (m.weight != null ? m.weight : '') + '" placeholder="e.g. 4.25" /></label>';

    var body = '' +
      '<input type="hidden" id="m-id" value="' + esc(m.id || '') + '" />' +
      '<label class="field"><span>Date measured</span><input type="date" id="m-date" value="' + esc(m.date || toISO(today())) + '" max="' + toISO(today()) + '" /></label>' +
      weightField +
      '<div class="field-row">' +
        '<label class="field"><span>Length (' + (imperial ? 'in' : 'cm') + ')</span><input type="number" id="m-length" inputmode="decimal" min="0" step="0.1" value="' + (m.length != null ? (imperial ? (m.length / 2.54).toFixed(1) : m.length) : '') + '" /></label>' +
        '<label class="field"><span>Head (' + (imperial ? 'in' : 'cm') + ')</span><input type="number" id="m-head" inputmode="decimal" min="0" step="0.1" value="' + (m.head != null ? (imperial ? (m.head / 2.54).toFixed(1) : m.head) : '') + '" /></label>' +
      '</div>' +
      '<p class="tiny muted">Fill in whatever you have — a weight on its own is fine.</p>' +
      '<div class="sheet-actions">' +
        '<button class="btn" type="button" data-act="close-sheet">Cancel</button>' +
        '<button class="btn primary" type="button" data-act="save-measurement">Save</button></div>' +
      (editing ? '<div class="sheet-actions"><button class="btn danger block" type="button" data-act="delete-measurement" data-id="' + esc(m.id) + '">Delete this measurement</button></div>' : '');
    openSheet(editing ? 'Edit measurement' : 'Add a measurement', body);
  }

  function settingsSheet() {
    var body = babyFormFields(S.baby || {}) +
      '<div class="sheet-actions">' +
        '<button class="btn" type="button" data-act="close-sheet">Cancel</button>' +
        '<button class="btn primary" type="button" data-act="save-settings">Save</button>' +
      '</div>' +
      '<h3 style="margin:24px 0 8px;font-size:.78rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Your data</h3>' +
      '<p class="small muted" style="margin-top:0">Everything is stored in this browser only. Export a backup before changing phones or clearing your browser data.</p>' +
      '<div class="stack">' +
        '<button class="btn block" type="button" data-act="export-json">⬇️ Export a backup file</button>' +
        '<button class="btn block" type="button" data-act="import-json">⬆️ Restore from a backup</button>' +
        '<button class="btn block danger" type="button" data-act="reset-all">Delete everything</button>' +
      '</div>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden />' +
      '<p class="tiny muted" style="margin-top:18px">Baby\'s First Year keeps general guidance for planning and remembering. It is not medical advice and does not replace your midwife, health visitor, GP or paediatrician. Growth reference bands are from the WHO Child Growth Standards; milestone lists follow widely used development checklists.</p>';
    openSheet('Settings', body);
  }

  function quickAddSheet() {
    var body = '<div class="stack">' +
      '<button class="btn block" type="button" data-act="new-feed">🍼  Log a feed</button>' +
      '<button class="btn block" type="button" data-act="new-appointment">📅  Add an appointment</button>' +
      '<button class="btn block" type="button" data-act="new-measurement">📈  Add a measurement</button>' +
      '<button class="btn block" type="button" data-act="tab" data-tab="milestones">⭐  Record a milestone</button>' +
      '<button class="btn block" type="button" data-act="goto-week" data-week="' + currentWeek() + '">📝  Write this week\'s note</button>' +
      '</div>' +
      '<div class="sheet-actions"><button class="btn block" type="button" data-act="close-sheet">Cancel</button></div>';
    openSheet('Add', body);
  }

  /* =====================================================================
     Calendar file export (.ics) — so appointments can be pushed into
     whatever calendar app the phone already uses.
     ===================================================================== */

  function icsEscape(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function icsFold(line) {
    if (line.length <= 74) return line;
    var out = line.slice(0, 74), rest = line.slice(74);
    while (rest.length) {
      out += '\r\n ' + rest.slice(0, 73);
      rest = rest.slice(73);
    }
    return out;
  }

  function icsFor(list) {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Baby First Year//EN', 'CALSCALE:GREGORIAN'];
    list.forEach(function (ap) {
      var d = parseDay(ap.date);
      var ymd = toISO(d).replace(/-/g, '');
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + ap.id + '@babyfirstyear');
      lines.push('DTSTAMP:' + stamp);
      if (ap.time) {
        var hm = ap.time.split(':');
        var startH = ('0' + hm[0]).slice(-2) + ('0' + (hm[1] || '00')).slice(-2) + '00';
        var endMinutes = (+hm[0]) * 60 + (+(hm[1] || 0)) + 30;
        var eh = ('0' + Math.floor(endMinutes / 60) % 24).slice(-2), em = ('0' + endMinutes % 60).slice(-2);
        lines.push('DTSTART:' + ymd + 'T' + startH);
        lines.push('DTEND:' + ymd + 'T' + eh + em + '00');
      } else {
        lines.push('DTSTART;VALUE=DATE:' + ymd);
        lines.push('DTEND;VALUE=DATE:' + toISO(addDays(d, 1)).replace(/-/g, ''));
      }
      lines.push('SUMMARY:' + icsEscape(ap.title + (S.baby.name ? ' — ' + S.baby.name : '')));
      if (ap.location) lines.push('LOCATION:' + icsEscape(ap.location));
      var desc = [];
      if (ap.who) desc.push('With: ' + ap.who);
      if (ap.notes) desc.push(ap.notes);
      if (desc.length) lines.push('DESCRIPTION:' + icsEscape(desc.join('\n')));
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(ap.title),
        'TRIGGER:' + (ap.time ? '-PT2H' : '-P1D'), 'END:VALARM');
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(icsFold).join('\r\n');
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function slug(s) {
    return String(s || 'baby').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'baby';
  }

  /* =====================================================================
     Actions
     ===================================================================== */

  function readBabyForm() {
    var dob = el('f-dob').value;
    if (!dob) { alert('A date of birth is needed to build the plan.'); return null; }
    var due = el('f-due').value || '';
    if (due && due < dob) {
      /* A due date before the birth date means the baby arrived late; there is
         nothing to correct for, so it is simply ignored. */
      due = '';
    }
    var targetMl = parseInt(el('f-targetml').value, 10);
    return {
      name: el('f-name').value.trim(),
      dob: dob,
      dueDate: due,
      sex: el('f-sex').value,
      region: el('f-region').value,
      units: el('f-units').value,
      feedMode: el('f-feedmode').value,
      dayStart: el('f-daystart').value || '07:00',
      targetMl: isNaN(targetMl) || targetMl <= 0 ? null : targetMl
    };
  }

  function findAppointment(id) {
    for (var i = 0; i < S.appointments.length; i++) if (S.appointments[i].id === id) return S.appointments[i];
    return null;
  }

  function findFeed(id) {
    for (var i = 0; i < S.feeds.length; i++) if (S.feeds[i].id === id) return S.feeds[i];
    return null;
  }

  function readFeedForm() {
    var kind = el('fd-kind').value;
    var sideNode = el('fd-side');
    return {
      id: el('fd-id').value || null,
      date: el('fd-date').value,
      time: el('fd-time').value,
      kind: kind,
      ml: kind === 'solids' ? null : num('fd-ml'),
      minutes: kind === 'solids' ? null : num('fd-minutes'),
      side: sideNode ? sideNode.value : null,
      notes: el('fd-notes') ? el('fd-notes').value.trim() : ''
    };
  }

  function findMeasurement(id) {
    for (var i = 0; i < S.measurements.length; i++) if (S.measurements[i].id === id) return S.measurements[i];
    return null;
  }

  function num(id) {
    var node = el(id);
    if (!node || node.value === '') return null;
    var v = parseFloat(node.value);
    return isNaN(v) ? null : v;
  }

  var ACTIONS = {
    'save-onboarding': function () {
      var b = readBabyForm();
      if (!b) return;
      S.baby = b;
      save();
      render();
    },

    'tab': function (t) {
      closeSheet();
      UI.tab = t.dataset.tab;
      if (UI.tab === 'plan') UI.week = null;
      render(true);
    },

    'goto-week': function (t) {
      closeSheet();
      UI.tab = 'plan';
      UI.week = Math.max(0, Math.min(52, parseInt(t.dataset.week, 10) || 0));
      render(true);
    },

    'chart': function (t) {
      UI.chart = t.dataset.metric;
      render();
    },

    'cal-move': function (t) {
      var base = UI.calMonth ? parseDay(UI.calMonth + '-01') : today();
      var d = new Date(base.getFullYear(), base.getMonth() + parseInt(t.dataset.delta, 10), 1, 12, 0, 0, 0);
      UI.calMonth = toISO(d).slice(0, 7);
      render();
    },

    'pick-day': function (t) {
      UI.calDay = t.dataset.date;
      render();
    },

    'new-appointment': function (t) {
      closeSheet();
      appointmentSheet({ date: (t && t.dataset.date) || UI.calDay || toISO(today()), type: 'paediatrician' });
    },

    'edit-appointment': function (t) {
      var ap = findAppointment(t.dataset.id);
      if (ap) appointmentSheet(ap);
    },

    'book-suggestion': function (t) {
      var match = suggestions().filter(function (s) { return s.item.id === t.dataset.id; })[0];
      if (!match) return;
      appointmentSheet({
        title: match.item.title,
        type: match.item.type === 'vaccine' ? 'vaccine' : match.item.type === 'screening' ? 'screening' : 'check',
        date: toISO(match.date),
        notes: match.item.note,
        suggestionId: match.item.id
      });
    },

    'save-appointment': function () {
      var title = el('a-title').value.trim();
      var date = el('a-date').value;
      if (!date) { alert('Pick a date for this appointment.'); return; }
      var id = el('a-id').value;
      var rec = id ? findAppointment(id) : null;
      var data = {
        id: id || uid(),
        title: title || typeMeta(el('a-type').value).label,
        type: el('a-type').value,
        date: date,
        time: el('a-time').value,
        location: el('a-location').value.trim(),
        who: el('a-who').value.trim(),
        notes: el('a-notes').value.trim(),
        suggestionId: el('a-suggestion').value || null
      };
      if (rec) {
        S.appointments[S.appointments.indexOf(rec)] = data;
      } else {
        S.appointments.push(data);
      }
      save();
      UI.calDay = date;
      closeSheet();
      render();
    },

    'delete-appointment': function (t) {
      var ap = findAppointment(t.dataset.id);
      if (!ap) return;
      if (!confirm('Delete "' + ap.title + '"?')) return;
      S.appointments.splice(S.appointments.indexOf(ap), 1);
      save();
      closeSheet();
      render();
    },

    'appt-ics': function (t) {
      var ap = findAppointment(t.dataset.id);
      if (ap) download(slug(ap.title) + '.ics', icsFor([ap]), 'text/calendar;charset=utf-8');
    },

    'export-ics-all': function () {
      var list = sortedAppointments();
      if (!list.length) return;
      download(slug(S.baby.name) + '-appointments.ics', icsFor(list), 'text/calendar;charset=utf-8');
    },

    'new-feed': function (t) {
      closeSheet();
      feedSheet({
        date: (t && t.dataset.date) || UI.feedDay || toISO(today()),
        time: t && t.dataset.time ? t.dataset.time : null,
        ml: t && t.dataset.ml ? parseInt(t.dataset.ml, 10) : null,
        minutes: t && t.dataset.minutes ? parseInt(t.dataset.minutes, 10) : null
      });
    },

    'edit-feed': function (t) {
      var f = findFeed(t.dataset.id);
      if (f) feedSheet(f);
    },

    /* Switching kind re-opens the sheet, because a bottle and a bowl of
       porridge need different fields. Whatever is filled in is carried over. */
    'feed-kind': function (t) {
      var draft = readFeedForm();
      draft.kind = t.dataset.kind;
      feedSheet(draft);
    },

    'save-feed': function () {
      var data = readFeedForm();
      if (!data.date) { alert('Pick the date of this feed.'); return; }
      if (!data.time) { alert('Pick the time of this feed.'); return; }
      if (data.kind !== 'solids' && !data.ml && !data.minutes) {
        alert('Add a volume or a number of minutes, so it can be compared with the projection.');
        return;
      }
      var rec = data.id ? findFeed(data.id) : null;
      data.id = data.id || uid();
      if (rec) S.feeds[S.feeds.indexOf(rec)] = data;
      else S.feeds.push(data);
      save();
      UI.feedDay = data.date;
      closeSheet();
      if (UI.tab !== 'feeds' && UI.tab !== 'today') UI.tab = 'feeds';
      render();
    },

    'delete-feed': function (t) {
      var f = findFeed(t.dataset.id);
      if (!f) return;
      if (!confirm('Delete this feed?')) return;
      S.feeds.splice(S.feeds.indexOf(f), 1);
      save();
      closeSheet();
      render();
    },

    'feed-range': function (t) {
      UI.feedRange = t.dataset.range;
      render();
    },

    'feed-measure': function (t) {
      UI.feedMeasure = t.dataset.measure;
      render();
    },

    'feed-day': function (t) {
      var delta = parseInt(t.dataset.delta, 10);
      if (!delta) {
        UI.feedDay = toISO(today());
      } else {
        var step = UI.feedRange === 'week' ? 7 : 1;
        var next = addDays(parseDay(UI.feedDay || toISO(today())), delta * step);
        /* There is nothing to show in the future. */
        UI.feedDay = next > today() ? toISO(today()) : toISO(next);
      }
      render();
    },

    'new-measurement': function () {
      closeSheet();
      measurementSheet({});
    },

    'edit-measurement': function (t) {
      var m = findMeasurement(t.dataset.id);
      if (m) measurementSheet(m);
    },

    'save-measurement': function () {
      var date = el('m-date').value;
      if (!date) { alert('Pick the date this was measured.'); return; }
      var imperial = units() === 'imperial';
      var weight = null;
      if (imperial) {
        var lb = num('m-lb'), oz = num('m-oz');
        if (lb != null || oz != null) weight = ((lb || 0) * 16 + (oz || 0)) / 35.27396;
      } else {
        weight = num('m-weight');
      }
      var length = num('m-length'), head = num('m-head');
      if (imperial) {
        if (length != null) length = length * 2.54;
        if (head != null) head = head * 2.54;
      }
      if (weight == null && length == null && head == null) {
        alert('Add at least one measurement.');
        return;
      }
      var id = el('m-id').value;
      var rec = id ? findMeasurement(id) : null;
      var data = {
        id: id || uid(),
        date: date,
        weight: weight == null ? null : Math.round(weight * 1000) / 1000,
        length: length == null ? null : Math.round(length * 10) / 10,
        head: head == null ? null : Math.round(head * 10) / 10
      };
      if (rec) {
        S.measurements[S.measurements.indexOf(rec)] = data;
      } else {
        S.measurements.push(data);
      }
      save();
      closeSheet();
      render();
    },

    'delete-measurement': function (t) {
      var m = findMeasurement(t.dataset.id);
      if (!m) return;
      if (!confirm('Delete this measurement?')) return;
      S.measurements.splice(S.measurements.indexOf(m), 1);
      save();
      closeSheet();
      render();
    },

    'settings': function () { settingsSheet(); },

    'save-settings': function () {
      var b = readBabyForm();
      if (!b) return;
      S.baby = b;
      save();
      closeSheet();
      render();
    },

    'export-json': function () {
      download(slug(S.baby && S.baby.name) + '-first-year-backup.json', JSON.stringify(S, null, 2), 'application/json');
    },

    'import-json': function () {
      var input = el('importFile');
      if (input) input.click();
    },

    'reset-all': function () {
      if (!confirm('This deletes the profile, appointments, measurements, milestones and notes on this device. There is no undo. Continue?')) return;
      S = migrate(null);
      save();
      closeSheet();
      UI = {
        tab: 'today', week: null, calMonth: null, calDay: null, chart: 'weight',
        openCheckpoint: null, feedRange: 'day', feedMeasure: null, feedDay: null
      };
      render();
    },

    'open-checkpoint': function (t) {
      UI.openCheckpoint = UI.openCheckpoint === t.dataset.id ? '' : t.dataset.id;
      render();
    },

    'close-sheet': function () { closeSheet(); },

    'quick-add': function () { quickAddSheet(); }
  };

  /* =====================================================================
     Wiring
     ===================================================================== */

  document.addEventListener('click', function (e) {
    var scrim = e.target.classList && e.target.classList.contains('scrim');
    if (scrim) { closeSheet(); return; }
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    var act = t.dataset.act;
    if (act === 'scrim') return;
    if (t.tagName === 'INPUT') return;      /* checkboxes are handled on change */
    var fn = ACTIONS[act];
    if (fn) {
      e.preventDefault();
      fn(t);
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t.dataset) return;
    if (t.dataset.act === 'toggle-activity') {
      if (t.checked) S.activities[t.dataset.key] = true;
      else delete S.activities[t.dataset.key];
      save();
      var label = t.closest('.check');
      if (label) label.classList.toggle('done', t.checked);
      return;
    }
    if (t.dataset.act === 'toggle-milestone') {
      if (t.checked) S.milestones[t.dataset.id] = { date: toISO(today()) };
      else delete S.milestones[t.dataset.id];
      save();
      render();
      return;
    }
    if (t.id === 'importFile' && t.files && t.files[0]) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var incoming = JSON.parse(reader.result);
          if (!incoming || typeof incoming !== 'object') throw new Error('bad file');
          S = migrate(incoming);
          save();
          closeSheet();
          render();
          alert('Backup restored.');
        } catch (err) {
          alert('That file could not be read as a Baby\'s First Year backup.');
        }
      };
      reader.readAsText(t.files[0]);
    }
  });

  /* Week notes save as you type, debounced so storage is not hit per keystroke. */
  var noteTimer = null;
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t.dataset || t.dataset.act !== 'note-input') return;
    var week = t.dataset.week;
    var value = t.value;
    clearTimeout(noteTimer);
    var status = el('notestatus');
    if (status) status.textContent = 'Saving…';
    noteTimer = setTimeout(function () {
      if (value.trim()) S.notes[week] = value;
      else delete S.notes[week];
      save();
      if (status) status.textContent = storageBlocked ? 'This browser is blocking storage — notes will not persist.' : 'Saved automatically.';
    }, 500);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && el('sheetHost').innerHTML) closeSheet();
  });

  el('tabbar').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-tab]');
    if (!b) return;
    UI.tab = b.dataset.tab;
    if (UI.tab === 'plan') UI.week = null;
    render(true);
  });

  el('settingsBtn').addEventListener('click', settingsSheet);
  el('fab').addEventListener('click', quickAddSheet);

  /* Another tab of the same app may have written newer data. */
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    S = loadState();
    if (!el('sheetHost').innerHTML) render();
  });

  /* Coming back to the app on a later day should move the plan on. */
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && !el('sheetHost').innerHTML) render();
  });

  render();
})();
