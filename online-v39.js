
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCIlJZSG3F1VyxCbr0hkh9ZFBY3vtuzetk",
  authDomain: "verso-recto-v37.firebaseapp.com",
  databaseURL: "https://verso-recto-v37-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "verso-recto-v37",
  storageBucket: "verso-recto-v37.firebasestorage.app",
  messagingSenderId: "392239676935",
  appId: "1:392239676935:web:8d1ac4454c9d7a43a534a2"
};
const MOVES_TEXT = "1A → 1B, 2A, 1D\n1B → 1C, 1A, 2B, 2C\n1C → 1D, 1B, 2B, 2C, 2E, 1F\n1D → 1E, 1C, 2D, 2F, 1A\n1E → 1F, 1D, 2E, 2C, 1H\n1F → 1G, 1E, 2F, 2G, 2D, 1C\n1G → 1H, 1F, 2F, 2G, 2I, 1J\n1H → 1I, 1G, 2H, 2J, 1E\n1I → 1J, 1H, 2I, 2G, 1L\n1J → 1K, 1I, 2J, 2K, 2H, 1G\n1K → 1L, 1J, 2J, 2K\n1L → 1K, 2L, 1I\n2A → 2B, 1A, 3A, 3C, 2D\n2B → 2C, 1B, 1C, 2A, 3B, 3D\n2C → 2D, 1C, 1E, 2B, 3C, 1B, 3A, 2F\n2D → 2E, 1D, 1F, 2C, 3D, 3E, 3B, 2A\n2E → 2F, 1E, 1C, 2D, 3D, 3E, 3G, 2H\n2F → 2G, 1F, 1G, 1D, 2E, 3F, 3H, 2C\n2G → 2H, 1G, 1I, 2F, 3G, 1F, 3E, 2J\n2H → 2I, 1H, 1J, 2G, 3H, 3I, 3F, 2E\n2I → 2J, 1I, 1G, 2H, 3H, 3I, 3K, 2L\n2J → 2K, 1J, 1K, 1H, 2I, 3J, 3L, 2G\n2K → 2L, 1K, 2J, 3K, 1J, 3I\n2L → 1L, 2K, 3L, 3J, 2I\n3A → 3B, 2A, 2C, 4A, 3D\n3B → 3C, 2B, 2D, 3A, 4B, 4C\n3C → 3D, 2C, 2A, 3B, 4B, 4C, 4E, 3F\n3D → 3E, 2D, 2E, 2B, 3C, 4D, 4F, 3A\n3E → 3F, 2E, 2G, 3D, 4E, 2D, 4C, 3H\n3F → 3G, 2F, 2H, 3E, 4F, 4G, 4D, 3C\n3G → 3H, 2G, 2E, 3F, 4F, 4G, 4I, 3J\n3H → 3I, 2H, 2I, 2F, 3G, 4H, 4J, 3E\n3I → 3J, 2I, 2K, 3H, 4I, 2H, 4G, 3L\n3J → 3K, 2J, 2L, 3I, 4J, 4K, 4H, 3G\n3K → 3L, 2K, 2I, 3J, 4J, 4K\n3L → 2L, 2J, 3K, 4L, 3I\n4A → 4B, 3A, 5A, 5C, 4D\n4B → 4C, 3B, 3C, 4A, 5B, 5D\n4C → 4D, 3C, 3E, 4B, 5C, 3B, 5A, 4F\n4D → 4E, 3D, 3F, 4C, 5D, 5E, 5B, 4A\n4E → 4F, 3E, 3C, 4D, 5D, 5E, 5G, 4H\n4F → 4G, 3F, 3G, 3D, 4E, 5F, 5H, 4C\n4G → 4H, 3G, 3I, 4F, 5G, 3F, 5E, 4J\n4H → 4I, 3H, 3J, 4G, 5H, 5I, 5F, 4E\n4I → 4J, 3I, 3G, 4H, 5H, 5I, 5K, 4L\n4J → 4K, 3J, 3K, 3H, 4I, 5J, 5L, 4G\n4K → 4L, 3K, 4J, 5K, 3J, 5I\n4L → 3L, 4K, 5L, 5J, 4I\n5A → 5B, 4A, 4C, 6A, 5D\n5B → 5C, 4B, 4D, 5A, 6B, 6C\n5C → 5D, 4C, 4A, 5B, 6B, 6C, 6E, 5F\n5D → 5E, 4D, 4E, 4B, 5C, 6D, 6F, 5A\n5E → 5F, 4E, 4G, 5D, 6E, 4D, 6C, 5H\n5F → 5G, 4F, 4H, 5E, 6F, 6G, 6D, 5C\n5G → 5H, 4G, 4E, 5F, 6F, 6G, 6I, 5J\n5H → 5I, 4H, 4I, 4F, 5G, 6H, 6J, 5E\n5I → 5J, 4I, 4K, 5H, 6I, 4H, 6G, 5L\n5J → 5K, 4J, 4L, 5I, 6J, 6K, 6H, 5G\n5K → 5L, 4K, 4I, 5J, 6J, 6K\n5L → 4L, 4J, 5K, 6L, 5I\n6A → 6B, 5A, 6D\n6B → 6C, 5B, 5C, 6A\n6C → 6D, 5C, 5E, 6B, 5B, 6F\n6D → 6E, 5D, 5F, 6C, 6A\n6E → 6F, 5E, 5C, 6D, 6H\n6F → 6G, 5F, 5G, 5D, 6E, 6C\n6G → 6H, 5G, 5I, 6F, 5F, 6J\n6H → 6I, 5H, 5J, 6G, 6E\n6I → 6J, 5I, 5G, 6H, 6L\n6J → 6K, 5J, 5K, 5H, 6I, 6G\n6K → 6L, 5K, 6J, 5J\n6L → 5L, 6K, 6I";
const LETTERS = "ABCDEFGHIJKL".split("");
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const CELL_IDS = Array.from({ length: 6 }, (_, r) => LETTERS.map(l => `${r + 1}${l}`)).flat();
const COLOR_KEYS = ["yellow", "red", "blue", "black"];
const COLORS = { yellow:{label:"Jaune",css:"#f4c430"}, red:{label:"Rouge",css:"#d94b3d"}, blue:{label:"Bleu",css:"#2f71d0"}, black:{label:"Noir",css:"#2d2a26"} };
const INITIAL_POSITIONS = {
  yellow:["1B","1F","1J","3F","5B","5F","5J"], red:["1C","1G","1K","3G","5C","5G","5K"],
  blue:["2B","2F","2J","4F","6B","6F","6J"], black:["2C","2G","2K","4G","6C","6G","6K"]
};
const els = {
  board:document.getElementById("board"), playerName:document.getElementById("playerName"), maxPlayers:document.getElementById("maxPlayers"),
  createRoom:document.getElementById("createRoom"), joinRoom:document.getElementById("joinRoom"), leaveRoom:document.getElementById("leaveRoom"),
  startRoom:document.getElementById("startRoom"), joinCode:document.getElementById("joinCode"), roomCodeDisplay:document.getElementById("roomCodeDisplay"),
  onlineStatus:document.getElementById("onlineStatus"), gameStatus:document.getElementById("gameStatus"), copyCode:document.getElementById("copyCode"),
  resetSelection:document.getElementById("resetSelection"), roomInfo:document.getElementById("roomInfo"), playersList:document.getElementById("playersList"),
  turnInfo:document.getElementById("turnInfo"), rankingList:document.getElementById("rankingList"), moveHistory:document.getElementById("moveHistory"),
  soundToggleOnline:document.getElementById("soundToggleOnline"), soundToggleInGame:document.getElementById("soundToggleInGame"), leaveRoomInGame:document.getElementById("leaveRoomInGame"),
  tournamentMode:document.getElementById("tournamentMode"), tournamentPanel:document.getElementById("tournamentPanel"),
  tournamentRound:document.getElementById("tournamentRound"), tournamentBracket:document.getElementById("tournamentBracket"),
  roundPauseOverlay:document.getElementById("roundPauseOverlay"), roundPauseText:document.getElementById("roundPauseText")
};
let app=null, db=null, auth=null, currentUser=null, currentRef=null, roomCode=null, selectedPieceId=null, legalDestinations=[];
let gameState = emptyGame();
const audioState = { enabled:false, context:null, moveSoundPath:"assets/piece-move.mp3", victorySoundPath:"assets/victory.mp3", ambientNodes:[] };

const SESSION_KEY = "versoRectoV38OnlineSession";

function saveOnlineSession() {
  if (!roomCode || !currentUser) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    roomCode,
    uid: currentUser.uid,
    savedAt: Date.now()
  }));
}

function clearSavedOnlineSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function restoreOnlineSessionIfPossible() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved || !currentUser) return;

  try {
    const data = JSON.parse(saved);
    if (!data.roomCode || data.uid !== currentUser.uid) return;

    const ref = roomRef(data.roomCode);
    const snap = await ref.once("value");
    const room = snap.val();

    if (!room || !room.players || !room.players[currentUser.uid]) {
      clearSavedOnlineSession();
      return;
    }

    roomCode = data.roomCode;
    currentRef = ref;
    showCode(roomCode);
    els.joinCode.value = roomCode;
    listenRoom(roomCode);
    setOnlineStatus(`Session restaurée : ${roomCode}.`);
  } catch (error) {
    console.error(error);
    clearSavedOnlineSession();
  }
}

// --- Mode Tournoi (en ligne) ---------------------------------------------------------------
// Un tournoi commence à exactement 4 joueurs. Cette fonction élimine UN joueur précis
// (le dernier classé de la manche, ou un joueur qui vient d'abandonner) : ses 7 pions
// repartent à leur case de départ mais restent figés et grisés (piece.isNeutral = true, le
// même mécanisme que les couleurs non choisies), il est retiré des joueurs actifs, et soit
// une nouvelle manche démarre aussitôt pour les survivants — auquel cas TOUS les pions
// (survivants comme éliminés précédents) reviennent à leur case de départ et l'ordre de jeu
// est retiré au sort — soit, s'il ne reste qu'un seul joueur, celui-ci est couronné champion
// et le plateau final reste affiché tel quel (pas de manche suivante, donc pas de reset).
// V54.2 : ajout d'une pause de 5 secondes entre chaque manche (comme en mode local), avec
// un pop-up "Xe manche terminée" synchronisé sur tous les clients via Firebase. La fonction
// est donc coupée en deux temps :
//  - beginTournamentRoundPause() : fige immédiatement les pions de l'éliminé, enregistre
//    l'élimination, et bascule gameState.status sur "round-paused" (plus aucun coup possible)
//    pendant que tournament.roundPause mémorise l'horodatage de départ de la pause.
//  - completeTournamentRoundTransition() : exécutée 5 secondes plus tard, elle fait
//    réellement démarrer la manche suivante (plateau remis à zéro) ou couronne le champion.
// Comme il n'y a pas de serveur autoritaire dans cette architecture (chaque client écrit
// directement dans Firebase), CHAQUE client connecté programme son propre minuteur dès qu'il
// voit la pause démarrer (voir scheduleTournamentRoundPauseEndIfNeeded), pour que la manche
// suivante démarre même si le joueur à l'origine de la fin de manche s'est déconnecté entre
// temps.
function beginTournamentRoundPause(eliminated) {
  const tournament = gameState.tournament;
  if (!tournament || !tournament.active || tournament.champion || !eliminated) return;

  gameState.pieces.forEach(piece => {
    if (piece.color === eliminated.color) piece.isNeutral = true;
  });

  tournament.eliminationOrder = [...tournament.eliminationOrder, {
    playerId: eliminated.uid,
    playerName: eliminated.name,
    color: eliminated.color,
    round: tournament.round,
    place: playerArray().length,
  }];

  const nextPlayers = { ...gameState.players };
  delete nextPlayers[eliminated.uid];
  gameState.players = nextPlayers;
  gameState.playerOrder = (gameState.playerOrder || []).filter(uid => uid !== eliminated.uid);

  gameState.history = [
    `Tournoi — Manche ${tournament.round} : ${eliminated.name} (${COLORS[eliminated.color].label}) est éliminé. Ses pions restent figés sur le plateau.`,
    ...(gameState.history || []),
  ];

  tournament.roundPause = { round: tournament.round, startedAt: Date.now() };
  gameState.status = "round-paused";
  gameState.activeUid = null;
}

function completeTournamentRoundTransition() {
  const tournament = gameState.tournament;
  if (!tournament || !tournament.roundPause) return;
  tournament.roundPause = null;

  const remaining = playerArray();

  if (remaining.length <= 1) {
    const championPlayer = remaining[0] || null;
    tournament.champion = championPlayer
      ? { playerId: championPlayer.uid, playerName: championPlayer.name, color: championPlayer.color }
      : null;
    gameState.turnOrder = championPlayer ? [championPlayer.uid] : [];
    gameState.currentTurnIndex = 0;
    gameState.activeUid = null;
    gameState.status = "finished";
    gameState.winner = championPlayer?.uid || null;

    if (championPlayer) {
      gameState.history = [
        `🏆 ${championPlayer.name} (${COLORS[championPlayer.color].label}) remporte le tournoi !`,
        ...gameState.history,
      ];
    }
    return;
  }

  tournament.round += 1;
  gameState.status = "playing";
  gameState.winner = null;
  gameState.ranking = [];
  // Nouvelle manche = plateau remis à zéro : tous les pions (y compris ceux des joueurs
  // déjà éliminés lors de manches précédentes) reviennent à leur case de départ.
  // createPieces() gèle automatiquement (isNeutral = true) les couleurs qui ne sont plus
  // dans gameState.players, donc l'éliminé du jour comme les éliminés précédents restent
  // bien figés-et-grisés sur leur case de départ, pendant que les survivants repartent à zéro.
  gameState.pieces = createPieces(remaining);
  gameState.turnOrder = shuffle(remaining.map(p => p.uid));
  gameState.currentTurnIndex = 0;
  gameState.activeUid = gameState.turnOrder[0];
  gameState.history = [
    `Tournoi — Manche ${tournament.round} : à vous de jouer (${remaining.length} joueurs restants).`,
    ...gameState.history,
  ];
}

const ROUND_PAUSE_MS = 5000;
let onlineRoundPauseTimeout = null;

function mancheOrdinalLabel(roundNumber) {
  const words = ["Première", "Deuxième", "Troisième", "Quatrième", "Cinquième", "Sixième"];
  return words[roundNumber - 1] || `${roundNumber}e`;
}

function showRoundPauseOverlay(roundNumber) {
  if (els.roundPauseText) els.roundPauseText.textContent = `${mancheOrdinalLabel(roundNumber)} manche terminée`;
  if (els.roundPauseOverlay) els.roundPauseOverlay.hidden = false;
}

function hideRoundPauseOverlay() {
  if (els.roundPauseOverlay) els.roundPauseOverlay.hidden = true;
}

function clearOnlineRoundPauseTimer() {
  if (onlineRoundPauseTimeout) {
    window.clearTimeout(onlineRoundPauseTimeout);
    onlineRoundPauseTimeout = null;
  }
  hideRoundPauseOverlay();
}

// Appelée à chaque snapshot Firebase reçu : affiche le pop-up si une pause est en cours, et
// programme (une seule fois par client) la transition vers la manche suivante.
function scheduleTournamentRoundPauseEndIfNeeded() {
  const pause = gameState.tournament?.roundPause;
  if (!pause || gameState.status !== "round-paused") {
    clearOnlineRoundPauseTimer();
    return;
  }

  showRoundPauseOverlay(pause.round);

  if (onlineRoundPauseTimeout) return; // déjà programmé par ce client
  const elapsed = Date.now() - (pause.startedAt || Date.now());
  const remainingMs = Math.max(0, ROUND_PAUSE_MS - elapsed);
  onlineRoundPauseTimeout = window.setTimeout(() => {
    onlineRoundPauseTimeout = null;
    // Un autre client connecté a peut-être déjà fait avancer la manche entre-temps :
    // on ne fait rien si la pause a déjà été levée, pour ne pas écraser un état plus récent.
    if (!gameState.tournament?.roundPause) return;
    completeTournamentRoundTransition();
    hideRoundPauseOverlay();
    render();
    syncState(true);
  }, remainingMs);
}

function isForfeited(uid) {
  return Boolean((gameState.forfeited || []).some(entry => entry.playerId === uid));
}
function isRanked(uid) {
  return Boolean((gameState.ranking || []).some(entry => entry.playerId === uid)) || isForfeited(uid);
}

function remainingPlayers() {
  return playerArray().filter(player => !isRanked(player.uid));
}

function requiredWinnersToFinish() {
  const actualCount =
    (gameState.turnOrder && gameState.turnOrder.length) ||
    (gameState.playerOrder && gameState.playerOrder.length) ||
    playerArray().length;
  return Math.max(1, actualCount - 1);
}

function nextActiveUidAfter(currentUid) {
  const remaining = remainingPlayers().map(player => player.uid);
  if (!remaining.length) return null;

  const order = gameState.turnOrder && gameState.turnOrder.length
    ? gameState.turnOrder
    : playerArray().map(player => player.uid);

  const startIndex = Math.max(0, order.indexOf(currentUid));

  for (let offset = 1; offset <= order.length; offset++) {
    const candidate = order[(startIndex + offset) % order.length];
    if (remaining.includes(candidate)) return candidate;
  }

  return remaining[0] || null;
}

// Marque un joueur comme forfait (abandon en cours de partie) : ses pions restent sur
// le plateau mais deviennent inactifs (grisés, non déplaçables — même traitement que les
// pions d'un joueur déjà classé), son tour est automatiquement sauté à chaque fois via
// remainingPlayers()/nextActiveUidAfter() (qui savent déjà ignorer les joueurs classés),
// et il apparaît en dernière position du classement final, quel que soit le moment où il
// a quitté la partie (les entrées "forfeited" sont toujours affichées après les entrées
// "ranking" réelles — voir renderInfo()).
function forfeitPlayer(uid) {
  const player = gameState.players?.[uid];
  if (!player || isRanked(uid)) return;

  // En mode tournoi, abandonner élimine immédiatement ce joueur (comme un "dernier"
  // automatique), sans attendre que les autres terminent leur classement de la manche.
  if (gameState.tournament?.active && !gameState.tournament.champion) {
    if (gameState.status === "playing") {
      eliminateFromTournamentRound({ uid, name: player.name, color: player.color });
    }
    render();
    syncState(true);
    return;
  }

  gameState.forfeited = [...(gameState.forfeited || []), {
    playerId: uid,
    playerName: player.name,
    color: player.color,
    quitAt: Date.now(),
  }];
  gameState.history = [`${player.name} a quitté la partie — forfait.`, ...(gameState.history || [])];

  if (gameState.status === "playing") {
    if (gameState.activeUid === uid) {
      gameState.activeUid = nextActiveUidAfter(uid);
      gameState.currentTurnIndex = Math.max(0, (gameState.turnOrder || []).indexOf(gameState.activeUid));
    }

    const remaining = remainingPlayers();
    if (remaining.length <= 1) {
      if (remaining.length === 1) {
        gameState.ranking = [...(gameState.ranking || []), {
          playerId: remaining[0].uid,
          playerName: remaining[0].name,
          color: remaining[0].color,
          rank: (gameState.ranking || []).length + 1,
          lastRemaining: true,
        }];
      }
      gameState.status = "finished";
      gameState.winner = gameState.ranking[0]?.playerId || null;
      gameState.activeUid = null;
      gameState.history.unshift("Partie terminée : classement complet.");
    }
  }

  render();
  syncState(true);
}
function emptyGame(){return {status:"idle",maxPlayers:4,players:{},playerOrder:[],pieces:createPieces([]),turnOrder:[],currentTurnIndex:0,ranking:[],forfeited:[],history:[],winner:null,activeUid:null,lastMoveBy:null,tournament:null};}
async function initFirebase(){
  if(db&&auth&&currentUser)return true;
  if(typeof firebase==="undefined"){setOnlineStatus("Firebase n’est pas chargé. Recharge la page avec internet.");return false;}
  try{app=firebase.apps?.length?firebase.app():firebase.initializeApp(FIREBASE_CONFIG);db=firebase.database();auth=firebase.auth();const cred=await auth.signInAnonymously();currentUser=cred.user;setOnlineStatus("Firebase V37 connecté avec identification anonyme.");return true;}
  catch(e){console.error(e);setOnlineStatus("Erreur Firebase V37. Active Authentication > Anonymous + Realtime Database.");return false;}
}
function setOnlineStatus(t){els.onlineStatus.textContent=t;} function setGameStatus(t){els.gameStatus.textContent=t;}
function showCode(code){els.roomCodeDisplay.hidden=!code;els.roomCodeDisplay.querySelector("strong").textContent=code||"—";els.copyCode.disabled=!code;}
function normalizeCode(raw){const txt=(raw||"").trim().toUpperCase();return txt.startsWith("VR-")?txt:`VR-${txt}`;}
function generateCode(){const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let code="VR-";for(let i=0;i<4;i++)code+=alphabet[Math.floor(Math.random()*alphabet.length)];return code;}
function playerArray(players=gameState.players){return Object.values(players||{}).sort((a,b)=>a.seat-b.seat);}
function createPieces(playersArray){const controlled=new Set(playersArray.map(p=>p.color));const pieces=[];for(const color of COLOR_KEYS){INITIAL_POSITIONS[color].forEach((position,index)=>pieces.push({id:`${color}-${index+1}`,color,position,face:"VERSO",isNeutral:!controlled.has(color)}));}return pieces;}
function parseMoves(text){const map={};text.split(/\n+/).forEach(line=>{const clean=line.trim();if(!clean||!clean.includes("→"))return;const [from,rest]=clean.split("→").map(p=>p.trim());map[from]=rest.split(",").map(x=>x.trim()).filter(Boolean);});return map;}
const MOVES=parseMoves(MOVES_TEXT);
function squareDiag(c,r){return c%2===r%2?"/":"\\";}
function trianglePolygonsForSquare(c,r){const x=c*100,y=r*100,w=100,h=100;if(squareDiag(c,r)==="/")return [[{x,y},{x:x+w,y},{x,y:y+h}],[{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]];return [[{x,y},{x:x+w,y},{x:x+w,y:y+h}],[{x,y},{x,y:y+h},{x:x+w,y:y+h}]];}
function centroid(poly){return {x:poly.reduce((s,p)=>s+p.x,0)/poly.length,y:poly.reduce((s,p)=>s+p.y,0)/poly.length};}
function buildCellPolygons(){const map={};for(let r=0;r<6;r++){const row=[];for(let c=0;c<6;c++)trianglePolygonsForSquare(c,r).forEach(poly=>row.push({poly,centroid:centroid(poly)}));row.sort((a,b)=>a.centroid.x-b.centroid.x);row.forEach((item,i)=>map[`${r+1}${LETTERS[i]}`]=item.poly);}return map;}
const CELL_POLYGONS=buildCellPolygons(), CENTROIDS=Object.fromEntries(CELL_IDS.map(id=>[id,centroid(CELL_POLYGONS[id])])), ADJACENCY=buildAdjacency();
function buildAdjacency(){const map={};for(const a of CELL_IDS)map[a]=CELL_IDS.filter(b=>a!==b&&sharedVertices(CELL_POLYGONS[a],CELL_POLYGONS[b])>=2);return map;}
function sharedVertices(a,b){let count=0;for(const p of a)if(b.some(q=>Math.abs(q.x-p.x)<.001&&Math.abs(q.y-p.y)<.001))count++;return count;}
function points(poly){return poly.map(p=>`${p.x},${p.y}`).join(" ");}
function roomRef(code){return db.ref(`v37Rooms/${code}`);}
function activePlayer(){if(gameState.status!=="playing")return null;return gameState.players?.[gameState.turnOrder[gameState.currentTurnIndex]]||null;}
function myPlayer(){return currentUser?gameState.players?.[currentUser.uid]:null;} function isHost(){return currentUser&&gameState.hostUid===currentUser.uid;} function isMyTurn(){return currentUser&&gameState.activeUid===currentUser.uid;}
function pieceAt(cell){return gameState.pieces.find(p=>p.position===cell);} function legalMoves(piece){if(!piece||piece.isNeutral)return[];return(MOVES[piece.position]||[]).filter(to=>!pieceAt(to));}

function createInitialRoom(code,maxPlayers,name,tournamentMode){const uid=currentUser.uid,p={uid,name,color:"yellow",seat:0,joinedAt:Date.now()};const effectiveMax=tournamentMode?4:maxPlayers;return{code,status:"waiting",hostUid:uid,maxPlayers:effectiveMax,tournamentMode:Boolean(tournamentMode),createdAt:Date.now(),updatedAt:Date.now(),players:{[uid]:p},playerOrder:[uid],state:{...emptyGame(),status:"waiting",maxPlayers:effectiveMax,hostUid:uid,players:{[uid]:p},playerOrder:[uid],pieces:createPieces([p]),history:[`Salon ${code} créé.${tournamentMode?" Mode tournoi — 4 joueurs requis.":""} En attente des joueurs.`]}};}
async function createRoom(){if(!await initFirebase())return;leaveRoom(false);const tournamentMode=Boolean(els.tournamentMode?.checked),code=generateCode(),maxPlayers=tournamentMode?4:Number(els.maxPlayers.value||4),name=(els.playerName.value||"Joueur").trim()||"Joueur",ref=roomRef(code),room=createInitialRoom(code,maxPlayers,name,tournamentMode);try{await ref.set(room);roomCode=code;currentRef=ref;showCode(code);els.joinCode.value=code;saveOnlineSession();setOnlineStatus(`Salon ${code} créé.${tournamentMode?" Mode tournoi : 4 joueurs requis avant de démarrer.":""} Partage le code.`);listenRoom(code);}catch(e){console.error(e);setOnlineStatus("Création impossible. Vérifie les règles Firebase V37.");}}
async function joinRoom(){if(!await initFirebase())return;const code=normalizeCode(els.joinCode.value);if(!/^VR-[A-Z0-9]{4}$/.test(code)){setOnlineStatus("Code invalide. Exemple : VR-4821.");return;}leaveRoom(false);const ref=roomRef(code);try{const snap=await ref.once("value"),room=snap.val();if(!room||room.status!=="waiting"){setOnlineStatus("Salon introuvable ou déjà démarré.");return;}const players=room.state?.players||room.players||{},order=room.state?.playerOrder||room.playerOrder||Object.keys(players);if(players[currentUser.uid]){roomCode=code;currentRef=ref;saveOnlineSession();listenRoom(code);return;}if(order.length>=room.maxPlayers){setOnlineStatus("Salon complet.");return;}const seat=order.length,name=(els.playerName.value||`Joueur ${seat+1}`).trim()||`Joueur ${seat+1}`,player={uid:currentUser.uid,name,color:COLOR_KEYS[seat],seat,joinedAt:Date.now()},nextPlayers={...players,[currentUser.uid]:player},nextOrder=[...order,currentUser.uid],nextState={...(room.state||emptyGame()),status:"waiting",maxPlayers:room.maxPlayers,hostUid:room.hostUid,players:nextPlayers,playerOrder:nextOrder,pieces:createPieces(playerArray(nextPlayers)),history:[`${name} a rejoint le salon.`,...((room.state?.history)||[])]};await ref.update({updatedAt:Date.now(),players:nextPlayers,playerOrder:nextOrder,state:nextState});roomCode=code;currentRef=ref;showCode(code);saveOnlineSession();listenRoom(code);}catch(e){console.error(e);setOnlineStatus("Impossible de rejoindre le salon.");}}
async function startRoom(){if(!currentRef||!isHost())return;const players=playerArray();const tournamentMode=Boolean(gameState.tournamentMode);if(tournamentMode&&players.length!==4){setOnlineStatus("Mode tournoi : il faut exactement 4 joueurs pour démarrer.");return;}if(!tournamentMode&&players.length<2){setOnlineStatus("Il faut au moins 2 joueurs.");return;}const turnOrder=players.map(p=>p.uid),started={...gameState,status:"playing",turnOrder,currentTurnIndex:0,activeUid:turnOrder[0],pieces:createPieces(players),history:["Partie démarrée.",...(gameState.history||[])],lastMoveBy:currentUser.uid,tournament:tournamentMode?{active:true,round:1,originalPlayers:players.map(p=>({id:p.uid,name:p.name,color:p.color})),eliminationOrder:[],champion:null}:null};await currentRef.update({status:"playing",updatedAt:Date.now(),state:started});}
function listenRoom(code){const ref=roomRef(code);if(currentRef)currentRef.off();currentRef=ref;els.leaveRoom.disabled=false;ref.on("value",snap=>{const room=snap.val();if(!room||!room.state){setOnlineStatus("Salon introuvable.");return;}roomCode=code;gameState=room.state;showCode(code);setOnlineStatus(room.status==="waiting"?`Salon ${code} : ${playerArray().length}/${gameState.maxPlayers} joueur(s).`:`Connecté à ${code}. Couleur : ${COLORS[myPlayer()?.color]?.label||"—"}.`);render();scheduleTournamentRoundPauseEndIfNeeded();});}
async function syncState(force = false){
  if (!currentRef || !currentUser) return;

  const me = myPlayer();
  if (!me && !force) return;

  try {
    await currentRef.update({
      status: gameState.status,
      updatedAt: Date.now(),
      state: {
        ...gameState,
        lastMoveBy: currentUser.uid
      }
    });
  } catch (error) {
    console.error(error);
    setOnlineStatus("Erreur : le coup n’a pas été synchronisé. Vérifie les règles Firebase.");
  }
}
function selectPiece(id){
  if (gameState.status !== "playing" || !isMyTurn()) return;
  if (isRanked(currentUser.uid)) return;

  const piece = gameState.pieces.find(p => p.id === id);
  const me = myPlayer();

  if (!piece || !me || piece.color !== me.color) return;

  selectedPieceId = id;
  legalDestinations = legalMoves(piece);
  render();
}
function moveSelected(to){
  if (!selectedPieceId || !legalDestinations.includes(to) || !isMyTurn()) return;

  const piece = gameState.pieces.find(p => p.id === selectedPieceId);
  const player = activePlayer();
  if (!piece || !player) return;

  const from = piece.position;
  const learningPiecesBefore = gameState.pieces.map(p => ({ id: p.id, color: p.color, position: p.position, face: p.face }));
  piece.position = to;
  piece.face = piece.face === "RECTO" ? "VERSO" : "RECTO";
  playMoveSound();

  gameState.learningHistory = [...(gameState.learningHistory || []), { piecesBefore: learningPiecesBefore, playerId: player.uid, color: player.color, pieceId: piece.id, to, mode: "online", ply: (gameState.learningHistory || []).length }];
  gameState.history = [`${player.name} : ${piece.id} ${from} → ${to}`, ...(gameState.history || [])];
  selectedPieceId = null;
  legalDestinations = [];

  const alreadyRanked = isRanked(player.uid);
  const hasWonNow = checkVictory(player) && !alreadyRanked;

  if (hasWonNow) {
    const rank = (gameState.ranking || []).length + 1;
    gameState.ranking = [...(gameState.ranking || []), {
      playerId: player.uid,
      playerName: player.name,
      color: player.color,
      rank
    }];
    gameState.history.unshift(`${player.name} termine ${rank}${rank === 1 ? "er" : "e"}.`);
    playVictorySound();
  }

  const needed = requiredWinnersToFinish();

  if ((gameState.ranking || []).length >= needed) {
    const remaining = remainingPlayers();
    if (remaining.length === 1 && !isRanked(remaining[0].uid)) {
      gameState.ranking = [...(gameState.ranking || []), {
        playerId: remaining[0].uid,
        playerName: remaining[0].name,
        color: remaining[0].color,
        rank: (gameState.ranking || []).length + 1,
        lastRemaining: true
      }];
    }
    gameState.status = "finished";
    gameState.winner = gameState.ranking[0]?.playerId || player.uid;
    // Enregistre la partie terminée sans bloquer la synchronisation Firebase.
    // v48.2 utilisait ici une variable inexistante (`currentRoomCode`), ce qui
    // déclenchait une ReferenceError exactement au dernier coup.
    try {
      const memory = window.VR48Memory || window.VR45Memory || window.VR44Memory;
      if (memory) {
        const sessionId = String(roomCode || "online") + ":" + String(
          gameState.startedAt || gameState.createdAt || gameState.history?.length || Date.now()
        );
        if (!memory.markSession || memory.markSession(sessionId)) {
          memory.beginGame?.();
          for (const learnedMove of (gameState.learningHistory || [])) {
            memory.recordMove?.(learnedMove);
          }
          memory.finishGame?.({
            ranking: gameState.ranking,
            players: playerArray(gameState.players),
            draw: false
          });
        }
      }
    } catch (memoryError) {
      // Une erreur de mémoire locale ne doit jamais empêcher la fin de partie
      // ni la publication du dernier état dans Firebase.
      console.error("Erreur d’enregistrement de la mémoire en ligne :", memoryError);
    }
    gameState.activeUid = null;
    gameState.history.unshift("Partie terminée : classement complet.");

    // Mode tournoi : le dernier classé de cette manche est éliminé (ses pions se figent
    // sur le plateau), puis une pause de 5 secondes (pop-up "Xe manche terminée") précède le
    // démarrage de la manche suivante pour les survivants — ou le couronnement du champion.
    // beginTournamentRoundPause() fige l'état et démarre la pause ; c'est
    // completeTournamentRoundTransition(), appelée par scheduleTournamentRoundPauseEndIfNeeded()
    // après le délai, qui fait réellement avancer la manche (ou couronne le champion).
    if (gameState.tournament?.active && !gameState.tournament.champion) {
      const lastEntry = gameState.ranking[gameState.ranking.length - 1];
      const eliminatedPlayer = lastEntry ? gameState.players[lastEntry.playerId] : null;
      if (eliminatedPlayer) {
        beginTournamentRoundPause({
          uid: lastEntry.playerId,
          name: eliminatedPlayer.name,
          color: eliminatedPlayer.color,
        });
      }
    }
  } else {
    gameState.status = "playing";
    gameState.activeUid = nextActiveUidAfter(player.uid);
    gameState.currentTurnIndex = Math.max(0, gameState.turnOrder.indexOf(gameState.activeUid));
    if (hasWonNow) {
      gameState.history.unshift("La partie continue pour les autres joueurs.");
    }
  }

  render();
  syncState(true);
  scheduleTournamentRoundPauseEndIfNeeded();
}
function checkVictory(player){const pieces=gameState.pieces.filter(p=>p.color===player.color);if(pieces.length!==7)return false;const face=pieces[0].face;if(!pieces.every(p=>p.face===face))return false;const positions=new Set(pieces.map(p=>p.position)),visited=new Set([pieces[0].position]),stack=[pieces[0].position];while(stack.length){const current=stack.pop();for(const next of ADJACENCY[current]||[])if(positions.has(next)&&!visited.has(next)){visited.add(next);stack.push(next);}}return visited.size===pieces.length;}
function leaveRoom(reset = true){
  if (reset && roomCode && gameState.status !== "idle") {
    const ok = window.confirm("Voulez-vous vraiment quitter cette partie en ligne ?");
    if (!ok) return;
  }

  if (reset && currentUser && gameState.status === "playing" && myPlayer() && !isRanked(currentUser.uid)) {
    forfeitPlayer(currentUser.uid);
  }

  clearOnlineRoundPauseTimer();

  if (currentRef) {
    currentRef.off();
    currentRef = null;
  }

  if (reset) {
    roomCode = null;
    selectedPieceId = null;
    legalDestinations = [];
    gameState = emptyGame();
    showCode(null);
    clearSavedOnlineSession();
    els.leaveRoom.disabled = true;
    if (els.leaveRoomInGame) els.leaveRoomInGame.disabled = true;
    document.body.classList.remove("online-playing");
    setOnlineStatus("Déconnecté du salon.");
    render();
  }
}
function copyCode(){if(!roomCode)return;navigator.clipboard?.writeText(roomCode);setOnlineStatus(`Code copié : ${roomCode}`);}
function audioContext(){if(!audioState.context)audioState.context=new(window.AudioContext||window.webkitAudioContext)();if(audioState.context.state==="suspended")audioState.context.resume();return audioState.context;}
function toggleSound(){
  audioState.enabled = !audioState.enabled;
  const label = audioState.enabled ? "🔊 Son" : "🔇 Son";

  if (els.soundToggleOnline) {
    els.soundToggleOnline.textContent = label;
    els.soundToggleOnline.setAttribute("aria-pressed", String(audioState.enabled));
  }

  if (els.soundToggleInGame) {
    els.soundToggleInGame.textContent = label;
    els.soundToggleInGame.setAttribute("aria-pressed", String(audioState.enabled));
  }

  if (audioState.enabled) startAmbientMusic();
  else stopAmbientMusic();
}
function startAmbientMusic(){stopAmbientMusic();const ctx=audioContext();if(!ctx)return;const master=ctx.createGain();master.gain.value=.025;master.connect(ctx.destination);[110,146.83,196].forEach((freq,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=i===0?"sine":"triangle";osc.frequency.value=freq;gain.gain.value=.12/(i+1);osc.connect(gain);gain.connect(master);osc.start();audioState.ambientNodes.push({osc,gain,master});});}
function stopAmbientMusic(){audioState.ambientNodes.forEach(n=>{try{n.osc.stop();}catch(e){}});audioState.ambientNodes=[];}
function playMoveSound(){if(!audioState.enabled)return;try{const a=new Audio(audioState.moveSoundPath);a.volume=.7;a.play().catch(()=>playGeneratedClick());}catch(e){playGeneratedClick();}}
function playVictorySound(){if(!audioState.enabled)return;try{const a=new Audio(audioState.victorySoundPath);a.volume=.8;a.play().catch(()=>playGeneratedVictory());}catch(e){playGeneratedVictory();}}
function playGeneratedClick(){const ctx=audioContext(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=260;gain.gain.setValueAtTime(.12,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.18);}
function playGeneratedVictory(){const ctx=audioContext();[392,523,659,784].forEach((f,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=f;gain.gain.setValueAtTime(.12,ctx.currentTime+i*.12);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.12+.42);osc.connect(gain);gain.connect(ctx.destination);osc.start(ctx.currentTime+i*.12);osc.stop(ctx.currentTime+i*.12+.45);});}
function render(){renderBoard();renderInfo();}
function renderBoard(){els.board.innerHTML="";for(const id of CELL_IDS){const poly=CELL_POLYGONS[id],cell=document.createElementNS("http://www.w3.org/2000/svg","polygon");cell.setAttribute("points",points(poly));cell.setAttribute("class",`cell empty ${legalDestinations.includes(id)?"legal remote-legal":""}`);if(legalDestinations.includes(id))cell.addEventListener("click",()=>moveSelected(id));els.board.appendChild(cell);const c=CENTROIDS[id],label=document.createElementNS("http://www.w3.org/2000/svg","text");label.setAttribute("x",c.x);label.setAttribute("y",c.y+5);label.setAttribute("text-anchor","middle");label.setAttribute("class","cell-label");label.textContent=id;els.board.appendChild(label);}for(const piece of gameState.pieces){const poly=CELL_POLYGONS[piece.position],p=document.createElementNS("http://www.w3.org/2000/svg","polygon");p.setAttribute("points",points(poly));const owner=playerArray().find(pl=>pl.color===piece.color);const forfeit=owner&&isForfeited(owner.uid);p.setAttribute("fill",piece.isNeutral?"#cfcfcf":COLORS[piece.color].css);p.setAttribute("class",`piece ${piece.isNeutral?"neutral":""} ${forfeit?"finished-piece":""} ${selectedPieceId===piece.id?"selected":""} ${isMyTurn()?"my-turn":""}`);if(!piece.isNeutral&&!forfeit)p.addEventListener("click",()=>selectPiece(piece.id));els.board.appendChild(p);if(piece.face==="VERSO"){const c=CENTROIDS[piece.position],dot=document.createElementNS("http://www.w3.org/2000/svg","circle");dot.setAttribute("cx",c.x);dot.setAttribute("cy",c.y);dot.setAttribute("r",7);dot.setAttribute("class","verso-dot");els.board.appendChild(dot);}}}
function renderInfo(){
  const player = activePlayer();

  if (gameState.status === "idle") {
    setGameStatus("Aucun salon.");
  } else if (gameState.status === "waiting") {
    setGameStatus(`Salon ${roomCode} — attente joueurs.`);
  } else if (gameState.status === "round-paused") {
    const roundNumber = gameState.tournament?.roundPause?.round || gameState.tournament?.round || 1;
    setGameStatus(`${mancheOrdinalLabel(roundNumber)} manche terminée — préparation de la manche suivante…`);
  } else if (gameState.status === "finished") {
    setGameStatus("Partie terminée. Classement complet.");
  } else if (player) {
    setGameStatus(isMyTurn() ? "À toi de jouer." : `En attente de ${player.name}.`);
  }

  els.startRoom.disabled = !(roomCode && isHost() && gameState.status === "waiting" && playerArray().length >= 2);
  if (els.leaveRoomInGame) els.leaveRoomInGame.disabled = !roomCode;

  els.roomInfo.innerHTML = roomCode
    ? `<strong>${roomCode}</strong><br>${playerArray().length}/${gameState.maxPlayers} joueur(s)<br><span class="secure-note">UID anonyme : ${currentUser?.uid?.slice(0, 8) || "—"}</span>`
    : "Aucun salon.";

  els.playersList.innerHTML = playerArray()
    .map(p => `<div class="player-seat"><strong>${escapeHtml(p.name)}</strong>${COLORS[p.color].label} ${p.uid === currentUser?.uid ? "— toi" : ""} ${isForfeited(p.uid) ? "— a quitté" : isRanked(p.uid) ? "— terminé" : ""}</div>`)
    .join("") || "—";

  els.turnInfo.innerHTML = player
    ? `${escapeHtml(player.name)} — ${COLORS[player.color].label}`
    : "—";

  els.rankingList.innerHTML = (gameState.ranking?.length || gameState.forfeited?.length)
    ? [
        ...gameState.ranking.map(r => `<li>${r.rank || ""}. ${escapeHtml(r.playerName)} — ${COLORS[r.color].label}${r.lastRemaining ? " — dernier restant" : ""}</li>`),
        ...(gameState.forfeited || []).map(f => `<li class="muted">— ${escapeHtml(f.playerName)} — ${COLORS[f.color].label} — forfait (a quitté la partie)</li>`),
      ].join("")
    : '<li class="muted">Aucun gagnant pour l’instant.</li>';

  els.moveHistory.innerHTML = (gameState.history || [])
    .slice(0, 20)
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");

  renderTournamentPanel();

  document.body.classList.toggle("online-playing", gameState.status === "playing");
}

function placeLabel(index) {
  if (index === 0) return "1er";
  if (index === 1) return "2e";
  if (index === 2) return "3e";
  return `${index + 1}e`;
}

function renderTournamentPanel() {
  if (!els.tournamentPanel) return;
  const tournament = gameState.tournament;

  if (!tournament) {
    els.tournamentPanel.hidden = true;
    return;
  }

  els.tournamentPanel.hidden = false;

  if (els.tournamentRound) {
    els.tournamentRound.textContent = tournament.champion
      ? `🏆 Champion : ${tournament.champion.playerName} (${COLORS[tournament.champion.color].label})`
      : `Manche ${tournament.round} — ${playerArray().length} joueur(s) encore en lice sur ${tournament.originalPlayers.length}.`;
  }

  if (els.tournamentBracket) {
    const rows = [];

    if (tournament.champion) {
      rows.push(`<li class="tournament-champion">🏆 Champion — ${escapeHtml(tournament.champion.playerName)} (${COLORS[tournament.champion.color].label})</li>`);
    }

    [...(tournament.eliminationOrder || [])].reverse().forEach(entry => {
      rows.push(`<li>${placeLabel(entry.place - 1)} — ${escapeHtml(entry.playerName)} (${COLORS[entry.color].label}) — éliminé en manche ${entry.round}</li>`);
    });

    els.tournamentBracket.innerHTML = rows.join("") || '<li class="muted">Aucune élimination pour l’instant.</li>';
  }
}

els.createRoom.addEventListener("click",createRoom);els.joinRoom.addEventListener("click",joinRoom);els.startRoom.addEventListener("click",startRoom);els.leaveRoom.addEventListener("click",()=>leaveRoom(true));els.copyCode.addEventListener("click",copyCode);els.resetSelection.addEventListener("click",()=>{selectedPieceId=null;legalDestinations=[];render();});els.soundToggleOnline.addEventListener("click",toggleSound); if(els.soundToggleInGame) els.soundToggleInGame.addEventListener("click",toggleSound); if(els.leaveRoomInGame) els.leaveRoomInGame.addEventListener("click",()=>leaveRoom(true));
initFirebase().then(() => restoreOnlineSessionIfPossible()).then(render);render();

window.addEventListener("beforeunload", event => {
  if (roomCode && gameState.status === "playing") {
    event.preventDefault();
    event.returnValue = "";
  }
});
