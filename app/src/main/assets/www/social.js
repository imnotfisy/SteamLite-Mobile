'use strict';
// ====================== SteamLite Mobile: friends, library, themes, me ======================

// ---------- friends ----------
function renderFriends() {
  var o = S.ov, v = $('#view');
  var h = '<div class="hdr"><h1>Friends</h1><button class="btn sm" id="addf">Add</button></div><div class="pad">';
  if (!o) { setHtml(v, h + skel(6) + '</div>'); return; }
  if (o.incoming.length) h += '<div class="sec">Requests</div>' + o.incoming.map(function (f) { return '<div class="row"><div class="av"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div><button class="btn sm" data-acc="' + f.uid + '">Accept</button><button class="btn sm ghost" data-dec="' + f.uid + '">✕</button></div>'; }).join('');
  h += '<div class="sec">Play together</div><button class="btn ghost" style="width:100%" id="gnight">🎲 What should we play?</button>';
  h += '<div class="sec">Challenges</div><div id="chals">' + skel(1) + '</div><button class="btn ghost sm" id="newc" style="margin-top:6px">Start a challenge</button>';
  var on = o.friends.filter(function (f) { return f.online; }), off = o.friends.filter(function (f) { return !f.online; });
  function row(f) { return '<div class="row" data-f="' + f.uid + '"><div class="av"' + avStyle(f.avatar) + '><i class="dot ' + (f.playing ? 'play' : f.online ? 'on' : '') + '"></i></div><div class="grow"><div class="name">' + nameHtml(f) + (f.streak ? ' <span class="sub">🔥' + f.streak + '</span>' : '') + '</div><div class="sub">' + (f.playing ? 'Playing ' + esc(f.playing.name) : f.online ? 'Online' : 'Offline') + '</div></div></div>'; }
  h += '<div class="sec">Online · ' + on.length + '</div>' + (on.map(row).join('') || '<div class="sub">Nobody online right now.</div>') + '<div class="sec">Offline · ' + off.length + '</div>' + off.map(row).join('');
  if (o.outgoing.length) h += '<div class="sec">Sent requests</div>' + o.outgoing.map(function (f) { return '<div class="row"><div class="av sm"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div><span class="sub">Pending</span></div>'; }).join('');
  var changed = setHtml(v, h + '</div>');
  v.onclick = function (e) {
    var a = e.target.closest('[data-acc]'), d = e.target.closest('[data-dec]'), f = e.target.closest('[data-f]');
    if (a) respond(a.dataset.acc, true); else if (d) respond(d.dataset.dec, false); else if (f) friendSheet(f.dataset.f);
  };
  if (changed) { $('#addf').onclick = addFriend; $('#newc').onclick = newChallenge; $('#gnight').onclick = gameNight; }
  loadChals();
}
function respond(uid, ok) { hp('ok'); api('POST', '/social/respond', { uid: uid, accept: ok }).then(function (r) { if (r.error) toast(r.error); tick(); }); }
function friendSheet(uid) {
  var f = S.ov.friends.filter(function (x) { return x.uid === uid; })[0]; if (!f) return;
  sheet('<div class="row"><div class="av"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div></div><button class="act" data-a="msg">💬 Message</button><button class="act" data-a="prof">👤 View profile</button><button class="act" style="color:var(--bad)" data-a="rm">Remove friend</button>');
  $('#sheet').onclick = function (e) {
    var a = e.target.closest('[data-a]'); if (!a) return; closeSheet();
    if (a.dataset.a === 'msg') api('POST', '/social/dm', { uid: uid }).then(function (r) { if (r.error) return toast(r.error); go('msgs'); openChat(r.id); });
    else if (a.dataset.a === 'prof') openProfile(uid);
    else if (confirm('Remove ' + f.name + '?')) api('POST', '/social/unfriend', { uid: uid }).then(function () { tick(); });
  };
}
function addFriend() {
  sheet('<h3 style="margin:0 0 6px">Add a friend</h3><div class="sub wrap" style="margin-bottom:10px">Ask them for their SteamLite code (find it on the Me tab) and type it here. Your code is <b>' + esc((S.me && S.me.code) || '') + '</b>.</div><input class="in" id="fc" placeholder="SL-XXXXXXXXXX" autocapitalize="characters"><button class="btn" style="width:100%;margin-top:10px" id="fok">Find player</button><div id="fres"></div>');
  $('#fok').onclick = function () {
    api('POST', '/social/find', { code: $('#fc').value }).then(function (r) {
      var f = (r.found || [])[0]; if (!f) { $('#fres').innerHTML = '<div class="sub" style="margin-top:10px">' + esc(r.error || 'Nobody found with that code.') + '</div>'; return; }
      $('#fres').innerHTML = '<div class="row"><div class="av"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div><button class="btn sm" id="fadd">Add</button></div>';
      $('#fadd').onclick = function () { api('POST', '/social/friend', { uid: f.uid }).then(function (x) { toast(x.error || (x.status === 'accepted' ? 'You are now friends!' : 'Request sent')); closeSheet(); tick(); }); };
    });
  };
}
function loadChals() {
  api('GET', '/social/challenges').then(function (r) {
    var el = $('#chals'); if (!el) return; var list = r.challenges || [];
    var sig = JSON.stringify(list); if (el.__s === sig) return; el.__s = sig;
    if (!list.length) { el.innerHTML = '<div class="sub">No challenges. Start one with your friends!</div>'; return; }
    el.innerHTML = list.map(function (c) {
      var top = (c.standings[0] && c.standings[0].score) || 1, left = Math.max(0, Math.ceil((c.endsAt - Date.now()) / 86400000));
      return '<div class="card"><div class="name">' + esc(c.name) + '<span class="chip">' + esc(c.metric) + '</span></div><div class="sub">' + (c.ended ? (c.winner ? '🏆 ' + esc(c.winner.join(' & ')) + ' won' : 'Ended, nobody scored') : left + ' day' + (left === 1 ? '' : 's') + ' left') + '</div>' + c.standings.map(function (s, i) { return '<div style="margin-top:8px"><div class="sub" style="display:flex;justify-content:space-between"><span>' + (i + 1) + '. ' + esc(s.name) + (s.me ? ' (you)' : '') + '</span><span>' + (s.noData ? 'waiting' : s.score) + '</span></div><div class="bar"><i style="width:' + Math.round((s.score / top) * 100) + '%"></i></div></div>'; }).join('') + '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn sm ghost" data-cc="' + esc(c.conv) + '">Open chat</button>' + (c.owner && !c.ended ? '<button class="btn sm ghost" data-ce="' + c.id + '">End</button>' : '') + '</div></div>';
    }).join('');
    el.onclick = function (e) { var a = e.target.closest('[data-cc]'), b = e.target.closest('[data-ce]'); if (a) { go('msgs'); openChat(a.dataset.cc); } else if (b && confirm('End this challenge now?')) api('DELETE', '/social/challenge/' + b.dataset.ce).then(function () { el.__s = ''; loadChals(); }); };
  });
}
function newChallenge() {
  var fr = (S.ov && S.ov.friends) || []; if (!fr.length) return toast('Add some friends first.');
  sheet('<h3 style="margin:0 0 10px">Start a challenge</h3><input class="in" id="cn" maxlength="32" placeholder="Challenge name"><div style="display:flex;gap:8px;margin-top:8px"><select class="in" id="cm"><option value="hours">Most hours played</option><option value="achievements">Most achievements</option><option value="streak">Best streak</option><option value="level">Most levels</option></select><select class="in" id="cd" style="width:110px"><option>3</option><option selected>7</option><option>14</option><option>30</option></select></div><div class="sub">days</div><div class="sec">Friends</div>' + fr.map(function (f) { return '<label class="row"><input type="checkbox" value="' + f.uid + '"><div class="av sm"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div></label>'; }).join('') + '<button class="btn" style="width:100%;margin-top:10px" id="cok">Start</button>');
  $('#cok').onclick = function () {
    var ids = [].map.call(document.querySelectorAll('#sheet input[type=checkbox]:checked'), function (x) { return x.value; });
    api('POST', '/social/challenge', { name: $('#cn').value, metric: $('#cm').value, days: +$('#cd').value, members: ids }).then(function (r) { if (r.error) return toast(r.error); closeSheet(); toast('Challenge started!'); tick(); var el = $('#chals'); if (el) el.__s = ''; loadChals(); });
  };
}

// ---------- "what should we play?": games you and your friends all own ----------
function gameNight() {
  var fr = (S.ov && S.ov.friends) || []; if (!fr.length) return toast('Add some friends first.');
  sheet('<h3 style="margin:0 0 4px">What should we play?</h3><div class="sub wrap" style="margin-bottom:8px">Pick who is playing. We compare libraries (friends with private game details are skipped).</div>' + fr.map(function (f) { return '<label class="row"><input type="checkbox" value="' + f.uid + '"><div class="av sm"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div></label>'; }).join('') + '<button class="btn" style="width:100%;margin-top:10px" id="gnok">Find games</button>');
  $('#gnok').onclick = function () {
    var ids = [].map.call(document.querySelectorAll('#sheet input[type=checkbox]:checked'), function (x) { return x.value; });
    if (!ids.length) return toast('Pick at least one friend.');
    $('#sheet').innerHTML = '<h3 style="margin:0 0 10px">Comparing libraries…</h3>' + skel(3);
    runGameNight(ids);
  };
}
function runGameNight(uids) {
  Promise.all([getKey(), ensureGames()]).then(function (a) {
    var key = a[0], mine = a[1]; if (!key || !mine) { closeSheet(); return toast('Your Steam key or library is not ready yet.'); }
    return raw('GET', 'https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=' + encodeURIComponent(key) + '&steamid=' + S.me.steamid + '&relationship=friend', {}).then(function (r) {
      var j = {}; try { j = JSON.parse(r.text); } catch (e) { } var sf = (j.friendslist && j.friendslist.friends) || [], idOf = {};
      sf.forEach(function (f) { idOf[sha256('steamlite-account:' + f.steamid).slice(0, 32)] = f.steamid; });
      var chosen = uids.map(function (u) { var f = S.ov.friends.filter(function (x) { return x.uid === u; })[0]; return { uid: u, name: f ? f.name : '?', steamid: idOf[u] }; });
      var skipped = [], libs = [], i = 0;
      var next = function () {
        if (i >= chosen.length) return Promise.resolve();
        var c = chosen[i++]; if (!c.steamid) { skipped.push(c.name); return next(); }
        return raw('GET', 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=' + encodeURIComponent(key) + '&steamid=' + c.steamid + '&include_appinfo=1&include_played_free_games=1&format=json', {}).then(function (rr) {
          var jj = {}; try { jj = JSON.parse(rr.text); } catch (e) { } var g = jj.response && jj.response.games; if (g && g.length) libs.push({ name: c.name, set: g }); else skipped.push(c.name);
          return new Promise(function (res) { setTimeout(res, 150); }).then(next);
        });
      };
      return next().then(function () { showGameNight(mine, libs, skipped); });
    });
  });
}
function showGameNight(mine, libs, skipped) {
  var total = libs.length + 1, map = {};
  mine.forEach(function (g) { map[g.appid] = { appid: g.appid, name: g.name, n: 1, who: ['You'], hrs: g.playtime_forever || 0 }; });
  libs.forEach(function (l) { l.set.forEach(function (g) { var e = map[g.appid] || (map[g.appid] = { appid: g.appid, name: g.name, n: 0, who: [], hrs: 0 }); if (e.who.indexOf(l.name) < 0) { e.n++; e.who.push(l.name); } e.hrs += g.playtime_forever || 0; if (!e.name) e.name = g.name; }); });
  var all = Object.keys(map).map(function (k) { return map[k]; }).filter(function (e) { return e.n >= 2 && e.name; }).sort(function (a, b) { return b.n - a.n || b.hrs - a.hrs; }).slice(0, 30);
  var everyone = all.filter(function (e) { return e.n === total; });
  var h = '<h3 style="margin:0 0 4px">Games to play together</h3><div class="sub wrap">' + (everyone.length ? everyone.length + ' game' + (everyone.length === 1 ? '' : 's') + ' everyone owns.' : 'Nothing everyone owns. Showing games most of you own.') + (skipped.length ? ' Skipped (private or not linked): ' + esc(skipped.join(', ')) + '.' : '') + '</div><div class="grid" style="margin-top:10px">';
  h += all.map(function (e) { return '<div class="game" data-gn="' + e.appid + '">' + gi(e.appid, e.name) + '<div><div class="name">' + esc(e.name) + '</div><div class="sub">' + (e.n === total ? 'Everyone owns it' : e.n + ' of ' + total + ' own it') + '</div></div></div>'; }).join('') + '</div>';
  if (!all.length) h += '<div class="empty">No shared games found.</div>';
  sheet(h);
  $('#sheet').onclick = function (ev) { var d = ev.target.closest('[data-gn]'); if (!d) return; var e = map[d.dataset.gn]; closeSheet(); pickConv('Suggest ' + e.name + ' in…', function (cid) { sendGameTo(cid, { appid: e.appid, name: e.name, playtime_forever: 0 }); }); };
}

// ---------- profiles and lists ----------
function openProfile(uid) {
  sheet('<div style="padding:10px">' + skel(3) + '</div>');
  api('GET', '/social/profile?uid=' + uid).then(function (p) {
    if (!p.uid) { $('#sheet').innerHTML = '<div class="empty">' + esc(p.error || 'Not found') + '</div>'; return; }
    var st = p.stats;
    $('#sheet').innerHTML = '<div style="text-align:center"><div class="av lg" style="margin:0 auto 10px;background-image:url(\'' + esc(p.avatar) + '\')"></div><div class="name" style="justify-content:center;font-size:1.3em">' + nameHtml(p) + '</div><div class="sub">' + (p.playing ? 'Playing ' + esc(p.playing.name) : p.online ? 'Online' : 'Offline') + '</div>' + (p.owner ? '<div class="chips" style="justify-content:center;margin-top:8px"><span class="chip gold">Owner of SteamLite</span></div>' : p.creator ? '<div class="chips" style="justify-content:center;margin-top:8px"><span class="chip">Theme creator</span></div>' : '') + (p.bio ? '<p>' + esc(p.bio) + '</p>' : '') + '</div>' + (st ? '<div class="grid" style="margin-top:12px"><div class="card"><b>' + st.level + '</b><div class="sub">Level</div></div><div class="card"><b>' + st.hours + ' h</b><div class="sub">Played</div></div><div class="card"><b>' + st.games + '</b><div class="sub">Games</div></div><div class="card"><b>' + st.achievements + '</b><div class="sub">Achievements</div></div></div>' : '') + (p.relation === 'none' ? '<button class="btn" style="width:100%" data-add="' + p.uid + '">Add friend</button>' : '') + (p.relation === 'pending_in' ? '<button class="btn" style="width:100%" data-add="' + p.uid + '">Accept request</button>' : '') + (p.relation === 'friends' ? '<button class="btn" style="width:100%" data-dm="' + p.uid + '">💬 Message</button>' : '');
    var ab = $('#sheet [data-add]'); if (ab) ab.onclick = function () { api('POST', '/social/friend', { uid: p.uid }).then(function (x) { toast(x.error || 'Done'); closeSheet(); tick(); }); };
    var db = $('#sheet [data-dm]'); if (db) db.onclick = function () { closeSheet(); api('POST', '/social/dm', { uid: p.uid }).then(function (r) { if (r.error) return toast(r.error); go('msgs'); openChat(r.id); }); };
  });
}
function openList(id) {
  sheet('<div style="padding:10px">' + skel(3) + '</div>');
  api('GET', '/social/lists/' + id).then(function (l) {
    if (!l.items) { $('#sheet').innerHTML = '<div class="empty">' + esc(l.error || 'Not found') + '</div>'; return; }
    $('#sheet').innerHTML = '<h3 style="margin:0">' + esc(l.title) + '</h3><div class="sub" style="margin-bottom:10px">by ' + esc(l.owner.name) + '</div><div class="grid">' + l.items.map(function (g) { return '<div class="game" data-buy="' + (g.appid | 0) + '">' + gi(g.appid, g.name) + '<div class="name" style="padding:8px 10px 0">' + esc(g.name) + '</div><div style="padding:6px 10px 10px"><button class="btn sm" style="width:100%">Buy on Steam</button></div></div>'; }).join('') + '</div>';
  });
}

// ---------- library: games and wishlist ----------
var LIB = { tab: 'games', sort: 'hours' };
function fetchGames() {
  return getKey().then(function (k) {
    if (!k) return null;
    return raw('GET', 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=' + encodeURIComponent(k) + '&steamid=' + S.me.steamid + '&include_appinfo=1&include_played_free_games=1&format=json', {}).then(function (r) {
      var j = {}; try { j = JSON.parse(r.text); } catch (e) { } var g = j.response && j.response.games; if (!g) return null;
      S.games = g.map(function (x) { return { appid: x.appid, name: x.name, playtime_forever: x.playtime_forever || 0, playtime_2weeks: x.playtime_2weeks || 0, last: x.rtime_last_played || 0 }; });
      cset('games', S.games); maybeSendStats(); return S.games;
    });
  });
}
function ensureGames() { if (S.games) return Promise.resolve(S.games); var c = cget('games'); if (c) { S.games = c; return Promise.resolve(c); } return fetchGames(); }
function maybeSendStats() { // only fills in the numbers for people who have not used the PC app (it keeps the real level and achievements)
  if (ls.get('sharePlay') === '0' || Date.now() - +(ls.get('statsAt') || 0) < 3 * 3600000 || !S.games || !S.me.uid) return; ls.set('statsAt', String(Date.now()));
  api('GET', '/social/profile?uid=' + S.me.uid).then(function (p) { if (p.stats) return; api('POST', '/social/stats', { level: 1, hours: Math.round(S.games.reduce(function (s, g) { return s + g.playtime_forever; }, 0) / 60), streak: 0, achievements: 0, games: S.games.length }); });
}
function renderLib() {
  var v = $('#view');
  v.innerHTML = '<div class="hdr"><h1>Library</h1></div><div class="seg" id="lseg">' + [['games', 'Games'], ['wish', 'Wishlist']].map(function (x) { return '<button data-t="' + x[0] + '" class="' + (LIB.tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="pad"><div id="gl"><div class="grid">' + skel(6, true) + '</div></div></div>';
  $('#lseg').onclick = function (e) { var b = e.target.closest('button'); if (b) { LIB.tab = b.dataset.t; renderLib(); } };
  (LIB.tab === 'games' ? libGames : libWish)();
}
function libGames() {
  var gl = $('#gl'); var cached = S.games || cget('games');
  var draw = function () {
    gl = $('#gl'); if (!gl || !S.games) return;
    var tot = Math.round(S.games.reduce(function (s, g) { return s + g.playtime_forever; }, 0) / 60);
    gl.innerHTML = '<input class="in" id="gq" placeholder="Search your games"><div style="display:flex;gap:6px;margin:10px 0 8px;overflow-x:auto" class="seg2">' + [['hours', 'Most played'], ['recent', 'Recent'], ['name', 'A–Z']].map(function (x) { return '<button class="btn sm ' + (LIB.sort === x[0] ? '' : 'ghost') + '" data-s="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><div class="sub" style="margin-bottom:8px">' + S.games.length + ' games · ' + tot.toLocaleString() + ' hours</div><div id="gg"></div>';
    $('#gq').oninput = paintGames; gl.querySelector('.seg2').onclick = function (e) { var b = e.target.closest('[data-s]'); if (b) { LIB.sort = b.dataset.s; draw(); } }; paintGames();
  };
  if (cached) { S.games = cached; draw(); }
  fetchGames().then(function (g) {
    if (g) draw();
    else if (!S.games) { var el = $('#gl'); if (el) el.innerHTML = '<div class="empty">' + (S.key === '' ? 'Your Steam API key is not saved yet.<br>Open SteamLite on your PC and finish the one-time key step, then come back.' : 'Steam did not return your games.<br>Your profile\'s "Game details" must be set to Public.') + '</div>'; }
  });
}
function paintGames() {
  var el = $('#gg'); if (!el || !S.games) return; var q = ($('#gq') ? $('#gq').value : '').toLowerCase();
  var list = S.games.filter(function (g) { return !q || (g.name || '').toLowerCase().indexOf(q) >= 0; });
  list.sort(LIB.sort === 'name' ? function (a, b) { return (a.name || '').localeCompare(b.name || ''); } : LIB.sort === 'recent' ? function (a, b) { return (b.last || 0) - (a.last || 0); } : function (a, b) { return b.playtime_forever - a.playtime_forever; });
  el.innerHTML = '<div class="grid">' + list.slice(0, 120).map(function (g) { return '<div class="game" data-g="' + g.appid + '">' + gi(g.appid, g.name) + '<div><div class="name">' + esc(g.name) + '</div><div class="sub">' + Math.round(g.playtime_forever / 60) + ' h</div></div></div>'; }).join('') + '</div>';
  el.onclick = function (e) { var d = e.target.closest('[data-g]'); if (d) gameSheet(+d.dataset.g); };
}
function gameSheet(id) {
  var g = S.games.filter(function (x) { return x.appid === id; })[0]; if (!g) return; var hrs = Math.round(g.playtime_forever / 60);
  sheet('<div style="border-radius:12px;overflow:hidden">' + gi(id, g.name) + '</div><h3 style="margin:10px 0 0">' + esc(g.name) + '</h3><div class="sub">' + hrs + ' hours played' + (g.playtime_2weeks ? ' · ' + Math.round(g.playtime_2weeks / 60 * 10) / 10 + ' h in the last 2 weeks' : '') + '</div><button class="act" data-a="steam">Open in Steam</button><button class="act" data-a="share">Share to a chat</button>');
  $('#sheet').onclick = function (e) {
    var a = e.target.closest('[data-a]'); if (!a) return;
    if (a.dataset.a === 'steam') N('openUrl', 'https://store.steampowered.com/app/' + id);
    else { closeSheet(); pickConv('Send to…', function (cid) { sendGameTo(cid, g); }); }
  };
}
function fetchWish() {
  return getKey().then(function (k) {
    return raw('GET', 'https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=' + S.me.steamid + (k ? '&key=' + encodeURIComponent(k) : ''), {}).then(function (r) {
      var j = {}; try { j = JSON.parse(r.text); } catch (e) { } var it = (j.response && j.response.items) || []; if (!it.length) { S.wish = []; cset('wish', []); return []; }
      it.sort(function (a, b) { return (a.priority || 999) - (b.priority || 999); }); var ids = it.map(function (x) { return x.appid; }).slice(0, 150), names = {}, p = Promise.resolve();
      for (var i = 0; i < ids.length; i += 50) (function (chunk) { p = p.then(function () { var inp = JSON.stringify({ ids: chunk.map(function (a) { return { appid: a }; }), context: { language: 'english', country_code: 'US' }, data_request: {} }); return raw('GET', 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(inp), {}).then(function (rr) { var jj = {}; try { jj = JSON.parse(rr.text); } catch (e) { } ((jj.response && jj.response.store_items) || []).forEach(function (s) { if (s.appid) names[s.appid] = s.name; }); }); }); })(ids.slice(i, i + 50));
      return p.then(function () { S.wish = ids.map(function (a) { return { appid: a, name: names[a] || ('App ' + a) }; }); cset('wish', S.wish); return S.wish; });
    });
  });
}
function libWish() {
  var draw = function (w) {
    var gl = $('#gl'); if (!gl) return;
    if (!w.length) { gl.innerHTML = '<div class="empty">Your wishlist is empty, or your Steam profile\'s wishlist is private.</div>'; return; }
    gl.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn sm" id="wsh">Share my wishlist</button></div><div class="sub" style="margin-bottom:8px">' + w.length + ' games on your wishlist</div><div class="grid">' + w.map(function (g) { return '<div class="game" data-buy="' + g.appid + '">' + gi(g.appid, g.name) + '<div><div class="name">' + esc(g.name) + '</div><div class="sub">Tap to open the store</div></div></div>'; }).join('') + '</div>';
    $('#wsh').onclick = function () { shareWishlist(w); };
  };
  var c = S.wish || cget('wish'); if (c) { S.wish = c; draw(c); }
  fetchWish().then(function (w) { draw(w); });
}
function shareWishlist(w) {
  pickConv('Share my wishlist in…', function (cid) {
    api('POST', '/social/lists', { title: 'My wishlist', items: w.slice(0, 60) }).then(function (r) {
      if (r.error) return toast(r.error);
      api('POST', '/social/send', { conv: cid, kind: 'list', data: { id: r.id } }).then(function (s) { toast(s.error || 'Wishlist shared!'); if (!s.error) hp('ok'); });
    });
  });
}

// ---------- themes: browse, apply, make and publish ----------
function renderThemes() {
  var v = $('#view');
  v.innerHTML = '<div class="hdr"><h1>Themes</h1><button class="btn sm" id="tmk">Create</button><button class="btn sm ghost" id="trs">Reset</button></div><div class="seg" id="tseg">' + [['top', 'Top'], ['new', 'New'], ['downloads', 'Most used'], ['mine', 'Mine']].map(function (x) { return '<button data-s="' + x[0] + '" class="' + (S.tsort === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="pad" id="tl">' + skel(4, true) + '</div>';
  $('#trs').onclick = function () { Look.setTheme(null); toast('Back to the default look'); };
  $('#tmk').onclick = themeMaker;
  $('#tseg').onclick = function (e) { var b = e.target.closest('button'); if (b) { S.tsort = b.dataset.s; renderThemes(); } };
  var sort = S.tsort === 'mine' ? 'new' : S.tsort, ck = 'themes:' + sort;
  var show = function (r) { S.themeData = r; paintThemes(); };
  var c = cget(ck); if (c) show(c);
  api('GET', '/themes?sort=' + sort).then(function (r) { if (r.themes) { cset(ck, r); show(r); } else if (!c) { var el = $('#tl'); if (el) el.innerHTML = '<div class="empty">' + esc(r.error || 'Could not load themes') + '</div>'; } });
}
function paintThemes() {
  var el = $('#tl'); if (!el || !S.themeData) return; var mine = S.tsort === 'mine', list = mine ? (S.themeData.mine || []) : (S.themeData.themes || []), cur = Look.theme && Look.theme.id;
  if (!list.length) { el.innerHTML = '<div class="empty">' + (mine ? 'You have not published any themes yet. Tap Create.' : 'No themes yet.') + '</div>'; return; }
  el.innerHTML = list.map(function (t) {
    if (mine) return '<div class="card"><div class="name">' + esc(t.name) + '<span class="chip">' + esc(t.status) + '</span></div><div class="sub">' + t.downloads + ' uses · ' + t.likes + ' likes</div><div style="margin-top:10px"><button class="btn sm ghost" data-del="' + t.id + '">Delete</button></div></div>';
    return '<div class="card"><div class="swatch">' + (t.colors || []).map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</div><div class="name">' + esc(t.name) + '</div><div class="sub">by ' + esc(t.author) + (t.owner ? ' 👑' : t.verified ? ' ✔' : '') + ' · ' + t.downloads + ' uses</div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn sm' + (cur === t.id ? ' ghost' : '') + '" data-ap="' + t.id + '">' + (cur === t.id ? 'Applied' : 'Apply') + '</button><button class="btn sm ghost" data-lk="' + t.id + '">' + (t.liked ? '❤️' : '🤍') + ' ' + t.likes + '</button></div></div>';
  }).join('');
  el.onclick = function (e) {
    var a = e.target.closest('[data-ap]'), l = e.target.closest('[data-lk]'), d = e.target.closest('[data-del]');
    if (a) { var t = (S.themeData.themes || []).filter(function (x) { return x.id === a.dataset.ap; })[0]; Look.setTheme({ id: t.id, vars: t.vars }); hp('ok'); api('GET', '/themes/' + t.id + '?dl=1'); toast('Applied ' + t.name); paintThemes(); }
    if (l) api('POST', '/themes/' + l.dataset.lk + '/like', {}).then(function (r) { if (r.error) return toast(r.error); hp('tap'); var t = (S.themeData.themes || []).filter(function (x) { return x.id === l.dataset.lk; })[0]; t.liked = r.liked; t.likes = r.likes; paintThemes(); });
    if (d && confirm('Delete this theme?')) api('DELETE', '/themes/' + d.dataset.del).then(function (r) { toast(r.error || 'Deleted'); renderThemes(); });
  };
}
var BG_SW = ['#0b0f17', '#0f0f13', '#12091f', '#07141a', '#1a0d0d', '#0d1a10', '#1b1b24', '#000000', '#f2f4f9', '#fff7ed', '#eef7ee', '#eef2ff'];
var AC_SW = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#e5e7eb'];
function themeVars(bg, ac, lightText) {
  var b = Look.rgb(bg) || [11, 15, 23], a = Look.rgb(ac) || [139, 92, 246], tx = lightText ? [238, 240, 246] : [22, 27, 38];
  var lift = lightText ? 14 : -10, card = b.map(function (x) { return x + lift; });
  return { '--bg-dark': Look.hex(b), '--bg-glass': 'rgba(' + b.join(', ') + ', 0.9)', '--bg-glass-light': 'rgba(' + card.map(function (x) { return Math.max(0, Math.min(255, x + (lightText ? 8 : -4))); }).join(', ') + ', 0.92)', '--border-glass': 'rgba(' + tx.join(', ') + ', 0.15)', '--text-primary': Look.hex(tx), '--text-secondary': Look.hex(tx.map(function (x, i) { return x * 0.6 + b[i] * 0.4; })), '--accent-color': Look.hex(a) };
}
function themeMaker() {
  var st = { bg: '#0b0f17', ac: '#8b5cf6', light: true };
  function draw() {
    var v = themeVars(st.bg, st.ac, st.light);
    sheet('<h3 style="margin:0 0 8px">Make a theme</h3><input class="in" id="tn" maxlength="32" placeholder="Theme name (3+ letters)"><input class="in" id="td" maxlength="120" placeholder="Short description (optional)" style="margin-top:8px"><div class="sec">Background</div><div class="sws" id="sbg">' + BG_SW.map(function (c) { return '<button data-c="' + c + '" class="' + (c === st.bg ? 'on' : '') + '" style="background:' + c + ';border-color:' + (c === st.bg ? 'var(--text)' : 'var(--line)') + '"></button>'; }).join('') + '</div><div class="sec">Accent</div><div class="sws" id="sac">' + AC_SW.map(function (c) { return '<button data-c="' + c + '" class="' + (c === st.ac ? 'on' : '') + '" style="background:' + c + '"></button>'; }).join('') + '</div><div class="sec">Text</div><div class="seg" style="margin:0" id="stx"><button data-l="1" class="' + (st.light ? 'on' : '') + '">Light text</button><button data-l="0" class="' + (!st.light ? 'on' : '') + '">Dark text</button></div><div class="sec">Preview</div><div style="border-radius:16px;padding:14px;background:' + v['--bg-dark'] + ';color:' + v['--text-primary'] + '"><div style="font-weight:700">Your theme</div><div style="color:' + v['--text-secondary'] + ';font-size:13px;margin-bottom:10px">This is how text looks</div><div style="display:inline-block;background:' + v['--accent-color'] + ';color:#fff;border-radius:10px;padding:7px 14px;font-weight:600">Button</div></div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn ghost" style="flex:1" id="tpv">Try it here</button><button class="btn" style="flex:1" id="tpub">Publish</button></div>');
    $('#sbg').onclick = function (e) { var b = e.target.closest('button'); if (b) { keep(); st.bg = b.dataset.c; var lum = Look.rgb(st.bg); st.light = (0.299 * lum[0] + 0.587 * lum[1] + 0.114 * lum[2]) < 140; draw(); } };
    $('#sac').onclick = function (e) { var b = e.target.closest('button'); if (b) { keep(); st.ac = b.dataset.c; draw(); } };
    $('#stx').onclick = function (e) { var b = e.target.closest('button'); if (b) { keep(); st.light = b.dataset.l === '1'; draw(); } };
    $('#tpv').onclick = function () { Look.setTheme({ id: 'preview', vars: v }); toast('Applied here. Tap Reset on the Themes tab to undo.'); };
    $('#tpub').onclick = function () {
      var name = $('#tn').value.trim(); if (name.length < 3) return toast('Give the theme a name (3+ letters).');
      $('#tpub').disabled = true; api('POST', '/themes', { name: name, desc: $('#td').value, vars: v, css: '' }).then(function (r) { $('#tpub').disabled = false; if (r.error) return toast(r.error); closeSheet(); hp('ok'); toast('Published! Everyone can find it now.'); S.tsort = 'mine'; renderThemes(); });
    };
  }
  var keepName = '', keepDesc = ''; function keep() { var a = $('#tn'), b = $('#td'); keepName = a ? a.value : ''; keepDesc = b ? b.value : ''; }
  var oldDraw = draw; draw = function () { oldDraw(); $('#tn').value = keepName; $('#td').value = keepDesc; $('#tn').oninput = keep; $('#td').oninput = keep; };
  draw();
}

// ---------- me ----------
function sw(id, on) { return '<label class="sw"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><i></i></label>'; }
function renderMe() {
  var m = S.me, v = $('#view'), canLock = N('canLock') === true;
  v.innerHTML = '<div class="hdr"><h1>Me</h1></div><div class="pad">' +
    '<div class="card" style="text-align:center"><div class="av lg" style="margin:0 auto 10px;background-image:url(\'' + esc(m.avatar) + '\')"></div><div class="name" style="justify-content:center;font-size:1.3em">' + nameHtml(m) + '</div><div class="chips" style="justify-content:center;margin-top:8px">' + (m.owner ? '<span class="chip gold">Owner · everything unlocked</span>' : m.verified ? '<span class="chip">Verified</span>' : '') + '<span class="chip">Member since ' + new Date(m.created).toLocaleDateString() + '</span></div></div>' +
    '<div class="card"><div class="sub">Your SteamLite code</div><div style="display:flex;align-items:center;gap:10px"><b style="font-size:1.3em;letter-spacing:.04em" class="grow">' + esc(m.code) + '</b><button class="btn sm ghost" id="cpc">Copy</button></div><div class="sub wrap">Friends type this to add you.</div></div>' +
    '<div class="card"><div class="sub" style="margin-bottom:6px">Bio</div><textarea class="in" id="bio" rows="2" maxlength="160" placeholder="Say something about yourself"></textarea><button class="btn sm" style="margin-top:8px" id="bios">Save bio</button></div>' +
    '<div class="sec">Look</div><div class="card"><div class="sub">Mode</div><div class="seg" style="margin:6px 0 12px" id="smode">' + [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']].map(function (x) { return '<button data-m="' + x[0] + '" class="' + (Look.mode === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="sub">Text size</div><div class="seg" style="margin:6px 0 0" id="ssize">' + [[0.9, 'Small'], [1, 'Normal'], [1.12, 'Large'], [1.25, 'Huge']].map(function (x) { return '<button data-z="' + x[0] + '" class="' + (Look.size === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
    '<div class="sec">Notifications and privacy</div><div class="card"><div class="opt"><div class="grow"><b>Message notifications</b><div class="sub wrap">When the app is closed, new messages show up within about 15 minutes.</div></div>' + sw('tnot', ls.get('muteAll') !== '1') + '</div><div class="opt"><div class="grow"><b>Show what I am playing</b><div class="sub wrap">Friends see your online status and game.</div></div>' + sw('tplay', ls.get('sharePlay') !== '0') + '</div>' + (canLock ? '<div class="opt"><div class="grow"><b>App lock</b><div class="sub wrap">Ask for your phone\'s fingerprint, face or PIN when you come back.</div></div>' + sw('tlock', ls.get('lock') === '1') + '</div>' : '') + '</div>' +
    '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="myp">View my profile</button><button class="btn ghost" style="width:100%;margin-bottom:10px" id="cku">Check for updates</button><button class="btn bad" style="width:100%;margin-bottom:10px" id="so">Sign out</button><button class="btn ghost" style="width:100%;color:var(--bad)" id="del">Delete my SteamLite account</button><div class="sub" style="text-align:center;margin-top:14px">SteamLite Mobile ' + esc(CUR) + '</div></div>';
  api('GET', '/social/profile?uid=' + (S.me.uid || '')).then(function (p) { if ($('#bio') && p.bio) $('#bio').value = p.bio; });
  $('#cpc').onclick = function () { N('copy', m.code); toast('Copied'); };
  $('#bios').onclick = function () { api('POST', '/social/bio', { bio: $('#bio').value }).then(function (r) { toast(r.error || 'Saved'); }); };
  $('#myp').onclick = function () { openProfile(S.me.uid); };
  $('#smode').onclick = function (e) { var b = e.target.closest('button'); if (b) { Look.mode = b.dataset.m; ls.set('mode', Look.mode); Look.apply(); Look.applyTheme(); renderMe(); } };
  $('#ssize').onclick = function (e) { var b = e.target.closest('button'); if (b) { Look.size = +b.dataset.z; ls.set('fsize', String(Look.size)); Look.apply(); renderMe(); } };
  $('#tnot').onchange = function () { var on = $('#tnot').checked; ls.set('muteAll', on ? '0' : '1'); N('setMuteAll', !on); if (on) { CB.notif = function (r) { if (r === 'denied') toast('Allow notifications in Android settings.'); }; N('askNotif'); } };
  $('#tplay').onchange = function () { var on = $('#tplay').checked; ls.set('sharePlay', on ? '1' : '0'); if (on) presenceNow(); else api('POST', '/social/presence', { game: null }); };
  if ($('#tlock')) $('#tlock').onchange = function () { ls.set('lock', $('#tlock').checked ? '1' : '0'); N('setLock', $('#tlock').checked); toast($('#tlock').checked ? 'App lock is on' : 'App lock is off'); };
  $('#cku').onclick = function () { checkUpdate(true); };
  $('#so').onclick = function () { if (confirm('Sign out of SteamLite on this phone?')) { api('POST', '/logout', {}); signedOut(); } };
  $('#del').onclick = function () { if (confirm('Delete your SteamLite account? Your messages, friends, backups and themes on the server are removed. This cannot be undone.') && confirm('Really delete it?')) api('DELETE', '/account', {}).then(function (r) { if (r.error) return toast(r.error); signedOut(); }); };
}
