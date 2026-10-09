'use strict';
// ====================== 1.2.0: pages, Home, Me and Settings ======================
// more line icons
ICONS.cog = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>';
ICONS.calendar = '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>';
ICONS.activity = '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>';
ICONS.moon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
ICONS.globe = '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>';
ICONS.eye = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
ICONS.shield = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>';
ICONS.sliders = '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>';
ICONS.key = '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L21 2M16 7l3 3"/>';
ICONS.box = '<path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>';
ICONS.sparkle = '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>';
ICONS.camera = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';
ICONS.chevron = '<path d="M9 18l6-6-6-6"/>';
ICONS.home = '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>';
ICONS.lockc = '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>';
IC.home = '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/></svg>';
TABS = [['home', 'Home'], ['msgs', 'Messages'], ['friends', 'Friends'], ['lib', 'Library'], ['me', 'Me']];
if (!ls.get('tab') || ls.get('tab') === 'themes') S.tab = 'home';

// ---------- small helpers shared by the new pages ----------
var NICKS = function () { try { return JSON.parse(ls.get('nicks') || '{}'); } catch (e) { return {}; } };
var FAVF = function () { try { return JSON.parse(ls.get('favf') || '[]'); } catch (e) { return []; } };
nameHtml = function (p) { var u = p.uid || p.peer, nk = u && NICKS()[u]; return esc(nk || p.name) + (p.owner ? tickSvg(true) : p.verified ? tickSvg(false) : ''); };
function greeting() { var h = new Date().getHours(); return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function agoShort(t) { return ago(t); }
function money(n) { return Number(n || 0).toLocaleString(); }
function lsSize() { var n = 0; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || '').length; } } catch (e) { } return n; }
function fmtSize(n) { return n < 1024 ? n + ' B' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (Math.round(n / 104857.6) / 10) + ' MB'; }

// ---------- pages: full-screen screens that slide in over the tabs ----------
var PGS = [];
function openPage(key, title, build, opts) {
  opts = opts || {}; hp('tap');
  var el = document.createElement('div'); el.className = 'pg'; el.dataset.key = key;
  el.innerHTML = '<div class="hdr pgh"><button class="btn ghost sm pgback" aria-label="Back">' + ic('back', 18) + '</button><h1 class="pgt">' + esc(title) + '</h1>' + (opts.right || '') + '</div><div class="pgbody"></div>';
  $('#pages').appendChild(el);
  var page = { key: key, el: el, body: el.querySelector('.pgbody'), title: function (t) { el.querySelector('.pgt').textContent = t; }, close: function () { closePage(page); } };
  PGS.push(page);
  var show = function () { el.classList.add('open'); }; requestAnimationFrame(show); setTimeout(show, 80);
  el.querySelector('.pgback').onclick = function () { closePage(page); };
  try { build(page.body, page); } catch (e) { page.body.innerHTML = '<div class="empty">Something went wrong opening this page.</div>'; reportError('page ' + key + ': ' + e.message); }
  return page;
}
function closePage(page) {
  page = page || PGS[PGS.length - 1]; if (!page) return; var i = PGS.indexOf(page); if (i < 0) return; PGS.splice(i, 1); page.el.classList.remove('open'); if (page.onClose) page.onClose();
  setTimeout(function () { if (page.el.parentNode) page.el.remove(); }, 450);
}
function closeAllPages() { while (PGS.length) closePage(PGS[PGS.length - 1]); }

// ---------- go(): the tabs, plus Themes which is a screen reached from Home and Settings ----------
go = function (t) {
  if (t === 'themes') S.prev = S.tab !== 'themes' ? S.tab : (S.prev || 'home');
  S.tab = t; if (t !== 'themes') ls.set('tab', t);
  document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
  var vw = $('#view'); vw.scrollTop = 0; vw.__h = null; vw.classList.remove('anim'); void vw.offsetWidth; vw.classList.add('anim'); clearTimeout(go.t); go.t = setTimeout(function () { vw.classList.remove('anim'); }, 900);
  ({ home: renderHome, msgs: renderMsgs, friends: renderFriends, lib: renderLib, themes: renderThemes, me: renderMe })[t]();
};
refreshTab = function () {
  var t = S.tab; tick(); S.feedAt = 0;
  if (t === 'home') homeLoad(true);
  else if (t === 'lib') { if (LIB.tab === 'wish') fetchWish().then(function () { if (S.tab === 'lib') libWish(); }); else if (LIB.tab === 'stats') libStats(); else fetchGames().then(function () { if (S.tab === 'lib') libGames(); }); }
  else if (t === 'themes') renderThemes(true);
  else if (t === 'me') api('GET', '/me').then(function (m) { if (m.steamid) { S.me = Object.assign(S.me, m); cset('me', S.me); if (S.tab === 'me') renderMe(); } });
};
openFromNotif = function (target) {
  target = String(target);
  if (target === '#friends') { go('friends'); return; }
  if (target.indexOf('#tab:') === 0) { var tb = target.slice(5); if (TABS.some(function (x) { return x[0] === tb; })) go(tb); return; }
  if (target === '#addfriend') { go('friends'); setTimeout(addFriend, 500); return; }
  if (target.indexOf('game:') === 0) { go('lib'); openGame(+target.slice(5)); return; }
  go('msgs'); openChat(target);
};
window.openFromNotif = openFromNotif;
window.onBack = function () {
  if ($('#viewer').classList.contains('on')) { $('#viewer').classList.remove('on'); return true; }
  if ($('#sheet').classList.contains('open')) { closeSheet(); return true; }
  if (GP.open) { closeGame(); return true; }
  if (PGS.length) { closePage(); return true; }
  if (C && C.id && !wide()) { closeChat(); return true; }
  if (S.tab === 'themes') { go(S.prev || 'home'); return true; }
  if (S.tok && S.tab !== 'home') { go('home'); return true; }
  return false;
};

// ---------- my profile (level, frame, title, banner...) loaded once so every screen can use it ----------
function loadMyProfile(force) {
  if (!S.me || !S.me.uid) return; if (S.myProf && !force && Date.now() - S.myProfAt < 300000) return; S.myProfAt = Date.now();
  api('GET', '/social/profile?uid=' + S.me.uid).then(function (p) { if (!p.uid) return; S.myProf = p; S.myStats = p.stats; cset('myprof', p); var a = $('#hav'); if (a) a.innerHTML = avFrame(S.me.avatar, p.custom && p.custom.frame, 42); });
}
var _tick0 = tick;
tick = function () { _tick0(); setTimeout(function () { loadMyProfile(); flushQueue && flushQueue(); }, 600); };

// ---------- Home ----------
var HOME = { loading: false };
function activeEvent() {
  var now = new Date(), y = now.getFullYear(), found = null;
  (SLDATA.events || []).forEach(function (e) { [y - 1, y].forEach(function (yy) { var s = new Date(yy, e.s[0] - 1, e.s[1]), en = new Date(yy, e.e[0] - 1, e.e[1], 23, 59, 59); if (now >= s && now <= en) found = Object.assign({ from: s, to: en }, e); }); });
  return found;
}
function homeLoad(force) {
  if (HOME.loading) return; if (!force && S.feedAt && Date.now() - S.feedAt < 120000) return; HOME.loading = true; S.feedAt = Date.now();
  var ps = [api('GET', '/social/feed').then(function (r) { if (r.items) { S.feed = r.items; cset('feed', r.items); } }), ensureGames().catch(function () { })];
  if (ls.get('saleAlerts') === '1') ps.push(api('GET', '/me/deals').then(function (r) { if (r.deals) { S.deals = r.deals; cset('deals', r.deals); } }));
  Promise.all(ps).then(function () { HOME.loading = false; if (S.tab === 'home') renderHome(); }, function () { HOME.loading = false; });
}
function recapNumbers() {
  var g = S.games || cget('games') || [], two = g.reduce(function (s, x) { return s + x.playtime_2weeks; }, 0), rec = g.filter(function (x) { return x.playtime_2weeks > 0; }).sort(function (a, b) { return b.playtime_2weeks - a.playtime_2weeks; });
  return { hours: Math.round(two / 6) / 10, games: rec.length, top: rec.slice(0, 3), all: g.length };
}
function renderHome() {
  var v = $('#view'), me = S.me || {}, ov = S.ov, feed = S.feed || cget('feed'), deals = S.deals || cget('deals'), games = S.games || cget('games');
  if (feed && !S.feed) S.feed = feed; if (deals && !S.deals) S.deals = deals; if (games && !S.games) S.games = games;
  var cust = (S.myProf && S.myProf.custom) || (cget('myprof') || {}).custom || {};
  var h = '<div class="hdr homehdr"><button class="homeav" id="hav" aria-label="My profile">' + avFrame(me.avatar, cust.frame, 42) + '</button><div class="grow"><div class="sub">' + greeting() + '</div><div class="name" style="font-size:1.2em">' + esc(me.name || '') + (me.owner ? tickSvg(true) : me.verified ? tickSvg(false) : '') + '</div></div><button class="btn ghost sm iconb" id="hsearch" aria-label="Search">' + ic('search', 18) + '</button><button class="btn ghost sm iconb" id="hset" aria-label="Settings">' + ic('cog', 18) + '</button></div><div class="pad">';
  // quick numbers
  var online = ov ? ov.friends.filter(function (f) { return f.online; }).length : 0, req = ov ? ov.incoming.length : 0, unread = ov ? ov.unread : 0, dn = deals ? deals.length : 0;
  h += '<div class="chips2">' + [['msgs', 'msg', unread, 'unread'], ['friends', 'users', online, 'online'], ['friends', 'user', req, 'requests'], ['deals', 'zap', dn, 'on sale']].map(function (x) { return '<button class="chip2" data-go="' + x[0] + '"><span class="ci">' + ic(x[1], 17) + '</span><b>' + x[2] + '</b><span>' + x[3] + '</span></button>'; }).join('') + '</div>';
  var ev = activeEvent();
  if (ev) h += '<button class="card evcard" data-act="events"><div class="name">' + ic('calendar', 17) + esc(ev.n) + '<span class="chip gold">Now on</span></div><div class="sub wrap" style="margin-top:4px">' + esc(ev.b.slice(0, 140)) + '</div></button>';
  if (newsUnseen()) h += '<button class="card newscard" data-act="news"><div class="name">' + ic('bell', 17) + 'There is news for you</div><div class="sub">Announcements and polls from SteamLite</div></button>';
  // pick up where you left off
  var rec = games ? games.filter(function (x) { return x.playtime_2weeks > 0; }).sort(function (a, b) { return b.playtime_2weeks - a.playtime_2weeks; }).slice(0, 8) : [];
  if (!rec.length && games) rec = games.slice().sort(function (a, b) { return b.playtime_forever - a.playtime_forever; }).slice(0, 8);
  h += '<div class="sec">' + (games && games.some(function (x) { return x.playtime_2weeks > 0; }) ? 'Pick up where you left off' : 'Your top games') + '</div>';
  h += rec.length ? '<div class="hscroll">' + rec.map(function (g) { return '<div class="hcard" data-gp="' + g.appid + '">' + gi(g.appid, g.name) + '<div class="hn">' + esc(g.name) + '</div><div class="sub">' + (g.playtime_2weeks ? (Math.round(g.playtime_2weeks / 6) / 10) + ' h recently' : Math.round(g.playtime_forever / 60) + ' h total') + '</div></div>'; }).join('') + '</div>' : (games ? '<div class="sub">Your games will show here.</div>' : '<div class="hscroll">' + skel(3, true) + '</div>');
  // friends online
  var fo = ov ? ov.friends.filter(function (f) { return f.online; }).sort(function (a, b) { return (b.playing ? 1 : 0) - (a.playing ? 1 : 0); }).slice(0, 12) : [];
  if (ov) { h += '<div class="sec">Friends online</div>'; h += fo.length ? '<div class="hscroll">' + fo.map(function (f) { return '<div class="fcard" data-pf="' + f.uid + '"><div class="av"' + avStyle(f.avatar) + '><i class="dot ' + (f.playing ? 'play' : 'on') + '"></i></div><div class="hn">' + esc((NICKS()[f.uid] || f.name).split(' ')[0]) + '</div><div class="sub">' + (f.playing ? esc(f.playing.name) : 'Online') + '</div></div>'; }).join('') + '</div>' : '<div class="sub">Nobody is online right now.</div>'; }
  // sales on the wishlist
  if (deals && deals.length) h += '<div class="sec">On sale from your wishlist</div><div class="hscroll">' + deals.slice(0, 8).map(function (d) { return '<div class="hcard" data-gp="' + d.appid + '">' + gi(d.appid, d.name) + '<div class="hn">' + esc(d.name) + '</div><div class="sub"><span class="off">-' + d.pct + '%</span> ' + esc(d.price) + '</div></div>'; }).join('') + '</div>';
  // activity
  h += '<div class="sec">Friend activity</div>';
  if (!feed && !S.feed) h += skel(2); else if (!(S.feed || []).length) h += '<div class="sub">Quiet for now. Things your friends do show up here.</div>'; else h += '<div class="card" style="padding:4px 10px">' + (S.feed || []).slice(0, 4).map(feedRow).join('') + '</div><button class="btn ghost sm" data-act="feed">See all activity</button>';
  // recap
  var rc = recapNumbers();
  if (games) h += '<button class="card recapcard" data-act="recap"><div class="sub">Your last two weeks</div><div class="big">' + rc.hours + ' <span>hours</span></div><div class="sub">' + (rc.top[0] ? 'Mostly ' + esc(rc.top[0].name) : 'Nothing played yet') + ' · tap for your recap</div></button>';
  // quick actions
  h += '<div class="sec">Explore</div><div class="qgrid">' + [['themes', 'sliders', 'Themes'], ['compare', 'users', 'Compare'], ['ach', 'award', 'Achievements'], ['trophy', 'trophy', 'Trophy room'], ['events', 'calendar', 'Events'], ['lb', 'chart', 'Leaderboard'], ['feed', 'activity', 'Activity'], ['recap', 'sparkle', 'Recap']].map(function (q) { return '<button class="qa" data-act="' + q[0] + '"><span class="qi">' + ic(q[1], 22) + '</span><span>' + q[2] + '</span></button>'; }).join('') + '</div>';
  setHtml(v, h + '</div>');
  v.onclick = function (e) {
    var g = e.target.closest('[data-go]'), a = e.target.closest('[data-act]'), pf = e.target.closest('[data-pf]'), gp = e.target.closest('[data-gp]');
    if (e.target.closest('#hav')) return openProfile(S.me.uid); if (e.target.closest('#hset')) return openSettings(); if (e.target.closest('#hsearch')) return openSearch();
    if (g) { hp('tap'); if (g.dataset.go === 'deals') { if (S.deals && S.deals.length) openGame(S.deals[0].appid); else toast('Turn on sale alerts in Settings to see deals.'); } else go(g.dataset.go); return; }
    if (pf) return openProfile(pf.dataset.pf); if (gp) return;   // game cards are handled by the global click handler
    if (a) runAct(a.dataset.act);
  };
  homeLoad();
}
function runAct(k) {
  hp('tap');
  ({ themes: function () { go('themes'); }, compare: function () { openCompare(); }, ach: openAchievements, trophy: openTrophy, events: openEvents, lb: openLeaderboard, feed: openFeed, recap: openRecap, news: openNews, settings: openSettings, search: openSearch, profile: function () { openProfile(S.me.uid); }, edit: openEditProfile })[k]();
}
function feedRow(x) {
  return '<div class="row frow" ' + (x.appid ? 'data-gp="' + x.appid + '"' : 'data-pf="' + x.uid + '"') + '><div class="av sm"' + avStyle(x.avatar) + '></div><div class="grow"><div class="sub" style="white-space:normal;color:var(--text)"><b>' + esc(NICKS()[x.uid] || x.name) + '</b> ' + esc(x.text) + '</div><div class="sub">' + ago(x.at) + '</div></div></div>';
}

// ---------- Me: the hub ----------
renderMe = function () {
  var m = S.me, v = $('#view'), p = S.myProf || cget('myprof') || {}, c = p.custom || {}, st = p.stats;
  var h = '<div class="hdr"><h1>Me</h1><button class="btn ghost sm iconb" id="mset" aria-label="Settings">' + ic('cog', 18) + '</button></div><div class="pad">' +
    '<button class="card mecard" id="mecard" style="background:linear-gradient(135deg,' + (c.accent || 'var(--acc)') + ',var(--card) 75%)"><div class="medrow">' + avFrame(m.avatar, c.frame, 64) + '<div class="grow" style="text-align:left"><div class="name" style="font-size:1.25em">' + nameHtml(m) + '</div>' + (c.title ? '<div class="sub">' + esc(c.title) + '</div>' : '') + '<div class="chips" style="margin-top:6px">' + (st ? '<span class="chip">Level ' + st.level + '</span>' : '') + (p.prestige ? '<span class="chip gold">Prestige ' + p.prestige + '</span>' : '') + (m.owner ? '<span class="chip gold">Owner</span>' : '') + '</div></div>' + ic('chevron', 20) + '</div></button>' +
    '<div class="card"><div class="sub">Your SteamLite code</div><div style="display:flex;align-items:center;gap:10px"><b style="font-size:1.3em;letter-spacing:.04em" class="grow">' + esc(m.code) + '</b><button class="btn sm ghost" id="cpc">' + ic('copy', 15) + ' Copy</button></div></div>' +
    '<div class="menu">' + [['edit', 'edit', 'Edit profile', 'Banner, frame, title, showcase and more'], ['settings', 'cog', 'Settings', 'Notifications, privacy, look and more'], ['themes', 'sliders', 'Themes', 'Official and community themes'], ['ach', 'award', 'Achievement tracker', 'Progress across your games'], ['trophy', 'trophy', 'Trophy room', 'What you earned in SteamLite on your PC'], ['events', 'calendar', 'Events', 'Seasonal events and rewards'], ['recap', 'sparkle', 'Recap', 'Your last two weeks, shareable'], ['lb', 'chart', 'Leaderboard', 'See where you rank'], ['compare', 'users', 'Compare libraries', 'You and a friend, side by side'], ['search', 'search', 'Search', 'Games, friends and messages']].map(function (r) { return '<button class="mrow" data-act="' + r[0] + '"><span class="mi2">' + ic(r[1], 20) + '</span><span class="grow"><b>' + r[2] + '</b><span class="sub">' + r[3] + '</span></span>' + ic('chevron', 17) + '</button>'; }).join('') + '</div>' +
    '<div class="sub" style="text-align:center;margin-top:14px">SteamLite Mobile ' + esc(CUR) + '</div></div>';
  v.__h = null; v.innerHTML = h;
  $('#cpc').onclick = function () { N('copy', m.code); toast('Copied'); };
  $('#mset').onclick = openSettings; $('#mecard').onclick = function () { openProfile(S.me.uid); };
  v.onclick = function (e) { var a = e.target.closest('[data-act]'); if (a) runAct(a.dataset.act); };
  loadMyProfile(true);
};

// ---------- Settings ----------
function row2(icon, title, sub, control, keys) { return '<div class="srow" data-k="' + esc((title + ' ' + (keys || '') + ' ' + sub).toLowerCase()) + '"><span class="mi2">' + ic(icon, 19) + '</span><div class="grow"><b>' + title + '</b>' + (sub ? '<div class="sub wrap">' + sub + '</div>' : '') + '</div>' + (control || '') + '</div>'; }
function secCard(id, icon, title, inner) { return '<div class="ssec" data-sec="' + id + '"><div class="sec">' + ic(icon, 15) + ' ' + title + '</div><div class="card">' + inner + '</div></div>'; }
var NT = [['msg', 'Messages', 'New chat messages and poll starts'], ['friend', 'Friend requests', 'When someone adds you or accepts'], ['react', 'Reactions', 'When someone reacts to your message'], ['deal', 'Sale alerts', 'Wishlist games going on sale'], ['streak', 'Streak reminders', 'When a friend streak is about to end']];
function ntPrefs() { var o = {}; NT.forEach(function (t) { o[t[0]] = ls.get('nt_' + t[0]) !== '0'; }); return o; }
function pushNtPrefs() { N('setNotifTypes', JSON.stringify(ntPrefs())); }
function dndState() { try { return JSON.parse(ls.get('dnd') || 'null') || { on: false, from: '22:00', to: '08:00' }; } catch (e) { return { on: false, from: '22:00', to: '08:00' }; } }
function pushDnd() { var d = dndState(), mins = function (s) { var p = String(s).split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }; N('setDnd', !!d.on, mins(d.from), mins(d.to)); }
var LANGS = [['en', 'English'], ['bg', 'Български'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['pt', 'Português'], ['it', 'Italiano']];
function openSettings() {
  openPage('settings', 'Settings', function (b) {
    var m = S.me, canLock = N('canLock') === true, d = dndState(), nt = ntPrefs(), c = (S.myProf && S.myProf.custom) || {};
    b.innerHTML = '<input class="in" id="sset" placeholder="Search settings" autocomplete="off" style="margin:4px 0 6px">' +
      secCard('account', 'user', 'Account', '<div class="srow"><span class="mi2" style="padding:0">' + avFrame(m.avatar, c.frame, 40) + '</span><div class="grow"><b>' + nameHtml(m) + '</b><div class="sub">Code ' + esc(m.code) + '</div></div><button class="btn sm ghost" id="cpc2">' + ic('copy', 14) + ' Copy</button></div>' +
        '<button class="mrow slim" id="s-edit" data-k="edit profile banner frame title showcase bio"><span class="mi2">' + ic('edit', 19) + '</span><span class="grow"><b>Edit profile</b></span>' + ic('chevron', 16) + '</button>' +
        '<button class="mrow slim" id="s-prof"><span class="mi2">' + ic('user', 19) + '</span><span class="grow"><b>View my profile</b></span>' + ic('chevron', 16) + '</button>' +
        '<button class="mrow slim bad" id="s-out" data-k="sign out log out"><span class="mi2">' + ic('x', 19) + '</span><span class="grow"><b>Sign out</b></span></button>' +
        '<button class="mrow slim bad" id="s-del" data-k="delete account remove"><span class="mi2">' + ic('trash', 19) + '</span><span class="grow"><b>Delete my SteamLite account</b></span></button>') +
      secCard('look', 'sliders', 'Appearance', '<div class="sub">Mode</div><div class="seg" style="margin:6px 0 12px" id="smode">' + [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']].map(function (x) { return '<button data-m="' + x[0] + '" class="' + (Look.mode === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="sub">Text size</div><div class="seg" style="margin:6px 0 12px" id="ssize">' + [[0.9, 'Small'], [1, 'Normal'], [1.12, 'Large'], [1.25, 'Huge']].map(function (x) { return '<button data-z="' + x[0] + '" class="' + (Look.size === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        row2('sliders', 'Theme', 'Current: ' + esc((Look.theme && (Look.theme.id || 'custom')) || 'default') + '. Official and community themes.', '<button class="btn sm ghost" id="s-theme">Browse</button>', 'colours colors themes') +
        row2('activity', 'Reduce motion', 'Fewer animations (also follows the phone setting)', sw('t-rm', ls.get('reduceMotion') === '1'), 'animations') +
        row2('globe', 'Language', 'Main screens and menus', '<select class="in" id="s-lang" style="width:auto">' + LANGS.map(function (l) { return '<option value="' + l[0] + '"' + ((ls.get('lang') || 'en') === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select>', 'translate')) +
      secCard('notif', 'bell', 'Notifications', '<div id="ncheck"></div><div class="opt" data-k="message notifications mute all"><div class="grow"><b>Message notifications</b><div class="sub wrap">Turn all SteamLite notifications on or off.</div></div>' + sw('tnot', ls.get('muteAll') !== '1') + '</div>' +
        NT.map(function (t) { return '<div class="opt" data-k="' + t[1].toLowerCase() + ' ' + t[2].toLowerCase() + '"><div class="grow"><b>' + t[1] + '</b><div class="sub wrap">' + t[2] + '</div></div>' + sw('nt-' + t[0], nt[t[0]]) + '</div>'; }).join('') +
        '<div class="opt" data-k="do not disturb quiet hours night"><span class="mi2" style="padding:0">' + ic('moon', 19) + '</span><div class="grow"><b>Do Not Disturb</b><div class="sub wrap">Notifications still arrive but make no sound or buzz between these times.</div></div>' + sw('dnd-on', d.on) + '</div>' +
        '<div class="timer" id="dndrow" style="' + (d.on ? '' : 'display:none') + '"><label>From <input type="time" class="in" id="dnd-from" value="' + esc(d.from) + '"></label><label>To <input type="time" class="in" id="dnd-to" value="' + esc(d.to) + '"></label></div>') +
      secCard('privacy', 'eye', 'Privacy', row2('eye', 'Show what I am playing', 'Friends see your online status and game.', sw('tplay', ls.get('sharePlay') !== '0'), 'online presence') +
        row2('check', 'Read receipts', 'Show "Seen" to people you chat with.', sw('p-read', true), 'seen') + row2('msg', 'Typing indicator', 'Let people see when you are typing.', sw('p-typing', true), 'typing') +
        (canLock ? row2('lockc', 'App lock', 'Ask for your fingerprint, face or PIN when you come back.', sw('tlock', ls.get('lock') === '1'), 'biometric pin') : '')) +
      secCard('steam', 'key', 'Steam connection', '<div class="srow" data-k="steam web api key"><span class="mi2">' + ic('key', 19) + '</span><div class="grow"><b>Steam Web API key</b><div class="sub wrap" id="keystat">Checking...</div></div><button class="btn sm" id="keybtn">Change</button></div>' +
        row2('zap', 'Sale alerts', 'Notify me when a wishlist game is 20% off or more. Your wishlist is sent to SteamLite Online for this.', sw('tsale', ls.get('saleAlerts') === '1'), 'wishlist discounts') +
        (S.bk ? '<div class="sub wrap" style="margin-top:6px">Synced from your PC: ' + pcFavs().length + ' favourites and ' + Object.keys(S.bk.cols || {}).length + ' collections.</div>' : '')) +
      secCard('chat', 'msg', 'Chat', row2('external', 'Link previews', 'Show a title and picture under links in messages.', sw('c-prev', ls.get('linkPrev') !== '0'), 'links data saver') + row2('zap', 'Quick replies', 'Edit the phrases you can send with one tap.', '<button class="btn sm ghost" id="s-qr">Edit</button>', 'phrases')) +
      secCard('upd', 'download', 'Updates', row2('download', 'SteamLite Mobile ' + esc(CUR), 'The app updates itself from inside. Tap to check now.', '<button class="btn sm" id="cku">Check</button>', 'version update')) +
      secCard('store', 'box', 'Storage', row2('box', 'Cached data', 'Saved chats, covers and library so the app opens fast and works offline: <b id="cachesz">' + fmtSize(lsSize()) + '</b>', '<button class="btn sm ghost" id="s-clear">Clear</button>', 'cache storage clear')) +
      secCard('about', 'info', 'About', row2('info', 'SteamLite Mobile', 'Version ' + esc(CUR) + '. Made to go with SteamLite for PC.', '', 'version about') + row2('external', 'SteamLite on GitHub', 'Source code and downloads', '<button class="btn sm ghost" id="s-gh">Open</button>', 'github') +
        '<div class="sub wrap" style="margin-top:8px">Message previews in notifications pass through Google Firebase to reach your phone. Your Steam password is never seen by SteamLite.</div>');
    // search filter
    $('#sset').oninput = function () { var q = $('#sset').value.trim().toLowerCase(); b.querySelectorAll('.ssec').forEach(function (s) { var any = false; s.querySelectorAll('.srow,.opt,.mrow').forEach(function (r) { var hit = !q || (r.dataset.k || r.innerText.toLowerCase()).indexOf(q) >= 0 || s.dataset.sec.indexOf(q) >= 0; r.style.display = hit ? '' : 'none'; if (hit) any = true; }); s.style.display = any || !q ? '' : 'none'; }); };
    // account
    $('#cpc2').onclick = function () { N('copy', m.code); toast('Copied'); }; $('#s-edit').onclick = openEditProfile; $('#s-prof').onclick = function () { openProfile(S.me.uid); };
    $('#s-out').onclick = function () { if (confirm('Sign out of SteamLite on this phone?')) { api('POST', '/logout', {}); closeAllPages(); signedOut(); } };
    $('#s-del').onclick = function () { if (confirm('Delete your SteamLite account? Your messages, friends, backups and themes on the server are removed. This cannot be undone.') && confirm('Really delete it?')) api('DELETE', '/account', {}).then(function (r) { if (r.error) return toast(r.error); closeAllPages(); signedOut(); }); };
    // look
    $('#smode').onclick = function (e) { var x = e.target.closest('button'); if (x) { Look.mode = x.dataset.m; ls.set('mode', Look.mode); Look.apply(); Look.applyTheme(); b.querySelectorAll('#smode button').forEach(function (y) { y.classList.toggle('on', y === x); }); } };
    $('#ssize').onclick = function (e) { var x = e.target.closest('button'); if (x) { Look.size = +x.dataset.z; ls.set('fsize', String(Look.size)); Look.apply(); b.querySelectorAll('#ssize button').forEach(function (y) { y.classList.toggle('on', y === x); }); } };
    $('#s-theme').onclick = function () { closeAllPages(); go('themes'); };
    $('#t-rm').onchange = function () { ls.set('reduceMotion', $('#t-rm').checked ? '1' : '0'); applyMotion(); };
    $('#s-lang').onchange = function () { ls.set('lang', $('#s-lang').value); applyLang(); };
    // notifications
    paintNotifCheck();
    $('#tnot').onchange = function () { var on = $('#tnot').checked; ls.set('muteAll', on ? '0' : '1'); N('setMuteAll', !on); if (on) { CB.notif = function (r) { if (r === 'denied') toast('Allow notifications in Android settings.'); setTimeout(paintNotifCheck, 800); }; N('askNotif'); } paintNotifCheck(); };
    NT.forEach(function (t) { $('#nt-' + t[0]).onchange = function () { ls.set('nt_' + t[0], $('#nt-' + t[0]).checked ? '1' : '0'); pushNtPrefs(); }; });
    var dsave = function () { ls.set('dnd', JSON.stringify({ on: $('#dnd-on').checked, from: $('#dnd-from').value || '22:00', to: $('#dnd-to').value || '08:00' })); $('#dndrow').style.display = $('#dnd-on').checked ? '' : 'none'; pushDnd(); };
    $('#dnd-on').onchange = dsave; $('#dnd-from').onchange = dsave; $('#dnd-to').onchange = dsave;
    // privacy
    $('#tplay').onchange = function () { var on = $('#tplay').checked; ls.set('sharePlay', on ? '1' : '0'); if (on) presenceNow(); else api('POST', '/social/presence', { game: null }); };
    api('GET', '/social/prefs').then(function (r) { if (r.ok && $('#p-read')) { $('#p-read').checked = !!r.readReceipts; $('#p-typing').checked = !!r.typing; } });
    $('#p-read').onchange = function () { api('POST', '/social/prefs', { readReceipts: $('#p-read').checked }); }; $('#p-typing').onchange = function () { api('POST', '/social/prefs', { typing: $('#p-typing').checked }); };
    if ($('#tlock')) $('#tlock').onchange = function () { ls.set('lock', $('#tlock').checked ? '1' : '0'); N('setLock', $('#tlock').checked); toast($('#tlock').checked ? 'App lock is on' : 'App lock is off'); };
    // steam
    paintKeyCard(); $('#keybtn').onclick = keySheet;
    $('#tsale').onchange = function () { var on = $('#tsale').checked; ls.set('saleAlerts', on ? '1' : '0'); if (on) { toast('Sale alerts are on'); ls.del('wlAt'); syncSales(true); CB.notif = function () { }; N('askNotif'); } else { api('DELETE', '/me/wishlist'); toast('Sale alerts are off'); } };
    // chat
    $('#c-prev').onchange = function () { ls.set('linkPrev', $('#c-prev').checked ? '1' : '0'); }; $('#s-qr').onclick = quickReplies;
    // updates, storage, about
    $('#cku').onclick = function () { checkUpdate(true); };
    $('#s-clear').onclick = function () { if (!confirm('Clear saved chats, covers and your library cache? They load again when you are online.')) return; var keys = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^(c:|himg|draft:)/.test(k)) keys.push(k); } keys.forEach(function (k) { ls.del(k); }); S.games = null; S.feed = null; S.deals = null; S.wish = null; $('#cachesz').textContent = fmtSize(lsSize()); toast('Cleared ' + keys.length + ' items'); };
    $('#s-gh').onclick = function () { N('openUrl', 'https://github.com/imnotfisy/SteamLite-Mobile'); };
  });
}
function applyMotion() { document.documentElement.classList.toggle('rm', ls.get('reduceMotion') === '1'); }
