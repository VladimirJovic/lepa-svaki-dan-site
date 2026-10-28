/* =====================================================================================================
   LEPA SVAKI DAN · "A" preview · PERSONALISED OFFER ("nagradna igra"), vanilla JS, no libraries, no cookies, no server, no third party
   Loaded on every page after js/shell.js and js/search.js. All wording, percentages, codes and rules: assets/data/personalize-config.js (read its header first).
   Pripremio ECHOSYSTEM-MOTHER AGENCY

   WHAT IT DOES
   1. SIGNALS. Every sign of interest in a topic adds points to that topic (weights in the config):
        - a question settled in the search (the event "lsd:search" of js/search.js: which hidden entries answered it and which groups came first; NEVER the words),
        - a text (blog/*.html, body[data-art]) or a segment page (tretmani/*.html, body[data-seg]) was opened,
        - a price-list group was opened or expanded on the home (or the home was opened with ?grupa=),
        - DWELL TIME: about 25 s of ACTIVE time (tab visible, an event of the visitor in the last 8 s) on such a text, page or open group on screen.
      A text, a segment and a group count once per browser session each.
   2. STORAGE. Only the points per topic and the flags shown / opened / switched off, in localStorage "lsd-interest-v1" (try/catch: without storage it works for the page only).
      Forgotten after "forgetDays". The words of a question are never stored.
   3. THE CARD. When one topic reaches the threshold and was not shown or switched off before, a small card "Iznenađenje za vas" appears at the bottom left (on a phone above the
      action bar, never over the back-to-top button, never while a dialog or the search is open or while someone is typing). "Otkrij" opens a dialog that reveals the offer
      (a light "gift box" reveal, instant with reduced motion): headline, 2 to 4 price-list groups as links, the code, the validity line, "Zakaži preko WhatsApp-a" (the booking sheet
      with both numbers, message prefilled with the offer and the code) and "Ne prikazuj više". After "Otkrij" a small round button stays until the offer is switched off.
   4. TEST (harmless in production, see the config): ?demo-iznenadjenje=<topic>[&otkrij]   and   ?reset-interest
   ===================================================================================================== */
(function () {
  'use strict';
  var CFG = window.LSD_PERSONALIZE;
  if (!CFG || !CFG.topics || !CFG.topics.length) return;
  var doc = document, root = doc.documentElement, body = doc.body;
  var ROOT = root.getAttribute('data-root') || '';
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var Sh = window.LSDShell;
  var KEY = CFG.storageKey || 'lsd-interest-v1', W = CFG.weights || {}, DW = CFG.dwell || {}, CARD = CFG.card || {}, COPY = CFG.copy || {};
  var TH = CFG.threshold || 4, SF = { 3: 1, 2: 0.85, 1: 0.5 };
  var now = function () { return Date.now(); };

  /* ---------------------------------------------------------------- URL parameters (test): ?reset-interest, ?demo-iznenadjenje=<topic>[&otkrij] */
  var qs = location.search || '';
  function hasParam(name) { return new RegExp('[?&]' + name + '(=|&|$)').test(qs); }
  function strip(names) {
    try {
      var u = new URL(location.href);
      names.forEach(function (n) { u.searchParams.delete(n); });
      history.replaceState(null, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) { /* old browser: the parameter just stays in the address */ }
  }

  /* ---------------------------------------------------------------- the topics, indexed */
  var topicById = {}, byEntry = {}, byGroup = {}, byArticle = {}, bySeg = CFG.segments || {};
  var link = function (map, key, id) { (map[key] = map[key] || []).push(id); };
  CFG.topics.forEach(function (t) {
    topicById[t.id] = t;
    (t.entries || []).forEach(function (e) { link(byEntry, e, t.id); });
    (t.groups || []).forEach(function (g) { link(byGroup, g, t.id); });
    (t.articles || []).forEach(function (a) { link(byArticle, a, t.id); });
  });

  /* ---------------------------------------------------------------- storage: only the points per topic and the flags */
  var mem = null, seenMem = {};
  var blank = function () { return { v: 1, t: now(), s: {}, sh: {}, op: {}, of: {} }; };
  function read() {
    var raw = null, o = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return mem || (mem = blank()); }
    try { o = raw ? JSON.parse(raw) : null; } catch (e) { o = null; }
    if (!o || o.v !== 1 || typeof o.s !== 'object' || o.s === null) o = blank();
    if (o.t && now() - o.t > (CFG.forgetDays || 30) * 864e5) o = blank();
    ['sh', 'op', 'of'].forEach(function (k) { if (!o[k] || typeof o[k] !== 'object') o[k] = {}; });
    Object.keys(o.s).forEach(function (k) { if (!topicById[k] || !isFinite(o.s[k])) delete o.s[k]; });   // only known topics, only numbers
    return o;
  }
  function write(o) { o.t = now(); mem = o; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* private mode: this page only */ } }
  function once(key) {   // true the first time in this browser session
    try {
      var s = JSON.parse(sessionStorage.getItem('lsd-int-seen') || '{}');
      if (s[key]) return false;
      s[key] = 1; sessionStorage.setItem('lsd-int-seen', JSON.stringify(s)); return true;
    } catch (e) { if (seenMem[key]) return false; seenMem[key] = 1; return true; }
  }
  function sessionShown(delta) {
    var n = 0;
    try { n = +sessionStorage.getItem('lsd-gift-n') || 0; if (delta) sessionStorage.setItem('lsd-gift-n', String(n + delta)); } catch (e) { n = seenMem.__n || 0; if (delta) seenMem.__n = n + delta; }
    return n + (delta || 0);
  }

  if (hasParam('reset-interest')) {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    try { sessionStorage.removeItem('lsd-int-seen'); sessionStorage.removeItem('lsd-gift-n'); } catch (e) { /* ignore */ }
    mem = null; strip(['reset-interest']);
  }

  var el = null, dlg = null, cardTopic = null, state = 'off', shownTimer = 0, evalTimer = 0, demoMode = false;   // the card (js below) and its state, declared first: the signals below may ask for it at once

  /* ---------------------------------------------------------------- points */
  function add(id, pts) {
    if (!topicById[id] || !(pts > 0)) return;
    var o = read();
    o.s[id] = Math.min(20, Math.round(((o.s[id] || 0) + pts) * 100) / 100);
    write(o);
    schedule();
  }
  /* a settled question of the search */
  var burst = { at: 0, pts: {} };
  doc.addEventListener('lsd:search', function (e) {
    var d = (e && e.detail) || {}, pts = {}, t = now();
    (d.entries || []).forEach(function (en) {
      (byEntry[en.id] || []).forEach(function (tid) { var p = (W.search || 2.5) * (en.q || 0.5) * (SF[en.s] || 0.85); if (p > (pts[tid] || 0)) pts[tid] = p; });
    });
    if (!Object.keys(pts).length) {
      (d.groups || []).slice(0, 2).forEach(function (g) { (byGroup[g] || []).forEach(function (tid) { if ((W.searchGroup || 1) > (pts[tid] || 0)) pts[tid] = W.searchGroup || 1; }); });
    }
    if (t - burst.at > (W.burstSeconds || 12) * 1000) burst.pts = {};
    burst.at = t;   // a question that is typed on or corrected within a few seconds only adds what it adds to the previous one
    Object.keys(pts).forEach(function (tid) { var prev = burst.pts[tid] || 0; if (pts[tid] > prev) { burst.pts[tid] = pts[tid]; add(tid, pts[tid] - prev); } });
  });
  var opened = {};   // price-list groups the visitor opened in this page view (a group that is open by default is not an interest)
  function viewGroup(gid) {
    if (!gid || !byGroup[gid]) return;
    opened[gid] = 1;
    if (!once('g:' + gid)) return;
    byGroup[gid].forEach(function (tid) { add(tid, W.group || 1.5); });
  }

  /* ---------------------------------------------------------------- the page: a text, a segment page, the home with its price list */
  var art = body.getAttribute('data-art') || '', seg = body.getAttribute('data-seg') || '';
  var pageTopics = art ? (byArticle[art] || []) : seg ? (bySeg[seg] || []).filter(function (t) { return topicById[t]; }) : [];
  if (art && once('a:' + art)) pageTopics.forEach(function (tid) { add(tid, W.article || 2.5); });
  if (seg && once('s:' + seg)) pageTopics.forEach(function (tid) { add(tid, W.segment || 0.75); });
  var onHome = !!$('#usluge') && !!$('#pricePanels');
  if (onHome) {
    var gm = /[?&]grupa=([a-z]+)(?:-|:|%3A)(\d+)/i.exec(qs);
    if (gm) viewGroup(gm[1].toLowerCase() + ':' + gm[2]);
    /* a group opened by the visitor (the click of a group header) */
    doc.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.grp__btn');
      if (!b || b.getAttribute('aria-expanded') !== 'true') return;
      var g = b.closest('.grp'); if (g) viewGroup(g.getAttribute('data-group-id'));
    });
    /* a group opened by a link (the search results, the dialog, the favourites): app.js goGroup */
    var hook = function () {
      if (!window.LSDApp || !window.LSDApp.goGroup || window.LSDApp.__lsdHooked) return;
      var og = window.LSDApp.goGroup;
      window.LSDApp.goGroup = function (tab, gi) { viewGroup(tab + ':' + gi); return og.apply(this, arguments); };
      window.LSDApp.__lsdHooked = true;
    };
    hook(); window.addEventListener('load', hook);
  }

  /* ---------------------------------------------------------------- dwell time: ACTIVE seconds only */
  var lastAct = now(), dw = {}, dwDone = {}, secVisible = false;
  var act = function () { lastAct = now(); };
  ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel', 'click'].forEach(function (n) { window.addEventListener(n, act, { passive: true }); });
  window.addEventListener('scroll', act, { passive: true });
  function homeTopics() {   // the topics of the open price-list groups that are really on screen
    if (!onHome || !secVisible) return [];
    var out = {}, vh = window.innerHeight || 700;
    $$('#pricePanels .grp.is-open').forEach(function (g) {
      var r = g.getBoundingClientRect(), vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      var gid = g.getAttribute('data-group-id');
      if (opened[gid] && vis > 0 && vis >= Math.min(r.height, vh) * (DW.minVisible || 0.4)) (byGroup[gid] || []).forEach(function (t) { out[t] = 1; });
    });
    return Object.keys(out);
  }
  function tick() {
    if (doc.visibilityState !== 'visible' || now() - lastAct > (DW.idleSeconds || 8) * 1000) return;
    var list = pageTopics.concat(homeTopics()), seen = {};
    list.forEach(function (tid) {
      if (seen[tid]) return; seen[tid] = 1;
      dw[tid] = (dw[tid] || 0) + 1;
      var n = Math.floor(dw[tid] / (DW.seconds || 25));
      if (n > (dwDone[tid] || 0) && n <= (DW.max || 3)) { dwDone[tid] = n; add(tid, W.dwell || 1.5); }
    });
  }
  if (pageTopics.length || onHome) {
    if (onHome && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { secVisible = en[0].isIntersecting; }, { threshold: 0 }).observe($('#usluge'));
    else secVisible = onHome;
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------- the card, the small button, the dialog */
  var fmt = function (tpl, v) { return String(tpl || '').replace(/\{(\w+)\}/g, function (m, k) { return v[k] == null ? m : v[k]; }); };
  var vars = function (t) { var v = { discount: t.discount || CFG.discount || 10, offer: t.offer, interest: t.interest, code: t.code, label: t.label }; v.headline = fmt(COPY.headline, v); return v; };
  var gicon = '<svg class="i" aria-hidden="true"><use href="#i-gift"/></svg>';

  function build() {
    if (el) return;
    el = doc.createElement('div');
    el.id = 'giftCard'; el.className = 'gift'; el.hidden = true; el.setAttribute('role', 'region'); el.setAttribute('data-state', 'off');
    el.innerHTML =
      '<div class="gift__card">' +
        '<span class="gift__ico" aria-hidden="true">' + gicon + '</span>' +
        '<span class="gift__tx"><b class="gift__t">' + esc(COPY.cardTitle) + '</b><span class="gift__s" id="giftSub"></span></span>' +
        '<button class="gift__go btn btn--sm" type="button" id="giftOpen" aria-haspopup="dialog">' + esc(COPY.cardOpen) + '</button>' +
        '<button class="gift__x" type="button" id="giftX" aria-label="' + esc(COPY.cardClose) + '"><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>' +
      '</div>' +
      '<button class="gift__mini" type="button" id="giftMini" aria-haspopup="dialog" aria-label="' + esc(COPY.miniLabel) + '" title="' + esc(COPY.miniLabel) + '">' + gicon + '<span class="gift__mini-t">' + esc(COPY.miniLabel) + '</span></button>';
    body.appendChild(el);
    $('#giftSub', el).textContent = CFG.demo ? COPY.demoBadge : COPY.cardSub;
    $('#giftOpen', el).addEventListener('click', function () { reveal(cardTopic); });
    $('#giftMini', el).addEventListener('click', function () { reveal(cardTopic); });
    $('#giftX', el).addEventListener('click', function () { switchOff(cardTopic); });
    window.addEventListener('scroll', lift, { passive: true });
    window.addEventListener('resize', lift);
  }
  function setState(s) {
    state = s;
    if (!el) return;
    el.setAttribute('data-state', s);
    el.hidden = s === 'off';
    el.setAttribute('aria-label', s === 'mini' ? COPY.miniLabel : COPY.cardTitle);
    if (s === 'off') el.classList.remove('is-in');
    else requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('is-in'); }); });
    lift();
  }
  /* the card sits above the mobile action bar (measured, so it also follows when the bar slides away), like the back-to-top button */
  var liftQ = false, liftT = 0;
  function measureLift() {
    if (!el) return;
    var y = 0, bar = $('#abar');
    if (bar) {
      var cs = getComputedStyle(bar);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') { var r = bar.getBoundingClientRect(); if (r.height > 0 && r.top < innerHeight - 2 && parseFloat(cs.opacity || '1') > 0.5) y = Math.max(0, innerHeight - r.top); }
    }
    el.style.setProperty('--lift', Math.round(y) + 'px');
  }
  function lift() {
    if (!el) return;
    if (!liftQ) { liftQ = true; requestAnimationFrame(function () { liftQ = false; measureLift(); }); }
    clearTimeout(liftT); liftT = setTimeout(measureLift, 420);   // the bar animates away / back: measured again when it settled
  }

  function showCard(tid, demo) {
    var t = topicById[tid]; if (!t) return;
    build(); cardTopic = tid; demoMode = !!demo;
    setState('card');
    clearTimeout(shownTimer);
    if (!demo) shownTimer = setTimeout(markShown, CARD.minVisibleMs || 4000);
  }
  function markShown() {
    if (state !== 'card' || !cardTopic || demoMode) return;
    var o = read(); if (!o.sh[cardTopic]) { o.sh[cardTopic] = now(); write(o); sessionShown(1); }
  }
  function showMini(tid) { build(); cardTopic = tid; demoMode = false; setState('mini'); }
  function switchOff(tid) {   // "Ne prikazuj više" and the cross of the card: this offer never comes back
    clearTimeout(shownTimer);
    if (tid && !demoMode) { var o = read(); o.of[tid] = now(); o.sh[tid] = o.sh[tid] || now(); write(o); }
    cardTopic = null; setState('off');
  }

  /* what to show now: a topic that reached the threshold and was neither shown nor switched off; else the small button of an opened offer */
  function evaluate() {
    if (demoMode || state === 'card') return;
    if (Sh && Sh.isOpen()) return;                                               // a dialog or the search is open: "lsd:overlay-closed" asks again
    if (doc.visibilityState !== 'visible') return;
    var f = doc.activeElement; if (f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) return;   // never over someone who is typing
    var o = read(), best = null;
    CFG.topics.forEach(function (t) {
      var sc = o.s[t.id] || 0;
      if (sc >= TH - 0.001 && !o.of[t.id] && !o.sh[t.id] && (!best || sc > best.sc)) best = { id: t.id, sc: sc };
    });
    if (best && sessionShown(0) < (CARD.maxPerSession || 1)) { showCard(best.id, false); return; }
    var open = null;
    Object.keys(o.op).forEach(function (k) { if (topicById[k] && !o.of[k] && (!open || o.op[k] > o.op[open])) open = k; });
    if (open && state === 'off') showMini(open);
  }
  function schedule() { clearTimeout(evalTimer); evalTimer = setTimeout(evaluate, CARD.delayMs || 1600); }
  doc.addEventListener('lsd:overlay-closed', schedule);
  doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible') schedule(); });
  window.addEventListener('pageshow', schedule);

  /* ---------------------------------------------------------------- the dialog: the reveal */
  var GIFT_SVG =
    '<svg class="gift__svg" viewBox="0 0 160 124" width="160" height="124" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="gfoil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B67851"/><stop offset=".42" stop-color="#E0A878"/><stop offset=".72" stop-color="#C98E62"/><stop offset="1" stop-color="#B67851"/></linearGradient>' +
      '<radialGradient id="gglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FAF9F4"/><stop offset=".6" stop-color="#EFEAF8"/><stop offset="1" stop-color="#EFEAF8" stop-opacity="0"/></radialGradient></defs>' +
      '<circle class="g-glow" cx="80" cy="66" r="60" fill="url(#gglow)"/>' +
      '<g class="g-box"><rect x="38" y="64" width="84" height="52" rx="6" fill="#E5E2D9" stroke="url(#gfoil)" stroke-width="1.4"/><rect x="74" y="64" width="12" height="52" fill="url(#gfoil)" opacity=".92"/></g>' +
      '<g class="g-lid"><rect x="32" y="46" width="96" height="20" rx="5" fill="#DDD9CF" stroke="url(#gfoil)" stroke-width="1.4"/><rect x="74" y="46" width="12" height="20" fill="url(#gfoil)"/>' +
        '<path d="M80 46c-4-14-22-18-24-8s14 8 24 8zM80 46c4-14 22-18 24-8s-14 8-24 8z" fill="none" stroke="url(#gfoil)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<g class="g-sp"><path style="--d:0" d="M20 70.5 21.9 76 27.5 78 21.9 80 20 85.5 18.1 80 12.5 78 18.1 76z" fill="#9471D3"/>' +
        '<path style="--d:90" d="M141 19.5 142.7 24.3 147.5 26 142.7 27.7 141 32.5 139.3 27.7 134.5 26 139.3 24.3z" fill="#B67851"/>' +
        '<path style="--d:160" d="M137 68.5 138.4 72.6 142.5 74 138.4 75.4 137 79.5 135.6 75.4 131.5 74 135.6 72.6z" fill="#3F6E5E"/>' +
        '<path style="--d:230" d="M29 99.4 30.2 102.8 33.6 104 30.2 105.2 29 108.6 27.8 105.2 24.4 104 27.8 102.8z" fill="#B67851"/>' +
        '<circle style="--d:120" cx="60" cy="14" r="2.4" fill="#9471D3"/><circle style="--d:200" cx="104" cy="10" r="2" fill="#3F6E5E"/></g>' +
    '</svg>';

  function buildDlg() {
    if (dlg) return;
    dlg = doc.createElement('div');
    dlg.id = 'giftDlg'; dlg.className = 'sheet gift-dlg'; dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'giftTitle'); dlg.hidden = true;
    dlg.innerHTML =
      '<div class="sheet__scrim" data-close></div>' +
      '<div class="sheet__panel gift-dlg__panel">' +
        '<button class="sheet__x" type="button" aria-label="' + esc(COPY.close) + '" data-close><svg class="i" aria-hidden="true"><use href="#i-x"/></svg></button>' +
        '<span class="chip chip--line gift__badge" id="giftBadge" hidden></span>' +
        '<div class="gift__stage" aria-hidden="true">' + GIFT_SVG + '</div>' +
        '<div class="gift__offer">' +
          '<p class="eyebrow" id="giftEyebrow"></p>' +
          '<h2 id="giftTitle" class="sheet__t gift__h" tabindex="-1" data-autofocus></h2>' +
          '<p class="gift__p" id="giftBody"></p>' +
          '<p class="gift__lbl" id="giftGroupsLbl"></p>' +
          '<ul class="gift__groups" id="giftGroups"></ul>' +
          '<div class="gift__code"><span class="gift__codel" id="giftCodeLbl"></span><b id="giftCode"></b></div>' +
          '<div class="gift__val" id="giftVal"></div>' +
          '<div class="gift__acts"><button class="btn btn--green gift__wa" type="button" id="giftWa" data-book="wa" data-return="giftMini" aria-haspopup="dialog"><svg class="i" aria-hidden="true"><use href="#i-chat"/></svg><span id="giftWaT" class="gift__wat"></span></button>' +
          '<button class="gift__hide" type="button" id="giftHide"></button></div>' +
        '</div>' +
      '</div>';
    body.appendChild(dlg);
    $('#giftHide', dlg).addEventListener('click', function () { var tid = cardTopic; if (Sh) Sh.closeOv(true); switchOff(tid); });
    /* the groups are links into the price list; on the home they open in place */
    $('#giftGroups', dlg).addEventListener('click', function (e) {
      var a = e.target.closest('a[data-grp]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
      if (onHome && window.LSDApp && window.LSDApp.goGroup) {
        e.preventDefault();
        var p = a.getAttribute('data-grp').split(':');
        if (Sh) Sh.closeOv(true);
        setTimeout(function () { window.LSDApp.goGroup(p[0], +p[1], ''); }, 60);
      }
    });
  }
  function fillDlg(tid) {
    var t = topicById[tid], v = vars(t), q = function (id) { return $('#' + id, dlg); };
    q('giftEyebrow').textContent = COPY.eyebrow;
    var badge = q('giftBadge'); badge.hidden = !CFG.demo; badge.textContent = CFG.demo ? COPY.demoBadge : '';
    /* the percentage is set in foil, the rest of the headline in the text colour */
    var h = q('giftTitle'), pct = String(v.discount) + '%';
    var nw = function (html) { return html.replace(/[^\s<>&;]+-[^\s<>&;]+/g, '<span class="nw">$&</span>'); };   // a word with a hyphen ("anti-aging") stays in one piece
    h.innerHTML = nw(esc(v.headline).replace(esc(pct), '<span class="gift__pct">' + esc(pct) + '</span>'));
    q('giftBody').innerHTML = nw(esc(fmt(COPY.body, v)));
    q('giftGroupsLbl').textContent = COPY.groupsTitle;
    q('giftCodeLbl').textContent = COPY.codeLabel; q('giftCode').textContent = t.code;
    q('giftVal').innerHTML = '<p>' + esc(t.validity || COPY.validity) + '</p>' + (CFG.demo ? '<p class="gift__demo">' + esc(COPY.demoNote) + '</p>' : '');
    q('giftWaT').textContent = COPY.book;
    q('giftHide').textContent = COPY.hide;
    var wa = q('giftWa');
    wa.setAttribute('data-wa-msg', fmt(COPY.wa, v)); wa.setAttribute('data-book-label', fmt(COPY.waLabel, v));
    var ul = q('giftGroups');
    var fillGroups = function () {
      ul.innerHTML = (t.offerGroups || []).map(function (gid) {
        var g = window.LSDSearch && window.LSDSearch.group && window.LSDSearch.group(gid); if (!g) return '';
        var sub = g.tabLabel + ' · ' + g.n + ' usluga';
        return '<li><a class="gift__g" href="' + esc(ROOT + 'index.html?grupa=' + g.tabId + '-' + g.gi + '#usluge') + '" data-grp="' + g.tabId + ':' + g.gi + '"><span><b>' + esc(g.title) + '</b><i>' + esc(sub) + '</i></span><span class="sg__go"><svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></span></a></li>';
      }).join('');
    };
    if (window.LSDSearch && window.LSDSearch.ready) window.LSDSearch.ready(fillGroups); else fillGroups();
  }
  function reveal(tid) {
    var t = topicById[tid]; if (!t || !Sh) return;
    build(); buildDlg();
    if (!demoMode) { var o = read(); if (!o.sh[tid]) { o.sh[tid] = now(); sessionShown(1); } o.op[tid] = now(); write(o); }
    clearTimeout(shownTimer);
    cardTopic = tid; setState('mini');                         // the card steps back into the small round button, which also gets the focus when the dialog closes
    fillDlg(tid);
    dlg.classList.remove('is-revealed');
    Sh.openOv(dlg, $('#giftMini', el));
    setTimeout(function () { dlg.classList.add('is-revealed'); }, RM ? 0 : 520);
  }
  doc.addEventListener('lsd:overlay-closed', function () { setTimeout(function () { if (dlg && !dlg.classList.contains('is-open')) dlg.classList.remove('is-revealed'); }, 520); });   // after the sheet has faded out: the next opening plays the reveal again

  /* ---------------------------------------------------------------- start */
  var dm = /[?&]demo-iznenadjenje=([a-z0-9-]+)/i.exec(qs);
  if (dm && topicById[dm[1].toLowerCase()]) {
    var dtid = dm[1].toLowerCase(), auto = hasParam('otkrij');
    var go = function () {
      demoMode = true; build(); cardTopic = dtid;
      if (auto) reveal(dtid); else showCard(dtid, true);
    };
    if (doc.readyState === 'complete') setTimeout(go, 500); else window.addEventListener('load', function () { setTimeout(go, 500); });
  } else {
    schedule();
  }

  /* for tests and for the owner: LSDPersonalize.open('akne') shows the dialog of a topic without touching the points (the same as ?demo-iznenadjenje=akne&otkrij) */
  window.LSDPersonalize = {
    topics: CFG.topics.map(function (t) { return t.id; }),
    score: function (id) { return read().s[id] || 0; },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } mem = null; },
    open: function (id) { if (!topicById[id]) return false; demoMode = true; build(); reveal(id); return true; }
  };
})();
