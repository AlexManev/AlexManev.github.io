/* =========================================================================
   Garden Planner — app logic
   Plain script (no modules, no build step). Reads window.GP_DATA from
   data.js, keeps everything the user enters in localStorage on this device.
   ========================================================================= */
(function () {
  'use strict';

  /* Must match the ?v= stamp and window.GP_BUILD in index.html. Bump both
     together when any of styles.css, data.js or app.js changes. */
  const BUILD = '2026-10-29';
  const KEY = 'garden-planner-v1';

  const D = window.GP_DATA;
  const PL = {};
  D.plants.forEach((p) => { PL[p.id] = p; });
  const isCrop = (p) => !!(p.out || p.dir || p.fo || p.fd);
  const isTree = (p) => !!p.tasks;

  /* =====================================================================
     Storage — localStorage with an in-memory fallback so a blocked storage
     jar (private browsing, cookies disabled) degrades instead of crashing.
     ===================================================================== */

  let memoryStore = null;
  let storageBlocked = false;

  function loadState() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch (e) {
      storageBlocked = true;
      raw = memoryStore;
    }
    let parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    }
    return migrate(parsed);
  }

  function migrate(s) {
    s = s || {};
    const preset = D.locations.find((l) => l.id === s.loc) || {};
    const beds = (Array.isArray(s.beds) ? s.beds : []).map((b) => Object.assign({}, b, {
      rows: (Array.isArray(b.rows) ? b.rows : []).filter((r) => PL[r.p])
    }));
    return {
      v: 1,
      setup: !!s.setup,
      loc: s.loc || null,
      lf: s.lf || '04-20',            // last spring frost, MM-DD
      ff: s.ff || '11-05',            // first autumn frost, MM-DD
      mild: s.mild != null ? s.mild : (preset.mild || 0),       // weeks cool crops grow on into winter
      tree: s.tree != null ? s.tree : (preset.tree || 0),       // fruit-tree shift vs last frost, weeks
      region: s.region != null ? s.region : (preset.region || ''),
      wx: s.wx !== false,             // live weather & watering advice
      lat: s.lat != null ? s.lat : (preset.lat != null ? preset.lat : null),
      lon: s.lon != null ? s.lon : (preset.lon != null ? preset.lon : null),
      geo: !!s.geo,                   // lat/lon came from the device, not the area
      watered: s.watered || {},       // watering target id -> ISO date last watered
      beds: beds,                     // {id, name, kind, w, l, rows:[{id, p, m, d, n, v}]}
      trees: (Array.isArray(s.trees) ? s.trees : []).filter((t) => PL[t.p]), // {id, p, v, y, note}
      done: s.done || {},             // task key -> ISO date ticked
      tasks: Array.isArray(s.tasks) ? s.tasks : [], // {id, d, t}
      favs: s.favs || {}
    };
  }

  function save() {
    const raw = JSON.stringify(S);
    memoryStore = raw;
    try {
      localStorage.setItem(KEY, raw);
    } catch (e) {
      storageBlocked = true;
    }
  }

  let S = loadState();
  const UI = {
    tab: 'today', season: null, month: null, todayMode: 'upcoming',
    agenda: null, agendaDay: null, cat: 'all', q: '', sheet: null, detailTab: 'neighbours',
    basicsOpen: false
  };

  /* =====================================================================
     Small helpers
     ===================================================================== */

  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (id) => document.getElementById(id);
  const uid = () => Math.random().toString(36).slice(2, 10);
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const MS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ML = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /* All dates are local and pinned to midday so DST shifts never move a day. */
  function pd(s) { const a = s.split('-'); return new Date(+a[0], a[1] - 1, +a[2], 12); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addD(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function today() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12); }
  function days(a, b) { return Math.round((b - a) / 864e5); }
  function som(d) { return new Date(d.getFullYear(), d.getMonth(), 1, 12); }
  function eom(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12); }
  function maxD(a, b) { return a > b ? a : b; }
  function minD(a, b) { return a < b ? a : b; }

  function fmt(d) { return d.getDate() + ' ' + MS[d.getMonth()]; }
  function fmtY(d) { return fmt(d) + (d.getFullYear() !== today().getFullYear() ? ' ' + d.getFullYear() : ''); }
  function phase(d) {
    const x = d.getDate();
    return (x <= 10 ? 'Early ' : x <= 20 ? 'Mid ' : 'Late ') + ML[d.getMonth()];
  }
  function monthSpan(a, b) {
    return a.getMonth() === b.getMonth() && days(a, b) < 40 ? MS[a.getMonth()] : MS[a.getMonth()] + ' – ' + MS[b.getMonth()];
  }
  function rel(d) {
    const n = days(today(), d);
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n < 0) return -n + ' days ago';
    if (n < 7) return DOW[d.getDay()];
    return fmtY(d);
  }

  /* =====================================================================
     Climate — every date in the app hangs off the two frost dates.
     A "season" s is the growing year whose last spring frost falls in
     calendar year s; in the southern hemisphere it runs across New Year.
     ===================================================================== */

  function mmdd(s) { const a = s.split('-'); return [a[0] - 1, +a[1]]; }
  function LF(s) { const m = mmdd(S.lf); return new Date(s, m[0], m[1], 12); }
  function FF(s) {
    const lf = LF(s), m = mmdd(S.ff);
    let d = new Date(s, m[0], m[1], 12);
    if (d <= lf) d = new Date(s + 1, m[0], m[1], 12);
    return d;
  }
  /* The season view starts three months before the last frost. */
  function seasonStart(s) { return new Date(s, LF(s).getMonth() - 3, 1, 12); }
  function seasonEnd(s) { return addD(seasonStart(s + 1), -1); }
  function seasonOf(d) {
    let s = d.getFullYear();
    if (d < seasonStart(s)) s--;
    else if (d >= seasonStart(s + 1)) s++;
    return s;
  }
  function seasonLabel(s) {
    const a = seasonStart(s), b = seasonEnd(s);
    return a.getFullYear() === b.getFullYear() ? String(a.getFullYear()) : a.getFullYear() + '/' + String(b.getFullYear()).slice(2);
  }
  function seasonMonths(s) {
    const a = seasonStart(s), out = [];
    for (let i = 0; i < 12; i++) out.push(new Date(a.getFullYear(), a.getMonth() + i, 1, 12));
    return out;
  }
  function nextFF(d) {
    const s = seasonOf(d);
    for (let i = s - 1; i <= s + 1; i++) { const f = FF(i); if (f > d) return f; }
    return FF(s + 1);
  }
  const south = () => mmdd(S.lf)[0] >= 6;
  function seasonName(d) {
    let m = d.getMonth();
    if (south()) m = (m + 6) % 12;
    return m < 2 || m === 11 ? 'Winter' : m < 5 ? 'Spring' : m < 8 ? 'Summer' : 'Autumn';
  }
  function locName() {
    const l = D.locations.find((x) => x.id === S.loc);
    return l ? l.name : 'Your garden';
  }

  /* =====================================================================
     Plant timing
     ===================================================================== */

  const dirExtra = (p) => (p.ind ? Math.round(p.ind * 7 * 0.6) : 0);

  /* In mild winters cool-season crops keep growing, so their autumn
     windows open later and run on into winter. Tender crops never do. */
  function mildW(p) {
    if (!S.mild || p.frost === 't') return 0;
    return Math.min(S.mild, p.mw == null ? S.mild : p.mw);
  }

  /* Date a planting reaches `need` growing days. Growth slows to a crawl
     between the first and last frost — less so where winters are mild. */
  function grown(start, need) {
    const r = 0.25 + 0.04 * Math.min(16, S.mild || 0), s0 = seasonOf(start), fr = [];
    for (let i = s0 - 2; i <= s0 + 3; i++) fr.push([FF(i), LF(i + 1)]);
    let d = start, left = need;
    for (let k = 0; k < 12; k++) {
      const inF = fr.find((x) => d >= x[0] && d < x[1]);
      if (inF) {
        const cap = days(d, inF[1]) * r;
        if (left <= cap) return addD(d, Math.ceil(left / r));
        left -= cap; d = inF[1];
      } else {
        const nx = fr.find((x) => x[0] > d);
        if (!nx || left <= days(d, nx[0])) return addD(d, Math.ceil(left));
        left -= days(d, nx[0]); d = nx[0];
      }
    }
    return addD(d, Math.ceil(left));
  }

  /* Latest sensible planting date so a crop still has time to crop before
     frost (tender) or shortly after it (half-hardy). Hardy crops: no cap. */
  function capFor(p, ff, kind) {
    const grow = p.dtm + (kind === 'dir' ? dirExtra(p) : 0);
    if (p.frost === 't') return addD(ff, -(grow + 14));
    if (p.frost === 'h') return addD(ff, 21 - grow + mildW(p) * 7);
    return null;
  }

  /* Planting windows for one season: {k: 'out'|'dir', a, b, fall}. */
  function wins(p, s) {
    const lf = LF(s), ff = FF(s), out = [];
    const m = mildW(p);
    function push(k, base, w, fall) {
      const a = addD(base, (w[0] + (fall ? Math.round(m / 4) : 0)) * 7);
      let b = addD(base, (w[1] + (fall ? m : 0)) * 7);
      const cap = capFor(p, ff, k);
      if (cap && b > cap) b = cap;
      if (b >= a) out.push({ k: k, a: a, b: b, fall: !!fall });
    }
    if (p.out) push('out', lf, p.out);
    if (p.dir) push('dir', lf, p.dir);
    if (p.fo) push('out', ff, p.fo, true);
    if (p.fd) push('dir', ff, p.fd, true);
    return out;
  }

  function winsAround(p, d, before, after) {
    const s = seasonOf(d), out = [];
    for (let i = s - (before == null ? 1 : before); i <= s + (after == null ? 1 : after); i++) wins(p, i).forEach((w) => out.push(w));
    return out;
  }

  function methods(p) {
    const m = [];
    if (p.dir || p.fd) m.push('direct');
    if (p.ind && (p.out || p.fo)) m.push('indoor');
    if (p.out || p.fo) m.push('seedling');
    return m;
  }
  function defMethod(p) {
    const m = methods(p);
    if (p.pref && m.indexOf(p.pref) >= 0) return p.pref;
    return m.indexOf('indoor') >= 0 ? 'indoor' : m[0];
  }
  const METHOD = { direct: 'Sow direct', indoor: 'Raise from seed', seedling: 'Plant seedlings' };
  const kindFor = (m) => (m === 'direct' ? 'dir' : 'out');

  function fit(p, m, d) {
    const kind = kindFor(m);
    let best = null, gap = Infinity;
    winsAround(p, d).forEach((w) => {
      if (w.k !== kind) return;
      const g = d < w.a ? days(d, w.a) : d > w.b ? days(w.b, d) : 0;
      if (g < gap) { gap = g; best = w; }
    });
    if (!best) return { s: 'none' };
    return { s: gap === 0 ? 'good' : gap <= 10 ? 'near' : 'bad', w: best, early: d < best.a };
  }

  function nextPerfect(p, m, from) {
    const kind = kindFor(m);
    let best = null;
    winsAround(p, from, 1, 2).forEach((w) => {
      if (w.k !== kind || w.b < from) return;
      const d = w.a > from ? w.a : from;
      if (!best || d < best) best = d;
    });
    return best;
  }

  /* Best method + date to start a plant from a given day. Raising from seed
     is only suggested when there's still time to sow it; otherwise it falls
     back to bought seedlings for the window that's open now. */
  function suggest(p, from) {
    const m = defMethod(p);
    if (m === 'indoor') {
      const di = nextPerfect(p, 'indoor', maxD(from, addD(today(), p.ind * 7)));
      const ds = nextPerfect(p, 'seedling', from);
      if (ds && (!di || days(ds, di) > 30)) return { m: 'seedling', d: ds };
      return { m: 'indoor', d: di || from };
    }
    return { m: m, d: nextPerfect(p, m, from) || from };
  }

  function perfectFor(p, m) {
    const t = today();
    return (m === 'indoor' && nextPerfect(p, m, addD(t, p.ind * 7))) || nextPerfect(p, m, t);
  }

  /* What the library says you can start right now. */
  function nowActs(p, d) {
    const acts = {};
    if (!isCrop(p)) return acts;
    winsAround(p, d).forEach((w) => {
      if (d >= w.a && d <= w.b) acts[w.k] = true;
      if (w.k === 'out' && p.ind) {
        const a = addD(w.a, -p.ind * 7), b = addD(w.b, -p.ind * 7);
        if (d >= a && d <= b) acts.ind = true;
      }
    });
    return acts;
  }
  const ACT_LABEL = { ind: 'Sow indoors', out: 'Plant out', dir: 'Sow direct' };

  /* Timeline for one row in a bed. */
  function plan(row) {
    const p = PL[row.p], st = pd(row.d);
    const r = { p: p, start: st, m: row.m };
    if (row.m === 'indoor' && p.ind) r.sow = addD(st, -p.ind * 7);
    r.ha = grown(st, p.dtm + (row.m === 'direct' ? dirExtra(p) : 0));
    r.hb = addD(r.ha, p.hw * 7);
    const ff = nextFF(st), hc = addD(ff, 28 + mildW(p) * 7);
    if (p.frost === 't' && r.hb > ff) r.hb = ff;
    if (p.frost === 'h' && r.hb > hc) r.hb = hc;
    if (r.hb < addD(r.ha, 7)) r.hb = addD(r.ha, 7);
    r.from = r.sow || st;
    r.end = r.hb;
    r.fit = fit(p, row.m, st);
    return r;
  }

  /* Tree/perennial task windows that overlap [from, to]. */
  function treeWins(p, from, to) {
    const out = [];
    for (let s = seasonOf(from) - 1; s <= seasonOf(to) + 1; s++) {
      const lf = addD(LF(s), (S.tree || 0) * 7);
      p.tasks.forEach((t, i) => {
        const a = addD(lf, t[1][0] * 7), b = addD(lf, t[1][1] * 7);
        if (b >= from && a <= to) out.push({ i: i, s: s, t: t, a: a, b: b });
      });
    }
    return out.sort((x, y) => x.a - y.a);
  }

  function autoCount(bed, p) {
    if (bed.kind === 'pot') {
      const r = bed.w / 2;
      return Math.max(1, Math.floor(Math.PI * r * r / (p.sp[0] * p.sp[0])));
    }
    return Math.max(1, Math.floor(bed.l / p.sp[0]));
  }
  const count = (bed, row) => row.n || autoCount(bed, PL[row.p]);

  function relation(a, b) {
    if (!a || !b || a === b) return null;
    if ((a.bad || []).indexOf(b.id) >= 0 || (b.bad || []).indexOf(a.id) >= 0) return 'bad';
    if ((a.good || []).indexOf(b.id) >= 0 || (b.good || []).indexOf(a.id) >= 0) return 'good';
    return null;
  }

  /* =====================================================================
     Tasks — generated from beds and trees, plus the user's own.
     ===================================================================== */

  function rowTasks(bed, row) {
    const r = plan(row), p = r.p, n = p.name, L = [];
    const T = (kind, d, title, end, icon) => L.push({
      key: 'r:' + row.id + ':' + kind, kind: icon || kind, d: d, end: end, title: title,
      sub: bed.name, p: p, rowId: row.id, bedId: bed.id
    });
    if (row.m === 'indoor' && r.sow) {
      T('sow', r.sow, 'Sow ' + n + ' seeds indoors');
      if (p.frost !== 'H') T('harden', addD(r.start, -7), 'Harden off ' + n + ' seedlings');
      T('plant', r.start, 'Plant out ' + n);
    } else if (row.m === 'direct') {
      T('sow', r.start, p.sowAs || 'Sow ' + n + ' direct');
    } else {
      T('plant', r.start, 'Plant ' + n + ' seedlings');
    }
    (p.care || []).forEach((c, i) => {
      if (c[0] === 0 && c[2] === 'plant') return;
      T('c' + i, addD(r.start, c[0]), c[1] + ' — ' + n, null, c[2]);
    });
    T('harvest', r.ha, 'Harvest ' + n, r.hb);
    return L;
  }

  function treeTasks(tree, from, to) {
    const p = PL[tree.p];
    return treeWins(p, from, to).filter((w) => !(w.t[0] === 'harvest' && w.a.getFullYear() - tree.y < (p.fruitIn || 0)))
      .map((w) => ({
        key: 't:' + tree.id + ':' + w.i + ':' + w.s, kind: w.t[0], d: w.a, end: w.b,
        title: w.t[2] + ' — ' + p.name, how: w.t[3], sub: tree.v || p.name, p: p, treeId: tree.id
      }));
  }

  function allTasks(from, to) {
    const L = [];
    S.beds.forEach((b) => b.rows.forEach((r) => rowTasks(b, r).forEach((t) => {
      if ((t.end || t.d) >= from && t.d <= to) L.push(t);
    })));
    S.trees.forEach((tr) => treeTasks(tr, from, to).forEach((t) => L.push(t)));
    S.tasks.forEach((c) => {
      const d = pd(c.d);
      if (d >= from && d <= to) L.push({ key: 'c:' + c.id, kind: 'task', d: d, title: c.t, sub: 'Your task', custom: c.id });
    });
    L.forEach((t) => { t.done = !!S.done[t.key]; });
    return L.sort((a, b) => a.d - b.d);
  }

  /* =====================================================================
     Weather & watering — the app's only network call, made only while the
     weather switch is on. Open-Meteo needs no key; the request carries just
     the area's coordinates, rounded to about 1 km.
     ===================================================================== */

  const WX_KEY = 'garden-planner-wx';
  let WX = null, wxBusy = false, wxFailedAt = 0;
  try { WX = JSON.parse(localStorage.getItem(WX_KEY)); } catch (e) { WX = null; }

  const wxWanted = () => S.setup && S.wx && S.lat != null && S.lon != null;
  const sameSpot = () => WX && WX.lat === +S.lat.toFixed(2) && WX.lon === +S.lon.toFixed(2);

  function ensureWx() {
    if (!wxWanted() || wxBusy || Date.now() - wxFailedAt < 5 * 60 * 1000) return;
    if (sameSpot() && Date.now() - WX.at < 60 * 60 * 1000 && WX.d.time.indexOf(iso(today())) >= 0) return;
    const lat = +S.lat.toFixed(2), lon = +S.lon.toFixed(2);
    wxBusy = true;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration' +
      '&past_days=7&forecast_days=8&timezone=auto')
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then((j) => {
        if (!j.daily || !Array.isArray(j.daily.time)) throw new Error('No daily data');
        WX = { at: Date.now(), lat: lat, lon: lon, d: j.daily };
        try { localStorage.setItem(WX_KEY, JSON.stringify(WX)); } catch (e) { /* cache is optional */ }
      })
      .catch(() => { wxFailedAt = Date.now(); })
      .then(() => { wxBusy = false; if (!UI.sheet) render(); });
  }

  /* Daily weather around today, or null if we have nothing usable. */
  function wxDays() {
    if (!S.wx || !WX || !WX.d || !sameSpot()) return null;
    const d = WX.d, t = d.time.indexOf(iso(today()));
    if (t < 0) return null;
    const num = (a, i) => (a && a[i] != null ? a[i] : null);
    return {
      t: t, n: d.time.length,
      day: (i) => ({
        date: pd(d.time[i]), code: num(d.weather_code, i), hi: num(d.temperature_2m_max, i), lo: num(d.temperature_2m_min, i),
        rain: num(d.precipitation_sum, i) || 0, prob: num(d.precipitation_probability_max, i), et0: num(d.et0_fao_evapotranspiration, i) || 0
      })
    };
  }

  function wxLook(code) {
    if (code == null) return ['·', '—'];
    if (code === 0) return ['☀️', 'Sunny'];
    if (code === 1) return ['🌤️', 'Mostly sunny'];
    if (code === 2) return ['⛅', 'Partly cloudy'];
    if (code === 3) return ['☁️', 'Cloudy'];
    if (code === 45 || code === 48) return ['🌫️', 'Fog'];
    if (code >= 51 && code <= 57) return ['🌦️', 'Drizzle'];
    if (code >= 61 && code <= 67) return ['🌧️', 'Rain'];
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ['🌨️', 'Snow'];
    if (code >= 80 && code <= 82) return ['🌦️', 'Showers'];
    if (code >= 95) return ['⛈️', 'Storms'];
    return ['⛅', 'Mixed'];
  }

  /* Forecast rain, scaled down when a shower is unlikely. Past days count in full. */
  function expRain(x) { return x.prob != null && x.prob < 50 ? x.rain * x.prob / 100 : x.rain; }
  /* Light showers mostly wet leaves and evaporate; heavier rain soaks in. */
  function effRain(mm) { return mm < 2 ? mm * 0.3 : mm * 0.85; }

  /* 0 low, 1 moderate, 2 thirsty — read from each plant's watering note. */
  function thirst(p) {
    const w = (p.water || '').toLowerCase();
    if (/^low/.test(w)) return 0;
    if (/lots|deep &|moist|critical|never|consistent|rainwater/.test(w)) return 2;
    return 1;
  }
  const KC = [0.55, 0.85, 1.05];  // share of reference evaporation the plants use
  const RAW = [35, 25, 18];       // mm the soil can lose before it's time to water

  /* Everything that might need water today: active beds and pots, and trees. */
  function waterTargets() {
    const t = today(), L = [];
    S.beds.forEach((b) => {
      const act = b.rows.map(plan).filter((pl) => pl.start <= t && pl.end >= t);
      if (!act.length) return;
      const cls = Math.max.apply(null, act.map((pl) => thirst(pl.p)));
      const young = act.some((pl) => days(pl.start, t) < 14), pot = b.kind === 'pot';
      L.push({
        id: 'b:' + b.id, bedId: b.id, name: b.name, pot: pot, plants: act.map((pl) => pl.p), young: young,
        kc: KC[cls] * (pot ? 1.5 : 1), raw: young ? 6 : pot ? 15 : RAW[cls], catchRain: pot ? 0.7 : 1,
        area: pot ? Math.PI * Math.pow(b.w / 200, 2) : b.w * b.l / 10000
      });
    });
    S.trees.forEach((tr) => {
      const p = PL[tr.p], young = t.getFullYear() - tr.y < 3;
      L.push({
        id: 't:' + tr.id, treeId: tr.id, name: p.name + (tr.v ? ' · ' + tr.v : ''), tree: true, plants: [p], young: young,
        kc: KC[thirst(p)] * (young ? 0.8 : 1), raw: young ? 20 : 35, catchRain: 1, area: young ? 1 : 4
      });
    });
    return L;
  }

  /* A simple daily soil-water balance: evaporation dries the soil, rain and
     your own watering fill it up. Unknown history starts half-dry. */
  function waterAdvice(g, W) {
    const cap = g.raw * 1.6, lw = S.watered[g.id] ? pd(S.watered[g.id]) : null;
    const step = (i, D, fc) => {
      const x = W.day(i);
      return Math.max(0, Math.min(cap, D + x.et0 * g.kc - effRain(fc ? expRain(x) : x.rain) * g.catchRain));
    };
    let D = g.raw * 0.5;
    for (let i = 0; i < W.t; i++) {
      if (lw && +W.day(i).date === +lw) D = 0;
      D = step(i, D, false);
    }
    const wateredToday = !!lw && +lw === +W.day(W.t).date;
    if (wateredToday) D = 0;
    const start = D, liters = (mm) => Math.max(1, Math.round(mm * g.area));
    let due = null, d = D;
    for (let i = W.t; i < W.n; i++) {
      /* A later day only counts if the rain forecast for it won't do the job. */
      if (d >= g.raw && (i === W.t || effRain(expRain(W.day(i))) * g.catchRain < d * 0.7)) { due = i; break; }
      d = step(i, d, true);
    }
    const res = { g: g, deficit: start, wateredToday: wateredToday, due: due != null ? W.day(due).date : null };
    if (wateredToday) res.s = 'done';
    else if (due === W.t) {
      /* Due now — unless decent rain is on its way today or tomorrow. */
      for (let i = W.t; i <= Math.min(W.t + 1, W.n - 1); i++) {
        const x = W.day(i), r = effRain(expRain(x)) * g.catchRain;
        if (r >= start * 0.7 && r >= 3) { res.s = 'skip'; res.rainDay = x.date; res.rainMm = Math.round(x.rain); break; }
      }
      /* One watering refills the root zone; more just drains away. */
      if (!res.s) { const mm = Math.min(start, g.raw * 1.2); res.s = 'now'; res.mm = Math.round(mm); res.l = liters(mm); }
    } else res.s = 'ok';
    /* Heat ahead dries things out fast; seedlings can't wait. */
    for (let i = W.t; i < Math.min(W.n, W.t + 4); i++) {
      const x = W.day(i);
      if (x.hi != null && x.hi >= 32) { res.hot = x; break; }
    }
    return res;
  }

  function adviceMap() {
    const W = wxDays(), out = {};
    if (!W) return out;
    waterTargets().forEach((g) => { out[g.id] = waterAdvice(g, W); });
    return out;
  }

  const dayName = (d) => (days(today(), d) === 0 ? 'today' : days(today(), d) === 1 ? 'tomorrow' : DOW[d.getDay()]);

  function adviceLine(a) {
    const g = a.g, amt = (l) => '~' + l + ' L' + (g.tree ? ' — a slow, deep soak' : g.pot ? '' : ' (' + Math.round(l / g.area) + ' L/m²)');
    if (a.s === 'done') return '<b class="w-ok">Watered today ✓</b>' + (a.due ? ' · next ~' + dayName(a.due) : '');
    if (a.s === 'skip') return '<b class="w-rain">Skip — ' + a.rainMm + ' mm rain due ' + dayName(a.rainDay) + '</b>';
    if (a.s === 'now') return '<b class="w-now">Water today</b> · ' + amt(a.l) + (g.young && !g.tree ? ' · seedlings: keep the top moist' : '');
    return '<b class="w-ok">Moist enough</b> · ' + (a.due ? 'next water ~' + dayName(a.due) : 'no watering needed this week') +
      (a.hot && g.young ? ' · hot ' + dayName(a.hot.date) + ' — check seedlings' : '');
  }

  /* ------------------------------------------------------------ weather card */

  function weatherCard() {
    if (!S.wx) return '';
    ensureWx();
    const W = wxDays();
    if (!W) {
      return '<section class="wx card"><p class="muted wx-msg">' + (wxBusy ? '⏳ Loading the weather…' :
        S.lat == null ? 'Pick a location in settings to get weather and watering advice.' :
          '☁️ Couldn\'t load the weather — check your connection. Watering advice will appear once it loads.') + '</p></section>';
    }
    const now = W.day(W.t), look = wxLook(now.code);
    let past = 0, next = 0, max = 1;
    for (let i = 0; i < W.n; i++) {
      const x = W.day(i);
      if (i < W.t) past += x.rain; else if (i < W.t + 7) next += x.rain;
      max = Math.max(max, x.rain);
    }
    let html = '<section class="wx card"><div class="wx-now"><span class="wx-ico">' + look[0] + '</span>' +
      '<div class="wx-t"><b>' + Math.round(now.hi) + '° <small>/ ' + Math.round(now.lo) + '°</small></b><small>' + look[1] + ' today' +
      (now.rain >= 0.5 ? ' · ' + now.rain.toFixed(now.rain < 10 ? 1 : 0) + ' mm' + (now.prob != null ? ' (' + now.prob + '%)' : '') : '') + '</small></div>' +
      '<div class="wx-sum"><small>Last 7 days</small><b>' + Math.round(past) + ' mm</b></div>' +
      '<div class="wx-sum"><small>Next 7 days</small><b>' + Math.round(next) + ' mm</b></div></div>';

    html += '<div class="wx-strip" id="wxStrip">';
    for (let i = 0; i < Math.min(W.n, W.t + 8); i++) {
      const x = W.day(i), lk = wxLook(x.code), h = Math.round(Math.min(1, x.rain / Math.max(10, max)) * 34);
      html += '<div class="wx-d' + (i < W.t ? ' past' : i === W.t ? ' now' : '') + '" title="' + esc(fmt(x.date) + ': ' + lk[1] + ', ' + x.rain.toFixed(1) + ' mm') + '">' +
        '<small>' + (i === W.t ? 'Today' : DOW[x.date.getDay()]) + '</small><span>' + lk[0] + '</span><b>' + (x.hi != null ? Math.round(x.hi) + '°' : '') + '</b>' +
        '<i class="bar"><i style="height:' + h + 'px"></i></i><em>' + (x.rain >= 0.5 ? (x.rain < 10 ? x.rain.toFixed(1) : Math.round(x.rain)) : '0') + '</em></div>';
    }
    html += '</div>';

    /* Weather alerts worth acting on in the garden. */
    const alerts = [];
    let frost = null, heat = null, deluge = null;
    for (let i = W.t; i < Math.min(W.n, W.t + 7); i++) {
      const x = W.day(i);
      if (!frost && x.lo != null && x.lo <= 2) frost = x;
      if (!heat && x.hi != null && x.hi >= 32) heat = x;
      if (!deluge && x.rain >= 20 && (x.prob == null || x.prob >= 50)) deluge = x;
    }
    if (frost) alerts.push('❄️ <b>Frost risk ' + dayName(frost.date) + ' night (' + Math.round(frost.lo) + '°)</b> — cover tender seedlings and bring pots under shelter.');
    if (heat) alerts.push('🔥 <b>Hot ' + dayName(heat.date) + ' (' + Math.round(heat.hi) + '°)</b> — water deeply the evening before, mulch well and shade seedlings.');
    if (deluge) alerts.push('🌧️ <b>Heavy rain ' + dayName(deluge.date) + ' (' + Math.round(deluge.rain) + ' mm)</b> — hold off feeding and check pots drain.');
    if (alerts.length) html += '<div class="wx-alerts">' + alerts.map((a) => '<p>' + a + '</p>').join('') + '</div>';
    const mins = Math.round((Date.now() - WX.at) / 60000);
    html += '<p class="wx-src">Weather: Open-Meteo · updated ' + (mins < 2 ? 'just now' : mins < 90 ? mins + ' min ago' : Math.round(mins / 60) + ' h ago') + '</p></section>';
    return html;
  }

  function wateringSection() {
    const W = wxDays();
    if (!W) return '';
    const adv = adviceMap(), list = Object.keys(adv).map((k) => adv[k]);
    if (!list.length) return '';
    const order = { now: 0, skip: 1, ok: 2, done: 3 };
    list.sort((a, b) => order[a.s] - order[b.s]);
    const due = list.filter((a) => a.s === 'now').length;
    return '<h2 class="h2">Watering <small>' + (due ? due + ' to water today' : 'nothing to water today') + '</small></h2><div class="card list">' +
      list.map((a) => {
        const g = a.g, lead = g.tree ? av(g.plants[0], 'sm') : '<span class="av sm plain">' + (g.pot ? '🪴' : '🟫') + '</span>';
        return '<div class="task water ' + a.s + '"><span class="tk-av">' + lead + '</span><span class="tk-txt"><strong>' + esc(g.name) + '</strong><small>' + adviceLine(a) + '</small></span>' +
          '<button type="button" class="wbtn" data-act="watered" data-id="' + esc(g.id) + '" aria-pressed="' + (a.s === 'done') + '">' + (a.s === 'done' ? 'Undo' : '💧 Watered') + '</button></div>';
      }).join('') + '</div><p class="muted small pad">Advice balances evaporation and rain (past and forecast) against each plant\'s needs. Tap “Watered” when you water so it knows the soil is topped up.</p>';
  }

  /* =====================================================================
     Shared bits of markup
     ===================================================================== */

  function glyph(p) {
    if (p.icon.indexOf('svg:') === 0) return D.svg[p.icon.slice(4)];
    return '<span class="emo"' + (p.fx ? ' style="filter:' + p.fx + '"' : '') + '>' + p.icon + '</span>';
  }
  function av(p, cls) { return '<span class="av ' + (cls || '') + '" aria-hidden="true">' + glyph(p) + '</span>'; }
  const kindIcon = (k) => (D.kinds[k] || D.kinds.task).icon;

  function taskRow(t) {
    const when = t.end
      ? (t.d <= today() ? 'Now – ' + fmt(t.end) : fmt(t.d) + ' – ' + fmt(t.end))
      : rel(t.d);
    const lead = t.p
      ? '<span class="tk-av">' + av(t.p, 'sm') + '<i class="tk-k">' + kindIcon(t.kind) + '</i></span>'
      : '<span class="tk-av"><span class="av sm plain">' + kindIcon(t.kind) + '</span></span>';
    return '<div class="task' + (t.done ? ' done' : '') + '">' +
      '<button class="chk" type="button" data-act="toggle-task" data-key="' + esc(t.key) + '" aria-pressed="' + t.done + '" aria-label="' + (t.done ? 'Mark not done' : 'Mark done') + '">' + (t.done ? '✓' : '') + '</button>' +
      '<button class="task-main" type="button" data-act="open-task" data-key="' + esc(t.key) + '">' + lead +
      '<span class="tk-txt"><strong>' + esc(t.title) + '</strong><small>' + esc(t.sub) + ' · ' + when + '</small></span></button></div>';
  }

  function seasonSwitch() {
    return '<div class="season-sw"><button class="round" type="button" data-act="season-prev" aria-label="Previous season">‹</button>' +
      '<strong>' + seasonLabel(UI.season) + '</strong>' +
      '<button class="round" type="button" data-act="season-next" aria-label="Next season">›</button></div>';
  }

  function empty(icon, title, text, btn) {
    return '<div class="empty"><div class="empty-ico">' + icon + '</div><h3>' + title + '</h3><p>' + text + '</p>' + (btn || '') + '</div>';
  }

  /* =====================================================================
     Views
     ===================================================================== */

  const TITLES = { today: 'Today', garden: 'My Garden', season: 'Season Overview', trees: 'Trees & Perennials', plants: 'Plants' };

  function render() {
    const view = el('view');
    if (!S.setup) {
      document.body.classList.add('onboarding');
      view.innerHTML = viewWelcome();
      return;
    }
    document.body.classList.remove('onboarding');
    if (UI.season == null) UI.season = seasonOf(today());
    if (!UI.month) UI.month = som(today());
    el('pageTitle').textContent = TITLES[UI.tab];
    document.querySelectorAll('#tabbar [data-tab]').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.tab === UI.tab));
    });
    view.innerHTML = ({ today: viewToday, garden: viewGarden, season: viewSeason, trees: viewTrees, plants: viewPlants })[UI.tab]();
    if (UI.tab === 'season') scrollTimeline();
    const strip = el('wxStrip'), sn = $('#wxStrip .now');
    if (strip && sn) strip.scrollLeft = Math.max(0, sn.offsetLeft - strip.clientWidth * 0.35);
    if (UI.tab === 'trees') {
      const w = $('.tcal-wrap'), c = $('.tcal thead th.now');
      if (w && c) w.scrollLeft = Math.max(0, c.offsetLeft - 130 - w.clientWidth * 0.25);
    }
    if (UI.tab === 'garden') {
      const m = $('.months .on');
      if (m) m.parentNode.scrollLeft = m.offsetLeft - m.parentNode.clientWidth / 2 + m.clientWidth / 2;
    }
  }

  /* ------------------------------------------------------------ welcome */

  function locOptions(sel) {
    const groups = D.locations.map((l) => l.group).filter((g, i, a) => a.indexOf(g) === i);
    return groups.map((g) => '<optgroup label="' + g + '">' +
      D.locations.filter((l) => l.group === g).map((l) => '<option value="' + l.id + '"' + (l.id === sel ? ' selected' : '') + '>' + esc(l.name) + '</option>').join('') +
      '</optgroup>').join('') + '<option value="custom"' + (sel === 'custom' ? ' selected' : '') + '>Somewhere else — set my own frost dates</option>';
  }

  function viewWelcome() {
    const sel = S.loc || detectLoc();
    return '<section class="welcome">' +
      '<div class="brand">🌱 Garden Planner</div>' +
      '<h1>Plan, plant &amp; prune — all in one place</h1>' +
      '<p class="lead">Design your beds, get sowing and harvest dates for where you live, keep a pruning calendar for your fruit trees, and never miss a job.</p>' +
      '<div class="welcome-art" aria-hidden="true">' + ['tomato', 'carrot', 'lettuce', 'apple', 'strawberry', 'basil', 'lemon'].map((id) => av(PL[id], 'lg')).join('') + '</div>' +
      '<label class="field"><span>Where is your garden?</span><select id="welcomeLoc">' + locOptions(sel) + '</select></label>' +
      '<p class="hint">This sets your frost dates, which drive every sowing, planting and pruning date. You can fine-tune them later in settings.</p>' +
      '<button class="btn primary block" type="button" data-act="start-example">Start with an example garden</button>' +
      '<button class="btn ghost block" type="button" data-act="start-empty">Start with an empty garden</button>' +
      '<p class="fine">Everything stays in this browser on this device. <a href="../../">← Back to home</a></p>' +
      '</section>';
  }

  function detectLoc() {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
    const hit = D.locations.find((l) => l.tz.indexOf(tz) >= 0);
    if (hit) return hit.id;
    if (/^Australia\//.test(tz)) return 'sydney';
    if (/^Pacific\//.test(tz)) return 'auckland';
    if (/^America\//.test(tz)) return 'newyork';
    return 'london';
  }

  function setLoc(id) {
    const l = D.locations.find((x) => x.id === id);
    S.loc = id;
    if (l) { S.lf = l.lf; S.ff = l.ff; S.mild = l.mild || 0; S.tree = l.tree || 0; S.region = l.region || ''; S.lat = l.lat; S.lon = l.lon; S.geo = false; }
  }

  function exampleGarden() {
    const t = today(), from = addD(t, -40), y = t.getFullYear();
    function row(id, m) {
      const p = PL[id];
      m = m || defMethod(p);
      const d = nextPerfect(p, m, from) || t;
      return { id: uid(), p: id, m: m, d: iso(d), n: null, v: '' };
    }
    S.beds = [
      { id: uid(), name: 'Kitchen bed', kind: 'raised', w: 120, l: 240, rows: [row('lettuce', 'seedling'), row('silverbeet'), row('pea'), row('carrot')] },
      { id: uid(), name: 'Summer bed', kind: 'raised', w: 150, l: 300, rows: [row('capsicum', 'seedling'), row('basil', 'seedling'), row('bush-bean'), row('marigold', 'seedling')] },
      { id: uid(), name: 'Patio pot', kind: 'pot', w: 40, l: 40, rows: [row('cherry-tomato', 'seedling')] },
      { id: uid(), name: 'Herb pot', kind: 'pot', w: 35, l: 35, rows: [row('mint', 'seedling')] }
    ];
    S.trees = [
      { id: uid(), p: 'lemon', v: 'Eureka', y: y - 3, note: '' },
      { id: uid(), p: 'apple', v: 'Pink Lady', y: y - 2, note: '' },
      { id: uid(), p: 'blueberry', v: '', y: y - 1, note: '' }
    ];
    /* The example starts mid-season, so its earlier jobs count as done. */
    allTasks(addD(t, -400), addD(t, -1)).forEach((x) => { if ((x.end || x.d) < t) S.done[x.key] = iso(t); });
  }

  /* ------------------------------------------------------------ today */

  function frostLine() {
    const t = today(), s = seasonOf(t);
    let lfPrev = null, lfNext = null, sPrev = null;
    for (let i = s - 1; i <= s + 1; i++) {
      const lf = LF(i);
      if (lf <= t) { lfPrev = lf; sPrev = i; } else if (!lfNext) lfNext = lf;
    }
    const mild = S.mild >= 10;
    if (lfPrev && t < FF(sPrev)) {
      const w = Math.floor(days(lfPrev, t) / 7), ff = FF(sPrev), left = Math.ceil(days(t, ff) / 7);
      if (mild) return 'Warm season · summer crops in the ground · cooling off ~' + fmt(ff) + (left <= 8 ? ' (' + left + ' wk' + (left === 1 ? '' : 's') + ')' : '');
      return 'Growing season · ' + (w < 1 ? 'last frost just passed' : w + ' week' + (w === 1 ? '' : 's') + ' since last frost') +
        ' · first frost ~' + fmt(ff) + (left <= 8 ? ' (' + left + ' wk' + (left === 1 ? '' : 's') + ')' : '');
    }
    const n = Math.ceil(days(t, lfNext) / 7);
    if (mild) return 'Cool season · winter crops growing · summer planting from ~' + fmt(lfNext) + ' — ' + n + ' week' + (n === 1 ? '' : 's') + ' to go';
    return 'Frost season · last frost expected ~' + fmt(lfNext) + ' — ' + n + ' week' + (n === 1 ? '' : 's') + ' to go';
  }

  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function viewToday() {
    const t = today();
    let html = '<section class="hero"><div class="hero-k">' + seasonName(t) + ' · ' + esc(locName()) + '</div>' +
      '<h1>' + greeting() + '</h1><p>' + frostLine() + '</p></section>';
    html += weatherCard() + wateringSection();

    html += '<div class="seg" role="tablist">' +
      '<button type="button" role="tab" data-act="today-mode" data-mode="upcoming" aria-selected="' + (UI.todayMode === 'upcoming') + '">Upcoming</button>' +
      '<button type="button" role="tab" data-act="today-mode" data-mode="month" aria-selected="' + (UI.todayMode === 'month') + '">Calendar</button></div>';

    html += UI.todayMode === 'month' ? agendaView() : upcomingView();

    /* What the location says to start now, from the whole library. */
    const now = D.plants.filter((p) => isCrop(p)).map((p) => ({ p: p, a: nowActs(p, t) })).filter((x) => Object.keys(x.a).length);
    if (now.length) {
      html += '<h2 class="h2">Sow &amp; plant now <small>' + esc(locName()) + '</small></h2><div class="chips-x">' +
        now.map((x) => '<button class="pchip" type="button" data-act="plant" data-id="' + x.p.id + '">' + av(x.p) +
          '<b>' + esc(x.p.name) + '</b><small>' + Object.keys(x.a).map((k) => ACT_LABEL[k]).join(' · ') + '</small></button>').join('') + '</div>';
    }

    const pruneNow = D.plants.filter(isTree).map((p) => ({ p: p, w: treeWins(p, t, t).filter((w) => w.t[0] === 'prune') })).filter((x) => x.w.length);
    if (pruneNow.length) {
      html += '<h2 class="h2">Pruning season <small>for these trees</small></h2><div class="chips-x">' +
        pruneNow.map((x) => '<button class="pchip" type="button" data-act="plant" data-id="' + x.p.id + '">' + av(x.p) +
          '<b>' + esc(x.p.name) + '</b><small>✂️ ' + esc(x.w[0].t[2]) + '</small></button>').join('') + '</div>';
    }
    return html;
  }

  function upcomingView() {
    const t = today();
    if (!S.beds.some((b) => b.rows.length) && !S.trees.length && !S.tasks.length) {
      return empty('🪴', 'Nothing planned yet', 'Add a bed and some plants, or your fruit trees, and your jobs will show up here.',
        '<button class="btn primary" type="button" data-act="tab" data-tab="garden">Plan a bed</button>');
    }
    const L = allTasks(addD(t, -21), addD(t, 30));
    const over = [], now = [], soon = [];
    L.forEach((x) => {
      if (x.done) return;
      const end = x.end || x.d;
      if (end < t) over.push(x);
      else if (x.d <= addD(t, 7)) now.push(x);
      else soon.push(x);
    });
    let html = '';
    if (over.length) html += '<h2 class="h2 warn">Catch up <small>' + over.length + '</small></h2><div class="card list">' + over.map(taskRow).join('') + '</div>';
    html += '<h2 class="h2">This week</h2>' + (now.length ? '<div class="card list">' + now.map(taskRow).join('') + '</div>' : '<p class="muted pad">Nothing due this week — enjoy the garden. 🌤️</p>');
    if (soon.length) html += '<h2 class="h2">Coming up <small>next 30 days</small></h2><div class="card list">' + soon.map(taskRow).join('') + '</div>';
    html += '<button class="btn ghost block" type="button" data-act="add-task">+ Add your own task</button>';
    return html;
  }

  function agendaView() {
    if (!UI.agenda) UI.agenda = som(today());
    const a = UI.agenda, b = eom(a), t = today();
    const L = allTasks(a, b);
    const byDay = {};
    L.forEach((x) => {
      if (x.end && days(x.d, x.end) > 0) return;
      (byDay[x.d.getDate()] = byDay[x.d.getDate()] || []).push(x);
    });
    let html = '<div class="cal card"><div class="cal-nav"><button class="round" type="button" data-act="agenda-prev" aria-label="Previous month">‹</button>' +
      '<strong>' + ML[a.getMonth()] + ' ' + a.getFullYear() + '</strong><button class="round" type="button" data-act="agenda-next" aria-label="Next month">›</button></div><div class="cal-grid">';
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d) => { html += '<span class="cal-h">' + d + '</span>'; });
    const lead = (a.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) html += '<span></span>';
    for (let d = 1; d <= b.getDate(); d++) {
      const items = byDay[d] || [], isT = a.getFullYear() === t.getFullYear() && a.getMonth() === t.getMonth() && d === t.getDate();
      html += '<button type="button" class="cal-d' + (isT ? ' today' : '') + (UI.agendaDay === d ? ' sel' : '') + '" data-act="agenda-day" data-day="' + d + '">' + d +
        '<span class="dots">' + items.slice(0, 3).map((x) => '<i class="k-' + dotKind(x.kind) + (x.done ? ' done' : '') + '"></i>').join('') + '</span></button>';
    }
    html += '</div></div>';

    const ranges = L.filter((x) => x.end && days(x.d, x.end) > 0);
    let points = L.filter((x) => !(x.end && days(x.d, x.end) > 0));
    if (UI.agendaDay) points = points.filter((x) => x.d.getDate() === UI.agendaDay);
    if (!UI.agendaDay && ranges.length) html += '<h2 class="h2">Through the month</h2><div class="card list">' + ranges.map(taskRow).join('') + '</div>';
    html += '<h2 class="h2">' + (UI.agendaDay ? UI.agendaDay + ' ' + ML[a.getMonth()] : 'On the day') + '</h2>' +
      (points.length ? '<div class="card list">' + points.map(taskRow).join('') + '</div>' : '<p class="muted pad">No jobs on ' + (UI.agendaDay ? 'this day' : 'specific days this month') + '.</p>');
    html += '<button class="btn ghost block" type="button" data-act="add-task">+ Add your own task</button>';
    return html;
  }
  const dotKind = (k) => (k === 'harvest' ? 'g' : k === 'prune' ? 'b' : (k === 'sow' || k === 'plant' || k === 'harden') ? 'y' : 'n');

  /* ------------------------------------------------------------ garden */

  function bandPx(p) { return Math.max(42, Math.min(112, Math.round(p.sp[1] * 1.4))); }

  function viewGarden() {
    const months = seasonMonths(UI.season);
    if (!months.some((m) => +m === +UI.month)) UI.month = months[0];
    const mA = UI.month, mB = eom(mA), tm = som(today());
    let html = seasonSwitch() + '<div class="months" role="tablist">' + months.map((m) =>
      '<button type="button" role="tab" data-act="month" data-m="' + iso(m) + '" class="' + (+m === +mA ? 'on' : '') + (+m === +tm ? ' now' : '') + '" aria-selected="' + (+m === +mA) + '">' +
      (+m === +mA ? ML[m.getMonth()] : MS[m.getMonth()]) + '</button>').join('') + '</div>';

    if (!S.beds.length) {
      return html + empty('🪴', 'Design your first bed', 'Add a raised bed, an in-ground patch or a pot, then fill it with rows of plants. Plant counts, companions and dates are worked out for you.',
        '<button class="btn primary" type="button" data-act="new-bed">+ Add a bed or pot</button>');
    }

    const beds = S.beds.filter((b) => b.kind !== 'pot'), pots = S.beds.filter((b) => b.kind === 'pot');
    ensureWx();
    UI.adv = +mA === +som(today()) ? adviceMap() : null;
    html += '<div class="lawn">';
    beds.forEach((b) => { html += bedCard(b, mA, mB); });
    if (pots.length) html += '<div class="pots">' + pots.map((b) => potCard(b, mA, mB)).join('') + '</div>';
    html += '<button class="add-bed" type="button" data-act="new-bed">+ Add a bed or pot</button></div>';
    html += '<p class="muted small pad">Showing what is in the ground in ' + ML[mA.getMonth()] + '. Row height follows each plant\'s spacing. ' +
      '<span class="cmp good inline">♥</span> good neighbours · <span class="cmp bad inline">!</span> keep apart.</p>';
    return html;
  }

  function splitRows(b, mA, mB) {
    const act = [], later = [];
    b.rows.forEach((r) => {
      const pl = plan(r);
      if (pl.start <= mB && pl.end >= mA) act.push({ r: r, pl: pl });
      else if (pl.start > mB) later.push({ r: r, pl: pl });
    });
    return { act: act, later: later.sort((x, y) => x.pl.start - y.pl.start) };
  }

  function laterChips(b, later) {
    if (!later.length) return '';
    return '<div class="later"><span>Later:</span>' + later.map((x) => '<button type="button" class="lchip" data-act="edit-row" data-bed="' + b.id + '" data-row="' + x.r.id + '">' +
      av(x.pl.p, 'xs') + esc(x.pl.p.name) + ' · ' + MS[x.pl.start.getMonth()] + (x.pl.start.getFullYear() !== today().getFullYear() ? ' ’' + String(x.pl.start.getFullYear()).slice(2) : '') + '</button>').join('') + '</div>';
  }

  function waterChip(id) {
    const a = UI.adv && UI.adv[id];
    if (!a) return '';
    if (a.s === 'now') return '<span class="wchip now">💧 Water today</span>';
    if (a.s === 'skip') return '<span class="wchip rain">🌧️ Rain due</span>';
    if (a.s === 'done') return '<span class="wchip ok">💧 Done</span>';
    return a.due ? '<span class="wchip ok">💧 ' + (days(today(), a.due) <= 1 ? dayName(a.due) : DOW[a.due.getDay()]) + '</span>' : '';
  }

  function bedCard(b, mA, mB) {
    const sp = splitRows(b, mA, mB);
    const used = sp.act.reduce((s, x) => s + x.pl.p.sp[1], 0), pct = Math.round(used / b.w * 100);
    let rows = '';
    sp.act.forEach((x, i) => {
      const p = x.pl.p, h = bandPx(p), n = count(b, x.r), isz = Math.min(h - 8, 60);
      if (i > 0) {
        const rel2 = relation(sp.act[i - 1].pl.p, p);
        if (rel2) rows += '<div class="gap"><span class="cmp ' + rel2 + '" title="' + esc(sp.act[i - 1].pl.p.name + ' & ' + p.name + (rel2 === 'good' ? ' are good neighbours' : ' should be kept apart')) + '">' + (rel2 === 'good' ? '♥' : '!') + '</span></div>';
      }
      const growing = x.pl.start > maxD(mA, today()) ? ' <em>from ' + fmt(x.pl.start) + '</em>' : x.pl.ha <= mB && x.pl.hb >= mA ? ' <em class="h">harvest</em>' : '';
      rows += '<button class="strip" type="button" style="--h:' + h + 'px;--i:' + isz + 'px" data-act="edit-row" data-bed="' + b.id + '" data-row="' + x.r.id + '">' +
        av(p, 'st') + '<span class="dl"></span><span class="mid"><b>' + n + '×</b><small>' + esc(x.r.v || p.name) + growing + '</small></span><span class="dl"></span>' + av(p, 'st') +
        (x.pl.fit.s === 'bad' ? '<i class="warn-dot" title="Not the ideal time">!</i>' : '') + '</button>';
    });
    if (!sp.act.length) rows = '<p class="bed-empty">Nothing in the ground in ' + ML[mA.getMonth()] + '.</p>';
    return '<article class="bed">' +
      '<header class="bed-h"><div><strong>' + esc(b.name) + '</strong><small>' + (b.kind === 'ground' ? 'In-ground · ' : '') + b.w + ' × ' + b.l + ' cm</small>' + waterChip('b:' + b.id) + '</div>' +
      '<div class="fill" title="Space used in ' + ML[mA.getMonth()] + '"><span style="width:' + Math.min(100, pct) + '%" class="' + (pct > 100 ? 'over' : '') + '"></span></div><b class="pct' + (pct > 100 ? ' over' : '') + '">' + pct + '%</b>' +
      '<button class="round sm" type="button" data-act="edit-bed" data-bed="' + b.id + '" aria-label="Edit ' + esc(b.name) + '">⋯</button></header>' +
      '<div class="bed-in">' + rows + '<button class="add-row" type="button" data-act="add-row" data-bed="' + b.id + '">+ Add plant</button></div>' +
      (pct > 100 ? '<p class="bed-note">Rows need ' + used + ' cm but the bed is ' + b.w + ' cm wide — remove a row or move one to a later month.</p>' : '') +
      laterChips(b, sp.later) + '</article>';
  }

  function potCard(b, mA, mB) {
    const sp = splitRows(b, mA, mB), x = sp.act[0];
    const inner = x
      ? '<button class="pot-in" type="button" data-act="edit-row" data-bed="' + b.id + '" data-row="' + x.r.id + '">' + av(x.pl.p, 'pot-av') +
        (sp.act.length > 1 ? '<i class="pot-more">+' + (sp.act.length - 1) + '</i>' : '') + (count(b, x.r) > 1 ? '<i class="pot-n">' + count(b, x.r) + '×</i>' : '') + '</button>'
      : '<button class="pot-in empty" type="button" data-act="add-row" data-bed="' + b.id + '">+</button>';
    return '<div class="pot"><div class="pot-ring">' + inner + '</div>' +
      '<button class="pot-name" type="button" data-act="edit-bed" data-bed="' + b.id + '">' + esc(b.name) + ' <small>' + b.w + ' cm</small> ⋯</button>' + waterChip('b:' + b.id) + '</div>';
  }

  /* ------------------------------------------------------------ season */

  const MW = 76; // px per month in the timeline

  function viewSeason() {
    const s = UI.season, a = seasonStart(s), b = seasonEnd(s), total = 12 * MW, span = days(a, addD(b, 1));
    const X = (d) => Math.max(0, Math.min(total, days(a, d) / span * total));
    let html = seasonSwitch() + '<div class="legend"><span><i class="k-b"></i>Propagating</span><span><i class="k-y"></i>Growing</span><span><i class="k-g"></i>Harvest</span><span><i class="k-f"></i>' + (S.mild >= 10 ? 'Cool season' : 'Frost') + '</span></div>';

    const groups = [];
    S.beds.forEach((bed) => {
      const items = bed.rows.map((r) => ({ r: r, pl: plan(r) })).filter((x) => x.pl.end >= a && x.pl.from <= b).sort((x, y) => x.pl.from - y.pl.from);
      if (items.length) groups.push({ bed: bed, items: items });
    });
    const trees = S.trees.map((tr) => ({ tr: tr, w: treeTasks(tr, a, b) })).filter((x) => x.w.length);

    if (!groups.length && !trees.length) {
      return html + empty('📅', 'No plantings this season', 'Add plants to your beds and their sowing, growing and harvest periods appear here as a timeline.',
        '<button class="btn primary" type="button" data-act="tab" data-tab="garden">Go to my garden</button>');
    }

    let inner = '<div class="tl-months">' + seasonMonths(s).map((m) => {
      const frosty = isFrosty(addD(m, 14));
      return '<span style="width:' + MW + 'px">' + (frosty ? '❄ ' : '') + MS[m.getMonth()] + '</span>';
    }).join('') + '</div>';

    /* Blue shading wherever frost is likely. */
    let shade = '';
    for (let i = s - 1; i <= s; i++) {
      const fa = FF(i), fb = LF(i + 1);
      if (fb >= a && fa <= b) shade += '<i class="tl-frost" style="left:' + X(fa) + 'px;width:' + (X(fb) - X(fa)) + 'px"></i>';
    }
    const t = today(), showToday = t >= a && t <= b;

    groups.forEach((g) => {
      inner += '<div class="tl-group"><span>' + esc(g.bed.name) + '</span></div>';
      g.items.forEach((x) => {
        const pl = x.pl, x0 = X(pl.from), x1 = X(pl.end);
        const L = Math.min(x0, total - 156), W = Math.max(x1, L + 156) - L;
        const seg = (c, d1, d2) => (d2 > d1 ? '<i class="k-' + c + '" style="left:' + (X(d1) - L) + 'px;width:' + Math.max(2, X(d2) - X(d1)) + 'px"></i>' : '');
        inner += '<button class="tl-item" type="button" style="margin-left:' + L + 'px;width:' + W + 'px" data-act="edit-row" data-bed="' + g.bed.id + '" data-row="' + x.r.id + '">' +
          '<span class="tl-card">' + av(pl.p, 'xs') + '<span><b>' + esc(pl.p.name) + '</b><small>' + esc(x.r.v || METHOD[x.r.m]) + '</small></span>' +
          (pl.fit.s === 'bad' ? '<i class="warn-dot">!</i>' : '<span class="chev">›</span>') + '</span>' +
          '<span class="tl-bar">' + (pl.sow ? seg('b', pl.sow, pl.start) : '') + seg('y', pl.start, pl.ha) + seg('g', pl.ha, pl.hb) + '</span></button>';
      });
    });

    if (trees.length) {
      inner += '<div class="tl-group"><span>Trees &amp; perennials</span></div>';
      trees.forEach((x) => {
        const p = PL[x.tr.p];
        let segs = '';
        x.w.forEach((w) => {
          const c = w.kind === 'harvest' ? 'g' : w.kind === 'prune' ? 'b' : 'y';
          segs += '<i class="k-' + c + ' thin" style="left:' + X(w.d) + 'px;width:' + Math.max(3, X(w.end) - X(w.d)) + 'px" title="' + esc(w.title) + '"></i>';
        });
        inner += '<button class="tl-item tree" type="button" style="width:' + total + 'px" data-act="tree" data-id="' + x.tr.id + '">' +
          '<span class="tl-card sticky">' + av(p, 'xs') + '<span><b>' + esc(p.name) + '</b><small>' + esc(x.tr.v || 'Prune · care · harvest') + '</small></span></span>' +
          '<span class="tl-bar">' + segs + '</span></button>';
      });
    }

    html += '<div class="tl" id="tl"><div class="tl-in" style="width:' + total + 'px">' + shade +
      (showToday ? '<i class="tl-today" style="left:' + X(t) + 'px"><span>' + pad(t.getDate()) + '.' + pad(t.getMonth() + 1) + '.</span></i>' : '') +
      inner + '</div></div>';
    html += '<p class="muted small pad">Tap a plant to change its date. <span class="warn-dot inline">!</span> marks a planting outside the best window for ' + esc(locName()) + '.</p>';
    return html;
  }

  function isFrosty(d) {
    const s = seasonOf(d);
    for (let i = s - 1; i <= s + 1; i++) if (d >= FF(i) && d < LF(i + 1)) return true;
    return false;
  }

  function scrollTimeline() {
    const tl = el('tl'), td = $('.tl-today');
    if (tl && td) tl.scrollLeft = Math.max(0, td.offsetLeft - tl.clientWidth * 0.3);
  }

  /* ------------------------------------------------------------ trees */

  function viewTrees() {
    const t = today();
    let html = '';
    if (!S.trees.length) {
      html += empty('🌳', 'Add your fruit trees', 'Get a month-by-month calendar of pruning, feeding, spraying, netting and harvest for every tree, berry and vine you grow.',
        '<button class="btn primary" type="button" data-act="add-tree">+ Add a tree or perennial</button>');
      html += '<h2 class="h2">Popular picks</h2><div class="chips-x">' + ['lemon', 'apple', 'fig', 'peach', 'blueberry', 'strawberry', 'passionfruit', 'grape'].map((id) =>
        '<button class="pchip" type="button" data-act="quick-tree" data-id="' + id + '">' + av(PL[id]) + '<b>' + esc(PL[id].name) + '</b><small>+ Add</small></button>').join('') + '</div>';
    } else {
      html += '<div class="tree-list">' + S.trees.map((tr) => {
        const p = PL[tr.p], age = t.getFullYear() - tr.y;
        const next = treeTasks(tr, t, addD(t, 365)).filter((x) => !S.done[x.key])[0];
        const fruit = age >= (p.fruitIn || 0) ? 'Fruiting age' : 'First fruit ~' + (tr.y + p.fruitIn);
        return '<button class="tree-card" type="button" data-act="tree" data-id="' + tr.id + '">' + av(p, 'md') +
          '<span class="tc-txt"><b>' + esc(p.name) + (tr.v ? ' <span>· ' + esc(tr.v) + '</span>' : '') + '</b>' +
          '<small>Planted ' + tr.y + ' · ' + (age < 1 ? 'new this year' : age + ' yr' + (age === 1 ? '' : 's')) + ' · ' + fruit + '</small>' +
          (next ? '<span class="next">' + kindIcon(next.kind) + ' ' + esc(next.title.split(' — ')[0]) + ' · ' + (next.d <= t ? 'now' : monthSpan(next.d, next.end)) + '</span>' : '') +
          '</span><span class="chev">›</span></button>';
      }).join('') + '</div>';
      html += '<button class="btn ghost block" type="button" data-act="add-tree">+ Add a tree or perennial</button>';
      html += '<div class="h2row"><h2 class="h2">Tree calendar</h2>' + seasonSwitch() + '</div>' + treeCalendar();
    }
    html += '<h2 class="h2">Pruning basics</h2><div class="card basics">' + D.pruning.map((x, i) =>
      '<details' + (i === 0 && UI.basicsOpen ? ' open' : '') + '><summary>' + esc(x[0]) + '</summary><p>' + esc(x[1]) + '</p></details>').join('') + '</div>';
    return html;
  }

  function treeCalendar() {
    const months = seasonMonths(UI.season), tm = som(today());
    let html = '<div class="tcal-wrap"><table class="tcal"><thead><tr><th></th>' + months.map((m) =>
      '<th class="' + (+m === +tm ? 'now' : '') + '">' + MS[m.getMonth()].charAt(0) + '<small>' + MS[m.getMonth()] + '</small></th>').join('') + '</tr></thead><tbody>';
    const used = {};
    S.trees.forEach((tr) => {
      const p = PL[tr.p];
      html += '<tr><th><button type="button" data-act="tree" data-id="' + tr.id + '">' + av(p, 'xs') + '<span>' + esc(tr.v || p.name) + '</span></button></th>';
      months.forEach((m) => {
        const ks = [];
        treeTasks(tr, m, eom(m)).forEach((x) => { if (ks.indexOf(x.kind) < 0) ks.push(x.kind); used[x.kind] = true; });
        html += '<td class="' + (+m === +tm ? 'now' : '') + '">' + ks.slice(0, 3).map((k) => '<i title="' + D.kinds[k].label + '">' + kindIcon(k) + '</i>').join('') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div><div class="legend small">' + Object.keys(used).map((k) => '<span>' + kindIcon(k) + ' ' + D.kinds[k].label + '</span>').join('') + '</div>';
    return html;
  }

  /* ------------------------------------------------------------ plants */

  function viewPlants() {
    const cats = [['all', 'All'], ['fav', '♥ Saved']].concat(D.cats.map((c) => [c.id, c.label]));
    return '<label class="search"><span aria-hidden="true">🔍</span><input id="plantQ" type="search" placeholder="Search ' + D.plants.length + ' plants" value="' + esc(UI.q) + '" autocomplete="off" /></label>' +
      '<div class="chips-x cats">' + cats.map((c) => '<button type="button" class="cat' + (UI.cat === c[0] ? ' on' : '') + '" data-act="cat" data-cat="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' +
      '<div class="pgrid" id="plantGrid">' + plantGrid() + '</div>';
  }

  function plantStatus(p) {
    const t = today();
    if (isCrop(p)) {
      const a = nowActs(p, t), k = Object.keys(a);
      if (k.length) return '<span class="tag go">' + ACT_LABEL[k[0]] + ' now</span>';
      const m = defMethod(p), n = nextPerfect(p, m, t);
      if (!isTree(p)) return n ? '<span class="tag">From ' + MS[n.getMonth()] + '</span>' : '';
    }
    if (isTree(p)) {
      const w = treeWins(p, t, eom(t))[0];
      if (w) return '<span class="tag ' + (w.t[0] === 'harvest' ? 'go' : 'tree') + '">' + kindIcon(w.t[0]) + ' ' + esc(w.t[2]) + '</span>';
    }
    return '';
  }

  function plantGrid() {
    const q = UI.q.trim().toLowerCase();
    const list = D.plants.filter((p) => (UI.cat === 'all' || (UI.cat === 'fav' ? S.favs[p.id] : p.cat === UI.cat)) &&
      (!q || p.name.toLowerCase().indexOf(q) >= 0 || (p.fam || '').toLowerCase().indexOf(q) >= 0));
    if (!list.length) return '<p class="muted pad">' + (UI.cat === 'fav' ? 'Tap the ♥ on any plant to save it here.' : 'No plants match “' + esc(UI.q) + '”.') + '</p>';
    return list.map((p) => '<button class="pcard" type="button" data-act="plant" data-id="' + p.id + '">' + av(p, 'md') +
      '<b>' + esc(p.name) + '</b>' + plantStatus(p) + (S.favs[p.id] ? '<i class="fav">♥</i>' : '') + '</button>').join('');
  }

  /* =====================================================================
     Sheets
     ===================================================================== */

  function openSheet(sheet) {
    UI.sheet = sheet;
    renderSheet(true);
  }

  function closeSheet() {
    UI.sheet = null;
    el('sheetHost').innerHTML = '';
    document.body.classList.remove('sheet-open');
  }

  function renderSheet(fresh) {
    const host = el('sheetHost');
    if (!UI.sheet) { closeSheet(); return; }
    const body = $('.sheet-body', host), top = !fresh && body ? body.scrollTop : 0;
    const fn = SHEETS[UI.sheet.type];
    host.innerHTML = '<div class="scrim" data-act="close-sheet"></div><div class="sheet' + (fresh ? ' anim' : '') + '" role="dialog" aria-modal="true">' +
      '<button class="x" type="button" data-act="close-sheet" aria-label="Close">✕</button><div class="sheet-body">' + fn(UI.sheet) + '</div></div>';
    document.body.classList.add('sheet-open');
    const nb = $('.sheet-body', host);
    if (nb) nb.scrollTop = top;
  }

  /* ------------------------------------------------------------ plant guide */

  function overviewChart(p) {
    const y = today().getFullYear(), a = new Date(y, 0, 1, 12), b = new Date(y, 11, 31, 12), span = days(a, b) + 1;
    const P = (d) => Math.max(0, Math.min(100, days(a, d) / span * 100));
    const rows = [];
    if (isCrop(p) && !isTree(p)) {
      const ws = [];
      for (let s = y - 1; s <= y + 1; s++) wins(p, s).forEach((w) => ws.push(w));
      if (p.ind) rows.push(['Sow indoors', 'b', ws.filter((w) => w.k === 'out').map((w) => [addD(w.a, -p.ind * 7), addD(w.b, -p.ind * 7)])]);
      rows.push(['Plant / sow', 'y', ws.map((w) => [w.a, w.b])]);
      rows.push(['Harvest', 'g', ws.map((w) => {
        const g = p.dtm + (w.k === 'dir' ? dirExtra(p) : 0);
        let hb = addD(grown(w.b, g), p.hw * 7);
        const ff = nextFF(w.a), hc = addD(ff, 28 + mildW(p) * 7);
        if (p.frost === 't' && hb > ff) hb = ff;
        if (p.frost === 'h' && hb > hc) hb = hc;
        return [grown(w.a, g), hb];
      })]);
    } else {
      const ws = treeWins(p, a, b);
      rows.push(['Prune', 'b', ws.filter((w) => w.t[0] === 'prune').map((w) => [w.a, w.b])]);
      rows.push(['Care', 'y', ws.filter((w) => w.t[0] !== 'prune' && w.t[0] !== 'harvest').map((w) => [w.a, w.b])]);
      rows.push(['Harvest', 'g', ws.filter((w) => w.t[0] === 'harvest').map((w) => [w.a, w.b])]);
    }
    const t = today();
    let html = '<div class="ov card"><div class="ov-head"><span></span><div>' + MS.map((m) => '<span>' + m.charAt(0) + '</span>').join('') + '</div></div>';
    rows.forEach((r) => {
      html += '<div class="ov-row"><span class="ov-l">' + r[0] + ' <i class="k-' + r[1] + '"></i></span><div class="ov-t">' +
        r[2].filter((x) => x[1] >= a && x[0] <= b).map((x) => '<i class="k-' + r[1] + '" style="left:' + P(x[0]) + '%;width:' + Math.max(1.5, P(x[1]) - P(x[0])) + '%"></i>').join('') +
        '<b class="ov-now" style="left:' + P(t) + '%"></b></div></div>';
    });
    return html + '</div>';
  }

  function sheetPlant(sh) {
    const p = PL[sh.id], t = today();
    const kicker = (D.cats.find((c) => c.id === p.cat) || {}).label + (p.fam ? ' · ' + p.fam + ' family' : '');
    let html = '<div class="pd-head">' + av(p, 'xl') + '<div><small>' + esc(kicker) + '</small><h2>' + esc(p.name) + '</h2></div>' +
      '<button class="fav-btn' + (S.favs[p.id] ? ' on' : '') + '" type="button" data-act="fav" data-id="' + p.id + '" aria-pressed="' + !!S.favs[p.id] + '" aria-label="Save">' + (S.favs[p.id] ? '♥' : '♡') + '</button></div>';

    if (p.needs && S.mild < p.needs[0]) html += '<div class="perfect bad"><b>Check your climate</b><p>' + esc(p.needs[1]) + '</p></div>';
    html += '<h3 class="h3">Season overview <small>' + esc(locName()) + ' · ' + t.getFullYear() + '</small></h3>' + overviewChart(p);

    html += '<div class="tiles">' + [['neighbours', '💚', 'Neighbours'], ['distances', '📏', 'Distances'], ['pests', '🐛', 'Diseases & Pests']].map((x) =>
      '<button type="button" class="tile' + (UI.detailTab === x[0] ? ' on' : '') + '" data-act="detail-tab" data-tab="' + x[0] + '"><span>' + x[1] + '</span>' + x[2] + '</button>').join('') + '</div>';
    html += '<div class="card pad-in">' + detailPanel(p) + '</div>';

    html += '<div class="facts">' + [['☀️', 'Sun', p.sun], ['💧', 'Water', p.water], ['🪣', 'Feeding', p.feed],
      isCrop(p) && !isTree(p) ? ['⏱️', 'To harvest', p.dtm + ' days'] : ['🍯', 'First fruit', p.fruitIn ? '~' + p.fruitIn + ' yr' + (p.fruitIn === 1 ? '' : 's') + ' after planting' : 'First season']]
      .map((f) => '<div><span>' + f[0] + '</span><small>' + f[1] + '</small><b>' + esc(f[2] || '—') + '</b></div>').join('') + '</div>';

    if (isTree(p)) html += treeGuide(p);
    if (isCrop(p) && !isTree(p)) html += cropInstructions(p);
    if (p.tips) html += '<div class="tip">💡 ' + esc(p.tips) + '</div>';
    if (S.region === 'VIC' && p.vic) html += '<div class="tip local">📍 <b>In Victoria:</b> ' + esc(p.vic) + '</div>';

    html += '<div class="sheet-actions">';
    if (isCrop(p)) html += '<button class="btn primary" type="button" data-act="plant-to-bed" data-id="' + p.id + '">' + (sh.bedId ? 'Add to ' + esc(bedById(sh.bedId).name) : '+ Add to a bed') + '</button>';
    if (isTree(p)) html += '<button class="btn ' + (isCrop(p) ? 'ghost' : 'primary') + '" type="button" data-act="quick-tree" data-id="' + p.id + '">+ Add to my trees</button>';
    html += '</div>';

    if (sh.choose) {
      html += '<div class="choose card"><h3 class="h3">Which bed?</h3>' + S.beds.map((b) =>
        '<button type="button" class="choose-b" data-act="choose-bed" data-bed="' + b.id + '" data-id="' + p.id + '">' + (b.kind === 'pot' ? '🪴' : '🟫') + ' ' + esc(b.name) + '<small>' + b.w + (b.kind === 'pot' ? ' cm pot' : ' × ' + b.l + ' cm') + '</small></button>').join('') +
        '<button type="button" class="choose-b" data-act="new-bed">＋ New bed or pot</button></div>';
    }
    return html;
  }

  function detailPanel(p) {
    if (UI.detailTab === 'distances') {
      if (!p.sp) return '<p class="muted">No spacing data.</p>';
      const big = p.sp[0] >= 100;
      const u = (cm) => (cm >= 100 ? (cm / 100).toFixed(cm % 100 ? 1 : 0) + ' m' : cm + ' cm');
      let html = '<div class="dist"><svg viewBox="0 0 200 92" aria-hidden="true">';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) html += '<circle cx="' + (40 + c * 40) + '" cy="' + (26 + r * 40) + '" r="9" fill="#8cc98a"/>';
      html += '<path d="M40 8h40" stroke="#e0533d" stroke-width="2" marker-end="url(#ar)" marker-start="url(#ar)"/><path d="M176 26v40" stroke="#6c8fd8" stroke-width="2" marker-end="url(#ar)" marker-start="url(#ar)"/>' +
        '<defs><marker id="ar" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L6 3 0 6z" fill="#7b7d72"/></marker></defs></svg>' +
        '<dl><div><dt><i style="background:#e0533d"></i>' + (big ? 'Between plants' : 'In the row') + '</dt><dd>' + u(p.sp[0]) + '</dd></div>' +
        (big ? '' : '<div><dt><i style="background:#6c8fd8"></i>Between rows</dt><dd>' + u(p.sp[1]) + '</dd></div>') +
        (p.depth != null && !big ? '<div><dt>Sowing depth</dt><dd>' + (p.depth ? p.depth + ' cm' : 'Surface / plant at soil level') + '</dd></div>' : '') +
        (!big ? '<div><dt>Plants per metre of row</dt><dd>' + Math.max(1, Math.floor(100 / p.sp[0])) + '</dd></div>' : '') + '</dl></div>';
      return html;
    }
    if (UI.detailTab === 'pests') {
      return '<div class="two"><div><h4>Pests</h4><ul>' + (p.pests || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
        '<div><h4>Diseases</h4><ul>' + ((p.dis || []).length ? p.dis.map((x) => '<li>' + esc(x) + '</li>').join('') : '<li class="muted">Rarely troubled</li>') + '</ul></div></div>';
    }
    const list = (ids, cls) => (ids || []).filter((id) => PL[id]).map((id) => '<button type="button" class="nb ' + cls + '" data-act="plant" data-id="' + id + '">' + av(PL[id], 'sm') + '<span>' + esc(PL[id].name) + '</span></button>').join('');
    const g = list(p.good, 'good'), b = list(p.bad, 'bad');
    return '<h4>💚 Good neighbours</h4><div class="nbs">' + (g || '<span class="muted">No strong friends — fine next to most plants.</span>') + '</div>' +
      '<h4>⛔ Keep apart</h4><div class="nbs">' + (b || '<span class="muted">No known bad neighbours.</span>') + '</div>';
  }

  function cropInstructions(p) {
    const t = today(), sg = suggest(p, t), m = sg.m, d = nextPerfect(p, m, sg.d);
    let html = '<div class="h3row"><h3 class="h3">Instructions</h3><small>' + METHOD[m] + '</small></div>';
    if (!d) return html + '<p class="muted">There is no good window for this plant in ' + esc(locName()) + ' in the coming year.</p>';
    const fakeBed = { id: '_', name: '', kind: 'raised', w: 120, l: 100, rows: [] };
    const row = { id: '_', p: p.id, m: m, d: iso(d), n: null, v: '' };
    const tasks = rowTasks(fakeBed, row);
    const startNow = tasks[0].d <= t;
    html += '<p class="muted">' + (startNow ? 'Good time to start now — here\'s how the season goes:'
      : 'The next window opens in ' + phase(tasks[0].d).replace(/^\w/, (c) => c.toLowerCase()) + '. Here\'s how that season goes:') + '</p>';
    html += '<ol class="steps">' + tasks.map((x) => '<li><span class="when">' + phase(x.d).replace(' ', '<br>') + '</span><span class="step">' +
      '<i>' + kindIcon(x.kind) + '</i><b>' + esc(x.title.split(' — ')[0]) + '</b></span></li>').join('') + '</ol>';
    return html;
  }

  function treeGuide(p) {
    const t = today(), ws = treeWins(p, t, addD(t, 364));
    const seen = {};
    let html = '<h3 class="h3">Year in the orchard</h3><ol class="steps">';
    ws.forEach((w) => {
      if (seen[w.i]) return;
      seen[w.i] = true;
      html += '<li><span class="when">' + monthSpan(w.a, w.b).replace(' – ', '–<br>') + '</span><span class="step tall"><i>' + kindIcon(w.t[0]) + '</i><span><b>' + esc(w.t[2]) + '</b><small>' + esc(w.t[3]) + '</small></span></span></li>';
    });
    html += '</ol>';
    html += '<h3 class="h3">Pruning guide</h3><div class="card pad-in"><dl class="kv"><div><dt>Shape</dt><dd>' + esc(p.form) + '</dd></div><div><dt>Fruits on</dt><dd>' + esc(p.fruitOn) + '</dd></div><div><dt>Pollination</dt><dd>' + esc(p.pollination) + '</dd></div></dl>' +
      '<ol class="prune">' + p.prune.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div>';
    return html;
  }

  /* ------------------------------------------------------------ row editor */

  function bedById(id) { return S.beds.find((b) => b.id === id); }

  function sheetRow(sh) {
    const b = bedById(sh.bedId), r = sh.draft, p = PL[r.p], pl = plan(r), ms = methods(p);
    let html = '<div class="pd-head">' + av(p, 'lg') + '<div><small>' + esc(b.name) + '</small><h2>' + esc(p.name) + '</h2></div></div>';

    html += '<div class="seg">' + ms.map((m) => '<button type="button" data-act="row-method" data-m="' + m + '" aria-selected="' + (r.m === m) + '">' + METHOD[m] + '</button>').join('') + '</div>';

    html += '<label class="field"><span>' + (r.m === 'direct' ? 'Sowing date' : 'Planting-out date') + '</span><input type="date" data-field="row-d" value="' + r.d + '" /></label>';
    const f = pl.fit;
    if (f.s === 'good') html += '<p class="ok">✓ Great timing for ' + esc(locName()) + '.</p>';
    else if (f.s === 'none') html += '<p class="bad">This method has no window in your climate.</p>';
    else {
      html += '<div class="perfect ' + f.s + '"><b>' + (f.s === 'near' ? 'Close to the ideal time' : 'Find the perfect time') + '</b>' +
        '<p>' + (f.s === 'near' ? 'A little ' + (f.early ? 'early' : 'late') + '. ' : 'You\'ve set this for ' + ML[pl.start.getMonth()] + ', which is not the best time for ' + esc(p.name.toLowerCase()) + ' in your location. ') +
        'The best window is <b>' + fmtY(f.w.a) + ' – ' + fmtY(f.w.b) + '</b>.</p>' +
        '<button class="btn sm primary" type="button" data-act="row-perfect">📅 Use perfect date</button></div>';
    }

    /* Mini timeline of this planting. */
    const a = pl.from, z = pl.end, span = Math.max(1, days(a, z));
    const P = (d) => days(a, d) / span * 100;
    html += '<div class="mini card"><div class="tl-bar big">' + (pl.sow ? '<i class="k-b" style="left:0;width:' + P(pl.start) + '%"></i>' : '') +
      '<i class="k-y" style="left:' + P(pl.start) + '%;width:' + (P(pl.ha) - P(pl.start)) + '%"></i><i class="k-g" style="left:' + P(pl.ha) + '%;width:' + (100 - P(pl.ha)) + '%"></i></div>' +
      '<dl class="kv tight">' + (pl.sow ? '<div><dt><i class="k-b"></i>Sow indoors</dt><dd>' + fmtY(pl.sow) + '</dd></div>' : '') +
      '<div><dt><i class="k-y"></i>' + (r.m === 'direct' ? 'Sow in bed' : 'Plant out') + '</dt><dd>' + fmtY(pl.start) + '</dd></div>' +
      '<div><dt><i class="k-g"></i>Harvest</dt><dd>' + fmtY(pl.ha) + ' – ' + fmtY(pl.hb) + '</dd></div></dl></div>';

    const auto = autoCount(b, p);
    html += '<div class="row2"><label class="field"><span>Plants</span><input type="number" min="1" max="999" inputmode="numeric" data-field="row-n" value="' + (r.n || '') + '" placeholder="' + auto + '" /></label>' +
      '<label class="field"><span>Variety (optional)</span><input type="text" data-field="row-v" value="' + esc(r.v) + '" placeholder="e.g. ' + esc(sampleVariety(p)) + '" maxlength="40" /></label></div>';
    html += '<p class="hint">Auto: ' + auto + ' plant' + (auto === 1 ? '' : 's') + (b.kind === 'pot' ? ' in a ' + b.w + ' cm pot' : ' along a ' + b.l + ' cm row') + ' at ' + p.sp[0] + ' cm spacing.</p>';

    /* Neighbours in the bed at the same time. */
    const others = b.rows.filter((x) => x.id !== r.id).map((x) => ({ x: x, pl: plan(x) })).filter((o) => o.pl.start <= pl.end && o.pl.end >= pl.start);
    const goods = others.filter((o) => relation(p, o.pl.p) === 'good'), bads = others.filter((o) => relation(p, o.pl.p) === 'bad');
    if (goods.length || bads.length) {
      html += '<div class="card pad-in nbinfo">' + (goods.length ? '<p>💚 Good with ' + goods.map((o) => esc(o.pl.p.name)).join(', ') + ' in this bed.</p>' : '') +
        (bads.length ? '<p>⛔ ' + bads.map((o) => esc(o.pl.p.name)).join(', ') + (bads.length === 1 ? ' doesn\'t' : ' don\'t') + ' like growing near ' + esc(p.name.toLowerCase()) + ' — keep them at opposite ends.</p>' : '') + '</div>';
    }

    html += '<div class="sheet-actions"><button class="btn primary" type="button" data-act="row-save">' + (sh.isNew ? 'Add to ' + esc(b.name) : 'Save') + '</button></div>';
    html += '<div class="sheet-links">';
    if (!sh.isNew && b.rows.length > 1 && b.kind !== 'pot') html += '<button type="button" class="link" data-act="row-move" data-dir="-1">↑ Move up</button><button type="button" class="link" data-act="row-move" data-dir="1">↓ Move down</button>';
    html += '<button type="button" class="link" data-act="plant" data-id="' + p.id + '">📖 Plant guide</button>';
    if (!sh.isNew) html += '<button type="button" class="link danger" data-act="row-delete">Remove</button>';
    return html + '</div>';
  }

  function sampleVariety(p) {
    return ({ tomato: 'Grosse Lisse', 'cherry-tomato': 'Sweet 100', lettuce: 'Cos', carrot: 'Nantes', pea: 'Sugar Snap', basil: 'Genovese', capsicum: 'California Wonder', 'bush-bean': 'Provider', silverbeet: 'Rainbow', potato: 'Dutch Cream', strawberry: 'Albion' })[p.id] || 'heirloom';
  }

  /* ------------------------------------------------------------ bed editor */

  function sheetBed(sh) {
    const d = sh.draft, pot = d.kind === 'pot';
    const presets = pot ? [[30, 30], [40, 40], [50, 50], [60, 60]] : [[60, 120], [90, 180], [120, 240], [120, 360]];
    return '<h2>' + (sh.isNew ? 'New ' + (pot ? 'pot' : 'bed') : 'Edit ' + esc(d.name)) + '</h2>' +
      '<div class="seg">' + [['raised', 'Raised bed'], ['ground', 'In-ground'], ['pot', 'Pot / tub']].map((k) =>
        '<button type="button" data-act="bed-kind" data-kind="' + k[0] + '" aria-selected="' + (d.kind === k[0]) + '">' + k[1] + '</button>').join('') + '</div>' +
      '<label class="field"><span>Name</span><input type="text" data-field="bed-name" value="' + esc(d.name) + '" maxlength="30" /></label>' +
      (pot ? '<label class="field"><span>Diameter (cm)</span><input type="number" min="10" max="300" inputmode="numeric" data-field="bed-w" value="' + d.w + '" /></label>'
        : '<div class="row2"><label class="field"><span>Width (cm)</span><input type="number" min="20" max="1000" inputmode="numeric" data-field="bed-w" value="' + d.w + '" /></label>' +
        '<label class="field"><span>Length (cm)</span><input type="number" min="20" max="5000" inputmode="numeric" data-field="bed-l" value="' + d.l + '" /></label></div>') +
      '<div class="chips-x">' + presets.map((x) => '<button type="button" class="cat" data-act="bed-preset" data-w="' + x[0] + '" data-l="' + x[1] + '">' + (pot ? x[0] + ' cm' : x[0] + ' × ' + x[1]) + '</button>').join('') + '</div>' +
      (pot ? '' : '<p class="hint">Rows run along the length; they stack across the width.</p>') +
      '<div class="sheet-actions"><button class="btn primary" type="button" data-act="bed-save">' + (sh.isNew ? 'Create' : 'Save') + '</button></div>' +
      (sh.isNew ? '' : '<div class="sheet-links"><button type="button" class="link danger" data-act="bed-delete">Delete ' + (pot ? 'pot' : 'bed') + ' and its plants</button></div>');
  }

  /* ------------------------------------------------------------ plant picker */

  function sheetPick(sh) {
    const b = bedById(sh.bedId);
    return '<h2>Add to ' + esc(b.name) + '</h2>' +
      '<label class="search"><span aria-hidden="true">🔍</span><input id="pickQ" type="search" placeholder="Search plants" value="' + esc(sh.q || '') + '" autocomplete="off" /></label>' +
      '<div class="chips-x cats">' + [['all', 'All']].concat(D.cats.filter((c) => D.plants.some((p) => p.cat === c.id && isCrop(p))).map((c) => [c.id, c.label])).map((c) =>
        '<button type="button" class="cat' + ((sh.cat || 'all') === c[0] ? ' on' : '') + '" data-act="pick-cat" data-cat="' + c[0] + '">' + c[1] + '</button>').join('') + '</div>' +
      '<div id="pickList">' + pickList(sh) + '</div>';
  }

  function pickList(sh) {
    const b = bedById(sh.bedId), q = (sh.q || '').trim().toLowerCase(), cat = sh.cat || 'all';
    const from = maxD(today(), UI.month || today());
    const inBed = b.rows.map((r) => PL[r.p]);
    const list = D.plants.filter((p) => isCrop(p) && (cat === 'all' || p.cat === cat) && (!q || p.name.toLowerCase().indexOf(q) >= 0)).map((p) => {
      const n = isCrop(p) ? suggest(p, from).d : null;
      return { p: p, n: n, now: n && days(from, n) <= 14 };
    }).sort((x, y) => (y.now - x.now) || ((x.n || Infinity) - (y.n || Infinity)));
    if (!list.length) return '<p class="muted pad">No plants match.</p>';
    const fromLabel = +som(from) === +som(today()) ? 'now' : 'in ' + MS[from.getMonth()];
    return '<div class="plist">' + list.map((x) => {
      const rels = inBed.map((o) => relation(x.p, o)), good = rels.indexOf('good') >= 0, bad = rels.indexOf('bad') >= 0;
      return '<button type="button" class="pli" data-act="pick" data-id="' + x.p.id + '">' + av(x.p, 'sm') + '<span><b>' + esc(x.p.name) + '</b><small>' +
        (x.now ? '<em class="go">Good to plant ' + fromLabel + '</em>' : x.n ? 'Best from ' + fmtY(x.n) : 'No window in your climate') + '</small></span>' +
        (bad ? '<i class="cmp bad" title="Bad neighbour for something in this bed">!</i>' : good ? '<i class="cmp good" title="Good neighbour for this bed">♥</i>' : '') + '</button>';
    }).join('') + '</div>';
  }

  /* ------------------------------------------------------------ trees */

  function sheetPickTree() {
    return '<h2>Add a tree or perennial</h2>' + ['tree', 'berry', 'perennial'].map((c) =>
      '<h3 class="h3">' + D.cats.find((x) => x.id === c).label + '</h3><div class="plist">' + D.plants.filter((p) => p.cat === c && isTree(p)).map((p) =>
        '<button type="button" class="pli" data-act="quick-tree" data-id="' + p.id + '">' + av(p, 'sm') + '<span><b>' + esc(p.name) + '</b><small>' +
        esc(p.form) + ' · fruit in ~' + (p.fruitIn || 1) + ' yr' + ((p.fruitIn || 1) === 1 ? '' : 's') + '</small></span></button>').join('') + '</div>').join('');
  }

  function sheetTree(sh) {
    const tr = S.trees.find((x) => x.id === sh.id);
    if (!tr) return '<p>Removed.</p>';
    const p = PL[tr.p], t = today(), y = t.getFullYear();
    const L = treeTasks(tr, addD(t, -30), addD(t, 365));
    L.forEach((x) => { x.done = !!S.done[x.key]; });
    let html = '<div class="pd-head">' + av(p, 'xl') + '<div><small>My trees</small><h2>' + esc(p.name) + '</h2></div></div>';
    html += '<div class="row2"><label class="field"><span>Variety</span><input type="text" data-field="tree-v" value="' + esc(tr.v) + '" maxlength="40" placeholder="e.g. ' + esc(p.id === 'lemon' ? 'Meyer' : 'variety') + '" /></label>' +
      '<label class="field"><span>Year planted</span><input type="number" min="1900" max="' + (y + 1) + '" inputmode="numeric" data-field="tree-y" value="' + tr.y + '" /></label></div>' +
      '<label class="field"><span>Notes</span><input type="text" data-field="tree-note" value="' + esc(tr.note || '') + '" maxlength="120" placeholder="Where it is, rootstock, anything to remember" /></label>';
    if (y - tr.y < (p.fruitIn || 0)) html += '<p class="hint">🌱 Young tree — expect the first real crop around ' + (tr.y + p.fruitIn) + '. Harvest jobs start then; until then, pinch off fruitlets so it puts energy into roots and branches.</p>';
    html += '<h3 class="h3">Next 12 months</h3><div class="card list">' + (L.length ? L.map(taskRow).join('') : '<p class="muted pad">No jobs scheduled.</p>') + '</div>';
    html += treeGuide(p).replace('<h3 class="h3">Year in the orchard</h3>', '<h3 class="h3">How to do each job</h3>');
    html += '<div class="sheet-links"><button type="button" class="link" data-act="plant" data-id="' + p.id + '">📖 Full plant guide</button><button type="button" class="link danger" data-act="tree-delete">Remove tree</button></div>';
    return html;
  }

  /* ------------------------------------------------------------ custom task */

  function sheetTask(sh) {
    const d = sh.draft;
    return '<h2>' + (sh.isNew ? 'New task' : 'Edit task') + '</h2>' +
      '<label class="field"><span>What needs doing?</span><input type="text" data-field="task-t" value="' + esc(d.t) + '" maxlength="80" placeholder="e.g. Top up mulch on the citrus" /></label>' +
      '<label class="field"><span>When</span><input type="date" data-field="task-d" value="' + d.d + '" /></label>' +
      '<div class="sheet-actions"><button class="btn primary" type="button" data-act="task-save">Save</button></div>' +
      (sh.isNew ? '' : '<div class="sheet-links"><button type="button" class="link danger" data-act="task-delete">Delete task</button></div>');
  }

  /* ------------------------------------------------------------ settings */

  function sheetSettings() {
    const y = today().getFullYear(), lfD = LF(y), ffD = FF(y), len = Math.round(days(lfD, ffD) / 7);
    return '<h2>Settings</h2>' +
      '<label class="field"><span>Location</span><select data-field="set-loc">' + locOptions(S.loc) + '</select></label>' +
      '<div class="row2"><label class="field"><span>' + (S.mild >= 10 ? 'Safe to plant summer crops' : 'Last spring frost') + '</span><input type="date" data-field="set-lf" value="' + iso(lfD) + '" /></label>' +
      '<label class="field"><span>' + (S.mild >= 10 ? 'Summer crops wind down' : 'First autumn frost') + '</span><input type="date" data-field="set-ff" value="' + iso(ffD) + '" /></label></div>' +
      '<label class="field"><span>Winters</span><select data-field="set-mild">' + D.winters.map((w) =>
        '<option value="' + w[0] + '"' + (nearestWinter() === w[0] ? ' selected' : '') + '>' + w[1] + '</option>').join('') + '</select></label>' +
      '<p class="hint">Growing season of about ' + len + ' weeks. These two dates drive every date in the app — adjust them if your garden is colder or warmer than the city average. ' +
      'Frost-free? Use the start and end of your main warm growing season. Milder winters let peas, broad beans, garlic, onions and brassicas be sown later into autumn and winter.</p>' +
      '<h3 class="h3">Weather &amp; watering</h3>' +
      '<label class="switch"><input type="checkbox" data-field="set-wx"' + (S.wx ? ' checked' : '') + ' /><span>Live weather and watering advice</span></label>' +
      '<p class="hint">Rain, sun and evaporation for the last 7 and next 7 days come from Open-Meteo (free, no account). Only your ' + (S.geo ? 'location' : 'area') +
      '\'s coordinates are sent' + (S.lat != null ? ' (' + S.lat.toFixed(2) + ', ' + S.lon.toFixed(2) + ')' : '') + ' — nothing about your garden.</p>' +
      (S.wx ? '<div class="row2"><button class="btn ghost" type="button" data-act="geo">📍 Use my exact spot</button>' +
        (S.geo && D.locations.some((l) => l.id === S.loc) ? '<button class="btn ghost" type="button" data-act="geo-reset">Use area centre</button>' : '') + '</div>' : '') +
      '<h3 class="h3">Backup</h3><p class="hint">Your garden is stored only in this browser. Save a backup file to move it to another device.</p>' +
      '<div class="row2"><button class="btn ghost" type="button" data-act="export">⬇︎ Save backup</button><label class="btn ghost file">⬆︎ Restore<input type="file" accept="application/json,.json" data-field="import" hidden /></label></div>' +
      (storageBlocked ? '<p class="bad">This browser is blocking storage, so changes will be lost when you close the page.</p>' : '') +
      '<div class="sheet-links"><button type="button" class="link danger" data-act="reset">Erase everything and start over</button></div>' +
      '<p class="fine">Garden Planner · build ' + BUILD + ' · <a href="../../">← Back to home</a></p>';
  }

  function nearestWinter() {
    return D.winters.reduce((best, w) => (Math.abs(w[0] - S.mild) < Math.abs(best - S.mild) ? w[0] : best), D.winters[0][0]);
  }

  const SHEETS = { plant: sheetPlant, row: sheetRow, bed: sheetBed, pick: sheetPick, pickTree: sheetPickTree, tree: sheetTree, task: sheetTask, settings: sheetSettings };

  /* =====================================================================
     Actions
     ===================================================================== */

  let toastTimer = null;
  function toast(msg, undo) {
    const t = el('toast');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button type="button" data-act="undo">Undo</button>' : '');
    t.hidden = false;
    toast.undo = undo || null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; toast.undo = null; }, 4000);
  }

  function commit() { save(); render(); if (UI.sheet) renderSheet(); }

  function newRow(bedId, pid) {
    const p = PL[pid], sg = suggest(p, maxD(today(), UI.month || today()));
    openSheet({ type: 'row', bedId: bedId, isNew: true, draft: { id: uid(), p: pid, m: sg.m, d: iso(sg.d), n: null, v: '' } });
  }

  function findTask(key) {
    const t = today();
    return allTasks(addD(t, -400), addD(t, 400)).find((x) => x.key === key);
  }

  const ACT = {
    tab: (a) => { UI.tab = a.dataset.tab; closeSheet(); render(); window.scrollTo(0, 0); },
    'close-sheet': () => { closeSheet(); render(); },
    'hard-reload': () => { location.replace(location.pathname + '?r=' + Date.now()); },

    'start-example': () => { setLoc(el('welcomeLoc').value); S.setup = true; exampleGarden(); UI.tab = 'today'; save(); render(); },
    'start-empty': () => { setLoc(el('welcomeLoc').value); S.setup = true; UI.tab = 'garden'; save(); render(); },

    settings: () => openSheet({ type: 'settings' }),
    'today-mode': (a) => { UI.todayMode = a.dataset.mode; UI.agendaDay = null; render(); },
    'agenda-prev': () => { UI.agenda = new Date(UI.agenda.getFullYear(), UI.agenda.getMonth() - 1, 1, 12); UI.agendaDay = null; render(); },
    'agenda-next': () => { UI.agenda = new Date(UI.agenda.getFullYear(), UI.agenda.getMonth() + 1, 1, 12); UI.agendaDay = null; render(); },
    'agenda-day': (a) => { const d = +a.dataset.day; UI.agendaDay = UI.agendaDay === d ? null : d; render(); },

    'season-prev': () => { UI.season--; shiftMonth(); render(); },
    'season-next': () => { UI.season++; shiftMonth(); render(); },
    month: (a) => { UI.month = pd(a.dataset.m); render(); },

    'toggle-task': (a) => {
      const k = a.dataset.key, was = S.done[k];
      if (was) delete S.done[k]; else S.done[k] = iso(today());
      commit();
      if (!was) toast('Done ✓', () => { delete S.done[k]; commit(); });
    },
    undo: () => { const u = toast.undo; el('toast').hidden = true; toast.undo = null; if (u) u(); },
    'open-task': (a) => {
      const k = a.dataset.key, t = findTask(k);
      if (!t) return;
      if (t.rowId) { const b = bedById(t.bedId), r = b.rows.find((x) => x.id === t.rowId); openSheet({ type: 'row', bedId: b.id, draft: Object.assign({}, r) }); }
      else if (t.treeId) openSheet({ type: 'tree', id: t.treeId });
      else if (t.custom) { const c = S.tasks.find((x) => x.id === t.custom); openSheet({ type: 'task', draft: Object.assign({}, c) }); }
    },
    'add-task': () => openSheet({ type: 'task', isNew: true, draft: { id: uid(), d: iso(today()), t: '' } }),
    'task-save': () => {
      const d = UI.sheet.draft;
      if (!d.t.trim()) { $('[data-field="task-t"]').focus(); return; }
      const i = S.tasks.findIndex((x) => x.id === d.id);
      if (i >= 0) S.tasks[i] = d; else S.tasks.push(d);
      closeSheet(); commit();
    },
    'task-delete': () => { const id = UI.sheet.draft.id; S.tasks = S.tasks.filter((x) => x.id !== id); delete S.done['c:' + id]; closeSheet(); commit(); },

    /* garden */
    'new-bed': () => openSheet({ type: 'bed', isNew: true, pending: UI.sheet && UI.sheet.type === 'plant' ? UI.sheet.id : null, draft: { id: uid(), name: 'Bed ' + (S.beds.filter((b) => b.kind !== 'pot').length + 1), kind: 'raised', w: 120, l: 240, rows: [] } }),
    'edit-bed': (a) => { const b = bedById(a.dataset.bed); openSheet({ type: 'bed', draft: Object.assign({}, b) }); },
    'bed-kind': (a) => {
      const d = UI.sheet.draft, k = a.dataset.kind;
      if ((k === 'pot') !== (d.kind === 'pot')) {
        if (k === 'pot') { d.w = 40; d.l = 40; if (UI.sheet.isNew) d.name = 'Pot ' + (S.beds.filter((b) => b.kind === 'pot').length + 1); }
        else { d.w = 120; d.l = 240; if (UI.sheet.isNew) d.name = 'Bed ' + (S.beds.filter((b) => b.kind !== 'pot').length + 1); }
      }
      d.kind = k; renderSheet();
    },
    'bed-preset': (a) => { const d = UI.sheet.draft; d.w = +a.dataset.w; d.l = +a.dataset.l; renderSheet(); },
    'bed-save': () => {
      const d = UI.sheet.draft;
      d.name = (d.name || '').trim() || (d.kind === 'pot' ? 'Pot' : 'Bed');
      d.w = Math.max(10, Math.min(5000, +d.w || 120));
      d.l = d.kind === 'pot' ? d.w : Math.max(10, Math.min(5000, +d.l || 240));
      const i = S.beds.findIndex((x) => x.id === d.id);
      if (i >= 0) S.beds[i] = d; else S.beds.push(d);
      const pending = UI.sheet.pending;
      closeSheet(); commit();
      if (pending) newRow(d.id, pending);
    },
    'bed-delete': () => {
      const d = UI.sheet.draft;
      if (d.rows.length && !confirm('Delete ' + d.name + ' and its ' + d.rows.length + ' planting' + (d.rows.length === 1 ? '' : 's') + '?')) return;
      S.beds = S.beds.filter((x) => x.id !== d.id);
      closeSheet(); commit();
    },
    'add-row': (a) => openSheet({ type: 'pick', bedId: a.dataset.bed, q: '', cat: 'all' }),
    'pick-cat': (a) => { UI.sheet.cat = a.dataset.cat; renderSheet(); },
    pick: (a) => newRow(UI.sheet.bedId, a.dataset.id),
    'edit-row': (a) => {
      const b = bedById(a.dataset.bed), r = b && b.rows.find((x) => x.id === a.dataset.row);
      if (r) openSheet({ type: 'row', bedId: b.id, draft: Object.assign({}, r) });
    },
    'row-method': (a) => {
      const d = UI.sheet.draft, p = PL[d.p], m = a.dataset.m;
      d.m = m;
      if (fit(p, m, pd(d.d)).s === 'bad') { const n = perfectFor(p, m); if (n) d.d = iso(n); }
      renderSheet();
    },
    'row-perfect': () => {
      const d = UI.sheet.draft, n = perfectFor(PL[d.p], d.m);
      if (n) { d.d = iso(n); renderSheet(); }
    },
    'row-save': () => {
      const sh = UI.sheet, b = bedById(sh.bedId), d = sh.draft;
      d.n = d.n ? Math.max(1, Math.min(999, Math.round(+d.n))) : null;
      d.v = (d.v || '').trim();
      const i = b.rows.findIndex((x) => x.id === d.id);
      if (i >= 0) b.rows[i] = d; else b.rows.push(d);
      /* Jump the garden view to the month the plant goes in, so it's visible. */
      const st = som(pd(d.d));
      if (sh.isNew && (st < UI.month || st > eom(UI.month))) { UI.season = seasonOf(st); UI.month = st; }
      closeSheet(); commit();
      if (sh.isNew) toast(PL[d.p].name + ' added to ' + b.name);
    },
    'row-delete': () => {
      const sh = UI.sheet, b = bedById(sh.bedId), i = b.rows.findIndex((x) => x.id === sh.draft.id);
      if (i < 0) return;
      const removed = b.rows.splice(i, 1)[0];
      closeSheet(); commit();
      toast(PL[removed.p].name + ' removed', () => { b.rows.splice(i, 0, removed); commit(); });
    },
    'row-move': (a) => {
      const sh = UI.sheet, b = bedById(sh.bedId), i = b.rows.findIndex((x) => x.id === sh.draft.id), j = i + +a.dataset.dir;
      if (i < 0 || j < 0 || j >= b.rows.length) return;
      const tmp = b.rows[i]; b.rows[i] = b.rows[j]; b.rows[j] = tmp;
      save(); render();
      toast('Moved ' + (+a.dataset.dir < 0 ? 'up' : 'down'));
    },

    /* plants */
    cat: (a) => { UI.cat = a.dataset.cat; render(); },
    plant: (a) => {
      const sh = UI.sheet;
      UI.detailTab = 'neighbours';
      openSheet({ type: 'plant', id: a.dataset.id, bedId: sh && (sh.type === 'pick' || sh.type === 'plant') ? sh.bedId : null });
    },
    'detail-tab': (a) => { UI.detailTab = a.dataset.tab; renderSheet(); },
    fav: (a) => { const id = a.dataset.id; if (S.favs[id]) delete S.favs[id]; else S.favs[id] = true; commit(); },
    'plant-to-bed': (a) => {
      const id = a.dataset.id, sh = UI.sheet;
      if (sh.bedId) return newRow(sh.bedId, id);
      if (!S.beds.length) return openSheet({ type: 'bed', isNew: true, pending: id, draft: { id: uid(), name: 'Bed 1', kind: 'raised', w: 120, l: 240, rows: [] } });
      if (S.beds.length === 1) return newRow(S.beds[0].id, id);
      sh.choose = true; renderSheet();
      const c = $('.choose'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    'choose-bed': (a) => newRow(a.dataset.bed, a.dataset.id),

    /* trees */
    'add-tree': () => openSheet({ type: 'pickTree' }),
    'quick-tree': (a) => {
      const tr = { id: uid(), p: a.dataset.id, v: '', y: today().getFullYear(), note: '' };
      S.trees.push(tr); save(); render();
      openSheet({ type: 'tree', id: tr.id });
      toast(PL[tr.p].name + ' added to your trees');
    },
    tree: (a) => openSheet({ type: 'tree', id: a.dataset.id }),
    'tree-delete': () => {
      const i = S.trees.findIndex((x) => x.id === UI.sheet.id);
      if (i < 0) return;
      const removed = S.trees.splice(i, 1)[0];
      closeSheet(); commit();
      toast(PL[removed.p].name + ' removed', () => { S.trees.splice(i, 0, removed); commit(); });
    },

    /* watering */
    watered: (a) => {
      const id = a.dataset.id, was = S.watered[id], t = iso(today());
      if (was === t) delete S.watered[id]; else S.watered[id] = t;
      save(); render();
      if (was !== t) toast('Watered ✓', () => { if (was) S.watered[id] = was; else delete S.watered[id]; save(); render(); });
    },
    geo: () => {
      if (!navigator.geolocation) { toast('Location isn\'t available in this browser'); return; }
      navigator.geolocation.getCurrentPosition((pos) => {
        S.lat = +pos.coords.latitude.toFixed(2); S.lon = +pos.coords.longitude.toFixed(2); S.geo = true;
        save(); render(); if (UI.sheet) renderSheet();
        toast('Using your location for the weather');
      }, () => toast('Couldn\'t get your location'), { timeout: 15000, maximumAge: 3600000 });
    },
    'geo-reset': () => {
      const l = D.locations.find((x) => x.id === S.loc);
      if (l) { S.lat = l.lat; S.lon = l.lon; S.geo = false; save(); render(); renderSheet(); }
    },

    /* settings */
    export: () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'garden-planner-' + iso(today()) + '.json';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    reset: () => {
      if (!confirm('Erase all beds, trees and tasks from this device?')) return;
      S = migrate(null);
      Object.assign(UI, { tab: 'today', season: null, month: null, agenda: null, agendaDay: null, cat: 'all', q: '' });
      closeSheet(); save(); render();
    }
  };

  function shiftMonth() {
    const months = seasonMonths(UI.season), want = UI.month ? UI.month.getMonth() : today().getMonth();
    UI.month = months.find((m) => m.getMonth() === want) || months[0];
  }

  /* Form fields inside sheets write straight into the sheet's draft. */
  const FIELD = {
    'row-d': (v) => { if (v) { UI.sheet.draft.d = v; return true; } },
    'row-n': (v) => { UI.sheet.draft.n = v ? +v : null; },
    'row-v': (v) => { UI.sheet.draft.v = v; },
    'bed-name': (v) => { UI.sheet.draft.name = v; },
    'bed-w': (v) => { UI.sheet.draft.w = +v; },
    'bed-l': (v) => { UI.sheet.draft.l = +v; },
    'task-t': (v) => { UI.sheet.draft.t = v; },
    'task-d': (v) => { if (v) UI.sheet.draft.d = v; },
    'tree-v': (v) => { treeOf().v = v.trim(); save(); },
    'tree-y': (v) => { const y = Math.round(+v); if (y > 1900 && y <= today().getFullYear() + 1) { treeOf().y = y; save(); return true; } },
    'tree-note': (v) => { treeOf().note = v; save(); },
    'set-loc': (v) => {
      if (v === 'custom') S.loc = 'custom'; else setLoc(v);
      return climateChanged();
    },
    'set-lf': (v) => { if (v) { S.lf = v.slice(5); S.loc = 'custom'; return climateChanged(); } },
    'set-ff': (v) => { if (v) { S.ff = v.slice(5); S.loc = 'custom'; return climateChanged(); } },
    'set-mild': (v) => { S.mild = +v; return climateChanged(); },
    'set-wx': (v, t) => { S.wx = t.checked; save(); return true; }
  };
  const treeOf = () => S.trees.find((x) => x.id === UI.sheet.id);
  /* Frost dates move where seasons start, so re-anchor the season views. */
  function climateChanged() { UI.season = null; UI.month = null; UI.agenda = null; save(); return true; }

  /* =====================================================================
     Wiring
     ===================================================================== */

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const fn = ACT[a.dataset.act];
    if (fn) { e.preventDefault(); fn(a, e); }
  });

  el('tabbar').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    UI.tab = b.dataset.tab;
    render();
    window.scrollTo(0, 0);
  });

  /* Text fields update their draft silently; fields that change dates or
     settings re-render so the timing feedback follows along. */
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'plantQ') { UI.q = t.value; el('plantGrid').innerHTML = plantGrid(); return; }
    if (t.id === 'pickQ') { UI.sheet.q = t.value; el('pickList').innerHTML = pickList(UI.sheet); return; }
    const f = t.dataset && t.dataset.field;
    if (f && FIELD[f] && t.type !== 'date' && t.type !== 'checkbox' && t.tagName !== 'SELECT' && t.type !== 'file' && f !== 'tree-y') FIELD[f](t.value);
  });

  document.addEventListener('change', (e) => {
    const t = e.target, f = t.dataset && t.dataset.field;
    if (f === 'import') return importFile(t);
    if (f && FIELD[f] && FIELD[f](t.value, t)) {
      if (UI.sheet && UI.sheet.type !== 'row' && UI.sheet.type !== 'task') render();
      if (UI.sheet) renderSheet();
    }
  });

  function importFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let data = null;
      try { data = JSON.parse(reader.result); } catch (e) { data = null; }
      if (!data || !Array.isArray(data.beds)) { alert('That file is not a Garden Planner backup.'); return; }
      if (!confirm('Replace everything on this device with the backup from that file?')) return;
      S = migrate(data); S.setup = true; save();
      closeSheet(); render();
      toast('Backup restored');
    };
    reader.readAsText(file);
  }

  el('settingsBtn').addEventListener('click', () => openSheet({ type: 'settings' }));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && UI.sheet) closeSheet();
  });

  /* If the page and the script came from different deploys, the browser is
     holding a stale copy of one of them. Say so and offer a cache-busting
     reload instead of failing silently. */
  function checkBuild() {
    if (!window.GP_BUILD || window.GP_BUILD === BUILD) return;
    const bar = document.createElement('div');
    bar.className = 'stale';
    bar.innerHTML = 'This page and its script are from different versions of the app. ' +
      '<button class="btn sm primary" type="button" data-act="hard-reload">Reload the app</button>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  /* Another tab of the same app may have written newer data. */
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    S = loadState();
    if (!UI.sheet) render();
  });

  /* Coming back on a later day should move the dates on. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !UI.sheet) render();
  });

  render();
  checkBuild();
})();
