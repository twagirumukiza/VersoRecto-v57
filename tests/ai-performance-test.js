// Test de non-régression PERFORMANCE du moteur IA — V55.
//
// Contexte : découvert en diagnostiquant un bug rapporté par l'utilisateur ("l'IA se bloque
// et répète des coups inutiles"). Le vrai problème n'était pas algorithmique : une seule
// décision chooseAIMove() pouvait prendre plus de 90 secondes (mesuré : 95 038 ms sur la
// position de départ), alors que le budget réel accordé par requestAIMove() est de
// AI_WORKER_DEADLINE_MS = 10 500 ms. Résultat : en jeu, le budget expirait systématiquement
// AVANT que le Worker ne réponde, et la partie retombait silencieusement sur quickAIMove
// (repli à 1 coup, sans minimax ni anticipation) pour la quasi-totalité des coups joués —
// ce qui, vu du joueur, ressemble exactement à une IA qui "ne trouve pas" une victoire à
// 2-3 coups et erre sans but.
//
// Cause : closestWinningPatternForPlayer() parcourt les 2 908 motifs gagnants à CHAQUE appel
// (~70 ms mesurés) et est invoquée des dizaines de fois par coup candidat évalué, souvent sur
// un plateau strictement identique à un appel précédent dans la même décision. Correctifs :
//   1. PATTERN_CACHE : mémoïse closestWinningPatternForPlayer par (couleur + signature du
//      plateau), réinitialisé à chaque nouvelle décision.
//   2. tacticalMovePool() calculait staticMoveScore() deux fois par coup (une fois pour son
//      propre tri, une deuxième fois via orderMovesForSearch) — fusionné en un seul calcul.
//   3. Garde-fous temporels dans openingMovePool()/tacticalMovePool() : si le budget est déjà
//      épuisé, on saute le tri coûteux plutôt que de risquer un dépassement.
//
// Ce test vérifie qu'une décision complète (position de départ, profil de recherche "normal"
// en duel, donc le cas le plus coûteux en pré-calcul puisque rien n'est encore assemblé) reste
// sous un plafond raisonnable — largement inférieur aux ~95 s mesurées avant correctif.

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
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const gameSource = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');

  const dom = new JSDOM(html, { url: 'https://example.invalid/index.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.pause = () => {};
  window.HTMLMediaElement.prototype.load = () => {};

  const ctx = dom.getInternalVMContext();
  vm.runInContext(gameSource, ctx, { filename: 'game.js' });

  const document = window.document;
  document.getElementById('gameMode').value = 'mixed';
  document.getElementById('gameMode').dispatchEvent(new window.Event('change'));
  document.getElementById('playerCount').value = '2';
  document.getElementById('playerCount').dispatchEvent(new window.Event('change'));
  // Le formulaire exige au moins un humain pour démarrer -> on force ensuite les deux
  // joueurs en IA directement dans l'état (scénario réel : fin de tournoi entre 2 IA).
  document.getElementById('playerType0').value = 'human';
  document.getElementById('playerType0').dispatchEvent(new window.Event('change'));
  document.getElementById('playerType1').value = 'ai';
  document.getElementById('playerType1').dispatchEvent(new window.Event('change'));
  document.getElementById('startGame').click();
  vm.runInContext('state.players.forEach(p => { p.isAI = true; });', ctx);

  const state = vm.runInContext('state', ctx);
  assert(state.status === 'PLAYING', `La partie aurait dû démarrer (status=${state.status}).`);

  // Extrait AI_WORKER_CODE tel quel (source exacte utilisée par le vrai Worker en prod).
  const startMarker = 'const AI_WORKER_CODE = "';
  const startIdx = gameSource.indexOf(startMarker) + startMarker.length - 1;
  let i = startIdx + 1, s = '';
  while (true) {
    const c = gameSource[i];
    if (c === '\\') { s += c + gameSource[i + 1]; i += 2; continue; }
    if (c === '"') break;
    s += c; i++;
  }
  const workerCode = JSON.parse('"' + s + '"');
  assert(workerCode.includes('PATTERN_CACHE'), 'Le correctif de cache (PATTERN_CACHE) devrait être présent dans AI_WORKER_CODE.');

  const wctx = vm.createContext({ self: {}, Date, Math, console });
  vm.runInContext(workerCode, wctx, { filename: 'worker.js' });

  const aiPlayer = state.players.find(p => p.isAI) || state.players[0];
  const maxDecisionMs = vm.runInContext('AI_MAX_TURN_MS', ctx);

  const config = {
    maxBackAndForthStreak: vm.runInContext('MAX_BACK_AND_FORTH_STREAK', ctx),
    depthTwoPlayers: vm.runInContext('AI_SEARCH_DEPTH_2_PLAYERS', ctx),
    depthMulti: vm.runInContext('AI_SEARCH_DEPTH_MULTI', ctx),
    candidateLimitTwoPlayers: vm.runInContext('AI_CANDIDATE_LIMIT_2_PLAYERS', ctx),
    candidateLimitMulti: vm.runInContext('AI_CANDIDATE_LIMIT_MULTI', ctx),
    tacticalDepthTwoPlayers: 7, tacticalCandidateLimitTwoPlayers: 18,
    criticalDepthTwoPlayers: 9, criticalCandidateLimitTwoPlayers: 26,
    tacticalDepthMulti: 4, tacticalCandidateLimitMulti: 11,
    criticalDepthMulti: 5, criticalCandidateLimitMulti: 16,
    winScore: vm.runInContext('AI_WIN_SCORE', ctx),
    weights: vm.runInContext('AI_CONSTRUCTION_WEIGHTS', ctx),
    stagnation: vm.runInContext('AI_STAGNATION_CONFIG', ctx),
    rankedCount: 0,
    postWinnerDepth: vm.runInContext('AI_STAGNATION_CONFIG', ctx).postWinnerDepth,
    postWinnerCandidateLimit: vm.runInContext('AI_STAGNATION_CONFIG', ctx).postWinnerCandidateLimit,
    maxDecisionMs,
    quiescenceDepth: 1,
    winningConfigurationCount: vm.runInContext('WINNING_CONFIGURATION_COUNT', ctx),
    openingDistinctPieces: vm.runInContext('AI_OPENING_DISTINCT_PIECES', ctx),
    zoneWeights: vm.runInContext('AI_ZONE_WEIGHTS', ctx),
    winningPatterns: vm.runInContext('WINNING_PATTERNS', ctx),
  };

  const script = `
    state = ${JSON.stringify(state)};
    PLAYER_ID = ${JSON.stringify(aiPlayer.id)};
    SYMMETRIC_MOVES = ${JSON.stringify(vm.runInContext('SYMMETRIC_MOVES', ctx))};
    SIDE_ADJACENCY_MAP = ${JSON.stringify(vm.runInContext('SIDE_ADJACENCY_MAP', ctx))};
    CELL_CENTROIDS = ${JSON.stringify(vm.runInContext('CELL_CENTROIDS', ctx))};
    CONFIG = ${JSON.stringify(config)};
    MEMORY_PRIORS = {};
    SEARCH_DEADLINE = Date.now() + ${maxDecisionMs};
    SEARCH_NODES = 0;
    SEARCH_REACHED_DEPTH = 0;
    PATTERN_CACHE = new Map();
    var __t0 = Date.now();
    var __choice = chooseAIMove(state.players.find(p => p.id === PLAYER_ID));
    ({ choice: __choice, elapsed: Date.now() - __t0, nodes: SEARCH_NODES, depth: SEARCH_REACHED_DEPTH });
  `;
  const result = vm.runInContext(script, wctx, { filename: 'decision.js' });

  console.log(`Décision IA (position de départ, duel, profil normal) : ${result.elapsed} ms | ${result.nodes} nœuds | profondeur ${result.depth} | coup ${result.choice?.piece?.id} -> ${result.choice?.to}`);

  assert(result.choice, "chooseAIMove() devrait retourner un coup valide.");

  // Plafond de non-régression : très généreux (3x le budget réel) pour absorber la variance
  // d'une machine à l'autre, mais qui aurait immédiatement échoué avant le correctif V55
  // (95 038 ms mesurés, soit ~9x ce plafond).
  const REGRESSION_CEILING_MS = maxDecisionMs * 3;
  assert(
    result.elapsed < REGRESSION_CEILING_MS,
    `Régression de performance IA : décision en ${result.elapsed} ms, plafond ${REGRESSION_CEILING_MS} ms ` +
    `(budget réel ${maxDecisionMs} ms). Voir PATTERN_CACHE dans closestWinningPatternForPlayer().`
  );
  assert(result.nodes > 0, "La recherche minimax devrait explorer au moins quelques nœuds (pas un blocage total avant même le premier coup).");

  console.log('\nOK PERFORMANCE IA : décision réelle mesurée sous le plafond de non-régression, cache de motifs actif.');
}

main();
process.exit(0);
