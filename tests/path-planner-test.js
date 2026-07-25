// Vérifie la présence des éléments du Path Planner dans le moteur embarqué (game.js).
// Ceci est un test de PRÉSENCE DE TEXTE uniquement — il ne prouve pas que le code
// s'exécute sans erreur. Voir tests/integration-test.js pour un test d'exécution réelle.
const fs = require('fs');
const game = fs.readFileSync('game.js', 'utf8');
const required = [
  'function v51EntryCells',
  'function v51RoutePlan',
  'function v51FailedRoutePenalty',
  'function v51PathPlannerScore',
  'return geometricScore + v51PathPlannerScore',
];
for (const token of required) {
  if (!game.includes(token)) throw new Error(`game.js: élément Path Planner absent: ${token}`);
}
if (!game.includes('barrierEscape') || !game.includes('followsPath')) {
  throw new Error('Les bonus de contournement/barrière sont absents.');
}
console.log('OK Path Planner: portes d’entrée, barrières et contournement présents.');
