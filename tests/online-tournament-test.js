// Test fonctionnel du MODE TOURNOI en ligne — V54.2.
//
// Deux parties :
//   A) Teste directement beginTournamentRoundPause() + completeTournamentRoundTransition()
//      — le cœur du mécanisme (gel des pions, retrait du joueur, pause de 5s avec pop-up,
//      transition de manche, couronnement) — de façon exhaustive sur 3 éliminations
//      successives jusqu'au champion, exactement comme pour le mode local
//      (tests/tournament-test.js). Depuis la V54.2, la transition de manche est retardée de
//      5 secondes (ROUND_PAUSE_MS) : le test force cette transition immédiatement après avoir
//      vérifié que le pop-up de pause est bien affiché, plutôt que d'attendre pour de vrai.
//   B) Vérifie le branchement complet en conditions réelles : un vrai coup gagnant joué via
//      moveSelected() (validation de coup incluse, table MOVES/ADJACENCY réelle) doit bien
//      déclencher l'élimination automatique du perdant, la pause, puis le couronnement du
//      gagnant, sans intervention manuelle. C'est ce branchement précis qui manquait avant ce
//      correctif (seul l'abandon en cours de partie déclenchait une élimination).
//
// Nécessite `npm install` (jsdom) au préalable.

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

// Simule l'écoulement des 5 secondes de pause entre manches (ROUND_PAUSE_MS) : appelle la
// vraie fonction beginTournamentRoundPause(), vérifie que le pop-up de pause est bien affiché,
// puis force immédiatement la vraie fonction completeTournamentRoundTransition() (au lieu
// d'attendre pour de vrai), afin de garder le test rapide tout en exerçant le code réel.
function eliminateAndCompleteRound(ctx, eliminatedJson) {
  vm.runInContext(`beginTournamentRoundPause(${eliminatedJson});`, ctx);

  const statusDuringPause = vm.runInContext('gameState.status', ctx);
  assert(statusDuringPause === 'round-paused', `Le statut devrait être "round-paused" pendant la pause, trouvé "${statusDuringPause}".`);
  const pauseRound = vm.runInContext('gameState.tournament.roundPause?.round', ctx);
  assert(typeof pauseRound === 'number', 'tournament.roundPause.round devrait être défini pendant la pause.');

  vm.runInContext('completeTournamentRoundTransition();', ctx);
}

function loadOnlinePage() {
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
  window.firebase = undefined; // pas de vraie connexion réseau nécessaire pour ce test

  let loadError = null;
  window.addEventListener('error', event => { loadError = event.error || event.message; });

  const ctx = dom.getInternalVMContext();
  vm.runInContext(source, ctx, { filename: 'online-v39.js' });
  if (loadError) fail(`online-v39.js a levé une erreur au chargement : ${loadError}`);

  return { window, ctx };
}

function partA_eliminationMechanic() {
  const { ctx } = loadOnlinePage();
  const getState = () => vm.runInContext('gameState', ctx);

  const players = {
    p1: { uid: 'p1', name: 'Alice', color: 'yellow', seat: 0 },
    p2: { uid: 'p2', name: 'Bob', color: 'red', seat: 1 },
    p3: { uid: 'p3', name: 'Chloé', color: 'blue', seat: 2 },
    p4: { uid: 'p4', name: 'David', color: 'black', seat: 3 },
  };

  ctx.__players = players;
  const initialState = {
    status: 'playing',
    maxPlayers: 4,
    players,
    playerOrder: ['p1', 'p2', 'p3', 'p4'],
    pieces: vm.runInContext('createPieces(Object.values(globalThis.__players))', ctx),
    turnOrder: ['p1', 'p2', 'p3', 'p4'],
    currentTurnIndex: 0,
    activeUid: 'p1',
    ranking: [],
    forfeited: [],
    history: [],
    winner: null,
    lastMoveBy: null,
    tournament: {
      active: true,
      round: 1,
      originalPlayers: Object.values(players).map(p => ({ id: p.uid, name: p.name, color: p.color })),
      eliminationOrder: [],
      champion: null,
    },
  };
  ctx.__initialState = initialState;
  vm.runInContext('gameState = globalThis.__initialState;', ctx);

  let state = getState();
  assert(state.tournament.active, 'Le tournoi devrait être actif au départ.');
  assert(Object.keys(state.players).length === 4, '4 joueurs attendus au départ.');
  assert(state.pieces.length === 28, '28 pièces attendues au départ.');

  // --- Manche 1 : p4 éliminé ---
  eliminateAndCompleteRound(ctx, `{ uid: 'p4', name: 'David', color: 'black' }`);
  state = getState();

  assert(state.status === 'playing', `Une nouvelle manche aurait dû démarrer (status=${state.status}).`);
  assert(state.tournament.round === 2, `Manche 2 attendue, trouvé ${state.tournament.round}.`);
  assert(state.tournament.eliminationOrder.length === 1, 'Une élimination attendue.');
  assert(state.tournament.eliminationOrder[0].playerId === 'p4', 'p4 aurait dû être éliminé en premier.');
  assert(state.tournament.eliminationOrder[0].place === 4, `Place 4 attendue, trouvé ${state.tournament.eliminationOrder[0].place}.`);
  assert(!state.players.p4, 'p4 devrait être retiré de gameState.players.');
  assert(Object.keys(state.players).length === 3, '3 joueurs restants attendus.');
  assert(state.pieces.length === 28, 'Aucune pièce ne devrait être supprimée, seulement gelée.');
  const p4Pieces = state.pieces.filter(p => p.color === 'black');
  assert(p4Pieces.length === 7 && p4Pieces.every(p => p.isNeutral === true), 'Les 7 pions de p4 devraient être gelés.');
  // V54.1 : le plateau redémarre entièrement à chaque manche — p4 (éliminé) doit être
  // ramené à ses cases de départ, et les survivants doivent eux aussi y être remis.
  const blackStart = JSON.stringify([...vm.runInContext('INITIAL_POSITIONS.black', ctx)].sort());
  assert(JSON.stringify(p4Pieces.map(p => p.position).sort()) === blackStart, 'Les pions de p4 (éliminé) devraient être ramenés à leurs cases de départ (V54.1).');
  ['yellow', 'red', 'blue'].forEach(color => {
    const survivorPieces = state.pieces.filter(p => p.color === color);
    const expected = JSON.stringify([...vm.runInContext(`INITIAL_POSITIONS.${color}`, ctx)].sort());
    assert(JSON.stringify(survivorPieces.map(p => p.position).sort()) === expected, `Les pions du survivant (${color}) devraient être remis à leurs cases de départ (V54.1).`);
    assert(survivorPieces.every(p => !p.isNeutral), `Les pions du survivant (${color}) ne devraient pas être gelés.`);
  });
  console.log('OK (en ligne) : manche 1 → p4 éliminé (4e place), pions gelés, manche 2 démarrée à 3 joueurs.');

  // --- Manche 2 : p3 éliminé ---
  eliminateAndCompleteRound(ctx, `{ uid: 'p3', name: 'Chloé', color: 'blue' }`);
  state = getState();

  assert(state.tournament.round === 3, `Manche 3 attendue, trouvé ${state.tournament.round}.`);
  assert(state.tournament.eliminationOrder.length === 2, 'Deux éliminations attendues.');
  assert(state.tournament.eliminationOrder[1].place === 3, `Place 3 attendue, trouvé ${state.tournament.eliminationOrder[1].place}.`);
  assert(Object.keys(state.players).length === 2, '2 joueurs restants attendus.');
  console.log('OK (en ligne) : manche 2 → p3 éliminé (3e place), manche 3 (finale) démarrée à 2 joueurs.');

  // --- Manche 3 (finale) : p2 éliminé → p1 champion ---
  eliminateAndCompleteRound(ctx, `{ uid: 'p2', name: 'Bob', color: 'red' }`);
  state = getState();

  assert(state.tournament.champion, 'Un champion aurait dû être déclaré.');
  assert(state.tournament.champion.playerId === 'p1', `p1 aurait dû être champion, trouvé ${state.tournament.champion.playerId}.`);
  assert(state.tournament.eliminationOrder.length === 3, 'Trois éliminations attendues au total.');
  assert(state.tournament.eliminationOrder[2].place === 2, `Place 2 attendue, trouvé ${state.tournament.eliminationOrder[2].place}.`);
  assert(Object.keys(state.players).length === 1 && state.players.p1, 'Seul p1 devrait rester.');
  assert(state.status === 'finished', `La partie devrait être terminée (status=${state.status}).`);
  const frozenCount = state.pieces.filter(p => p.isNeutral).length;
  assert(frozenCount === 21, `21 pions gelés attendus, trouvé ${frozenCount}.`);
  console.log('OK (en ligne) : manche 3 (finale) → p2 éliminé (2e place), p1 couronné CHAMPION. 21 pions gelés.');
}

function partB_realWinningMoveTriggersElimination() {
  const { ctx } = loadOnlinePage();
  const getState = () => vm.runInContext('gameState', ctx);

  // Trouve dynamiquement, à partir des vraies tables du jeu (ADJACENCY/MOVES), un cluster
  // de 7 cellules mutuellement connectées et un coup légal permettant d'y entrer — pour
  // ne dépendre d'aucun nom de case codé en dur et rester robuste si le plateau change.
  const adjacency = vm.runInContext('ADJACENCY', ctx);
  const moves = vm.runInContext('MOVES', ctx);

  const start = Object.keys(adjacency)[0];
  const visited = new Set([start]);
  const queue = [start];
  while (queue.length && visited.size < 7) {
    const current = queue.shift();
    for (const neighbour of adjacency[current] || []) {
      if (!visited.has(neighbour)) {
        visited.add(neighbour);
        queue.push(neighbour);
        if (visited.size >= 7) break;
      }
    }
  }
  const cluster = [...visited];
  assert(cluster.length === 7, 'Impossible de construire un cluster de 7 cellules connectées (plateau inattendu).');

  let winningMove = null;
  for (const from of Object.keys(moves)) {
    if (cluster.includes(from)) continue;
    for (const to of moves[from] || []) {
      if (cluster.includes(to)) { winningMove = { from, to }; break; }
    }
    if (winningMove) break;
  }
  assert(winningMove, "Impossible de trouver un coup légal menant dans le cluster (plateau inattendu).");

  const [finalCell, ...restCluster] = cluster.filter(c => c !== winningMove.to).concat(winningMove.to);
  // Les 6 premières cellules du cluster (hors destination finale) reçoivent déjà les 6
  // premiers pions du joueur, face RECTO ; le 7e pion attend en dehors, face VERSO, prêt à
  // rejoindre le cluster via winningMove (le flip RECTO/VERSO à l'arrivée donnera RECTO,
  // identique aux 6 autres → victoire immédiate).
  const clusterMinusDestination = cluster.filter(c => c !== winningMove.to);

  const players = {
    p1: { uid: 'p1', name: 'Alice', color: 'yellow', seat: 0 },
    p2: { uid: 'p2', name: 'Bob', color: 'red', seat: 1 },
  };

  const pieces = [];
  clusterMinusDestination.forEach((cell, index) => {
    pieces.push({ id: `yellow-${index + 1}`, color: 'yellow', position: cell, face: 'RECTO', isNeutral: false });
  });
  pieces.push({ id: 'yellow-7', color: 'yellow', position: winningMove.from, face: 'VERSO', isNeutral: false });
  // Pions de l'adversaire : posés sur des cases neutres arbitraires, hors du cluster et hors
  // du chemin gagnant, pour ne pas interférer.
  const usedCells = new Set([...clusterMinusDestination, winningMove.from, winningMove.to]);
  const freeCells = Object.keys(adjacency).filter(c => !usedCells.has(c));
  for (let i = 0; i < 7; i++) {
    pieces.push({ id: `red-${i + 1}`, color: 'red', position: freeCells[i], face: 'RECTO', isNeutral: false });
  }

  ctx.__players = players;
  ctx.__pieces = pieces;
  const initialState = {
    status: 'playing',
    maxPlayers: 2,
    players,
    playerOrder: ['p1', 'p2'],
    pieces,
    turnOrder: ['p1', 'p2'],
    currentTurnIndex: 0,
    activeUid: 'p1',
    ranking: [],
    forfeited: [],
    history: [],
    winner: null,
    lastMoveBy: null,
    tournament: {
      active: true,
      round: 3,
      originalPlayers: [
        { id: 'p1', name: 'Alice', color: 'yellow' },
        { id: 'p2', name: 'Bob', color: 'red' },
      ],
      eliminationOrder: [
        { playerId: 'p3', playerName: 'Chloé', color: 'blue', round: 1, place: 4 },
        { playerId: 'p4', playerName: 'David', color: 'black', round: 2, place: 3 },
      ],
      champion: null,
    },
  };
  ctx.__initialState = initialState;
  ctx.__currentUser = { uid: 'p1' };
  vm.runInContext('gameState = globalThis.__initialState; currentUser = globalThis.__currentUser;', ctx);

  // Coup réel joué via la vraie fonction moveSelected() (sélection + validation de coup
  // incluses), exactement comme le ferait un vrai joueur.
  vm.runInContext(`selectedPieceId = 'yellow-7'; legalDestinations = legalMoves(gameState.pieces.find(p => p.id === 'yellow-7'));`, ctx);
  const legalDestinations = vm.runInContext('legalDestinations', ctx);
  assert(legalDestinations.includes(winningMove.to), `Le coup ${winningMove.from}→${winningMove.to} devrait être légal (destinations : ${legalDestinations}).`);

  vm.runInContext(`moveSelected(${JSON.stringify(winningMove.to)});`, ctx);

  const statusAfterMove = vm.runInContext('gameState.status', ctx);
  assert(statusAfterMove === 'round-paused', `Le coup gagnant devrait déclencher la pause de fin de manche (status=${statusAfterMove}).`);
  const overlayHidden = vm.runInContext(`document.getElementById('roundPauseOverlay').hidden`, ctx);
  assert(overlayHidden === false, 'Le pop-up de pause entre manches devrait être visible après le coup gagnant.');

  // Simule l'écoulement des 5 secondes (ROUND_PAUSE_MS) au lieu d'attendre pour de vrai,
  // en appelant directement la vraie fonction de transition.
  vm.runInContext('completeTournamentRoundTransition(); hideRoundPauseOverlay();', ctx);
  const state = getState();

  assert(state.ranking.length === 2, `Le classement de la manche devrait être complet (2 entrées), trouvé ${state.ranking.length}.`);
  assert(state.ranking[0].playerId === 'p1', 'p1 aurait dû gagner la manche (1er).');
  assert(state.ranking[1].playerId === 'p2' && state.ranking[1].lastRemaining, 'p2 aurait dû être classé dernier (lastRemaining).');

  assert(state.tournament.champion, "Un coup gagnant réel aurait dû déclencher l'élimination automatique et couronner un champion.");
  assert(state.tournament.champion.playerId === 'p1', `p1 aurait dû être couronné champion, trouvé ${JSON.stringify(state.tournament.champion)}.`);
  assert(state.tournament.eliminationOrder.length === 3, "L'élimination de p2 aurait dû s'ajouter automatiquement à l'historique du tournoi.");
  assert(state.tournament.eliminationOrder[2].playerId === 'p2', 'p2 devrait être la 3e élimination enregistrée.');

  const p2Pieces = state.pieces.filter(p => p.color === 'red');
  assert(p2Pieces.every(p => p.isNeutral === true), 'Les pions de p2 (perdant) devraient être gelés automatiquement.');

  console.log(`OK (en ligne) : un vrai coup gagnant (${winningMove.from} → ${winningMove.to}) a déclenché automatiquement l'élimination de p2 et le couronnement de p1 — aucune intervention manuelle nécessaire.`);
}

function main() {
  partA_eliminationMechanic();
  partB_realWinningMoveTriggersElimination();
  console.log('\nOK MODE TOURNOI (en ligne) : mécanisme d\'élimination et branchement sur un vrai coup gagnant vérifiés de bout en bout.');
  process.exit(0);
}

main();
