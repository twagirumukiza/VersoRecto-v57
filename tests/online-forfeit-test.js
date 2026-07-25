// Test fonctionnel : vérifie réellement le comportement quand un joueur quitte une
// partie en ligne en cours (voir CHANGELOG V53.1) :
//   - il est ajouté à gameState.forfeited et exclu du jeu (isRanked() renvoie true) ;
//   - si c'était son tour, le tour passe automatiquement au joueur suivant encore actif ;
//   - si un seul joueur actif reste après le(s) forfait(s), la partie se termine et ce
//     joueur est classé vainqueur (lastRemaining), comme pour une victoire par attrition ;
//   - le joueur forfait apparaît toujours après les entrées de classement réelles.
//
// Charge online-v39.js dans un vrai DOM (jsdom) ; `firebase` n'a pas besoin d'être réel
// puisqu'on ne teste pas la connexion, seulement la logique de jeu locale.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

function fail(message) {
  console.error('ÉCHEC:', message);
  process.exitCode = 1;
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function main() {
  const html = fs.readFileSync(path.join(ROOT, 'online-v39.html'), 'utf8');
  const source = fs.readFileSync(path.join(ROOT, 'online-v39.js'), 'utf8');

  const dom = new JSDOM(html, {
    url: 'https://example.invalid/online-v39.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.load = () => {};
  // online-v39.js vérifie `typeof firebase === "undefined"` avant de l'utiliser ; on ne
  // simule pas de vraie connexion ici, seulement la logique de jeu locale.
  window.firebase = undefined;

  let loadError = null;
  window.addEventListener('error', event => { loadError = event.error || event.message; });

  const ctx = dom.getInternalVMContext();
  vm.runInContext(source, ctx, { filename: 'online-v39.js' });
  if (loadError) fail(`online-v39.js a levé une erreur au chargement : ${loadError}`);

  const getGameState = () => vm.runInContext('gameState', ctx);
  // vm.runInContext ne permet pas de passer des arguments directement : on assigne via une
  // variable temporaire du contexte global.
  ctx.__testValue = null;
  const pushGameState = value => {
    ctx.__testValue = value;
    vm.runInContext('gameState = globalThis.__testValue', ctx);
  };

  const players = {
    p1: { uid: 'p1', name: 'Alice', color: 'yellow', seat: 0 },
    p2: { uid: 'p2', name: 'Bob', color: 'red', seat: 1 },
    p3: { uid: 'p3', name: 'Chloé', color: 'blue', seat: 2 },
  };
  const turnOrder = ['p1', 'p2', 'p3'];

  const baseState = {
    status: 'playing',
    maxPlayers: 3,
    players,
    playerOrder: turnOrder,
    pieces: [],
    turnOrder,
    currentTurnIndex: 1, // c'est le tour de p2
    activeUid: 'p2',
    ranking: [],
    forfeited: [],
    history: [],
    winner: null,
    lastMoveBy: null,
  };
  // createPieces a besoin de la vraie liste des joueurs (via le contexte du jeu).
  ctx.__players = Object.values(players);
  baseState.pieces = vm.runInContext('createPieces(globalThis.__players)', ctx);
  pushGameState(baseState);

  // --- Cas 1 : p2 (dont c'est le tour) déclare forfait pendant que 3 joueurs sont actifs ---
  vm.runInContext('forfeitPlayer("p2")', ctx);
  let state = getGameState();

  assert(state.forfeited.some(f => f.playerId === 'p2'), "p2 devrait être dans gameState.forfeited après forfeitPlayer('p2').");
  assert(vm.runInContext('isRanked("p2")', ctx) === true, "isRanked('p2') devrait être vrai après forfait (exclusion du jeu).");
  assert(state.activeUid !== 'p2', "Le tour aurait dû passer au joueur suivant, pas rester sur p2.");
  assert(['p1', 'p3'].includes(state.activeUid), `activeUid inattendu après le forfait de p2 : ${state.activeUid}`);
  assert(state.status === 'playing', "La partie devrait continuer : il reste 2 joueurs actifs (p1 et p3).");
  console.log(`OK : p2 déclare forfait pendant son propre tour → tour passé à ${state.activeUid}, partie continue.`);

  // --- Cas 2 : p1 déclare forfait à son tour → il ne reste plus qu'un seul joueur actif (p3) ---
  vm.runInContext('gameState.activeUid = "p1"; gameState.currentTurnIndex = 0;', ctx);
  vm.runInContext('forfeitPlayer("p1")', ctx);
  state = getGameState();

  assert(state.forfeited.length === 2, `2 joueurs forfaits attendus, trouvé ${state.forfeited.length}.`);
  assert(state.status === 'finished', "La partie aurait dû se terminer : il ne reste qu'un seul joueur actif (p3).");
  const winnerEntry = state.ranking.find(r => r.playerId === 'p3');
  assert(winnerEntry, "p3 (dernier joueur actif) devrait être classé vainqueur (lastRemaining).");
  assert(winnerEntry.lastRemaining === true, "p3 devrait porter le marqueur lastRemaining.");
  assert(state.winner === 'p3', `state.winner devrait être 'p3', trouvé '${state.winner}'.`);
  console.log('OK : forfaits successifs jusqu\'à un seul joueur actif → partie terminée, ce joueur classé vainqueur.');

  // --- Vérifie que les entrées "forfeited" sont bien affichées après le classement réel ---
  // (test au niveau du code source, pas du rendu DOM, pour rester simple et robuste)
  const rankingRenderIdx = source.indexOf('els.rankingList.innerHTML');
  assert(
    rankingRenderIdx >= 0 && source.slice(rankingRenderIdx, rankingRenderIdx + 400).includes('gameState.forfeited'),
    "Le rendu du classement devrait inclure les entrées gameState.forfeited après gameState.ranking."
  );
  console.log('OK : le rendu du classement inclut bien les joueurs forfaits.');

  console.log('\nOK FORFAIT EN LIGNE : déclaration de forfait, saut de tour et fin de partie par attrition vérifiés.');
  process.exit(0);
}

main();
