'use strict';
// ====================== SteamLite Mobile: messages ======================
var PINNED = function () { try { return JSON.parse(ls.get('pins') || '[]'); } catch (e) { return []; } };
var QR_DEFAULT = ['On my way', 'Give me 5 minutes', 'Sounds good', "Let's play!", "Can't right now, later?", 'GG'];
var QR = function () { try { var q = JSON.parse(ls.get('qr') || 'null'); return q && q.length ? q : QR_DEFAULT; } catch (e) { return QR_DEFAULT; } };
// a row in a menu: icon, then the words
function act(icon, label, attrs, cls) { return '<button class="act' + (cls ? ' ' + cls : '') + '" ' + (attrs || '') + '><span class="ai">' + ic(icon, 20) + '</span><span>' + label + '</span></button>'; }

// ---------- the list of chats ----------
function renderMsgs() {
  var o = S.ov, v = $('#view'), pins = PINNED();
  var h = '<div class="hdr"><h1>Messages</h1><button class="btn sm ghost" id="newg">' + ic('plus', 15) + ' New group</button></div><div class="pad">';
  if (!o) h += skel(6);
  else if (!o.convs.length) h += '<div class="empty">No chats yet.<br>Add a friend, then tap them to say hi.</div>';
  else {
    var list = o.convs.slice().sort(function (a, b) { var pa = pins.indexOf(a.id) >= 0 ? 1 : 0, pb = pins.indexOf(b.id) >= 0 ? 1 : 0; return pb - pa || b.at - a.at; });
    h += list.map(function (c) {
      var last = c.last ? (c.last.mine ? 'You: ' : (c.kind === 'group' && c.last.from ? c.last.from + ': ' : '')) + plain(c.last.text) : 'No messages yet';
      return '<div class="row" data-c="' + c.id + '"><div class="av"' + avStyle(c.avatar) + '>' + (c.kind === 'group' ? '<span class="gav">' + ic('users', 22) + '</span>' : '') + '</div><div class="grow"><div class="name">' + (pins.indexOf(c.id) >= 0 ? '<span class="mi">' + ic('pin', 13) + '</span>' : '') + nameHtml(c) + (c.muted ? '<span class="mi">' + ic('bellOff', 13) + '</span>' : '') + '</div><div class="sub">' + esc(last) + '</div></div><div style="text-align:right"><div class="sub">' + (c.at ? ago(c.at) : '') + '</div>' + (c.unread ? '<div class="unread">' + c.unread + '</div>' : '') + '</div></div>';
    }).join('');
  }
  var changed = setHtml(v, h + '</div>');
  if (!changed && v.__bound) return; v.__bound = true;
  bindRows(v);
  var ng = $('#newg'); if (ng) ng.onclick = newGroup;
}
// tap opens the chat; press and hold opens the chat's options (swiping sideways changes tab)
function bindRows(v) {
  var tm = 0, sx = 0, sy = 0, long = false;
  v.onclick = function (e) { if (long) { long = false; return; } var r = e.target.closest('[data-c]'); if (r && S.tab === 'msgs') { hp('tap'); openChat(r.dataset.c); } };
  v.ontouchstart = function (e) { var r = e.target.closest && e.target.closest('[data-c]'); if (!r || S.tab !== 'msgs') return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; long = false; clearTimeout(tm); tm = setTimeout(function () { long = true; hp('heavy'); convSheet(r.dataset.c); }, 520); };
  v.ontouchmove = function (e) { var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; if (Math.abs(dx) > 12 || Math.abs(dy) > 12) clearTimeout(tm); };
  v.ontouchend = function () { clearTimeout(tm); };
}
function convSheet(id) {
  var c = (S.ov && S.ov.convs.filter(function (x) { return x.id === id; })[0]); if (!c) return; var pins = PINNED(), pinned = pins.indexOf(id) >= 0;
  sheet('<div class="row"><div class="av"' + avStyle(c.avatar) + '></div><div class="grow name">' + nameHtml(c) + '</div></div>' + act('pin', pinned ? 'Unpin chat' : 'Pin chat to the top', 'data-a="pin"') + act(c.muted ? 'bell' : 'bellOff', c.muted ? 'Unmute' : 'Mute', 'data-a="mute"') + act('msg', 'Open chat', 'data-a="open"'));
  $('#sheet').onclick = function (e) {
    var a = e.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a; closeSheet();
    if (k === 'pin') { var n = pinned ? pins.filter(function (x) { return x !== id; }) : pins.concat([id]).slice(-5); ls.set('pins', JSON.stringify(n)); renderMsgs(); toast(pinned ? 'Unpinned' : 'Pinned'); }
    else if (k === 'mute') api('POST', '/social/mute', { conv: id, on: !c.muted }).then(function () { c.muted = !c.muted; renderMsgs(); toast(c.muted ? 'Muted' : 'Unmuted'); });
    else openChat(id);
  };
}
function newGroup() {
  var fr = (S.ov && S.ov.friends) || [];
  if (!fr.length) return toast('Add some friends first.');
  sheet('<h3 style="margin:0 0 10px">New group</h3><input class="in" id="gn" placeholder="Group name" maxlength="30"><div class="sec">Pick friends</div>' + fr.map(function (f) { return '<label class="row"><input type="checkbox" value="' + f.uid + '"><div class="av sm"' + avStyle(f.avatar) + '></div><div class="grow name">' + nameHtml(f) + '</div></label>'; }).join('') + '<button class="btn" style="width:100%;margin-top:10px" id="gok">Create</button>');
  $('#gok').onclick = function () {
    var ids = [].map.call(document.querySelectorAll('#sheet input[type=checkbox]:checked'), function (x) { return x.value; });
    api('POST', '/social/group', { name: $('#gn').value, members: ids }).then(function (r) { if (r.error) return toast(r.error); closeSheet(); tick(); if (r.id) openChat(r.id); });
  };
}

// ---------- links and previews ----------
var UF = {}, ufBusy = 0;
function linkify(t) {
  return esc(t).replace(/https?:\/\/[^\s<]+/g, function (u) { var tail = ''; var m = /[.,;:!?)\]]+$/.exec(u); if (m) { tail = m[0]; u = u.slice(0, -tail.length); } return '<a class="lk" data-url="' + u + '">' + u + '</a>' + tail; });
}
function firstUrl(t) { var m = /https:\/\/[^\s<]+/.exec(t || ''); return m ? m[0].replace(/[.,;:!?)\]]+$/, '').replace(/&amp;/g, '&') : ''; }
function wantPreview(url) {
  if (UF[url] !== undefined || ufBusy >= 2) return; UF[url] = null; ufBusy++;
  api('GET', '/social/unfurl?u=' + encodeURIComponent(url)).then(function (r) { ufBusy--; UF[url] = r && r.ok ? r : false; if (C.id) paintMsgs(false); });
}
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-url]'); if (a) { e.preventDefault(); N('openUrl', a.dataset.url.replace(/&amp;/g, '&')); return; }
  var b = e.target.closest('[data-buy]'); if (b) { e.stopPropagation(); N('openUrl', 'https://store.steampowered.com/app/' + b.dataset.buy); return; }
  var gp = e.target.closest('[data-gp]'); if (gp) { e.stopPropagation(); openGame(+gp.dataset.gp); return; }
  var l = e.target.closest('[data-list]'); if (l) { e.stopPropagation(); openList(l.dataset.list); return; }
  var im = e.target.closest('[data-img]'); if (im) { viewImage(im.dataset.full || im.src); return; }
  var vp = e.target.closest('[data-vplay]'); if (vp) { e.stopPropagation(); playVoice(vp.dataset.vplay); }
}, true);

// ---------- voice message playback (one at a time) ----------
var VA = null, VID = '';
var PLAY = '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>', PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
function playVoice(id) {
  if (VA && VID === id) { if (VA.paused) VA.play(); else VA.pause(); return; }
  if (VA) { VA.pause(); VA = null; }
  VID = id; VA = new Audio(MEDIA + id);
  var upd = function () { var b = document.querySelector('[data-vid="' + id + '"]'); if (!b) return; var p = VA && VA.duration ? VA.currentTime / VA.duration : 0; b.querySelector('.vb i').style.width = Math.round(p * 100) + '%'; b.querySelector('button').innerHTML = VA && !VA.paused ? PAUSE : PLAY; };
  VA.ontimeupdate = upd; VA.onplay = upd; VA.onpause = upd; VA.onended = function () { VID = ''; upd(); var b = document.querySelector('[data-vid="' + id + '"] .vb i'); if (b) b.style.width = '0%'; };
  VA.onerror = function () { toast('Could not play that message'); };
  VA.play().catch(function () { toast('Could not play that message'); });
}

// ---------- the chat itself ----------
var C = { id: '', last: 0, msgs: [], reply: null, timer: 0, typedAt: 0, info: null, seen: {}, newIds: {} };
function openChat(id) {
  C = { id: id, last: 0, msgs: [], reply: null, timer: 0, typedAt: 0, info: null, seen: {}, newIds: {}, loadingOld: false, rec: null };
  var el = $('#chat');
  el.innerHTML = '<div class="hdr" style="background:var(--card)"><button class="btn ghost sm" id="cback">' + ic('back', 18) + '</button><div class="av sm" id="chav"></div><div class="grow"><div class="name" id="chname"></div><div class="sub" id="chsub"></div></div><button class="btn ghost sm" id="chmore">' + ic('more', 18) + '</button></div><div id="viewwrap"><div id="msgs"></div><button id="newpill">' + ic('down', 14) + ' New messages</button></div><div class="typing" id="typing"></div><div id="rbar"></div><div class="composer" id="comp"></div>';
  buildComposer();
  el.classList.add('open');
  $('#cback').onclick = function () { closeChat(); };
  $('#chmore').onclick = chatMenu;
  $('#newpill').onclick = function () { var m = $('#msgs'); m.scrollTo({ top: m.scrollHeight, behavior: 'smooth' }); $('#newpill').classList.remove('on'); };
  var mb = $('#msgs');
  mb.onclick = function (e) { if (e.target.closest('a,[data-img],[data-buy],[data-gp],[data-list],[data-vplay]')) return; var m = e.target.closest('[data-mid]'); if (m && m.dataset.mid) { hp('tap'); msgMenu(+m.dataset.mid); } };
  mb.onscroll = function () { if (nearEnd()) $('#newpill').classList.remove('on'); if (mb.scrollTop < 60 && C.info && C.info.hasMore && !C.loadingOld) loadOlder(); };
  swipeReply(mb);
  var cc = cget('conv:' + id); if (cc && cc.messages) { C.info = cc; C.msgs = cc.messages; C.last = C.msgs.length ? C.msgs[C.msgs.length - 1].id : 0; paintHead(); paintMsgs(true); }   // saved copy first
  loadConv(true); clearInterval(C.timer); C.timer = setInterval(function () { if (!document.hidden) loadConv(false); }, 2500);
}
function closeChat(quiet) {
  clearInterval(C.timer); if (C && C.rec) N('recStop', true); if (VA) { VA.pause(); VA = null; VID = ''; }
  if (C) C.id = ''; var el = $('#chat'); el.classList.remove('open'); if (wide()) el.innerHTML = ''; closeSheet(); if (!quiet) tick();
}
function loadConv(first) {
  var id = C.id; if (!id) return;
  api('GET', '/social/conv?id=' + id + (C.last && !first ? '&after=' + C.last : '')).then(function (r) {
    if (id !== C.id) return;
    if (r.error) { if (first && !C.info) { toast(r.error); closeChat(true); } return; }
    var fresh = r.messages || [];
    if (first || !C.info) { C.info = r; C.msgs = fresh; }
    else { C.info.typing = r.typing; C.info.peerRead = r.peerRead; C.info.members = r.members; C.info.muted = r.muted; C.info.streak = r.streak; C.info.canSend = r.canSend; if (fresh.length) { var ids = {}; C.msgs.forEach(function (m) { ids[m.id] = 1; }); fresh.forEach(function (m) { if (!ids[m.id]) { C.msgs.push(m); C.newIds[m.id] = 1; } }); } }
    C.msgs = C.msgs.filter(function (m) { return !m.tmp || !fresh.some(function (f) { return f.mine && f.at >= m.at - 5000 && f.text === m.text; }); });
    C.last = C.msgs.filter(function (m) { return !m.tmp; }).pop(); C.last = C.last ? C.last.id : 0;
    var atEnd = first || nearEnd(); paintHead(); paintMsgs(atEnd);
    if (!first && fresh.length && !atEnd) { var any = fresh.some(function (m) { return !m.mine; }); if (any) { $('#newpill').classList.add('on'); hp('tap'); } }
    if (first || Math.random() < 0.25) refreshAll();
    cset('conv:' + id, { id: id, kind: C.info.kind, name: C.info.name, members: C.info.members, peerUid: C.info.peerUid, canSend: C.info.canSend, hasMore: C.info.hasMore, muted: C.info.muted, pins: C.info.pins, streak: C.info.streak, peerRead: C.info.peerRead, messages: C.msgs.filter(function (m) { return !m.tmp; }).slice(-40) });
  });
}
function refreshAll() { var id = C.id; api('GET', '/social/conv?id=' + id).then(function (r) { if (id !== C.id || !r.messages) return; var atEnd = nearEnd(); var tmps = C.msgs.filter(function (m) { return m.tmp; }); C.msgs = r.messages.concat(tmps); C.info = Object.assign(C.info || {}, r); paintHead(); paintMsgs(atEnd); }); }
function loadOlder() {
  var first = C.msgs.filter(function (m) { return !m.tmp; })[0]; if (!first) return; C.loadingOld = true; var id = C.id;
  api('GET', '/social/conv?id=' + id + '&before=' + first.id).then(function (r) {
    C.loadingOld = false; if (id !== C.id || !r.messages) return; var box = $('#msgs'), oh = box.scrollHeight, ot = box.scrollTop;
    var have = {}; C.msgs.forEach(function (m) { have[m.id] = 1; }); C.msgs = r.messages.filter(function (m) { return !have[m.id]; }).concat(C.msgs); C.info.hasMore = r.hasMore;
    paintMsgs(false); box.scrollTop = ot + (box.scrollHeight - oh);
  });
}
function nearEnd() { var m = $('#msgs'); return !m || m.scrollHeight - m.scrollTop - m.clientHeight < 120; }
function paintHead() {
  var i = C.info; if (!i || !$('#chname')) return; var cv = (S.ov && S.ov.convs.filter(function (c) { return c.id === C.id; })[0]) || {};
  var peer = i.kind === 'dm' ? (i.members || []).filter(function (m) { return m.uid === i.peerUid; })[0] : null;
  $('#chname').innerHTML = i.kind === 'dm' ? nameHtml(peer || cv) : esc(i.name);
  $('#chav').setAttribute('style', peer && peer.avatar ? 'background-image:url(\'' + esc(peer.avatar) + '\')' : '');
  $('#chsub').innerHTML = i.kind === 'dm' ? esc(peer && peer.playing ? 'Playing ' + peer.playing.name : peer && peer.online ? 'Online' : 'Offline') + (i.streak && i.streak.streak ? ' <span class="fl">' + ic('flame', 13) + i.streak.streak + '</span>' : '') : (i.members || []).length + ' members';
  var t = (i.typing || []).map(function (x) { return x.name; });
  var th = t.length ? '<i></i><i></i><i></i> ' + esc(t.join(', ')) + (t.length > 1 ? ' are typing' : ' is typing') : '';
  if ($('#typing').__h !== th) { $('#typing').innerHTML = th; $('#typing').__h = th; }
  var cin = $('#cin'); if (cin) { var off = i.canSend === false; cin.disabled = off; cin.placeholder = off ? 'You can only message friends' : 'Message'; }
}
function jumbo(t) { return /^(\p{Extended_Pictographic}|‍|️|\s){1,3}$/u.test(t) && t.trim().length > 0; }
function paintMsgs(stick) {
  var box = $('#msgs'); if (!box) return; var prev = null, h = '', wantUrls = [];
  C.msgs.forEach(function (m) {
    if (m.kind === 'system') { h += '<div class="m sys">' + esc(m.text) + '</div>'; prev = null; return; }
    var gap = !prev || prev.uid !== m.uid || (m.at - prev.at) > 300000; prev = m;
    var cls = 'm' + (m.mine ? ' me' : '') + (gap ? ' gap' : '') + (C.newIds[m.id] && !C.seen[m.id] ? ' new' : '') + (m.kind === 'text' && jumbo(m.text) ? ' big' : '') + (m.kind === 'image' || m.kind === 'gif' ? ' media' : '');
    C.seen[m.id] = 1;
    var body = '';
    if (m.replyTo) body += '<div class="quote"><b>' + esc(m.replyTo.name) + '</b><br>' + esc(plain(m.replyTo.text)) + '</div>';
    if (m.kind === 'game' && m.data) body += '<div class="gcard"><div data-gp="' + (m.data.appid | 0) + '">' + gi(m.data.appid, m.data.name) + '</div><div><b data-gp="' + (m.data.appid | 0) + '">' + esc(m.data.name) + '</b>' + (m.data.hours ? '<div class="sub">' + m.data.hours + ' h played</div>' : '') + '<button class="btn sm" style="margin-top:6px;width:100%" data-buy="' + (m.data.appid | 0) + '">Buy on Steam</button></div></div>';
    else if (m.kind === 'list' && m.data) body += '<div class="gcard"><div><b class="lt">' + ic('list', 15) + esc(m.data.title) + '</b><div class="sub">Shared game list</div><button class="btn sm" style="margin-top:6px;width:100%" data-list="' + esc(m.data.id) + '">Open list</button></div></div>';
    else if (m.kind === 'image') body += '<img class="mimg" data-img="1" src="' + (m.dataUrl || (MEDIA + esc(m.data && m.data.id))) + '" alt="Photo">' + (m.text && plain(m.text) !== 'Photo' ? '<div class="cap">' + linkify(m.text) + '</div>' : '');
    else if (m.kind === 'gif' && m.data) body += '<img class="mimg" data-img="1" src="' + esc(m.data.url) + '" alt="GIF">';
    else if (m.kind === 'voice') { var id = m.data && m.data.id; body += '<div class="vm" data-vid="' + esc(id) + '"><button data-vplay="' + esc(id) + '">' + (VID === id && VA && !VA.paused ? PAUSE : PLAY) + '</button><div class="vb"><i></i></div><span>' + fmtDur(m.data ? m.data.ms : 0) + '</span></div>'; }
    else {
      body += linkify(m.text); var u = firstUrl(m.text);
      if (u) { var p = UF[u]; if (p) body += '<a class="lp" data-url="' + esc(u) + '">' + (p.image ? '<img src="' + esc(p.image) + '" onerror="this.remove()">' : '') + '<div><b>' + esc(p.title) + '</b>' + (p.desc ? '<span>' + esc(p.desc.slice(0, 90)) + '</span>' : '') + '<span>' + esc(p.host) + '</span></div></a>'; else if (UF[u] === undefined) wantUrls.push(u); }
    }
    var rx = (m.reactions || []).length ? '<div class="react">' + m.reactions.map(function (r) { return '<span class="' + (r.me ? 'me' : '') + '">' + r.e + ' ' + r.n + '</span>'; }).join('') + '</div>' : '';
    h += '<div class="' + cls + '" data-mid="' + (m.tmp ? '' : m.id) + '">' + (gap && !m.mine && C.info && C.info.kind === 'group' ? '<div class="who">' + esc(m.name) + '</div>' : '') + (m.pinned ? '<span class="pm">' + ic('pin', 12) + '</span>' : '') + body + rx + (cls.indexOf('big') < 0 ? '<div class="t">' + (m.tmp ? 'Sending...' : new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (m.edited ? ' · edited' : '')) + '</div>' : '') + '</div>';
  });
  if (C.info && C.info.kind === 'dm' && C.msgs.length) { var lastMine = C.msgs.filter(function (m) { return m.mine && !m.tmp; }).pop(); if (lastMine && C.info.peerRead >= lastMine.id) h += '<div class="sub seen">Seen</div>'; }
  var changed = setHtml(box, h); if (changed && stick) box.scrollTop = box.scrollHeight;
  C.newIds = {}; wantUrls.slice(-3).forEach(wantPreview);
}

// ---------- swipe a message to reply ----------
function swipeReply(box) {
  var sx = 0, sy = 0, el = null, hit = false;
  box.addEventListener('touchstart', function (e) { el = e.target.closest('.m[data-mid]'); if (!el || !el.dataset.mid) { el = null; return; } sx = e.touches[0].clientX; sy = e.touches[0].clientY; hit = false; }, { passive: true });
  box.addEventListener('touchmove', function (e) {
    if (!el) return; var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy; if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) { el.style.transform = ''; el = null; return; }
    if (dx > 6) { var d = Math.min(70, dx * 0.6); el.style.setProperty('transition', 'none', 'important'); el.style.transform = 'translateX(' + d + 'px)'; if (d > 44 && !hit) { hit = true; hp('tap'); } }
  }, { passive: true });
  box.addEventListener('touchend', function () {
    if (!el) return; var node = el; el = null; node.style.setProperty('transition', 'transform .45s cubic-bezier(.34,1.56,.64,1)', 'important'); node.style.transform = '';
    if (hit) { var m = C.msgs.filter(function (x) { return String(x.id) === node.dataset.mid; })[0]; if (m) setReply(m); }
  }, { passive: true });
}
function setReply(m) { C.reply = m; $('#rbar').innerHTML = m ? '<div class="replybar"><span class="grow">Replying to <b>' + esc(m.name) + '</b>: ' + esc(plain(m.text || '').slice(0, 60)) + '</span><button class="btn ghost sm" id="rx">' + ic('x', 16) + '</button></div>' : ''; if (m) { $('#rx').onclick = function () { setReply(null); }; $('#cin') && $('#cin').focus(); } }

// ---------- the composer: emoji, attach, text / voice ----------
var SENDI = '<svg viewBox="0 0 24 24"><path d="M3 20l18-8L3 4v6l12 2-12 2z"/></svg>', MICI = ic('mic', 20);
function buildComposer() {
  $('#comp').innerHTML = '<button class="cb" id="cemo">' + ic('smile', 20) + '</button><button class="cb" id="cat">' + ic('plus', 20) + '</button><textarea id="cin" rows="1" placeholder="Message" maxlength="1000"></textarea><button class="send" id="csend">' + MICI + '</button>';
  var inp = $('#cin'), sb = $('#csend');
  inp.value = ls.get('draft:' + C.id) || ''; fit(); mode();
  function fit() { inp.style.height = 'auto'; inp.style.height = Math.min(110, inp.scrollHeight) + 'px'; }
  function mode() { var has = !!inp.value.trim(); sb.innerHTML = has ? SENDI : MICI; sb.dataset.m = has ? 's' : 'm'; }
  inp.oninput = function () { fit(); mode(); ls.set('draft:' + C.id, inp.value); if (Date.now() - C.typedAt > 3000 && inp.value) { C.typedAt = Date.now(); api('POST', '/social/typing', { conv: C.id }); } };
  sb.onclick = function () { if (sb.dataset.m === 's') sendMsg(); else startRec(); };
  $('#cemo').onclick = function () { sheet('<div class="emo">' + ALLE.map(function (e) { return '<button>' + e + '</button>'; }).join('') + '</div>'); $('#sheet').onclick = function (e) { var b = e.target.closest('.emo button'); if (b) { inp.value += b.textContent; inp.oninput(); closeSheet(); } }; };
  $('#cat').onclick = attachMenu;
}
function attachMenu() {
  sheet(act('image', 'Photo', 'data-a="photo"') + (S.gifOk ? act('gif', 'GIF', 'data-a="gif"') : '') + act('gamepad', 'Share a game', 'data-a="game"') + act('list', 'Share a game list', 'data-a="list"') + act('zap', 'Quick replies', 'data-a="qr"'));
  $('#sheet').onclick = function (e) { var a = e.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a; closeSheet(); if (k === 'photo') pickPhoto(); else if (k === 'gif') gifPicker(); else if (k === 'game') shareGamePick(C.id); else if (k === 'list') shareListPick(C.id); else quickReplies(); };
}
function gifPicker() {
  sheet('<input class="in" id="gq3" placeholder="Search GIFs" autocomplete="off"><div id="gr3" class="grid gifs" style="margin-top:10px">' + skel(4, true) + '</div>');
  var t = 0, load = function () { api('GET', '/social/gif?q=' + encodeURIComponent($('#gq3').value.trim())).then(function (r) { var l = (r && r.gifs) || []; var el = $('#gr3'); if (!el) return; el.innerHTML = l.length ? l.map(function (g, i) { return '<img class="gifp" data-gi="' + i + '" src="' + esc(g.url) + '" alt="GIF">'; }).join('') : '<div class="empty" style="grid-column:1/-1">No GIFs found.</div>'; el.onclick = function (e) { var b = e.target.closest('[data-gi]'); if (!b) return; var g = l[+b.dataset.gi]; closeSheet(); sendRaw({ kind: 'gif', text: 'GIF', data: { url: g.url, w: g.w, h: g.h } }, { data: { url: g.url, w: g.w, h: g.h } }); }; }); };
  $('#gq3').oninput = function () { clearTimeout(t); t = setTimeout(load, 400); }; load();
}
function quickReplies() {
  var q = QR();
  sheet('<h3 style="margin:0 0 8px">Quick replies</h3>' + q.map(function (t, i) { return '<button class="act" data-q="' + i + '"><span>' + esc(t) + '</span></button>'; }).join('') + act('plus', 'Add your own', 'data-a="add"', 'acc') + act('clock', 'Reset to defaults', 'data-a="reset"', 'mutd'));
  $('#sheet').onclick = function (e) {
    var b = e.target.closest('[data-q]'), a = e.target.closest('[data-a]');
    if (b) { closeSheet(); sendRaw({ text: q[+b.dataset.q] }); }
    else if (a && a.dataset.a === 'add') { var t = prompt('New quick reply'); if (t && t.trim()) { ls.set('qr', JSON.stringify(q.concat([t.trim().slice(0, 60)]).slice(-12))); quickReplies(); } }
    else if (a) { ls.del('qr'); quickReplies(); }
  };
}
function sendMsg() {
  var inp = $('#cin'), text = inp.value.trim(); if (!text || !C.id) return;
  inp.value = ''; inp.style.height = 'auto'; ls.del('draft:' + C.id); $('#csend').innerHTML = MICI; $('#csend').dataset.m = 'm'; hp('tap');
  var rep = C.reply ? C.reply.id : 0; setReply(null); sendRaw({ text: text, reply: rep || undefined });
}
function sendRaw(body, tmpExtra) {
  var tmp = Object.assign({ id: 1e15 + Date.now() + Math.random(), uid: S.me.uid, name: S.me.name, text: body.text || '', kind: body.kind || 'text', at: Date.now(), mine: true, reactions: [], replyTo: null, tmp: 1 }, tmpExtra || {});
  C.msgs.push(tmp); C.newIds[tmp.id] = 1; paintMsgs(true);
  var id = C.id;
  return api('POST', '/social/send', Object.assign({ conv: id }, body)).then(function (r) {
    if (id !== C.id) return r;
    C.msgs = C.msgs.filter(function (m) { return m !== tmp; });
    if (r.error) { toast(r.error); paintMsgs(false); } else { hp('ok'); loadConv(false); }
    return r;
  });
}

// photos
function pickPhoto() {
  var pid = 'p' + hex(4); toast('Choose a photo...');
  CB[pid] = function (json) {
    var f = null; try { f = JSON.parse(json || 'null'); } catch (e) { }
    if (!f) return toast('No photo chosen, or it is too big (1 MB max for GIFs).');
    var cap = ($('#cin') && $('#cin').value.trim()) || ''; if ($('#cin')) { $('#cin').value = ''; $('#cin').oninput(); }
    var rep = C.reply ? C.reply.id : 0; setReply(null);
    var tmp = { id: 1e15 + Date.now(), uid: S.me.uid, name: S.me.name, text: cap, kind: 'image', at: Date.now(), mine: true, reactions: [], tmp: 1, dataUrl: 'data:' + f.mime + ';base64,' + f.data };
    C.msgs.push(tmp); paintMsgs(true); var id = C.id;
    api('POST', '/media', { mime: f.mime, data: f.data }).then(function (u) {
      if (!u.ok) { C.msgs = C.msgs.filter(function (m) { return m !== tmp; }); paintMsgs(false); return toast(u.error || 'Could not upload the photo'); }
      return api('POST', '/social/send', { conv: id, kind: 'image', text: cap, reply: rep || undefined, data: { id: u.id, w: f.w, h: f.h } }).then(function (r) { C.msgs = C.msgs.filter(function (m) { return m !== tmp; }); if (r.error) toast(r.error); else hp('ok'); if (id === C.id) loadConv(false); });
    });
  };
  N('pickImage', pid);
}

// voice messages: tap the mic, talk, then send or cancel
function startRec() {
  CB.mic = function (v) {
    if (v === 'recording') { showRecBar(); }
    else if (v === 'granted') toast('Microphone allowed. Tap the mic again to record.');
    else if (v === 'denied') toast('Allow the microphone in Android settings to send voice messages.');
    else toast('Could not start recording.');
  };
  N('recStart');
}
function showRecBar() {
  C.rec = { t0: Date.now() }; hp('heavy');
  var comp = $('#comp');
  comp.innerHTML = '<div class="recbar"><i class="rd"></i><span id="rt">0:00</span><button class="btn ghost sm" id="rcancel">Cancel</button></div><button class="send" id="rsend">' + SENDI + '</button>';
  C.rec.iv = setInterval(function () { var e = $('#rt'); if (e) e.textContent = fmtDur(Date.now() - C.rec.t0); }, 250);
  $('#rcancel').onclick = function () { endRec(true); }; $('#rsend').onclick = function () { endRec(false); };
}
window.onRecLimit = function () { if (C.rec) endRec(false); };
function endRec(cancel) {
  var r = C.rec; if (!r) return; clearInterval(r.iv); C.rec = null; var id = C.id;
  CB.rec = function (json) {
    buildComposer(); var f = null; try { f = JSON.parse(json || 'null'); } catch (e) { }
    if (cancel || !f) { if (!cancel) toast('That was too short.'); return; }
    var tmp = { id: 1e15 + Date.now(), uid: S.me.uid, name: S.me.name, text: '', kind: 'voice', at: Date.now(), mine: true, reactions: [], tmp: 1, data: { id: '', ms: f.ms } };
    C.msgs.push(tmp); paintMsgs(true);
    api('POST', '/media', { mime: f.mime, data: f.data }).then(function (u) {
      if (!u.ok) { C.msgs = C.msgs.filter(function (m) { return m !== tmp; }); paintMsgs(false); return toast(u.error || 'Could not upload the voice message'); }
      return api('POST', '/social/send', { conv: id, kind: 'voice', data: { id: u.id, ms: f.ms } }).then(function (s) { C.msgs = C.msgs.filter(function (m) { return m !== tmp; }); if (s.error) toast(s.error); else hp('ok'); if (id === C.id) loadConv(false); });
    });
  };
  N('recStop', !!cancel);
}

// ---------- message menu, chat menu, search ----------
function msgMenu(id) {
  var m = C.msgs.filter(function (x) { return x.id === id; })[0]; if (!m || m.tmp) return;
  sheet('<div class="emo">' + QUICK.map(function (e) { return '<button data-e="' + e + '">' + e + '</button>'; }).join('') + '</div>' + act('reply', 'Reply', 'data-a="reply"') + (m.kind === 'text' ? act('copy', 'Copy text', 'data-a="copy"') : '') + act('pin', m.pinned ? 'Unpin' : 'Pin', 'data-a="pin"') + (m.mine && m.kind === 'text' ? act('edit', 'Edit', 'data-a="edit"') : '') + (m.mine ? act('trash', 'Delete', 'data-a="del"', 'bad') : act('flag', 'Report', 'data-a="rep"', 'bad')));
  $('#sheet').onclick = function (e) {
    var em = e.target.closest('[data-e]'), a = e.target.closest('[data-a]');
    if (em) { var mine = (m.reactions.filter(function (r) { return r.e === em.dataset.e && r.me; }).length > 0); closeSheet(); hp('tap'); api('POST', '/social/react', { msg: id, emoji: em.dataset.e, on: !mine }).then(function (r) { if (r.error) toast(r.error); refreshAll(); }); }
    else if (a) {
      closeSheet(); var k = a.dataset.a;
      if (k === 'reply') setReply(m);
      else if (k === 'copy') { N('copy', m.text); toast('Copied'); }
      else if (k === 'pin') api('POST', '/social/pin', { id: id, on: !m.pinned }).then(function (r) { if (r.error) toast(r.error); refreshAll(); });
      else if (k === 'edit') { var t = prompt('Edit message', m.text); if (t && t.trim()) api('POST', '/social/edit', { id: id, text: t.trim() }).then(function (r) { if (r.error) toast(r.error); refreshAll(); }); }
      else if (k === 'del') api('POST', '/social/delete', { id: id }).then(function (r) { if (r.error) toast(r.error); refreshAll(); });
      else if (k === 'rep') { var why = prompt('What is wrong with this message?'); if (why) api('POST', '/social/report', { uid: m.uid, conv: C.id, msgId: id, reason: why }).then(function (r) { toast(r.error || 'Thanks, we will take a look.'); }); }
    }
  };
}
function chatMenu() {
  var i = C.info || {};
  sheet((i.kind === 'dm' && i.peerUid ? act('user', 'View profile', 'data-a="prof"') : '') + act('search', 'Search messages', 'data-a="search"') + act('pin', 'Pinned messages', 'data-a="pins"') + act(i.muted ? 'bell' : 'bellOff', i.muted ? 'Unmute chat' : 'Mute chat', 'data-a="mute"'));
  $('#sheet').onclick = function (e) {
    var a = e.target.closest('[data-a]'); if (!a) return; var k = a.dataset.a; closeSheet();
    if (k === 'prof') openProfile(i.peerUid);
    else if (k === 'search') searchSheet();
    else if (k === 'mute') api('POST', '/social/mute', { conv: C.id, on: !i.muted }).then(function () { C.info.muted = !i.muted; toast(i.muted ? 'Unmuted' : 'Muted'); });
    else if (k === 'pins') { sheet('<h3 style="margin:0 0 8px">Pinned</h3>' + ((i.pins || []).length ? i.pins.map(function (p) { return '<button class="act" data-j="' + p.id + '"><span><b>' + esc(p.name) + '</b><br>' + esc(plain(p.text)) + '</span></button>'; }).join('') : '<div class="empty">Nothing pinned.</div>')); jumpHandler(); }
  };
}
function jumpHandler() { setTimeout(function () { $('#sheet').onclick = function (e) { var j = e.target.closest('[data-j]'); if (j) { closeSheet(); jumpTo(+j.dataset.j); } }; }, 0); }
function jumpTo(id) {
  var el = document.querySelector('#msgs [data-mid="' + id + '"]'); if (!el) return toast('Scroll up to find that message.');
  el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.style.transition = 'box-shadow .3s'; el.style.boxShadow = '0 0 0 3px var(--acc)'; setTimeout(function () { el.style.boxShadow = ''; }, 1400);
}
function searchSheet() {
  sheet('<input class="in" id="sq" placeholder="Search this chat" autocomplete="off"><div id="sr" style="margin-top:8px"></div>');
  var t = 0; $('#sq').oninput = function () { clearTimeout(t); var q = $('#sq').value.trim(); if (q.length < 2) { $('#sr').innerHTML = ''; return; } t = setTimeout(function () { api('GET', '/social/search?conv=' + C.id + '&q=' + encodeURIComponent(q)).then(function (r) { var l = r.results || []; $('#sr').innerHTML = l.length ? l.map(function (x) { return '<button class="act" data-j="' + x.id + '"><span><b>' + esc(x.name) + '</b> <span class="sub">' + new Date(x.at).toLocaleDateString() + '</span><br>' + esc(plain(x.text)) + '</span></button>'; }).join('') : '<div class="empty">No messages found.</div>'; }); }, 350); };
  jumpHandler(); setTimeout(function () { var e = $('#sq'); e && e.focus(); }, 350);
}

// ---------- sharing games and lists into a chat ----------
function shareGamePick(convId) {
  ensureGames().then(function (g) {
    if (!g || !g.length) return toast('Your library is not ready. Open the Library tab first.');
    sheet('<input class="in" id="gq2" placeholder="Search your games" autocomplete="off"><div id="gl2" style="margin-top:8px"></div>');
    var draw = function () { var q = $('#gq2').value.toLowerCase(); $('#gl2').innerHTML = g.filter(function (x) { return !q || (x.name || '').toLowerCase().indexOf(q) >= 0; }).slice(0, 40).map(function (x) { return '<button class="act" data-g="' + x.appid + '"><span>' + esc(x.name) + ' <span class="sub">' + Math.round((x.playtime_forever || 0) / 60) + ' h</span></span></button>'; }).join(''); };
    draw(); $('#gq2').oninput = draw;
    $('#sheet').onclick = function (e) { var b = e.target.closest('[data-g]'); if (!b) return; var x = g.filter(function (y) { return y.appid === +b.dataset.g; })[0]; closeSheet(); sendGameTo(convId, x); };
  });
}
function sendGameTo(convId, x) { return api('POST', '/social/send', { conv: convId, kind: 'game', data: { appid: x.appid, name: x.name, hours: Math.round((x.playtime_forever || 0) / 60) } }).then(function (r) { toast(r.error || 'Shared!'); if (!r.error) { hp('ok'); if (C.id === convId) loadConv(false); } }); }
function shareListPick(convId) {
  api('GET', '/social/lists').then(function (r) {
    var l = r.lists || []; if (!l.length) return toast('You have no lists yet. Share your wishlist from the Library tab, or make one on the PC app.');
    sheet('<h3 style="margin:0 0 8px">Share a list</h3>' + l.map(function (x) { return act('list', esc(x.title) + ' <span class="sub">' + x.count + ' games</span>', 'data-l="' + x.id + '"'); }).join(''));
    $('#sheet').onclick = function (e) { var b = e.target.closest('[data-l]'); if (!b) return; closeSheet(); api('POST', '/social/send', { conv: convId, kind: 'list', data: { id: b.dataset.l } }).then(function (s) { toast(s.error || 'Shared!'); if (!s.error && C.id === convId) loadConv(false); }); };
  });
}
function pickConv(title, cb) {
  var cv = (S.ov && S.ov.convs) || []; if (!cv.length) return toast('No chats yet.');
  sheet('<h3 style="margin:0 0 8px">' + esc(title) + '</h3>' + cv.map(function (c) { return '<button class="act" data-c2="' + c.id + '"><span>' + esc(c.name) + '</span></button>'; }).join(''));
  $('#sheet').onclick = function (e) { var b = e.target.closest('[data-c2]'); if (b) { closeSheet(); cb(b.dataset.c2); } };
}
