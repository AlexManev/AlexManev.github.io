/*
 * Contraction Timer — source (JSX).
 *
 * index.html loads the *compiled* app.js, not this file. After editing this
 * source, regenerate app.js with Babel:
 *
 *   npx @babel/core @babel/preset-react   (or a local install)
 *   node -e "const b=require('@babel/core'),fs=require('fs');\
 *     fs.writeFileSync('app.js', b.transform(fs.readFileSync('app.src.jsx','utf8'),\
 *     {presets:[['@babel/preset-react',{runtime:'classic'}]],compact:false}).code)"
 *
 * React/ReactDOM are vendored under ./vendor (UMD globals React, ReactDOM).
 */

const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} = React;
const KEY = "contractions:v1";
const HOUR = 3600000;

/* ---------- formatting ---------- */
const pad = n => String(n).padStart(2, "0");
function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
function fmtDur(ms) {
  if (ms == null || !isFinite(ms)) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${pad(s % 60)}s`;
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;

/* ---------- pattern analysis ---------- */
function analyse(items, now, targetMin) {
  const done = items.filter(c => c.end).map((c, i, a) => ({
    ...c,
    dur: c.end - c.start,
    gap: i > 0 ? c.start - a[i - 1].start : null
  }));
  const recent = done.filter(c => c.start >= now - HOUR);
  const avgDur = mean(recent.map(c => c.dur));
  const avgGap = mean(recent.map(c => c.gap).filter(g => g != null));

  // Longest run, counting back from the most recent, that holds the pattern.
  let holding = 0;
  for (let i = done.length - 2; i >= 0; i--) {
    const run = done.slice(i);
    const gaps = run.slice(1).map(c => c.gap);
    if (!gaps.length) continue;
    if (mean(gaps) <= targetMin * 60000 && mean(run.map(c => c.dur)) >= 60000) {
      holding = now - run[0].start;
    } else break;
  }
  return {
    done,
    recent,
    avgDur,
    avgGap,
    holding
  };
}

/* ---------- wave strip ---------- */
function Wave({
  items,
  now
}) {
  const W = 300,
    H = 44,
    base = H - 6;
  const from = now - HOUR;
  const bumps = items.filter(c => c.end && c.end >= from).map(c => {
    const x1 = (Math.max(c.start, from) - from) / HOUR * W;
    const x2 = (c.end - from) / HOUR * W;
    const w = Math.max(x2 - x1, 3.5);
    const h = Math.min(6 + (c.end - c.start) / 90000 * 30, 34);
    return {
      x: x1,
      w,
      h
    };
  });
  const d = bumps.map(({
    x,
    w,
    h
  }) => `M ${x.toFixed(1)} ${base} C ${(x + w * 0.3).toFixed(1)} ${(base - h).toFixed(1)}, ${(x + w * 0.7).toFixed(1)} ${(base - h).toFixed(1)}, ${(x + w).toFixed(1)} ${base}`).join(" ");
  return /*#__PURE__*/React.createElement("svg", {
    className: "wave",
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "0",
    y1: base,
    x2: W,
    y2: base,
    className: "wave-base"
  }), bumps.length > 0 && /*#__PURE__*/React.createElement("path", {
    d: d,
    className: "wave-line"
  }));
}

/* ---------- app ---------- */
function ContractionTimer() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [activeStart, setActiveStart] = useState(null);
  const [targetMin, setTargetMin] = useState(5);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState(null);
  const [undo, setUndo] = useState(null);
  const [armReset, setArmReset] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [awake, setAwake] = useState(false);
  const lockRef = useRef(null);
  const toastRef = useRef(null);

  /* load */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(KEY, false);
        if (r?.value) {
          const d = JSON.parse(r.value);
          setItems(Array.isArray(d.items) ? d.items : []);
          setActiveStart(d.activeStart ?? null);
          setTargetMin(d.targetMin === 3 ? 3 : 5);
        }
      } catch {
        /* first run, or storage unavailable — carry on in memory */
      }
      setReady(true);
    })();
  }, []);

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const save = useCallback(async next => {
    try {
      await window.storage.set(KEY, JSON.stringify(next), false);
    } catch {
      /* keep going with in-memory state */
    }
  }, []);
  const commit = useCallback(patch => {
    const next = {
      items: patch.items ?? items,
      activeStart: patch.activeStart !== undefined ? patch.activeStart : activeStart,
      targetMin: patch.targetMin ?? targetMin
    };
    if (patch.items) setItems(next.items);
    if (patch.activeStart !== undefined) setActiveStart(next.activeStart);
    if (patch.targetMin) setTargetMin(next.targetMin);
    save(next);
  }, [items, activeStart, targetMin, save]);
  const say = useCallback((msg, undoFn) => {
    clearTimeout(toastRef.current);
    setToast(msg);
    setUndo(() => undoFn ?? null);
    toastRef.current = setTimeout(() => {
      setToast(null);
      setUndo(null);
    }, 7000);
  }, []);

  /* actions */
  function toggle() {
    if (activeStart == null) {
      commit({
        activeStart: Date.now()
      });
      return;
    }
    const rec = {
      id: String(activeStart),
      start: activeStart,
      end: Date.now(),
      level: 0
    };
    if (rec.end - rec.start < 5000) {
      commit({
        activeStart: null
      });
      say("Under 5 seconds — not recorded.");
      return;
    }
    commit({
      items: [...items, rec],
      activeStart: null
    });
  }
  function cancelActive() {
    commit({
      activeStart: null
    });
    say("Timer cancelled.");
  }
  function remove(id) {
    const gone = items.find(c => c.id === id);
    const next = items.filter(c => c.id !== id);
    commit({
      items: next
    });
    say(`Deleted ${fmtTime(gone.start)}.`, () => commit({
      items: [...next, gone].sort((a, b) => a.start - b.start)
    }));
  }
  function setLevel(id, level) {
    commit({
      items: items.map(c => c.id === id ? {
        ...c,
        level: c.level === level ? 0 : level
      } : c)
    });
  }
  function reset() {
    if (!armReset) {
      setArmReset(true);
      setTimeout(() => setArmReset(false), 4000);
      return;
    }
    setArmReset(false);
    commit({
      items: [],
      activeStart: null
    });
    say("All contractions erased.");
  }
  async function toggleWake() {
    try {
      if (!awake) {
        lockRef.current = await navigator.wakeLock.request("screen");
        setAwake(true);
      } else {
        await lockRef.current?.release();
        lockRef.current = null;
        setAwake(false);
      }
    } catch {
      setAwake(false);
      say("This browser won't keep the screen on.");
    }
  }
  useEffect(() => {
    const onVis = async () => {
      if (awake && document.visibilityState === "visible") {
        try {
          lockRef.current = await navigator.wakeLock.request("screen");
        } catch {
          /* ignore */
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [awake]);
  const {
    done,
    recent,
    avgDur,
    avgGap,
    holding
  } = useMemo(() => analyse(items, now, targetMin), [items, now, targetMin]);
  function summary() {
    const head = `Contractions — ${new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })}`;
    const stat = recent.length ? `Last hour: ${recent.length} contraction${recent.length === 1 ? "" : "s"}, averaging ${fmtDur(avgDur)} long, ${avgGap ? fmtDur(avgGap) : "—"} apart.` : "No contractions in the last hour.";
    const rows = [...done].reverse().slice(0, 40).map(c => `${fmtTime(c.start)}  ${fmtDur(c.dur).padEnd(8)}${c.gap ? `${fmtDur(c.gap)} apart` : ""}${c.level ? `  (${["", "mild", "moderate", "strong"][c.level]})` : ""}`);
    return [head, stat, "", ...rows].join("\n");
  }
  async function copySummary() {
    const text = summary();
    try {
      await navigator.clipboard.writeText(text);
      say("Summary copied.");
    } catch {
      setSheet(text);
    }
  }
  const elapsed = activeStart ? now - activeStart : 0;
  const sinceLast = done.length ? now - done[done.length - 1].end : null;
  const fill = activeStart ? Math.min(elapsed / 75000, 1) : 0;
  const bars = [{
    label: "apart",
    value: avgGap,
    target: targetMin * 60000,
    invert: true,
    show: fmtDur(avgGap)
  }, {
    label: "length",
    value: avgDur,
    target: 60000,
    invert: false,
    show: fmtDur(avgDur)
  }, {
    label: "holding",
    value: holding,
    target: HOUR,
    invert: false,
    show: holding ? fmtDur(holding) : "—"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement("style", null, `
        .app{
          --ink:#12111a; --slate:#1c1b26; --edge:#2b2937; --bone:#edeaf2; --mist:#8f8a9e;
          --tide:#6fa8a0; --ember:#e08a6b; --honey:#d5ad5f;
          background:var(--ink); color:var(--bone); min-height:100%;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
          padding:18px 16px 28px; box-sizing:border-box;
          font-variant-numeric:tabular-nums; -webkit-tap-highlight-color:transparent;
          max-width:520px; margin:0 auto;
        }
        .app *{box-sizing:border-box}
        .eyebrow{font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--mist); font-weight:600}
        .top{display:flex; align-items:center; justify-content:space-between; margin-bottom:22px}
        .lamp{background:none; border:1px solid var(--edge); color:var(--mist); border-radius:999px;
          padding:6px 12px; font-size:11px; letter-spacing:.06em}
        .lamp[data-on="true"]{color:var(--honey); border-color:var(--honey)}

        .dial{display:flex; flex-direction:column; align-items:center; gap:14px; margin-bottom:26px}
        .btn{position:relative; width:220px; height:220px; border-radius:50%; border:1px solid var(--edge);
          background:var(--slate); color:var(--bone); overflow:hidden; display:grid; place-items:center;
          cursor:pointer; padding:0}
        .btn:focus-visible{outline:2px solid var(--tide); outline-offset:4px}
        .btn[data-on="true"]{border-color:var(--ember); animation:breathe 5s ease-in-out infinite}
        @keyframes breathe{0%,100%{transform:scale(1)} 50%{transform:scale(1.025)}}
        @media (prefers-reduced-motion:reduce){.btn[data-on="true"]{animation:none}}
        .tide{position:absolute; left:0; right:0; bottom:0; background:var(--ember); opacity:.22;
          transition:height .5s linear}
        .btn-inner{position:relative; text-align:center; padding:0 20px}
        .big{font-size:44px; font-weight:300; letter-spacing:-.02em; line-height:1.1}
        .cue{font-size:13px; color:var(--mist); margin-top:6px; line-height:1.4}
        .sub{font-size:12px; color:var(--mist); min-height:16px}
        .ghost{background:none; border:none; color:var(--mist); font-size:12px; text-decoration:underline;
          padding:6px; cursor:pointer}

        .card{background:var(--slate); border:1px solid var(--edge); border-radius:14px;
          padding:14px 15px; margin-bottom:12px}
        .trio{display:flex; justify-content:space-between; margin:10px 0 4px}
        .trio div{text-align:center; flex:1}
        .num{font-size:22px; font-weight:400}
        .cap{font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--mist); margin-top:3px}
        .wave{width:100%; height:44px; display:block; margin-top:6px}
        .wave-base{stroke:var(--edge); stroke-width:1}
        .wave-line{fill:none; stroke:var(--tide); stroke-width:1.6; stroke-linecap:round}

        .head{display:flex; align-items:baseline; justify-content:space-between; gap:10px}
        .seg{display:flex; border:1px solid var(--edge); border-radius:999px; overflow:hidden}
        .seg button{background:none; border:none; color:var(--mist); font-size:10px; letter-spacing:.1em;
          padding:5px 10px; cursor:pointer}
        .seg button[data-sel="true"]{background:var(--edge); color:var(--bone)}

        .bar{display:grid; grid-template-columns:58px 1fr 62px; align-items:center; gap:10px; margin-top:11px}
        .bar-label{font-size:11px; color:var(--mist); letter-spacing:.06em}
        .track{height:5px; background:var(--edge); border-radius:3px; overflow:hidden}
        .fillbar{height:100%; background:var(--tide); border-radius:3px; transition:width .4s ease}
        .fillbar[data-met="true"]{background:var(--honey)}
        .bar-val{font-size:12px; text-align:right; color:var(--bone)}

        .row{display:grid; grid-template-columns:46px 1fr auto auto; align-items:center; gap:8px;
          padding:10px 0; border-bottom:1px solid var(--edge)}
        .row:last-child{border-bottom:none}
        .row-time{font-size:12px; color:var(--mist)}
        .row-dur{font-size:15px}
        .row-gap{font-size:11px; color:var(--mist); margin-top:2px}
        .dots{display:flex; gap:5px}
        .dot{width:22px; height:22px; border-radius:50%; border:none; background:none; cursor:pointer;
          display:grid; place-items:center}
        .dot i{width:8px; height:8px; border-radius:50%; border:1px solid var(--mist); display:block}
        .dot[data-on="true"] i{background:var(--ember); border-color:var(--ember)}
        .kill{background:none; border:none; color:var(--mist); font-size:17px; width:30px; height:30px; cursor:pointer}

        .empty{color:var(--mist); font-size:13px; line-height:1.6; padding:6px 0}
        .actions{display:flex; gap:8px; margin-top:14px}
        .act{flex:1; background:none; border:1px solid var(--edge); color:var(--bone); border-radius:10px;
          padding:11px; font-size:13px; cursor:pointer}
        .act[data-warn="true"]{color:var(--ember); border-color:var(--ember)}
        .note{font-size:11px; line-height:1.65; color:var(--mist); margin-top:18px; padding-top:14px;
          border-top:1px solid var(--edge)}
        .note b{color:var(--bone); font-weight:600}

        .toast{position:sticky; bottom:8px; margin-top:14px; background:var(--edge); border-radius:10px;
          padding:11px 13px; font-size:12px; display:flex; justify-content:space-between; align-items:center; gap:12px}
        .toast button{background:none; border:none; color:var(--tide); font-size:12px; font-weight:600; cursor:pointer}
        .sheet{background:var(--slate); border:1px solid var(--edge); border-radius:12px; padding:12px; margin-top:12px}
        .sheet textarea{width:100%; height:170px; background:var(--ink); color:var(--bone); border:1px solid var(--edge);
          border-radius:8px; padding:10px; font-family:ui-monospace,Menlo,monospace; font-size:11px; resize:none}
        .home{display:inline-block; margin-top:18px; color:var(--mist); font-size:12px; text-decoration:none}
        .home:hover{color:var(--bone)}
      `), /*#__PURE__*/React.createElement("div", {
    className: "top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Contractions"), /*#__PURE__*/React.createElement("button", {
    className: "lamp",
    "data-on": awake,
    onClick: toggleWake
  }, awake ? "Screen on" : "Keep screen on")), /*#__PURE__*/React.createElement("div", {
    className: "dial"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    "data-on": activeStart != null,
    onClick: toggle,
    disabled: !ready
  }, /*#__PURE__*/React.createElement("span", {
    className: "tide",
    style: {
      height: `${fill * 100}%`
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "btn-inner"
  }, activeStart != null ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "big"
  }, fmtClock(elapsed)), /*#__PURE__*/React.createElement("span", {
    className: "cue"
  }, "Tap when it eases off")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "big",
    style: {
      fontSize: 26
    }
  }, ready ? "Start" : "…"), /*#__PURE__*/React.createElement("span", {
    className: "cue"
  }, "Tap as the contraction begins")))), /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, activeStart != null ? elapsed > 300000 ? "Still running — tap the circle to stop it." : "" : sinceLast != null ? `Last one ended ${fmtDur(sinceLast)} ago` : "Nothing recorded yet"), activeStart != null && /*#__PURE__*/React.createElement("button", {
    className: "ghost",
    onClick: cancelActive
  }, "Cancel this timer")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Last hour"), /*#__PURE__*/React.createElement("div", {
    className: "trio"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "num"
  }, recent.length), /*#__PURE__*/React.createElement("div", {
    className: "cap"
  }, "count")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "num"
  }, fmtDur(avgDur)), /*#__PURE__*/React.createElement("div", {
    className: "cap"
  }, "length")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "num"
  }, fmtDur(avgGap)), /*#__PURE__*/React.createElement("div", {
    className: "cap"
  }, "apart"))), /*#__PURE__*/React.createElement(Wave, {
    items: items,
    now: now
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Pattern"), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, [5, 3].map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    "data-sel": targetMin === m,
    onClick: () => commit({
      targetMin: m
    })
  }, m, "\xB71\xB71")))), bars.map(b => {
    const pct = b.value == null ? 0 : b.invert ? Math.min(b.target / b.value, 1) * 100 : Math.min(b.value / b.target, 1) * 100;
    return /*#__PURE__*/React.createElement("div", {
      className: "bar",
      key: b.label
    }, /*#__PURE__*/React.createElement("span", {
      className: "bar-label"
    }, b.label), /*#__PURE__*/React.createElement("span", {
      className: "track"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fillbar",
      "data-met": pct >= 100,
      style: {
        width: `${pct}%`
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "bar-val"
    }, b.show));
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "History"), done.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "empty"
  }, "Each contraction you time will appear here, with how long it lasted and how far apart they're coming.") : /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, [...done].reverse().map(c => /*#__PURE__*/React.createElement("div", {
    className: "row",
    key: c.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "row-time"
  }, fmtTime(c.start)), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("div", {
    className: "row-dur"
  }, fmtDur(c.dur)), /*#__PURE__*/React.createElement("div", {
    className: "row-gap"
  }, c.gap ? `${fmtDur(c.gap)} apart` : "first one")), /*#__PURE__*/React.createElement("span", {
    className: "dots"
  }, [1, 2, 3].map(l => /*#__PURE__*/React.createElement("button", {
    key: l,
    className: "dot",
    "data-on": c.level >= l,
    onClick: () => setLevel(c.id, l),
    "aria-label": ["", "mild", "moderate", "strong"][l]
  }, /*#__PURE__*/React.createElement("i", null)))), /*#__PURE__*/React.createElement("button", {
    className: "kill",
    onClick: () => remove(c.id),
    "aria-label": "Delete"
  }, "\xD7"))))), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "act",
    onClick: copySummary,
    disabled: !done.length
  }, "Copy summary"), /*#__PURE__*/React.createElement("button", {
    className: "act",
    "data-warn": armReset,
    onClick: reset,
    disabled: !done.length
  }, armReset ? "Tap again to erase" : "Erase all")), sheet && /*#__PURE__*/React.createElement("div", {
    className: "sheet"
  }, /*#__PURE__*/React.createElement("p", {
    className: "empty",
    style: {
      marginTop: 0
    }
  }, "Copying is blocked here \u2014 select the text below instead."), /*#__PURE__*/React.createElement("textarea", {
    readOnly: true,
    value: sheet,
    onFocus: e => e.target.select()
  }), /*#__PURE__*/React.createElement("button", {
    className: "act",
    style: {
      marginTop: 8
    },
    onClick: () => setSheet(null)
  }, "Close")), /*#__PURE__*/React.createElement("p", {
    className: "note"
  }, "This is a timer, not medical advice. Follow whatever your midwife or hospital has told you, and", " ", /*#__PURE__*/React.createElement("b", null, "call them straight away"), " \u2014 without waiting for a pattern \u2014 if the waters break, there's any bleeding, the baby's movements change, or something just feels wrong."), /*#__PURE__*/React.createElement("a", {
    className: "home",
    href: "../../"
  }, "\u2190 Back to home"), toast && /*#__PURE__*/React.createElement("div", {
    className: "toast"
  }, /*#__PURE__*/React.createElement("span", null, toast), undo && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      undo();
      setToast(null);
      setUndo(null);
    }
  }, "Undo")));
}
const boot = document.getElementById("boot");
if (boot) boot.remove();
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(ContractionTimer, null));