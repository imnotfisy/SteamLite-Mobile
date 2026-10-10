// ====================== 1.4.1: Library button opens a small quick menu: Library and Steam Store ======================
var BAG = '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>';

// Library and Store are two screens that share the Library tab
renderLib = function () {
  if (typeof SEL !== 'undefined' && SEL.on) selExit();
  var v = $('#view'); v.__h = null;
  if (LIB.tab === 'store') { v.innerHTML = '<div class="hdr"><h1>Steam Store</h1></div><div class="pad"><div id="gl"></div></div>'; libStore(); return; }
  if (LIB.tab !== 'games' && LIB.tab !== 'folders' && LIB.tab !== 'wish' && LIB.tab !== 'stats') LIB.tab = 'games';
  v.innerHTML = '<div class="hdr"><h1>Library</h1></div><div class="seg" id="lseg">' + [['games', 'Games'], ['folders', 'Folders'], ['wish', 'Wishlist'], ['stats', 'Stats']].map(function (x) { return '<button data-t="' + x[0] + '" class="' + (LIB.tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="pad"><div id="gl"><div class="grid">' + skel(6, true) + '</div></div></div>';
  $('#lseg').onclick = function (e) { var b = e.target.closest('button'); if (b) { LIB.tab = b.dataset.t; hp('tap'); renderLib(); } };
  ({ games: libGames, folders: function () { ensureGames().then(function () { libFolders(); }); libFolders(); }, wish: libWish, stats: libStats })[LIB.tab]();
};

// ---------- the quick menu ----------
function quickClose() { var q = $('#quick'); if (!q) return false; q.classList.remove('on'); var bg = $('#quickbg'); if (bg) bg.classList.remove('on'); setTimeout(function () { var a = $('#quick'), b = $('#quickbg'); if (a && !a.classList.contains('on')) a.remove(); if (b && !b.classList.contains('on')) b.remove(); }, 220); return true; }
function quickOpen() {
  if ($('#quick')) return quickClose();
  var btn = document.querySelector('#tabs button[data-t="lib"]'), r = btn ? btn.getBoundingClientRect() : { left: 0, width: window.innerWidth, top: window.innerHeight - 60 };
  var onSale = (typeof TRK === 'function' ? TRK() : []).filter(function (t) { return t.now && t.now >= t.pct; }).length;
  var bg = document.createElement('div'); bg.id = 'quickbg'; document.body.appendChild(bg);
  var q = document.createElement('div'); q.id = 'quick'; q.setAttribute('role', 'menu');
  q.innerHTML = '<div class="qh">QUICK ACCESS</div><div class="qgrid2"><button class="qtile lib" data-q="lib" role="menuitem"><span class="qi">' + IC.lib + '</span><span class="ql">Library</span></button><button class="qtile store" data-q="store" role="menuitem"><span class="qi">' + BAG + (onSale ? '<i class="qb">' + onSale + '</i>' : '') + '</span><span class="ql">Steam Store</span></button></div>';
  document.body.appendChild(q);
  var w = q.offsetWidth, cx = r.left + r.width / 2, left = Math.max(10, Math.min(window.innerWidth - w - 10, cx - w / 2));
  q.style.left = left + 'px'; q.style.bottom = (window.innerHeight - r.top + 12) + 'px'; q.style.setProperty('--ax', Math.round(cx - left) + 'px');
  requestAnimationFrame(function () { q.classList.add('on'); bg.classList.add('on'); }); hp('tap');
  bg.onclick = quickClose;
  q.onclick = function (e) { var t = e.target.closest('[data-q]'); if (!t) return; hp('tap'); var k = t.dataset.q; quickClose(); LIB.tab = k === 'store' ? 'store' : (LIB.tab === 'store' ? 'games' : LIB.tab); go('lib'); };
}
// tapping the Library tab opens the menu instead of going straight there
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('#tabs button'); if (!b) return;
  if (b.dataset.t === 'lib') { e.stopImmediatePropagation(); e.preventDefault(); quickOpen(); }
  else quickClose();
}, true);
var _onBack6 = window.onBack;
window.onBack = function () { if ($('#quick')) { quickClose(); return true; } return _onBack6 ? _onBack6() : false; };
// the tab shows "Store" while you are in the store
function updLibTab() { var b = document.querySelector('#tabs button[data-t="lib"]'); if (!b) return; var want = (S.tab === 'lib' && LIB.tab === 'store') ? 'Store' : 'Library', n = b.childNodes; for (var i = 0; i < n.length; i++) if (n[i].nodeType === 3) { n[i].nodeValue = want; return; } }
var _go6 = go; go = function (t) { _go6(t); updLibTab(); };

// changes made on the PC (banner, frame, title...) show up here when you come back to the app
var _onResume6 = window.onResumeApp;
window.onResumeApp = function () { if (S.tok && typeof loadMyProfile === 'function') loadMyProfile(true); if (_onResume6) _onResume6(); };

// messaging lives in its own app now: this tab points people to it
var MSG_APP_URL = 'https://github.com/imnotfisy/SteamLite-Messages/releases/latest';
renderMsgs = function () {
  var v = $('#view');
  v.innerHTML = '<div class="hdr"><h1>Messages</h1></div><div class="pad"><div class="card" style="text-align:center;padding:30px 20px"><div style="width:84px;height:84px;margin:0 auto 18px;border-radius:26px;background:linear-gradient(135deg,#6d5bff,#1fb6ff);display:grid;place-items:center;color:#fff;box-shadow:0 12px 30px rgba(109,91,255,.35)">' + '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>' + '</div><div class="name" style="font-size:1.25em;margin-bottom:8px">Messages have moved</div><div class="sub wrap" style="margin-bottom:22px">Chats, calls, voice messages and streaks now live in their own app, SteamLite Messages. Your friends and conversations are already there. Just sign in with the same account.</div><button class="btn" id="getmsg" style="width:100%;justify-content:center">' + ic('download', 17) + ' Download SteamLite Messages</button></div></div>';
  $('#getmsg').onclick = function () { hp('tap'); N('openUrl', MSG_APP_URL); };
};
