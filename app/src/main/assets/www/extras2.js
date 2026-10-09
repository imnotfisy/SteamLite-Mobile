// ====================== 1.2.1: more everyday features ======================
// archive, starred messages, undo send, scheduled messages, chat colours and locks, data saver, friend groups, status,
// backlog picker, game notes and goals, anniversaries, Quick Settings tile support, diagnostics and chat restore.
var jparse = function (k, d) { try { var v = JSON.parse(ls.get(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };

// ---------- small stores ----------
function ARCH() { return jparse('arch', {}); }
function CLOCK() { return jparse('clocks', []); }
function FG() { return jparse('fgrp', {}); }
function STARS() { return jparse('stars', []); }
function GOALS() { return jparse('goals', {}); }
function isStar(id) { return STARS().some(function (s) { return s.id === id; }); }

// ---------- data saver ----------
var DSL = {};
function dsOn() { var m = ls.get('dsave') || '0'; if (m === '1') return true; if (m === '2') { try { return N('metered') === true; } catch (e) { return false; } } return false; }
function dsGate(url, html, label) { if (!url || !dsOn() || DSL[url]) return html; return '<button class="dsph" data-ds="' + esc(url) + '">' + ic('download', 16) + ' ' + label + ' - tap to load</button>'; }
document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-ds]'); if (!b) return; e.stopPropagation(); DSL[b.dataset.ds] = 1; if (C && C.id) paintMsgs(false); }, true);

// ---------- starred messages ----------
function toggleStar(m) {
  var s = STARS(), i = s.map(function (x) { return x.id; }).indexOf(m.id);
  if (i >= 0) { s.splice(i, 1); toast('Star removed'); }
  else {
    var info = C.info || {}, peer = (info.members || []).filter(function (x) { return x.uid === info.peerUid; })[0];
    s.unshift({ id: m.id, conv: C.id, cn: info.kind === 'group' ? info.name : (peer ? peer.name : 'Chat'), name: m.name, text: m.kind === 'text' ? m.text : '[' + m.kind + ']', at: m.at }); toast('Starred');
  }
  ls.set('stars', JSON.stringify(s.slice(0, 200))); hp('ok');
}
function openStarred() {
  openPage('starred', 'Starred messages', function (b) {
    var draw = function () {
      var s = STARS();
      b.innerHTML = s.length ? s.map(function (x) { return '<div class="row" data-sc="' + esc(x.conv) + '"><div class="grow"><div class="sub">' + esc(x.cn) + ' · ' + esc(x.name) + ' · ' + new Date(x.at).toLocaleDateString() + '</div><div class="name wrap2">' + esc(String(x.text).slice(0, 200)) + '</div></div><button class="btn ghost sm" data-su="' + x.id + '" aria-label="Remove star">' + ic('x', 15) + '</button></div>'; }).join('') : '<div class="empty">Nothing starred yet.<br>Tap a message, then Star, to keep it here.</div>';
    };
    draw();
    b.onclick = function (e) {
      var u = e.target.closest('[data-su]'); if (u) { ls.set('stars', JSON.stringify(STARS().filter(function (x) { return String(x.id) !== u.dataset.su; }))); draw(); return; }
      var r = e.target.closest('[data-sc]'); if (r) { closeAllPages(); go('msgs'); openChat(r.dataset.sc); }
    };
  });
}

// ---------- undo send ----------
function undoBar(msgId, convId) {
  var el = $('#undo'); if (!el) { el = document.createElement('div'); el.id = 'undo'; document.body.appendChild(el); }
  el.innerHTML = '<span>Message sent</span><button>Undo</button>'; el.classList.add('on'); clearTimeout(undoBar.t); undoBar.t = setTimeout(function () { el.classList.remove('on'); }, 6000);
  el.querySelector('button').onclick = function () { el.classList.remove('on'); api('POST', '/social/delete', { id: msgId }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); toast('Message unsent'); if (C.id === convId) refreshAll(); }); };
}

// ---------- scheduled messages ----------
function pad2(n) { return ('0' + n).slice(-2); }
function localInput(t) { var d = new Date(t); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function scheduleSheet() {
  var id = C.id, draft = ($('#cin') && $('#cin').value.trim()) || '';
  sheet('<h3 style="margin:0 0 8px">Send later</h3><textarea class="in" id="sc-t" rows="3" maxlength="2000" placeholder="Message">' + esc(draft) + '</textarea><div class="sub" style="margin:10px 0 4px">When</div><input type="datetime-local" class="in" id="sc-d" value="' + localInput(Date.now() + 3600000) + '"><div class="chips" style="margin:8px 0">' + [['In 1 hour', 1], ['This evening', 'eve'], ['Tomorrow 9:00', 'tom']].map(function (x) { return '<button class="chip" data-q="' + x[1] + '">' + x[0] + '</button>'; }).join('') + '</div><button class="btn wide" id="sc-ok">Schedule</button><div class="sub wrap" style="margin-top:8px">It is sent from the server, so your phone does not need to be on. It goes out within a minute or two of the time you pick.</div>');
  $('#sheet').onclick = function (e) {
    var q = e.target.closest('[data-q]'); if (!q) return; var v = q.dataset.q, d = new Date();
    if (v === '1') d = new Date(Date.now() + 3600000); else if (v === 'eve') { d.setHours(19, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); } else { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
    $('#sc-d').value = localInput(d.getTime());
  };
  $('#sc-ok').onclick = function () {
    var t = $('#sc-t').value.trim(), at = new Date($('#sc-d').value).getTime(); if (!t) return toast('Write a message first.'); if (!(at > Date.now())) return toast('Pick a time in the future.');
    api('POST', '/social/schedule', { conv: id, text: t, at: at }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); closeSheet(); toast('Scheduled for ' + new Date(at).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })); if (draft && draft === t && $('#cin')) { $('#cin').value = ''; $('#cin').oninput && $('#cin').oninput(); ls.del('draft:' + id); } });
  };
}
function scheduledList() {
  var id = C.id; api('GET', '/social/scheduled?conv=' + id).then(function (r) {
    var l = (r && r.items) || [];
    sheet('<h3 style="margin:0 0 8px">Scheduled messages</h3>' + (l.length ? l.map(function (x) { return '<div class="row" style="cursor:default"><div class="grow"><div class="sub">' + new Date(x.at).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</div><div class="name wrap2">' + esc(x.text.slice(0, 120)) + '</div></div><button class="btn ghost sm" data-un="' + x.id + '">Cancel</button></div>'; }).join('') : '<div class="empty">Nothing scheduled in this chat.</div>'));
    $('#sheet').onclick = function (e) { var u = e.target.closest('[data-un]'); if (u) api('POST', '/social/unschedule', { id: +u.dataset.un }).then(function () { toast('Cancelled'); scheduledList(); }); };
  });
}

// ---------- chat menu extras: colour, lock, scheduled ----------
var CHAT_COL = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d946ef', '#64748b'];
function applyChatLook(id) {
  var el = $('#chat'), m = $('#msgs'); if (!el) return; var col = ls.get('cc:' + id);
  if (col) { el.style.setProperty('--acc', col); if (m) m.style.background = 'linear-gradient(180deg,' + col + '22,transparent 55%)'; } else { el.style.removeProperty('--acc'); if (m) m.style.background = ''; }
}
function colourSheet() {
  var id = C.id, cur = ls.get('cc:' + id) || '';
  sheet('<h3 style="margin:0 0 8px">Chat colour</h3><div class="sub" style="margin-bottom:8px">Changes your bubbles and the background of this chat, only on your phone.</div><div class="sws"><button data-cc="" class="' + (!cur ? 'on' : '') + '" style="background:var(--card2)" aria-label="Default">' + ic('x', 14) + '</button>' + CHAT_COL.map(function (c) { return '<button data-cc="' + c + '" class="' + (cur === c ? 'on' : '') + '" style="background:' + c + '"></button>'; }).join('') + '</div>');
  $('#sheet').onclick = function (e) { var b = e.target.closest('[data-cc]'); if (!b) return; if (b.dataset.cc) ls.set('cc:' + id, b.dataset.cc); else ls.del('cc:' + id); applyChatLook(id); hp('tap'); closeSheet(); };
}
var _chatMenu = chatMenu;
chatMenu = function () {
  _chatMenu(); var sh = $('#sheet'), prev = sh.onclick, id = C.id, locked = CLOCK().indexOf(id) >= 0, can = N('canLock') === true;
  sh.insertAdjacentHTML('beforeend', act('clock', 'Scheduled messages', 'data-x="sl"') + act('sliders', 'Chat colour', 'data-x="cc"') + (can ? act('lockc', locked ? 'Remove biometric lock' : 'Lock this chat', 'data-x="lk"') : '') + act('zap', 'Starred in this chat', 'data-x="st"'));
  sh.onclick = function (e) {
    var x = e.target.closest('[data-x]'); if (!x) return prev && prev(e); var k = x.dataset.x; closeSheet();
    if (k === 'sl') scheduledList(); else if (k === 'cc') colourSheet();
    else if (k === 'lk') { var l = CLOCK(); if (locked) l = l.filter(function (y) { return y !== id; }); else l.push(id); ls.set('clocks', JSON.stringify(l)); toast(locked ? 'Lock removed' : 'This chat now asks for your fingerprint, face or PIN'); }
    else if (k === 'st') { var s = STARS().filter(function (y) { return y.conv === id; }); sheet('<h3 style="margin:0 0 8px">Starred in this chat</h3>' + (s.length ? s.map(function (y) { return '<div class="row" style="cursor:default"><div class="grow"><div class="sub">' + esc(y.name) + ' · ' + new Date(y.at).toLocaleDateString() + '</div><div class="name wrap2">' + esc(String(y.text).slice(0, 160)) + '</div></div></div>'; }).join('') : '<div class="empty">Nothing starred here. Tap a message, then Star.</div>')); }
  };
};
var _attachMenu = attachMenu;
attachMenu = function () {
  _attachMenu(); var sh = $('#sheet'), prev = sh.onclick;
  sh.insertAdjacentHTML('beforeend', act('clock', 'Send later', 'data-x="later"'));
  sh.onclick = function (e) { var x = e.target.closest('[data-x]'); if (x) { closeSheet(); scheduleSheet(); return; } prev && prev(e); };
};

// ---------- open / close chat: per-chat lock, colour, restore after a restart ----------
var UNLOCKED = {}, pendingChatId = '';
var _openChat = openChat;
openChat = function (id) {
  if (CLOCK().indexOf(id) >= 0 && !(UNLOCKED[id] && Date.now() - UNLOCKED[id] < 180000)) { pendingChatId = id; N('authChat'); return; }
  _openChat(id); applyChatLook(id); ls.set('lastChat', JSON.stringify({ id: id, at: Date.now() }));
};
window.chatAuth = function (ok) { var id = pendingChatId; pendingChatId = ''; if (!ok || !id) return toast('Chat stays locked'); UNLOCKED[id] = Date.now(); openChat(id); };
var _closeChat = closeChat;
closeChat = function (quiet) { ls.del('lastChat'); return _closeChat(quiet); };
(function restoreChat() {
  var tries = 0, t = setInterval(function () {
    if (++tries > 20) return clearInterval(t); if (!S.tok || !S.me || !S.me.uid) return; clearInterval(t);
    var l = jparse('lastChat', null); if (!l || Date.now() - l.at > 30 * 60000 || (C && C.id) || PGS.length) return;
    setTimeout(function () { if (!(C && C.id) && !PGS.length && !window.__openedFromNotif) { go('msgs'); openChat(l.id); } }, 400);
  }, 500);
})();

// ---------- friend groups ----------
function fgBar() {
  var m = FG(), labels = []; Object.keys(m).forEach(function (u) { if (labels.indexOf(m[u]) < 0) labels.push(m[u]); }); if (!labels.length) return '';
  return '<div class="chips fgb">' + ['All'].concat(labels).map(function (l) { var v = l === 'All' ? '' : l; return '<button class="chip' + ((S.fgFilter || '') === v ? ' owned' : '') + '" data-fg="' + esc(v) + '">' + esc(l) + '</button>'; }).join('') + '</div>';
}
var _friendOptions = friendOptions;
friendOptions = function (p) {
  _friendOptions(p); var sh = $('#sheet'), prev = sh.onclick, cur = FG()[p.uid];
  sh.insertAdjacentHTML('beforeend', act('users', cur ? 'Change group (' + esc(cur) + ')' : 'Put in a group', 'data-x="grp"') + act('flag', 'Report', 'data-x="rep"') + act('x', 'Block', 'data-x="blk"', 'bad'));
  sh.onclick = function (e) {
    var x = e.target.closest('[data-x]'); if (!x) return prev && prev(e); var k = x.dataset.x; closeSheet();
    if (k === 'grp') { var existing = []; var m = FG(); Object.keys(m).forEach(function (u) { if (existing.indexOf(m[u]) < 0) existing.push(m[u]); }); var n = prompt('Group for ' + p.name + (existing.length ? ' (yours: ' + existing.join(', ') + ')' : '') + '. Empty to remove.', cur || ''); if (n === null) return; if (n.trim()) m[p.uid] = n.trim().slice(0, 16); else delete m[p.uid]; ls.set('fgrp', JSON.stringify(m)); toast('Saved'); if (S.tab === 'friends') renderFriends(); }
    else if (k === 'rep') { var why = prompt('What is wrong with ' + p.name + '?'); if (why) api('POST', '/social/report', { uid: p.uid, reason: why }).then(function (r) { toast(r.error || 'Thanks, we will take a look.'); }); }
    else if (k === 'blk' && confirm('Block ' + p.name + '? They are removed from your friends and cannot message you.')) api('POST', '/social/block', { uid: p.uid, on: true }).then(function (r) { if (r.error) return toast(r.error); toast('Blocked'); tick(); closeAllPages(); });
  };
};

// ---------- status message ----------
function statusSheet() {
  var cur = (S.myProf && S.myProf.custom && S.myProf.custom.status) || '';
  sheet('<h3 style="margin:0 0 8px">Your status</h3><input class="in" id="st-t" maxlength="60" placeholder="Busy till 8pm, at work, gaming..." value="' + esc(cur) + '"><div class="sub" style="margin:10px 0 4px">Clears itself after</div><div class="seg" id="st-h">' + [[1, '1 hour'], [4, '4 hours'], [24, 'Today'], [168, '1 week']].map(function (x, i) { return '<button data-h="' + x[0] + '" class="' + (i === 2 ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><button class="btn wide" id="st-ok" style="margin-top:12px">Set status</button>' + (cur ? '<button class="btn ghost wide" id="st-x" style="margin-top:8px">Clear status</button>' : ''));
  var hrs = 24; $('#st-h').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; hrs = +b.dataset.h; this.querySelectorAll('button').forEach(function (y) { y.classList.toggle('on', y === b); }); };
  var save = function (t, h) { api('POST', '/social/status', { text: t, hours: h }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); closeSheet(); toast(t ? 'Status set' : 'Status cleared'); loadMyProfile(true); setTimeout(function () { if (S.tab === 'home') renderHome(); }, 700); }); };
  $('#st-ok').onclick = function () { var t = $('#st-t').value.trim(); if (!t) return toast('Write a status first.'); save(t, hrs); };
  var x = $('#st-x'); if (x) x.onclick = function () { save('', 0); };
}

// ---------- backlog picker ----------
var BK = { mode: 'never', last: 0 };
function backlogPool() {
  var g = S.games || cget('games') || [];
  var pool = g.filter(function (x) { return BK.mode === 'never' ? !x.playtime_forever : BK.mode === 'barely' ? x.playtime_forever > 0 && x.playtime_forever < 120 : true; });
  return pool.length ? pool : g;
}
function openBacklog() {
  var g = S.games || cget('games'); if (!g || !g.length) { toast('Open the Library tab once so your games load.'); return; }
  var pool = backlogPool(), pick = pool[Math.floor(Math.random() * pool.length)]; if (pool.length > 1) while (pick.appid === BK.last) pick = pool[Math.floor(Math.random() * pool.length)]; BK.last = pick.appid;
  sheet('<h3 style="margin:0 0 8px">What should I play?</h3><div class="seg" id="bk-m" style="margin-bottom:12px">' + [['never', 'Never played'], ['barely', 'Barely played'], ['all', 'Anything']].map(function (x) { return '<button data-m="' + x[0] + '" class="' + (BK.mode === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="bkpick" data-gp="' + pick.appid + '">' + gi(pick.appid, pick.name) + '<div><b>' + esc(pick.name) + '</b><div class="sub">' + (pick.playtime_forever ? Math.round(pick.playtime_forever / 6) / 10 + ' h played' : 'Never played') + ' · from ' + pool.length + ' games</div></div></div><div class="gpacts" style="margin-top:12px"><button class="btn" id="bk-open">Open</button><button class="btn ghost" id="bk-again">' + ic('dice', 16) + ' Another</button></div>');
  $('#bk-m').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; BK.mode = b.dataset.m; openBacklog(); };
  $('#bk-again').onclick = function () { hp('tap'); openBacklog(); };
  $('#bk-open').onclick = function () { closeSheet(); openGame(pick.appid); };
}

// ---------- game notes and achievement goals (game page) ----------
function goalInfo(id) { return GOALS()[id] || null; }
function ring(pct, size) { var r = size / 2 - 5, c = 2 * Math.PI * r; return '<svg class="gring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--card2)" stroke-width="6"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--acc)" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - Math.min(100, pct) / 100)).toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="var(--text)" font-size="' + size / 4.4 + '" font-weight="700">' + Math.round(pct) + '%</text></svg>'; }
function gameExtra(id, ach, owned) {
  var h = '<div class="sec">My notes</div><div class="card"><textarea class="in" id="gn-t" rows="3" maxlength="1000" placeholder="Private notes: build, save location, where you got stuck...">' + esc(ls.get('gn:' + id) || '') + '</textarea></div>';
  if (owned && ach && ach.length) {
    var got = ach.filter(function (x) { return x.achieved; }).length, pct = got / ach.length * 100, g = goalInfo(id);
    if (g) { g.pct = pct; var all = GOALS(); all[id] = g; ls.set('goals', JSON.stringify(all)); }
    h += '<div class="sec">Goal</div><div class="card goalc">' + (g ? ring(pct / g.target * 100, 64) + '<div class="grow"><div class="name">' + g.target + '% of achievements' + (g.due ? ' by ' + esc(g.due) : '') + '</div><div class="sub">' + got + ' of ' + ach.length + ' unlocked · ' + Math.round(pct) + '% now' + (pct >= g.target ? ' · Done!' : g.due ? ' · ' + dueText(g.due) : '') + '</div></div><button class="btn ghost sm" id="gg-x" aria-label="Remove goal">' + ic('x', 15) + '</button>' : '<div class="grow"><div class="name">No goal yet</div><div class="sub">Pick a target and a date. It shows on Home until you reach it.</div></div><button class="btn sm" id="gg-set">Set goal</button>') + '</div>';
  }
  return h;
}
function dueText(d) { var n = Math.ceil((new Date(d + 'T23:59:59') - Date.now()) / 86400000); return n < 0 ? 'overdue' : n === 0 ? 'due today' : n === 1 ? '1 day left' : n + ' days left'; }
function bindGameExtra(id, ach, paint, d) {
  var t = $('#gn-t'); if (t) t.oninput = function () { clearTimeout(t.__t); t.__t = setTimeout(function () { if (t.value.trim()) ls.set('gn:' + id, t.value); else ls.del('gn:' + id); }, 500); };
  var s = $('#gg-set'); if (s) s.onclick = function () {
    var name = ($('#gpname') && $('#gpname').textContent) || 'Game', dd = new Date(Date.now() + 7 * 86400000);
    sheet('<h3 style="margin:0 0 8px">Achievement goal</h3><div class="sub" style="margin-bottom:6px">Reach</div><div class="seg" id="gg-p">' + [50, 75, 100].map(function (x, i) { return '<button data-p="' + x + '" class="' + (i === 2 ? 'on' : '') + '">' + x + '%</button>'; }).join('') + '</div><div class="sub" style="margin:12px 0 4px">By</div><input type="date" class="in" id="gg-d" value="' + dd.getFullYear() + '-' + pad2(dd.getMonth() + 1) + '-' + pad2(dd.getDate()) + '"><button class="btn wide" id="gg-ok" style="margin-top:12px">Save goal</button>');
    var tg = 100; $('#gg-p').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; tg = +b.dataset.p; this.querySelectorAll('button').forEach(function (y) { y.classList.toggle('on', y === b); }); };
    $('#gg-ok').onclick = function () { var all = GOALS(); all[id] = { target: tg, due: $('#gg-d').value, name: name, pct: 0 }; ls.set('goals', JSON.stringify(all)); closeSheet(); hp('ok'); toast('Goal saved'); paint(d, ach); };
  };
  var x = $('#gg-x'); if (x) x.onclick = function () { var all = GOALS(); delete all[id]; ls.set('goals', JSON.stringify(all)); paint(d, ach); };
}

// ---------- Home extras: status, anniversaries, goals ----------
function annivToday() {
  var out = [], now = new Date(), md = now.getMonth() * 100 + now.getDate(), me = S.me || {};
  ((S.ov && S.ov.friends) || []).forEach(function (f) { if (!f.since) return; var d = new Date(f.since); if (d.getMonth() * 100 + d.getDate() === md && now.getFullYear() > d.getFullYear()) out.push({ t: esc(NICKS()[f.uid] || f.name) + ' joined SteamLite ' + (now.getFullYear() - d.getFullYear()) + ' year' + (now.getFullYear() - d.getFullYear() > 1 ? 's' : '') + ' ago today', uid: f.uid }); });
  var ss = +ls.get('steamSince') || 0; if (ss) { var sd = new Date(ss * 1000); if (sd.getMonth() * 100 + sd.getDate() === md && now.getFullYear() > sd.getFullYear()) out.push({ t: 'Your Steam account is ' + (now.getFullYear() - sd.getFullYear()) + ' year' + (now.getFullYear() - sd.getFullYear() > 1 ? 's' : '') + ' old today', uid: '' }); }
  return out;
}
function loadSteamSince() {
  if (ls.get('steamSinceAt') && Date.now() - +ls.get('steamSinceAt') < 7 * 86400000) return; if (!S.me || !S.me.steamid) return; ls.set('steamSinceAt', String(Date.now()));
  getKey().then(function (k) { if (!k) return; raw('GET', 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=' + encodeURIComponent(k) + '&steamids=' + S.me.steamid, {}).then(function (r) { try { var p = JSON.parse(r.text).response.players[0]; if (p && p.timecreated) ls.set('steamSince', String(p.timecreated)); } catch (e) { } }); });
}
function homeExtras() {
  loadSteamSince();
  var h = '', st = (S.myProf && S.myProf.custom && S.myProf.custom.status) || (cget('myprof') && cget('myprof').custom && cget('myprof').custom.status) || '';
  h += '<button class="card statuscard" data-act="status"><span class="sub">Your status</span><b>' + (st ? esc(st) : 'Set a status for your friends') + '</b></button>';
  annivToday().forEach(function (a) { h += '<div class="card annivc"' + (a.uid ? ' data-pf="' + a.uid + '"' : '') + '>' + ic('sparkle', 18) + '<span>' + a.t + '</span></div>'; });
  var gs = GOALS(), ids = Object.keys(gs).filter(function (k) { return (gs[k].pct || 0) < gs[k].target; });
  if (ids.length) h += '<div class="sec">Goals</div>' + ids.slice(0, 3).map(function (k) { var g = gs[k]; return '<div class="row goalrow" data-gp="' + k + '">' + ring((g.pct || 0) / g.target * 100, 44) + '<div class="grow"><div class="name">' + esc(g.name) + '</div><div class="sub">' + g.target + '% by ' + esc(g.due || 'no date') + (g.due ? ' · ' + dueText(g.due) : '') + '</div></div></div>'; }).join('');
  return h;
}
var _runAct = runAct;
runAct = function (k) {
  if (k === 'status') { hp('tap'); return statusSheet(); } if (k === 'backlog') { hp('tap'); return openBacklog(); } if (k === 'starred') { hp('tap'); return openStarred(); } if (k === 'diag') { hp('tap'); return openDiagnostics(); }
  return _runAct(k);
};

// ---------- Settings extras ----------
NT.push(['free', 'Free games', 'When a game becomes free to keep on Steam']);
var _openSettings = openSettings;
openSettings = function () {
  _openSettings(); var pg = PGS[PGS.length - 1], b = pg && pg.body; if (!b || b.__x2) return; b.__x2 = 1;
  var ds = ls.get('dsave') || '0', share = ls.get('wishUrl') || '';
  var inner = row2('download', 'Data saver', 'Photos and GIFs wait for a tap, and links get no preview.', '<select class="in" id="x-ds" style="width:auto">' + [['0', 'Off'], ['2', 'On mobile data'], ['1', 'Always']].map(function (x) { return '<option value="' + x[0] + '"' + (ds === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>', 'data saver mobile data photos gif') +
    row2('box', 'Compact chat list', 'Smaller rows so more chats fit on screen.', sw('x-cmp', ls.get('compact') === '1'), 'compact dense') +
    row2('star', 'Starred messages', 'Messages you saved from any chat.', '<button class="btn sm ghost" id="x-star">Open</button>', 'starred bookmarks') +
    row2('share', 'Public wishlist link', share ? 'A page anyone with the link can open. ' + esc(share) : 'Make a page with your wishlist that you can send to anyone.', '<button class="btn sm" id="x-wl">' + (share ? 'Copy' : 'Create') + '</button>' + (share ? '<button class="btn sm ghost" id="x-wlx">Stop</button>' : ''), 'wishlist share link public') +
    row2('moon', 'Quick Settings tile', 'Swipe down twice, tap the pencil, and drag "SteamLite quiet" in to turn quiet notifications on or off in one tap.', '', 'tile dnd quiet') +
    row2('info', 'Diagnostics', 'Notifications, battery, updates and connection in one place.', '<button class="btn sm ghost" id="x-diag">Open</button>', 'diagnostics problem help');
  var s = document.createElement('div'); s.className = 'ssec'; s.setAttribute('data-sec', 'more'); s.innerHTML = '<div class="sec">' + ic('sparkle', 15) + ' More</div><div class="card">' + inner + '</div>';
  var ref = b.querySelector('[data-sec="upd"]'); if (ref) b.insertBefore(s, ref); else b.appendChild(s);
  $('#x-ds', b).onchange = function () { ls.set('dsave', this.value); DSL = {}; };
  $('#x-cmp', b).onchange = function () { ls.set('compact', this.checked ? '1' : '0'); applyCompact(); };
  $('#x-star', b).onclick = openStarred; $('#x-diag', b).onclick = openDiagnostics;
  var wl = $('#x-wl', b); if (wl) wl.onclick = function () {
    var items = S.wish || cget('wish');
    var go2 = function (w) { if (!w || !w.length) return toast('Your wishlist is empty or private.'); api('POST', '/me/wishshare', { items: w }).then(function (r) { if (r.error) return toast(r.error); ls.set('wishUrl', r.url); N('copy', r.url); toast('Link copied'); }); };
    if (items && items.length) go2(items); else fetchWish().then(go2);
  };
  var wx = $('#x-wlx', b); if (wx) wx.onclick = function () { api('DELETE', '/me/wishshare', {}).then(function () { ls.del('wishUrl'); toast('The link stopped working'); }); };
};
function applyCompact() { document.documentElement.classList.toggle('compact', ls.get('compact') === '1'); }
applyCompact();

// ---------- diagnostics ----------
function openDiagnostics() {
  openPage('diag', 'Diagnostics', function (b) {
    var ns = notifState(), rows = [], line = function (label, good, text) { return '<div class="dgrow"><span>' + label + '</span><b class="' + (good ? 'good' : 'bad') + '">' + esc(text) + '</b></div>'; };
    var draw = function (ping) {
      var batt = N('batteryFree') === true;
      b.innerHTML = '<div class="card dg">' +
        line('Signed in', !!S.tok, S.tok ? 'Yes' : 'No') +
        line('Server', ping > 0, ping > 0 ? 'Reachable (' + ping + ' ms)' : ping === 0 ? 'Checking...' : 'Not reachable') +
        line('Notifications allowed', ns.permission !== false && ns.enabled !== false, ns.permission === false || ns.enabled === false ? 'Off in Android settings' : 'On') +
        line('Battery', batt, batt ? 'Unrestricted' : 'Android may delay notifications') +
        line('Quiet hours', true, dndState().on ? 'On ' + dndState().from + ' - ' + dndState().to : 'Off') +
        line('Data saver', true, ['Off', 'Always', 'On mobile data'][+(ls.get('dsave') || 0)]) +
        line('App version', true, CUR) + line('Latest version', !UPD || UPD.version === CUR, UPD ? UPD.version : CUR) +
        (ns.lastPushErr ? '<div class="sub wrap" style="margin-top:8px;color:var(--bad)">' + esc(ns.lastPushErr) + '</div>' : '') + '</div>' +
        '<div class="gpacts">' + (batt ? '' : '<button class="btn" id="dg-batt">Fix battery</button>') + '<button class="btn ghost" id="dg-test">Send test notification</button></div>' +
        '<button class="btn ghost wide" id="dg-send" style="margin-top:10px">' + ic('flag', 16) + ' Send these details to the developer</button><div class="sub wrap" style="margin-top:6px">Includes the version, Android permissions above and your last error. No messages are included.</div>';
      var bb = $('#dg-batt', b); if (bb) bb.onclick = function () { N('openBatterySettings'); };
      $('#dg-test', b).onclick = function () { api('POST', '/push/test', {}).then(function (r) { toast(r.error || 'Sent. It should arrive in a few seconds.'); }); };
      $('#dg-send', b).onclick = function () { var d = ['v' + CUR, 'perm=' + ns.permission, 'enabled=' + ns.enabled, 'channel=' + ns.channel, 'battery=' + (N('batteryFree') === true ? 'free' : 'limited'), 'ds=' + (ls.get('dsave') || 0), 'err=' + (ns.lastPushErr || '')].join(' ');
        api('POST', '/client-error', { app: 'mobile', v: CUR, msg: 'diagnostics ' + d.slice(0, 160) }).then(function () { toast('Sent. Thank you!'); }); };
    };
    draw(0); var t0 = Date.now(); api('GET', '/health').then(function (r) { draw(r && r.ok ? Math.max(1, Date.now() - t0) : -1); });
  });
}

// ---------- connection chip: say when we are trying again and when we are back ----------
var _setOffline = setOffline;
setOffline = function (v) { var was = S.offline; _setOffline(v); if (was && !v) { toast('Back online'); } };
if (!ls.get('lang')) { try { var nl = (navigator.language || 'en').slice(0, 2).toLowerCase(); if (LANGS.some(function (l) { return l[0] === nl; }) && nl !== 'en') ls.set('lang', nl); } catch (e) { } }

// the Quick Settings tile can change quiet hours while the app is closed: take over its value when the app opens again
var _onResume = window.onResumeApp;
window.onResumeApp = function () { try { var on = N('dndOn') === 'true', d = dndState(); if (d.on !== on) { d.on = on; ls.set('dnd', JSON.stringify(d)); } } catch (e) { } if (_onResume) _onResume(); };

// ---------- the play streak, kept in step with the PC ----------
function refreshPcs() {
  return api('GET', '/me/streak').then(function (r) {
    if (!r || !r.ok) return; var old = S.pcs || cget('pcs') || {};
    S.pcs = { current: r.current, best: r.best, last: r.lastPlayDay, phone: (r.phoneDays || []).slice(-1)[0] || '', restores: r.restores || 0, recU: r.recoveryUntil || '', recP: r.previous || 0, at: r.at || 0 };
    cset('pcs', S.pcs); if (S.tab === 'home' && !PGS.length && JSON.stringify(old) !== JSON.stringify(S.pcs)) { try { renderHome(); } catch (e) { } }
  });
}
var _onResume2 = window.onResumeApp;
window.onResumeApp = function () { if (S.tok) refreshPcs(); if (_onResume2) _onResume2(); };
setInterval(function () { if (S.tok && !document.hidden && S.tab === 'home') refreshPcs(); }, 60000);
