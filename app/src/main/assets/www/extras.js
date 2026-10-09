'use strict';
// ====================== 1.2.0: compare, achievements, trophy room, events, recap, activity, search, leaderboard, photos ======================

// ---------- find a friend's Steam ID (the same hash the server uses) ----------
function friendSteamId(uid) {
  var m = cget('fmap'); if (m && Date.now() - m.at < 12 * 3600000 && m.map[uid]) return Promise.resolve(m.map[uid]);
  return getKey().then(function (k) {
    if (!k) return null;
    return raw('GET', 'https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=' + encodeURIComponent(k) + '&steamid=' + S.me.steamid + '&relationship=friend', {}).then(function (r) {
      var j = {}; try { j = JSON.parse(r.text); } catch (e) { } var map = {}; ((j.friendslist && j.friendslist.friends) || []).forEach(function (f) { map[sha256('steamlite-account:' + f.steamid).slice(0, 32)] = f.steamid; });
      cset('fmap', { at: Date.now(), map: map }); return map[uid] || null;
    });
  });
}
function ownedOf(steamid) {
  return getKey().then(function (k) {
    return raw('GET', 'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=' + encodeURIComponent(k) + '&steamid=' + steamid + '&include_appinfo=1&include_played_free_games=1&format=json', {}).then(function (r) { var j = {}; try { j = JSON.parse(r.text); } catch (e) { } return (j.response && j.response.games) || null; });
  });
}

// ---------- compare libraries ----------
function openCompare(uid) {
  if (!uid) {
    var fr = (S.ov && S.ov.friends) || []; if (!fr.length) return toast('Add some friends first.');
    sheet('<h3 style="margin:0 0 8px">Compare with...</h3>' + fr.map(function (f) { return '<button class="act" data-cu="' + f.uid + '"><span class="ai"><div class="av sm"' + avStyle(f.avatar) + ' style="width:30px;height:30px"></div></span><span>' + esc(NICKS()[f.uid] || f.name) + '</span></button>'; }).join(''));
    $('#sheet').onclick = function (e) { var b = e.target.closest('[data-cu]'); if (b) { closeSheet(); openCompare(b.dataset.cu); } }; return;
  }
  var f = ((S.ov && S.ov.friends) || []).filter(function (x) { return x.uid === uid; })[0] || { name: 'Friend', avatar: '' };
  openPage('compare', 'Compare libraries', function (b) {
    b.innerHTML = '<div style="padding-top:8px">' + skel(4) + '</div>';
    Promise.all([ensureGames(), friendSteamId(uid)]).then(function (a) {
      var mine = a[0], sid = a[1]; if (!mine) { b.innerHTML = '<div class="empty">Your library is not ready yet. Check your Steam key in Settings.</div>'; return; }
      if (!sid) { b.innerHTML = '<div class="empty">' + esc(f.name) + ' is not on your Steam friends list, so their games cannot be read.</div>'; return; }
      return ownedOf(sid).then(function (theirs) {
        if (!theirs) { b.innerHTML = '<div class="empty">' + esc(f.name) + ' keeps their game details private, so there is nothing to compare.</div>'; return; }
        var tm = {}; theirs.forEach(function (g) { tm[g.appid] = g; }); var mm = {}; mine.forEach(function (g) { mm[g.appid] = g; });
        var shared = [], onlyMe = [], onlyThem = [];
        mine.forEach(function (g) { if (tm[g.appid]) shared.push({ appid: g.appid, name: g.name, a: g.playtime_forever, b: tm[g.appid].playtime_forever || 0 }); else onlyMe.push({ appid: g.appid, name: g.name, a: g.playtime_forever, b: 0 }); });
        theirs.forEach(function (g) { if (!mm[g.appid]) onlyThem.push({ appid: g.appid, name: g.name, a: 0, b: g.playtime_forever || 0 }); });
        shared.sort(function (x, y) { return (y.a + y.b) - (x.a + x.b); }); onlyMe.sort(function (x, y) { return y.a - x.a; }); onlyThem.sort(function (x, y) { return y.b - x.b; });
        var hA = Math.round(mine.reduce(function (s, g) { return s + g.playtime_forever; }, 0) / 60), hB = Math.round(theirs.reduce(function (s, g) { return s + (g.playtime_forever || 0); }, 0) / 60), match = Math.round(shared.length / Math.max(1, Math.min(mine.length, theirs.length)) * 100);
        var tab = 'shared', lists = { shared: shared, me: onlyMe, them: onlyThem };
        var paintList = function () { var l = lists[tab].slice(0, 60); $('#cmplist', b).innerHTML = l.length ? l.map(function (g) { var mx = Math.max(g.a, g.b, 1); return '<div class="cmprow" data-gp="' + g.appid + '"><div class="cn">' + esc(g.name) + '</div>' + (tab === 'shared' ? '<div class="cb2"><span style="width:' + Math.round(g.a / mx * 100) + '%"></span></div><div class="cb2 t"><span style="width:' + Math.round(g.b / mx * 100) + '%"></span></div><div class="sub">You ' + Math.round(g.a / 60) + ' h · ' + esc(f.name.split(' ')[0]) + ' ' + Math.round(g.b / 60) + ' h</div>' : '<div class="sub">' + Math.round((tab === 'me' ? g.a : g.b) / 60) + ' h played</div>') + '</div>'; }).join('') + (lists[tab].length > 60 ? '<div class="sub" style="text-align:center">and ' + (lists[tab].length - 60) + ' more</div>' : '') : '<div class="empty">Nothing here.</div>'; };
        b.innerHTML = '<div class="cmphead">' + avFrame(S.me.avatar, ((S.myProf || {}).custom || {}).frame, 56) + '<span class="vs">vs</span><div class="av" style="width:56px;height:56px;' + (f.avatar ? 'background-image:url(\'' + esc(f.avatar) + '\')' : '') + '"></div></div><div class="grid g4"><div class="card"><b>' + shared.length + '</b><div class="sub">Both own</div></div><div class="card"><b>' + onlyMe.length + '</b><div class="sub">Only you</div></div><div class="card"><b>' + onlyThem.length + '</b><div class="sub">Only them</div></div><div class="card"><b>' + match + '%</b><div class="sub">Overlap</div></div></div>' +
          '<div class="card"><div class="sub" style="display:flex;justify-content:space-between"><span>You · ' + money(hA) + ' h</span><span>' + esc(f.name) + ' · ' + money(hB) + ' h</span></div><div class="vsbar"><i style="width:' + Math.round(hA / Math.max(1, hA + hB) * 100) + '%"></i></div><div class="sub" style="margin-top:6px">' + (hA === hB ? 'Dead even.' : (hA > hB ? 'You have played ' + money(hA - hB) + ' hours more.' : esc(f.name) + ' has played ' + money(hB - hA) + ' hours more.')) + '</div></div>' +
          '<div class="seg" style="margin:6px 0 10px" id="cmptab">' + [['shared', 'Both own'], ['me', 'Only you'], ['them', 'Only them']].map(function (x) { return '<button data-t="' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div id="cmplist"></div>';
        $('#cmptab', b).onclick = function (e) { var x = e.target.closest('button'); if (x) { tab = x.dataset.t; b.querySelectorAll('#cmptab button').forEach(function (y) { y.classList.toggle('on', y === x); }); paintList(); } };
        paintList();
      });
    });
  });
}

// ---------- achievement tracker ----------
var ACHSCAN = { n: 15 };
function achFor(id) {
  var c = cget('ach:' + id); if (c && Date.now() - c.at < 12 * 3600000) return Promise.resolve(c);
  return gameAch(id).then(function (a) { var o = { at: Date.now(), un: a ? a.filter(function (x) { return x.achieved; }).length : 0, total: a ? a.length : 0, got: a ? a.filter(function (x) { return x.achieved; }).map(function (x) { return { k: x.apiname, n: x.name || x.apiname }; }) : [] }; cset('ach:' + id, o); return o; });
}
function openAchievements() {
  openPage('ach', 'Achievement tracker', function (b, page) {
    b.innerHTML = '<div style="padding-top:8px">' + skel(4) + '</div>';
    ensureGames().then(function (g) {
      if (!g || !g.length) { b.innerHTML = '<div class="empty">Your library is not ready yet. Check your Steam key in Settings.</div>'; return; }
      var order = g.slice().sort(function (x, y) { return y.playtime_forever - x.playtime_forever; }), results = {}, running = 0, done = 0, want = 0;
      var paint = function () {
        var list = Object.keys(results).map(function (id) { var r = results[id], gm = g.filter(function (x) { return x.appid === +id; })[0]; return { id: +id, name: gm ? gm.name : 'Game', un: r.un, total: r.total, got: r.got }; }).filter(function (x) { return x.total > 0; });
        var un = list.reduce(function (s, x) { return s + x.un; }, 0), tot = list.reduce(function (s, x) { return s + x.total; }, 0), perfect = list.filter(function (x) { return x.un === x.total; }).length, near = list.filter(function (x) { return x.un < x.total && x.un / x.total >= 0.75; });
        list.sort(function (x, y) { var px = x.un / x.total, py = y.un / y.total; return (px === 1 ? -1 : 0) - (py === 1 ? -1 : 0) || py - px; });
        b.innerHTML = '<div class="grid g4"><div class="card"><b>' + un + '</b><div class="sub">Unlocked</div></div><div class="card"><b>' + (tot ? Math.round(un / tot * 100) : 0) + '%</b><div class="sub">Complete</div></div><div class="card"><b>' + perfect + '</b><div class="sub">100% games</div></div><div class="card"><b>' + near.length + '</b><div class="sub">Nearly there</div></div></div><div class="sub" style="margin:2px 0 8px">' + (done < want ? 'Scanning your games... ' + done + ' of ' + want : 'Scanned ' + want + ' of your most played games') + '</div>' +
          (near.length ? '<div class="sec">Almost done</div><div class="card">' + near.slice(0, 5).map(function (x) { return '<div class="stat" data-gp="' + x.id + '"><div class="sub st-l"><span>' + esc(x.name) + '</span><span>' + x.un + '/' + x.total + '</span></div><div class="bar"><i style="width:' + Math.round(x.un / x.total * 100) + '%"></i></div></div>'; }).join('') + '</div>' : '') +
          '<div class="sec">Your games</div><div class="card">' + (list.length ? list.map(function (x) { return '<div class="stat" data-gp="' + x.id + '"><div class="sub st-l"><span>' + esc(x.name) + '</span><span>' + (x.un === x.total ? 'Perfect' : x.un + '/' + x.total) + '</span></div><div class="bar' + (x.un === x.total ? ' gold' : '') + '"><i style="width:' + Math.round(x.un / x.total * 100) + '%"></i></div></div>'; }).join('') : '<div class="sub">' + (done < want ? 'Looking...' : 'None of these games have achievements.') + '</div>') + '</div>' +
          '<div class="sec">Rarest you have unlocked</div><div class="card" id="rare"><div class="sub">' + (done < want ? 'Available once scanning finishes.' : 'Checking how rare they are...') + '</div></div>' +
          (done >= want && ACHSCAN.n < order.length ? '<button class="btn ghost wide" id="more" style="margin-top:10px">Scan 15 more games</button>' : '');
        var mb = $('#more', b); if (mb) mb.onclick = function () { ACHSCAN.n += 15; start(); };
        if (done >= want) rarest(list);
      };
      var rarest = function (list) {
        var pick = list.filter(function (x) { return x.un > 0; }).slice(0, 6), out = [], i = 0;
        var next = function () { if (i >= pick.length) { var el = $('#rare', b); if (!el) return; out.sort(function (x, y) { return x.p - y.p; }); el.innerHTML = out.length ? out.slice(0, 8).map(function (x) { return '<div class="ach" data-gp="' + x.id + '">' + ic('award', 18) + '<div class="grow"><div class="name">' + esc(x.n) + '</div><div class="sub">' + esc(x.game) + ' · only ' + (Math.round(x.p * 10) / 10) + '% of players</div></div></div>'; }).join('') : '<div class="sub">Not enough data yet.</div>'; return; }
          var gm = pick[i++]; raw('GET', 'https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=' + gm.id, {}).then(function (r) { var j = {}; try { j = JSON.parse(r.text); } catch (e) { } var pc = {}; ((j.achievementpercentages && j.achievementpercentages.achievements) || []).forEach(function (a) { pc[a.name] = +a.percent; }); gm.got.forEach(function (a) { if (pc[a.k] !== undefined) out.push({ id: gm.id, game: gm.name, n: a.n, p: pc[a.k] }); }); next(); }, next);
        }; next();
      };
      var start = function () {
        want = Math.min(ACHSCAN.n, order.length); done = 0; var queue = order.slice(0, want), idx = 0;
        var pump = function () {
          while (running < 3 && idx < queue.length) { (function (gm) { running++; achFor(gm.appid).then(function (r) { results[gm.appid] = r; }, function () { }).then(function () { running--; done++; if (PGS.indexOf(page) < 0) return; if (done % 3 === 0 || done === want) paint(); pump(); }); })(queue[idx++]); }
        };
        paint(); pump();
      };
      start();
    });
  });
}

// ---------- trophy room: what you earned in SteamLite on the PC (read-only) ----------
function openTrophy() {
  openPage('trophy', 'Trophy room', function (b) {
    loadBackup(true);
    var draw = function () {
      var unl = (S.bk && S.bk.unl) || {}, all = SLDATA.ach, got = all.filter(function (a) { return unl[a.id]; }), pct = Math.round(got.length / all.length * 100);
      var card = function (a) { var ok = !!unl[a.id]; return '<div class="trc ' + (ok ? 'got' : '') + '"><span class="tri">' + ic(ok ? 'award' : 'lockc', 22) + '</span><div class="grow"><div class="name">' + esc(a.n) + '</div><div class="sub wrap">' + esc(a.d) + '</div>' + (a.t || a.r ? '<div class="chips" style="margin-top:4px">' + (a.t ? '<span class="chip">Theme reward</span>' : '') + (a.r ? '<span class="chip">' + a.r + ' streak restore' + (a.r > 1 ? 's' : '') + '</span>' : '') + '</div>' : '') + '</div></div>'; };
      b.innerHTML = '<div class="card"><div class="lvrow"><span class="lvbadge">' + got.length + '</span><div class="grow"><div class="name">' + got.length + ' of ' + all.length + ' earned</div><div class="bar" style="margin-top:6px"><i style="width:' + pct + '%"></i></div></div></div></div>' + (S.bk ? '' : '<div class="sub wrap">Your trophies come from your PC backup. Open SteamLite on your PC and turn on cloud backup (Settings, Account) if this stays empty.</div>') +
        '<div class="sec">SteamLite achievements</div>' + all.filter(function (a) { return !a.e; }).map(card).join('') + (all.some(function (a) { return a.e; }) ? '<div class="sec">Event achievements</div>' + all.filter(function (a) { return a.e; }).map(card).join('') : '');
    };
    draw(); setTimeout(draw, 2500);
  });
}

// ---------- events calendar ----------
function openEvents() {
  openPage('events', 'Events', function (b) {
    var now = new Date(), y = now.getFullYear();
    var occ = function (e) { var r = function (yy) { return [new Date(yy, e.s[0] - 1, e.s[1]), new Date(yy, e.e[0] - 1, e.e[1], 23, 59, 59)]; }, a = r(y); if (now > a[1]) a = r(y + 1); return a; };
    var list = SLDATA.events.map(function (e) { var o = occ(e), live = now >= o[0] && now <= o[1]; return { e: e, s: o[0], en: o[1], live: live, days: Math.ceil((o[0] - now) / 86400000) }; }).sort(function (a, c) { return (c.live ? 1 : 0) - (a.live ? 1 : 0) || a.s - c.s; });
    var fmt = function (d) { return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); };
    b.innerHTML = '<div class="sub wrap" style="margin:6px 0 10px">Seasonal events on your PC unlock themes, frames and titles. Play SteamLite on the PC while an event is on to earn them.</div>' + list.map(function (x) { return '<div class="card evc' + (x.live ? ' live' : '') + '"><div class="name">' + ic('calendar', 17) + esc(x.e.n) + (x.live ? '<span class="chip gold">On now</span>' : '<span class="chip">in ' + x.days + ' day' + (x.days === 1 ? '' : 's') + '</span>') + '</div><div class="sub" style="margin:2px 0 6px">' + fmt(x.s) + ' to ' + fmt(x.en) + '</div><div class="sub wrap" style="color:var(--text)">' + esc(x.e.b) + '</div>' + (x.e.t ? '<div class="chips" style="margin-top:8px"><span class="chip">Reward: ' + esc(x.e.t) + ' theme</span></div>' : '') + '</div>'; }).join('');
  });
}

// ---------- weekly recap, as a picture you can share ----------
function drawRecap(rc, accent, name) {
  var cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; var x = cv.getContext('2d'), ac = accent || '#8b5cf6';
  var g = x.createLinearGradient(0, 0, 1080, 1350); g.addColorStop(0, ac); g.addColorStop(0.55, '#14102b'); g.addColorStop(1, '#0b0f17'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.arc(900, 220, 320, 0, 7); x.fill(); x.beginPath(); x.arc(120, 1180, 260, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.font = '600 44px system-ui,sans-serif'; x.fillText('My last two weeks on Steam', 80, 140);
  x.font = '800 270px system-ui,sans-serif'; x.fillText(String(rc.hours), 80, 440); var w = x.measureText(String(rc.hours)).width; x.font = '600 70px system-ui,sans-serif'; x.fillText('hours', 100 + w, 440);
  x.font = '500 40px system-ui,sans-serif'; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText(rc.games + ' game' + (rc.games === 1 ? '' : 's') + ' played · ' + rc.all + ' in my library', 80, 520);
  x.fillStyle = '#fff'; x.font = '700 46px system-ui,sans-serif'; x.fillText('Most played', 80, 650);
  var mx = rc.top[0] ? rc.top[0].playtime_2weeks : 1;
  rc.top.forEach(function (gm, i) { var y = 720 + i * 140, wd = Math.max(40, Math.round(920 * gm.playtime_2weeks / mx)); x.fillStyle = 'rgba(255,255,255,.12)'; roundRect(x, 80, y + 40, 920, 26, 13); x.fillStyle = '#fff'; roundRect(x, 80, y + 40, wd, 26, 13); x.fillStyle = '#fff'; x.font = '600 40px system-ui,sans-serif'; var nm = gm.name.length > 26 ? gm.name.slice(0, 25) + '...' : gm.name; x.fillText(nm, 80, y + 20); x.textAlign = 'right'; x.fillText((Math.round(gm.playtime_2weeks / 6) / 10) + ' h', 1000, y + 20); x.textAlign = 'left'; });
  x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '600 38px system-ui,sans-serif'; x.fillText((name || 'SteamLite') + ' · SteamLite Mobile', 80, 1270);
  return cv;
}
function roundRect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); x.fill(); }
function openRecap() {
  openPage('recap', 'Your recap', function (b) {
    ensureGames().then(function () {
      var rc = recapNumbers(); if (!rc.all) { b.innerHTML = '<div class="empty">Your library is not ready yet.</div>'; return; }
      var accent = ((S.myProf || {}).custom || {}).accent, cv = drawRecap(rc, accent, S.me.name), url = cv.toDataURL('image/png');
      b.innerHTML = '<div class="recapimg"><img src="' + url + '" alt="Your recap"></div><div class="pfacts" style="margin-top:12px"><button class="btn" id="rc-share">' + ic('share', 16) + ' Share to a chat</button><button class="btn ghost" id="rc-save">' + ic('download', 16) + ' Save</button></div><div class="sub wrap" style="margin-top:8px">Steam only reports the last two weeks, so this recap covers that.</div>';
      $('#rc-save', b).onclick = function () { N('saveImage', url, 'steamlite-recap'); toast('Saved to your Pictures'); };
      $('#rc-share', b).onclick = function () {
        pickConv('Send your recap to...', function (cid) { toast('Uploading...'); api('POST', '/media', { mime: 'image/png', data: url.split(',')[1] }).then(function (u) { if (!u.ok) return toast(u.error || 'Could not upload the picture'); api('POST', '/social/send', { conv: cid, kind: 'image', text: 'My last two weeks', data: { id: u.id, w: 1080, h: 1350 } }).then(function (r) { toast(r.error || 'Sent!'); }); }); });
      };
    });
  });
}

// ---------- friend activity ----------
function openFeed() {
  openPage('feed', 'Friend activity', function (b) {
    var draw = function () { var l = S.feed || []; b.innerHTML = l.length ? '<div class="card" style="padding:4px 10px">' + l.map(feedRow).join('') + '</div>' : '<div class="empty">Nothing yet. When friends start a game, level up or reach a streak, it shows here.</div>'; };
    draw(); api('GET', '/social/feed').then(function (r) { if (r.items) { S.feed = r.items; cset('feed', r.items); draw(); } });
    b.onclick = function (e) { var p = e.target.closest('[data-pf]'); if (p) openProfile(p.dataset.pf); };
  });
}

// ---------- search everything ----------
function openSearch() {
  openPage('search', 'Search', function (b) {
    b.innerHTML = '<input class="in" id="gsq" placeholder="Search games, friends and messages" autocomplete="off" style="margin-top:4px"><div id="gsr" style="margin-top:10px"><div class="sub">Type at least 2 letters.</div></div>';
    var t = 0, run = function () {
      var q = $('#gsq', b).value.trim().toLowerCase(), el = $('#gsr', b); if (q.length < 2) { el.innerHTML = '<div class="sub">Type at least 2 letters.</div>'; return; }
      var fr = ((S.ov && S.ov.friends) || []).filter(function (f) { return f.name.toLowerCase().indexOf(q) >= 0 || (NICKS()[f.uid] || '').toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
      var cv = ((S.ov && S.ov.convs) || []).filter(function (c) { return c.kind === 'group' && c.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 4);
      var gm = (S.games || cget('games') || []).filter(function (g) { return (g.name || '').toLowerCase().indexOf(q) >= 0; }).slice(0, 8);
      var h = '';
      if (fr.length) h += '<div class="sec">Friends</div>' + fr.map(function (f) { return '<div class="row" data-pf="' + f.uid + '"><div class="av sm"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div></div>'; }).join('');
      if (cv.length) h += '<div class="sec">Group chats</div>' + cv.map(function (c) { return '<div class="row" data-oc="' + c.id + '"><div class="av sm"><span class="gav">' + ic('users', 16) + '</span></div><div class="grow name">' + esc(c.name) + '</div></div>'; }).join('');
      if (gm.length) h += '<div class="sec">Games</div>' + gm.map(function (g) { return '<div class="row" data-gp="' + g.appid + '"><div class="grow"><div class="name">' + esc(g.name) + '</div><div class="sub">' + Math.round(g.playtime_forever / 60) + ' h played</div></div></div>'; }).join('');
      h += '<div id="gsm"><div class="sec">Messages</div><div class="sub">Searching...</div></div>'; el.innerHTML = h;
      api('GET', '/social/searchall?q=' + encodeURIComponent(q)).then(function (r) { var m = $('#gsm', b); if (!m || $('#gsq', b).value.trim().toLowerCase() !== q) return; var l = r.results || []; m.innerHTML = '<div class="sec">Messages</div>' + (l.length ? l.map(function (x) { return '<div class="row" data-oc="' + x.conv + '"><div class="grow"><div class="name">' + esc(NICKS()[x.uid] || x.name) + ' <span class="sub">in ' + esc(x.convName) + ' · ' + new Date(x.at).toLocaleDateString() + '</span></div><div class="sub">' + esc(plain(x.text)) + '</div></div></div>'; }).join('') : '<div class="sub">No messages found.</div>'); });
    };
    $('#gsq', b).oninput = function () { clearTimeout(t); t = setTimeout(run, 350); };
    b.onclick = function (e) { var p = e.target.closest('[data-pf]'), c = e.target.closest('[data-oc]'); if (p) openProfile(p.dataset.pf); else if (c) { closeAllPages(); go('msgs'); openChat(c.dataset.oc); } };
    setTimeout(function () { var i = $('#gsq', b); i && i.focus(); }, 400);
  });
}

// ---------- leaderboard ----------
function openLeaderboard() {
  var metric = 'level';
  openPage('lb', 'Leaderboard', function (b) {
    var load = function () {
      b.innerHTML = '<div class="seg" style="margin:6px 0 10px" id="lbm">' + [['level', 'Level'], ['hours', 'Hours'], ['streak', 'Streak'], ['achievements', 'Achievements']].map(function (x) { return '<button data-m="' + x[0] + '" class="' + (metric === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div id="lbl">' + skel(5) + '</div>';
      $('#lbm', b).onclick = function (e) { var x = e.target.closest('button'); if (x) { metric = x.dataset.m; load(); } };
      api('GET', '/lb?metric=' + metric + '&limit=50').then(function (r) {
        var el = $('#lbl', b); if (!el) return; if (!r.rows) { el.innerHTML = '<div class="empty">' + esc(r.error || 'Could not load the leaderboard') + '</div>'; return; }
        el.innerHTML = (r.myRank ? '<div class="sub" style="margin-bottom:8px">You are #' + r.myRank + ' of ' + r.total + '</div>' : '') + '<div class="card" style="padding:4px 10px">' + r.rows.map(function (x) { return '<div class="row lbrow' + (x.me ? ' me' : '') + '" data-pf="' + x.uid + '"><span class="rk">' + x.rank + '</span><div class="grow"><div class="name">' + nameHtml(x) + '</div><div class="sub">Level ' + x.level + ' · ' + money(x.hours) + ' h</div></div><b>' + money(x[metric]) + '</b></div>'; }).join('') + '</div>';
        el.onclick = function (e) { var p = e.target.closest('[data-pf]'); if (p && p.dataset.pf) openProfile(p.dataset.pf); };
      });
    }; load();
  });
}

// ---------- photos in a chat ----------
function openGallery(convId) {
  openPage('gallery', 'Photos in this chat', function (b) {
    b.innerHTML = '<div class="gal">' + skel(6, true) + '</div>';
    api('GET', '/social/gallery?conv=' + convId).then(function (r) {
      var l = r.items || []; b.innerHTML = l.length ? '<div class="gal">' + l.map(function (x) { var src = x.kind === 'gif' ? (x.data && x.data.url) : MEDIA + (x.data && x.data.id); return '<img class="gimg" data-img="1" src="' + esc(src) + '" alt="Photo from ' + esc(x.name) + '">'; }).join('') + '</div>' : '<div class="empty">No photos in this chat yet.</div>';
    });
  });
}
