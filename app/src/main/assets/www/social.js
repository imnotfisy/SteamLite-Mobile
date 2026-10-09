'use strict';
// ====================== SteamLite Mobile: friends, library, game pages, themes, me ======================

// ---------- friends ----------
function renderFriends() {
  var o = S.ov, v = $('#view');
  var h = '<div class="hdr"><h1>Friends</h1><button class="btn sm" id="addf">' + ic('plus', 15) + ' Add</button></div><div class="pad">';
  if (!o) { setHtml(v, h + skel(6) + '</div>'); return; }
  if (o.incoming.length) h += '<div class="sec">Requests</div>' + o.incoming.map(function (f) { return '<div class="row" data-f="r' + f.uid + '"><div class="av"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div><button class="btn sm" data-acc="' + f.uid + '">Accept</button><button class="btn sm ghost" data-dec="' + f.uid + '">' + ic('x', 15) + '</button></div>'; }).join('');
  h += '<div class="sec">Play together</div><button class="btn ghost wide" id="gnight">' + ic('dice', 18) + ' What should we play?</button>';
  h += '<div class="sec">Challenges</div><div id="chals">' + skel(1) + '</div><button class="btn ghost sm" id="newc" style="margin-top:6px">' + ic('trophy', 15) + ' Start a challenge</button>';
  var on = o.friends.filter(function (f) { return f.online; }), off = o.friends.filter(function (f) { return !f.online; }), fv = FAVF(), favFirst = function (a, b) { return (fv.indexOf(b.uid) >= 0 ? 1 : 0) - (fv.indexOf(a.uid) >= 0 ? 1 : 0); }; on.sort(favFirst); off.sort(favFirst); var gfl = S.fgFilter || ''; if (gfl) { on = on.filter(function (f) { return FG()[f.uid] === gfl; }); off = off.filter(function (f) { return FG()[f.uid] === gfl; }); }
  function row(f) { return '<div class="row" data-f="' + f.uid + '"><div class="av"' + avStyle(f.avatar) + '><i class="dot ' + (f.playing ? 'play' : f.online ? 'on' : '') + '"></i></div><div class="grow"><div class="name">' + (fv.indexOf(f.uid) >= 0 ? '<span class="mi gold">' + ic('star', 13, true) + '</span>' : '') + nameHtml(f) + (f.streak ? ' <span class="fl sub ' + (f.doneToday ? 'lit' : f.atRisk && !f.mineToday ? 'risk' : '') + '">' + ic('flame', 13) + f.streak + '</span>' : '') + '</div><div class="sub">' + (f.playing ? 'Playing ' + esc(f.playing.name) : f.online ? 'Online' : 'Offline') + (f.status ? ' · ' + esc(f.status) : '') + '</div></div>' + (FG()[f.uid] ? '<span class="chip">' + esc(FG()[f.uid]) + '</span>' : '') + '</div>'; }
  h += fgBar();
  h += '<div class="sec">Online · ' + on.length + '</div>' + (on.map(row).join('') || '<div class="sub">Nobody online right now.</div>') + '<div class="sec">Offline · ' + off.length + '</div>' + off.map(row).join('');
  if (o.outgoing.length) h += '<div class="sec">Sent requests</div>' + o.outgoing.map(function (f) { return '<div class="row"><div class="av sm"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div><span class="sub">Pending</span></div>'; }).join('');
  var changed = setHtml(v, h + '</div>');
  v.onclick = function (e) {
    var fg = e.target.closest('[data-fg]'); if (fg) { S.fgFilter = fg.dataset.fg; hp('tap'); renderFriends(); return; }
    var a = e.target.closest('[data-acc]'), d = e.target.closest('[data-dec]'), f = e.target.closest('[data-f]');
    if (a) respond(a.dataset.acc, true); else if (d) respond(d.dataset.dec, false); else if (f && !/^r/.test(f.dataset.f)) openProfile(f.dataset.f);
  };
  if (changed) { $('#addf').onclick = addFriend; $('#newc').onclick = newChallenge; $('#gnight').onclick = gameNight; }
  loadChals();
}
function respond(uid, ok) { hp('ok'); api('POST', '/social/respond', { uid: uid, accept: ok }).then(function (r) { if (r.error) toast(r.error); tick(); }); }
function friendSheet(uid) {
  var f = S.ov.friends.filter(function (x) { return x.uid === uid; })[0]; if (!f) return;
  sheet('<div class="row"><div class="av"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div></div>' + act('msg', 'Message', 'data-a="msg"') + act('user', 'View profile', 'data-a="prof"') + act('x', 'Remove friend', 'data-a="rm"', 'bad'));
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
      return '<div class="card"><div class="name">' + ic('trophy', 16) + esc(c.name) + '<span class="chip">' + esc(c.metric) + '</span></div><div class="sub">' + (c.ended ? (c.winner ? esc(c.winner.join(' & ')) + ' won' : 'Ended, nobody scored') : left + ' day' + (left === 1 ? '' : 's') + ' left') + '</div>' + c.standings.map(function (s, i) { return '<div style="margin-top:8px"><div class="sub" style="display:flex;justify-content:space-between"><span>' + (i + 1) + '. ' + esc(s.name) + (s.me ? ' (you)' : '') + '</span><span>' + (s.noData ? 'waiting' : s.score) + '</span></div><div class="bar"><i style="width:' + Math.round((s.score / top) * 100) + '%"></i></div></div>'; }).join('') + '<div style="display:flex;gap:8px;margin-top:10px"><button class="btn sm ghost" data-cc="' + esc(c.conv) + '">Open chat</button>' + (c.owner && !c.ended ? '<button class="btn sm ghost" data-ce="' + c.id + '">End</button>' : '') + '</div></div>';
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
    $('#sheet').innerHTML = '<h3 style="margin:0 0 10px">Comparing libraries...</h3>' + skel(3);
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
  $('#sheet').onclick = function (ev) { var d = ev.target.closest('[data-gn]'); if (!d) return; var e = map[d.dataset.gn]; closeSheet(); pickConv('Suggest ' + e.name + ' in...', function (cid) { sendGameTo(cid, { appid: e.appid, name: e.name, playtime_forever: 0 }); }); };
}

// ---------- profiles and lists ----------
function openProfile(uid) {
  sheet('<div style="padding:10px">' + skel(3) + '</div>');
  api('GET', '/social/profile?uid=' + uid).then(function (p) {
    if (!p.uid) { $('#sheet').innerHTML = '<div class="empty">' + esc(p.error || 'Not found') + '</div>'; return; }
    var st = p.stats;
    $('#sheet').innerHTML = '<div style="text-align:center"><div class="av lg" style="margin:0 auto 10px;background-image:url(\'' + esc(p.avatar) + '\')"></div><div class="name" style="justify-content:center;font-size:1.3em">' + nameHtml(p) + '</div><div class="sub">' + (p.playing ? 'Playing ' + esc(p.playing.name) : p.online ? 'Online' : 'Offline') + '</div>' + (p.owner ? '<div class="chips" style="justify-content:center;margin-top:8px"><span class="chip gold">Owner of SteamLite</span></div>' : p.creator ? '<div class="chips" style="justify-content:center;margin-top:8px"><span class="chip">Theme creator</span></div>' : '') + (p.bio ? '<p>' + esc(p.bio) + '</p>' : '') + '</div>' + (st ? '<div class="grid" style="margin-top:12px"><div class="card"><b>' + st.level + '</b><div class="sub">Level</div></div><div class="card"><b>' + st.hours + ' h</b><div class="sub">Played</div></div><div class="card"><b>' + st.games + '</b><div class="sub">Games</div></div><div class="card"><b>' + st.achievements + '</b><div class="sub">Achievements</div></div></div>' : '') + (p.relation === 'none' ? '<button class="btn" style="width:100%" data-add="' + p.uid + '">Add friend</button>' : '') + (p.relation === 'pending_in' ? '<button class="btn" style="width:100%" data-add="' + p.uid + '">Accept request</button>' : '') + (p.relation === 'friends' ? '<button class="btn" style="width:100%" data-dm="' + p.uid + '">' + ic('msg', 17) + ' Message</button>' : '');
    var ab = $('#sheet [data-add]'); if (ab) ab.onclick = function () { api('POST', '/social/friend', { uid: p.uid }).then(function (x) { toast(x.error || 'Done'); closeSheet(); tick(); }); };
    var db = $('#sheet [data-dm]'); if (db) db.onclick = function () { closeSheet(); api('POST', '/social/dm', { uid: p.uid }).then(function (r) { if (r.error) return toast(r.error); go('msgs'); openChat(r.id); }); };
  });
}
function openList(id) {
  sheet('<div style="padding:10px">' + skel(3) + '</div>');
  api('GET', '/social/lists/' + id).then(function (l) {
    if (!l.items) { $('#sheet').innerHTML = '<div class="empty">' + esc(l.error || 'Not found') + '</div>'; return; }
    $('#sheet').innerHTML = '<h3 style="margin:0">' + esc(l.title) + '</h3><div class="sub" style="margin-bottom:10px">by ' + esc(l.owner.name) + '</div><div class="grid">' + l.items.map(function (g) { return '<div class="game" data-gp="' + (g.appid | 0) + '">' + gi(g.appid, g.name) + '<div class="name" style="padding:8px 10px 0">' + esc(g.name) + '</div><div style="padding:6px 10px 10px"><button class="btn sm" style="width:100%" data-buy="' + (g.appid | 0) + '">Buy on Steam</button></div></div>'; }).join('') + '</div>';
  });
}

// ---------- game pages ----------
var GP = { open: false, id: 0 };
var FAVS = function () { try { return JSON.parse(ls.get('favs') || '[]'); } catch (e) { return []; } };
function strip(s) { return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim(); }
function gameDetails(id) {
  var c = cget('gd:' + id); if (c && Date.now() - c.at < 86400000) return Promise.resolve(c.d);
  return raw('GET', 'https://store.steampowered.com/api/appdetails?appids=' + id + '&cc=us&l=english', {}).then(function (r) {
    var j = null; try { j = JSON.parse(r.text); } catch (e) { } var e = j && j[id], d = e && e.success ? e.data : null;
    if (d) cset('gd:' + id, { at: Date.now(), d: { name: d.name, desc: d.short_description, genres: (d.genres || []).map(function (x) { return x.description; }), dev: d.developers, pub: d.publishers, date: d.release_date && d.release_date.date, free: d.is_free, price: d.price_overview && d.price_overview.final_formatted, off: d.price_overview && d.price_overview.discount_percent, shots: (d.screenshots || []).slice(0, 8).map(function (s) { return { t: s.path_thumbnail, f: s.path_full }; }), meta: d.metacritic && d.metacritic.score, type: d.type } });
    return d ? cget('gd:' + id).d : (c ? c.d : null);
  });
}
function gameAch(id) {
  return getKey().then(function (k) {
    if (!k) return null;
    return raw('GET', 'https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=' + encodeURIComponent(k) + '&steamid=' + S.me.steamid + '&appid=' + id + '&l=english', {}).then(function (r) {
      var j = null; try { j = JSON.parse(r.text); } catch (e) { } var a = j && j.playerstats && j.playerstats.achievements; return a && a.length ? a : null;
    });
  });
}
function openGame(id, hint) {
  id = id | 0; if (!id) return; GP.open = true; GP.id = id; hp('tap');
  var g = (S.games || cget('games') || []).filter(function (x) { return x.appid === id; })[0], title = (g && g.name) || hint || 'Game';
  var el = $('#gpage'); el.scrollTop = 0;
  el.innerHTML = '<div class="hdr gph"><button class="btn ghost sm" id="gpback">' + ic('back', 18) + '</button><div class="grow name" id="gpname">' + esc(title) + '</div><button class="btn ghost sm" id="gpshare">' + ic('share', 17) + '</button></div><div class="gphero">' + gi(id, title) + '</div><div class="pad" id="gpbody">' + skel(3) + '</div>';
  el.classList.add('open');
  $('#gpback').onclick = closeGame;
  $('#gpshare').onclick = function () { pickConv('Send ' + title + ' to...', function (cid) { sendGameTo(cid, g || { appid: id, name: title, playtime_forever: 0 }); }); };
  var paint = function (d, ach) {
    var pcOn = GP.pc === true, pcFav = pcFavs().indexOf(id) >= 0;
    if (!GP.open || GP.id !== id) return; var b = $('#gpbody'); if (!b) return; var name = (d && d.name) || title, fav = FAVS().indexOf(id) >= 0;
    var pl = S.ov ? S.ov.friends.filter(function (f) { return f.playing && +f.playing.appid === id; }) : [];
    var h = '<h2 class="gpt">' + esc(name) + '</h2>';
    h += '<div class="chips" style="margin-bottom:8px">' + (d && d.genres ? d.genres.slice(0, 4).map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') : '') + (g ? '<span class="chip owned">In your library</span>' : '<span class="chip">Not in your library</span>') + (pcFav ? '<span class="chip gold">Favourite on PC</span>' : '') + '</div>';
    if (d) h += '<div class="gprice">' + (d.free ? 'Free to play' : d.price ? (d.off ? '<span class="off">-' + d.off + '%</span> ' : '') + esc(d.price) : '') + (d.meta ? ' <span class="chip">Metacritic ' + d.meta + '</span>' : '') + '</div>';
    if (g) h += '<div class="grid g3"><div class="card"><b>' + Math.round(g.playtime_forever / 60) + ' h</b><div class="sub">Played</div></div><div class="card"><b>' + (Math.round(g.playtime_2weeks / 6) / 10) + ' h</b><div class="sub">Last 2 weeks</div></div><div class="card"><b>' + (ach ? ach.filter(function (x) { return x.achieved; }).length + '/' + ach.length : '-') + '</b><div class="sub">Achievements</div></div></div>';
    if (g) h += '<button class="btn wide' + (pcOn ? '' : ' ghost') + '" id="gppc" style="margin-bottom:8px">' + ic('gamepad', 17) + ' Play on my PC</button>' + (pcOn ? '' : '<div class="sub wrap" style="margin:-2px 0 8px">' + (GP.pc === false ? 'Your PC is not connected. Open SteamLite on it and turn on "Let my phone launch games" in Settings, Privacy.' : 'Checking your PC...') + '</div>');
    h += '<div class="gpacts"><button class="btn" data-buy="' + id + '">' + ic('external', 16) + (g ? ' Open in Steam' : ' View in store') + '</button><button class="btn ghost" id="gpfav">' + ic('star', 16, fav) + (fav ? ' Favourite' : ' Favourite') + '</button></div>';
    if (pl.length) h += '<div class="sec">Playing it now</div>' + pl.map(function (f) { return '<div class="row"><div class="av sm"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div></div>'; }).join('');
    if (d && d.desc) h += '<div class="sec">About</div><p class="gpd">' + esc(strip(d.desc)) + '</p>';
    if (d && d.shots && d.shots.length) h += '<div class="shots">' + d.shots.map(function (s) { return '<img class="shot" data-img="1" data-full="' + esc(s.f) + '" src="' + esc(s.t) + '" alt="Screenshot">'; }).join('') + '</div>';
    if (ach && ach.length) {
      var got = ach.filter(function (x) { return x.achieved; }), pct = Math.round(got.length / ach.length * 100);
      h += '<div class="sec">Achievements</div><div class="card"><div class="sub" style="display:flex;justify-content:space-between"><span>' + got.length + ' of ' + ach.length + ' unlocked</span><span>' + pct + '%</span></div><div class="bar" style="margin:6px 0 8px"><i style="width:' + pct + '%"></i></div>' + got.sort(function (a, b) { return b.unlocktime - a.unlocktime; }).slice(0, 5).map(function (x) { return '<div class="ach">' + ic('award', 18) + '<div class="grow"><div class="name">' + esc(x.name || x.apiname) + '</div><div class="sub">' + esc(x.description || '') + '</div></div></div>'; }).join('') + (got.length ? '' : '<div class="sub">Nothing unlocked yet.</div>') + '</div>';
    }
    if (d && (d.dev || d.pub || d.date)) h += '<div class="sec">Details</div><div class="card kv">' + (d.dev ? '<div><span>Developer</span><b>' + esc(d.dev.join(', ')) + '</b></div>' : '') + (d.pub ? '<div><span>Publisher</span><b>' + esc(d.pub.join(', ')) + '</b></div>' : '') + (d.date ? '<div><span>Release</span><b>' + esc(d.date) + '</b></div>' : '') + '</div>';
    if (!d) h += '<div class="empty">The store page is not available right now.</div>';
    b.innerHTML = h + gameExtra(id, ach, !!g);
    bindGameExtra(id, ach, paint, d);
    var pb = $('#gppc'); if (pb) pb.onclick = function () { if (!pcOn) return toast(GP.pc === false ? 'Your PC is not connected to SteamLite.' : 'Still checking your PC...'); api('POST', '/pc/launch', { appid: id, name: name }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); toast('Sent! It starts on your PC within about 30 seconds.'); }); };
    var fb = $('#gpfav'); if (fb) fb.onclick = function () { var f = FAVS(), i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); ls.set('favs', JSON.stringify(f)); hp('tap'); paint(d, ach); };
    if ($('#gpname') && d && d.name) $('#gpname').textContent = d.name;
  };
  GP.pc = undefined; if (g) api('GET', '/pc/status').then(function (r) { GP.pc = !!(r && r.online); if (GP.open && GP.id === id) paint(GP.d, GP.a); });
  var cached = cget('gd:' + id); if (cached) paint(cached.d, null);
  Promise.all([gameDetails(id), g ? gameAch(id) : Promise.resolve(null)]).then(function (a) { GP.d = a[0]; GP.a = a[1]; paint(a[0], a[1]); });
}
function closeGame() { GP.open = false; var el = $('#gpage'); el.classList.remove('open'); if (LIB && S.tab === 'lib' && LIB.tab === 'games') paintGames(); }

// ---------- library: games, wishlist and stats ----------
var LIB = { tab: 'games', sort: 'hours', filter: 'all' };
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
  v.__h = null; v.innerHTML = '<div class="hdr"><h1>Library</h1></div><div class="seg" id="lseg">' + [['games', 'Games'], ['wish', 'Wishlist'], ['stats', 'Stats']].map(function (x) { return '<button data-t="' + x[0] + '" class="' + (LIB.tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="pad"><div id="gl"><div class="grid">' + skel(6, true) + '</div></div></div>';
  $('#lseg').onclick = function (e) { var b = e.target.closest('button'); if (b) { LIB.tab = b.dataset.t; hp('tap'); renderLib(); } };
  ({ games: libGames, wish: libWish, stats: libStats })[LIB.tab]();
}
function libGames() {
  var cached = S.games || cget('games');
  var draw = function () {
    var gl = $('#gl'); if (!gl || !S.games || LIB.tab !== 'games') return;
    var tot = Math.round(S.games.reduce(function (s, g) { return s + g.playtime_forever; }, 0) / 60), fresh = !$('#gq');
    if (fresh) {
      gl.innerHTML = '<input class="in" id="gq" placeholder="Search your games"><div class="seg2" id="gfil"></div><div class="seg2" id="gsort"></div><div class="sub" id="gcount" style="margin:6px 0 8px"></div><div id="gg"></div>';
      $('#gq').oninput = paintGames;
      $('#gfil').onclick = function (e) { var b = e.target.closest('[data-f]'); if (b) { LIB.filter = b.dataset.f; hp('tap'); paintGames(); } };
      $('#gsort').onclick = function (e) { var b = e.target.closest('[data-s]'); if (b) { LIB.sort = b.dataset.s; hp('tap'); paintGames(); } };
      $('#gg').onclick = function (e) { var d = e.target.closest('[data-g]'); if (d) openGame(+d.dataset.g); };
    }
    paintGames();
  };
  if (cached) { S.games = cached; draw(); }
  fetchGames().then(function (g) {
    if (g) draw();
    else if (!S.games) { var el = $('#gl'); if (el) el.innerHTML = '<div class="empty">' + (S.key === '' ? 'Your Steam API key is not saved yet.<br>Open SteamLite on your PC and finish the one-time key step, then come back.' : 'Steam did not return your games.<br>Your profile\'s "Game details" must be set to Public.') + '</div>'; }
  });
}
var FILTERS0 = [['all', 'All'], ['recent', 'Recent'], ['unplayed', 'Unplayed'], ['fav', 'Favourites'], ['long', '10 h or more']];
function loadBackup(force) {
  var c = cget('bk'); if (c) S.bk = c;
  if (!force && c && Date.now() - c.at < 6 * 3600000) return;
  api('GET', '/backup').then(function (r) {
    var d = r && r.backup && r.backup.data; if (!d) return;
    var cols = {}; if (d.collections && typeof d.collections === 'object') Object.keys(d.collections).slice(0, 12).forEach(function (k) { if (Array.isArray(d.collections[k]) && d.collections[k].length) cols[k] = d.collections[k].map(Number).filter(Boolean); });
    S.bk = { at: Date.now(), fav: (Array.isArray(d.favorites) ? d.favorites : []).map(Number).filter(Boolean), cols: cols, unl: (d.metaAchievements && typeof d.metaAchievements === 'object') ? d.metaAchievements : {}, cos: (d.cosmetics && typeof d.cosmetics === 'object') ? d.cosmetics : {}, prestige: (d.prestige && d.prestige.count) || 0 }; cset('bk', S.bk);
    if (S.tab === 'lib' && LIB.tab === 'games' && $('#gg')) paintGames();
  });
}
var pcFavs = function () { return (S.bk && S.bk.fav) || []; };
var allFavs = function () { var f = FAVS().slice(); pcFavs().forEach(function (x) { if (f.indexOf(x) < 0) f.push(x); }); return f; };
function filterList() { var l = FILTERS0.slice(); if (S.bk && S.bk.cols) Object.keys(S.bk.cols).forEach(function (k) { l.push(['col:' + k, k]); }); return l; }
function paintGames() {
  var el = $('#gg'); if (!el || !S.games) return; var q = ($('#gq') ? $('#gq').value : '').toLowerCase(), fav = allFavs();
  var FILTERS = filterList(); var chips = function (list, cur, attr) { return list.map(function (x) { return '<button class="btn sm ' + (cur === x[0] ? '' : 'ghost') + '" ' + attr + '="' + x[0] + '">' + x[1] + '</button>'; }).join(''); };
  var fe = $('#gfil'), se = $('#gsort'); if (fe) setHtml(fe, chips(FILTERS, LIB.filter, 'data-f')); if (se) setHtml(se, chips([['hours', 'Most played'], ['recent', 'Last played'], ['name', 'A to Z']], LIB.sort, 'data-s'));
  var list = S.games.filter(function (g) {
    if (q && (g.name || '').toLowerCase().indexOf(q) < 0) return false;
    if (LIB.filter.indexOf('fol:') === 0) { var fo = FOLD()[LIB.filter.slice(4)]; return !!fo && fo.g.indexOf(g.appid) >= 0; }
    if (LIB.filter.indexOf('col:') === 0) return ((S.bk && S.bk.cols[LIB.filter.slice(4)]) || []).indexOf(g.appid) >= 0; if (LIB.filter === 'unplayed') return g.playtime_forever === 0; if (LIB.filter === 'recent') return g.playtime_2weeks > 0; if (LIB.filter === 'fav') return fav.indexOf(g.appid) >= 0; if (LIB.filter === 'long') return g.playtime_forever >= 600; return true;
  });
  list.sort(LIB.sort === 'name' ? function (a, b) { return (a.name || '').localeCompare(b.name || ''); } : LIB.sort === 'recent' ? function (a, b) { return (b.last || 0) - (a.last || 0); } : function (a, b) { return b.playtime_forever - a.playtime_forever; });
  var tot = Math.round(S.games.reduce(function (s, g) { return s + g.playtime_forever; }, 0) / 60), ce = $('#gcount'); if (ce) ce.textContent = list.length + ' of ' + S.games.length + ' games · ' + tot.toLocaleString() + ' hours in total';
  setHtml(el, list.length ? '<div class="grid">' + list.slice(0, 120).map(function (g) { return '<div class="game" data-g="' + g.appid + '">' + gi(g.appid, g.name) + '<div><div class="name">' + (fav.indexOf(g.appid) >= 0 ? '<span class="mi gold">' + ic('star', 13, true) + '</span>' : '') + esc(g.name) + '</div><div class="sub">' + Math.round(g.playtime_forever / 60) + ' h</div></div></div>'; }).join('') + '</div>' : '<div class="empty">Nothing matches.</div>');
}
function fetchWish() {
  return getKey().then(function (k) {
    return raw('GET', 'https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=' + S.me.steamid + (k ? '&key=' + encodeURIComponent(k) : ''), {}).then(function (r) {
      var j = {}; try { j = JSON.parse(r.text); } catch (e) { } var it = (j.response && j.response.items) || []; if (!it.length) { S.wish = []; cset('wish', []); return []; }
      it.sort(function (a, b) { return (a.priority || 999) - (b.priority || 999); }); var ids = it.map(function (x) { return x.appid; }).slice(0, 150), names = {}, p = Promise.resolve();
      for (var i = 0; i < ids.length; i += 50) (function (chunk) { p = p.then(function () { var inp = JSON.stringify({ ids: chunk.map(function (a) { return { appid: a }; }), context: { language: 'english', country_code: 'US' }, data_request: {} }); return raw('GET', 'https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=' + encodeURIComponent(inp), {}).then(function (rr) { var jj = {}; try { jj = JSON.parse(rr.text); } catch (e) { } ((jj.response && jj.response.store_items) || []).forEach(function (s) { if (s.appid) names[s.appid] = s.name; }); }); }); })(ids.slice(i, i + 50));
      return p.then(function () { S.wish = ids.map(function (a) { return { appid: a, name: names[a] || ('App ' + a) }; }); cset('wish', S.wish); syncSales(); return S.wish; });
    });
  });
}
function libWish() {
  var draw = function (w) {
    var gl = $('#gl'); if (!gl || LIB.tab !== 'wish') return;
    if (!w.length) { gl.innerHTML = '<div class="empty">Your wishlist is empty, or your Steam profile\'s wishlist is private.</div>'; return; }
    var html = '<div style="display:flex;gap:8px;margin-bottom:10px"><button class="btn sm" id="wsh">' + ic('share', 15) + ' Share my wishlist</button></div><div class="sub" style="margin-bottom:8px">' + w.length + ' games on your wishlist</div><div class="grid">' + w.map(function (g) { return '<div class="game" data-gp="' + g.appid + '">' + gi(g.appid, g.name) + '<div><div class="name">' + esc(g.name) + '</div><div class="sub">Tap to see the game</div></div></div>'; }).join('') + '</div>';
    if (!$('#wsh')) gl.innerHTML = html; else morph(gl, html);
    $('#wsh').onclick = function () { shareWishlist(w); };
  };
  var c = S.wish || cget('wish'); if (c) { S.wish = c; draw(c); }
  fetchWish().then(function (w) { draw(w); });
}
function shareWishlist(w) {
  pickConv('Share my wishlist in...', function (cid) {
    api('POST', '/social/lists', { title: 'My wishlist', items: w.slice(0, 60) }).then(function (r) {
      if (r.error) return toast(r.error);
      api('POST', '/social/send', { conv: cid, kind: 'list', data: { id: r.id } }).then(function (s) { toast(s.error || 'Wishlist shared!'); if (!s.error) hp('ok'); });
    });
  });
}
// sale alerts: the phone sends your wishlist to SteamLite Online, which checks prices and sends a notification when something goes on sale
function syncSales(force) {
  if (ls.get('saleAlerts') !== '1') return; if (!force && Date.now() - +(ls.get('wlAt') || 0) < 6 * 3600000) return;
  var go2 = function (w) { if (!w || !w.length) return; ls.set('wlAt', String(Date.now())); api('POST', '/me/wishlist', { items: w.slice(0, 150) }); };
  if (S.wish) go2(S.wish); else fetchWish().then(go2);
}
function libStats() {
  var draw = function (g) {
    var gl = $('#gl'); if (!gl || LIB.tab !== 'stats') return;
    if (!g || !g.length) { gl.innerHTML = '<div class="empty">Your library is not ready yet.</div>'; return; }
    var tot = g.reduce(function (s, x) { return s + x.playtime_forever; }, 0), two = g.reduce(function (s, x) { return s + x.playtime_2weeks; }, 0), unp = g.filter(function (x) { return x.playtime_forever === 0; }).length;
    var top = g.slice().sort(function (a, b) { return b.playtime_forever - a.playtime_forever; }).slice(0, 8), mx = top[0] ? top[0].playtime_forever || 1 : 1, rec = g.filter(function (x) { return x.playtime_2weeks > 0; }).sort(function (a, b) { return b.playtime_2weeks - a.playtime_2weeks; }).slice(0, 6), rmx = rec[0] ? rec[0].playtime_2weeks : 1;
    gl.innerHTML = '<div class="grid"><div class="card"><b>' + Math.round(tot / 60).toLocaleString() + ' h</b><div class="sub">Total played</div></div><div class="card"><b>' + g.length + '</b><div class="sub">Games</div></div><div class="card"><b>' + (Math.round(two / 6) / 10) + ' h</b><div class="sub">Last 2 weeks</div></div><div class="card"><b>' + unp + '</b><div class="sub">Never played (' + Math.round(unp / g.length * 100) + '%)</div></div></div>' +
      '<div class="sec">Most played</div><div class="card">' + top.map(function (x) { return '<div class="stat" data-gp="' + x.appid + '"><div class="sub st-l"><span>' + esc(x.name) + '</span><span>' + Math.round(x.playtime_forever / 60) + ' h</span></div><div class="bar"><i style="width:' + Math.round(x.playtime_forever / mx * 100) + '%"></i></div></div>'; }).join('') + '</div>' +
      '<div class="sec">Last two weeks</div><div class="card">' + (rec.length ? rec.map(function (x) { return '<div class="stat" data-gp="' + x.appid + '"><div class="sub st-l"><span>' + esc(x.name) + '</span><span>' + (Math.round(x.playtime_2weeks / 6) / 10) + ' h</span></div><div class="bar"><i style="width:' + Math.round(x.playtime_2weeks / rmx * 100) + '%"></i></div></div>'; }).join('') : '<div class="sub">Nothing played in the last two weeks.</div>') + '</div>';
  };
  var c = S.games || cget('games'); if (c) { S.games = c; draw(c); } else gl0();
  function gl0() { fetchGames().then(draw); }
  if (c) fetchGames().then(function (g) { if (g) draw(g); });
}

// ---------- themes: browse, apply, make and publish ----------
function renderThemes(refresh) {
  var v = $('#view');
  if (!refresh) {
    v.__h = null; v.innerHTML = '<div class="hdr"><button class="btn ghost sm" id="thback" aria-label="Back">' + ic('back', 18) + '</button><h1>Themes</h1><button class="btn sm" id="tmk">' + ic('plus', 15) + ' Create</button><button class="btn sm ghost" id="trs">Reset</button></div><div class="seg" id="tseg">' + [['official', 'Official'], ['top', 'Community'], ['new', 'New'], ['downloads', 'Most used'], ['mine', 'Mine']].map(function (x) { return '<button data-s="' + x[0] + '" class="' + (S.tsort === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="pad" id="tl">' + skel(4, true) + '</div>';
    $('#trs').onclick = function () { Look.setTheme(null); toast('Back to the default look'); };
    $('#thback').onclick = function () { go(S.prev || 'home'); };
    $('#tmk').onclick = themeMaker;
    $('#tseg').onclick = function (e) { var b = e.target.closest('button'); if (b) { S.tsort = b.dataset.s; S.tsortSet = true; ls.set('tsort', S.tsort); hp('tap'); renderThemes(); } };
  }
  if (S.tsort === 'top' && !S.tsortSet) S.tsort = ls.get('tsort') || 'official';
  if (S.tsort === 'official') { paintOfficial(); return; }
  var sort = S.tsort === 'mine' ? 'new' : S.tsort, ck = 'themes:' + sort;
  var show = function (r) { S.themeData = r; paintThemes(); };
  var c = refresh ? null : cget(ck); if (c) show(c);
  api('GET', '/themes?sort=' + sort).then(function (r) { if (r.themes) { cset(ck, r); show(r); } else if (!c && !S.themeData) { var el = $('#tl'); if (el) el.innerHTML = '<div class="empty">' + esc(r.error || 'Could not load themes') + '</div>'; } });
}
function paintOfficial() {
  var el = $('#tl'); if (!el) return; var q = (S.oq || '').toLowerCase(), cur = Look.theme && Look.theme.id;
  var list = OFFICIAL.filter(function (t) { return !q || t.name.toLowerCase().indexOf(q) >= 0 || (t.desc || '').toLowerCase().indexOf(q) >= 0; });
  var html = '<input class="in" id="oq" placeholder="Search the ' + OFFICIAL.length + ' official themes" value="' + esc(S.oq || '') + '" style="margin-bottom:10px"><div class="sub" style="margin-bottom:8px">All unlocked on your phone.</div>' + (list.length ? list.map(function (t) {
    return '<div class="card" data-ap="o' + t.id + '"><div class="swatch">' + t.colors.map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</div><div class="name">' + esc(t.name) + '</div><div class="sub wrap">' + esc(t.desc) + '</div><div style="margin-top:10px"><button class="btn sm' + (cur === t.id ? ' ghost' : '') + '" data-oa="' + t.id + '">' + (cur === t.id ? 'Applied' : 'Apply') + '</button></div></div>';
  }).join('') : '<div class="empty">No official theme matches.</div>');
  if (!$('#oq')) el.innerHTML = html; else { var keep = $('#oq'); var rest = html.slice(html.indexOf('<div class="sub"')); var wrap = document.createElement('div'); wrap.innerHTML = rest; while (keep.nextSibling) keep.parentNode.removeChild(keep.nextSibling); while (wrap.firstChild) keep.parentNode.appendChild(wrap.firstChild); }
  var inp = $('#oq'); inp.oninput = function () { S.oq = inp.value; paintOfficial(); inp.focus(); };
  el.onclick = function (e) { var a = e.target.closest('[data-oa]'); if (!a) return; var t = OFFICIAL.filter(function (x) { return x.id === a.dataset.oa; })[0]; Look.setTheme({ id: t.id, vars: t.vars }); hp('ok'); toast('Applied ' + t.name); paintOfficial(); };
}
function paintThemes() {
  var el = $('#tl'); if (!el || !S.themeData) return; var mine = S.tsort === 'mine', list = mine ? (S.themeData.mine || []) : (S.themeData.themes || []), cur = Look.theme && Look.theme.id;
  var html = !list.length ? '<div class="empty">' + (mine ? 'You have not published any themes yet. Tap Create.' : 'No themes yet.') + '</div>' : list.map(function (t) {
    if (mine) return '<div class="card" data-ap="m' + t.id + '"><div class="name">' + esc(t.name) + '<span class="chip">' + esc(t.status) + '</span></div><div class="sub">' + t.downloads + ' uses · ' + t.likes + ' likes</div><div style="margin-top:10px"><button class="btn sm ghost" data-del="' + t.id + '">' + ic('trash', 14) + ' Delete</button></div></div>';
    return '<div class="card" data-ap="' + t.id + '"><div class="swatch">' + (t.colors || []).map(function (c) { return '<i style="background:' + esc(c) + '"></i>'; }).join('') + '</div><div class="name">' + esc(t.name) + '</div><div class="sub tby">by ' + esc(t.author) + (t.owner ? tickSvg(true) : t.verified ? tickSvg(false) : '') + ' · ' + t.downloads + ' uses</div><div style="display:flex;gap:8px;margin-top:10px"><button class="btn sm' + (cur === t.id ? ' ghost' : '') + '" data-ap="' + t.id + '">' + (cur === t.id ? 'Applied' : 'Apply') + '</button><button class="btn sm ghost' + (t.liked ? ' liked' : '') + '" data-lk="' + t.id + '">' + ic('heart', 15, t.liked) + ' ' + t.likes + '</button></div></div>';
  }).join('');
  setHtml(el, html);
  el.onclick = function (e) {
    var a = e.target.closest('button[data-ap]'), l = e.target.closest('[data-lk]'), d = e.target.closest('[data-del]');
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
  var st = { bg: '#0b0f17', ac: '#8b5cf6', light: true }, keepName = '', keepDesc = '';
  function keep() { var a = $('#tn'), b = $('#td'); keepName = a ? a.value : keepName; keepDesc = b ? b.value : keepDesc; }
  function draw() {
    var v = themeVars(st.bg, st.ac, st.light);
    sheet('<h3 style="margin:0 0 8px">Make a theme</h3><input class="in" id="tn" maxlength="32" placeholder="Theme name (3+ letters)"><input class="in" id="td" maxlength="120" placeholder="Short description (optional)" style="margin-top:8px"><div class="sec">Background</div><div class="sws" id="sbg">' + BG_SW.map(function (c) { return '<button data-c="' + c + '" class="' + (c === st.bg ? 'on' : '') + '" style="background:' + c + ';border-color:' + (c === st.bg ? 'var(--text)' : 'var(--line)') + '"></button>'; }).join('') + '</div><div class="sec">Accent</div><div class="sws" id="sac">' + AC_SW.map(function (c) { return '<button data-c="' + c + '" class="' + (c === st.ac ? 'on' : '') + '" style="background:' + c + '"></button>'; }).join('') + '</div><div class="sec">Text</div><div class="seg" style="margin:0" id="stx"><button data-l="1" class="' + (st.light ? 'on' : '') + '">Light text</button><button data-l="0" class="' + (!st.light ? 'on' : '') + '">Dark text</button></div><div class="sec">Preview</div><div style="border-radius:16px;padding:14px;background:' + v['--bg-dark'] + ';color:' + v['--text-primary'] + '"><div style="font-weight:700">Your theme</div><div style="color:' + v['--text-secondary'] + ';font-size:13px;margin-bottom:10px">This is how text looks</div><div style="display:inline-block;background:' + v['--accent-color'] + ';color:#fff;border-radius:10px;padding:7px 14px;font-weight:600">Button</div></div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn ghost" style="flex:1" id="tpv">Try it here</button><button class="btn" style="flex:1" id="tpub">Publish</button></div>');
    $('#tn').value = keepName; $('#td').value = keepDesc; $('#tn').oninput = keep; $('#td').oninput = keep;
    $('#sbg').onclick = function (e) { var b = e.target.closest('button'); if (b) { keep(); st.bg = b.dataset.c; var lum = Look.rgb(st.bg); st.light = (0.299 * lum[0] + 0.587 * lum[1] + 0.114 * lum[2]) < 140; draw(); } };
    $('#sac').onclick = function (e) { var b = e.target.closest('button'); if (b) { keep(); st.ac = b.dataset.c; draw(); } };
    $('#stx').onclick = function (e) { var b = e.target.closest('button'); if (b) { keep(); st.light = b.dataset.l === '1'; draw(); } };
    $('#tpv').onclick = function () { Look.setTheme({ id: 'preview', vars: v }); toast('Applied here. Tap Reset on the Themes tab to undo.'); };
    $('#tpub').onclick = function () {
      var name = $('#tn').value.trim(); if (name.length < 3) return toast('Give the theme a name (3+ letters).');
      $('#tpub').disabled = true; api('POST', '/themes', { name: name, desc: $('#td').value, vars: v, css: '' }).then(function (r) { $('#tpub').disabled = false; if (r.error) return toast(r.error); closeSheet(); hp('ok'); toast('Published! Everyone can find it now.'); S.tsort = 'mine'; renderThemes(); });
    };
  }
  draw();
}

// ---------- news and polls (announcements and votes from SteamLite Online) ----------
function loadNews() {
  if (!S.tok) return;
  Promise.all([api('GET', '/status'), api('GET', '/polls')]).then(function (a) { S.news = { status: a[0] || {}, polls: (a[1] && a[1].polls) || [], at: Date.now() }; var b = $('#newsb'); if (b) { var dot = b.querySelector('.ndot'); if (newsUnseen() && !dot) b.insertAdjacentHTML('beforeend', '<i class="ndot"></i>'); else if (!newsUnseen() && dot) dot.remove(); } });
}
function seenAnn() { try { return JSON.parse(ls.get('seenAnn') || '[]'); } catch (e) { return []; } }
function newsUnseen() { var n = S.news; if (!n) return false; var seen = seenAnn(); return ((n.status.announcements || []).some(function (x) { return seen.indexOf(x.id) < 0; })) || n.polls.some(function (p) { return p.mine == null; }); }
function openNews() {
  var n = S.news || { status: {}, polls: [] }, st = n.status || {}, anns = st.announcements || [];
  var h = '<h3 style="margin:0 0 8px">News and polls</h3>';
  if (st.motd) h += '<div class="card" style="background:color-mix(in srgb,var(--acc) 22%,var(--card))">' + esc(st.motd) + '</div>';
  if (anns.length) h += '<div class="sec">Announcements</div>' + anns.map(function (a) { return '<div class="card"><div class="name">' + esc(a.title) + '</div><div class="sub wrap">' + esc(a.date || '') + '</div><div style="margin-top:6px">' + esc(a.text) + '</div>' + (a.url ? '<button class="btn sm ghost" style="margin-top:8px" data-url="' + esc(a.url) + '">' + ic('external', 14) + ' Read more</button>' : '') + '</div>'; }).join('');
  if (n.polls.length) h += '<div class="sec">Polls</div>' + n.polls.map(function (p) {
    var tot = p.total || 0; return '<div class="card"><div class="name">' + esc(p.title) + '</div>' + p.items.map(function (i) { var pct = tot ? Math.round(i.votes / tot * 100) : 0, mine = p.mine === i.id; return '<button class="poll' + (mine ? ' mine' : '') + '" data-pv="' + esc(p.id) + '|' + esc(i.id) + '"><span class="pf" style="width:' + pct + '%"></span><span class="pt">' + (mine ? ic('check', 15) + ' ' : '') + esc(i.title) + '</span><span class="pp">' + pct + '%</span></button>'; }).join('') + '<div class="sub" style="margin-top:6px">' + tot + ' vote' + (tot === 1 ? '' : 's') + (p.mine ? ' · tap another option to change your vote' : '') + '</div></div>';
  }).join('');
  if (!anns.length && !n.polls.length && !st.motd) h += '<div class="empty">Nothing new right now.</div>';
  sheet(h);
  ls.set('seenAnn', JSON.stringify(anns.map(function (a) { return a.id; }))); var b = $('#newsb .ndot'); if (b && !n.polls.some(function (p) { return p.mine == null; })) b.remove();
  $('#sheet').onclick = function (e) {
    var v = e.target.closest('[data-pv]'); if (!v) return; var parts = v.dataset.pv.split('|'); hp('ok');
    api('POST', '/vote', { pollId: parts[0], optionId: parts[1] }).then(function (r) { if (r.error) return toast(r.error); toast('Vote saved'); api('GET', '/polls').then(function (pp) { S.news.polls = (pp && pp.polls) || []; openNews(); }); });
  };
}

// ---------- notification check: shows what is working and what is not, and can send a test ----------
function agoLong(t) { var s = Math.round((Date.now() - t) / 1000); return s < 60 ? s + ' seconds ago' : s < 3600 ? Math.round(s / 60) + ' minutes ago' : s < 86400 ? Math.round(s / 3600) + ' hours ago' : Math.round(s / 86400) + ' days ago'; }
function paintNotifCheck(result) {
  var el = $('#ncheck'); if (!el) return; var s = notifState(), perm = s.permission !== false && s.enabled !== false, row = function (label, good, text) { return '<div><span>' + label + '</span><b class="' + (good ? 'ok-t' : 'bad-t') + '">' + text + '</b></div>'; };
  var h = '<div class="name" style="margin-bottom:6px">' + ic('bell', 17) + ' Notification check</div><div class="diag">' +
    row('Android allows notifications', perm && s.channel !== false, perm ? (s.channel === false ? 'Blocked for messages' : 'Yes') : 'No') +
    row('Google Play services', s.play !== false, s.play === false ? 'Missing' : 'Yes') +
    row('Instant push connected', !!s.push, s.push ? 'Yes' : 'Not yet') +
    row('Last push received', !!s.lastPushAt, s.lastPushAt ? agoLong(s.lastPushAt) : 'Never') +
    row('Last notification shown', !!s.lastShownAt, s.lastShownAt ? agoLong(s.lastShownAt) : 'Never') + '</div>' +
    (s.lastPushErr ? '<div class="sub wrap" style="margin-top:6px;color:var(--bad)">' + esc(s.lastPushErr) + '</div>' : '') +
    (s.push && !s.lastPushAt && s.batteryOpt ? '<div class="sub wrap" style="margin-top:6px">Your phone may be putting SteamLite to sleep' + (s.maker ? ' (' + esc(s.maker) + ')' : '') + '. Open the app settings, then Battery, and choose Unrestricted. Do not swipe SteamLite away from recent apps if your phone force-stops it.</div>' : '') +
    (s.error ? '<div class="sub wrap" style="margin-top:6px;color:var(--bad)">' + esc(s.error) + '</div>' : '') +
    (result ? '<div class="sub wrap" style="margin-top:6px">' + esc(result) + '</div>' : '') +
    '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' + (perm && s.channel !== false ? '' : '<button class="btn sm" id="nfix">Fix in Android settings</button>') + '<button class="btn sm ghost" id="ntest">' + ic('send', 14) + ' Send a test notification</button>' + (s.push ? '' : '<button class="btn sm ghost" id="nretry">Reconnect</button>') + '<button class="btn sm ghost" id="nbat">App settings and battery</button></div>';
  el.innerHTML = h;
  var fx = $('#nfix'); if (fx) fx.onclick = function () { CB.notif = function () { setTimeout(function () { paintNotifCheck(); checkNotifBanner(); }, 800); }; N('askNotif'); };
  var nb = $('#nbat'); if (nb) nb.onclick = function () { N('openAppSettings'); };
  var rt = $('#nretry'); if (rt) rt.onclick = function () { N('repush'); toast('Trying to connect...'); setTimeout(function () { paintNotifCheck(); }, 4000); };
  $('#ntest').onclick = function () {
    if (!perm) { toast('Allow notifications first.'); return; } $('#ntest').disabled = true;
    api('POST', '/push/test').then(function (r) {
      var msg;
      if (r.error) msg = r.error; else if (!r.ok) msg = 'The server could not send a test.'; else if (!r.devices) msg = 'SteamLite Online does not know this phone yet. Tap Reconnect, wait a few seconds and try again.';
      else { var good = r.results.filter(function (x) { return x.status === 200; }).length; msg = good ? 'Sent to ' + good + ' phone' + (good === 1 ? '' : 's') + '. A notification should appear in a second or two. If it does not, check Do Not Disturb and battery saver.' : 'Google did not accept it (' + r.results.map(function (x) { return x.status || x.error; }).join(', ') + '). Tap Reconnect and try again.'; }
      paintNotifCheck(msg);
    });
  };
}

// ---------- the Steam Web API key: see it is saved, add it or change it ----------
function paintKeyCard() {
  var st = $('#keystat'), bt = $('#keybtn'); if (!st) return;
  getKey().then(function (k) { if (!$('#keystat')) return; st.textContent = k ? 'Saved on your account (ends ' + k.slice(-4) + '). Your library, wishlist and friend comparisons use it.' : 'No key saved yet. Add one to see your games here.'; bt.textContent = k ? 'Change' : 'Add'; });
}
function keySheet() {
  sheet('<h3 style="margin:0 0 6px">Steam Web API key</h3><div class="sub wrap" style="margin-bottom:10px">It lets SteamLite read your games, wishlist and friends. It stays encrypted on your SteamLite account.</div>' +
    '<div class="row" style="cursor:default"><span class="ai">' + ic('external', 20) + '</span><div class="grow"><b>1. Get your key</b><div class="sub wrap">Open Steam\'s key page, sign in, type any website name (like steamlite) and copy the 32-letter key.</div></div><button class="btn sm ghost" id="kopen">Open</button></div>' +
    '<div class="row" style="cursor:default"><span class="ai">' + ic('check', 20) + '</span><div class="grow"><b>2. Paste it here</b></div></div>' +
    '<input class="in" id="kin" maxlength="32" placeholder="32-character key" autocomplete="off" autocapitalize="none" spellcheck="false" style="font-family:monospace;letter-spacing:.04em"><div class="sub wrap" id="kmsg" style="margin:6px 0 0;min-height:18px"></div>' +
    '<button class="btn wide" style="margin-top:10px" id="ksave">Save key</button>');
  $('#kopen').onclick = function () { N('openUrl', 'https://steamcommunity.com/dev/apikey'); };
  $('#kin').oninput = function () { $('#kmsg').textContent = ''; };
  $('#ksave').onclick = function () {
    var k = $('#kin').value.trim(), msg = $('#kmsg');
    if (!/^[0-9A-Fa-f]{32}$/.test(k)) { msg.style.color = 'var(--bad)'; msg.textContent = 'A key is exactly 32 letters and numbers (0-9, A-F).'; return; }
    $('#ksave').disabled = true; $('#ksave').textContent = 'Checking with Steam...';
    api('PUT', '/me/key', { key: k }).then(function (r) {
      $('#ksave').disabled = false; $('#ksave').textContent = 'Save key';
      if (r.error || r.ok === false) { msg.style.color = 'var(--bad)'; msg.textContent = r.error || 'Steam did not accept that key.'; return; }
      S.key = k; S.games = null; S.wish = null; ls.del('c:games'); ls.del('c:wish'); hp('ok'); closeSheet(); toast('Key saved'); paintKeyCard();
      if (S.tab === 'lib') renderLib();
    });
  };
  setTimeout(function () { var e = $('#kin'); e && e.focus(); }, 350);
}

// ---------- me ----------
function sw(id, on) { return '<label class="sw"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><i></i></label>'; }
function renderMe() {
  var m = S.me, v = $('#view'), canLock = N('canLock') === true, push = N('pushOn') === true;
  v.__h = null; v.innerHTML = '<div class="hdr"><h1>Me</h1></div><div class="pad">' +
    '<div class="card" style="text-align:center"><div class="av lg" style="margin:0 auto 10px;background-image:url(\'' + esc(m.avatar) + '\')"></div><div class="name" style="justify-content:center;font-size:1.3em">' + nameHtml(m) + '</div><div class="chips" style="justify-content:center;margin-top:8px">' + (m.owner ? '<span class="chip gold">Owner · everything unlocked</span>' : m.verified ? '<span class="chip">Verified</span>' : '') + '<span class="chip">Member since ' + new Date(m.created).toLocaleDateString() + '</span></div></div>' +
    '<div class="card"><div class="sub">Your SteamLite code</div><div style="display:flex;align-items:center;gap:10px"><b style="font-size:1.3em;letter-spacing:.04em" class="grow">' + esc(m.code) + '</b><button class="btn sm ghost" id="cpc">' + ic('copy', 15) + ' Copy</button></div><div class="sub wrap">Friends type this to add you.</div></div>' +
    '<div class="card"><div class="sub" style="margin-bottom:6px">Bio</div><textarea class="in" id="bio" rows="2" maxlength="160" placeholder="Say something about yourself"></textarea><button class="btn sm" style="margin-top:8px" id="bios">Save bio</button></div>' +
    '<div class="sec">Look</div><div class="card"><div class="sub">Mode</div><div class="seg" style="margin:6px 0 12px" id="smode">' + [['auto', 'Auto'], ['dark', 'Dark'], ['light', 'Light']].map(function (x) { return '<button data-m="' + x[0] + '" class="' + (Look.mode === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="sub">Text size</div><div class="seg" style="margin:6px 0 0" id="ssize">' + [[0.9, 'Small'], [1, 'Normal'], [1.12, 'Large'], [1.25, 'Huge']].map(function (x) { return '<button data-z="' + x[0] + '" class="' + (Look.size === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
    '<div class="sec">Steam connection</div><div class="card"><div class="opt" style="padding:0"><div class="grow"><b>Steam Web API key</b><div class="sub wrap" id="keystat">Checking...</div></div><button class="btn sm" id="keybtn">Change</button></div></div>' +
    '<div class="sec">Notifications and privacy</div><div class="card" id="ncheck"></div><div class="card"><div class="opt"><div class="grow"><b>Message notifications</b><div class="sub wrap">' + (push ? 'Instant. You get a notification the moment a message, friend request or reminder arrives, and you can reply from it.' : 'Waiting for instant notifications to connect. Until then, new messages show up within about 15 minutes.') + '</div></div>' + sw('tnot', ls.get('muteAll') !== '1') + '</div><div class="opt"><div class="grow"><b>Show what I am playing</b><div class="sub wrap">Friends see your online status and game.</div></div>' + sw('tplay', ls.get('sharePlay') !== '0') + '</div>' + '<div class="opt"><div class="grow"><b>Sale alerts</b><div class="sub wrap">Get a notification when a game on your wishlist goes on sale (20% off or more). Your wishlist is sent to SteamLite Online for this.</div></div>' + sw('tsale', ls.get('saleAlerts') === '1') + '</div>' + (canLock ? '<div class="opt"><div class="grow"><b>App lock</b><div class="sub wrap">Ask for your phone\'s fingerprint, face or PIN when you come back.</div></div>' + sw('tlock', ls.get('lock') === '1') + '</div>' : '') + '</div>' +
    (S.bk ? '<div class="card"><div class="sub wrap">Synced from your PC: ' + pcFavs().length + ' favourite game' + (pcFavs().length === 1 ? '' : 's') + ' and ' + Object.keys(S.bk.cols || {}).length + ' collection' + (Object.keys(S.bk.cols || {}).length === 1 ? '' : 's') + '. They show as filters in your Library.</div></div>' : '') + '<div class="card"><div class="opt" style="padding:0"><span class="ai">' + ic('info', 20) + '</span><div class="grow"><b>Home-screen widget</b><div class="sub wrap">Press and hold your home screen, tap Widgets, then pick SteamLite to see your unread messages.</div></div></div></div>' +
    '<button class="btn ghost wide" style="margin-bottom:10px" id="myp">' + ic('user', 17) + ' View my profile</button><button class="btn ghost wide" style="margin-bottom:10px" id="cku">' + ic('download', 17) + ' Check for updates</button><button class="btn bad wide" style="margin-bottom:10px" id="so">Sign out</button><button class="btn ghost wide" style="color:var(--bad)" id="del">Delete my SteamLite account</button><div class="sub" style="text-align:center;margin-top:14px">SteamLite Mobile ' + esc(CUR) + '</div></div>';
  api('GET', '/social/profile?uid=' + (S.me.uid || '')).then(function (p) { if ($('#bio') && p.bio && !$('#bio').value) $('#bio').value = p.bio; });
  paintNotifCheck(); paintKeyCard();
  $('#keybtn').onclick = keySheet;
  $('#cpc').onclick = function () { N('copy', m.code); toast('Copied'); };
  $('#bios').onclick = function () { api('POST', '/social/bio', { bio: $('#bio').value }).then(function (r) { toast(r.error || 'Saved'); }); };
  $('#myp').onclick = function () { openProfile(S.me.uid); };
  $('#smode').onclick = function (e) { var b = e.target.closest('button'); if (b) { Look.mode = b.dataset.m; ls.set('mode', Look.mode); Look.apply(); Look.applyTheme(); renderMe(); } };
  $('#ssize').onclick = function (e) { var b = e.target.closest('button'); if (b) { Look.size = +b.dataset.z; ls.set('fsize', String(Look.size)); Look.apply(); renderMe(); } };
  $('#tnot').onchange = function () { var on = $('#tnot').checked; ls.set('muteAll', on ? '0' : '1'); N('setMuteAll', !on); if (on) { CB.notif = function (r) { if (r === 'denied') toast('Allow notifications in Android settings.'); setTimeout(paintNotifCheck, 800); }; N('askNotif'); } paintNotifCheck(); };
  $('#tplay').onchange = function () { var on = $('#tplay').checked; ls.set('sharePlay', on ? '1' : '0'); if (on) presenceNow(); else api('POST', '/social/presence', { game: null }); };
  $('#tsale').onchange = function () { var on = $('#tsale').checked; ls.set('saleAlerts', on ? '1' : '0'); if (on) { toast('Sale alerts are on'); ls.del('wlAt'); syncSales(true); CB.notif = function () { }; N('askNotif'); } else { api('DELETE', '/me/wishlist'); toast('Sale alerts are off'); } };
  if ($('#tlock')) $('#tlock').onchange = function () { ls.set('lock', $('#tlock').checked ? '1' : '0'); N('setLock', $('#tlock').checked); toast($('#tlock').checked ? 'App lock is on' : 'App lock is off'); };
  $('#cku').onclick = function () { checkUpdate(true); };
  $('#so').onclick = function () { if (confirm('Sign out of SteamLite on this phone?')) { api('POST', '/logout', {}); signedOut(); } };
  $('#del').onclick = function () { if (confirm('Delete your SteamLite account? Your messages, friends, backups and themes on the server are removed. This cannot be undone.') && confirm('Really delete it?')) api('DELETE', '/account', {}).then(function (r) { if (r.error) return toast(r.error); signedOut(); }); };
}
