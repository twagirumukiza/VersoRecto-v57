// Test fonctionnel du MODE TOURNOI (local) — V54.
//
// Plutôt que de faire jouer une partie complète coup par coup (lent : chaque coup IA sous
// jsdom prend ~1,3 s via le repli quickAIMove), ce test :
//   1) démarre un vrai tournoi à 4 joueurs via le formulaire réel de la page (valide tout
//      le câblage startGame()/renderPlayerInputs() pour le mode "tournament") ;
//   2) simule la fin de chaque manche en fabriquant un classement (state.ranking) et en
//      appelant la vraie fonction finishGame() — c'est elle qui déclenche
//      advanceTournamentAfterRound(), le cœur de la logique de tournoi, réellement exécuté
//      ici, pas seulement relu.
//
// Les 4 joueurs sont des HUMAINS (pas des IA) pour ce test : cela évite tout déclenchement
// de maybePlayAI()/timers asynchrones pendant qu'on fabrique manuellement les classements,
// et ce n'est pas un problème puisque ce test cible la mécanique de tournoi elle-même
// (élimination, gel des pions, transition de manche), pas la qualité de décision de l'IA
// (déjà couverte par tests/integration-test.js et le moteur lui-même).

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

  const dom = new JSDOM(html, {
    url: 'https://example.invalid/index.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.HTMLMediaElement.prototype.play = () => Promise.resolve();
  window.HTMLMediaElement.prototype.load = () => {};

  let loadError = null;
  window.addEventListener('error', event => { loadError = event.error || event.message; });

  const ctx = dom.getInternalVMContext();
  vm.runInContext(gameSource, ctx, { filename: 'game.js' });
  if (loadError) fail(`game.js a levé une erreur au chargement : ${loadError}`);

  const document = window.document;
  const getState = () => vm.runInContext('state', ctx);

  // --- 1) Démarrage réel d'un tournoi à 4 joueurs, tous humains ---
  document.getElementById('gameMode').value = 'tournament';
  document.getElementById('gameMode').dispatchEvent(new window.Event('change'));

  const afterModeChange = getState();
  assert(afterModeChange.status === 'SETUP', 'Le changement de mode ne devrait pas démarrer de partie.');
  assert(document.getElementById('playerCount').value === '4', "Le mode tournoi devrait forcer playerCount à 4.");
  assert(document.getElementById('playerCount').disabled === true, "Le sélecteur de nombre de joueurs devrait être verrouillé en mode tournoi.");

  for (let i = 0; i < 4; i++) {
    const typeInput = document.getElementById(`playerType${i}`);
    assert(typeInput, `playerType${i} devrait exister en mode tournoi (UI façon mode mixte).`);
    typeInput.value = 'human';
  }

  document.getElementById('startGame').click();

  let state = getState();
  assert(state.status === 'PLAYING', `La partie aurait dû démarrer (status=${state.status}).`);
  assert(state.players.length === 4, `4 joueurs attendus au départ, trouvé ${state.players.length}.`);
  assert(state.pieces.length === 28, `28 pièces attendues, trouvé ${state.pieces.length}.`);
  assert(state.tournament && state.tournament.active, "state.tournament devrait être actif après le démarrage.");
  assert(state.tournament.round === 1, `Manche 1 attendue, trouvé ${state.tournament.round}.`);
  assert(state.tournament.originalPlayers.length === 4, "originalPlayers devrait conserver les 4 joueurs de départ.");
  assert(state.tournament.eliminationOrder.length === 0, "Aucune élimination ne devrait exister au départ.");
  console.log('OK : tournoi à 4 joueurs (humains) démarré correctement, state.tournament initialisé.');

  const [p1, p2, p3, p4] = state.players;

  // Petit utilitaire : fabrique un classement de manche (ordre du meilleur au pire) et
  // appelle la VRAIE fonction finishGame(), qui déclenche à son tour
  // advanceTournamentAfterRound() — le code réellement exécuté en production.
  function simulateRoundEnd(orderedPlayerIds) {
    const ranking = orderedPlayerIds.map((playerId, index) => {
      const player = getState().players.find(p => p.id === playerId);
      return {
        playerId,
        playerName: player.name,
        color: player.color,
        finishedAtMove: index + 1,
        medal: null,
      };
    });
    vm.runInContext(`state.ranking = ${JSON.stringify(ranking)};`, ctx);
    vm.runInContext(`finishGame(${JSON.stringify('Fin de manche simulée')});`, ctx);

    // V54.2 : finishGame() n'appelle plus advanceTournamentAfterRound() immédiatement —
    // elle affiche d'abord le pop-up "Xe manche terminée" pendant 5s (ROUND_PAUSE_MS).
    // On vérifie ce pop-up puis on fait avancer le temps réel (le test reste réaliste :
    // c'est le vrai setTimeout programmé par finishGame() qui se déclenche ici, pas un
    // appel manuel à advanceTournamentAfterRound()).
    const overlayHiddenDuringPause = vm.runInContext(`document.getElementById('roundPauseOverlay').hidden`, ctx);
    assert(overlayHiddenDuringPause === false, "Le pop-up de pause entre manches devrait être visible juste après finishGame().");
    const overlayText = vm.runInContext(`document.getElementById('roundPauseText').textContent`, ctx);
    assert(/manche terminée/i.test(overlayText), `Le pop-up devrait annoncer une manche terminée, trouvé "${overlayText}".`);

    vm.runInContext(`
      if (typeof roundPauseTimeout !== "undefined" && roundPauseTimeout) {
        clearTimeout(roundPauseTimeout);
        roundPauseTimeout = null;
      }
      hideRoundPauseOverlay();
      advanceTournamentAfterRound();
    `, ctx);

    const overlayHiddenAfterPause = vm.runInContext(`document.getElementById('roundPauseOverlay').hidden`, ctx);
    assert(overlayHiddenAfterPause === true, "Le pop-up de pause entre manches devrait être masqué une fois la manche suivante lancée.");
  }

  // --- ROUND 1 : 4 joueurs, p4 termine dernier → éliminé ---
  simulateRoundEnd([p1.id, p2.id, p3.id, p4.id]);
  state = getState();

  assert(state.status === 'PLAYING', `Une nouvelle manche aurait dû démarrer automatiquement (status=${state.status}).`);
  assert(state.tournament.round === 2, `Manche 2 attendue, trouvé ${state.tournament.round}.`);
  assert(state.tournament.eliminationOrder.length === 1, "Une élimination attendue après la manche 1.");
  assert(state.tournament.eliminationOrder[0].playerId === p4.id, "p4 (dernier classé) aurait dû être éliminé en premier.");
  assert(state.tournament.eliminationOrder[0].place === 4, `Place 4 attendue pour la 1re élimination, trouvé ${state.tournament.eliminationOrder[0].place}.`);
  assert(!state.players.some(p => p.id === p4.id), "p4 devrait être retiré de state.players après élimination.");
  assert(state.players.length === 3, `3 joueurs restants attendus, trouvé ${state.players.length}.`);
  assert(state.pieces.length === 28, "Aucune pièce ne devrait être supprimée du plateau, seulement gelée.");
  const p4Pieces = state.pieces.filter(p => p.color === p4.color);
  assert(p4Pieces.length === 7 && p4Pieces.every(p => p.isNeutral === true), "Les 7 pions de p4 devraient être gelés (isNeutral=true) à leur position d'élimination.");
  // V54.1 : le plateau redémarre entièrement à chaque manche — p4 (éliminé) doit être
  // ramené à ses cases de départ (pas laissé là où il s'est arrêté), et les survivants
  // doivent eux aussi être remis à leurs cases de départ.
  const p4StartPositions = vm.runInContext(`JSON.stringify([...INITIAL_POSITIONS[${JSON.stringify(p4.color)}]].sort())`, ctx);
  const p4ActualPositions = JSON.stringify(p4Pieces.map(p => p.position).sort());
  assert(p4ActualPositions === p4StartPositions, `Les pions de p4 (éliminé) devraient être ramenés à leurs cases de départ (V54.1). Attendu ${p4StartPositions}, trouvé ${p4ActualPositions}.`);
  [p1, p2, p3].forEach(survivor => {
    const survivorPieces = state.pieces.filter(p => p.color === survivor.color);
    const expected = vm.runInContext(`JSON.stringify([...INITIAL_POSITIONS[${JSON.stringify(survivor.color)}]].sort())`, ctx);
    const actual = JSON.stringify(survivorPieces.map(p => p.position).sort());
    assert(actual === expected, `Les pions du survivant ${survivor.name} devraient être remis à leurs cases de départ à la nouvelle manche (V54.1). Attendu ${expected}, trouvé ${actual}.`);
    assert(survivorPieces.every(p => !p.isNeutral), `Les pions du survivant ${survivor.name} ne devraient pas être gelés.`);
  });
  assert(state.ranking.length === 0, "Le classement devrait être réinitialisé pour la nouvelle manche.");
  assert(state.turnOrder.length === 3 && !state.turnOrder.includes(p4.id), "L'ordre de jeu de la nouvelle manche ne devrait plus inclure p4.");
  console.log('OK : manche 1 terminée → p4 éliminé (4e place), pions gelés, manche 2 démarrée avec 3 joueurs.');

  // --- ROUND 2 : 3 joueurs, p3 termine dernier → éliminé ---
  simulateRoundEnd([p1.id, p2.id, p3.id]);
  state = getState();

  assert(state.status === 'PLAYING', `Une 3e manche aurait dû démarrer automatiquement (status=${state.status}).`);
  assert(state.tournament.round === 3, `Manche 3 attendue, trouvé ${state.tournament.round}.`);
  assert(state.tournament.eliminationOrder.length === 2, "Deux éliminations attendues après la manche 2.");
  assert(state.tournament.eliminationOrder[1].playerId === p3.id, "p3 aurait dû être éliminé en 2e.");
  assert(state.tournament.eliminationOrder[1].place === 3, `Place 3 attendue pour la 2e élimination, trouvé ${state.tournament.eliminationOrder[1].place}.`);
  assert(state.players.length === 2, `2 joueurs restants attendus, trouvé ${state.players.length}.`);
  const p3Pieces = state.pieces.filter(p => p.color === p3.color);
  assert(p3Pieces.every(p => p.isNeutral === true), "Les pions de p3 devraient être gelés.");
  console.log('OK : manche 2 terminée → p3 éliminé (3e place), manche 3 (finale) démarrée avec 2 joueurs.');

  // --- ROUND 3 (finale) : 2 joueurs, p2 termine dernier → éliminé → p1 = CHAMPION ---
  simulateRoundEnd([p1.id, p2.id]);
  state = getState();

  assert(state.tournament.champion, "Un champion aurait dû être déclaré à l'issue de la finale.");
  assert(state.tournament.champion.playerId === p1.id, `p1 aurait dû être champion, trouvé ${state.tournament.champion.playerId}.`);
  assert(state.tournament.eliminationOrder.length === 3, "Trois éliminations attendues au total (tous sauf le champion).");
  assert(state.tournament.eliminationOrder[2].playerId === p2.id, "p2 aurait dû être éliminé en dernier (finale).");
  assert(state.tournament.eliminationOrder[2].place === 2, `Place 2 attendue pour la 3e élimination, trouvé ${state.tournament.eliminationOrder[2].place}.`);
  assert(state.players.length === 1 && state.players[0].id === p1.id, "Seul p1 (le champion) devrait rester dans state.players.");
  assert(state.pieces.length === 28, "Toujours 28 pièces sur le plateau : rien n'est jamais supprimé, seulement gelé.");

  const frozenCount = state.pieces.filter(p => p.isNeutral).length;
  assert(frozenCount === 21, `21 pions gelés attendus (3 éliminés × 7), trouvé ${frozenCount}.`);
  const championPieces = state.pieces.filter(p => p.color === p1.color);
  assert(championPieces.every(p => !p.isNeutral), "Les pions du champion ne devraient jamais être gelés.");
  console.log('OK : manche 3 (finale) terminée → p2 éliminé (2e place), p1 couronné CHAMPION. 21 pions gelés, 7 pions du champion actifs.');

  console.log('\nOK MODE TOURNOI (local) : démarrage, 3 manches consécutives, gel des pions et couronnement du champion vérifiés de bout en bout.');
  process.exit(0);
}

main();
