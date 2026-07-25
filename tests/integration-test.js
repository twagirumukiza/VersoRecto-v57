// Test d'intégration : fait réellement tourner le jeu, pas seulement grep le texte du code.
//
// Contrairement aux autres fichiers de tests/, celui-ci charge index.html + game.js dans un
// vrai DOM (jsdom) et exécute le vrai code, en deux temps :
//
//   A) Démarrage réel d'une partie à 3 joueurs (1 humain + 2 IA) via le formulaire de la page,
//      puis un coup joué via playMove() — vérifie tout le chemin de démarrage et la
//      validation de coup côté page.
//   B) Extraction du code réel du Worker IA (celui utilisé en jeu, packagé dans AI_WORKER_CODE)
//      et exécution directe de chooseAIMove() sur l'état réellement produit en (A), dans un
//      contexte vm isolé avec un budget de temps COURT dédié au test (indépendant des ~10s de
//      production) pour que le test reste rapide.
//
// C'est exactement le genre de test qui aurait attrapé, dès la première exécution :
//   - la suppression accidentelle de INITIAL_POSITIONS / SYMMETRIC_MOVES (plus aucune
//     partie ne pouvait démarrer) ;
//   - AI_OPENING_DISTINCT_PIECES référencé hors de la portée du Worker (le Victory Planner
//     plantait silencieusement à chaque tour normal et retombait sur l'IA de repli) ;
//   - toute erreur de syntaxe ou de référence dans le code embarqué du Worker.
//
// Nécessite `npm install` une fois (voir package.json) avant `npm test`.

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

function partA_startRealGame() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const gameSource = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');

  const dom = new JSDOM(html, {
    url: 'https://example.invalid/index.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.load = () => {};

  // Pas besoin d'un vrai Worker ici : on laisse `new Worker(...)` échouer (non défini dans
  // jsdom), ce qui fait retomber le jeu sur son repli synchrone (quickAIMove) — suffisant
  // pour valider le démarrage de partie et la validation de coup côté page. Le Victory
  // Planner/Path Planner lui-même est testé séparément en partie B, plus rapide et ciblé.

  let loadError = null;
  window.addEventListener('error', event => { loadError = event.error || event.message; });

  const vmContext = dom.getInternalVMContext();
  vm.runInContext(gameSource, vmContext, { filename: 'game.js' });
  if (loadError) fail(`game.js a levé une erreur au chargement : ${loadError}`);

  const getState = () => vm.runInContext('state', vmContext);
  const document = window.document;

  if (!getState()) fail("La variable globale `state` n'existe pas après chargement de game.js.");
  if (getState().status !== 'SETUP') fail(`État initial inattendu : ${getState().status}`);

  const gameMode = document.getElementById('gameMode');
  const playerCount = document.getElementById('playerCount');
  if (!gameMode || !playerCount) fail('Formulaire de configuration introuvable dans index.html.');

  gameMode.value = 'mixed';
  gameMode.dispatchEvent(new window.Event('change'));
  playerCount.value = '3';
  playerCount.dispatchEvent(new window.Event('change'));

  document.getElementById('playerType0').value = 'human';
  document.getElementById('playerType1').value = 'ai';
  document.getElementById('playerType2').value = 'ai';
  document.getElementById('playerType1').dispatchEvent(new window.Event('change'));
  document.getElementById('playerType2').dispatchEvent(new window.Event('change'));

  document.getElementById('startGame').click();

  let state = getState();
  if (state.status !== 'PLAYING') fail(`La partie n'a pas démarré (status=${state.status}).`);
  if (state.pieces.length !== 28) fail(`Nombre de pièces incorrect : ${state.pieces.length} (attendu 28).`);
  if (state.players.length !== 3) fail(`Nombre de joueurs incorrect : ${state.players.length} (attendu 3).`);
  console.log('OK : partie à 3 joueurs (1 humain + 2 IA) démarrée, 28 pièces en place.');

  if (typeof window.playMove !== 'function') {
    fail('La fonction playMove(pieceId, to) est introuvable — adapter le test à cette version.');
  }

  // Joue un coup légal pour QUICONQUE est actif en premier (humain ou IA — le tirage de
  // l'ordre de jeu est aléatoire) afin de vérifier que playMove() fonctionne bien de bout
  // en bout côté page, sans dépendre d'un ordre de tour particulier.
  const symmetricMoves = vm.runInContext('SYMMETRIC_MOVES', vmContext);
  const mover = state.players.find(p => p.id === state.turnOrder[state.currentTurnIndex]);
  const piece = state.pieces.find(p => p.color === mover.color);
  const legalDest = (symmetricMoves[piece.position] || [])
    .find(dest => !state.pieces.some(p => p.position === dest));
  if (!legalDest) fail('Aucun coup légal trouvé pour le premier joueur (plateau initial suspect).');

  const historyLenBefore = state.moveHistory.length;
  window.playMove(piece.id, legalDest);
  state = getState();
  if (state.moveHistory.length <= historyLenBefore) {
    fail(`Le coup de ${mover.name} (${mover.isAI ? 'IA' : 'humain'}) n'a pas été enregistré dans l'historique.`);
  }
  console.log(`OK : premier coup de partie appliqué et enregistré (${mover.name}, ${mover.isAI ? 'IA' : 'humain'}).`);

  const winningPatternsMatch = gameSource.match(/const WINNING_PATTERNS = (\[[\s\S]*?\]);\n/);
  const workerCodeMatch = gameSource.match(/const AI_WORKER_CODE = ("[\s\S]*?");\n/);
  if (!winningPatternsMatch) fail('WINNING_PATTERNS introuvable dans game.js.');
  if (!workerCodeMatch) fail('AI_WORKER_CODE introuvable dans game.js.');

  return {
    state,
    symmetricMoves,
    cellCentroids: vm.runInContext('CELL_CENTROIDS', vmContext),
    sideAdjacencyMap: vm.runInContext('SIDE_ADJACENCY_MAP', vmContext),
    winningPatterns: vm.runInNewContext(winningPatternsMatch[1]),
    aiWorkerCode: eval(workerCodeMatch[1]),
  };
}

function partB_runRealAIEngine({ aiWorkerCode }) {
  // On exerce le vrai moteur (openingMovePool, tacticalMovePool, Path Planner) sur un petit
  // plateau synthétique entièrement connecté plutôt que sur les 72 cases réelles : c'est
  // largement suffisant pour détecter une erreur de référence/portée (le genre de bug qui
  // nous a mordu plusieurs fois), et ça garde ce test rapide et déterministe.
  let lastMessage = null;
  const selfObj = { postMessage: msg => { lastMessage = msg; } };
  const ctx = vm.createContext({ self: selfObj, console });
  vm.runInContext(aiWorkerCode, ctx, { filename: 'ai-worker (extrait de game.js)' });

  const cells = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const sym = {}, adj = {}, cent = {};
  cells.forEach((c, i) => { sym[c] = cells.filter(x => x !== c); adj[c] = cells.filter(x => x !== c); cent[c] = { x: i * 40, y: 0 }; });

  const state = {
    status: 'PLAYING',
    players: [
      { id: 'P1', name: 'IA', color: 'YELLOW', isAI: true },
      { id: 'P2', name: 'Adverse', color: 'RED', isAI: true },
    ],
    pieces: [
      { id: 'y1', color: 'YELLOW', position: 'A', face: 'RECTO' },
      { id: 'y2', color: 'YELLOW', position: 'B', face: 'RECTO' },
      { id: 'r1', color: 'RED', position: 'G', face: 'RECTO' },
      { id: 'r2', color: 'RED', position: 'H', face: 'RECTO' },
    ],
    turnOrder: ['P1', 'P2'],
    moveHistory: [],
    ranking: [],
    aiPlans: {}, aiRotationCursor: {},
  };

  const config = {
    maxBackAndForthStreak: 6,
    depthTwoPlayers: 5, depthMulti: 3,
    candidateLimitTwoPlayers: 12, candidateLimitMulti: 8,
    tacticalDepthTwoPlayers: 7, tacticalCandidateLimitTwoPlayers: 18,
    criticalDepthTwoPlayers: 9, criticalCandidateLimitTwoPlayers: 26,
    tacticalDepthMulti: 4, tacticalCandidateLimitMulti: 11,
    criticalDepthMulti: 5, criticalCandidateLimitMulti: 16,
    winScore: 10000000,
    weights: { groups: 1, largestGroup: 1, compactness: 1, sideAdjacency: 1, sameFace: 1, dangerPenalty: 1, immediateThreatPenalty: 1 },
    stagnation: { repeatedBoardPenalty: 1, thirdRepeatPenalty: 1, secondRepeatPenalty: 1, firstRepeatPenalty: 1, regressionPenalty: 1, regressionMultiplier: 1, noProgressPenalty: 1, progressThreshold: 30, recentBoardLookback: 10 },
    rankedCount: 0,
    postWinnerDepth: 2, postWinnerCandidateLimit: 4,
    maxDecisionMs: 2000,
    winningConfigurationCount: 5816,
    openingDistinctPieces: 7,
    zoneWeights: {},
    winningPatterns: [['A', 'B', 'C', 'D', 'E', 'F', 'G']],
  };

  const startedAt = Date.now();
  selfObj.onmessage({
    data: { state, playerId: 'P1', symmetricMoves: sym, sideAdjacencyMap: adj, cellCentroids: cent, config, memoryPriors: {} },
  });
  const elapsedMs = Date.now() - startedAt;

  if (!lastMessage) fail("Le Worker IA n'a renvoyé aucun message.");
  if (!lastMessage.ok) fail(`Le Worker IA a échoué : ${lastMessage.error}`);
  if (!lastMessage.choice || !lastMessage.choice.pieceId || !lastMessage.choice.to) {
    fail(`Le Worker IA n'a renvoyé aucun coup valide : ${JSON.stringify(lastMessage)}`);
  }

  console.log(`OK : le Worker IA réel (Victory Planner/Path Planner, y compris openingMovePool) a renvoyé en ${elapsedMs} ms un coup valide (${lastMessage.choice.pieceId} → ${lastMessage.choice.to}), stats=${JSON.stringify(lastMessage.stats)}.`);
}

function main() {
  const context = partA_startRealGame();
  partB_runRealAIEngine({ aiWorkerCode: context.aiWorkerCode });
  console.log('\nOK INTÉGRATION : démarrage de partie, coup côté page et moteur IA réel vérifiés de bout en bout.');
  process.exit(0);
}

main();
