// ====================== 1.4.0: my PC, QR codes, chat export, phone backup, streak widget ======================

// ---------- my PC: status and remote control ----------
function pcStatus(cb) { api('GET', '/pc/status').then(function (r) { if (r && r.ok) { S.pcst = { online: !!r.online, running: r.running || null, at: Date.now() }; if (r.online) ls.set('pcSeen', '1'); } if (cb) cb(); }); }
function playedFor(since) { var m = Math.max(1, Math.round((Date.now() - since) / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; }
function pcCard() {
  var st = S.pcst; if (!st && ls.get('pcSeen') !== '1') return ''; var on = st && st.online;
  return '<button class="card pccard ' + (on ? 'on' : '') + '" data-act="pc"><span class="pcdot"></span><div class="grow" style="text-align:left"><div class="name">My PC' + (on ? '' : ' · not connected') + '</div><div class="sub wrap">' + (!st ? 'Checking...' : on ? (st.running ? 'Playing ' + esc(st.running.name) + ' for ' + playedFor(st.running.since) : 'Online. Tap to lock it, put it to sleep or close a game.') : 'Open SteamLite on your PC and turn on the phone options in Settings, Privacy.') + '</div></div>' + ic('chevron', 16) + '</button>';
}
function pcSheet() {
  pcStatus(function () {
    var st = S.pcst || {}, run = st.running;
    sheet('<h3 style="margin:0 0 4px">My PC</h3><div class="sub wrap" style="margin-bottom:10px">' + (st.online ? (run ? 'Playing <b>' + esc(run.name) + '</b> for ' + playedFor(run.since) : 'Online, nothing running that SteamLite started.') : 'Not connected right now.') + '</div>' +
      (run ? act('x', 'Close ' + esc(run.name), 'data-p="close"', 'bad') : '') + act('lockc', 'Lock the PC', 'data-p="lock"') + act('moon', 'Put the PC to sleep', 'data-p="sleep"') + act('gamepad', 'Start a game', 'data-p="game"') +
      '<div class="sub wrap" style="margin-top:8px">Lock, sleep and close need "Let my phone lock, sleep or close games" turned on in SteamLite on the PC (Settings, Privacy).</div>');
    $('#sheet').onclick = function (e) {
      var a = e.target.closest('[data-p]'); if (!a) return; var k = a.dataset.p; closeSheet();
      if (k === 'game') { LIB.tab = 'games'; go('lib'); return toast('Open a game and tap "Play on my PC".'); }
      var ask = { close: 'Close the game on your PC? Unsaved progress is lost.', lock: 'Lock your PC now?', sleep: 'Put your PC to sleep now? You will not be able to reach it from here until you wake it.' }[k];
      if (!confirm(ask)) return;
      api('POST', '/pc/control', { action: k }).then(function (r) { if (r.error) return toast(r.error); hp('ok'); toast('Sent. It happens on the PC within about 30 seconds.'); setTimeout(function () { pcStatus(function () { if (S.tab === 'home' && !PGS.length) renderHome(); }); }, 35000); });
    };
  });
}
var _homeExtras5 = homeExtras;
homeExtras = function () { if (!S.pcst || Date.now() - S.pcst.at > 45000) { if (!pcStatus.busy) { pcStatus.busy = true; pcStatus(function () { pcStatus.busy = false; if (S.tab === 'home' && !PGS.length) { try { renderHome(); } catch (e) { } } }); } } return pcCard() + _homeExtras5(); };
var _runAct5 = runAct;
runAct = function (k) { if (k === 'pc') { hp('tap'); return pcSheet(); } if (k === 'qr') { hp('tap'); return qrSheet(); } return _runAct5(k); };

// ---------- friend-code QR ----------
function qrSheet() {
  var code = (S.me && S.me.code) || '', url = N('qrPng', 'steamlite:add:' + code);
  sheet('<h3 style="margin:0 0 8px">Add me as a friend</h3><div class="qrbox">' + (url ? '<img src="' + url + '" alt="QR code for ' + esc(code) + '">' : '<div class="empty">The QR code could not be made.</div>') + '</div><div class="sub" style="text-align:center;margin:8px 0 12px">' + esc(code) + '</div><button class="btn wide" id="qr-scan">' + ic('search', 16) + ' Scan a friend\'s code</button>');
  $('#qr-scan').onclick = function () { closeSheet(); scanFriendCode(); };
}
function scanFriendCode() {
  var cb = 'p' + hex(4);
  CB[cb] = function (t) {
    if (!t) return toast('Nothing scanned.');
    var m = /(SL-[A-Z0-9]{6,12})/i.exec(String(t)); if (!m) return toast('That is not a SteamLite code.');
    var code = m[1].toUpperCase(); addFriend(); setTimeout(function () { var i = $('#fc'); if (i) { i.value = code; var b = $('#fok'); if (b) b.click(); } }, 250);
  };
  N('scanQr', cb);
}
var _renderMe5 = renderMe;
renderMe = function () {
  _renderMe5(); var c = $('#cpc'); if (c && !$('#qrbtn')) { c.insertAdjacentHTML('afterend', '<button class="btn sm ghost" id="qrbtn" style="margin-left:6px" aria-label="QR code">' + ic('search', 14) + ' QR</button>'); $('#qrbtn').onclick = qrSheet; }
};

// ---------- export a chat as text ----------
function exportChat() {
  var id = C.id, info = C.info || {}, peer = (info.members || []).filter(function (m) { return m.uid === info.peerUid; })[0], title = info.kind === 'group' ? info.name : (peer ? peer.name : 'Chat');
  toast('Collecting messages...'); var all = C.msgs.filter(function (m) { return !m.tmp; }).slice(), pages = 0;
  var next = function () {
    var oldest = all[0]; if (!oldest || pages >= 15 || !info.hasMore && pages > 0) return done(); pages++;
    api('GET', '/social/conv?id=' + id + '&before=' + oldest.id).then(function (r) { var l = (r && r.messages) || []; if (!l.length) return done(); all = l.concat(all); if (!r.hasMore) return done(); next(); });
  }, done = function () {
    var lines = all.map(function (m) { var d = new Date(m.at), t = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); var body = m.kind === 'text' ? m.text : m.kind === 'image' ? '[photo]' : m.kind === 'gif' ? '[GIF]' : m.kind === 'voice' ? '[voice message]' : m.kind === 'game' ? '[game: ' + (m.data && m.data.name) + ']' : m.kind === 'poll' ? '[poll]' : m.text; return '[' + t + '] ' + (m.mine ? 'Me' : m.name) + ': ' + body; });
    N('shareText', 'SteamLite chat with ' + title, 'SteamLite chat with ' + title + '\n' + lines.length + ' messages\n\n' + lines.join('\n'));
  };
  if (info.hasMore) next(); else done();
}
var _chatMenu5 = chatMenu;
chatMenu = function () { _chatMenu5(); var sh = $('#sheet'), prev = sh.onclick; sh.insertAdjacentHTML('beforeend', act('download', 'Export this chat as text', 'data-x5="exp"')); sh.onclick = function (e) { var x = e.target.closest('[data-x5]'); if (x) { closeSheet(); return exportChat(); } prev && prev(e); }; };

// ---------- back up the phone's own settings to the account ----------
var BK_KEYS = ['nicks', 'favf', 'favs', 'fgrp', 'arch', 'clocks', 'stars', 'goals', 'qr', 'hid', 'compact', 'dsave', 'dnd', 'lang', 'pins', 'mode', 'fsize', 'theme', 'reduceMotion', 'linkPrev', 'sharePlay', 'saleAlerts', 'muteAll', 'pth'];
function bkCollect() {
  var d = {}; BK_KEYS.forEach(function (k) { var v = ls.get(k); if (v != null) d[k] = v; });
  try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^(gn:|cc:|nt_)/.test(k)) d[k] = localStorage.getItem(k); } } catch (e) { }
  return d;
}
function backupPhone(quiet) { var d = bkCollect(); if (JSON.stringify(d).length > 75000) delete d.pth; return api('PUT', '/me/phone', { data: d }).then(function (r) { if (r.error) { if (!quiet) toast(r.error); return; } ls.set('bkAt', String(r.at)); if (!quiet) toast('Settings backed up'); }); }
function restorePhone() {
  api('GET', '/me/phone').then(function (r) {
    if (!r || !r.data || !Object.keys(r.data).length) return toast('There is no backup on your account yet.');
    if (!confirm('Replace this phone\'s settings with the backup from ' + new Date(r.at).toLocaleString() + '?')) return;
    Object.keys(r.data).forEach(function (k) { if (BK_KEYS.indexOf(k) >= 0 || /^(gn:|cc:|nt_)/.test(k)) ls.set(k, String(r.data[k])); });
    toast('Restored. Restarting the screen...'); setTimeout(function () { location.reload(); }, 900);
  });
}
setTimeout(function () { if (S.tok && Date.now() - +(ls.get('bkAt') || 0) > 86400000) backupPhone(true); }, 45000);

// ---------- Settings: a few more rows ----------
var _openSettings5 = openSettings;
openSettings = function () {
  _openSettings5(); var pg = PGS[PGS.length - 1], b = pg && pg.body; if (!b || b.__x5) return; b.__x5 = 1;
  var ref = b.querySelector('[data-sec="upd"]'), bkat = +(ls.get('bkAt') || 0);
  var s = document.createElement('div'); s.className = 'ssec'; s.setAttribute('data-sec', 'backup');
  s.innerHTML = '<div class="sec">' + ic('download', 15) + ' Backup and PC</div><div class="card">' +
    row2('download', 'Back up phone settings', 'Nicknames, stars, notes, goals, folders\' layout and more are saved to your account.' + (bkat ? ' Last backup: ' + esc(new Date(bkat).toLocaleString()) + '.' : ''), '<button class="btn sm" id="x5-bk">Back up</button><button class="btn sm ghost" id="x5-rs">Restore</button>', 'backup restore export settings') +
    row2('gamepad', 'My PC', 'See what is running, lock it, put it to sleep or close a game.', '<button class="btn sm ghost" id="x5-pc">Open</button>', 'pc remote lock sleep') +
    row2('search', 'My friend QR code', 'Let a friend scan you, or scan theirs.', '<button class="btn sm ghost" id="x5-qr">Open</button>', 'qr code scan friend') + '</div>';
  if (ref) b.insertBefore(s, ref); else b.appendChild(s);
  $('#x5-bk', b).onclick = function () { backupPhone(false).then(function () { closeAllPages(); openSettings(); }); }; $('#x5-rs', b).onclick = restorePhone; $('#x5-pc', b).onclick = pcSheet; $('#x5-qr', b).onclick = qrSheet;
};

// ---------- streak widget ----------
var _refreshPcs5 = refreshPcs;
refreshPcs = function () {
  return _refreshPcs5().then(function () { var p = S.pcs; if (!p) return; var done = p.last === localDay() || p.phone === localDay(), live = (done || p.last === localDay(-1)) ? p.current : 0; try { N('setStreakWidget', live | 0, !!done); } catch (e) { } });
};
setTimeout(function () { if (S.tok) refreshPcs(); }, 5000);
