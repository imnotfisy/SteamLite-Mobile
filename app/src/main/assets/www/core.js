'use strict';
// ====================== SteamLite Mobile: core (network, cache, look, updates, boot) ======================
var BASE = 'https://steamlite-online.bayxturtle.workers.dev';
var MEDIA = BASE + '/media/';
var LOGO = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-9.96 9.04l5.35 2.21a2.83 2.83 0 0 1 1.6-.49h.15l2.38-3.45v-.05a3.78 3.78 0 1 1 3.78 3.78h-.09l-3.4 2.43v.12a2.84 2.84 0 0 1-5.62.6l-3.83-1.58A10 10 0 1 0 12 2zM7.54 17.3l-1.23-.51a2.13 2.13 0 0 0 4.07-.47 2.13 2.13 0 0 0-2.84-2.02l1.27.52a1.57 1.57 0 1 1-1.27 2.48zm8.4-5.9a2.52 2.52 0 1 1 2.52-2.52 2.52 2.52 0 0 1-2.52 2.52zm0-.94a1.58 1.58 0 1 0-1.58-1.58 1.58 1.58 0 0 0 1.58 1.58z"/></svg>';
var QUICK = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];
var ALLE = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '😍', '🤔', '👀', '💯', '🙏', '😎', '🤣', '😭', '😡', '🥳', '💀', '✅', '❌', '🎮', '👑', '⭐', '🙌', '💪', '🤝', '😅', '🥹', '😴', '🤯', '💔'];
var $ = function (s, r) { return (r || document).querySelector(s); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } }, del: function (k) { try { localStorage.removeItem(k); } catch (e) { } } };
var cget = function (k) { try { return JSON.parse(ls.get('c:' + k) || 'null'); } catch (e) { return null; } };
var cset = function (k, v) { try { var s = JSON.stringify(v); if (s.length < 600000) ls.set('c:' + k, s); } catch (e) { } };
var N = function (f) { try { return SLNative[f].apply(SLNative, [].slice.call(arguments, 1)); } catch (e) { return undefined; } };
var hp = function (k) { N('haptic', k || 'tap'); };
var S = { tok: ls.get('tok') || '', me: null, ov: null, tab: ls.get('tab') || 'msgs', games: null, themes: null, tsort: 'top', key: undefined, offline: false };

// ---------- native callbacks (photo picker, recorder, permissions) ----------
var CB = {};
window.__cb = function (id, v) { var f = CB[id]; if (!f) return; if (id.charAt(0) === 'p') delete CB[id]; f(v); };

// ---------- network (goes through the phone, so no browser cross-site rules get in the way) ----------
var pend = {}, seq = 0;
window.__http = function (id, code, text) { var p = pend[id]; if (!p) return; delete pend[id]; p(code, text); };
function raw(method, url, headers, body) { return new Promise(function (res) { var id = 'r' + (++seq); pend[id] = function (c, t) { res({ code: c, text: t }); }; SLNative.http(id, method, url, JSON.stringify(headers || {}), body || ''); }); }
function setOffline(v) { if (S.offline === v) return; S.offline = v; $('#off').innerHTML = v ? '<div class="ob">You are offline. Showing saved data.</div>' : ''; }
function api(method, path, body) {
  var h = { 'Content-Type': 'application/json' }; if (S.tok) h.Authorization = 'Bearer ' + S.tok;
  return raw(method, BASE + path, h, body ? JSON.stringify(body) : '').then(function (r) {
    var j = {}; try { j = JSON.parse(r.text); } catch (e) { }
    if (r.code === 401 && S.tok) signedOut();
    if (r.code === 0) { j = { error: 'No connection. Check your internet.' }; setOffline(true); } else setOffline(false);
    j.http = r.code; return j;
  });
}
function toast(t) { var e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 2600); }

// ---------- small helpers ----------
function tickSvg(owner) { return owner ? '<svg class="tick" viewBox="0 0 24 24"><path fill="#f5c542" d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z"/></svg>' : '<svg class="tick" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><path d="M7 12.5l3.2 3L17 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function nameHtml(p) { return esc(p.name) + (p.owner ? tickSvg(true) : p.verified ? tickSvg(false) : ''); }
function avStyle(u) { return u ? ' style="background-image:url(\'' + esc(u) + '\')"' : ''; }
function ago(t) { var d = (Date.now() - t) / 1000; if (d < 60) return 'now'; if (d < 3600) return Math.floor(d / 60) + 'm'; if (d < 86400) return Math.floor(d / 3600) + 'h'; return Math.floor(d / 86400) + 'd'; }
function hex(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
function skel(n, g) { var h = ''; for (var i = 0; i < n; i++) h += '<div class="sk' + (g ? ' g' : '') + '"></div>'; return h; }
function setHtml(el, h) { if (!el || el.__h === h) return false; var st = el.scrollTop; el.innerHTML = h; el.__h = h; el.scrollTop = st; return true; }
function fmtDur(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
function sha256(ascii) { // used to match Steam friends to SteamLite accounts (same hash the server uses)
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  var mp = Math.pow, mw = mp(2, 32), i, j, res = '', words = [], bl = ascii.length * 8, h = [], k = [], pc = 0, ic = {};
  for (var c = 2; pc < 64; c++) { if (!ic[c]) { for (i = 0; i < 313; i += c) ic[i] = c; h[pc] = (mp(c, .5) * mw) | 0; k[pc++] = (mp(c, 1 / 3) * mw) | 0; } }
  ascii += '\x80'; while (ascii.length % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
  words[words.length] = ((bl / mw) | 0); words[words.length] = bl;
  for (j = 0; j < words.length;) {
    var w = words.slice(j, j += 16), old = h; h = h.slice(0, 8);
    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15], w2 = w[i - 2], a = h[0], e = h[4];
      var t1 = h[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & h[5]) ^ ((~e) & h[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & h[1]) ^ (a & h[2]) ^ (h[1] & h[2]));
      h = [(t1 + t2) | 0].concat(h); h[4] = (h[4] + t1) | 0;
    }
    for (i = 0; i < 8; i++) h[i] = (h[i] + old[i]) | 0;
  }
  for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (h[i] >> (j * 8)) & 255; res += ((b < 16) ? 0 : '') + b.toString(16); }
  return res;
}
var IC = {
  msgs: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>',
  friends: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/></svg>',
  lib: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M8 10v4M6 12h4M16 11h.01M18 13h.01"/></svg>',
  themes: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s-.5-2 1-2H17a4 4 0 0 0 4-4c0-5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="11" r="1"/></svg>',
  me: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
};
var TABS = [['msgs', 'Messages'], ['friends', 'Friends'], ['lib', 'Library'], ['themes', 'Themes'], ['me', 'Me']];

// ---------- look: dark / light / auto, text size, themes from the gallery ----------
var Look = {
  mode: ls.get('mode') || 'auto', size: +(ls.get('fsize') || 1), theme: null,
  isLight: function () { return Look.mode === 'light' || (Look.mode === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches); },
  apply: function () {
    document.documentElement.classList.toggle('light', Look.isLight());
    document.documentElement.style.setProperty('--fs', Look.size);
    Look.bars();
  },
  bars: function () { setTimeout(function () { var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0b0f17'; var rgb = Look.rgb(bg); var lum = rgb ? (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) : 0; N('setBars', Look.hex(rgb) || '#0b0f17', lum > 150); }, 30); },
  rgb: function (c) { var m = /^#([0-9a-f]{6})$/i.exec(c); if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4), 16)]; m = /^#([0-9a-f]{3})$/i.exec(c); if (m) return m[1].split('').map(function (x) { return parseInt(x + x, 16); }); m = /rgba?\(([^)]+)\)/.exec(c); if (m) return m[1].split(',').slice(0, 3).map(function (x) { return +x; }); return null; },
  hex: function (rgb) { return rgb ? '#' + rgb.map(function (x) { return ('0' + Math.max(0, Math.min(255, Math.round(x))).toString(16)).slice(-2); }).join('') : ''; },
  setTheme: function (t) { Look.theme = t; if (t) ls.set('theme', JSON.stringify(t)); else ls.del('theme'); Look.applyTheme(); },
  applyTheme: function () {
    var r = document.documentElement.style, v = Look.theme && Look.theme.vars;
    ['--bg', '--card', '--card2', '--acc', '--acc2', '--text', '--mut', '--line'].forEach(function (k) { r.removeProperty(k); });
    if (v) {
      var map = { '--bg-dark': '--bg', '--bg-glass': '--card', '--bg-glass-light': '--card2', '--accent-color': '--acc', '--accent-color-2': '--acc2', '--text-primary': '--text', '--text-secondary': '--mut', '--border-glass': '--line' };
      Object.keys(map).forEach(function (k) { if (v[k]) r.setProperty(map[k], v[k]); });
      if (v['--accent-color'] && !v['--accent-color-2']) r.setProperty('--acc2', v['--accent-color']);
    }
    Look.bars();
  },
  load: function () { try { Look.theme = JSON.parse(ls.get('theme') || 'null'); } catch (e) { } Look.apply(); Look.applyTheme(); }
};
if (window.matchMedia) try { matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (Look.mode === 'auto') Look.apply(); }); } catch (e) { }

// ---------- sheet, viewer ----------
function sheet(html) { $('#sheet').innerHTML = html; $('#sheet').onclick = null; $('#sheetbg').classList.add('on'); requestAnimationFrame(function () { $('#sheet').classList.add('open'); }); }
function closeSheet() { $('#sheet').classList.remove('open'); $('#sheetbg').classList.remove('on'); $('#sheet').onclick = null; }
$('#sheetbg').onclick = closeSheet;
function viewImage(src) { var v = $('#viewer'); v.innerHTML = '<img src="' + esc(src) + '">'; v.classList.add('on'); v.onclick = function () { v.classList.remove('on'); }; }

// ---------- game covers: same fallbacks as the PC app ----------
// 1 classic CDN  2 second CDN host  3 Steam store API (newer games use a hashed path)  4 capsule  5 hero  6 coloured tile
var AK = 'https://cdn.akamai.steamstatic.com/steam/apps/', CF = 'https://cdn.cloudflare.steamstatic.com/steam/apps/';
function gi(appid, name) { appid = appid | 0; return '<div class="gi" data-n="' + esc(String(name || '?').trim().charAt(0).toUpperCase() || '?') + '"><img data-app="' + appid + '" data-st="0" alt="" src="' + AK + appid + '/header.jpg"></div>'; }
var storeQ = Promise.resolve(), storeBackoff = 0, storeMiss = {};
function storeImg(id) {
  var hit = ls.get('himg' + id); if (hit) return Promise.resolve(hit);
  if (storeMiss[id] && Date.now() - storeMiss[id] < 1800000) return Promise.resolve('');
  var job = storeQ.then(function () {
    if (Date.now() < storeBackoff) return '';
    return new Promise(function (r) { setTimeout(r, 300); }).then(function () { return raw('GET', 'https://store.steampowered.com/api/appdetails?appids=' + id + '&filters=basic&cc=us&l=en', {}); }).then(function (r) {
      if (r.code === 429 || r.code === 403) { storeBackoff = Date.now() + 300000; return ''; }
      var j = null; try { j = JSON.parse(r.text); } catch (e) { } var e = j && j[id], u = e && e.success && e.data && e.data.header_image;
      if (u && /^https:\/\//.test(u)) { ls.set('himg' + id, u); return u; } storeMiss[id] = Date.now(); return '';
    }).catch(function () { return ''; });
  });
  storeQ = job.then(function () { }, function () { }); return job;
}
function imgFail(img) {
  var id = img.dataset.app, st = +img.dataset.st || 0; img.dataset.st = st + 1;
  if (st === 0) img.src = CF + id + '/header.jpg';
  else if (st === 1) storeImg(id).then(function (u) { if (u) img.src = u; else imgFail(img); });
  else if (st === 2) img.src = CF + id + '/capsule_616x353.jpg';
  else if (st === 3) img.src = CF + id + '/library_hero.jpg';
  else { if (img.parentNode) img.parentNode.classList.add('ph'); img.remove(); }
}
document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.dataset && t.dataset.app) imgFail(t); }, true);
document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.dataset && t.dataset.app) t.classList.add('ok'); }, true);

// ---------- updates (version.json in the SteamLite-Mobile repo, same idea as the PC app) ----------
var VERSION_URL = 'https://raw.githubusercontent.com/imnotfisy/SteamLite-Mobile/main/version.json';
var CUR = N('version') || '0.0.0';
function vcmp(a, b) { a = String(a).split('.').map(Number); b = String(b).split('.').map(Number); for (var i = 0; i < 3; i++) { var x = a[i] || 0, y = b[i] || 0; if (x !== y) return x > y ? 1 : -1; } return 0; }
var UPD = null;
function checkUpdate(manual) {
  return raw('GET', VERSION_URL + '?t=' + Date.now(), {}).then(function (r) {
    var j = null; try { j = JSON.parse(r.text); } catch (e) { }
    if (!j || !j.version || !/^https:\/\//.test(j.downloadUrl || '')) { if (manual) toast('Could not check for updates right now.'); return null; }
    ls.set('updAt', String(Date.now()));
    if (vcmp(j.version, CUR) > 0) { UPD = j; showUpdate(); if (manual) toast('Version ' + j.version + ' is available'); }
    else { UPD = null; $('#upd').innerHTML = ''; $('#upd').className = ''; if (manual) toast('You have the latest version (' + CUR + ')'); }
    return j;
  });
}
function showUpdate() {
  var u = UPD, el = $('#upd'); if (!u) return;
  var force = u.minVersion && vcmp(u.minVersion, CUR) > 0;
  if (!force && ls.get('updSkip') === u.version) return;
  el.className = force ? 'force' : '';
  el.innerHTML = '<div class="ub">' + (force ? '<div class="logo" style="margin:0 auto 14px">' + LOGO + '</div><b style="font-size:20px">Update required</b><br><br>' : '') + '<span>SteamLite Mobile ' + esc(u.version) + ' is ready' + (u.notes && !force ? ': ' + esc(String(u.notes).slice(0, 60)) : '') + '.</span>' + (force ? '<div class="sub wrap" style="margin-top:8px">' + esc(u.notes || 'This version is too old to keep working.') + '</div>' : '') + '<button id="updgo">Update</button>' + (force ? '' : '<button id="updx">✕</button>') + '</div>';
  $('#updgo').onclick = function () { N('openUrl', u.downloadUrl); toast('Download the file, then tap it to install'); };
  if (!force) $('#updx').onclick = function () { ls.set('updSkip', u.version); el.innerHTML = ''; };
}
function maybeCheckUpdate() { var last = +(ls.get('updAt') || 0); if (Date.now() - last > 6 * 3600 * 1000) checkUpdate(false); else if (UPD) showUpdate(); }

// ---------- error reports (appear in the admin Activity log) ----------
var errSent = 0;
function reportError(msg) { if (errSent >= 3 || !msg) return; errSent++; try { api('POST', '/client-error', { app: 'mobile', v: CUR, msg: String(msg).slice(0, 180) }); } catch (e) { } }
window.addEventListener('error', function (e) { reportError((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + (e.lineno || 0)); });
window.addEventListener('unhandledrejection', function (e) { reportError('promise: ' + (e.reason && e.reason.message || e.reason)); });

// ---------- sign in / out ----------
function showSignIn(msg) {
  $('#tabs').style.display = 'none'; closeChat(true);
  $('#view').innerHTML = '<div class="center"><div class="logo">' + LOGO + '</div><h1 style="margin:0">SteamLite</h1><div class="sub wrap" style="max-width:300px">Sign in with Steam to see your messages, friends and games on your phone. We never see your Steam password.</div><button class="btn" id="si">Sign in with Steam</button><div class="sub wrap" id="sim">' + esc(msg || '') + '</div></div>';
  $('#si').onclick = startLogin;
}
var loginN = '', loginT = 0;
function startLogin() {
  loginN = hex(16); N('openUrl', BASE + '/auth/start?n=' + loginN);
  $('#si').textContent = 'Waiting for Steam…'; $('#si').disabled = true; $('#sim').textContent = 'Finish signing in in your browser, then come back here.';
  clearInterval(loginT); var tries = 0;
  loginT = setInterval(function () {
    if (++tries > 150) { clearInterval(loginT); showSignIn('That took too long. Try again.'); return; }
    api('GET', '/auth/poll?n=' + loginN).then(function (r) { if (r.done) { clearInterval(loginT); S.tok = r.token; ls.set('tok', r.token); N('setToken', r.token); boot(); } });
  }, 2000);
}
function signedOut() {
  S.tok = ''; ls.del('tok'); S.me = null; S.ov = null; S.key = undefined; S.games = null; N('setToken', '');
  ['me', 'ov', 'games', 'wish'].forEach(function (k) { ls.del('c:' + k); }); clearInterval(S.poll); clearInterval(S.pres); showSignIn('You were signed out.');
}

// ---------- boot ----------
function boot() {
  if (!S.tok) return showSignIn();
  N('setToken', S.tok);
  var cm = cget('me'), co = cget('ov');
  if (cm && !S.me) { S.me = cm; if (co) S.ov = co; buildTabs(); go(S.tab); }   // saved copy first: opens instantly, even offline
  api('GET', '/me').then(function (m) {
    if (!m.steamid) { if (!S.me && m.http !== 401) $('#view').innerHTML = '<div class="empty">' + esc(m.error || 'Could not reach SteamLite.') + '<br><br><button class="btn" onclick="boot()">Retry</button></div>'; return; }
    var first = !S.me; S.me = Object.assign(S.me || {}, m); cset('me', S.me);
    if (first) { buildTabs(); go(S.tab); }
    clearInterval(S.poll); S.poll = setInterval(tick, 8000); tick();
    startPresence(); N('setMuteAll', ls.get('muteAll') === '1');
    if (!ls.get('notifAsked')) { ls.set('notifAsked', '1'); setTimeout(function () { CB.notif = function () { }; N('askNotif'); }, 2500); }
    var crash = N('takeCrash'); if (crash) reportError('crash: ' + crash);
    if (m.owner !== undefined) cset('me', S.me);
  });
}
function tick() {
  if (!S.me || document.hidden) return;
  api('GET', '/social/overview').then(function (o) {
    if (!o.friends) return; S.ov = o; S.me.uid = o.me.uid; cset('ov', o); badge();
    if (S.tab === 'msgs' && !(C && C.id && !wide())) renderMsgs();
    if (S.tab === 'friends') renderFriends();
  });
}
window.onResumeApp = function () { if (S.tok) { tick(); presenceNow(); } maybeCheckUpdate(); };
function buildTabs() {
  var t = $('#tabs'); t.style.display = 'flex';
  t.innerHTML = TABS.map(function (x) { return '<button data-t="' + x[0] + '">' + IC[x[0]] + x[1] + '<span class="badge" id="bd-' + x[0] + '" style="display:none"></span></button>'; }).join('');
  t.onclick = function (e) { var b = e.target.closest('button'); if (b) { hp('tap'); go(b.dataset.t); } };
  badge();
}
function badge() { var b = $('#bd-msgs'), n = S.ov ? S.ov.unread : 0; if (b) { b.style.display = n ? 'grid' : 'none'; b.textContent = n > 99 ? '99+' : n; } var f = $('#bd-friends'), k = S.ov ? S.ov.incoming.length : 0; if (f) { f.style.display = k ? 'grid' : 'none'; f.textContent = k; } }
function wide() { return window.innerWidth >= 720; }
function go(t) {
  S.tab = t; ls.set('tab', t); document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t); });
  var vw = $('#view'); vw.scrollTop = 0; vw.__h = null; vw.classList.remove('anim'); void vw.offsetWidth; vw.classList.add('anim'); clearTimeout(go.t); go.t = setTimeout(function () { vw.classList.remove('anim'); }, 900);
  ({ msgs: renderMsgs, friends: renderFriends, lib: renderLib, themes: renderThemes, me: renderMe })[t]();
}
function refreshTab() {
  var t = S.tab;
  if (t === 'lib') { S.games = null; ls.del('c:games'); S.wish = null; }
  if (t === 'themes') S.themes = null;
  tick(); go(t);
}
function openFromNotif(target) { if (target === '#friends') { go('friends'); return; } go('msgs'); openChat(target); }
window.openFromNotif = openFromNotif;

// ---------- your Steam key (saved on your account) and what you are playing ----------
function getKey() {
  if (S.key !== undefined) return Promise.resolve(S.key);
  return api('GET', '/me/key').then(function (k) { if (k.key) S.key = k.key; else if (k.http === 404) S.key = ''; return k.key || ''; });
}
function startPresence() { clearInterval(S.pres); S.pres = setInterval(presenceNow, 60000); setTimeout(presenceNow, 4000); }
function presenceNow() {
  if (!S.me || !S.tok || document.hidden || ls.get('sharePlay') === '0') return;
  getKey().then(function (k) {
    if (!k) return api('POST', '/social/presence', { game: null });
    return raw('GET', 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=' + encodeURIComponent(k) + '&steamids=' + S.me.steamid, {}).then(function (r) {
      var j = {}; try { j = JSON.parse(r.text); } catch (e) { } var p = j.response && j.response.players && j.response.players[0];
      return api('POST', '/social/presence', { game: p && p.gameid ? { appid: +p.gameid, name: p.gameextrainfo || '' } : null });
    });
  });
}

// ---------- gestures: pull to refresh, swipe between tabs ----------
(function () {
  var v = $('#view'), t0 = null, ptr = null, pulling = false, busy = false;
  function indicator() { if (!ptr) { ptr = document.createElement('div'); ptr.id = 'ptr'; ptr.innerHTML = '<div><span class="spin"></span></div>'; $('#app').insertBefore(ptr, v); ptr.style.position = 'relative'; ptr.style.flex = 'none'; } return ptr; }
  v.addEventListener('touchstart', function (e) { if (e.touches.length !== 1) return; t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, top: v.scrollTop <= 0, tg: e.target }; pulling = false; }, { passive: true });
  v.addEventListener('touchmove', function (e) {
    if (!t0 || busy) return; var dy = e.touches[0].clientY - t0.y, dx = e.touches[0].clientX - t0.x;
    if (t0.top && dy > 8 && Math.abs(dx) < dy) { pulling = true; var h = Math.min(70, dy * 0.45); indicator().style.height = h + 'px'; ptr.firstChild.style.transform = 'rotate(' + dy * 3 + 'deg)'; }
  }, { passive: true });
  v.addEventListener('touchend', function (e) {
    if (!t0) return; var c = e.changedTouches[0], dx = c.clientX - t0.x, dy = c.clientY - t0.y, was = t0; t0 = null;
    if (pulling) { var h = ptr ? parseFloat(ptr.style.height) : 0; pulling = false; if (h >= 52 && !busy) { busy = true; hp('ok'); ptr.style.height = '48px'; refreshTab(); setTimeout(function () { ptr.style.height = '0px'; busy = false; }, 900); } else if (ptr) ptr.style.height = '0px'; return; }
    // swipe left or right to change tab (not while scrolling a row of chips or typing)
    if (Math.abs(dx) > 90 && Math.abs(dy) < 45 && !(was.tg.closest && was.tg.closest('.seg,input,textarea,.sws,.qr'))) {
      var ids = TABS.map(function (x) { return x[0]; }), i = ids.indexOf(S.tab), n = dx < 0 ? i + 1 : i - 1; if (n >= 0 && n < ids.length) { hp('tap'); go(ids[n]); }
    }
  }, { passive: true });
})();

window.onBack = function () {
  if ($('#viewer').classList.contains('on')) { $('#viewer').classList.remove('on'); return true; }
  if ($('#sheet').classList.contains('open')) { closeSheet(); return true; }
  if (C && C.id && !wide()) { closeChat(); return true; }
  if (S.tok && S.tab !== 'msgs') { go('msgs'); return true; }
  return false;
};
window.lockUi = function (on) { $('#lock').classList.toggle('on', !!on); };
