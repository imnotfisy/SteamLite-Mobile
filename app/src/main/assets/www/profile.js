'use strict';
// ====================== 1.2.0: profile pages and the profile editor ======================
// the colours of each avatar frame (same names as the PC app)
var FRCOL = { glow: ['#8b5cf6', '#c4b5fd'], ring: ['#e5e7eb', '#9ca3af'], pulse: ['#22d3ee', '#3b82f6'], rainbow: ['#ef4444', '#8b5cf6'], flame: ['#ff6a00', '#ffd000'], aurora: ['#34d399', '#60a5fa', '#a78bfa'], gold: ['#f5c542', '#fff2b0'], galaxy: ['#6d28d9', '#0ea5e9', '#ec4899'], legend: ['#ff3d71', '#ffb300', '#7c4dff'], frost: ['#bae6fd', '#38bdf8'], bloom: ['#f9a8d4', '#fb7185'], blaze: ['#ef4444', '#f97316'], harvest: ['#d97706', '#92400e'], steamlite: ['#8b5cf6', '#3b2a78'], neon: ['#22ff88', '#00e5ff'], emerald: ['#10b981', '#065f46'], sunset: ['#fb923c', '#db2777'], mono: ['#ffffff', '#6b7280'], candy: ['#f472b6', '#60a5fa'], void: ['#1f1147', '#7c3aed'], pumpkin: ['#f97316', '#7c2d12'], holly: ['#16a34a', '#dc2626'], blossom: ['#fbcfe8', '#f472b6'], sunseeker: ['#fde047', '#fb923c'], roots: ['#a16207', '#65a30d'] };
var FR_SPIN = { rainbow: 1, aurora: 1, galaxy: 1, legend: 1, candy: 1 }, FR_PULSE = { glow: 1, pulse: 1, blaze: 1, flame: 1, neon: 1 };
function avFrame(url, frame, size) {
  size = size || 46; var c = frame && FRCOL[frame];
  if (!c) return '<span class="frm nf" style="width:' + size + 'px;height:' + size + 'px"><span class="frm-in"' + avStyle(url) + '></span></span>';
  var grad = frame === 'rainbow' ? 'conic-gradient(#ef4444,#f59e0b,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)' : c[2] ? 'conic-gradient(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + c[0] + ')' : 'linear-gradient(135deg,' + c[0] + ',' + c[1] + ')';
  return '<span class="frm f-' + frame + (FR_SPIN[frame] ? ' spin' : '') + (FR_PULSE[frame] ? ' pulse' : '') + '" style="width:' + size + 'px;height:' + size + 'px;--f1:' + c[0] + ';--fg:' + grad + '"><span class="frm-in"' + avStyle(url) + '></span></span>';
}
function bannerHtml(b, accent, h) {
  h = h || 150; var inner;
  if (b && b.mode === 'image' && b.id) inner = '<div class="bn-img" style="background-image:url(' + MEDIA + esc(b.id) + ');background-position:' + (b.x || 50) + '% ' + (b.y || 50) + '%;transform:scale(' + ((b.zoom || 100) / 100) + ');transform-origin:' + (b.x || 50) + '% ' + (b.y || 50) + '%;filter:blur(' + (b.blur || 0) + 'px)"></div>';
  else if (b && b.mode === 'gradient') inner = '<div class="bn-fill" style="background:linear-gradient(' + (b.angle || 135) + 'deg,' + (b.c1 || '#7c5cff') + ',' + (b.c2 || '#1b1233') + ')"></div>';
  else if (b && b.mode === 'solid') inner = '<div class="bn-fill" style="background:' + (b.c1 || '#7c5cff') + '"></div>';
  else inner = '<div class="bn-fill" style="background:linear-gradient(135deg,' + (accent || '#7c5cff') + ',#1b1233)"></div>';
  return '<div class="banner" style="height:' + h + 'px">' + inner + (b && b.dim ? '<div class="bn-dim" style="opacity:' + (b.dim / 100) + '"></div>' : '') + '</div>';
}
// what this player may wear: frames and titles are unlocked on the PC (by level, achievements and seasons)
function ownerMode() { return !!(S.me && S.me.owner); }
function myLevel() { return (S.myStats && S.myStats.level) || ((cget('myprof') || {}).stats || {}).level || 1; }
function unlockedFrames() {
  var s = { none: 1 }; SLDATA.freeFrames.forEach(function (f) { s[f] = 1; });
  Object.keys(SLDATA.frameLevel).forEach(function (f) { if (ownerMode() || myLevel() >= SLDATA.frameLevel[f]) s[f] = 1; });
  ((S.bk && S.bk.cos && S.bk.cos.frames) || []).forEach(function (f) { s[f] = 1; });
  if (ownerMode()) SLDATA.frames.forEach(function (f) { s[f[0]] = 1; });
  return s;
}
function frameWhy(id) { return SLDATA.frameLevel[id] ? 'Reach level ' + SLDATA.frameLevel[id] : 'Earned in events and seasons on your PC'; }
function titleOptions() {
  var out = [], seen = {}, add = function (t, how) { if (t && !seen[t]) { seen[t] = 1; out.push({ t: t, how: how }); } };
  SLDATA.titles.forEach(function (x) { if (ownerMode() || myLevel() >= x[0]) add(x[2], 'Level ' + x[0]); });
  var unl = (S.bk && S.bk.unl) || {};
  SLDATA.ach.forEach(function (a) { if (ownerMode() || unl[a.id]) add(a.n, 'Achievement'); });
  ((S.bk && S.bk.cos && S.bk.cos.titles) || []).forEach(function (t) { add(t, 'Season reward'); });
  return out;
}

// ---------- the profile page ----------
openProfile = function (uid) { openProfilePage(uid); };
function openProfilePage(uid) {
  var mine = S.me && uid === S.me.uid;
  openPage('profile', mine ? 'My profile' : 'Profile', function (b, page) {
    b.innerHTML = '<div style="padding-top:8px">' + skel(4) + '</div>';
    api('GET', '/social/profile?uid=' + uid).then(function (p) {
      if (!p.uid) { b.innerHTML = '<div class="empty">' + esc(p.error || 'Profile not found') + '</div>'; return; }
      var c = p.custom || {}, st = p.stats, accent = c.accent || '', title = c.title;
      if (mine) { S.myProf = p; S.myStats = p.stats; cset('myprof', p); }
      var nick = !mine && NICKS()[p.uid];
      var h = '<div class="pf" style="' + (accent ? '--pa:' + accent + ';' : '') + '">' + bannerHtml(c.banner, accent, 150) +
        '<div class="pfhead"><div class="pfav">' + avFrame(p.avatar, c.frame, 96) + '</div><div class="pfname"><div class="name" style="font-size:1.35em;flex-wrap:wrap">' + nameHtml(p) + '</div>' + (nick ? '<div class="sub">' + esc(p.name) + '</div>' : '') + (title ? '<div class="pftitle">' + esc(title) + '</div>' : '') + '<div class="sub">' + (p.playing ? '<span class="ic-play">' + ic('gamepad', 13) + '</span> Playing ' + esc(p.playing.name) : p.online ? 'Online' : (p.lastSeen ? 'Last seen ' + ago(p.lastSeen) + ' ago' : 'Offline')) + '</div></div></div>';
      if (c.tagline) h += '<div class="pftag">' + esc(c.tagline) + '</div>';
      if (p.bio) h += '<p class="pfbio">' + esc(p.bio) + '</p>';
      if (!c.hideBadges) { var ch = ''; if (p.owner) ch += '<span class="chip gold">Owner of SteamLite</span>'; if (p.creator) ch += '<span class="chip">Theme creator</span>'; if (p.prestige) ch += '<span class="chip gold">Prestige ' + p.prestige + '</span>'; if (ch) h += '<div class="chips" style="margin:8px 0">' + ch + '</div>'; }
      // actions
      h += '<div class="pfacts">';
      if (mine) h += '<button class="btn" id="pf-edit">' + ic('edit', 16) + ' Edit profile</button><button class="btn ghost" id="pf-set">' + ic('cog', 16) + ' Settings</button>';
      else {
        if (p.relation === 'friends') h += '<button class="btn" id="pf-msg">' + ic('msg', 16) + ' Message</button><button class="btn ghost" id="pf-cmp">' + ic('users', 16) + ' Compare</button><button class="btn ghost" id="pf-more" aria-label="More">' + ic('more', 16) + '</button>';
        else if (p.relation === 'none') h += '<button class="btn" id="pf-add">' + ic('plus', 16) + ' Add friend</button>';
        else if (p.relation === 'pending_in') h += '<button class="btn" id="pf-add">Accept request</button>';
        else if (p.relation === 'pending_out') h += '<button class="btn ghost" disabled>Request sent</button>';
        h += '<button class="btn ghost" id="pf-share" aria-label="Share">' + ic('share', 16) + '</button>';
      }
      h += '</div>';
      if (st) { var lv = st.level || 1; h += '<div class="sec">Level</div><div class="card"><div class="lvrow"><span class="lvbadge">' + lv + '</span><div class="grow"><div class="name">Level ' + lv + (p.prestige ? ' · Prestige ' + p.prestige : '') + '</div><div class="bar" style="margin-top:6px"><i style="width:' + Math.min(100, lv) + '%"></i></div></div></div></div><div class="grid g4"><div class="card"><b>' + money(st.hours) + ' h</b><div class="sub">Played</div></div><div class="card"><b>' + money(st.games) + '</b><div class="sub">Games</div></div><div class="card"><b>' + st.streak + '</b><div class="sub">Best streak</div></div><div class="card"><b>' + st.achievements + '</b><div class="sub">Achievements</div></div></div>'; }
      if (c.showcase && c.showcase.length) h += '<div class="sec">Showcase</div><div class="showcase">' + c.showcase.map(function (id) { var g = ((S.games || cget('games') || []).filter(function (x) { return x.appid === id; })[0]); return '<div class="sc" data-gp="' + id + '">' + gi(id, g ? g.name : '') + '</div>'; }).join('') + '</div>';
      if (p.lists && p.lists.length) h += '<div class="sec">Game lists</div>' + p.lists.map(function (l) { return '<button class="mrow slim" data-list="' + esc(l.id) + '"><span class="mi2">' + ic('list', 19) + '</span><span class="grow"><b>' + esc(l.title) + '</b><span class="sub">' + l.count + ' games</span></span>' + ic('chevron', 16) + '</button>'; }).join('');
      if (p.themes && p.themes.length) h += '<div class="sec">Themes by ' + esc(p.name) + '</div><div class="hscroll">' + p.themes.map(function (t) { var cs = [t.vars['--accent-color'], t.vars['--bg-dark']].filter(Boolean); return '<div class="tcard" data-th="' + t.id + '"><div class="swatch">' + cs.map(function (x) { return '<i style="background:' + esc(x) + '"></i>'; }).join('') + '</div><div class="hn">' + esc(t.name) + '</div><div class="sub">' + t.likes + ' likes</div></div>'; }).join('') + '</div>';
      h += '<div class="sub" style="text-align:center;margin-top:18px">SteamLite code ' + esc(p.code) + (p.created ? ' · Member since ' + new Date(p.created).toLocaleDateString() : '') + '</div></div>';
      b.innerHTML = h;
      var q = function (id, f) { var e = $('#' + id, b); if (e) e.onclick = f; };
      q('pf-edit', openEditProfile); q('pf-set', openSettings);
      q('pf-msg', function () { api('POST', '/social/dm', { uid: p.uid }).then(function (r) { if (r.error) return toast(r.error); closeAllPages(); go('msgs'); openChat(r.id); }); });
      q('pf-cmp', function () { openCompare(p.uid); });
      q('pf-add', function () { api('POST', '/social/friend', { uid: p.uid }).then(function (x) { toast(x.error || (x.status === 'accepted' ? 'You are friends now!' : 'Request sent')); tick(); page.close(); }); });
      q('pf-share', function () { N('copy', p.code); toast('Friend code ' + p.code + ' copied'); });
      q('pf-more', function () { friendOptions(p); });
      b.onclick = function (e) { var t = e.target.closest('[data-th]'); if (t) { var th = p.themes.filter(function (x) { return x.id === t.dataset.th; })[0]; Look.setTheme({ id: th.id, vars: th.vars }); toast('Applied ' + th.name); } };
    });
  });
}
function friendOptions(p) {
  var fav = FAVF().indexOf(p.uid) >= 0, nk = NICKS()[p.uid];
  sheet(act('star', fav ? 'Remove from favourites' : 'Pin to the top of Friends', 'data-a="fav"') + act('edit', nk ? 'Change nickname' : 'Set a nickname', 'data-a="nick"') + act('x', 'Remove friend', 'data-a="rm"', 'bad'));
  $('#sheet').onclick = function (e) {
    var a = e.target.closest('[data-a]'); if (!a) return; closeSheet(); var k = a.dataset.a;
    if (k === 'fav') { var f = FAVF(), i = f.indexOf(p.uid); if (i >= 0) f.splice(i, 1); else f.push(p.uid); ls.set('favf', JSON.stringify(f)); toast(i >= 0 ? 'Unpinned' : 'Pinned to the top'); if (S.tab === 'friends') renderFriends(); }
    else if (k === 'nick') { var n = prompt('Nickname for ' + p.name + ' (empty to remove)', nk || ''); if (n === null) return; var m = NICKS(); if (n.trim()) m[p.uid] = n.trim().slice(0, 24); else delete m[p.uid]; ls.set('nicks', JSON.stringify(m)); toast('Saved'); tick(); if (S.tab === 'friends') renderFriends(); }
    else if (k === 'rm' && confirm('Remove ' + p.name + '?')) api('POST', '/social/unfriend', { uid: p.uid }).then(function () { tick(); closeAllPages(); });
  };
}

// ---------- the editor ----------
var ACC_SW = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#e5e7eb'];
function openEditProfile() {
  var base = (S.myProf && S.myProf.custom) || {}, prof = S.myProf || {};
  var st = { tagline: base.tagline || '', bio: prof.bio || '', accent: base.accent || '', frame: base.frame || 'none', title: base.title || '', hideBadges: !!base.hideBadges, showcase: (base.showcase || []).slice(), banner: base.banner ? Object.assign({}, base.banner) : { mode: 'default', blur: 0, dim: 0, x: 50, y: 50, zoom: 100, angle: 135, c1: '#7c5cff', c2: '#1b1233' } };
  openPage('editprofile', 'Edit profile', function (b, page) {
    var games = function () { return S.games || cget('games') || []; };
    var paint = function () {
      var uf = unlockedFrames(), tl = titleOptions(), bn = st.banner;
      b.innerHTML = '<div id="prev" class="pf" style="' + (st.accent ? '--pa:' + st.accent : '') + '">' + bannerHtml(bn, st.accent, 120) + '<div class="pfhead small"><div class="pfav">' + avFrame(S.me.avatar, st.frame === 'none' ? '' : st.frame, 72) + '</div><div class="pfname"><div class="name">' + nameHtml(S.me) + '</div>' + (st.title ? '<div class="pftitle">' + esc(st.title) + '</div>' : '') + '</div></div>' + (st.tagline ? '<div class="pftag">' + esc(st.tagline) + '</div>' : '') + '</div>' +
        '<div class="sec">About you</div><input class="in" id="e-tag" maxlength="60" placeholder="Tagline (shown under your name)" value="' + esc(st.tagline) + '"><textarea class="in" id="e-bio" rows="2" maxlength="160" placeholder="Bio" style="margin-top:8px">' + esc(st.bio) + '</textarea>' +
        '<div class="sec">Accent colour</div><div class="sws"><button class="' + (!st.accent ? 'on' : '') + '" data-ac="" style="background:var(--card2)" aria-label="Default">' + ic('x', 14) + '</button>' + ACC_SW.map(function (c) { return '<button data-ac="' + c + '" class="' + (st.accent === c ? 'on' : '') + '" style="background:' + c + '" aria-label="' + c + '"></button>'; }).join('') + '</div>' +
        '<div class="sec">Banner</div><div class="seg" style="margin:0 0 10px" id="e-bm">' + [['default', 'Default'], ['gradient', 'Gradient'], ['solid', 'Solid'], ['image', 'Picture']].map(function (x) { return '<button data-m="' + x[0] + '" class="' + (bn.mode === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (bn.mode === 'gradient' || bn.mode === 'solid' ? '<div class="sub">Colour</div><div class="sws" id="e-c1">' + ACC_SW.concat(['#0b0f17', '#1b1233']).map(function (c) { return '<button data-c="' + c + '" class="' + (bn.c1 === c ? 'on' : '') + '" style="background:' + c + '"></button>'; }).join('') + '</div>' : '') +
        (bn.mode === 'gradient' ? '<div class="sub" style="margin-top:8px">Second colour</div><div class="sws" id="e-c2">' + ACC_SW.concat(['#0b0f17', '#1b1233']).map(function (c) { return '<button data-c="' + c + '" class="' + (bn.c2 === c ? 'on' : '') + '" style="background:' + c + '"></button>'; }).join('') + '</div><div class="sub" style="margin-top:8px">Angle ' + bn.angle + '</div><input type="range" class="rng" id="e-ang" min="0" max="360" value="' + bn.angle + '">' : '') +
        (bn.mode === 'image' ? '<button class="btn ghost wide" id="e-pic">' + ic('image', 16) + (bn.id ? ' Change picture' : ' Choose a picture') + '</button>' + (bn.id ? [['blur', 'Blur', 0, 20], ['dim', 'Darken', 0, 80], ['zoom', 'Zoom', 100, 300], ['x', 'Left / right', 0, 100], ['y', 'Up / down', 0, 100]].map(function (r) { return '<div class="sub" style="margin-top:8px">' + r[1] + '</div><input type="range" class="rng" data-r="' + r[0] + '" min="' + r[2] + '" max="' + r[3] + '" value="' + (bn[r[0]] === undefined ? (r[0] === 'zoom' ? 100 : 50) : bn[r[0]]) + '">'; }).join('') : '<div class="sub wrap" style="margin-top:6px">Pictures are shrunk to fit (1 MB max).</div>') : '') +
        '<div class="sec">Avatar frame</div><div class="frgrid" id="e-fr">' + SLDATA.frames.map(function (f) { var ok = !!uf[f[0]]; return '<button class="frc ' + (st.frame === f[0] ? 'on' : '') + (ok ? '' : ' lock') + '" data-f="' + f[0] + '" aria-label="' + esc(f[1]) + (ok ? '' : ' (locked)') + '">' + (f[0] === 'none' ? '<span class="frnone">' + ic('x', 18) + '</span>' : avFrame(S.me.avatar, f[0], 46)) + '<span>' + esc(f[1]) + '</span>' + (ok ? '' : '<i class="lk">' + ic('lockc', 12) + '</i>') + '</button>'; }).join('') + '</div>' +
        '<div class="sec">Title</div><div class="titles" id="e-ti"><button class="tt ' + (!st.title ? 'on' : '') + '" data-t="">None</button>' + tl.map(function (x) { return '<button class="tt ' + (st.title === x.t ? 'on' : '') + '" data-t="' + esc(x.t) + '">' + esc(x.t) + '<small>' + x.how + '</small></button>'; }).join('') + '</div>' + (tl.length ? '' : '<div class="sub wrap">Titles come from your level and achievements on the PC. They show up here once your PC backup syncs.</div>') +
        '<div class="sec">Showcase (up to 5 games)</div><div class="showcase edit">' + st.showcase.map(function (id) { var g = games().filter(function (x) { return x.appid === id; })[0]; return '<div class="sc"><div data-gp="' + id + '">' + gi(id, g ? g.name : '') + '</div><button class="scx" data-rm="' + id + '" aria-label="Remove">' + ic('x', 13) + '</button></div>'; }).join('') + (st.showcase.length < 5 ? '<button class="sc add" id="e-add">' + ic('plus', 22) + '<span>Add</span></button>' : '') + '</div>' +
        '<div class="opt" style="margin-top:14px"><div class="grow"><b>Hide my badges</b><div class="sub wrap">Hide Owner, Theme creator and Prestige chips on your profile.</div></div>' + sw('e-hb', st.hideBadges) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn ghost" style="flex:1" id="e-reset">Reset</button><button class="btn" style="flex:2" id="e-save">Save profile</button></div>';
      bind();
    };
    var keep = function () { var t = $('#e-tag', b), bi = $('#e-bio', b); if (t) st.tagline = t.value; if (bi) st.bio = bi.value; var hb = $('#e-hb', b); if (hb) st.hideBadges = hb.checked; };
    var bind = function () {
      var bn = st.banner;
      b.querySelectorAll('[data-ac]').forEach(function (x) { x.onclick = function () { keep(); st.accent = x.dataset.ac; paint(); }; });
      $('#e-bm', b).onclick = function (e) { var x = e.target.closest('button'); if (x) { keep(); bn.mode = x.dataset.m; paint(); } };
      var c1 = $('#e-c1', b); if (c1) c1.onclick = function (e) { var x = e.target.closest('button'); if (x) { keep(); bn.c1 = x.dataset.c; paint(); } };
      var c2 = $('#e-c2', b); if (c2) c2.onclick = function (e) { var x = e.target.closest('button'); if (x) { keep(); bn.c2 = x.dataset.c; paint(); } };
      var ang = $('#e-ang', b); if (ang) ang.onchange = function () { keep(); bn.angle = +ang.value; paint(); };
      b.querySelectorAll('[data-r]').forEach(function (r) { r.onchange = function () { keep(); bn[r.dataset.r] = +r.value; paint(); }; });
      var pic = $('#e-pic', b); if (pic) pic.onclick = function () { var pid = 'p' + hex(4); toast('Choose a picture...'); CB[pid] = function (json) { var f = null; try { f = JSON.parse(json || 'null'); } catch (e) { } if (!f) return toast('No picture chosen.'); keep(); pic.disabled = true; api('POST', '/media', { mime: f.mime, data: f.data }).then(function (u) { if (!u.ok) { pic.disabled = false; return toast(u.error || 'Could not upload the picture'); } bn.id = u.id; bn.mode = 'image'; paint(); }); }; N('pickImage', pid); };
      $('#e-fr', b).onclick = function (e) { var x = e.target.closest('[data-f]'); if (!x) return; var uf = unlockedFrames(); if (!uf[x.dataset.f]) return toast(frameWhy(x.dataset.f)); keep(); st.frame = x.dataset.f; hp('tap'); paint(); };
      $('#e-ti', b).onclick = function (e) { var x = e.target.closest('[data-t]'); if (!x) return; keep(); st.title = x.dataset.t; hp('tap'); paint(); };
      b.querySelectorAll('[data-rm]').forEach(function (x) { x.onclick = function (e) { e.stopPropagation(); keep(); st.showcase = st.showcase.filter(function (i) { return i !== +x.dataset.rm; }); paint(); }; });
      var add = $('#e-add', b); if (add) add.onclick = function () {
        ensureGames().then(function (g) { if (!g || !g.length) return toast('Your library is not ready yet.'); keep();
          sheet('<h3 style="margin:0 0 8px">Add to showcase</h3><input class="in" id="shq" placeholder="Search your games" autocomplete="off"><div id="shl" style="margin-top:8px"></div>');
          var draw = function () { var q = $('#shq').value.toLowerCase(); $('#shl').innerHTML = g.filter(function (x) { return st.showcase.indexOf(x.appid) < 0 && (!q || (x.name || '').toLowerCase().indexOf(q) >= 0); }).sort(function (a, c) { return c.playtime_forever - a.playtime_forever; }).slice(0, 40).map(function (x) { return '<button class="act" data-sg="' + x.appid + '"><span>' + esc(x.name) + ' <span class="sub">' + Math.round(x.playtime_forever / 60) + ' h</span></span></button>'; }).join(''); };
          draw(); $('#shq').oninput = draw; $('#sheet').onclick = function (e) { var x = e.target.closest('[data-sg]'); if (!x) return; st.showcase.push(+x.dataset.sg); closeSheet(); paint(); };
        });
      };
      $('#e-reset', b).onclick = function () { if (!confirm('Reset your whole profile look to the default?')) return; st = { tagline: '', bio: st.bio, accent: '', frame: 'none', title: '', hideBadges: false, showcase: [], banner: { mode: 'default', blur: 0, dim: 0, x: 50, y: 50, zoom: 100, angle: 135, c1: '#7c5cff', c2: '#1b1233' } }; paint(); };
      $('#e-save', b).onclick = function () {
        keep(); var btn = $('#e-save', b); btn.disabled = true; btn.textContent = 'Saving...';
        var bnOut = st.banner.mode === 'default' ? null : Object.assign({}, st.banner);
        if (bnOut && bnOut.mode === 'image' && !bnOut.id) { btn.disabled = false; btn.textContent = 'Save profile'; return toast('Choose a banner picture first.'); }
        Promise.all([api('POST', '/social/customize', { tagline: st.tagline, accent: st.accent, frame: st.frame === 'none' ? '' : st.frame, title: st.title, hideBadges: st.hideBadges, showcase: st.showcase, banner: bnOut }), api('POST', '/social/bio', { bio: st.bio })]).then(function (r) {
          btn.disabled = false; btn.textContent = 'Save profile'; if (r[0].error) return toast(r[0].error); hp('ok'); toast('Profile saved'); loadMyProfile(true); setTimeout(function () { var a = $('#hav'); if (a) a.innerHTML = avFrame(S.me.avatar, st.frame === 'none' ? '' : st.frame, 42); }, 600); page.close();
        });
      };
    };
    // make sure the backup (unlocked frames and titles) and my profile (level) are loaded
    loadBackup(false); loadMyProfile(true); ensureGames();
    paint(); setTimeout(function () { if (PGS.indexOf(page) >= 0) paint(); }, 1800);
  });
}
