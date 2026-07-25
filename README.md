# Verso Recto — V54

Jeu de stratégie abstrait (2 à 4 joueurs, 72 cases triangulaires). Concept et règles :
Innocent Twagirumukiza — médaille A.I.F.F., Concours Lépine 2005.

Cette édition se concentre sur les modes essentiels et retire les modules
expérimentaux (mémoire/apprentissage, laboratoire en ligne, anciennes versions) des
éditions précédentes, dans un souci de simplicité et de fiabilité.

## Modes de jeu

- **Local, joueurs humains** (`index.html`, mode « Local ») — 2 à 4 joueurs sur le même
  appareil. La partie en cours survit à un rafraîchissement de la page (F5).
- **Local, humain(s) contre IA** (`index.html`, mode « Mode IA » ou « Mode mixte ») — de
  1 humain seul face à l'IA (2 participants) jusqu'à 4 participants en mélange libre
  humains/IA. L'IA est le *Victory Planner* : recherche minimax à profondeur adaptative
  (5/7/9 demi-coups en duel selon la tension de la position, 3/4/5 en multijoueur) avec
  *Path Planner* (navigation réelle des pions isolés autour des barrières).
- **Tournoi — élimination progressive** (`index.html`, mode « Tournoi », et
  `online-v39.html` via la case « Mode tournoi ») — 4 joueurs (humains ou IA). À la fin
  de chaque manche, le dernier classé est éliminé : ses pions repartent à leur case de
  départ mais restent figés et grisés. Une nouvelle manche démarre aussitôt avec les
  survivants — **tous les pions, y compris ceux des survivants, reviennent à leur case de
  départ** (le plateau redémarre entièrement à chaque manche) et l'ordre de jeu est
  retiré au sort — jusqu'au champion. Disponible en local comme en multijoueur en ligne.
- **Multijoueur en ligne** (`online-v39.html`) — parties à distance via Firebase, 2 à 4
  joueurs, couleurs non choisies laissées en pions neutres. Un rafraîchissement de page
  reconnecte automatiquement au salon en cours. Si un joueur quitte une partie en cours,
  il est déclaré forfait : ses pions se grisent, son tour est automatiquement sauté, et
  il apparaît en dernière position du classement final.

> **⚠️ Action requise après mise à jour depuis une version antérieure :** copier le
> contenu de `firebase-rules-v37.json` dans la console Firebase du projet (Realtime
> Database → Règles) pour que la déclaration de forfait fonctionne. Cette étape ne peut
> pas être faite à distance.

## Déploiement (GitHub Pages ou tout hébergeur statique)

Copier tout le contenu de ce dossier à la racine du dépôt / du site. Aucune étape de
build n'est nécessaire pour le jeu lui-même (HTML/CSS/JS statiques).

## Tests

Les tests nécessitent Node.js et, une seule fois, l'installation des dépendances de
développement (jsdom, utilisé uniquement pour simuler un navigateur dans les tests —
jamais chargé par le jeu réel) :

```
npm install
npm test
```

Suites exécutées :

- `tests/smoke-test.js` — vérifie la syntaxe de `game.js`, les identifiants HTML
  essentiels et le nombre de configurations gagnantes (5 816).
- `tests/path-planner-test.js` — vérifie la présence du code du Path Planner (V51).
- `tests/integration-test.js` — **fait réellement tourner une partie** dans un DOM
  simulé (jsdom) : démarrage d'une partie à 3 joueurs, un coup joué côté page, puis
  exécution directe du vrai moteur du Worker IA (Victory Planner/Path Planner).
- `tests/online-forfeit-test.js` — vérifie le forfait en multijoueur en ligne (saut de
  tour automatique, fin de partie par attrition, classement).
- `tests/local-persistence-test.js` / `tests/online-persistence-test.js` — vérifient
  qu'un rafraîchissement de page (F5) ne fait perdre la partie ni en local ni en ligne.
- `tests/tournament-test.js` / `tests/online-tournament-test.js` — vérifient un tournoi
  complet de bout en bout (3 manches, gel des pions, couronnement du champion), en local
  et en ligne, y compris le déclenchement automatique par un vrai coup gagnant.

## Historique

Voir `CHANGELOG.md`. Les éditions antérieures (mémoire/apprentissage V44-V50, laboratoire
en ligne, anciennes versions multijoueur V37/V38) ne sont plus incluses dans cette
édition simplifiée ; elles restent disponibles dans les archives précédentes si besoin.
