// ====================== 1.3.0: library folders and the Steam store ======================

// ---------- folders (made on the phone, saved to your account; the PC collections are shown next to them) ----------
function FOLD() { try { var v = JSON.parse(ls.get('folders') || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
var foldSaveT = 0;
function saveFolders(f) {
  ls.set('folders', JSON.stringify(f)); ls.set('foldersAt', String(Date.now()));
  clearTimeout(foldSaveT); foldSaveT = setTimeout(function () { api('PUT', '/me/folders', { folders: f }); }, 1200);
}
function loadFolders() {
  if (!S.tok) return;
  api('GET', '/me/folders').then(function (r) {
    if (!r || !r.ok || !r.folders) return; var mine = +(ls.get('foldersAt') || 0);
    if (r.at > mine) { ls.set('folders', JSON.stringify(r.folders)); ls.set('foldersAt', String(r.at)); if (S.tab === 'lib' && LIB.tab === 'folders') renderLib(); }
    else if (mine > r.at && Object.keys(FOLD()).length) api('PUT', '/me/folders', { folders: FOLD() });
  });
}
setTimeout(loadFolders, 3000);
function ownedGame(id) { return (S.games || cget('games') || []).filter(function (g) { return g.appid === id; })[0]; }
function folderCard(key, name, ids, pc) {
  var show = ids.slice(0, 4);
  return '<button class="fcard" data-fk="' + esc(key) + '"><div class="fmos">' + [0, 1, 2, 3].map(function (i) { return show[i] ? '<img loading="lazy" decoding="async" src="' + AK + show[i] + '/header.jpg" alt="" onerror="this.style.visibility=\'hidden\'">' : '<i></i>'; }).join('') + '</div><div class="fn">' + ic('box', 14) + ' ' + esc(name) + '</div><div class="sub">' + ids.length + ' game' + (ids.length === 1 ? '' : 's') + (pc ? ' · from your PC' : '') + '</div></button>';
}
function libFolders() {
  var gl = $('#gl'); if (!gl || LIB.tab !== 'folders') return;
  var f = FOLD(), keys = Object.keys(f).sort(function (a, b) { return (f[a].t || 0) - (f[b].t || 0); }), pcc = (S.bk && S.bk.cols) || {}, pk = Object.keys(pcc);
  var h = '<button class="btn wide" id="fnew">' + ic('plus', 16) + ' New folder</button>';
  if (!keys.length && !pk.length) h += '<div class="empty">No folders yet.<br>Make one to group your games, like "Co-op" or "Finish soon".</div>';
  if (keys.length) h += '<div class="sec">My folders</div><div class="fgrid">' + keys.map(function (k) { return folderCard('m:' + k, f[k].n, f[k].g, false); }).join('') + '</div>';
  if (pk.length) h += '<div class="sec">Collections from your PC</div><div class="fgrid">' + pk.map(function (k) { return folderCard('p:' + k, k, pcc[k], true); }).join('') + '</div>';
  gl.innerHTML = h;
  $('#fnew').onclick = function () { newFolder(); };
  gl.onclick = function (e) { var c = e.target.closest('[data-fk]'); if (c) { hp('tap'); openFolder(c.dataset.fk); } };
}
function newFolder(then) {
  var n = prompt('Folder name'); if (!n || !n.trim()) return; var f = FOLD(); if (Object.keys(f).length >= 30) return toast('You can have up to 30 folders.');
  var id = 'f' + hex(4); f[id] = { n: n.trim().slice(0, 30), g: [], t: Date.now() }; saveFolders(f); hp('ok'); if (then) then(id); else if (S.tab === 'lib' && LIB.tab === 'folders') libFolders();
}
function openFolder(key) {
  var pc = key.indexOf('p:') === 0, id = key.slice(2);
  openPage('folder', pc ? id : (FOLD()[id] || {}).n || 'Folder', function (b, page) {
    var draw = function () {
      var f = FOLD(), cur = pc ? ((S.bk && S.bk.cols && S.bk.cols[id]) || []) : ((f[id] && f[id].g) || []);
      if (!pc && !f[id]) { page.close(); return; }
      var games = cur.map(function (a) { return ownedGame(a) || { appid: a, name: 'App ' + a, playtime_forever: 0 }; });
      var h = '<div class="gpacts" style="margin:6px 0 10px">' + (pc ? '<button class="btn" id="fcopy">Copy to my folders</button>' : '<button class="btn" id="fadd">' + ic('plus', 16) + ' Add games</button><button class="btn ghost" id="fmore" aria-label="More">' + ic('more', 16) + '</button>') + '</div>' +
        (games.length ? '<div class="grid" id="fg">' + games.map(function (g) { return '<div class="game" data-g="' + g.appid + '">' + gi(g.appid, g.name) + '<div class="gn">' + esc(g.name) + '</div><div class="sub">' + (g.playtime_forever ? Math.round(g.playtime_forever / 6) / 10 + ' h' : 'Not played') + '</div></div>'; }).join('') + '</div>' : '<div class="empty">This folder is empty.' + (pc ? '' : '<br>Tap Add games.') + '</div>');
      b.innerHTML = h;
      b.onclick = function (e) { var g = e.target.closest('[data-g]'); if (g) openGame(+g.dataset.g); };
      var add = $('#fadd', b); if (add) add.onclick = function () { pickGamesSheet(id, draw); };
      var cp = $('#fcopy', b); if (cp) cp.onclick = function () { var ff = FOLD(), nid = 'f' + hex(4); ff[nid] = { n: id.slice(0, 30), g: cur.slice(0, 500), t: Date.now() }; saveFolders(ff); hp('ok'); toast('Copied. It is yours to edit now.'); page.close(); };
      var mo = $('#fmore', b); if (mo) mo.onclick = function () {
        sheet(act('edit', 'Rename folder', 'data-a="ren"') + act('trash', 'Delete folder', 'data-a="del"', 'bad'));
        $('#sheet').onclick = function (e) { var a = e.target.closest('[data-a]'); if (!a) return; closeSheet(); var ff = FOLD();
          if (a.dataset.a === 'ren') { var n = prompt('Folder name', ff[id].n); if (n && n.trim()) { ff[id].n = n.trim().slice(0, 30); saveFolders(ff); page.title(ff[id].n); } }
          else if (confirm('Delete the folder "' + ff[id].n + '"? Your games are not touched.')) { delete ff[id]; saveFolders(ff); page.close(); } };
      };
    };
    draw(); page.onClose = function () { if (S.tab === 'lib' && LIB.tab === 'folders') libFolders(); };
  });
}
function pickGamesSheet(id, done) {
  var all = (S.games || cget('games') || []).slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
  sheet('<h3 style="margin:0 0 8px">Add games</h3><input class="in" id="pg-q" placeholder="Search your games" autocomplete="off"><div id="pg-l" style="margin-top:8px;max-height:52vh;overflow-y:auto"></div>');
  var paint = function () {
    var q = $('#pg-q').value.trim().toLowerCase(), f = FOLD(), cur = (f[id] && f[id].g) || [], l = all.filter(function (g) { return !q || (g.name || '').toLowerCase().indexOf(q) >= 0; }).slice(0, 80);
    $('#pg-l').innerHTML = l.map(function (g) { return '<div class="row" data-pg="' + g.appid + '"><div class="gimini">' + gi(g.appid, g.name) + '</div><div class="grow name wrap2">' + esc(g.name) + '</div><span class="chk ' + (cur.indexOf(g.appid) >= 0 ? 'on' : '') + '">' + (cur.indexOf(g.appid) >= 0 ? ic('check', 14) : '') + '</span></div>'; }).join('') || '<div class="empty">No games found.</div>';
  };
  paint(); $('#pg-q').oninput = paint;
  $('#pg-l').onclick = function (e) { var r = e.target.closest('[data-pg]'); if (!r) return; var f = FOLD(), a = +r.dataset.pg; if (!f[id]) return; var i = f[id].g.indexOf(a); if (i >= 0) f[id].g.splice(i, 1); else f[id].g.push(a); saveFolders(f); hp('tap'); paint(); if (done) done(); };
  $('#sheet').onclick = null;
}
// a game's own page: which folders is it in
function folderRow(id) {
  var f = FOLD(), inn = Object.keys(f).filter(function (k) { return f[k].g.indexOf(id) >= 0; }).map(function (k) { return f[k].n; });
  return '<div class="sec">Folders</div><button class="card wide fbtn" id="gf-btn">' + ic('box', 18) + '<span class="grow" style="text-align:left">' + (inn.length ? esc(inn.join(', ')) : 'Not in a folder') + '</span><span class="sub">Change</span></button>';
}
function gameFolderSheet(id, after) {
  var f = FOLD(), keys = Object.keys(f);
  sheet('<h3 style="margin:0 0 8px">Put in folders</h3>' + (keys.length ? keys.map(function (k) { var on = f[k].g.indexOf(id) >= 0; return '<div class="row" data-fk="' + k + '"><div class="grow name">' + esc(f[k].n) + '</div><span class="chk ' + (on ? 'on' : '') + '">' + (on ? ic('check', 14) : '') + '</span></div>'; }).join('') : '<div class="empty">No folders yet.</div>') + act('plus', 'New folder', 'data-a="new"', 'acc'));
  $('#sheet').onclick = function (e) {
    var r = e.target.closest('[data-fk]'), a = e.target.closest('[data-a]');
    if (r) { var ff = FOLD(), k = r.dataset.fk, i = ff[k].g.indexOf(id); if (i >= 0) ff[k].g.splice(i, 1); else ff[k].g.push(id); saveFolders(ff); hp('tap'); gameFolderSheet(id, after); if (after) after(); }
    else if (a) { closeSheet(); newFolder(function (nid) { var ff = FOLD(); ff[nid].g.push(id); saveFolders(ff); toast('Added to the new folder'); if (after) after(); }); }
  };
}
// the Games tab can also be filtered by these folders
var _filterList = filterList;
filterList = function () { var l = _filterList(), f = FOLD(); Object.keys(f).forEach(function (k) { l.push(['fol:' + k, f[k].n]); }); return l; };
var _gameExtra = gameExtra;
gameExtra = function (id, ach, owned) { return folderRow(id) + _gameExtra(id, ach, owned); };
var _bindGameExtra = bindGameExtra;
bindGameExtra = function (id, ach, paint, d) { _bindGameExtra(id, ach, paint, d); var b = $('#gf-btn'); if (b) b.onclick = function () { gameFolderSheet(id, function () { var t = $('#gf-btn'); if (t) { var f = FOLD(), inn = Object.keys(f).filter(function (k) { return f[k].g.indexOf(id) >= 0; }).map(function (k) { return f[k].n; }); t.querySelector('.grow').textContent = inn.length ? inn.join(', ') : 'Not in a folder'; } }); }; };

// ---------- the Steam store: search all of Steam ----------
var ST = { q: '', f: 'all', start: 0, total: 0, items: [], busy: false, t: 0, seq: 0 };
var ST_FILTERS = [['all', 'Popular'], ['sale', 'On sale'], ['free', 'Free'], ['new', 'New'], ['top', 'Top rated']];
function storeCC() { try { var m = /-([A-Za-z]{2})$/.exec(navigator.language || ''); return m ? m[1].toLowerCase() : 'us'; } catch (e) { return 'us'; } }
function unent(s) { return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&reg;|&trade;|&#174;|&#8482;/g, '').replace(/&nbsp;/g, ' ').trim(); }
function parseStore(html) {
  var out = []; String(html || '').split('<a href=').slice(1).forEach(function (c) {
    var id = /data-ds-appid="(\d+)"/.exec(c); if (!id) return; var t = /<span class="title">([^<]*)</.exec(c); if (!t) return;
    var pct = /data-discount="(\d+)"/.exec(c), fin = /discount_final_price[^>]*>\s*([^<]*?)\s*</.exec(c), org = /discount_original_price[^>]*>\s*([^<]*?)\s*</.exec(c), rel = /search_released[^>]*>\s*([^<]*?)\s*</.exec(c), rv = /data-tooltip-html="([^"]*?)(?:<br>|")/.exec(c);
    out.push({ id: +id[1], name: unent(t[1]), off: pct ? +pct[1] : 0, price: fin ? unent(fin[1]) : '', was: org ? unent(org[1]) : '', date: rel ? unent(rel[1]) : '', rev: rv ? unent(rv[1]).split('<br>')[0] : '' });
  }); return out;
}
function storeUrl(start) {
  var u = 'https://store.steampowered.com/search/results/?start=' + start + '&count=25&infinite=1&l=english&cc=' + storeCC() + '&category1=998';
  if (ST.q) u += '&term=' + encodeURIComponent(ST.q);
  if (ST.f === 'sale') u += '&specials=1'; else if (ST.f === 'free') u += '&maxprice=free'; else if (ST.f === 'new') u += '&sort_by=Released_DESC'; else if (ST.f === 'top') u += '&sort_by=Reviews_DESC';
  return u;
}
function storeLoad(more) {
  if (ST.busy && more) return; var seq = ++ST.seq; ST.busy = true; if (!more) { ST.start = 0; ST.items = []; }
  storePaint(true);
  raw('GET', storeUrl(more ? ST.start : 0), {}).then(function (r) {
    if (seq !== ST.seq) return; ST.busy = false; var j = null; try { j = JSON.parse(r.text); } catch (e) { }
    if (!j || !j.results_html) { ST.err = r.code === 0 ? 'No connection.' : 'The store did not answer. Try again.'; storePaint(); return; }
    ST.err = ''; var got = parseStore(j.results_html); ST.total = j.total_count || 0; ST.start = (more ? ST.start : 0) + 25;
    got.forEach(function (g) { if (!ST.items.some(function (x) { return x.id === g.id; })) ST.items.push(g); }); storePaint();
  });
}
function storeRow(g) {
  var own = ownedGame(g.id);
  return '<div class="row sgrow" data-sg="' + g.id + '"><div class="sgi">' + gi(g.id, g.name) + '</div><div class="grow"><div class="name wrap2">' + esc(g.name) + '</div><div class="sub">' + (g.date ? esc(g.date) : '') + (g.rev ? (g.date ? ' · ' : '') + esc(g.rev) : '') + '</div><div class="sgp">' + (own ? '<span class="chip owned">In your library</span>' : '') + (g.off ? '<span class="chip off">-' + g.off + '%</span><s class="sub">' + esc(g.was) + '</s> ' : '') + '<b>' + esc(g.price || 'See store') + '</b></div></div></div>';
}
function storePaint(loading) {
  var el = $('#sres'); if (!el) return;
  var h = ST.items.map(storeRow).join('');
  if (loading && !ST.items.length) h = skel(5);
  else if (!ST.items.length) h = '<div class="empty">' + (ST.err ? esc(ST.err) : ST.q ? 'Nothing found for "' + esc(ST.q) + '".' : 'Nothing here right now.') + '</div>';
  if (ST.items.length && ST.items.length < ST.total) h += '<button class="btn ghost wide" id="smore">' + (ST.busy ? 'Loading...' : 'Show more') + '</button>';
  if (ST.err && ST.items.length) h += '<div class="sub" style="text-align:center">' + esc(ST.err) + '</div>';
  setHtml(el, h); var c = $('#scount'); if (c) c.textContent = ST.q || ST.f !== 'all' ? (ST.total ? ST.total.toLocaleString() + ' games' : '') : '';
  var m = $('#smore'); if (m) m.onclick = function () { storeLoad(true); };
}
function libStore() {
  var gl = $('#gl'); if (!gl || LIB.tab !== 'store') return;
  gl.innerHTML = '<input class="in" id="sq" placeholder="Search all of Steam" autocomplete="off" value="' + esc(ST.q) + '"><div class="seg2" id="sfil">' + ST_FILTERS.map(function (x) { return '<button class="btn sm ' + (ST.f === x[0] ? '' : 'ghost') + '" data-f="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><div class="sub" id="scount" style="margin:6px 0 8px"></div><div id="sres"></div>';
  $('#sq').oninput = function () { var v = $('#sq').value.trim(); clearTimeout(ST.t); ST.t = setTimeout(function () { if (/^\d{2,9}$/.test(v)) return; ST.q = v; storeLoad(false); }, 450); };
  $('#sq').onkeydown = function (e) { if (e.key === 'Enter') { var v = $('#sq').value.trim(); if (/^\d{2,9}$/.test(v)) openGame(+v); } };
  $('#sfil').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; ST.f = b.dataset.f; hp('tap'); $('#sfil').querySelectorAll('button').forEach(function (y) { y.classList.toggle('ghost', y !== b); }); storeLoad(false); };
  $('#sres').onclick = function (e) { var r = e.target.closest('[data-sg]'); if (r) openGame(+r.dataset.sg, (r.querySelector('.name') || {}).textContent); };
  if (ST.items.length) storePaint(); else storeLoad(false);
}

// ---------- the Library screen: Games, Folders, Wishlist, Store, Stats ----------
renderLib = function () {
  var v = $('#view');
  v.__h = null; v.innerHTML = '<div class="hdr"><h1>Library</h1></div><div class="seg" id="lseg">' + [['games', 'Games'], ['folders', 'Folders'], ['wish', 'Wishlist'], ['store', 'Store'], ['stats', 'Stats']].map(function (x) { return '<button data-t="' + x[0] + '" class="' + (LIB.tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="pad"><div id="gl"><div class="grid">' + skel(6, true) + '</div></div></div>';
  $('#lseg').onclick = function (e) { var b = e.target.closest('button'); if (b) { LIB.tab = b.dataset.t; hp('tap'); renderLib(); } };
  var sel = $('#lseg button.on'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
  ({ games: libGames, folders: function () { ensureGames().then(function () { libFolders(); }); libFolders(); }, wish: libWish, store: libStore, stats: libStats })[LIB.tab]();
};
// the store and folders from the Explore grid on Home
var _runAct3 = runAct;
runAct = function (k) {
  if (k === 'store') { hp('tap'); LIB.tab = 'store'; return go('lib'); }
  if (k === 'folders') { hp('tap'); LIB.tab = 'folders'; return go('lib'); }
  return _runAct3(k);
};
