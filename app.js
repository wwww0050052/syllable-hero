'use strict';
/*
 * 音節小勇士 Syllable Hero
 * 給 ADHD 孩子的英文單字預習 / 複習 / 考試 PWA。
 * 核心方法：把每個單字切成「音節積木」，用拍手、拼積木、一拍一拍拼字的方式記單字。
 */
(function () {
  // ---------- 常數 ----------
  const COLORS = ['#ff6b6b', '#4d96ff', '#f5a300', '#22b46a', '#a66bff', '#ff6fb5'];
  const PETS = [
    { lv: 1, e: '🥚', n: '神秘蛋' },
    { lv: 2, e: '🐣', n: '破殼小雞' },
    { lv: 3, e: '🐥', n: '小黃雞' },
    { lv: 5, e: '🦖', n: '小恐龍' },
    { lv: 8, e: '🐲', n: '小飛龍' },
    { lv: 12, e: '🐉', n: '單字神龍' },
  ];
  const STICKERS = ['🦄', '🚀', '🌈', '🍩', '🎸', '🦊', '🐙', '🍕', '⚽', '🎈', '🦋', '🌟',
    '🐬', '🍦', '🎨', '🦁', '🛸', '🧸', '🍉', '🐼', '🏰', '🎯', '🦕', '👑'];
  const BOSSES = ['👾', '👹', '🐙', '🦑', '🤖', '👻', '🦂'];
  const PRAISE = ['太棒了！', '好厲害！', 'Great!', 'Awesome!', '完全正確！', '你是天才！', 'Super!'];
  const BREAKS = ['原地跳 10 下 🦘', '手伸高摸天空 5 次 🙆', '轉轉肩膀 5 圈 🔄', '慢慢深呼吸 3 次 🌬️',
    '像青蛙蹲跳 5 下 🐸', '單腳站 10 秒 🦩', '拍拍手 10 下 👏', '扭扭屁股跳舞 💃'];
  // Leitner 盒子：答對升一盒，下次複習隔幾天
  const INTERVAL = [0, 1, 2, 4, 7, 14];
  const KEY = 'syllable-hero-v1';

  // ---------- 小工具 ----------
  const app = document.getElementById('app');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const today = () => new Date().toLocaleDateString('sv');
  const addDays = (d, n) => { const t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + n); return t.toLocaleDateString('sv'); };
  const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

  // ---------- 存檔 ----------
  function fresh() {
    return {
      stars: 0, xp: 0, streak: { n: 0, last: '' }, prog: {}, stickers: [], tests: [],
      quest: { date: '', done: [], claimed: false },
      settings: { calm: false, sound: true, rate: 0.8, round: 4 },
      bookText: null, unit: 0,
    };
  }
  function load() {
    const base = fresh();
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d === 'object') {
        Object.assign(base, d);
        base.settings = Object.assign(fresh().settings, d.settings || {});
      }
    } catch (e) { /* 沒有存檔就用新的 */ }
    return base;
  }
  let S = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* 私密模式 */ } };

  // ---------- 課本解析 ----------
  // 沒標音節時的簡易自動切音節（家長可以用 - 手動修正）
  function syllabify(text) {
    return text.trim().split(/\s+/).flatMap(splitWord);
  }
  function splitWord(w) {
    const lo = w.toLowerCase();
    if (lo.length <= 3) return [w];
    const isV = (i) => 'aeiou'.includes(lo[i]) || (lo[i] === 'y' && i > 0 && !'aeiou'.includes(lo[i - 1]));
    const groups = [];
    for (let i = 0; i < lo.length;) {
      if (isV(i)) { let j = i; while (j < lo.length && isV(j)) j++; groups.push([i, j]); i = j; } else i++;
    }
    const last = groups[groups.length - 1];
    if (groups.length > 1 && last[0] === lo.length - 1 && lo.endsWith('e') && !/[^aeiou]le$/.test(lo)) groups.pop();
    if (groups.length <= 1) return [w];
    const cuts = [];
    for (let k = 0; k < groups.length - 1; k++) {
      const a = groups[k][1], b = groups[k + 1][0], n = b - a;
      if (n === 0) continue;
      const cl = lo.slice(a, b);
      const finalLe = k + 1 === groups.length - 1 && /le$/.test(lo) && cl.endsWith('l');
      let cut;
      if (finalLe) cut = Math.max(a, b - 2);
      else if (n === 1) cut = a;
      else if (n === 2 && /^(ch|sh|th|ph|wh)$/.test(cl)) cut = a;
      else if (/^(ck|ng)/.test(cl)) cut = a + 2;
      else cut = a + 1;
      cuts.push(cut);
    }
    const out = []; let p = 0;
    for (const c of cuts) { if (c > p && c < w.length) { out.push(w.slice(p, c)); p = c; } }
    out.push(w.slice(p));
    return out;
  }

  // 「-」分音節（拍數），「+」分同一拍裡的聲音積木（字首音 + 韻尾）
  function parseWord(w) {
    const marked = /[-+·]/.test(w);
    const s = [];
    let beats = 0;
    for (const token of w.trim().split(/\s+/)) {
      const syls = marked ? token.split(/[-·]/).filter(Boolean) : syllabify(token);
      beats += syls.length;
      for (const syl of syls) s.push(...syl.split('+').filter(Boolean));
    }
    return { w: w.replace(/[-+·]/g, '').replace(/\s+/g, ' ').trim(), s, beats };
  }

  function parseBook(text) {
    const units = []; let cur = null;
    const newUnit = (name) => { cur = { name, words: [], sents: [] }; units.push(cur); };
    for (const raw of String(text || '').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('#')) { newUnit(line.replace(/^#+\s*/, '') || 'Unit ' + (units.length + 1)); continue; }
      if (!cur) newUnit('Unit 1');
      const isSent = line.startsWith('>');
      const [w = '', zh = '', e = '', ex = ''] = line.replace(/^>\s*/, '').split('|').map((s) => s.trim());
      if (!/[a-z]/i.test(w)) continue;
      if (isSent) {
        const text = w.replace(/\s+/g, ' ');
        cur.sents.push({ w: text, s: text.split(' '), beats: 0, zh, e: e || '💬', id: 's:' + text.toLowerCase(), sent: true });
        continue;
      }
      const p = parseWord(w);
      cur.words.push({ w: p.w, s: p.s, beats: p.beats, zh, e: e || '⭐', ex, id: p.w.toLowerCase() });
    }
    return units.filter((u) => u.words.length);
  }
  let BOOK = parseBook(S.bookText || window.DEFAULT_BOOK);
  if (!BOOK.length) BOOK = parseBook(window.DEFAULT_BOOK);
  const unit = () => BOOK[Math.min(S.unit, BOOK.length - 1)] || BOOK[0];
  const allWords = () => BOOK.flatMap((u) => u.words);

  // ---------- 學習進度 ----------
  const getP = (w) => S.prog[w.id] || { box: 0, due: '', ok: 0, bad: 0 };
  const setP = (w, p) => { S.prog[w.id] = p; };
  const isDue = (p) => p.box > 0 && p.due <= today();
  function unitStats(u) {
    let learned = 0, mastered = 0, due = 0;
    for (const w of u.words) { const p = getP(w); if (p.box > 0) learned++; if (p.box >= 4) mastered++; if (isDue(p)) due++; }
    return { learned, mastered, due, total: u.words.length };
  }
  function levelInfo(xp) {
    let lv = 1, need = 50;
    while (xp >= need) { xp -= need; lv++; need = 50 + (lv - 1) * 25; }
    return { lv, cur: xp, need };
  }
  const pet = (lv = levelInfo(S.xp).lv) => PETS.filter((p) => p.lv <= lv).pop();

  // ---------- 聲音 ----------
  const TTS = 'speechSynthesis' in window;
  let voice = null;
  function pickVoice() {
    if (!TTS) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en[-_]US/i.test(v.lang) && /Samantha|Google US|Aria|Jenny|Ava|Allison/i.test(v.name))
      || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if (TTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text, rate) {
    return new Promise((res) => {
      if (!TTS || !text) { setTimeout(res, 350); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.rate = rate || S.settings.rate;
      u.pitch = 1.1;
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(t); res(); } };
      const t = setTimeout(fin, 1500 + text.length * 160);
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
    });
  }
  function say(text, rate) { if (TTS) speechSynthesis.cancel(); return speak(text, rate); }

  // 單一子音積木念「音」不念字母名（h 念 /h/ 而不是 aitch）
  const PHON = { b: 'buh', c: 'kuh', d: 'duh', f: 'fff', g: 'guh', h: 'huh', j: 'juh', k: 'kuh', l: 'lll',
    m: 'mmm', n: 'nnn', p: 'puh', r: 'rrr', s: 'sss', t: 'tuh', v: 'vvv', w: 'wuh', y: 'yuh', z: 'zzz' };
  const chunkText = (c) => PHON[c.toLowerCase()] || c.toLowerCase();
  const sayChunk = (c, fresh) => (fresh ? say : speak)(chunkText(c), Math.max(0.5, S.settings.rate - 0.15));

  let gen = 0; // 換畫面時遞增，用來中斷還在播的音節序列
  async function playSyl(w, box) {
    const g = gen;
    if (TTS) speechSynthesis.cancel();
    const blocks = box ? $$('.syl', box) : [];
    for (let i = 0; i < w.s.length; i++) {
      if (g !== gen) return;
      if (blocks[i]) blocks[i].classList.add('lit');
      await (w.sent ? speak(w.s[i]) : sayChunk(w.s[i]));
      if (blocks[i]) blocks[i].classList.remove('lit');
      await wait(200);
    }
    if (g !== gen) return;
    if (box) box.classList.add('joined');
    await speak(w.w);
    if (box) box.classList.remove('joined');
  }

  let actx = null;
  function tone(notes, dur = 0.12, type = 'sine', vol = 0.14) {
    if (!S.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      let t = actx.currentTime;
      for (const f of notes) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t); o.stop(t + dur);
        t += dur * 0.85;
      }
    } catch (e) { /* 沒有音效也沒關係 */ }
  }
  const sfx = {
    pop: () => tone([700], 0.07, 'triangle'),
    good: () => tone([660, 880, 1320], 0.11),
    bad: () => tone([260, 200], 0.16, 'triangle', 0.1),
    win: () => tone([523, 659, 784, 1047, 1319], 0.14),
  };

  // ---------- 特效 ----------
  function burst() {
    if (S.settings.calm) return;
    const layer = document.createElement('div');
    layer.className = 'burst';
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.textContent = pick(['⭐', '✨', '🌟', '💫']);
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 120;
      s.style.setProperty('--x', Math.cos(a) * d + 'px');
      s.style.setProperty('--y', Math.sin(a) * d + 'px');
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 900);
  }
  function confetti() {
    if (S.settings.calm) return;
    const layer = document.createElement('div');
    layer.className = 'confetti';
    for (let i = 0; i < 36; i++) {
      const s = document.createElement('span');
      s.textContent = pick(['🎉', '⭐', '🎊', '✨', '🌈', '💖']);
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDuration = 1.6 + Math.random() * 1.6 + 's';
      s.style.animationDelay = Math.random() * 0.6 + 's';
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 4000);
  }
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }
  function modal(html, buttons) {
    return new Promise((res) => {
      const bg = document.createElement('div');
      bg.className = 'modal-bg';
      bg.innerHTML = `<div class="modal">${html}<div class="row">${buttons.map((b, i) =>
        `<button class="btn ${b.cls || ''}" data-i="${i}">${esc(b.text)}</button>`).join('')}</div></div>`;
      $$('button', bg).forEach((btn) => btn.addEventListener('click', () => { bg.remove(); res(buttons[+btn.dataset.i].value); }));
      document.body.appendChild(bg);
    });
  }

  // ---------- 畫面片段 ----------
  function sylHTML(w, opts = {}) {
    return `<div class="syls ${w.sent ? 'sent' : ''}">${w.s.map((s, i) => {
      if (opts.blank === i) return `<span class="syl blank" data-i="${i}">?</span>`;
      return `<button class="syl" data-i="${i}" style="--c:${COLORS[i % COLORS.length]}">${esc(s)}</button>`;
    }).join('')}</div>`;
  }
  // 選項裡的字：考試時不給音節顏色提示
  function wordInline(w, plain) {
    if (plain) return esc(w.w);
    return w.s.map((s, i) => `<span style="color:${COLORS[i % COLORS.length]}">${esc(s)}</span>`).join('<i>·</i>');
  }
  function bindSyl(box, w) {
    $$('.syl', box).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      sfx.pop();
      b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
      if (w.sent) say(w.s[i]); else sayChunk(w.s[i], true);
    }));
  }

  function addXP(n) { S.xp += n; }
  function addStars(n) { S.stars += n; }
  function touchStreak() {
    const t = today();
    if (S.streak.last === t) return;
    S.streak.n = S.streak.last === addDays(t, -1) ? S.streak.n + 1 : 1;
    S.streak.last = t;
  }
  function questToday() {
    if (S.quest.date !== today()) S.quest = { date: today(), done: [], claimed: false };
    return S.quest;
  }
  function newSticker() {
    const left = STICKERS.filter((s) => !S.stickers.includes(s));
    if (!left.length) return null;
    const s = pick(left);
    S.stickers.push(s);
    return s;
  }

  // ======================================================
  //  首頁
  // ======================================================
  let installEvt = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (!SES) renderHome(); });

  function renderHome() {
    gen++;
    SES = null;
    document.body.classList.toggle('calm', !!S.settings.calm);
    const L = levelInfo(S.xp), P = pet(L.lv), u = unit(), st = unitStats(u);
    const q = questToday();
    const qItems = [['preview', '🔍 預習'], ['review', '🔁 複習'], ['test', '⚔️ 考試']];
    const chestReady = q.done.length >= 2 && !q.claimed;
    const newCount = u.words.filter((w) => getP(w).box === 0).length;
    app.innerHTML = `
      <section class="hero">
        <div class="pet" aria-hidden="true">${P.e}</div>
        <div class="hero-info">
          <div class="hero-name">Lv.${L.lv} ${esc(P.n)}</div>
          <div class="xp"><div style="width:${Math.round(L.cur / L.need * 100)}%"></div></div>
          <div class="xp-text">再 ${L.need - L.cur} 經驗就升級！</div>
          <div class="chips"><span class="chip">⭐ ${S.stars}</span><span class="chip">🔥 ${S.streak.n} 天</span><span class="chip">🏅 ${S.stickers.length}</span></div>
        </div>
      </section>

      <div class="section-title">📚 選單元</div>
      <div class="units">${BOOK.map((un, i) => {
        const s = unitStats(un);
        return `<button class="unit ${un === u ? 'on' : ''}" data-u="${i}">
          <div class="unit-name">${esc(un.name)}</div>
          <div class="unit-bar"><div style="width:${Math.round(s.learned / s.total * 100)}%"></div></div>
          <div class="unit-meta">學過 ${s.learned}/${s.total} · 精熟 ${s.mastered}</div>
        </button>`;
      }).join('')}</div>

      <div class="modes">
        <button class="mode preview" data-go="preview"><span class="m-icon">🔍</span>
          <span><div class="m-title">預習</div><div class="m-sub">${newCount ? `認識 ${Math.min(newCount, S.settings.round)} 個新單字` : '全部學過了，再看一次！'}</div></span></button>
        <button class="mode review" data-go="review"><span class="m-icon">🔁</span>
          <span><div class="m-title">複習</div><div class="m-sub">${st.learned ? '玩遊戲把單字記牢' : '先預習才能複習喔'}</div></span>
          ${st.due ? `<span class="badge">${st.due}</span>` : ''}</button>
        <button class="mode test" data-go="test"><span class="m-icon">⚔️</span>
          <span><div class="m-title">考試打怪</div><div class="m-sub">答對就攻擊怪獸！</div></span></button>
      </div>

      <div class="quest">
        <div class="q-list"><div>🎯 今日任務：完成任 2 項</div>
          ${qItems.map(([k, t]) => `<span>${q.done.includes(k) ? '✅' : '⬜'} ${t}</span>`).join('')}</div>
        <button class="chest ${chestReady ? 'ready' : ''}" id="chest" ${chestReady ? '' : 'disabled'} aria-label="寶箱">${q.claimed ? '🎁✔' : '🎁'}</button>
      </div>

      <div class="foot">
        <button class="btn" id="stickers">🏅 貼紙本</button>
        <button class="btn" id="parent">⚙️ 家長</button>
        ${installEvt ? '<button class="btn" id="install">📲 安裝</button>' : ''}
      </div>`;

    $$('.unit').forEach((b) => b.addEventListener('click', () => { S.unit = +b.dataset.u; save(); sfx.pop(); renderHome(); }));
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => { sfx.pop(); start(b.dataset.go); }));
    $('#chest').addEventListener('click', () => {
      q.claimed = true; addStars(10); addXP(20);
      const s = newSticker();
      save(); sfx.win(); confetti();
      modal(`<div class="emoji xl">${s || '🎁'}</div><div>寶箱打開了！<br>+10 ⭐ +20 經驗${s ? '<br>得到新貼紙！' : ''}</div>`,
        [{ text: '耶！', cls: 'primary' }]).then(renderHome);
    });
    $('#stickers').addEventListener('click', renderStickers);
    $('#parent').addEventListener('click', parentGate);
    const ins = $('#install');
    if (ins) ins.addEventListener('click', async () => { installEvt.prompt(); await installEvt.userChoice; installEvt = null; renderHome(); });
    const on = $('.unit.on');
    if (on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  // ======================================================
  //  學習回合
  // ======================================================
  let SES = null;

  function pickPreview(u) {
    const n = S.settings.round;
    const fresh = u.words.filter((w) => getP(w).box === 0);
    return fresh.length ? fresh.slice(0, n) : shuffle(u.words.slice()).slice(0, n);
  }
  function pickReview(u) {
    const n = S.settings.round;
    const learned = u.words.filter((w) => getP(w).box > 0);
    const byBox = (a, b) => getP(a).box - getP(b).box;
    let ws = learned.filter((w) => isDue(getP(w))).sort(byBox).slice(0, n);
    if (ws.length < n) ws = ws.concat(shuffle(learned.filter((w) => !ws.includes(w))).sort(byBox).slice(0, n - ws.length));
    return shuffle(ws);
  }
  const pickTest = (u) => shuffle(u.words.slice()).slice(0, 10);

  // 單音節字不適合「缺哪塊」「拼積木」，換成別的題型
  function fit(t, w) {
    if (w.s.length > 1) return t;
    return { missing: 'listen', build: 'spell' }[t] || t;
  }
  // 課本的句型（How old are you? / Are you hungry?）用「排句子」練
  const sentTasks = (n) => shuffle(unit().sents.slice()).slice(0, n).map((w) => ({ t: 'sentence', w }));
  function buildTasks(kind, ws) {
    if (kind === 'preview') {
      return ws.flatMap((w) => [{ t: 'learn', w }, { t: 'clap', w }, { t: fit('build', w), w }]).concat(sentTasks(1));
    }
    if (kind === 'review') {
      const a = ws.map((w) => ({ t: fit(pick(['listen', 'meaning', 'missing', 'first']), w), w }));
      const b = shuffle(ws.map((w) => ({ t: fit(pick(['build', 'spell', 'spell']), w), w })));
      return a.concat(b, sentTasks(1));
    }
    return shuffle(ws.map((w) => ({ t: fit(pick(['spell', 'spell', 'listen', 'meaning', 'missing', 'first']), w), w }))
      .concat(sentTasks(2)));
  }

  function start(kind, override) {
    const u = unit();
    const ws = override || (kind === 'preview' ? pickPreview(u) : kind === 'review' ? pickReview(u) : pickTest(u));
    if (!ws.length) { toast(kind === 'review' ? '先去「預習」認識新單字吧！🔍' : '這個單元還沒有單字'); return; }
    $$('.confetti, .burst').forEach((el) => el.remove());
    const tasks = buildTasks(kind, ws);
    SES = {
      kind, words: ws, tasks, i: 0, right: 0, total: 0, combo: 0, best: 0,
      miss: new Set(), requeued: new Set(), stars: 0, xp: 0,
      boss: pick(BOSSES), hp: tasks.length, hpMax: tasks.length,
    };
    renderTask();
  }

  function topbar() {
    const pct = Math.round(SES.i / SES.tasks.length * 100);
    let html = `<div class="top">
      <button class="icon-btn" id="quit" aria-label="離開">✖</button>
      <div class="track"><div class="fill" style="width:${pct}%"></div><span class="runner" style="left:${pct}%">${pet().e}</span></div>
      <div class="pill">⭐ ${S.stars + SES.stars}</div></div>`;
    if (SES.kind === 'test') {
      html += `<div class="boss"><span class="boss-e" id="boss">${SES.boss}</span>
        <div class="hp"><div id="hp" style="width:${SES.hp / SES.hpMax * 100}%"></div></div></div>`;
    }
    if (SES.combo >= 2) html += `<div class="combo">🔥 連擊 x${SES.combo}</div>`;
    return html;
  }

  function renderTask() {
    gen++;
    if (SES.i >= SES.tasks.length) { finish(); return; }
    const tk = SES.tasks[SES.i];
    app.innerHTML = `${topbar()}<main class="stage" id="stage"></main><div id="fb"></div>`;
    $('#quit').addEventListener('click', async () => {
      const go = await modal('<div class="emoji md">🥺</div><div>要離開嗎？<br>這一回合的進度不會記錄喔</div>',
        [{ text: '繼續玩', cls: 'primary', value: false }, { text: '離開', value: true }]);
      if (go) renderHome();
    });
    TASKS[tk.t]($('#stage'), tk);
  }
  function next() { if (!SES) return; SES.i++; renderTask(); }

  // 每題第一次作答才計分
  function grade(tk, ok) {
    if (tk.graded) return;
    tk.graded = true;
    tk.ok = ok;
    SES.total++;
    if (ok) {
      SES.right++; SES.combo++; SES.best = Math.max(SES.best, SES.combo);
      SES.stars += 1; SES.xp += 5;
      if (SES.combo % 3 === 0) { SES.stars += 1; toast(`🔥 ${SES.combo} 連擊！額外 +1 ⭐`); }
      if (SES.kind === 'test') {
        SES.hp = Math.max(0, SES.hp - 1);
        const b = $('#boss'), hp = $('#hp');
        if (b) { b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit'); }
        if (hp) hp.style.width = SES.hp / SES.hpMax * 100 + '%';
      }
    } else {
      SES.combo = 0;
      SES.miss.add(tk.w.id);
      // 複習時答錯的字，回合最後再練一次
      if (SES.kind === 'review' && !SES.requeued.has(tk.w.id)) {
        SES.requeued.add(tk.w.id);
        SES.tasks.push({ t: tk.w.sent ? 'sentence' : fit('build', tk.w), w: tk.w, extra: true });
      }
    }
  }

  function correct(tk, after) {
    grade(tk, true);
    const stage = $('#stage');
    if (stage) stage.classList.add('locked');
    sfx.good(); burst();
    $('#fb').innerHTML = `<div class="fb good">${pick(PRAISE)} +1 ⭐</div>`;
    const g = gen;
    Promise.resolve(after ? after() : say(tk.w.w)).then(() => wait(after ? 300 : 700)).then(() => { if (g === gen) next(); });
  }
  // 選錯：顯示正確答案、念給孩子聽，按「知道了」再往下
  function wrong(tk, title) {
    grade(tk, false);
    const stage = $('#stage');
    if (stage) stage.classList.add('locked');
    sfx.bad();
    const fb = $('#fb');
    fb.innerHTML = `<div class="fb bad"><div>${esc(title || '差一點點！正確答案是：')}</div>
      <div class="emoji md">${esc(tk.w.e)}</div>${sylHTML(tk.w)}<div class="zh">${esc(tk.w.zh)}</div>
      <button class="btn primary big" id="fbNext">知道了 ➜</button></div>`;
    const box = $('.syls', fb);
    bindSyl(box, tk.w);
    playSyl(tk.w, box);
    $('#fbNext').addEventListener('click', next);
  }
  // 重試後才完成的題目：鼓勵但不給星星
  function solvedAfterRetry(tk) {
    const stage = $('#stage');
    if (stage) stage.classList.add('locked');
    sfx.good();
    $('#fb').innerHTML = `<div class="fb soft">做到了！下次一次就成功 💪<button class="btn primary big" id="fbNext">下一題 ➜</button></div>`;
    say(tk.w.w);
    $('#fbNext').addEventListener('click', next);
  }

  function distractWords(w, n) {
    const pool = unit().words.filter((x) => !same(x.w, w.w));
    let list = shuffle(pool.slice()).slice(0, n);
    if (list.length < n) list = list.concat(shuffle(allWords().filter((x) => !same(x.w, w.w) && !list.includes(x))).slice(0, n - list.length));
    return list;
  }
  function distractSyl(w, n, target) {
    const own = new Set(w.s.map((s) => s.toLowerCase()));
    const seen = new Set();
    const pool = shuffle(allWords().flatMap((x) => x.s)).filter((s) => {
      const k = s.toLowerCase();
      if (own.has(k) || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    // 優先挑長度相近的，比較有挑戰
    const len = (target || w.s[0]).length;
    pool.sort((a, b) => Math.abs(a.length - len) - Math.abs(b.length - len));
    const out = pool.slice(0, n);
    const vowels = 'aeiou';
    let guard = 0;
    while (out.length < n && guard++ < 50) {
      const base = target || w.s[0];
      const fake = base.replace(/[aeiou]/i, () => pick(vowels.split('')));
      if (!own.has(fake.toLowerCase()) && !out.some((o) => same(o, fake))) out.push(fake);
    }
    return out;
  }

  const TASKS = {
    // 預習：認識新字，自動一拍一拍念
    learn(st, tk) {
      const w = tk.w;
      st.innerHTML = `<span class="label">🔍 新單字</span>
        <div class="emoji xl bob">${esc(w.e)}</div>
        <div class="zh big">${esc(w.zh)}</div>
        ${sylHTML(w)}
        <div class="hint">👆 點每一塊積木，聽聽它的聲音</div>
        <div class="row"><button class="btn" id="hear">🔊 整個字</button><button class="btn" id="slow">🐢 一拍一拍</button></div>
        ${w.ex ? `<button class="ex" id="ex">💬 ${esc(w.ex)}</button>` : ''}
        <button class="btn primary big" id="go" disabled>我記住了 ➜</button>`;
      const box = $('.syls', st);
      bindSyl(box, w);
      $('#hear', st).addEventListener('click', () => say(w.w));
      $('#slow', st).addEventListener('click', () => playSyl(w, box));
      if (w.ex) $('#ex', st).addEventListener('click', () => say(w.ex, S.settings.rate - 0.05));
      const go = $('#go', st), g = gen;
      const enable = () => { if (g === gen) go.disabled = false; };
      playSyl(w, box).then(enable);
      setTimeout(enable, 5000);
      go.addEventListener('click', () => { sfx.pop(); SES.xp += 3; next(); });
    },

    // 拍手數音節
    clap(st, tk) {
      const w = tk.w;
      let n = 0;
      st.innerHTML = `<span class="label">👏 拍拍手</span>
        <div class="emoji lg">${esc(w.e)}</div>
        <div class="q">「${esc(w.w)}」有幾拍？</div>
        <div class="hint">聽一聽，每一拍就按一下鼓</div>
        <button class="btn small" id="hear">🔊 再聽一次</button>
        <button class="drum" id="drum" aria-label="拍">👏</button>
        <div class="dots" id="dots"></div>
        <div class="row"><button class="btn" id="reset">↺ 重來</button><button class="btn primary" id="ok" disabled>好了！</button></div>`;
      say(w.w, S.settings.rate - 0.1);
      const dots = $('#dots', st), ok = $('#ok', st);
      const draw = () => { dots.textContent = '🟣'.repeat(n); ok.disabled = n === 0; };
      $('#hear', st).addEventListener('click', () => say(w.w, S.settings.rate - 0.1));
      $('#drum', st).addEventListener('click', () => { if (n < 8) { n++; tone([400 + n * 80], 0.08, 'triangle'); draw(); } });
      $('#reset', st).addEventListener('click', () => { n = 0; draw(); });
      ok.addEventListener('click', () => {
        if (n === w.beats) {
          $('.q', st).outerHTML = sylHTML(w);
          const box = $('.syls', st);
          correct(tk, () => playSyl(w, box));
        } else {
          wrong(tk, `是 ${w.beats} 拍喔！一起念念看：`);
        }
      });
    },

    // 把音節積木排好
    build(st, tk) {
      const w = tk.w;
      let pool = w.s.map((s, i) => ({ s, k: i }));
      if (SES.kind !== 'preview' && !w.sent) distractSyl(w, 1).forEach((s) => pool.push({ s, k: -1 }));
      pool = shuffle(pool);
      // 避免一開始就剛好排好
      if (pool.length > 1 && pool.every((p, i) => p.k === i)) pool.push(pool.shift());
      pool.forEach((p, i) => { p.id = i; });
      const placed = [];
      st.innerHTML = `<span class="label">${w.sent ? '🗣️ 排句子' : '🧩 拼積木'}</span>
        <div class="emoji lg">${esc(w.e)}</div>
        <div class="zh">${esc(w.zh)}</div>
        <button class="btn small" id="hear">🔊 聽</button>
        <div class="slots ${w.sent ? 'sent' : ''}" id="slots"></div>
        <div class="hint">依照順序點${w.sent ? '單字' : '積木'} · 點上面的可以拿回來</div>
        <div class="tiles" id="tiles"></div>`;
      $('#hear', st).addEventListener('click', () => say(w.w));
      say(w.w);
      const slots = $('#slots', st), tiles = $('#tiles', st);
      const draw = () => {
        slots.innerHTML = w.s.map((_, k) => placed[k]
          ? `<button class="syl" data-k="${k}" style="--c:${COLORS[k % COLORS.length]}">${esc(placed[k].s)}</button>`
          : '<span class="slot"></span>').join('');
        tiles.innerHTML = pool.map((p) => `<button class="tile ${placed.includes(p) ? 'used' : ''}" data-id="${p.id}">${esc(p.s)}</button>`).join('');
        $$('.syl', slots).forEach((b) => b.addEventListener('click', () => { placed.splice(+b.dataset.k); sfx.pop(); draw(); }));
        $$('.tile', tiles).forEach((b) => b.addEventListener('click', () => {
          const p = pool[+b.dataset.id];
          if (placed.includes(p)) return;
          placed.push(p);
          if (w.sent) say(p.s); else sayChunk(p.s, true);
          draw();
          if (placed.length === w.s.length) check();
        }));
      };
      const check = () => {
        if (placed.every((p, k) => same(p.s, w.s[k]))) {
          if (tk.graded) solvedAfterRetry(tk);
          else correct(tk, () => playSyl(w, slots));
          return;
        }
        if (!tk.graded) grade(tk, false);
        sfx.bad();
        slots.classList.add('shake');
        setTimeout(() => {
          slots.classList.remove('shake');
          placed.length = 0;
          draw();
          playSyl(w, null);
        }, 600);
      };
      draw();
    },

    // 聽音選字
    listen(st, tk) {
      const w = tk.w;
      const opts = shuffle([w, ...distractWords(w, 2)]);
      const plain = SES.kind === 'test';
      st.innerHTML = `<span class="label">👂 聽聽看</span>
        <button class="speaker" id="hear" aria-label="播放">🔊</button>
        <button class="btn small" id="slow">🐢 慢一點</button>
        <div class="q">你聽到哪一個字？</div>
        <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${wordInline(o, plain)}</button>`).join('')}</div>`;
      say(w.w);
      $('#hear', st).addEventListener('click', () => say(w.w));
      $('#slow', st).addEventListener('click', () => say(w.w, 0.5));
      bindChoice(st, tk, opts.map((o) => o === w));
    },

    // 看中文選英文
    meaning(st, tk) {
      const w = tk.w;
      const opts = shuffle([w, ...distractWords(w, 2)]);
      const plain = SES.kind === 'test';
      st.innerHTML = `<span class="label">🤔 猜意思</span>
        <div class="emoji lg">${esc(w.e)}</div>
        <div class="q">哪一個是「${esc(w.zh)}」？</div>
        <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${wordInline(o, plain)}</button>`).join('')}</div>`;
      bindChoice(st, tk, opts.map((o) => o === w));
    },

    // 缺了哪一塊音節
    missing(st, tk) {
      const w = tk.w;
      const k = Math.floor(Math.random() * w.s.length);
      const opts = shuffle([w.s[k], ...distractSyl(w, 2, w.s[k])]);
      st.innerHTML = `<span class="label">🔎 缺哪一塊？</span>
        <div class="emoji lg">${esc(w.e)}</div>
        <div class="zh">${esc(w.zh)}</div>
        <button class="btn small" id="hear">🔊 聽</button>
        ${sylHTML(w, { blank: k })}
        <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
      say(w.w);
      $('#hear', st).addEventListener('click', () => say(w.w));
      const box = $('.syls', st);
      bindChoice(st, tk, opts.map((o) => same(o, w.s[k])), () => {
        const blank = $('.blank', box);
        blank.outerHTML = `<button class="syl" style="--c:${COLORS[k % COLORS.length]}">${esc(w.s[k])}</button>`;
        return playSyl(w, box);
      });
    },

    // 一拍一拍拼字：每個音節用字母磚拼出來
    spell(st, tk) {
      const w = tk.w;
      let si = 0, li = 0;
      const exam = SES.kind === 'test';
      st.innerHTML = `<span class="label">✍️ 拼拼看</span>
        <div class="emoji lg">${esc(w.e)}</div>
        <div class="zh">${esc(w.zh)}</div>
        <div class="row"><button class="btn small" id="hear">🔊 整個字</button><button class="btn small" id="part">🔊 這一拍</button>
        ${exam ? '' : '<button class="btn small" id="tip">💡 提示</button>'}</div>
        <div class="syls" id="word"></div>
        <div class="tiles" id="tiles"></div>`;
      say(w.w);
      const wordEl = $('#word', st), tiles = $('#tiles', st);
      const drawWord = () => {
        wordEl.innerHTML = w.s.map((s, i) => {
          const c = COLORS[i % COLORS.length];
          if (i < si) return `<span class="syl" style="--c:${c}">${esc(s)}</span>`;
          if (i === si) return `<span class="syl lit" style="--c:${c}"><span class="typed">${esc(s.slice(0, li))}</span><span class="todo">${'_'.repeat(s.length - li)}</span></span>`;
          return `<span class="syl ghost">${'_'.repeat(s.length)}</span>`;
        }).join('');
      };
      const drawTiles = () => {
        const syl = w.s[si];
        const letters = syl.split('');
        const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => !syl.toLowerCase().includes(c));
        shuffle(abc).slice(0, syl.length > 4 ? 3 : 2).forEach((c) => letters.push(c));
        tiles.innerHTML = shuffle(letters).map((c) => `<button class="tile letter" data-c="${esc(c)}">${esc(c)}</button>`).join('');
        $$('.tile', tiles).forEach((b) => b.addEventListener('click', () => tap(b)));
      };
      const advance = () => {
        li++;
        if (li < w.s[si].length) { drawWord(); return; }
        sayChunk(w.s[si], true);
        si++; li = 0;
        if (si < w.s.length) { drawWord(); drawTiles(); return; }
        drawWord();
        tiles.innerHTML = '';
        if (tk.graded) solvedAfterRetry(tk);
        else correct(tk, () => playSyl(w, wordEl));
      };
      const tap = (b) => {
        if (b.classList.contains('used')) return;
        if (same(b.dataset.c, w.s[si][li])) {
          sfx.pop();
          b.classList.add('used');
          advance();
        } else {
          sfx.bad();
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          if (!tk.graded) grade(tk, false);
        }
      };
      $('#hear', st).addEventListener('click', () => say(w.w));
      $('#part', st).addEventListener('click', () => { if (si < w.s.length) sayChunk(w.s[si], true); });
      const tip = $('#tip', st);
      if (tip) tip.addEventListener('click', () => {
        if (si >= w.s.length) return;
        if (!tk.graded) grade(tk, false);
        const need = w.s[si][li];
        const b = $$('.tile:not(.used)', tiles).find((x) => same(x.dataset.c, need));
        if (b) tap(b);
      });
      drawWord();
      drawTiles();
    },
  };

  // 句子：把單字排成句子（和拼積木同一套操作）
  TASKS.sentence = (st, tk) => TASKS.build(st, tk);

  // 聽單字，選開頭字母（課本 Listen and Check 的題型）
  TASKS.first = (st, tk) => {
    const w = tk.w;
    const first = w.w[0].toLowerCase();
    const others = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((c) => c !== first);
    const opts = shuffle([first, ...shuffle(others).slice(0, 2)]);
    st.innerHTML = `<span class="label">🔤 開頭字母</span>
      <div class="emoji lg">${esc(w.e)}</div>
      <div class="zh">${esc(w.zh)}</div>
      <button class="btn small" id="hear">🔊 聽</button>
      <div class="q">開頭是哪個字母？</div>
      <div class="opts">${opts.map((c, i) => `<button class="opt" data-i="${i}">${esc(c.toUpperCase() + c)}</button>`).join('')}</div>`;
    say(w.w);
    $('#hear', st).addEventListener('click', () => say(w.w));
    bindChoice(st, tk, opts.map((c) => c === first), () => say(w.w));
  };

  function bindChoice(st, tk, rights, after) {
    $$('.opt', st).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (rights[i]) {
        b.classList.add('right');
        correct(tk, after);
      } else {
        b.classList.add('wrong');
        const r = $$('.opt', st)[rights.indexOf(true)];
        if (r) r.classList.add('right');
        wrong(tk);
      }
    }));
  }

  // ======================================================
  //  結算
  // ======================================================
  function finish() {
    gen++;
    const k = SES.kind;
    const beforeLv = levelInfo(S.xp).lv;
    for (const w of SES.words) {
      const p = Object.assign({}, getP(w));
      if (k === 'preview') {
        if (p.box === 0) { p.box = 1; p.due = today(); }
      } else if (SES.miss.has(w.id)) {
        p.box = 1; p.due = today(); p.bad++;
      } else {
        p.box = Math.min(5, (p.box || 0) + 1); p.due = addDays(today(), INTERVAL[p.box]); p.ok++;
      }
      setP(w, p);
    }
    const acc = SES.total ? SES.right / SES.total : 1;
    let starsRank = 0, sticker = null;
    if (k === 'test') {
      starsRank = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
      SES.stars += starsRank * 3;
      if (starsRank >= 2) sticker = newSticker();
      S.tests.unshift({ date: today(), unit: unit().name, right: SES.right, total: SES.total });
      S.tests = S.tests.slice(0, 30);
    }
    SES.xp += 10;
    addStars(SES.stars);
    addXP(SES.xp);
    touchStreak();
    const q = questToday();
    if (!q.done.includes(k)) q.done.push(k);
    save();
    const afterLv = levelInfo(S.xp).lv;
    const leveled = afterLv > beforeLv;
    if (leveled || starsRank >= 2 || k === 'preview' || acc >= 0.8) { sfx.win(); confetti(); }
    renderResults({ k, acc, starsRank, sticker, leveled, afterLv });
  }

  function renderResults({ k, acc, starsRank, sticker, leveled, afterLv }) {
    const ses = SES;
    const title = { preview: '預習完成！🎉', review: '複習完成！💪', test: starsRank >= 1 ? '打敗怪獸了！🏆' : '怪獸逃走了…' }[k];
    const missWords = ses.words.filter((w) => ses.miss.has(w.id));
    const move = pick(BREAKS);
    app.innerHTML = `<section class="result">
      ${k === 'test' ? `<div class="emoji xl">${starsRank >= 1 ? '💥' + ses.boss : ses.boss + '💨'}</div>
        <div class="stars-big">${[1, 2, 3].map((n) => `<span class="${n <= starsRank ? '' : 'off'}">⭐</span>`).join('')}</div>`
        : `<div class="emoji xl bob">${pet().e}</div>`}
      <h1>${title}</h1>
      ${k === 'preview' ? `<div class="score">認識了 ${ses.words.length} 個新單字</div>`
        : `<div class="score">答對 ${ses.right} / ${ses.total} 題 (${Math.round(acc * 100)}%)</div>`}
      <div class="reward"><span class="chip">+${ses.stars} ⭐</span><span class="chip">+${ses.xp} 經驗</span>${ses.best >= 3 ? `<span class="chip">🔥 最高 ${ses.best} 連擊</span>` : ''}</div>
      ${leveled ? `<div class="banner">🎊 升級到 Lv.${afterLv}！${esc(pet(afterLv).n)} ${pet(afterLv).e}</div>` : ''}
      ${sticker ? `<div class="banner">得到新貼紙 ${sticker}</div>` : ''}
      <div class="wordlist">${ses.words.map((w) => `<button class="wl ${ses.miss.has(w.id) ? 'miss' : ''}" data-id="${esc(w.id)}">
        <span class="e">${esc(w.e)}</span><span class="w">${wordInline(w)}</span><span>${esc(w.zh)}</span><span>🔊</span></button>`).join('')}</div>
      <div class="break"><div class="b-title">🧠 腦袋休息一下，動一動！</div><div class="b-move">${esc(move)}</div>
        <button class="btn green" id="brk">開始 20 秒</button></div>
      ${missWords.length ? `<button class="btn primary big" id="again">🔁 再練一次錯的字 (${missWords.length})</button>` : ''}
      ${k === 'preview' ? '<button class="btn primary big" id="toReview">🔁 馬上玩複習遊戲</button>' : ''}
      <button class="btn big" id="home">🏠 回首頁</button>
    </section>`;
    $$('.wl').forEach((b) => b.addEventListener('click', () => {
      const w = ses.words.find((x) => x.id === b.dataset.id);
      if (w) say(w.w);
    }));
    const again = $('#again');
    if (again) again.addEventListener('click', () => start('review', missWords));
    const tr = $('#toReview');
    if (tr) tr.addEventListener('click', () => start('review', ses.words));
    $('#home').addEventListener('click', renderHome);
    $('#brk').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const box = btn.parentElement;
      let left = 20;
      btn.remove();
      const t = document.createElement('div');
      t.className = 'timer';
      t.textContent = left;
      box.appendChild(t);
      const g = gen;
      const iv = setInterval(() => {
        if (g !== gen || !document.body.contains(t)) { clearInterval(iv); return; }
        left--;
        t.textContent = left > 0 ? left : '動得好！+2 ⭐';
        if (left <= 0) { clearInterval(iv); addStars(2); save(); sfx.win(); burst(); }
      }, 1000);
    });
  }

  // ======================================================
  //  貼紙本
  // ======================================================
  function renderStickers() {
    gen++;
    app.innerHTML = `<div class="head"><button class="icon-btn" id="back" aria-label="返回">⬅</button><h1>🏅 貼紙本</h1></div>
      <p class="hint" style="margin:10px 4px">考試拿到 2 顆星以上、或打開每日寶箱，就能得到貼紙！</p>
      <div class="grid">${STICKERS.map((s) => S.stickers.includes(s)
        ? `<div class="sticker">${s}</div>` : '<div class="sticker no">?</div>').join('')}</div>`;
    $('#back').addEventListener('click', renderHome);
  }

  // ======================================================
  //  家長設定
  // ======================================================
  function parentGate() {
    gen++;
    const a = 6 + Math.floor(Math.random() * 7), b = 6 + Math.floor(Math.random() * 4);
    app.innerHTML = `<div class="head"><button class="icon-btn" id="back" aria-label="返回">⬅</button><h1>⚙️ 家長專區</h1></div>
      <div class="panel gate"><p>請家長回答：</p><div class="q">${a} × ${b} = ?</div>
      <input id="ans" type="number" inputmode="numeric" autocomplete="off"><div class="err" id="err"></div>
      <button class="btn primary big" id="ok">進入</button></div>`;
    $('#back').addEventListener('click', renderHome);
    const go = () => {
      if (+$('#ans').value === a * b) renderParent();
      else { $('#err').textContent = '答案不對喔'; $('#ans').value = ''; }
    };
    $('#ok').addEventListener('click', go);
    $('#ans').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    $('#ans').focus();
  }

  function bookToText() {
    if (S.bookText) return S.bookText.trim();
    return String(window.DEFAULT_BOOK).trim();
  }

  function renderParent() {
    gen++;
    const st = S.settings;
    app.innerHTML = `<div class="head"><button class="icon-btn" id="back" aria-label="返回">⬅</button><h1>⚙️ 家長專區</h1></div>

      <div class="panel"><h2>📊 學習狀況</h2>
        <table class="stats"><tr><th>單元</th><th>學過</th><th>精熟</th><th>待複習</th></tr>
        ${BOOK.map((u) => { const s = unitStats(u); return `<tr><td>${esc(u.name)}</td><td>${s.learned}/${s.total}</td><td>${s.mastered}</td><td>${s.due}</td></tr>`; }).join('')}
        </table>
        <p>「精熟」＝連續答對、已經升到第 4 盒以上的字。答錯的字會自動回到第 1 盒，當天就會再出現在複習裡。</p>
        ${S.tests.length ? `<h2>⚔️ 最近考試</h2><table class="stats">${S.tests.slice(0, 8).map((t) =>
          `<tr><td>${esc(t.date)}</td><td>${esc(t.unit)}</td><td>${t.right}/${t.total}</td></tr>`).join('')}</table>` : ''}
        ${hardWords()}
      </div>

      <div class="panel"><h2>🎛️ 設定</h2>
        <label class="set">🔈 音效 <input type="checkbox" class="switch" id="sound" ${st.sound ? 'checked' : ''}></label>
        <label class="set">🧘 安靜模式（減少動畫） <input type="checkbox" class="switch" id="calm" ${st.calm ? 'checked' : ''}></label>
        <label class="set">🗣️ 念單字速度 <input type="range" id="rate" min="0.5" max="1.1" step="0.05" value="${st.rate}"></label>
        <label class="set">🎯 每回合單字數
          <select id="round">${[3, 4, 5, 6, 8].map((n) => `<option ${n === st.round ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <div class="row"><button class="btn small" id="test">🔊 試聽 "elephant"</button></div>
        <p>ADHD 小建議：每回合 3–5 個字、一次 5–10 分鐘就好；結束後做「動一動」再繼續，比一次念很久有效。</p>
      </div>

      <div class="panel"><h2>📖 課本單字表</h2>
        <p>一行一個字：<b>hap-py | 快樂的 | 😄 | 例句</b><br>
        「-」分音節（拍數）、「+」分字首音和韻尾（例 <b>h+en</b>）。沒標的話會自動猜（不一定準）。<br>
        以 <b>&gt;</b> 開頭是句子（例 <b>&gt; How old are you? | 你幾歲？ | 🎂</b>），以 <b>#</b> 開頭是單元名稱。</p>
        <textarea id="book" spellcheck="false">${esc(bookToText())}</textarea>
        <div class="err" id="bookErr"></div>
        <div class="row"><button class="btn primary" id="saveBook">💾 儲存單字表</button><button class="btn" id="resetBook">↺ 恢復範例</button></div>
      </div>

      <div class="panel"><h2>📲 安裝到手機/平板</h2>
        <p>iPhone / iPad：用 Safari 開啟 → 分享 → 「加入主畫面」。<br>Android：Chrome 選單 → 「安裝應用程式」。安裝後可以離線使用。</p>
      </div>

      <div class="panel"><h2>🧹 重設</h2>
        <p>清除所有星星、等級、貼紙和學習紀錄（單字表會保留）。</p>
        <button class="btn" id="wipe">清除學習紀錄</button>
      </div>`;

    $('#back').addEventListener('click', renderHome);
    const bindSet = (id, key, fn) => $('#' + id).addEventListener('change', (e) => { st[key] = fn(e.target); save(); });
    bindSet('sound', 'sound', (t) => t.checked);
    bindSet('calm', 'calm', (t) => t.checked);
    bindSet('rate', 'rate', (t) => +t.value);
    bindSet('round', 'round', (t) => +t.value);
    $('#test').addEventListener('click', () => {
      const w = { w: 'elephant', s: ['el', 'e', 'phant'] };
      playSyl(w, null);
    });
    $('#saveBook').addEventListener('click', () => {
      const text = $('#book').value;
      const parsed = parseBook(text);
      if (!parsed.length) { $('#bookErr').textContent = '讀不到任何單字，請檢查格式'; return; }
      S.bookText = text;
      BOOK = parsed;
      S.unit = Math.min(S.unit, BOOK.length - 1);
      save();
      const n = parsed.reduce((a, u) => a + u.words.length, 0);
      toast(`已儲存：${parsed.length} 個單元、${n} 個單字`);
      renderParent();
    });
    $('#resetBook').addEventListener('click', async () => {
      const ok = await modal('<div>要把單字表恢復成範例嗎？<br>你輸入的單字會被清掉。</div>',
        [{ text: '取消', value: false }, { text: '恢復', cls: 'primary', value: true }]);
      if (!ok) return;
      S.bookText = null;
      BOOK = parseBook(window.DEFAULT_BOOK);
      S.unit = 0;
      save();
      renderParent();
    });
    $('#wipe').addEventListener('click', async () => {
      const ok = await modal('<div>確定要清除所有學習紀錄嗎？<br>這個動作不能復原。</div>',
        [{ text: '取消', value: false }, { text: '清除', cls: 'primary', value: true }]);
      if (!ok) return;
      const keep = { bookText: S.bookText, settings: S.settings };
      S = Object.assign(fresh(), keep);
      save();
      toast('已清除');
      renderParent();
    });
  }

  function hardWords() {
    const list = allWords().filter((w) => getP(w).bad > 0)
      .sort((a, b) => getP(b).bad - getP(a).bad).slice(0, 8);
    if (!list.length) return '';
    return `<h2>🧩 比較容易錯的字</h2><p>${list.map((w) => `${esc(w.s.join('·'))}（錯 ${getP(w).bad} 次）`).join('、')}</p>`;
  }

  // ---------- 啟動 ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  renderHome();
})();
