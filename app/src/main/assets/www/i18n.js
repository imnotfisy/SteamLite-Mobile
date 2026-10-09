'use strict';
// ====================== 1.2.0: languages and screen-reader labels ======================
// The fixed texts of the app in the same languages as the PC app. Texts that contain names or numbers stay in English.
var TR = {
  'Home': { bg: 'Начало', es: 'Inicio', fr: 'Accueil', de: 'Start', pt: 'Início', it: 'Home' },
  'Messages': { bg: 'Съобщения', es: 'Mensajes', fr: 'Messages', de: 'Nachrichten', pt: 'Mensagens', it: 'Messaggi' },
  'Friends': { bg: 'Приятели', es: 'Amigos', fr: 'Amis', de: 'Freunde', pt: 'Amigos', it: 'Amici' },
  'Library': { bg: 'Библиотека', es: 'Biblioteca', fr: 'Bibliothèque', de: 'Bibliothek', pt: 'Biblioteca', it: 'Libreria' },
  'Me': { bg: 'Аз', es: 'Yo', fr: 'Moi', de: 'Ich', pt: 'Eu', it: 'Io' },
  'Settings': { bg: 'Настройки', es: 'Ajustes', fr: 'Paramètres', de: 'Einstellungen', pt: 'Definições', it: 'Impostazioni' },
  'Search': { bg: 'Търсене', es: 'Buscar', fr: 'Rechercher', de: 'Suchen', pt: 'Pesquisar', it: 'Cerca' },
  'Themes': { bg: 'Теми', es: 'Temas', fr: 'Thèmes', de: 'Designs', pt: 'Temas', it: 'Temi' },
  'Create': { bg: 'Създай', es: 'Crear', fr: 'Créer', de: 'Erstellen', pt: 'Criar', it: 'Crea' },
  'Reset': { bg: 'Нулиране', es: 'Restablecer', fr: 'Réinitialiser', de: 'Zurücksetzen', pt: 'Repor', it: 'Ripristina' },
  'Edit profile': { bg: 'Редактиране на профила', es: 'Editar perfil', fr: 'Modifier le profil', de: 'Profil bearbeiten', pt: 'Editar perfil', it: 'Modifica profilo' },
  'Leaderboard': { bg: 'Класация', es: 'Clasificación', fr: 'Classement', de: 'Bestenliste', pt: 'Classificação', it: 'Classifica' },
  'Events': { bg: 'Събития', es: 'Eventos', fr: 'Événements', de: 'Events', pt: 'Eventos', it: 'Eventi' },
  'Achievement tracker': { bg: 'Следене на постижения', es: 'Seguimiento de logros', fr: 'Suivi des succès', de: 'Erfolgs-Tracker', pt: 'Progresso de conquistas', it: 'Tracker traguardi' },
  'Trophy room': { bg: 'Зала с трофеи', es: 'Sala de trofeos', fr: 'Salle des trophées', de: 'Trophäenraum', pt: 'Sala de troféus', it: 'Sala dei trofei' },
  'Friend activity': { bg: 'Активност на приятели', es: 'Actividad de amigos', fr: 'Activité des amis', de: 'Freundesaktivität', pt: 'Atividade dos amigos', it: 'Attività degli amici' },
  'Compare libraries': { bg: 'Сравни библиотеки', es: 'Comparar bibliotecas', fr: 'Comparer les bibliothèques', de: 'Bibliotheken vergleichen', pt: 'Comparar bibliotecas', it: 'Confronta librerie' },
  'Account': { bg: 'Акаунт', es: 'Cuenta', fr: 'Compte', de: 'Konto', pt: 'Conta', it: 'Account' },
  'Appearance': { bg: 'Външен вид', es: 'Apariencia', fr: 'Apparence', de: 'Darstellung', pt: 'Aparência', it: 'Aspetto' },
  'Notifications': { bg: 'Известия', es: 'Notificaciones', fr: 'Notifications', de: 'Benachrichtigungen', pt: 'Notificações', it: 'Notifiche' },
  'Privacy': { bg: 'Поверителност', es: 'Privacidad', fr: 'Confidentialité', de: 'Datenschutz', pt: 'Privacidade', it: 'Privacy' },
  'Steam connection': { bg: 'Връзка със Steam', es: 'Conexión con Steam', fr: 'Connexion à Steam', de: 'Steam-Verbindung', pt: 'Ligação ao Steam', it: 'Connessione a Steam' },
  'Chat': { bg: 'Чат', es: 'Chat', fr: 'Discussion', de: 'Chat', pt: 'Conversa', it: 'Chat' },
  'Updates': { bg: 'Актуализации', es: 'Actualizaciones', fr: 'Mises à jour', de: 'Updates', pt: 'Atualizações', it: 'Aggiornamenti' },
  'Storage': { bg: 'Хранилище', es: 'Almacenamiento', fr: 'Stockage', de: 'Speicher', pt: 'Armazenamento', it: 'Archiviazione' },
  'About': { bg: 'Относно', es: 'Acerca de', fr: 'À propos', de: 'Über', pt: 'Acerca', it: 'Informazioni' },
  'Mode': { bg: 'Режим', es: 'Modo', fr: 'Mode', de: 'Modus', pt: 'Modo', it: 'Modalità' },
  'Auto': { bg: 'Авто', es: 'Auto', fr: 'Auto', de: 'Auto', pt: 'Auto', it: 'Auto' },
  'Dark': { bg: 'Тъмен', es: 'Oscuro', fr: 'Sombre', de: 'Dunkel', pt: 'Escuro', it: 'Scuro' },
  'Light': { bg: 'Светъл', es: 'Claro', fr: 'Clair', de: 'Hell', pt: 'Claro', it: 'Chiaro' },
  'Text size': { bg: 'Размер на текста', es: 'Tamaño del texto', fr: 'Taille du texte', de: 'Textgröße', pt: 'Tamanho do texto', it: 'Dimensione testo' },
  'Small': { bg: 'Малък', es: 'Pequeño', fr: 'Petit', de: 'Klein', pt: 'Pequeno', it: 'Piccolo' },
  'Normal': { bg: 'Нормален', es: 'Normal', fr: 'Normal', de: 'Normal', pt: 'Normal', it: 'Normale' },
  'Large': { bg: 'Голям', es: 'Grande', fr: 'Grand', de: 'Groß', pt: 'Grande', it: 'Grande' },
  'Huge': { bg: 'Огромен', es: 'Enorme', fr: 'Très grand', de: 'Riesig', pt: 'Enorme', it: 'Enorme' },
  'Language': { bg: 'Език', es: 'Idioma', fr: 'Langue', de: 'Sprache', pt: 'Idioma', it: 'Lingua' },
  'Reduce motion': { bg: 'По-малко анимации', es: 'Reducir movimiento', fr: 'Réduire les animations', de: 'Weniger Bewegung', pt: 'Reduzir movimento', it: 'Riduci animazioni' },
  'Sign out': { bg: 'Изход', es: 'Cerrar sesión', fr: 'Se déconnecter', de: 'Abmelden', pt: 'Terminar sessão', it: 'Esci' },
  'Do Not Disturb': { bg: 'Не безпокой', es: 'No molestar', fr: 'Ne pas déranger', de: 'Nicht stören', pt: 'Não incomodar', it: 'Non disturbare' },
  'Read receipts': { bg: 'Потвърждения за прочитане', es: 'Confirmaciones de lectura', fr: 'Accusés de lecture', de: 'Lesebestätigungen', pt: 'Confirmações de leitura', it: 'Conferme di lettura' },
  'Typing indicator': { bg: 'Индикатор за писане', es: 'Indicador de escritura', fr: 'Indicateur de saisie', de: 'Tippanzeige', pt: 'Indicador de escrita', it: 'Indicatore di scrittura' },
  'App lock': { bg: 'Заключване на приложението', es: 'Bloqueo de la app', fr: 'Verrouillage de l’app', de: 'App-Sperre', pt: 'Bloqueio da app', it: 'Blocco app' },
  'Sale alerts': { bg: 'Известия за намаления', es: 'Alertas de ofertas', fr: 'Alertes de promotions', de: 'Angebotsbenachrichtigungen', pt: 'Alertas de promoções', it: 'Avvisi di saldi' },
  'Link previews': { bg: 'Преглед на връзки', es: 'Vista previa de enlaces', fr: 'Aperçu des liens', de: 'Linkvorschau', pt: 'Pré-visualização de links', it: 'Anteprima link' },
  'Quick replies': { bg: 'Бързи отговори', es: 'Respuestas rápidas', fr: 'Réponses rapides', de: 'Schnellantworten', pt: 'Respostas rápidas', it: 'Risposte rapide' },
  'Cached data': { bg: 'Кеширани данни', es: 'Datos en caché', fr: 'Données en cache', de: 'Zwischengespeicherte Daten', pt: 'Dados em cache', it: 'Dati in cache' },
  'Clear': { bg: 'Изчисти', es: 'Borrar', fr: 'Effacer', de: 'Löschen', pt: 'Limpar', it: 'Cancella' },
  'Check': { bg: 'Провери', es: 'Comprobar', fr: 'Vérifier', de: 'Prüfen', pt: 'Verificar', it: 'Controlla' },
  'Change': { bg: 'Промени', es: 'Cambiar', fr: 'Modifier', de: 'Ändern', pt: 'Alterar', it: 'Cambia' },
  'Add': { bg: 'Добави', es: 'Añadir', fr: 'Ajouter', de: 'Hinzufügen', pt: 'Adicionar', it: 'Aggiungi' },
  'Copy': { bg: 'Копирай', es: 'Copiar', fr: 'Copier', de: 'Kopieren', pt: 'Copiar', it: 'Copia' },
  'Open': { bg: 'Отвори', es: 'Abrir', fr: 'Ouvrir', de: 'Öffnen', pt: 'Abrir', it: 'Apri' },
  'Save': { bg: 'Запази', es: 'Guardar', fr: 'Enregistrer', de: 'Speichern', pt: 'Guardar', it: 'Salva' },
  'Cancel': { bg: 'Отказ', es: 'Cancelar', fr: 'Annuler', de: 'Abbrechen', pt: 'Cancelar', it: 'Annulla' },
  'Pick up where you left off': { bg: 'Продължи откъдето спря', es: 'Sigue donde lo dejaste', fr: 'Reprenez où vous en étiez', de: 'Weitermachen, wo du aufgehört hast', pt: 'Continua onde ficaste', it: 'Riprendi da dove eri rimasto' },
  'Your top games': { bg: 'Най-играните ти игри', es: 'Tus juegos más jugados', fr: 'Vos jeux les plus joués', de: 'Deine meistgespielten Spiele', pt: 'Os teus jogos mais jogados', it: 'I tuoi giochi più giocati' },
  'Friends online': { bg: 'Приятели онлайн', es: 'Amigos en línea', fr: 'Amis en ligne', de: 'Freunde online', pt: 'Amigos online', it: 'Amici online' },
  'On sale from your wishlist': { bg: 'Намаления от списъка ти', es: 'En oferta de tu lista de deseos', fr: 'En promo dans votre liste de souhaits', de: 'Im Angebot von deiner Wunschliste', pt: 'Em promoção da tua lista de desejos', it: 'In saldo dalla tua lista dei desideri' },
  'Explore': { bg: 'Разгледай', es: 'Explorar', fr: 'Explorer', de: 'Entdecken', pt: 'Explorar', it: 'Esplora' },
  'See all activity': { bg: 'Виж всичката активност', es: 'Ver toda la actividad', fr: 'Voir toute l’activité', de: 'Alle Aktivitäten ansehen', pt: 'Ver toda a atividade', it: 'Vedi tutte le attività' },
  'Nobody is online right now.': { bg: 'Никой не е онлайн в момента.', es: 'Nadie está en línea ahora.', fr: 'Personne n’est en ligne pour le moment.', de: 'Gerade ist niemand online.', pt: 'Ninguém está online neste momento.', it: 'Al momento nessuno è online.' },
  'Games': { bg: 'Игри', es: 'Juegos', fr: 'Jeux', de: 'Spiele', pt: 'Jogos', it: 'Giochi' },
  'Wishlist': { bg: 'Списък с желания', es: 'Lista de deseos', fr: 'Liste de souhaits', de: 'Wunschliste', pt: 'Lista de desejos', it: 'Lista dei desideri' },
  'Stats': { bg: 'Статистика', es: 'Estadísticas', fr: 'Statistiques', de: 'Statistiken', pt: 'Estatísticas', it: 'Statistiche' },
  'Most played': { bg: 'Най-играни', es: 'Más jugados', fr: 'Les plus joués', de: 'Meistgespielt', pt: 'Mais jogados', it: 'Più giocati' },
  'Last played': { bg: 'Последно играни', es: 'Jugados recientemente', fr: 'Joués récemment', de: 'Zuletzt gespielt', pt: 'Jogados recentemente', it: 'Giocati di recente' },
  'All': { bg: 'Всички', es: 'Todos', fr: 'Tous', de: 'Alle', pt: 'Todos', it: 'Tutti' },
  'Recent': { bg: 'Скорошни', es: 'Recientes', fr: 'Récents', de: 'Zuletzt', pt: 'Recentes', it: 'Recenti' },
  'Unplayed': { bg: 'Неиграни', es: 'Sin jugar', fr: 'Non joués', de: 'Ungespielt', pt: 'Por jogar', it: 'Non giocati' },
  'Favourites': { bg: 'Любими', es: 'Favoritos', fr: 'Favoris', de: 'Favoriten', pt: 'Favoritos', it: 'Preferiti' },
  'Reply': { bg: 'Отговори', es: 'Responder', fr: 'Répondre', de: 'Antworten', pt: 'Responder', it: 'Rispondi' },
  'Copy text': { bg: 'Копирай текста', es: 'Copiar texto', fr: 'Copier le texte', de: 'Text kopieren', pt: 'Copiar texto', it: 'Copia testo' },
  'Pin': { bg: 'Закачи', es: 'Fijar', fr: 'Épingler', de: 'Anheften', pt: 'Fixar', it: 'Fissa' },
  'Unpin': { bg: 'Откачи', es: 'Desfijar', fr: 'Désépingler', de: 'Lösen', pt: 'Desafixar', it: 'Rimuovi' },
  'Edit': { bg: 'Редактирай', es: 'Editar', fr: 'Modifier', de: 'Bearbeiten', pt: 'Editar', it: 'Modifica' },
  'Delete': { bg: 'Изтрий', es: 'Eliminar', fr: 'Supprimer', de: 'Löschen', pt: 'Eliminar', it: 'Elimina' },
  'Report': { bg: 'Докладвай', es: 'Denunciar', fr: 'Signaler', de: 'Melden', pt: 'Denunciar', it: 'Segnala' },
  'Forward': { bg: 'Препрати', es: 'Reenviar', fr: 'Transférer', de: 'Weiterleiten', pt: 'Reencaminhar', it: 'Inoltra' },
  'New group': { bg: 'Нова група', es: 'Nuevo grupo', fr: 'Nouveau groupe', de: 'Neue Gruppe', pt: 'Novo grupo', it: 'Nuovo gruppo' },
  'Online': { bg: 'Онлайн', es: 'En línea', fr: 'En ligne', de: 'Online', pt: 'Online', it: 'Online' },
  'Offline': { bg: 'Офлайн', es: 'Desconectado', fr: 'Hors ligne', de: 'Offline', pt: 'Offline', it: 'Offline' },
  'Add friend': { bg: 'Добави приятел', es: 'Añadir amigo', fr: 'Ajouter un ami', de: 'Freund hinzufügen', pt: 'Adicionar amigo', it: 'Aggiungi amico' },
  'Message': { bg: 'Съобщение', es: 'Mensaje', fr: 'Message', de: 'Nachricht', pt: 'Mensagem', it: 'Messaggio' },
  'Accept': { bg: 'Приеми', es: 'Aceptar', fr: 'Accepter', de: 'Annehmen', pt: 'Aceitar', it: 'Accetta' },
  'View profile': { bg: 'Виж профила', es: 'Ver perfil', fr: 'Voir le profil', de: 'Profil ansehen', pt: 'Ver perfil', it: 'Vedi profilo' },
  'Tagline (shown under your name)': { bg: 'Мото (показва се под името)', es: 'Eslogan (bajo tu nombre)', fr: 'Slogan (sous votre nom)', de: 'Slogan (unter deinem Namen)', pt: 'Lema (por baixo do nome)', it: 'Motto (sotto il nome)' },
  'Search settings': { bg: 'Търсене в настройките', es: 'Buscar ajustes', fr: 'Rechercher un paramètre', de: 'Einstellungen suchen', pt: 'Pesquisar definições', it: 'Cerca impostazioni' }
};
var LANG = ls.get('lang') || 'en';
function trText(s) { var t = TR[s]; return t && t[LANG] ? t[LANG] : s; }
function trNode(n) {
  if (n.nodeType === 3) {
    var raw0 = n.nodeValue, key = n.__o !== undefined ? n.__o : raw0.trim();
    if (n.__o === undefined && !TR[key]) return;
    var lead = raw0.match(/^\s*/)[0], trail = raw0.match(/\s*$/)[0], out = LANG === 'en' ? key : trText(key);
    if (n.__o === undefined) n.__o = key;
    var next = lead + out + trail; if (n.nodeValue !== next) n.nodeValue = next; return;
  }
  if (n.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(n.tagName)) { if (n.nodeType === 1 && n.tagName === 'INPUT') attrTr(n); return; }
  attrTr(n); for (var c = n.firstChild; c; c = c.nextSibling) trNode(c);
}
function attrTr(n) { ['placeholder', 'aria-label', 'title'].forEach(function (a) { if (!n.getAttribute) return; var v = n.getAttribute(a), k = n['__o_' + a] !== undefined ? n['__o_' + a] : v; if (!k || !TR[k]) return; n['__o_' + a] = k; var o = LANG === 'en' ? k : trText(k); if (v !== o) n.setAttribute(a, o); }); }
var trTimer = 0, pending = [];
function schedule(nodes) { nodes.forEach(function (x) { pending.push(x); }); if (trTimer) return; trTimer = setTimeout(function () { trTimer = 0; var p = pending; pending = []; if (LANG !== 'en' || document.querySelector('[data-tr]')) p.forEach(function (x) { if (x.isConnected !== false) trNode(x); }); a11y(p); }, 40); }
function applyLang() { LANG = ls.get('lang') || 'en'; document.documentElement.lang = LANG; trNode(document.body); }
// ---------- screen reader labels: icon-only buttons and tappable rows get a name ----------
var A11Y_ID = { cback: 'Back', chmore: 'More options', cemo: 'Emoji', cat: 'Attach', csend: 'Send message', newsb: 'News and polls', newpill: 'Scroll to new messages', hav: 'My profile', hset: 'Settings', hsearch: 'Search', unlockbtn: 'Unlock', rcancel: 'Cancel recording', rsend: 'Send recording', updx: 'Dismiss', nbx: 'Dismiss', gpback: 'Back', gpshare: 'Share', gpfav: 'Favourite', mset: 'Settings' };
function a11y(nodes) {
  (nodes && nodes.length ? nodes : [document.body]).forEach(function (root) {
    if (!root || root.nodeType !== 1) return;
    var all = root.querySelectorAll ? [root].concat([].slice.call(root.querySelectorAll('button,[data-c],[data-f],[data-gp],[data-g],[data-pf],[data-oc],.row,.stat,.hcard,.fcard'))) : [root];
    all.forEach(function (e) {
      if (e.tagName === 'BUTTON') { if (!e.getAttribute('aria-label') && !(e.textContent || '').trim()) { var l = A11Y_ID[e.id] || e.title; if (l) e.setAttribute('aria-label', l); } return; }
      if (!e.getAttribute('role') && (e.dataset && (e.dataset.c || e.dataset.f || e.dataset.gp || e.dataset.g || e.dataset.pf || e.dataset.oc) || e.classList.contains('row') && e.onclick)) { e.setAttribute('role', 'button'); if (!e.getAttribute('tabindex')) e.setAttribute('tabindex', '0'); }
    });
  });
}
new MutationObserver(function (muts) { var nodes = []; muts.forEach(function (m) { if (m.type === 'childList') m.addedNodes.forEach(function (n) { nodes.push(n); }); else if (m.type === 'characterData') nodes.push(m.target); else if (m.type === 'attributes') nodes.push(m.target); }); if (nodes.length) schedule(nodes); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });
document.addEventListener('DOMContentLoaded', function () { applyLang(); a11y(); });
if (document.readyState !== 'loading') { applyLang(); a11y(); }
