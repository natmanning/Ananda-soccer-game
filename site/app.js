(() => {
  'use strict';

  const { QUESTIONS, TRUE_FALSE, STICKERS, DRILLS, TOPICS } = window;

  // ───────────── Helpers ─────────────
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (arr, rng = Math.random) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const seeded = (str) => {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  };
  const ord = (n) => n + (['st', 'nd', 'rd'][((n + 90) % 100 - 10) % 10 - 1] || 'th');
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const vibrate = (p) => { try { navigator.vibrate?.(p); } catch { /* not supported */ } };

  // ───────────── Icons ─────────────
  const starSVG = (on) => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z" fill="${on ? 'var(--kit)' : 'rgba(255,255,255,0.15)'}"/></svg>`;
  const stars = (n, max = 3) => `<span class="starline" aria-label="${n} of ${max} stars">${Array.from({ length: max }, (_, i) => starSVG(i < n)).join('')}</span>`;
  const whistleSVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a5 5 0 1 0 9.6 2H21V8H9.5A5 5 0 0 0 3 10zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="#2a2100"/></svg>`;
  const cupSVG = (color = 'var(--gold)') => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 6h20v8a10 10 0 0 1-20 0z" fill="${color}"/><path d="M14 9H7a7 7 0 0 0 8 9M34 9h7a7 7 0 0 1-8 9" fill="none" stroke="${color}" stroke-width="3"/><rect x="21" y="23" width="6" height="10" fill="${color}"/><rect x="14" y="34" width="20" height="6" rx="2" fill="${color}"/></svg>`;
  const ballSVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#fff" stroke="#111" stroke-width="2"/><path d="M20 12l7 5-3 8h-8l-3-8z" fill="#111"/><path d="M20 12V3M27 17l8-3M24 25l5 7M16 25l-5 7M13 17l-8-3" stroke="#111" stroke-width="2"/></svg>`;
  const crest = (name) => `<svg viewBox="0 0 34 38" aria-hidden="true"><path d="M17 1l15 5v12c0 9-7 15-15 19C9 33 2 27 2 18V6z" fill="var(--kit)" stroke="#fff" stroke-width="2"/><path d="M2 14h30" stroke="#0a1f16" stroke-width="3"/><text x="17" y="30" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="12" fill="#0a1f16">${esc(initials(name).slice(0, 1))}FC</text></svg>`;
  const tileArt = {
    daily: `<svg class="art" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="12" width="48" height="44" rx="8" fill="var(--sky)" opacity=".35"/><rect x="8" y="12" width="48" height="12" rx="6" fill="var(--sky)"/><text x="32" y="48" text-anchor="middle" font-family="Lilita One" font-size="22" fill="#fff">x2</text></svg>`,
    pens: `<svg class="art" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 46V14h52v32" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/><circle cx="44" cy="40" r="10" fill="#fff"/><path d="M44 34l5 4-2 6h-6l-2-6z" fill="#111"/></svg>`,
    live: `<svg class="art" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="8" fill="var(--loss)"/><path d="M18 18a20 20 0 0 0 0 28M46 18a20 20 0 0 1 0 28M10 10a31 31 0 0 0 0 44M54 10a31 31 0 0 1 0 44" fill="none" stroke="var(--loss)" stroke-width="4" stroke-linecap="round" opacity=".7"/></svg>`,
    training: `<svg class="art" viewBox="0 0 64 64" aria-hidden="true"><path d="M14 50l8-30h4l8 30z" fill="var(--flame)"/><rect x="10" y="48" width="28" height="6" rx="2" fill="var(--flame)"/><path d="M17 38h14M19 30h10" stroke="#fff" stroke-width="3"/></svg>`,
    album: `<svg class="art" viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="8" width="30" height="40" rx="4" fill="var(--silver)" transform="rotate(-10 25 28)"/><rect x="24" y="14" width="30" height="40" rx="4" fill="var(--gold)"/><circle cx="39" cy="30" r="8" fill="#fff"/></svg>`,
    trophies: `<svg class="art" viewBox="0 0 48 48" aria-hidden="true"><path d="M14 6h20v8a10 10 0 0 1-20 0z" fill="var(--gold)"/><path d="M14 9H7a7 7 0 0 0 8 9M34 9h7a7 7 0 0 1-8 9" fill="none" stroke="var(--gold)" stroke-width="3"/><rect x="21" y="23" width="6" height="10" fill="var(--gold)"/><rect x="14" y="34" width="20" height="6" rx="2" fill="var(--gold)"/></svg>`,
  };

  // ───────────── Saved progress ─────────────
  const KEY = 'ananda-fc-v1';
  const freshState = () => ({
    name: 'Ananda', coins: 0, earned: 0, best: {}, seen: {}, stickers: {}, trophies: {},
    stats: { correct: 0, answered: 0, bestStreak: 0, live: 0, drills: 0, matches: 0, perfect: 0, pens5: 0 },
    days: { last: null, streak: 0 }, daily: null, drills: { date: null, done: [] }, sound: true,
  });
  const load = () => {
    const base = freshState();
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved) return { ...base, ...saved, stats: { ...base.stats, ...saved.stats }, days: { ...base.days, ...saved.days }, drills: { ...base.drills, ...saved.drills } };
    } catch { /* storage blocked: play without saving */ }
    return base;
  };
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } };

  const addCoins = (n) => { S.coins += n; S.earned += n; };
  const touchDay = () => {
    const t = dayKey();
    if (S.days.last === t) return;
    S.days.streak = S.days.last === yesterday() ? S.days.streak + 1 : 1;
    S.days.last = t;
  };
  const streakAlive = () => (S.days.last === dayKey() || S.days.last === yesterday() ? S.days.streak : 0);

  // ───────────── Career levels ─────────────
  const LEVELS = [
    { name: 'Youth Academy', blurb: 'Easy questions to start your career.', d: [1], live: 0, opp: ['Ajax U12', 'Sporting U12', 'La Masia U12'] },
    { name: 'Reserves', blurb: 'A bit harder. Show the coach you\'re ready.', d: [1, 2], live: 0, opp: ['Dortmund II', 'Real Madrid Castilla', 'Benfica B'] },
    { name: 'First Team', blurb: 'Big-league questions, plus live stats from this season.', d: [2], live: 1, opp: ['Leverkusen', 'Napoli', 'Aston Villa'] },
    { name: 'Captain', blurb: 'Lead the team. Tactics and records.', d: [2, 3], live: 2, opp: ['Inter Milan', 'Atlético Madrid', 'Liverpool'] },
    { name: 'International', blurb: 'Play for your country against the best.', d: [3], live: 2, opp: ['Brazil', 'France', 'Argentina'] },
    { name: 'Ballon d\'Or', blurb: 'The hardest questions. Become the best in the world.', d: [2, 3], live: 3, opp: ['Real Madrid', 'Bayern Munich', 'Manchester City'] },
  ];
  const NEED = 5; // stars needed in a level to unlock the next
  const levelStars = (i) => [0, 1, 2].reduce((s, m) => s + (S.best[`${i}-${m}`] || 0), 0);
  const unlocked = (i) => i === 0 || levelStars(i - 1) >= NEED;
  const currentLevel = () => { let c = 0; LEVELS.forEach((_, i) => { if (unlocked(i)) c = i; }); return c; };
  const totalStars = () => LEVELS.reduce((s, _, i) => s + levelStars(i), 0);

  // ───────────── Trophies ─────────────
  const owned = () => Object.keys(S.stickers).length;
  const TROPHIES = [
    { id: 'first', name: 'First Goal', how: 'Get your first answer right', test: () => S.stats.correct >= 1 },
    { id: 'hat', name: 'Hat-trick Hero', how: '3 right answers in a row', test: () => S.stats.bestStreak >= 3 },
    { id: 'six', name: 'Unstoppable', how: '6 right answers in a row', test: () => S.stats.bestStreak >= 6 },
    { id: 'perfect', name: 'Perfect 90', how: 'Win a match 8–0', test: () => S.stats.perfect >= 1 },
    { id: 'pens', name: 'Penalty King', how: 'Score 5 out of 5 in a shootout', test: () => S.stats.pens5 >= 1 },
    { id: 'live', name: 'Live Wire', how: 'Get 10 live-stats questions right', test: () => S.stats.live >= 10 },
    { id: 'streak3', name: 'On Fire', how: 'Play 3 days in a row', test: () => S.days.streak >= 3 },
    { id: 'streak7', name: 'Week of Football', how: 'Play 7 days in a row', test: () => S.days.streak >= 7 },
    { id: 'drills10', name: 'Training Pro', how: 'Finish 10 training drills', test: () => S.stats.drills >= 10 },
    { id: 'stick10', name: 'Collector', how: 'Collect 10 different stickers', test: () => owned() >= 10 },
    { id: 'stick25', name: 'Super Collector', how: 'Collect 25 different stickers', test: () => owned() >= 25 },
    { id: 'stickAll', name: 'Full Album', how: 'Collect every sticker', test: () => owned() >= STICKERS.length },
    { id: 'century', name: 'Century', how: 'Get 100 answers right', test: () => S.stats.correct >= 100 },
    { id: 'rich', name: 'Treasure Chest', how: 'Earn 1,000 coins', test: () => S.earned >= 1000 },
    ...LEVELS.slice(1).map((l, i) => ({ id: `lvl${i + 1}`, name: `Promoted: ${l.name}`, how: `Unlock ${l.name}`, test: () => unlocked(i + 1) })),
    { id: 'champ', name: 'World\'s Best', how: 'Get 3 stars in every Ballon d\'Or match', test: () => levelStars(LEVELS.length - 1) === 9 },
  ];
  const checkTrophies = () => {
    const got = [];
    for (const t of TROPHIES) {
      if (!S.trophies[t.id] && t.test()) { S.trophies[t.id] = dayKey(); got.push(t); addCoins(25); }
    }
    save();
    got.forEach((t, i) => setTimeout(() => { toast(`Trophy: ${t.name}`, '+25 coins'); sfx('trophy'); confetti(); }, 600 + i * 2200));
    return got;
  };

  // ───────────── Live stats → questions ─────────────
  let LIVE = null;
  let LIVEQ = [];
  const numWrong = (v) => shuffle([1, 2, 3, 4, 5, 6].flatMap((d) => [v + d, v - d]).filter((n) => n >= 0)).slice(0, 3);
  const others = (rows, not, n = 3) => shuffle(rows.filter((r) => r.team !== not.team)).slice(0, n).map((r) => r.team);

  function buildLive(d) {
    const out = [];
    const when = fmtDate(d.updated);
    const add = (text, right, wrong, fact) => {
      const w = [...new Set(wrong.map(String))].filter((x) => x !== String(right)).slice(0, 3);
      if (w.length) out.push({ d: 2, t: 'live', live: true, text, right: String(right), wrong: w, fact: `${fact} (Stats from ${when}.)` });
    };
    for (const lg of d.leagues || []) {
      const T = lg.table || [];
      const n = lg.name;
      if (T.length >= 8 && T[0].played > 0) {
        const top = T[0];
        add(`Who is top of the ${n} right now?`, top.team, others(T.slice(1, 7), top), `${top.team} lead with ${top.pts} points from ${top.played} games.`);
        add(`How many points do ${top.team} have in the ${n}?`, top.pts, numWrong(top.pts), `${top.team} have won ${top.won}, drawn ${top.drawn} and lost ${top.lost}.`);
        if (lg.id !== 'uefa.champions') {
          const last = T[T.length - 1];
          add(`Which team is bottom of the ${n}?`, last.team, others(T.slice(-8, -1), last), `${last.team} have ${last.pts} points. Can they climb out?`);
        }
        const att = [...T].sort((a, b) => b.gf - a.gf);
        if (att[0].gf > att[1].gf) add(`Which ${n} team has scored the most goals?`, att[0].team, others(att.slice(1, 8), att[0]), `${att[0].team} have scored ${att[0].gf} goals in ${att[0].played} games.`);
        const def = [...T].sort((a, b) => a.ga - b.ga);
        if (def[0].ga < def[1].ga) add(`Which ${n} team has let in the fewest goals?`, def[0].team, others(def.slice(1, 8), def[0]), `${def[0].team} have only let in ${def[0].ga}. Great defending!`);
        const i = rnd(Math.min(5, T.length - 4));
        const j = i + 3 + rnd(Math.min(6, T.length - i - 3));
        add(`Who is higher in the ${n} table?`, T[i].team, [T[j].team], `${T[i].team} are ${ord(T[i].pos)} and ${T[j].team} are ${ord(T[j].pos)}.`);
      }
      const sc = lg.scorers || [];
      if (sc.length >= 4 && sc[0].value > sc[1].value) {
        add(`Who is the top scorer in the ${n}?`, sc[0].name, sc.slice(1, 6).map((s) => s.name), `${sc[0].name}${sc[0].team ? ` (${sc[0].team})` : ''} has ${sc[0].value} goals.`);
        add(`How many ${n} goals has ${sc[0].name} scored this season?`, sc[0].value, numWrong(sc[0].value), `Next best is ${sc[1].name} with ${sc[1].value}.`);
      }
      const as = lg.assists || [];
      if (as.length >= 4 && as[0].value > as[1].value) {
        add(`Who has the most assists in the ${n}?`, as[0].name, as.slice(1, 6).map((s) => s.name), `${as[0].name} has set up ${as[0].value} goals. Great teammates pass!`);
      }
    }
    return out;
  }

  async function loadLive() {
    try {
      const res = await fetch('data/live.json', { cache: 'no-cache' });
      if (!res.ok) return;
      const d = await res.json();
      if (!d?.leagues?.length) return;
      LIVE = d;
      LIVEQ = buildLive(d);
      if (!$('#home').hidden) renderHome();
      if (!$('#live').hidden) renderLive();
    } catch { /* offline or no data yet */ }
  }

  // ───────────── Sound & effects ─────────────
  let AC;
  const audio = () => {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  };
  const tone = (freq, t0, dur, type = 'sine', vol = 0.15) => {
    const a = audio();
    if (!a) return;
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + t0;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  };
  function sfx(kind) {
    if (!S.sound) return;
    if (kind === 'whistle') { tone(2500, 0, 0.15, 'square', 0.04); tone(2500, 0.22, 0.5, 'square', 0.04); }
    if (kind === 'goal') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle', 0.2));
    if (kind === 'miss') { tone(240, 0, 0.25, 'sawtooth', 0.07); tone(170, 0.2, 0.35, 'sawtooth', 0.07); }
    if (kind === 'coin') { tone(988, 0, 0.08, 'square', 0.05); tone(1319, 0.08, 0.25, 'square', 0.05); }
    if (kind === 'trophy') [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.12, 0.45, 'triangle', 0.16));
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function confetti() {
    if (reduceMotion) return;
    const cv = $('#confetti');
    const ctx = cv.getContext('2d');
    cv.width = innerWidth * devicePixelRatio;
    cv.height = innerHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    const colors = ['#ffd23f', '#3ddc84', '#6cc6ff', '#ff6b5b', '#ffffff'];
    const bits = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4, r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3, c: colors[rnd(colors.length)], w: 6 + Math.random() * 6,
    }));
    const t0 = performance.now();
    const frame = (t) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const b of bits) {
        b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -3, b.w, 6); ctx.restore();
      }
      if (t - t0 < 2600) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    requestAnimationFrame(frame);
  }

  let toastTimer;
  function toast(title, sub = '') {
    const el = $('#toast');
    el.innerHTML = `${cupSVG()}<div>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
    el.hidden = false;
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  // ───────────── Navigation ─────────────
  let screen = 'home';
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== id; });
    screen = id;
    $('#back').hidden = id === 'home';
    window.scrollTo(0, 0);
    renderBar();
  }
  const goHome = () => { renderHome(); show('home'); };

  function renderBar() {
    $('#club').innerHTML = `${crest(S.name)}<span class="name">${esc(S.name)} FC</span>`;
    $('#chip-coins').textContent = S.coins;
    $('#chip-stars').textContent = totalStars();
    $('#chip-days').textContent = streakAlive();
    $('#sound').innerHTML = S.sound
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    $('#sound').setAttribute('aria-label', S.sound ? 'Sound on' : 'Sound off');
  }

  // ───────────── Home ─────────────
  function renderHome() {
    const cur = currentLevel();
    const next = LEVELS[cur + 1];
    const have = levelStars(cur);
    const tips = QUESTIONS.filter((x) => x.tip);
    const tip = tips[Math.floor(seeded(dayKey())() * tips.length)].tip;
    const dailyDone = S.daily === dayKey();
    const drillsLeft = 3 - (S.drills.date === dayKey() ? S.drills.done.length : 0);
    const updated = LIVE ? `Updated ${fmtDate(LIVE.updated)}` : 'Tables, top scorers, headlines';

    $('#home').innerHTML = `
      <div class="panel hero">
        <span class="eyebrow">${esc(S.name)}'s football career</span>
        <div class="rank">${esc(LEVELS[cur].name)}</div>
        ${next ? `<div class="bar" aria-hidden="true"><i style="width:${Math.min(100, (have / NEED) * 100)}%"></i></div>
        <p class="small muted">${have >= NEED ? `Ready for ${esc(next.name)}!` : `${NEED - have} more ${NEED - have === 1 ? 'star' : 'stars'} to get promoted to <b>${esc(next.name)}</b>`}</p>`
        : `<p class="small muted">You made it to the top. Can you get 3 stars in every match?</p>`}
        <button class="btn wide" data-go="level" data-level="${cur}" type="button">Play next match</button>
      </div>

      <div class="tiles">
        <button class="tile ${dailyDone ? '' : 'hot'}" data-go="daily" type="button">${tileArt.daily}
          ${dailyDone ? '<span class="badge done">DONE</span>' : '<span class="badge">NEW</span>'}
          <h3>Daily Challenge</h3><p>5 questions, double coins</p></button>
        <button class="tile" data-go="shootout" type="button">${tileArt.pens}<h3>Penalty Shootout</h3><p>Real or fake? 5 kicks</p></button>
        <button class="tile" data-go="live" type="button">${tileArt.live}<span class="badge">LIVE</span><h3>This Season</h3><p>${esc(updated)}</p></button>
        <button class="tile" data-go="training" type="button">${tileArt.training}${drillsLeft > 0 ? `<span class="badge">${drillsLeft}</span>` : '<span class="badge done">DONE</span>'}<h3>Training Ground</h3><p>Real drills, real coins</p></button>
        <button class="tile" data-go="album" type="button">${tileArt.album}<h3>Sticker Album</h3><p>${owned()} / ${STICKERS.length} collected</p></button>
        <button class="tile" data-go="trophies" type="button">${tileArt.trophies}<h3>Trophy Cabinet</h3><p>${Object.keys(S.trophies).length} / ${TROPHIES.length} won</p></button>
      </div>

      <div class="panel tip"><span class="whistle">${whistleSVG}</span><div><span class="eyebrow">Coach's tip of the day</span><p>${esc(tip)}</p></div></div>

      <div class="ladder">
        <span class="eyebrow">Career ladder</span>
        ${LEVELS.map((l, i) => i).reverse().map((i) => {
          const open = unlocked(i);
          return `<button class="rung ${i === cur ? 'current' : ''} ${open ? '' : 'locked'}" data-go="level" data-level="${i}" type="button" ${open ? '' : 'aria-disabled="true"'}>
            <span class="num">${open ? i + 1 : '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>'}</span>
            <span><h3>${esc(LEVELS[i].name)}</h3><span class="small muted">${open ? esc(LEVELS[i].blurb) : `Get ${NEED} stars in ${esc(LEVELS[i - 1].name)} to unlock`}</span></span>
            <span class="stars">${levelStars(i)}/9</span>
          </button>`;
        }).join('')}
      </div>

      <button class="btn ghost" data-go="settings" type="button">Settings</button>`;
  }

  // ───────────── Level ─────────────
  function renderLevel(i) {
    const l = LEVELS[i];
    const next = LEVELS[i + 1];
    $('#level').innerHTML = `
      <div class="panel"><span class="eyebrow">Level ${i + 1} of ${LEVELS.length}</span><h1>${esc(l.name)}</h1><p class="muted">${esc(l.blurb)}</p>
        ${l.live && LIVEQ.length ? `<p class="small" style="margin-top:8px"><span class="tag live">Live</span> Each match has ${l.live} question${l.live > 1 ? 's' : ''} about this season.</p>` : ''}</div>
      <div class="matches">
        ${l.opp.map((opp, m) => `<div class="panel fixture">
            <div><span class="eyebrow">Match ${m + 1}</span><div class="vs">vs ${esc(opp)}</div>${stars(S.best[`${i}-${m}`] || 0)}</div>
            <button class="btn" data-play="${i}-${m}" type="button">${S.best[`${i}-${m}`] ? 'Replay' : 'Play'}</button>
          </div>`).join('')}
      </div>
      <p class="small muted">Win 5–3 or better for 1 star, 6 or 7 goals for 2 stars, 8–0 for 3 stars.
        ${next ? `Get ${NEED} stars here to unlock <b>${esc(next.name)}</b>. You have ${levelStars(i)}.` : ''}</p>`;
  }

  // ───────────── Quiz engine (matches, daily, live) ─────────────
  let M = null;
  const CHEERS = ['GOOOAL!', 'What a strike!', 'Top corner!', 'Back of the net!', 'Brilliant!', 'Into the net!'];
  const MISSES = ['Saved!', 'Off the post!', 'Just wide!', 'Blocked!'];

  function pickLeastSeen(pool, n) {
    return shuffle(pool).sort((a, b) => (S.seen[a.text] || 0) - (S.seen[b.text] || 0)).slice(0, n);
  }

  function startLevelMatch(i, m) {
    const l = LEVELS[i];
    const liveN = Math.min(l.live, LIVEQ.length);
    const qs = shuffle([...pickLeastSeen(QUESTIONS.filter((x) => l.d.includes(x.d)), 8 - liveN), ...pickLeastSeen(LIVEQ, liveN)]);
    startQuiz({ kind: 'level', level: i, match: m, opp: l.opp[m], title: l.name, questions: qs });
  }

  function startDaily() {
    const rng = seeded(`daily-${dayKey()}`);
    const maxD = Math.min(3, currentLevel() + 1);
    const pool = QUESTIONS.filter((x) => x.d <= maxD);
    const qs = shuffle(pool, rng).slice(0, LIVEQ.length ? 4 : 5);
    if (LIVEQ.length) qs.push(LIVEQ[Math.floor(rng() * LIVEQ.length)]);
    startQuiz({ kind: 'daily', opp: 'Daily Challenge', title: 'Daily Challenge', questions: shuffle(qs, rng), mult: 2 });
  }

  function startLiveQuiz() {
    startQuiz({ kind: 'live', opp: 'This Season XI', title: 'This Season', questions: pickLeastSeen(LIVEQ, 8) });
  }

  function startQuiz(opts) {
    M = { ...opts, mult: opts.mult || 1, i: 0, you: 0, them: 0, streak: 0, coins: 0, results: [], missedTips: [] };
    show('match');
    renderQuestion();
    sfx('whistle');
  }

  function scoreboard() {
    const minute = Math.round(((M.i + 1) / M.questions.length) * 90);
    return `<div class="scoreboard" aria-label="Score ${M.you} to ${M.them}">
        <div class="team">${esc(S.name)} FC</div>
        <div class="score">${M.you}–${M.them}<span class="min">${minute}'</span></div>
        <div class="team them">${esc(M.opp)}</div>
      </div>`;
  }
  const dots = (current) => `<div class="dots" aria-hidden="true">${M.questions.map((_, k) => `<i class="${M.results[k] === true ? 'y' : M.results[k] === false ? 'n' : ''} ${k === current ? 'now' : ''}"></i>`).join('')}</div>`;

  function renderQuestion() {
    const q = M.questions[M.i];
    M.options = shuffle([q.right, ...q.wrong]);
    $('#match').innerHTML = `${scoreboard()}${dots(M.i)}
      <div class="panel qcard">
        <span class="tag ${q.live ? 'live' : ''}">${q.live ? 'Live · this season' : esc(TOPICS[q.t] || q.t)}</span>
        <div class="text">${esc(q.text)}</div>
        <div class="options">${M.options.map((o, k) => `<button class="opt" data-opt="${k}" type="button">${esc(o)}</button>`).join('')}</div>
      </div>
      <div id="fb"></div>`;
  }

  function answer(k) {
    const q = M.questions[M.i];
    const picked = M.options[k];
    const ok = picked === q.right;
    document.querySelectorAll('.opt').forEach((b, idx) => {
      b.disabled = true;
      if (M.options[idx] === q.right) b.classList.add('right');
      else if (idx === k) b.classList.add('wrong');
    });

    S.seen[q.text] = (S.seen[q.text] || 0) + 1;
    S.stats.answered++;
    let gained = 0;
    if (ok) {
      M.you++; M.streak++;
      S.stats.correct++;
      if (q.live) S.stats.live++;
      S.stats.bestStreak = Math.max(S.stats.bestStreak, M.streak);
      gained = 10 * M.mult + (M.streak >= 3 ? 5 : 0);
      sfx('goal'); vibrate(40);
    } else {
      M.them++; M.streak = 0;
      if (q.tip) M.missedTips.push(q.tip);
      sfx('miss'); vibrate([30, 40, 30]);
    }
    addCoins(gained);
    M.coins += gained;
    M.results[M.i] = ok;
    save();
    renderBar();

    const last = M.i === M.questions.length - 1;
    $('#match .scoreboard').outerHTML = scoreboard();
    $('#match .dots').outerHTML = dots(-1);
    $('#fb').innerHTML = `<div class="panel feedback ${ok ? 'yes' : 'no'}">
        <div class="shout">${ok ? CHEERS[rnd(CHEERS.length)] : MISSES[rnd(MISSES.length)]}</div>
        ${ok ? `<p class="plus">+${gained} coins${M.streak >= 3 ? ` · ${M.streak} in a row!` : ''}</p>` : `<p>The answer was <b>${esc(q.right)}</b>.</p>`}
        <p>${esc(q.fact)}</p>
        ${q.tip ? `<div class="coach"><span class="whistle">${whistleSVG}</span><p><b>Coach:</b> ${esc(q.tip)}</p></div>` : ''}
        <button class="btn wide" id="next" type="button">${last ? 'Full time' : 'Next question'}</button>
      </div>`;
    $('#next').focus({ preventScroll: true });
    $('#fb').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    if (ok) checkTrophies();
  }

  function nextQuestion() {
    if (M.i < M.questions.length - 1) { M.i++; renderQuestion(); window.scrollTo(0, 0); return; }
    finishQuiz();
  }

  function finishQuiz() {
    const n = M.questions.length;
    const win = M.you > M.them;
    const draw = M.you === M.them;
    let earned = 0;
    let starsWon = 0;
    let improved = false;
    if (M.kind === 'level') {
      starsWon = !win ? 0 : M.you === n ? 3 : M.you >= 6 ? 2 : 1;
      const key = `${M.level}-${M.match}`;
      if (starsWon > (S.best[key] || 0)) { S.best[key] = starsWon; improved = true; }
    }
    if (win) earned += 20;
    if (M.you === n) { S.stats.perfect++; earned += 30; }
    if (M.kind === 'daily') S.daily = dayKey();
    addCoins(earned);
    S.stats.matches++;
    touchDay();
    save();
    checkTrophies();

    const coachLine = M.missedTips[0] || (win ? 'Great game! Now go outside and practise one of today\'s drills.' : 'Every great player loses sometimes. Learn one new fact and try again!');
    const nextMatch = M.kind === 'level' && M.match < 2 ? M.match + 1 : null;
    $('#result').innerHTML = `
      <div class="panel full-time">
        <span class="eyebrow">Full time · ${esc(M.title)}</span>
        <div class="verdict ${win ? 'win' : draw ? '' : 'loss'}">${win ? (M.you === n ? 'PERFECT!' : 'YOU WIN!') : draw ? 'A DRAW' : 'YOU LOST'}</div>
        <div class="big">${M.you}–${M.them}</div>
        <p class="muted">${esc(S.name)} FC vs ${esc(M.opp)}</p>
        ${M.kind === 'level' ? `<div class="bigstars">${[0, 1, 2].map((k) => starSVG(k < starsWon)).join('')}</div>
          ${improved ? '<p class="plus">New best!</p>' : ''}
          ${!win ? '<p class="small muted">Win the match to earn stars.</p>' : ''}` : ''}
        <p class="plus">+${M.coins + earned} coins</p>
      </div>
      <div class="panel tip"><span class="whistle">${whistleSVG}</span><div><span class="eyebrow">Coach says</span><p>${esc(coachLine)}</p></div></div>
      <div class="row">
        ${nextMatch !== null ? `<button class="btn" data-play="${M.level}-${nextMatch}" type="button">Next match</button>` : ''}
        ${M.kind === 'level' ? `<button class="btn ${nextMatch !== null ? 'ghost' : ''}" data-play="${M.level}-${M.match}" type="button">Play again</button>` : ''}
        ${M.kind === 'live' ? '<button class="btn" data-go="livequiz" type="button">Play again</button>' : ''}
        <button class="btn ghost" data-go="home" type="button">Home</button>
      </div>`;
    show('result');
    sfx(win ? 'trophy' : 'whistle');
    if (win) confetti();
  }

  // ───────────── Penalty shootout ─────────────
  let P = null;
  const goalArt = `<svg class="goal" viewBox="0 0 320 120" aria-hidden="true">
      <defs><pattern id="net" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 0L10 10M10 0L0 10" stroke="rgba(255,255,255,0.22)" stroke-width="1"/></pattern></defs>
      <rect x="6" y="6" width="308" height="114" fill="url(#net)"/>
      <path d="M6 120V6h308v114" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/>
    </svg>`;
  const keeperArt = `<svg viewBox="0 0 60 90" aria-hidden="true"><circle cx="30" cy="12" r="10" fill="#f1c27d"/><rect x="14" y="24" width="32" height="34" rx="8" fill="var(--flame)"/><path d="M14 30L2 12M46 30l12-18" stroke="var(--flame)" stroke-width="9" stroke-linecap="round"/><circle cx="2" cy="12" r="6" fill="#fff"/><circle cx="58" cy="12" r="6" fill="#fff"/><path d="M20 58v28M40 58v28" stroke="#111" stroke-width="9" stroke-linecap="round"/></svg>`;

  function startShootout() {
    P = { i: 0, goals: 0, kicks: pickLeastSeenTF(5), res: [] };
    show('shootout');
    renderKick();
    sfx('whistle');
  }
  function pickLeastSeenTF(n) {
    return shuffle(TRUE_FALSE).sort((a, b) => (S.seen[a.s] || 0) - (S.seen[b.s] || 0)).slice(0, n);
  }
  function renderKick(result) {
    const k = P.kicks[P.i];
    const done = P.res.length === P.kicks.length;
    $('#shootout').innerHTML = `
      <div class="panel" style="display:grid;gap:12px">
        <span class="eyebrow">Penalty shootout · Real or fake?</span>
        <div class="goalbox">${goalArt}<div class="keeper" id="keeper">${keeperArt}</div><div class="ball" id="ball">${ballSVG}</div></div>
        <div class="kicks" aria-label="${P.goals} goals">${P.kicks.map((_, j) => `<i class="${P.res[j] === true ? 'y' : P.res[j] === false ? 'n' : ''}"></i>`).join('')}</div>
      </div>
      ${done ? renderShootoutEnd() : `
      <div class="panel qcard">
        <span class="tag">Kick ${P.i + 1} of ${P.kicks.length}</span>
        <div class="text">${esc(k.s)}</div>
        <div class="tf" id="tf">
          <button class="btn real" data-tf="1" type="button">REAL</button>
          <button class="btn fake" data-tf="0" type="button">FAKE</button>
        </div>
        <div id="kickfb"></div>
      </div>`}`;
    if (result) result();
  }
  function kick(said) {
    const k = P.kicks[P.i];
    const ok = (said === '1') === k.a;
    S.seen[k.s] = (S.seen[k.s] || 0) + 1;
    P.res.push(ok);
    if (ok) { P.goals++; addCoins(10); }
    save();
    $('#tf').querySelectorAll('button').forEach((b) => { b.disabled = true; });

    const left = Math.random() < 0.5;
    const ball = $('#ball');
    const keeper = $('#keeper');
    ball.style.setProperty('--tx', `${left ? -300 : 300}%`);
    ball.style.setProperty('--ty', '-330%');
    ball.classList.add('shot');
    keeper.classList.add(ok ? (left ? 'dive-r' : 'dive-l') : (left ? 'dive-l' : 'dive-r'));
    sfx(ok ? 'goal' : 'miss');
    vibrate(ok ? 40 : [30, 40, 30]);
    renderBar();

    $('#kickfb').innerHTML = `<div class="feedback ${ok ? 'yes' : 'no'}" style="display:grid;gap:8px;padding-left:12px">
        <div class="shout">${ok ? 'GOAL!' : 'SAVED!'}</div>
        <p>It's <b>${k.a ? 'REAL' : 'FAKE'}</b>. ${esc(k.fact)}</p>
        <button class="btn wide" id="nextkick" type="button">${P.i === P.kicks.length - 1 ? 'See result' : 'Next kick'}</button>
      </div>`;
    $('#nextkick').focus({ preventScroll: true });
  }
  function nextKick() {
    P.i++;
    if (P.i >= P.kicks.length) {
      if (P.goals === P.kicks.length) S.stats.pens5++;
      touchDay();
      save();
      checkTrophies();
      if (P.goals >= 4) confetti();
    }
    renderKick();
  }
  function renderShootoutEnd() {
    const g = P.goals;
    return `<div class="panel full-time">
        <div class="verdict ${g >= 3 ? 'win' : 'loss'}">${g === 5 ? 'PENALTY KING!' : g >= 3 ? 'YOU WIN THE SHOOTOUT!' : 'UNLUCKY!'}</div>
        <div class="big">${g}/5</div>
        <p class="plus">+${g * 10} coins</p>
        <div class="row" style="width:100%"><button class="btn" data-go="shootout" type="button">Take 5 more</button><button class="btn ghost" data-go="home" type="button">Home</button></div>
      </div>`;
  }

  // ───────────── Live / This season ─────────────
  function renderLive() {
    if (!LIVE) {
      $('#live').innerHTML = `<div class="panel"><span class="eyebrow">This season</span><h1>Live stats are on the way</h1>
        <p class="muted" style="margin-top:8px">League tables, top scorers and headlines appear here after the game's first daily update. Check back soon!</p></div>`;
      return;
    }
    $('#live').innerHTML = `
      <div class="panel"><span class="eyebrow">${esc(LIVE.season || 'This season')} · updated ${esc(fmtDate(LIVE.updated))}</span>
        <h1>This Season</h1>
        <p class="muted">Check the tables, then test yourself.</p>
        <button class="btn wide" style="margin-top:12px" data-go="livequiz" type="button" ${LIVEQ.length >= 8 ? '' : 'disabled'}>Play the Live Quiz</button>
      </div>
      ${LIVE.leagues.map((lg) => `<div class="panel league">
          <h2>${esc(lg.name)}</h2>
          ${lg.table?.length ? `<table class="mini"><tbody>${lg.table.slice(0, 5).map((r) => `<tr><td>${r.pos}</td><td>${esc(r.team)}</td><td class="n muted">${r.played}</td><td>${r.pts}</td></tr>`).join('')}</tbody></table>
          <p class="small muted">Games played, then points.</p>` : ''}
          ${lg.scorers?.length ? `<p class="small"><b>Top scorer:</b> ${esc(lg.scorers[0].name)}${lg.scorers[0].team ? `, ${esc(lg.scorers[0].team)}` : ''} (${lg.scorers[0].value})</p>` : ''}
        </div>`).join('')}
      ${LIVE.news?.length ? `<div class="panel"><h2 style="margin-bottom:10px">Headlines</h2><div class="news">
        ${LIVE.news.map((a) => `<a href="${esc(a.url || '#')}" target="_blank" rel="noopener"><span>${esc(a.league)}</span>${esc(a.headline)}</a>`).join('')}
      </div></div>` : ''}`;
  }

  // ───────────── Training ground ─────────────
  function todaysDrills() {
    return shuffle(DRILLS, seeded(`drills-${dayKey()}`)).slice(0, 3);
  }
  function renderTraining() {
    if (S.drills.date !== dayKey()) S.drills = { date: dayKey(), done: [] };
    const list = todaysDrills();
    $('#training').innerHTML = `
      <div class="panel"><span class="eyebrow">Training ground</span><h1>Today's drills</h1>
        <p class="muted">Go outside with a ball and do these for real. Ask a grown-up to watch! Each one is worth 15 coins.</p></div>
      ${list.map((d) => {
        const done = S.drills.done.includes(d.name);
        return `<div class="panel drill ${done ? 'done' : ''}"><div><h3>${esc(d.name)}</h3><p class="small">${esc(d.how)}</p></div>
          <button class="btn ${done ? 'ghost' : ''}" data-drill="${esc(d.name)}" type="button" ${done ? 'disabled' : ''}>${done ? 'Done' : 'I did it!'}</button></div>`;
      }).join('')}
      <p class="small muted">New drills every day. You've finished ${S.stats.drills} drill${S.stats.drills === 1 ? '' : 's'} so far.</p>`;
  }
  function doDrill(name) {
    if (S.drills.done.includes(name)) return;
    S.drills.done.push(name);
    S.stats.drills++;
    addCoins(15);
    touchDay();
    save();
    sfx('coin');
    toast('Nice work!', '+15 coins');
    renderTraining();
    renderBar();
    checkTrophies();
  }

  // ───────────── Sticker album ─────────────
  const PACK = 50;
  const stickerCard = (s, i, count, cls = '') => `<div class="sticker ${s.r} ${cls}" style="--c1:${s.c[0]};--c2:${s.c[1]}">
      ${count > 1 ? `<span class="x">x${count}</span>` : ''}<span class="ini">${esc(initials(s.name))}</span><span class="nm">${esc(s.name)}</span></div>`;
  function renderAlbum() {
    $('#album').innerHTML = `
      <div class="panel"><span class="eyebrow">Sticker album</span><h1>${owned()} / ${STICKERS.length}</h1>
        <p class="muted">Gold stickers are legends, silver are superstars, bronze are today's stars. Tap one to read about them.</p>
        <button class="btn wide" style="margin-top:12px" id="pack" type="button" ${S.coins >= PACK ? '' : 'disabled'}>Open a pack · ${PACK} coins</button>
        ${S.coins < PACK ? `<p class="small muted" style="margin-top:6px">You need ${PACK - S.coins} more coins. Play a match to earn some!</p>` : ''}
      </div>
      <div class="album">${STICKERS.map((s, i) => S.stickers[i]
        ? `<button class="sticker-btn" data-sticker="${i}" type="button" style="all:unset;cursor:pointer">${stickerCard(s, i, S.stickers[i])}</button>`
        : `<div class="sticker missing"><span class="ini">?</span><span class="nm">#${i + 1}</span></div>`).join('')}</div>`;
  }
  function openPack() {
    if (S.coins < PACK) return;
    S.coins -= PACK;
    const roll = Math.random();
    const rarity = roll < 0.12 ? 'legend' : roll < 0.4 ? 'superstar' : 'star';
    const pool = STICKERS.map((s, i) => i).filter((i) => STICKERS[i].r === rarity);
    // Favour stickers you don't have yet so the album fills up.
    const fresh = pool.filter((i) => !S.stickers[i]);
    const pickFrom = fresh.length && Math.random() < 0.7 ? fresh : pool;
    const i = pickFrom[rnd(pickFrom.length)];
    const isNew = !S.stickers[i];
    S.stickers[i] = (S.stickers[i] || 0) + 1;
    if (!isNew) addCoins(10);
    save();
    showSticker(i, isNew ? 'NEW STICKER!' : 'Swap! +10 coins');
    sfx(isNew ? 'trophy' : 'coin');
    if (isNew && STICKERS[i].r === 'legend') confetti();
    renderAlbum();
    renderBar();
    checkTrophies();
  }
  function showSticker(i, heading) {
    const s = STICKERS[i];
    const ov = $('#overlay');
    ov.innerHTML = `<div class="inner">
        ${heading ? `<h2 style="color:var(--kit)">${esc(heading)}</h2>` : ''}
        ${stickerCard(s, i, 1, 'reveal flip')}
        <p><b>${esc(s.name)}</b> · ${esc(s.nation)}</p>
        <p class="muted">${esc(s.fact)}</p>
        <button class="btn" id="closeov" type="button">Awesome!</button>
      </div>`;
    ov.hidden = false;
    $('#closeov').focus();
  }

  // ───────────── Trophy cabinet ─────────────
  function renderTrophies() {
    $('#trophies').innerHTML = `
      <div class="panel"><span class="eyebrow">Trophy cabinet</span><h1>${Object.keys(S.trophies).length} / ${TROPHIES.length}</h1><p class="muted">Each trophy is worth 25 coins.</p></div>
      <div class="cabinet">${TROPHIES.map((t) => {
        const got = S.trophies[t.id];
        return `<div class="trophy ${got ? '' : 'locked'}">${cupSVG(t.id.startsWith('lvl') || t.id === 'champ' ? 'var(--kit)' : 'var(--gold)')}<b>${esc(t.name)}</b><span>${esc(t.how)}</span></div>`;
      }).join('')}</div>`;
  }

  // ───────────── Settings ─────────────
  function renderSettings() {
    $('#settings').innerHTML = `
      <div class="panel" style="display:grid;gap:14px"><h1>Settings</h1>
        <label class="field" for="pname">Player name<input id="pname" type="text" maxlength="16" value="${esc(S.name)}" autocomplete="off"></label>
        <button class="btn" id="savename" type="button">Save name</button>
      </div>
      <div class="panel" style="display:grid;gap:10px">
        <h2>Stats</h2>
        <p>${S.stats.correct} right out of ${S.stats.answered} questions · best streak ${S.stats.bestStreak} · ${S.stats.matches} matches</p>
        <p class="small muted">${LIVE ? `Live stats last updated ${esc(fmtDate(LIVE.updated))}.` : 'No live stats yet.'}</p>
      </div>
      <div class="panel" style="display:grid;gap:10px">
        <h2>Start over</h2>
        <p class="small muted">This wipes all coins, stars, stickers and trophies on this phone.</p>
        <div id="resetbox"><button class="btn ghost" id="reset" type="button">Reset progress</button></div>
      </div>`;
  }

  // ───────────── Events ─────────────
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-go]');
    if (!t || t.disabled) return;
    audio(); // unlock audio on first tap (mobile browsers need a gesture)

    if (t.id === 'back') {
      if (screen === 'match' && M) { if (!M.results.length || confirmLeave()) goHome(); return; }
      if (screen === 'result' && M?.kind === 'level') { renderLevel(M.level); show('level'); return; }
      goHome(); return;
    }
    if (t.id === 'sound') { S.sound = !S.sound; save(); renderBar(); if (S.sound) sfx('coin'); return; }
    if (t.id === 'next') return nextQuestion();
    if (t.id === 'nextkick') return nextKick();
    if (t.id === 'pack') return openPack();
    if (t.id === 'closeov') { $('#overlay').hidden = true; return; }
    if (t.id === 'savename') {
      const v = $('#pname').value.trim().slice(0, 16);
      if (v) { S.name = v; save(); renderBar(); toast('Name saved', `Welcome, ${v}!`); }
      return;
    }
    if (t.id === 'reset') {
      $('#resetbox').innerHTML = '<p style="margin-bottom:8px"><b>Are you sure?</b> This can\'t be undone.</p><div class="row"><button class="btn" id="reset-yes" type="button" style="background:var(--loss);box-shadow:none">Yes, reset</button><button class="btn ghost" id="reset-no" type="button">Cancel</button></div>';
      return;
    }
    if (t.id === 'reset-yes') { S = freshState(); save(); goHome(); toast('Progress reset', 'A fresh start!'); return; }
    if (t.id === 'reset-no') return renderSettings();

    if (t.dataset.opt !== undefined) return answer(Number(t.dataset.opt));
    if (t.dataset.tf !== undefined) return kick(t.dataset.tf);
    if (t.dataset.drill) return doDrill(t.dataset.drill);
    if (t.dataset.sticker) return showSticker(Number(t.dataset.sticker));
    if (t.dataset.play) { const [i, m] = t.dataset.play.split('-').map(Number); return startLevelMatch(i, m); }

    const go = t.dataset.go;
    if (!go) return;
    if (go === 'home') return goHome();
    if (go === 'level') {
      const i = Number(t.dataset.level);
      if (!unlocked(i)) { toast('Locked', `Get ${NEED} stars in ${LEVELS[i - 1].name} first`); return; }
      renderLevel(i); return show('level');
    }
    if (go === 'daily') {
      if (S.daily === dayKey()) { toast('Daily Challenge done', 'Come back tomorrow for a new one!'); return; }
      return startDaily();
    }
    if (go === 'shootout') return startShootout();
    if (go === 'live') { renderLive(); return show('live'); }
    if (go === 'livequiz') return LIVEQ.length >= 8 ? startLiveQuiz() : undefined;
    if (go === 'training') { renderTraining(); return show('training'); }
    if (go === 'album') { renderAlbum(); return show('album'); }
    if (go === 'trophies') { renderTrophies(); return show('trophies'); }
    if (go === 'settings') { renderSettings(); return show('settings'); }
  });

  // Leaving mid-match: ask once with an in-page prompt instead of confirm().
  let leaveArmed = false;
  function confirmLeave() {
    if (leaveArmed) { leaveArmed = false; return true; }
    leaveArmed = true;
    toast('Leave the match?', 'Tap back again to leave');
    setTimeout(() => { leaveArmed = false; }, 2600);
    return false;
  }

  $('#overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay') $('#overlay').hidden = true; });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $('#overlay').hidden = true;
    if (screen === 'match' && /^[1-4]$/.test(e.key)) {
      const b = document.querySelector(`.opt[data-opt="${Number(e.key) - 1}"]`);
      if (b && !b.disabled) b.click();
    }
  });

  // ───────────── Start ─────────────
  goHome();
  loadLive();
})();
