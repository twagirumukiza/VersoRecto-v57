// Vérifie que rafraîchir la page NE remet PAS la partie locale à zéro (V53.2).
//
// Simule un vrai rafraîchissement en créant deux instances jsdom séparées (comme deux
// chargements de page distincts) qui partagent le même contenu de localStorage — exactement
// ce qui se passe dans un vrai navigateur entre deux chargements de la même page.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

function fail(message) {
  console.error('ÉCHEC:', message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function loadGameInFreshWindow(localStorageSnapshot) {
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

  // Reproduit le contenu de localStorage d'une "session" précédente, comme le ferait un
  // vrai navigateur qui recharge la même page (le stockage local survit, contrairement à
  // l'état JS en mémoire).
  for (const [key, value] of Object.entries(localStorageSnapshot || {})) {
    window.localStorage.setItem(key, value);
  }

  let loadError = null;
  window.addEventListener('error', event => { loadError = event.error || event.message; });

  const ctx = dom.getInternalVMContext();
  vm.runInContext(gameSource, ctx, { filename: 'game.js' });
  if (loadError) fail(`game.js a levé une erreur au chargement : ${loadError}`);

  return {
    window,
    document: window.document,
    getState: () => vm.runInContext('state', ctx),
    getSymmetricMoves: () => vm.runInContext('SYMMETRIC_MOVES', ctx),
  };
}

function main() {
  // --- "Session 1" : on démarre une partie et on joue un coup ---
  const session1 = loadGameInFreshWindow({});
  const { document: doc1, window: win1 } = session1;

  doc1.getElementById('gameMode').value = 'local';
  doc1.getElementById('gameMode').dispatchEvent(new win1.Event('change'));
  doc1.getElementById('playerCount').value = '2';
  doc1.getElementById('playerCount').dispatchEvent(new win1.Event('change'));
  doc1.getElementById('startGame').click();

  let state1 = session1.getState();
  assert(state1.status === 'PLAYING', `La partie (session 1) n'a pas démarré (status=${state1.status}).`);

  const mover = state1.players.find(p => p.id === state1.turnOrder[state1.currentTurnIndex]);
  const piece = state1.pieces.find(p => p.color === mover.color);
  const dest = (session1.getSymmetricMoves()[piece.position] || [])
    .find(d => !state1.pieces.some(p => p.position === d));
  assert(dest, 'Aucun coup légal trouvé pour amorcer le test.');

  session1.window.playMove(piece.id, dest);
  state1 = session1.getState();
  assert(state1.moveHistory.length === 1, `Le coup de test n'a pas été enregistré (historique=${state1.moveHistory.length}).`);
  console.log(`OK : partie locale démarrée et un coup joué (session 1) — ${piece.id} → ${dest}.`);

  // Capture le contenu de localStorage tel qu'il serait sur disque entre deux chargements.
  const storageSnapshot = {};
  for (let i = 0; i < session1.window.localStorage.length; i++) {
    const key = session1.window.localStorage.key(i);
    storageSnapshot[key] = session1.window.localStorage.getItem(key);
  }
  assert(storageSnapshot.versoRectoV53Save, "La partie n'a pas été sauvegardée dans localStorage après le coup.");

  // --- "Session 2" : nouvelle page chargée, le localStorage a survécu (simule F5) ---
  const session2 = loadGameInFreshWindow(storageSnapshot);
  const state2 = session2.getState();

  assert(state2.status === 'PLAYING', `La partie n'a pas été restaurée après rechargement (status=${state2.status}).`);
  assert(state2.pieces.length === state1.pieces.length, 'Le nombre de pièces diffère après rechargement.');
  assert(state2.moveHistory.length === state1.moveHistory.length, "L'historique des coups n'a pas survécu au rechargement.");
  const restoredPiece = state2.pieces.find(p => p.id === piece.id);
  assert(restoredPiece && restoredPiece.position === dest, `La position du pion déplacé n'a pas survécu au rechargement (position=${restoredPiece && restoredPiece.position}, attendu ${dest}).`);
  console.log('OK : après un rechargement simulé (F5), la partie reprend exactement là où elle en était.');

  // --- Vérifie qu'un retour explicite à la configuration efface bien la sauvegarde ---
  session2.window.confirm = () => true; // jsdom n'implémente pas window.confirm par défaut
  session2.document.getElementById('quitGame')?.click();
  const afterQuit = session2.window.localStorage.getItem('versoRectoV53Save');
  assert(!afterQuit, "Quitter explicitement la partie devrait effacer la sauvegarde locale.");
  console.log('OK : quitter explicitement la partie efface bien la sauvegarde locale.');

  console.log('\nOK PERSISTANCE LOCALE : la partie locale survit à un rafraîchissement de page.');
  process.exit(0);
}

main();
