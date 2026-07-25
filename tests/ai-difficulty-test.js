// Test du sélecteur de difficulté IA Normal/Expert — V56.
//
// Vérifie que :
//  1. Le formulaire (mode mixte) affiche bien un sélecteur aiDifficulty par IA, masqué pour
//     les participants humains.
//  2. startGame() stocke correctement player.aiDifficulty ("normal" par défaut, "expert" si
//     sélectionné) — undefined pour les humains.
//  3. requestAIMove() choisit bien le profil de recherche Expert (profondeur/limite/budget
//     de temps supérieurs) quand player.aiDifficulty === "expert", en inspectant le message
//     posté au Worker réel (on intercepte Worker/postMessage sans exécuter la recherche).

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

  // Intercepte la création du Worker réel pour capturer le message posté, sans exécuter
  // AI_WORKER_CODE (pas besoin ici : on vérifie juste le contenu du message envoyé).
  const postedMessages = [];
  class FakeWorker {
    constructor() {}
    postMessage(msg) { postedMessages.push(msg); }
    terminate() {}
    set onmessage(fn) { this._onmessage = fn; }
    set onerror(fn) { this._onerror = fn; }
  }
  window.Worker = FakeWorker;
  window.URL.createObjectURL = () => 'blob:fake';

  const ctx = dom.getInternalVMContext();
  vm.runInContext(gameSource, ctx, { filename: 'game.js' });

  const document = window.document;

  // --- 1) Formulaire mode mixte : sélecteur de difficulté présent, masqué pour les humains ---
  document.getElementById('gameMode').value = 'mixed';
  document.getElementById('gameMode').dispatchEvent(new window.Event('change'));
  document.getElementById('playerCount').value = '2';
  document.getElementById('playerCount').dispatchEvent(new window.Event('change'));

  document.getElementById('playerType0').value = 'human';
  document.getElementById('playerType0').dispatchEvent(new window.Event('change'));
  document.getElementById('playerType1').value = 'ai';
  document.getElementById('playerType1').dispatchEvent(new window.Event('change'));

  const difficulty0 = document.getElementById('aiDifficulty0');
  const difficulty1 = document.getElementById('aiDifficulty1');
  assert(difficulty0, "Le sélecteur aiDifficulty0 devrait exister même pour un participant humain.");
  assert(difficulty0.closest('.ai-difficulty-field')?.hidden === true, "Le sélecteur de difficulté devrait être masqué pour un participant humain.");
  assert(difficulty1, "Le sélecteur aiDifficulty1 devrait exister pour l'IA.");
  assert(difficulty1.closest('.ai-difficulty-field')?.hidden === false, "Le sélecteur de difficulté devrait être visible pour une IA.");

  difficulty1.value = 'expert';

  document.getElementById('startGame').click();
  const state = vm.runInContext('state', ctx);
  assert(state.status === 'PLAYING', `La partie aurait dû démarrer (status=${state.status}).`);

  const human = state.players.find(p => !p.isAI);
  const aiExpert = state.players.find(p => p.isAI);
  assert(human.aiDifficulty === undefined, "aiDifficulty ne devrait pas être défini pour un joueur humain.");
  assert(aiExpert.aiDifficulty === 'expert', `L'IA devrait être en mode expert, trouvé "${aiExpert.aiDifficulty}".`);

  // --- 2) requestAIMove() doit poster un profil de recherche plus profond en mode Expert ---
  vm.runInContext(`{
    const aiP = state.players.find(p => p.isAI);
    state.turnOrder = [aiP.id, state.players.find(p => !p.isAI).id];
    state.currentTurnIndex = 0;
    requestAIMove(aiP);
  }`, ctx);
  assert(postedMessages.length === 1, `1 message attendu au Worker, trouvé ${postedMessages.length}.`);
  const expertConfig = postedMessages[0].config;

  const depthNormal = vm.runInContext('AI_SEARCH_DEPTH_2_PLAYERS', ctx);
  const depthExpert = vm.runInContext('AI_SEARCH_DEPTH_2_PLAYERS_EXPERT', ctx);
  const maxTurnNormal = vm.runInContext('AI_MAX_TURN_MS', ctx);
  const maxTurnExpert = vm.runInContext('AI_MAX_TURN_MS_EXPERT', ctx);

  assert(expertConfig.depthTwoPlayers === depthExpert, `Profondeur Expert attendue ${depthExpert}, trouvé ${expertConfig.depthTwoPlayers}.`);
  assert(expertConfig.depthTwoPlayers > depthNormal, "La profondeur Expert devrait être supérieure à la profondeur Normal.");
  assert(expertConfig.maxDecisionMs === maxTurnExpert, `Budget de temps Expert attendu ${maxTurnExpert} ms, trouvé ${expertConfig.maxDecisionMs} ms.`);
  assert(expertConfig.maxDecisionMs > maxTurnNormal, "Le budget de temps Expert devrait être supérieur au budget Normal.");

  // --- 3) Un IA "normal" doit utiliser le profil normal ---
  postedMessages.length = 0;
  aiExpert.aiDifficulty = 'normal';
  vm.runInContext(`{
    const aiP = state.players.find(p => p.isAI);
    state.turnOrder = [aiP.id, state.players.find(p => !p.isAI).id];
    state.currentTurnIndex = 0;
    requestAIMove(aiP);
  }`, ctx);
  const normalConfig = postedMessages[0].config;
  assert(normalConfig.depthTwoPlayers === depthNormal, `Profondeur Normal attendue ${depthNormal}, trouvé ${normalConfig.depthTwoPlayers}.`);
  assert(normalConfig.maxDecisionMs === maxTurnNormal, `Budget Normal attendu ${maxTurnNormal} ms, trouvé ${normalConfig.maxDecisionMs} ms.`);

  console.log(`OK : profil Normal → profondeur ${normalConfig.depthTwoPlayers}, budget ${normalConfig.maxDecisionMs} ms.`);
  console.log(`OK : profil Expert → profondeur ${expertConfig.depthTwoPlayers}, budget ${expertConfig.maxDecisionMs} ms.`);
  console.log('\nOK DIFFICULTÉ IA : sélecteur Normal/Expert vérifié de bout en bout (formulaire, stockage, profil de recherche envoyé au Worker).');
}

main();
process.exit(0);
