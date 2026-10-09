// ====================== 1.4.0: store upgrades, smart and shared folders, hidden games, bulk select, stats ======================

// ---------- price tracking ----------
function TRK() { return S.trk || cget('trk') || []; }
function isTracked(id) { return TRK().some(function (x) { return x.appid === id; }); }
function loadTrack() { if (!S.tok) return Promise.resolve(); return api('GET', '/me/track').then(function (r) { if (r && r.items) { S.trk = r.items; cset('trk', r.items); } }); }
setTimeout(loadTrack, 3500);
function trackGame(id, name, pct, cb) { api('POST', '/me/track', { appid: id, name: name, pct: pct || 20 }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); loadTrack().then(function () { if (cb) cb(); }); }); }
function untrackGame(id, cb) { api('DELETE', '/me/track?appid=' + id, {}).then(function () { hp('tap'); loadTrack().then(function () { if (cb) cb(); }); }); }

// ---------- the store: filters, tags, sorting, price alerts ----------
var TAGS = [['19', 'Action'], ['21', 'Adventure'], ['122', 'RPG'], ['9', 'Strategy'], ['599', 'Simulation'], ['492', 'Indie'], ['597', 'Casual'], ['699', 'Racing'], ['701', 'Sports'], ['1667', 'Horror'], ['1685', 'Co-op'], ['3859', 'Multiplayer'], ['1695', 'Open World'], ['1664', 'Puzzle']];
var TAGNAME = {}; TAGS.forEach(function (t) { TAGNAME[t[1].toLowerCase()] = t[0]; });
ST.tags = []; ST.sort = ''; ST.max = '';
ST_FILTERS = [['all', 'Popular'], ['sale', 'On sale'], ['free', 'Free'], ['new', 'New'], ['top', 'Top rated'], ['tracked', 'Tracked']];
storeUrl = function (start) {
  var u = 'https://store.steampowered.com/search/results/?start=' + start + '&count=25&infinite=1&l=english&cc=' + storeCC() + '&category1=998';
  if (ST.q) u += '&term=' + encodeURIComponent(ST.q);
  if (ST.tags.length) u += '&tags=' + ST.tags.join(',');
  var sort = ST.sort || (ST.f === 'new' ? 'Released_DESC' : ST.f === 'top' ? 'Reviews_DESC' : ''); if (sort) u += '&sort_by=' + sort;
  if (ST.f === 'sale') u += '&specials=1';
  if (ST.f === 'free') u += '&maxprice=free'; else if (ST.max) u += '&maxprice=' + ST.max;
  return u;
};
var _storeLoad = storeLoad;
storeLoad = function (more) {
  if (ST.f === 'tracked') { ST.seq++; ST.busy = false; ST.err = ''; ST.items = TRK().map(function (t) { return { id: t.appid, name: t.name, off: t.now || 0, price: t.price || '', was: '', date: 'Alert at ' + t.pct + '% off', rev: '' }; }); ST.total = ST.items.length; storePaint(); loadTrack().then(function () { if (ST.f === 'tracked') { ST.items = TRK().map(function (t) { return { id: t.appid, name: t.name, off: t.now || 0, price: t.price || '', was: '', date: 'Alert at ' + t.pct + '% off', rev: '' }; }); ST.total = ST.items.length; storePaint(); } }); return; }
  _storeLoad(more);
};
storeRow = function (g) {
  var own = ownedGame(g.id), on = isTracked(g.id);
  return '<div class="row sgrow" data-sg="' + g.id + '"><div class="sgi">' + gi(g.id, g.name) + '</div><div class="grow"><div class="name wrap2">' + esc(g.name) + '</div><div class="sub">' + (g.date ? esc(g.date) : '') + (g.rev ? (g.date ? ' · ' : '') + esc(g.rev) : '') + '</div><div class="sgp">' + (own ? '<span class="chip owned">In your library</span>' : '') + (g.off ? '<span class="chip off">-' + g.off + '%</span>' + (g.was ? '<s class="sub">' + esc(g.was) + '</s> ' : '') : '') + '<b>' + esc(g.price || '') + '</b></div></div><button class="trkb' + (on ? ' on' : '') + '" data-tr="' + g.id + '" aria-label="' + (on ? 'Stop tracking the price' : 'Track the price') + '">' + ic(on ? 'bell' : 'bellOff', 18) + '</button></div>';
};
libStore = function () {
  var gl = $('#gl'); if (!gl || LIB.tab !== 'store') return;
  var tracked = ST.f === 'tracked';
  gl.innerHTML = '<input class="in" id="sq" placeholder="Search all of Steam" autocomplete="off" value="' + esc(ST.q) + '"><div class="seg2" id="sfil">' + ST_FILTERS.map(function (x) { return '<button class="btn sm ' + (ST.f === x[0] ? '' : 'ghost') + '" data-f="' + x[0] + '">' + x[1] + (x[0] === 'tracked' && TRK().length ? ' (' + TRK().length + ')' : '') + '</button>'; }).join('') + '</div>' +
    '<div class="seg2" id="stags">' + TAGS.map(function (t) { return '<button class="btn sm ' + (ST.tags.indexOf(t[0]) >= 0 ? '' : 'ghost') + '" data-tag="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
    '<div class="srow2"><select class="in" id="ssort" aria-label="Sort"><option value="">Best match</option><option value="Reviews_DESC">Top rated</option><option value="Released_DESC">Newest</option><option value="Price_ASC">Price: low to high</option><option value="Name_ASC">Name A to Z</option></select><select class="in" id="smax" aria-label="Highest price"><option value="">Any price</option>' + [5, 10, 20, 30, 50].map(function (p) { return '<option value="' + p + '">Under ' + p + '</option>'; }).join('') + '</select></div>' +
    '<div class="sub" id="scount" style="margin:6px 0 8px"></div><div id="sres"></div>';
  $('#ssort').value = ST.sort; $('#smax').value = ST.max; if (tracked) $('#stags').style.display = $('.srow2').style.display = 'none';
  $('#sq').oninput = function () { var v = $('#sq').value.trim(); clearTimeout(ST.t); ST.t = setTimeout(function () { if (/^\d{2,9}$/.test(v)) return; ST.q = v; if (ST.f === 'tracked') { ST.f = 'all'; ST.items = []; libStore(); return; } storeLoad(false); }, 450); };
  $('#sq').onkeydown = function (e) { if (e.key === 'Enter') { var v = $('#sq').value.trim(); if (/^\d{2,9}$/.test(v)) openGame(+v); } };
  $('#sfil').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; ST.f = b.dataset.f; ST.items = []; hp('tap'); libStore(); };
  $('#stags').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; var t = b.dataset.tag, i = ST.tags.indexOf(t); if (i >= 0) ST.tags.splice(i, 1); else ST.tags.push(t); hp('tap'); b.classList.toggle('ghost'); storeLoad(false); };
  $('#ssort').onchange = function () { ST.sort = this.value; storeLoad(false); };
  $('#smax').onchange = function () { ST.max = this.value; storeLoad(false); };
  $('#sres').onclick = function (e) {
    var t = e.target.closest('[data-tr]'); if (t) { e.stopPropagation(); var id = +t.dataset.tr, it = ST.items.filter(function (x) { return x.id === id; })[0]; if (isTracked(id)) untrackGame(id, function () { toast('Stopped tracking'); storePaint(); if (ST.f === 'tracked') storeLoad(false); }); else trackGame(id, it ? it.name : 'App ' + id, 20, function () { toast('Tracking. We will tell you at 20% off or more.'); storePaint(); }); return; }
    var r = e.target.closest('[data-sg]'); if (r) openGame(+r.dataset.sg, (r.querySelector('.name') || {}).textContent);
  };
  if (ST.items.length && !tracked) storePaint(); else storeLoad(false);
};

// ---------- game page: price alert, friends who own it, more like this, game colours ----------
var _gameExtra4 = gameExtra, _bindGameExtra4 = bindGameExtra;
gameExtra = function (id, ach, owned) {
  var tr = TRK().filter(function (x) { return x.appid === id; })[0], h = _gameExtra4(id, ach, owned);
  h += '<div class="sec">Price alert</div><div class="card palert">' + (tr ? '<div class="grow"><div class="name">Tracking this game</div><div class="sub wrap">We tell you at ' + tr.pct + '% off or more.' + (tr.now ? ' Right now: -' + tr.now + '% (' + esc(tr.price) + ').' : '') + '</div></div><select class="in" id="pa-p" style="width:auto">' + [10, 20, 30, 50, 75].map(function (p) { return '<option value="' + p + '"' + (tr.pct === p ? ' selected' : '') + '>' + p + '%</option>'; }).join('') + '</select><button class="btn ghost sm" id="pa-x">Stop</button>' : '<div class="grow"><div class="name">Get a price alert</div><div class="sub wrap">Works for any game on Steam, not only your wishlist.</div></div><button class="btn sm" id="pa-on">Track</button>') + '</div>';
  h += '<div class="sec">Friends</div><div class="card" id="fown"><div class="grow"><div class="name">Who owns this?</div><div class="sub wrap">Check which of your friends have it.</div></div><button class="btn sm" id="fown-b">Check</button></div>';
  h += '<div id="simwrap"></div>';
  h += '<div class="sec">Colours</div><div class="card"><div class="grow"><div class="name">Match the app to this game</div><div class="sub wrap">Uses the main colour of the cover. Undo it in Themes.</div></div><button class="btn sm" id="gcol">Use</button></div>';
  return h;
};
bindGameExtra = function (id, ach, paint, d) {
  _bindGameExtra4(id, ach, paint, d);
  var name = (d && d.name) || ($('#gpname') && $('#gpname').textContent) || ('App ' + id), again = function () { paint(d, ach); };
  var on = $('#pa-on'); if (on) on.onclick = function () { trackGame(id, name, 20, function () { toast('Tracking ' + name); again(); }); };
  var px = $('#pa-x'); if (px) px.onclick = function () { untrackGame(id, function () { toast('Stopped tracking'); again(); }); };
  var pp = $('#pa-p'); if (pp) pp.onchange = function () { trackGame(id, name, +pp.value, function () { toast('Alert at ' + pp.value + '% off'); }); };
  var fb = $('#fown-b'); if (fb) fb.onclick = function () { friendsOwning(id, name); };
  var gc = $('#gcol'); if (gc) gc.onclick = function () { gameColours(id); };
  similarGames(id, d);
};
function similarGames(id, d) {
  var wrap = $('#simwrap'); if (!wrap || !d || !d.genres) return; var tags = [];
  d.genres.forEach(function (g) { var t = TAGNAME[String(g).toLowerCase()]; if (t && tags.length < 2 && tags.indexOf(t) < 0) tags.push(t); }); if (!tags.length) return;
  var key = 'sim:' + id, cached = cget(key);
  var draw = function (l) { l = l.filter(function (x) { return x.id !== id; }).slice(0, 12); if (!l.length || !$('#simwrap')) return; $('#simwrap').innerHTML = '<div class="sec">More like this</div><div class="hscroll">' + l.map(function (x) { return '<div class="hcard" data-gp="' + x.id + '">' + gi(x.id, x.name) + '<div class="hn">' + esc(x.name) + '</div><div class="sub">' + (x.off ? '<span class="off">-' + x.off + '%</span> ' : '') + esc(x.price || '') + '</div></div>'; }).join('') + '</div>'; };
  if (cached && Date.now() - cached.at < 6 * 3600000) return draw(cached.l);
  raw('GET', 'https://store.steampowered.com/search/results/?start=0&count=14&infinite=1&l=english&cc=' + storeCC() + '&category1=998&tags=' + tags.join(','), {}).then(function (r) { var j = null; try { j = JSON.parse(r.text); } catch (e) { } if (!j || !j.results_html) return; var l = parseStore(j.results_html); cset(key, { at: Date.now(), l: l }); draw(l); });
}
var OWN = {};   // friends' libraries, kept for a few minutes
function friendsOwning(id, name) {
  var box = $('#fown'); if (!box) return; var fr = ((S.ov && S.ov.friends) || []).slice(0, 30); if (!fr.length) return toast('Add some friends first.');
  box.innerHTML = '<div class="grow"><div class="name">Checking your friends...</div><div class="sub" id="fown-n">0 of ' + fr.length + '</div></div><span class="spin"></span>';
  var found = [], done = 0, queue = fr.slice(), worker = function () {
    var f = queue.shift(); if (!f) return;
    var cached = OWN[f.uid] && Date.now() - OWN[f.uid].at < 600000 ? Promise.resolve(OWN[f.uid].g) : friendSteamId(f.uid).then(function (sid) { return sid ? ownedOf(sid) : null; }).then(function (g) { OWN[f.uid] = { at: Date.now(), g: g }; return g; });
    cached.then(function (g) { var gm = (g || []).filter(function (x) { return x.appid === id; })[0]; if (gm) found.push({ f: f, h: Math.round((gm.playtime_forever || 0) / 60) }); }).catch(function () { }).then(function () { done++; var n = $('#fown-n'); if (n) n.textContent = done + ' of ' + fr.length; if (done === fr.length) finish(); else worker(); });
  };
  var finish = function () {
    var b = $('#fown'); if (!b) return; found.sort(function (a, c) { return c.h - a.h; });
    b.style.display = 'block'; b.innerHTML = '<div class="name">' + (found.length ? found.length + ' friend' + (found.length === 1 ? '' : 's') + ' own' + (found.length === 1 ? 's' : '') + ' this' : 'None of your friends own this (or their libraries are private)') + '</div>' + found.map(function (x) { var pl = x.f.playing && +x.f.playing.appid === id; return '<div class="row" data-inv="' + x.f.uid + '"><div class="av sm"' + avStyle(x.f.avatar) + '></div><div class="grow"><div class="name">' + nameHtml(x.f) + '</div><div class="sub">' + (pl ? 'Playing it right now' : x.h + ' h played') + '</div></div><button class="btn sm ghost">Invite</button></div>'; }).join('');
    b.onclick = function (e) { var r = e.target.closest('[data-inv]'); if (!r) return; api('POST', '/social/dm', { uid: r.dataset.inv }).then(function (d) { if (d.error) return toast(d.error); sendGameTo(d.id, { appid: id, name: name, playtime_forever: 0 }).then(function () { return api('POST', '/social/send', { conv: d.id, text: 'Want to play ' + name + '?' }); }).then(function () { hp('ok'); toast('Invite sent'); }); }); };
  };
  for (var k = 0; k < 3; k++) worker();
}
function gameColours(id) {
  var cb = 'p' + hex(4); toast('Reading the cover...');
  CB[cb] = function (c) {
    if (!c) return toast('Could not read the cover.');
    var m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return; var r = parseInt(m[1].slice(0, 2), 16) / 255, g = parseInt(m[1].slice(2, 4), 16) / 255, b = parseInt(m[1].slice(4), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, d = mx - mn;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = Math.round(((h * 60) + 360) % 360);
    var hsl = function (s, l, a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + (a == null ? 1 : a) + ')'; };
    Look.setTheme({ id: 'game' + id, vars: { '--bg-dark': hsl(40, 7), '--bg-glass': hsl(36, 11, .9), '--bg-glass-light': hsl(32, 16, .95), '--border-glass': hsl(40, 40, .22), '--text-primary': '#f4f5f8', '--text-secondary': hsl(18, 72), '--accent-color': c, '--accent-color-2': c } });
    hp('ok'); toast('Colours matched to the game');
  };
  N('coverColor', AK + id + '/header.jpg', cb);
}

// ---------- hidden games ----------
function HID() { try { return JSON.parse(ls.get('hid') || '[]'); } catch (e) { return []; } }
var _filterList4 = filterList;
filterList = function () { var l = _filterList4(); if (HID().length) l.push(['hidden', 'Hidden (' + HID().length + ')']); return l; };

// ---------- smart folders (they fill themselves) ----------
var SMART = [
  ['never', 'Never played', function (g) { return !g.playtime_forever; }],
  ['barely', 'Barely played (under 2 h)', function (g) { return g.playtime_forever > 0 && g.playtime_forever < 120; }],
  ['month', 'Played this month', function (g) { return g.playtime_2weeks > 0 || (g.last && g.last * 1000 > Date.now() - 30 * 86400000); }],
  ['year', 'Not played in a year', function (g) { return g.playtime_forever > 0 && g.last && g.last * 1000 < Date.now() - 365 * 86400000; }],
  ['big', 'Over 100 hours', function (g) { return g.playtime_forever >= 6000; }]
];
function smartIds(key) { var r = SMART.filter(function (s) { return s[0] === key; })[0], g = S.games || cget('games') || []; return r ? g.filter(r[2]).sort(function (a, b) { return b.playtime_forever - a.playtime_forever; }).map(function (x) { return x.appid; }) : []; }

// ---------- shared folders (with friends) ----------
function loadSfolds(cb) { api('GET', '/social/sfolds').then(function (r) { if (r && r.folders) { S.sfolds = r.folders; cset('sfolds', r.folders); } if (cb) cb(); }); }
function SFO() { return S.sfolds || cget('sfolds') || []; }
var _libFolders4 = libFolders;
libFolders = function () {
  _libFolders4(); var gl = $('#gl'); if (!gl || LIB.tab !== 'folders') return;
  var sm = SMART.map(function (s) { var ids = smartIds(s[0]); return ids.length ? folderCard('s:' + s[0], s[1], ids, false).replace('</div></button>', ' · smart</div></button>') : ''; }).join('');
  var sh = SFO(), shHtml = '<div class="sec">Shared with friends</div><button class="btn ghost wide" id="snew">' + ic('users', 16) + ' New shared folder</button>' + (sh.length ? '<div class="fgrid" style="margin-top:10px">' + sh.map(function (f) { return folderCard('x:' + f.id, f.name, f.items.map(function (i) { return i.a; }), false).replace('</div></button>', ' · ' + f.members.length + ' people</div></button>'); }).join('') + '</div>' : '');
  gl.insertAdjacentHTML('beforeend', shHtml + (sm ? '<div class="sec">Smart folders</div><div class="fgrid">' + sm + '</div>' : ''));
  var sn = $('#snew'); if (sn) sn.onclick = function () { var n = prompt('Name for the shared folder'); if (!n || n.trim().length < 2) return; api('POST', '/social/sfold', { op: 'create', name: n.trim() }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); loadSfolds(function () { libFolders(); openSharedFolder(r.id); }); }); };
  if (!libFolders.t || Date.now() - libFolders.t > 8000) { libFolders.t = Date.now(); loadSfolds(function () { if (LIB.tab === 'folders' && $('#gl')) { var cur = JSON.stringify(SFO()); if (libFolders.last !== cur) { libFolders.last = cur; libFolders(); } } }); }
};
var _openFolder4 = openFolder;
openFolder = function (key) {
  if (key.indexOf('x:') === 0) return openSharedFolder(key.slice(2));
  if (key.indexOf('s:') === 0) {
    var sk = key.slice(2), s = SMART.filter(function (x) { return x[0] === sk; })[0]; if (!s) return;
    return openPage('folder', s[1], function (b) {
      var games = smartIds(sk).map(function (a) { return ownedGame(a); }).filter(Boolean);
      b.innerHTML = '<div class="sub wrap" style="margin:6px 0 10px">This folder fills itself from your play time.</div><div class="gpacts" style="margin-bottom:10px"><button class="btn" id="fcopy">Copy to my folders</button></div>' + (games.length ? '<div class="grid">' + games.map(function (g) { return '<div class="game" data-g="' + g.appid + '">' + gi(g.appid, g.name) + '<div class="gn">' + esc(g.name) + '</div><div class="sub">' + (g.playtime_forever ? Math.round(g.playtime_forever / 6) / 10 + ' h' : 'Not played') + '</div></div>'; }).join('') + '</div>' : '<div class="empty">Nothing here right now.</div>');
      b.onclick = function (e) { var g = e.target.closest('[data-g]'); if (g) openGame(+g.dataset.g); };
      $('#fcopy', b).onclick = function () { var ff = FOLD(), nid = 'f' + hex(4); ff[nid] = { n: s[1].slice(0, 30), g: games.map(function (g) { return g.appid; }).slice(0, 500), t: Date.now() }; saveFolders(ff); hp('ok'); toast('Copied. It is yours to edit now.'); };
    });
  }
  return _openFolder4(key);
};
function openSharedFolder(id) {
  openPage('sfolder', 'Shared folder', function (b, page) {
    var draw = function () {
      var f = SFO().filter(function (x) { return x.id === id; })[0]; if (!f) { page.close(); return; } page.title(f.name);
      var me = S.me.uid;
      b.innerHTML = '<div class="chips" style="margin:6px 0 4px">' + f.members.map(function (m) { return '<span class="chip">' + esc(NICKS()[m.uid] || m.name) + (m.uid === f.owner ? ' · owner' : '') + '</span>'; }).join('') + '</div>' +
        '<div class="gpacts" style="margin:8px 0 10px"><button class="btn" id="sf-add">' + ic('plus', 16) + ' Add games</button>' + (f.mine ? '<button class="btn ghost" id="sf-inv">' + ic('users', 16) + ' Invite</button>' : '') + '<button class="btn ghost" id="sf-more" aria-label="More">' + ic('more', 16) + '</button></div>' +
        (f.items.length ? '<div class="grid">' + f.items.map(function (i) { var by = f.members.filter(function (m) { return m.uid === i.by; })[0]; return '<div class="game" data-g="' + i.a + '">' + gi(i.a, i.n) + '<div class="gn">' + esc(i.n) + '</div><div class="sub">' + (by ? 'by ' + esc((NICKS()[by.uid] || by.name).split(' ')[0]) : '') + '</div></div>'; }).join('') + '</div>' : '<div class="empty">Nothing here yet.<br>Add games you all want to play.</div>');
      b.onclick = function (e) { var g = e.target.closest('[data-g]'); if (g) openGame(+g.dataset.g); };
      $('#sf-add', b).onclick = function () { pickForShared(f, draw); };
      var iv = $('#sf-inv', b); if (iv) iv.onclick = function () { var inn = f.members.map(function (m) { return m.uid; }), fr = ((S.ov && S.ov.friends) || []).filter(function (x) { return inn.indexOf(x.uid) < 0; }); if (!fr.length) return toast('All your friends are already in it.'); sheet('<h3 style="margin:0 0 8px">Invite a friend</h3>' + fr.map(function (x) { return '<button class="act" data-iu="' + x.uid + '"><span class="ai"><div class="av sm"' + avStyle(x.avatar) + ' style="width:30px;height:30px"></div></span><span>' + esc(NICKS()[x.uid] || x.name) + '</span></button>'; }).join('')); $('#sheet').onclick = function (e) { var a = e.target.closest('[data-iu]'); if (!a) return; closeSheet(); api('POST', '/social/sfold', { op: 'invite', id: id, uid: a.dataset.iu }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); toast('Invited'); loadSfolds(draw); }); }; };
      $('#sf-more', b).onclick = function () {
        sheet((f.mine ? act('edit', 'Rename folder', 'data-a="ren"') + act('trash', 'Delete folder', 'data-a="del"', 'bad') : act('x', 'Leave folder', 'data-a="lv"', 'bad')));
        $('#sheet').onclick = function (e) { var a = e.target.closest('[data-a]'); if (!a) return; closeSheet(); var k = a.dataset.a;
          if (k === 'ren') { var n = prompt('Folder name', f.name); if (n && n.trim().length > 1) api('POST', '/social/sfold', { op: 'rename', id: id, name: n.trim() }).then(function () { loadSfolds(draw); }); }
          else if (k === 'del') { if (confirm('Delete "' + f.name + '" for everyone?')) api('POST', '/social/sfold', { op: 'delete', id: id }).then(function () { loadSfolds(function () { page.close(); }); }); }
          else if (confirm('Leave "' + f.name + '"?')) api('POST', '/social/sfold', { op: 'leave', id: id }).then(function () { loadSfolds(function () { page.close(); }); }); };
      };
    };
    draw(); loadSfolds(draw); page.onClose = function () { if (S.tab === 'lib' && LIB.tab === 'folders') libFolders(); };
  });
}
function pickForShared(f, done) {
  var all = (S.games || cget('games') || []).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
  sheet('<h3 style="margin:0 0 8px">Add games</h3><input class="in" id="pg-q" placeholder="Search your games" autocomplete="off"><div class="sub" style="margin:6px 0">Games you do not own: open their page and use Folders.</div><div id="pg-l" style="max-height:48vh;overflow-y:auto"></div>');
  var paint = function () {
    var q = $('#pg-q').value.trim().toLowerCase(), cur = (SFO().filter(function (x) { return x.id === f.id; })[0] || { items: [] }).items.map(function (i) { return i.a; }), l = all.filter(function (g) { return !q || (g.name || '').toLowerCase().indexOf(q) >= 0; }).slice(0, 80);
    $('#pg-l').innerHTML = l.map(function (g) { var on = cur.indexOf(g.appid) >= 0; return '<div class="row" data-pg="' + g.appid + '" data-n="' + esc(g.name) + '"><div class="gimini">' + gi(g.appid, g.name) + '</div><div class="grow name wrap2">' + esc(g.name) + '</div><span class="chk ' + (on ? 'on' : '') + '">' + (on ? ic('check', 14) : '') + '</span></div>'; }).join('') || '<div class="empty">No games found.</div>';
  };
  paint(); $('#pg-q').oninput = paint;
  $('#pg-l').onclick = function (e) { var r = e.target.closest('[data-pg]'); if (!r) return; var a = +r.dataset.pg, cur = (SFO().filter(function (x) { return x.id === f.id; })[0] || { items: [] }).items.some(function (i) { return i.a === a; }); api('POST', '/social/sfold', { op: cur ? 'remove' : 'add', id: f.id, appid: a, name: r.dataset.n }).then(function (x) { if (x.error) return toast(x.error); hp('tap'); loadSfolds(function () { paint(); if (done) done(); }); }); };
  $('#sheet').onclick = null;
}
// the game page "Folders" sheet also lists shared folders
var _gameFolderSheet4 = gameFolderSheet;
gameFolderSheet = function (id, after) {
  _gameFolderSheet4(id, after); var sh = $('#sheet'), prev = sh.onclick, sf = SFO(); if (!sf.length) return;
  sh.insertAdjacentHTML('beforeend', '<div class="sec" style="margin-top:10px">Shared with friends</div>' + sf.map(function (f) { var on = f.items.some(function (i) { return i.a === id; }); return '<div class="row" data-sx="' + f.id + '"><div class="grow name">' + esc(f.name) + '</div><span class="chk ' + (on ? 'on' : '') + '">' + (on ? ic('check', 14) : '') + '</span></div>'; }).join(''));
  sh.onclick = function (e) { var r = e.target.closest('[data-sx]'); if (!r) return prev && prev(e); var f = SFO().filter(function (x) { return x.id === r.dataset.sx; })[0], on = f.items.some(function (i) { return i.a === id; }), g = ownedGame(id), nm = (g && g.name) || ($('#gpname') && $('#gpname').textContent) || ('App ' + id); api('POST', '/social/sfold', { op: on ? 'remove' : 'add', id: f.id, appid: id, name: nm }).then(function (x) { if (x.error) return toast(x.error); hp('tap'); loadSfolds(function () { gameFolderSheet(id, after); }); }); };
};

// ---------- bulk select in the Games tab ----------
var SEL = { on: false, ids: [], tm: 0, long: false };
function selBar() {
  var el = $('#selbar'); if (!SEL.on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'selbar'; document.body.appendChild(el); }
  var hidden = LIB.filter === 'hidden';
  el.innerHTML = '<span class="grow">' + SEL.ids.length + ' selected</span><button class="btn sm" data-sb="fol">' + ic('box', 15) + ' Folder</button><button class="btn sm ghost" data-sb="hide">' + (hidden ? 'Unhide' : 'Hide') + '</button><button class="btn sm ghost" data-sb="x" aria-label="Cancel">' + ic('x', 15) + '</button>';
  el.onclick = function (e) {
    var b = e.target.closest('[data-sb]'); if (!b) return; var k = b.dataset.sb;
    if (k === 'x') return selExit();
    if (!SEL.ids.length) return toast('Select some games first.');
    if (k === 'hide') { var h = HID(); SEL.ids.forEach(function (a) { var i = h.indexOf(a); if (hidden) { if (i >= 0) h.splice(i, 1); } else if (i < 0) h.push(a); }); ls.set('hid', JSON.stringify(h)); toast(hidden ? 'Unhidden' : 'Hidden. Find them under the Hidden filter.'); selExit(); if (!HID().length) LIB.filter = 'all'; paintGames(); return; }
    var f = FOLD(), keys = Object.keys(f);
    sheet('<h3 style="margin:0 0 8px">Move ' + SEL.ids.length + ' game' + (SEL.ids.length === 1 ? '' : 's') + ' to...</h3>' + keys.map(function (k2) { return '<button class="act" data-fx="' + k2 + '"><span class="ai">' + ic('box', 20) + '</span><span>' + esc(f[k2].n) + '</span></button>'; }).join('') + act('plus', 'New folder', 'data-a="new"', 'acc'));
    $('#sheet').onclick = function (e2) {
      var a = e2.target.closest('[data-fx]'), n = e2.target.closest('[data-a]'), put = function (fid) { var ff = FOLD(); SEL.ids.forEach(function (x) { if (ff[fid].g.indexOf(x) < 0) ff[fid].g.push(x); }); saveFolders(ff); hp('ok'); toast('Added to "' + ff[fid].n + '"'); closeSheet(); selExit(); };
      if (a) put(a.dataset.fx); else if (n) { closeSheet(); newFolder(function (nid) { put(nid); }); }
    };
  };
}
function selExit() { SEL.on = false; SEL.ids = []; selBar(); selMark(); }
function selMark() { document.querySelectorAll('#gg .game').forEach(function (t) { t.classList.toggle('sel', SEL.on && SEL.ids.indexOf(+t.dataset.g) >= 0); }); }
document.addEventListener('touchstart', function (e) { var t = e.target.closest && e.target.closest('#gg [data-g]'); if (!t) return; clearTimeout(SEL.tm); SEL.tm = setTimeout(function () { SEL.long = true; hp('heavy'); SEL.on = true; var a = +t.dataset.g; if (SEL.ids.indexOf(a) < 0) SEL.ids.push(a); selBar(); selMark(); }, 520); }, { passive: true, capture: true });
['touchmove', 'touchend', 'touchcancel'].forEach(function (ev) { document.addEventListener(ev, function () { clearTimeout(SEL.tm); }, { passive: true, capture: true }); });
document.addEventListener('click', function (e) {
  var t = e.target.closest && e.target.closest('#gg [data-g]');
  if (SEL.long) { SEL.long = false; if (t) { e.stopPropagation(); e.preventDefault(); } return; }
  if (SEL.on && t) { e.stopPropagation(); e.preventDefault(); var a = +t.dataset.g, i = SEL.ids.indexOf(a); if (i >= 0) SEL.ids.splice(i, 1); else SEL.ids.push(a); hp('tap'); selBar(); selMark(); }
}, true);
var _paintGames4 = paintGames;
paintGames = function () { _paintGames4(); selMark(); };
var _onBack4 = window.onBack;
window.onBack = function () { if (SEL.on) { selExit(); return true; } return _onBack4 ? _onBack4() : false; };
var _renderLib4 = renderLib;
renderLib = function () { if (SEL.on) selExit(); _renderLib4(); };

// ---------- stats: weekly chart, all-time recap ----------
function PTH() { try { return JSON.parse(ls.get('pth') || '{}'); } catch (e) { return {}; } }
var _fetchGames4 = fetchGames;
fetchGames = function () {
  return _fetchGames4().then(function (g) {
    if (g && g.length) { var h = PTH(), tot = g.reduce(function (s, x) { return s + x.playtime_forever; }, 0); h[localDay()] = tot; var k = Object.keys(h).sort(); while (k.length > 60) delete h[k.shift()]; ls.set('pth', JSON.stringify(h)); }
    return g;
  });
};
function weeklyChart() {
  var h = PTH(), days = [], i; for (i = 13; i >= 0; i--) days.push(localDay(-i));
  var vals = days.map(function (d, j) { var prev = null; for (var k = j - 1; k >= 0 && prev == null; k--) if (h[days[k]] != null) prev = h[days[k]]; if (prev == null) { var keys = Object.keys(h).filter(function (x) { return x < d; }).sort(); if (keys.length) prev = h[keys[keys.length - 1]]; } return h[d] != null && prev != null ? Math.max(0, h[d] - prev) : null; });
  var known = vals.filter(function (v) { return v != null; }); if (known.length < 2) return '<div class="sec">Hours per day</div><div class="card"><div class="sub wrap">This chart fills in as you open the app on different days. Nothing to show yet.</div></div>';
  var mx = Math.max.apply(null, known.concat([30])), W = 300, H = 90, bw = W / days.length;
  var bars = vals.map(function (v, j) { var hh = v == null ? 0 : Math.max(2, Math.round(v / mx * (H - 16))); return '<rect x="' + (j * bw + 3) + '" y="' + (H - hh - 12) + '" width="' + (bw - 6) + '" height="' + hh + '" rx="4" fill="var(--acc)" opacity="' + (j === days.length - 1 ? 1 : .7) + '"/><text x="' + (j * bw + bw / 2) + '" y="' + (H - 1) + '" font-size="8" text-anchor="middle" fill="var(--mut)">' + days[j].slice(8) + '</text>'; }).join('');
  var sum = known.reduce(function (s, v) { return s + v; }, 0);
  return '<div class="sec">Hours per day</div><div class="card"><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Hours played per day, last two weeks">' + bars + '</svg><div class="sub" style="margin-top:6px">' + (Math.round(sum / 6) / 10) + ' h over the days we have seen</div></div>';
}
function statsExtra(gl, g) {
  gl.insertAdjacentHTML('beforeend', weeklyChart() + '<div class="sec">Share</div><button class="card wide fbtn" id="alltime">' + ic('sparkle', 18) + '<span class="grow" style="text-align:left">All-time recap<div class="sub">Your whole library as a picture</div></span>' + ic('chevron', 16) + '</button>');
  var a = $('#alltime'); if (a) a.onclick = openAllTime;
}
function drawAllTime(accent, name) {
  var g = S.games || cget('games') || [], tot = g.reduce(function (s, x) { return s + x.playtime_forever; }, 0), top = g.slice().sort(function (a, b) { return b.playtime_forever - a.playtime_forever; }).slice(0, 5), unp = g.filter(function (x) { return !x.playtime_forever; }).length;
  var cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; var x = cv.getContext('2d'), ac = accent || '#8b5cf6';
  var gr = x.createLinearGradient(0, 0, 1080, 1350); gr.addColorStop(0, ac); gr.addColorStop(0.55, '#14102b'); gr.addColorStop(1, '#0b0f17'); x.fillStyle = gr; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(900, 220, 320, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.font = '600 44px system-ui,sans-serif'; x.fillText('My Steam library, all time', 80, 140);
  var hrs = Math.round(tot / 60).toLocaleString(); x.font = '800 220px system-ui,sans-serif'; x.fillText(hrs, 80, 420); var w = x.measureText(hrs).width; x.font = '600 66px system-ui,sans-serif'; x.fillText('hours', 100 + w, 420);
  x.font = '500 40px system-ui,sans-serif'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText(g.length + ' games · ' + unp + ' never played', 80, 500);
  x.fillStyle = '#fff'; x.font = '700 46px system-ui,sans-serif'; x.fillText('Most played', 80, 640); var mx = top[0] ? top[0].playtime_forever || 1 : 1;
  top.forEach(function (gm, i) { var y = 700 + i * 105, wd = Math.max(40, Math.round(920 * gm.playtime_forever / mx)); x.fillStyle = 'rgba(255,255,255,.12)'; roundRect(x, 80, y + 34, 920, 22, 11); x.fillStyle = '#fff'; roundRect(x, 80, y + 34, wd, 22, 11); x.font = '600 38px system-ui,sans-serif'; var nm = gm.name || ''; while (x.measureText(nm).width > 700 && nm.length > 4) nm = nm.slice(0, -2); if (nm !== gm.name) nm += '...'; x.fillText(nm, 80, y + 24); x.textAlign = 'right'; x.fillText(Math.round(gm.playtime_forever / 60) + ' h', 1000, y + 24); x.textAlign = 'left'; });
  x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '600 38px system-ui,sans-serif'; x.fillText((name || 'SteamLite') + ' · SteamLite Mobile', 80, 1270);
  return cv;
}
function openAllTime() {
  openPage('alltime', 'All-time recap', function (b) {
    ensureGames().then(function () {
      if (!(S.games || []).length) { b.innerHTML = '<div class="empty">Your library is not ready yet.</div>'; return; }
      var url = drawAllTime(((S.myProf || {}).custom || {}).accent, S.me.name).toDataURL('image/png');
      b.innerHTML = '<div class="recapimg"><img src="' + url + '" alt="All-time recap"></div><div class="pfacts" style="margin-top:12px"><button class="btn" id="at-share">' + ic('share', 16) + ' Share to a chat</button><button class="btn ghost" id="at-save">' + ic('download', 16) + ' Save</button></div>';
      $('#at-save', b).onclick = function () { N('saveImage', url, 'steamlite-alltime'); toast('Saved to your Pictures'); };
      $('#at-share', b).onclick = function () { pickConv('Send your recap to...', function (cid) { toast('Uploading...'); api('POST', '/media', { mime: 'image/png', data: url.split(',')[1] }).then(function (u) { if (!u.ok) return toast(u.error || 'Could not upload the picture'); api('POST', '/social/send', { conv: cid, kind: 'image', text: 'My library, all time', data: { id: u.id, w: 1080, h: 1350 } }).then(function (r) { toast(r.error || 'Sent'); }); }); }); };
    });
  });
}
