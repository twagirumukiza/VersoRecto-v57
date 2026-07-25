# Changelog

## V57 — Planificateur de sortie de blocage ("breakout") : fin du tourner-en-rond

Signalement (avec capture d'écran annotée) : même en mode Expert, l'IA restait bloquée à
tourner en rond (137 coups, 58 minutes, aucune élimination) sans jamais contourner ou pivoter
autour d'un amas de pions pour rejoindre sa configuration gagnante.

**Diagnostic** : le moteur a en réalité déjà un vrai planificateur de chemin (V51 — Dijkstra
avec `v51CellTraversalCost`, qui traite toute case occupée comme infranchissable et route
donc naturellement autour des obstacles). Mais il n'est utilisé QUE pendant l'ouverture de
partie (`openingMovePool`), et seulement pour amener un pion isolé jusqu'aux cases d'ENTRÉE du
regroupement central — jamais pour amener les pions jusqu'aux cases EXACTES du motif gagnant
visé, une fois le regroupement fait. Dès que les 7 pions ont bougé une première fois, plus
aucune recherche de chemin réelle ne guide l'IA : ne reste que l'heuristique locale (distance
euclidienne à la case la plus proche), qui ne "voit" pas qu'une route directe est bloquée et
qu'il faut contourner ou pivoter — exactement le symptôme observé.

**Correctifs :**
- **Suivi de stagnation par IA** (thread principal, `updateAIStagnationTracking` /
  `mainThreadBestPatternProgress`) : après chaque coup réel, on compare le nombre de cases
  occupées dans le meilleur motif gagnant atteignable à celui d'avant le coup.
  `player.stagnantMoves` s'incrémente si aucun progrès, revient à 0 sinon. Réinitialisé à
  chaque nouvelle manche de tournoi.
- **`breakoutRoutePlan()` / `breakoutPlanMoves()`** (dans `AI_WORKER_CODE`) : reprend le
  même principe que le Path Planner V51 (Dijkstra, cases occupées infranchissables — donc
  contournement naturel des amas), mais visant directement les cases MANQUANTES du motif
  gagnant visé, pour chacun des 7 pions du joueur.
- **Déclenchement automatique** : dès que `player.stagnantMoves` dépasse
  `AI_BREAKOUT_STAGNATION_THRESHOLD` (10 coups sans progrès), les coups de sortie de blocage
  trouvés sont injectés dans le pool `mandatory` de `tacticalMovePool` — donc réellement
  évalués par minimax (avec anticipation des réponses adverses), pas imposés aveuglément.
- **Nouveau test** : `tests/ai-breakout-test.js` vérifie le suivi de stagnation et confirme,
  sur une vraie position via le vrai Worker, que les coups de sortie de blocage proposés sont
  légaux et bien injectés dans le pool prioritaire (7 coups trouvés sur la position testée).

*(Cette passe ne concerne que l'IA locale (`game.js`) ; le mode en ligne (`online-v39.js`) ne
propose pas de joueurs IA à ce jour — uniquement des humains, avec gestion des forfaits.)*

## V56 — Mode Expert par IA (Normal / Expert)

Suite à la question « et si on enlevait la limite de 10 secondes ? » : réponse détaillée
d'abord (retirer bêtement la limite ne change presque rien, car la recherche s'arrête déjà
d'elle-même dès qu'elle atteint sa profondeur cible — le vrai levier est d'augmenter
profondeur ET budget de temps ensemble), puis implémentation d'un vrai sélecteur par IA.

- **Nouveau sélecteur "Niveau de l'IA" (Normal / Expert)** par participant IA, dans le
  formulaire de partie (modes Mixte et Tournoi). Masqué pour les participants humains.
- **Normal** (comportement inchangé) : profondeur 5 (duel) / 3 (multi), budget 10 s/coup.
- **Expert** : profondeur 7 (duel) / 5 (multi) en situation normale, jusqu'à 12 (duel) / 8
  (multi) en situation critique, largeur de recherche élargie, budget porté à 28-30 s/coup.
  Rendu praticable uniquement grâce au correctif de performance V55 (`PATTERN_CACHE`) — sans
  lui, ces profondeurs auraient fait exploser le temps de décision bien au-delà de ce budget
  déjà généreux.
- Le budget Expert reste **borné** (pas illimité) : au-delà d'un certain temps, une recherche
  plus profonde expose à un blocage de plusieurs minutes sur une position complexe à 4
  joueurs, ou à un Worker tué en arrière-plan si l'appareil passe en veille. La recherche
  itérative retourne de toute façon le meilleur coup trouvé jusque-là si elle est interrompue,
  donc aucun risque de blocage réel — juste un temps d'attente plus long, annoncé dans le
  message de statut ("L'IA (Expert) réfléchit — jusqu'à 30 s").
- `player.aiDifficulty` ("normal" | "expert" | undefined pour un humain) est stocké sur
  l'objet joueur et suit la partie (persistance locale/en ligne incluse, aucun changement de
  format nécessaire).
- **Nouveau test** : `tests/ai-difficulty-test.js` vérifie le formulaire (sélecteur visible
  uniquement pour les IA), le stockage de `aiDifficulty` au démarrage, et que
  `requestAIMove()` poste bien le profil de recherche (profondeur + budget) correspondant au
  Worker réel.

## V55 — Correctif majeur : l'IA « se bloquait » car elle n'avait quasiment jamais le temps de réfléchir

Signalement initial : l'IA restait bloquée et répétait des coups inutiles au lieu de trouver
une victoire pourtant à 2-3 coups. Une proposition avait été faite de reconstruire l'IA en
architecture hybride (A*, Beam Search, MCTS, mémoire des configurations gagnantes, SAT
solver, apprentissage). Le diagnostic a montré que ce n'était **pas** un problème
algorithmique — presque tous les éléments proposés existaient déjà dans le moteur (mémoire
des 5 816 configurations gagnantes, pénalités anti-répétition à plusieurs niveaux, détection
de stagnation, planificateur de chemin façon Dijkstra pour les pions isolés). Le vrai
problème était un **goulot d'étranglement de performance qui empêchait ce moteur de tourner
dans le temps imparti**.

**Mesure avant correctif** (benchmark reproductible, position de départ, moteur réel extrait
de `AI_WORKER_CODE`) : une seule décision `chooseAIMove()` prenait **95 038 ms**, sans même
explorer un seul nœud de minimax, alors que le budget réel accordé par `requestAIMove()` est
de 10 500 ms (`AI_WORKER_DEADLINE_MS`). Conséquence en jeu : ce délai expirait
systématiquement avant que le Worker ne réponde, et la partie retombait silencieusement sur
`quickAIMove` — le repli à 1 coup, sans minimax ni anticipation — pour la quasi-totalité des
coups joués. Vu du joueur, cela ressemble exactement à une IA qui erre sans but : c'est en
réalité l'IA sophistiquée qui ne tournait quasiment jamais.

**Cause isolée** : `closestWinningPatternForPlayer()` (la comparaison de la position actuelle
aux 2 908 motifs gagnants) coûtait **~70 ms par appel**, et cette fonction était invoquée des
dizaines de fois par coup candidat évalué (ordre des coups, regroupement central, Path
Planner, évaluation de position...), très souvent sur un plateau strictement identique à un
appel précédent dans la même décision.

**Correctifs :**
- **`PATTERN_CACHE`** : mémoïsation de `closestWinningPatternForPlayer()` par
  (couleur + signature exacte du plateau), réinitialisée à chaque nouvelle décision. Gain
  mesuré sur l'appel isolé : ~70 ms → ~0,4 ms (×170).
- **`tacticalMovePool()`** calculait `staticMoveScore()` deux fois par coup candidat (une
  fois pour son propre tri, une deuxième fois via `orderMovesForSearch`) — fusionné en un
  seul calcul.
- **Garde-fous temporels** ajoutés dans `openingMovePool()`/`tacticalMovePool()` : si le
  budget est déjà épuisé, on saute le tri coûteux plutôt que de risquer un nouveau
  dépassement, même dans un cas de figure non couvert par le benchmark.

**Mesure après correctif** : la même décision (position de départ, cas le plus coûteux en
pré-calcul) passe de 95 038 ms à ~11 600 ms (**×8**). En conditions réelles via le vrai
Worker (`tests/integration-test.js`), une recherche complète à profondeur 5 explorant 2 703
nœuds s'exécute en **1,4 seconde**.

**Reste à faire** (non traité dans cette passe, effort/risque plus élevé pour un gain
marginal désormais) : le cas de la toute première décision d'une partie neuve (aucun pion
encore regroupé, donc aucun cache "chaud") dépasse encore légèrement le budget nominal de
10,5 s malgré le ×8. Piste identifiée pour une prochaine itération : remplacer les
recherches linéaires `pieceAt()` (balayage des 28 pièces à chaque appel) par une table
position→pièce en O(1), ce qui réduirait encore le coût de `evaluatePlayerPosition()` et de
ses nombreux appels internes.

- **Nouveau test de non-régression** : `tests/ai-performance-test.js` mesure une vraie
  décision `chooseAIMove()` sur la position la plus coûteuse (partie neuve, duel, profil
  "normal") et échoue si le temps dépasse 3× le budget réel — un plafond qui aurait
  immédiatement détecté la régression de 95 s corrigée ici.

## V54.2 — Pause de 5 secondes entre chaque manche (mode Tournoi local)
Demande : marquer une vraie coupure entre les manches d'un tournoi plutôt qu'un
enchaînement instantané.

- **Pause de 5 secondes** entre la fin d'une manche et le démarrage de la suivante (plateau
  remis à zéro, nouvel ordre de jeu, etc.), pendant que la partie affiche l'écran de fin de
  manche.
- **Pop-up superposé au plateau** annonçant « Première manche terminée », « Deuxième manche
  terminée » ou « Troisième manche terminée » selon la manche qui vient de se conclure,
  avec une petite animation d'apparition.
- La pause est proprement annulée si la partie est quittée ou relancée pendant ces 5
  secondes (pas de plantage, pas de manche fantôme qui démarre après coup).
- Le statut textuel de la partie reflète aussi cette pause (« … manche terminée —
  préparation de la manche suivante… ») pour les lecteurs d'écran / la zone de statut.
- La pause s'applique aussi avant la révélation du champion (à l'issue de la dernière
  manche) : le pop-up « Troisième manche terminée » s'affiche 5 secondes avant que le
  champion ne soit annoncé, pour ménager un vrai temps de suspense.

*(Cette entrée V54.2 ne couvrait que le mode local — voir V54.3 ci-dessous pour l'extension
au mode Tournoi en ligne.)*

## V54.3 — Pause de 5 secondes en Tournoi en ligne + correctif du son des pions (Safari/iOS)

**Pause entre manches, mode Tournoi en ligne**
- Même principe que la V54.2, étendu à `online-v39.js` : `eliminateFromTournamentRound()`
  est scindée en `beginTournamentRoundPause()` (fige l'éliminé, démarre la pause, statut
  `"round-paused"`) et `completeTournamentRoundTransition()` (fait réellement démarrer la
  manche suivante ou couronne le champion), appelée 5 secondes plus tard.
- Le pop-up « Xe manche terminée » est synchronisé sur tous les clients via Firebase
  (`tournament.roundPause`), pas seulement affiché localement chez le joueur qui vient de
  terminer la manche.
- Comme cette architecture n'a pas de serveur autoritaire (chaque client écrit directement
  dans Firebase), **chaque client connecté** programme indépendamment son propre minuteur
  de fin de pause dès qu'il reçoit l'état "en pause" : si le joueur à l'origine de la fin de
  manche se déconnecte pendant les 5 secondes, un autre client présent prend le relais et la
  manche suivante démarre quand même.
- Le nettoyage du minuteur/pop-up a été ajouté à `leaveRoom()` pour éviter tout état fantôme
  en cas de sortie de salon pendant la pause.

**Correctif : pas de son au déplacement des pions, sauf pour les pions jaunes**
- **Cause réelle** : le son de déplacement était joué en clonant (`cloneNode()`) un même
  `<audio>` à chaque coup. Ça fonctionne pour un coup joué en direct par un vrai geste
  utilisateur (clic), mais Safari/iOS bloque silencieusement `.play()` sur un élément audio
  fraîchement cloné dès que la lecture n'a pas lieu dans la foulée immédiate d'un geste
  utilisateur. Résultat : tous les coups joués par l'IA (déclenchés via `setTimeout`, donc
  hors du geste utilisateur) restaient muets, tandis que les pions déplacés directement à la
  main (dans le cas rapporté : les pions jaunes) gardaient leur son.
- **Correctif** : mise en place d'un petit pool de 6 éléments `<audio>` pré-créés, chacun
  « déverrouillé » une seule fois (lecture muette + pause) pendant le tout premier geste
  utilisateur réel (`unlockMoveAudio()`), puis réutilisés en tourniquet à chaque coup —
  humain ou IA, quelle que soit la couleur du pion. Testé en environnement simulé (jsdom) :
  déverrouillage unique des 6 éléments puis lecture correcte sur 5 coups consécutifs.
- Cette correction ne concerne que le mode local (`game.js`) ; le mode en ligne utilise déjà
  un `<audio>` recréé simplement à chaque coup dans `online-v39.js` — moins robuste sur
  Safari/iOS pour la même raison, mais non signalé comme problématique pour l'instant.

## V54.1.1 — Correctif : l'IA ratait des victoires à 2-3 coups en fin de tournoi / partie à 4
Bug signalé : dès qu'un joueur était déjà classé (mode Tournoi, ou partie à 4 joueurs une
fois 2 joueurs éliminés/classés et les 2 derniers pilotés par l'IA), l'IA ne parvenait
plus à trouver une combinaison gagnante nécessitant d'anticiper 2 ou 3 coups, alors
qu'elle la trouvait sans problème en mode normal.

- **Cause** : `adaptiveSearchProfile()` forçait, dès que `rankedCount > 0`, une recherche
  minimax bridée à 1 seul demi-coup de profondeur et 4 coups candidats
  (`postWinnerDepth` / `postWinnerCandidateLimit`), **sans tenir compte** du niveau
  tactique réel de la position (`tacticalSearchLevel`). Résultat : en position
  « critique » (victoire ou menace immédiate) ou « tactique » (position avancée), l'IA
  perdait tout son horizon de recherche et ne voyait plus les victoires en 2-3 coups.
  Seule la victoire en 1 coup restait détectée (vérification indépendante en tête de
  `chooseAIMove`).
- **Correctif** : le raccourci « post-winner » (recherche allégée) ne s'applique
  désormais que lorsque la position est réellement calme (`level === "normal"`). Dès
  qu'une situation critique ou tactique est détectée, l'IA retrouve la même profondeur
  de recherche qu'en mode normal (duel ou multijoueur), même après qu'un ou plusieurs
  joueurs ont déjà été classés.

## V54.1 — Mode Tournoi : chaque manche repart d'un plateau vierge
Changement de règle demandé après test du mode Tournoi (V54) : le plateau n'est plus un
seul combat continu qui se rétrécit — chaque manche redémarre désormais **depuis le
début**.

- **Réinitialisation complète à chaque manche** : dès qu'une couleur gagne une manche,
  **tous** les pions (des joueurs encore en lice comme des joueurs déjà éliminés lors des
  manches précédentes) reviennent à leur case de départ.
- **Le perdant de la manche reste figé, mais à sa case de départ** : le pion du joueur
  éliminé (le moins avancé des perdants) n'est plus gelé « là où il se trouvait » au
  moment de la défaite — il est ramené à sa case de départ, où il reste figé et grisé
  (`isNeutral = true`) pour le reste du tournoi, comme les éliminés des manches
  précédentes.
- **Un seul éliminé par manche, inchangé** : dans une manche à plus de 2 joueurs actifs,
  dès qu'une couleur termine son groupe et gagne, seul le joueur le moins avancé parmi
  les perdants encore en jeu est éliminé et figé — les autres joueurs encore en course
  continuent normalement à la manche suivante (comportement déjà présent en V54, rappelé
  ici pour clarifier qu'il n'a pas changé).
- **Nouveau tirage au sort de l'ordre de jeu à chaque manche** : contrairement à la V54,
  qui reprenait le même ordre de jeu en local et ne tirait jamais au sort en ligne,
  l'ordre de qui commence est désormais retiré au sort à chaque nouvelle manche, aussi
  bien en local (`game.js`) qu'en multijoueur en ligne (`online-v39.js`, qui gagne au
  passage une fonction `shuffle()`).
- Implémentation : `advanceTournamentAfterRound()` (local) et
  `eliminateFromTournamentRound()` (en ligne) appellent désormais `createPieces()` avec
  la liste des joueurs encore actifs à chaque transition de manche — cette fonction
  replace tous les pions à leur position de départ et gèle automatiquement (`isNeutral`)
  toute couleur absente de cette liste, qu'elle vienne d'être éliminée ou qu'elle l'ait
  été lors d'une manche antérieure.
- La finale (dernière manche, un seul joueur restant à la fin) ne déclenche pas de reset :
  le tournoi est terminé, le plateau reste affiché tel qu'il était au moment du coup
  gagnant.

## V54 — Mode Tournoi (élimination progressive)
Nouveau mode de jeu, disponible aussi bien en local qu'en multijoueur en ligne : le
**Tournoi**. Il démarre à exactement 4 joueurs (humains ou IA, dans n'importe quelle
combinaison). À la fin de chaque manche, le joueur classé **dernier** est éliminé : ses
7 pions restent **figés sur le plateau exactement là où ils se trouvaient** au moment de
l'élimination — ils deviennent des obstacles fixes, via le même mécanisme déjà utilisé
pour les couleurs non choisies en partie à 2 ou 3 joueurs (`isNeutral`). Les survivants
gardent leurs pions exactement où ils étaient (c'est un seul combat continu, le plateau
n'est jamais réinitialisé entre les manches) et une nouvelle manche démarre aussitôt
entre eux, jusqu'à ce qu'il n'en reste plus qu'un seul : le **champion** du tournoi.

- **Local (`game.js`)** : nouveau mode `tournament` dans le sélecteur de mode de jeu, qui
  verrouille le nombre de participants à 4 et réutilise l'interface de sélection
  humain/IA du mode mixte pour chacun. La transition de manche (`advanceTournamentAfterRound`)
  se déclenche automatiquement à la fin de chaque manche via `finishGame()` — aucune
  action manuelle requise entre deux manches. « Recommencer » relance le tournoi complet
  depuis les 4 joueurs d'origine (pas seulement les survivants d'une tentative
  précédente). Un panneau dédié affiche la manche en cours et le tableau des
  éliminations (Nème place, manche d'élimination), avec le champion mis en valeur une
  fois couronné.
- **Multijoueur en ligne (`online-v39.js`)** : case à cocher « Mode tournoi » à la
  création du salon, qui impose exactement 4 joueurs avant de pouvoir démarrer.
  `eliminateFromTournamentRound()` reproduit fidèlement la même mécanique que la version
  locale (gel des pions, retrait de l'effectif actif, transition de manche ou
  couronnement), synchronisée via Firebase comme le reste de l'état de partie. Un
  abandon (forfait) en cours de tournoi élimine immédiatement le joueur concerné, au lieu
  d'attendre la fin normale de la manche.
- **Cas limite couvert** : si tous les joueurs actifs se retrouvent mutuellement bloqués
  dès le tout début d'une manche de tournoi (avant qu'aucun classement n'ait pu
  s'établir — un cas déjà extrêmement rare vu la taille du plateau), un départage neutre
  élimine le dernier joueur de l'ordre de jeu plutôt que de laisser le tournoi bloqué
  indéfiniment en partie nulle.
- **Choix de conception à noter** : les pions des joueurs encore en lice ne sont **pas**
  remis à leur position de départ entre les manches — seul le joueur éliminé voit ses
  pions figés. Le tournoi est donc un seul combat continu qui se rétrécit progressivement,
  plutôt qu'une série de parties totalement indépendantes. Si un fonctionnement différent
  était souhaité (repositionnement des survivants à chaque nouvelle manche), le signaler
  pour ajustement.
- Deux nouveaux tests (`tests/tournament-test.js`, `tests/online-tournament-test.js`)
  vérifient réellement (pas seulement en relisant le code) un tournoi complet de bout en
  bout — 3 manches consécutives, gel des pions, réduction de l'effectif, et couronnement
  du champion — à la fois côté local et côté multijoueur en ligne (y compris le
  déclenchement par un vrai coup gagnant, pas seulement un classement fabriqué à la main).

## V53.2 — La partie survit désormais à un rafraîchissement de page
- **Partie locale (`game.js`)** : rafraîchir la page (F5) remettait systématiquement la
  partie à zéro — l'état n'existait qu'en mémoire JavaScript. La partie en cours est
  désormais sauvegardée automatiquement dans `localStorage` après chaque coup et
  restaurée telle quelle au rechargement de la page (position des pions, historique,
  chronomètre, tour en cours — y compris relance automatique de l'IA si c'était son
  tour). Quitter explicitement la partie (bouton « Quitter »/« Nouvelle partie ») efface
  la sauvegarde, pour repartir proprement sur une configuration neuve.
- **Multijoueur en ligne (`online-v39.js`)** : le mécanisme de restauration de session
  (`restoreOnlineSessionIfPossible`, déjà présent dans le code) a été vérifié par un test
  automatisé — il reconnecte bien automatiquement au salon en cours après un
  rafraîchissement, sans ressaisir de code. La partie elle-même n'était donc pas perdue
  en ligne (elle vit dans Firebase, pas dans le navigateur) ; seule la partie locale
  manquait de cette persistance.
- Deux nouveaux tests (`tests/local-persistence-test.js`,
  `tests/online-persistence-test.js`) simulent un vrai rafraîchissement de page (deux
  instances de page séparées partageant le même stockage local / la même base
  Firebase simulée) pour vérifier ce comportement de bout en bout, plutôt que de
  supposer qu'il fonctionne.

## V53.1 — Forfait en multijoueur en ligne
Nouvelle fonctionnalité (n'existait pas auparavant) : quand un joueur quitte une partie
en ligne en cours, cela n'avait aucun effet pour les autres participants — ils ne
voyaient rien, le tour de ce joueur n'était jamais sauté, et le jeu attendait
indéfiniment un coup qui ne viendrait jamais.

- **`forfeitPlayer(uid)`** (`online-v39.js`) : déclare un joueur forfait quand il quitte
  une partie en cours (`leaveRoom`). Son tour est immédiatement sauté si c'était le sien,
  et il est exclu du jeu comme un joueur déjà classé (`isRanked()` étendu pour inclure
  les forfaits — réutilise directement `remainingPlayers()`/`nextActiveUidAfter()`,
  déjà conçus pour ignorer les joueurs classés).
- **Pions grisés** : les pions d'un joueur forfait apparaissent désormais grisés et non
  cliquables sur le plateau (classe `finished-piece`, déjà utilisée en mode local pour
  les joueurs classés — réutilisée pour rester cohérent visuellement).
- **Fin de partie par attrition** : si un ou plusieurs forfaits successifs ne laissent
  plus qu'un seul joueur actif, la partie se termine et ce joueur est déclaré vainqueur
  (`lastRemaining`), exactement comme le prévoyaient déjà les règles du jeu.
- **Classement** : les joueurs forfaits apparaissent toujours en dernière position de la
  liste de classement, distinctement marqués « forfait », quel que soit le moment où ils
  ont quitté la partie (jamais mélangés avec les rangs réels).
- **Règles Firebase assouplies** (`firebase-rules-v37.json`) : la règle d'écriture de
  l'état n'autorisait que le joueur actif ou l'hôte, ce qui aurait bloqué silencieusement
  la déclaration de forfait dans le cas le plus courant (quitter quand ce n'est pas son
  tour). Élargie à tout joueur du salon.
  **⚠️ Action requise : ces règles doivent être recopiées manuellement dans la console
  Firebase (Realtime Database → Règles) du projet — je ne peux pas les déployer à
  distance.**
- Corrigé au passage : `online-v39.html` référençait encore `experience-v44.js`,
  supprimé lors du nettoyage V53 (provoquait un 404 au chargement de la page
  multijoueur ; sans conséquence fonctionnelle car le code gère déjà son absence, mais
  inutile de le charger).
- Nouveau test `tests/online-forfeit-test.js` : vérifie réellement (pas seulement en
  relisant le code) le saut de tour automatique et la fin de partie par attrition sur
  plusieurs forfaits successifs.

## V53 — Édition simplifiée
Nouvelle édition centrée sur les trois modes essentiels : local humains, local
humain(s)/IA, et multijoueur en ligne. Objectif : réduire la surface du projet pour
limiter le risque de régression (voir l'historique ci-dessous, où plusieurs bugs
bloquants sont passés inaperçus d'une version à l'autre à cause de la duplication de
code entre versions parallèles).

**Retiré de cette édition** (fichiers non inclus, restent disponibles dans les archives
précédentes si besoin) :
- Système de mémoire/apprentissage (`experience-v44/45/48`, `experience-v50.js`) et
  Learning Lab (`learning-v41`) — complexité non requise pour les trois modes essentiels.
- Laboratoire multijoueur expérimental non lié depuis la page principale (`online-lab`).
- Anciennes versions multijoueur redondantes (`online-v37`, `online-v38` — simples
  redirections vers `online-v39`, qui reste la version active).
- Fichier `ai-worker.js` autonome, qui n'était jamais chargé par le jeu (le moteur réel
  vit entièrement dans la chaîne `AI_WORKER_CODE` embarquée dans `game.js`) — sa
  présence dans les zips précédents pouvait laisser croire à tort qu'il fallait le
  maintenir en parallèle du code réellement utilisé.
- `game.orig.js` (fichier de comparaison utilisé pendant le développement du Path
  Planner, sans utilité en production).

**Ajouté :**
- `tests/integration-test.js` — nouveau test qui fait *réellement tourner* une partie
  (démarrage, coup côté page, exécution directe du Worker IA réel) dans un DOM simulé
  (jsdom), au lieu de simplement vérifier la présence de texte dans le code. C'est le
  test qui, s'il avait existé plus tôt, aurait attrapé dès la première exécution les bugs
  `INITIAL_POSITIONS` et `AI_OPENING_DISTINCT_PIECES` décrits ci-dessous dans
  l'historique V51.1/V51.2.
- `package.json` (jsdom en dépendance de développement, uniquement pour les tests —
  aucune dépendance n'est chargée par le jeu lui-même, qui reste 100 % statique).

**Inchangé (déjà en place depuis V51.2, vérifié à nouveau ici) :** Victory Planner à
paliers (5/7/9 demi-coups en duel, 3/4/5 en multijoueur), Path Planner, protection XSS
(`escapeHtml`), protection anti-injection de formule CSV, correctif `roomCode` du
multijoueur en ligne.

## V51.2 — Correctif critique : la partie ne démarrait plus
- **Bug bloquant (déjà présent dans le zip v51 initial, avant même mes correctifs v51.1) :** les déclarations `const INITIAL_POSITIONS = {...}` et `const SYMMETRIC_MOVES = parseMoveTable(MOVES_TEXT);` (thread principal, utilisées par `createPieces()` et par la validation des coups côté page) avaient été supprimées par erreur — probablement lors d'un remplacement automatique trop large pendant un patch v50/v51 antérieur. Résultat : cliquer sur « Lancer la partie » levait `ReferenceError: Can't find variable: INITIAL_POSITIONS` et bloquait toute partie, en local comme en ligne. Restauré à l'identique de la v48/v50 (clés `YELLOW/RED/BLUE/BLACK`, cohérentes avec `COLOR_KEYS`). Vérifié par exécution réelle de `createPieces()` (28 pièces générées, positions correctes) et par `parseMoveTable(MOVES_TEXT)` (table de déplacements valide), pas seulement par relecture du code.
- Cette régression n'affectait pas le Worker IA (qui a sa propre copie interne de `SYMMETRIC_MOVES`, reçue via `postMessage`), ce qui explique qu'elle soit passée inaperçue pendant la revue du moteur de recherche en v51.1 : le jeu ne pouvait plus du tout démarrer, donc l'IA n'avait simplement jamais l'occasion de jouer.

## V51.1 — Corrections d'efficacité de l'IA
- **Bug critique corrigé (préexistant, hérité de la v50, indépendant du patch Path Planner) :** dans le Worker IA, `openingMovePool` référençait la constante globale `AI_OPENING_DISTINCT_PIECES`, absente de la portée isolée du Worker. À **chaque tour normal** (sans victoire/blocage immédiat à jouer), le Worker levait une `ReferenceError` silencieusement rattrapée, et le jeu retombait systématiquement sur l'IA de repli à 1 coup au lieu du Victory Planner/Path Planner. Corrigé (lecture de `CONFIG.openingDistinctPieces`), et vérifié par exécution réelle du moteur dans un bac à sable Node (pas seulement une vérification syntaxique).
- **Bug de double application de coup corrigé dans `tacticalMovePool` :** pour chaque coup candidat, `staticMoveScore` était appelé alors que ce même coup était déjà temporairement appliqué sur le plateau, ce qui provoquait un second déplacement vers la même case (« double bascule » de la face RECTO/VERSO) et faussait l'évaluation de position pour **chaque candidat, à chaque nœud de recherche**. `staticMoveScore` est désormais appelé avant toute application temporaire.
- **Complexité quadratique supprimée :** `tacticalMovePool` recalculait `countImmediateWinningMoves` (coûteux, lui-même en O(n)) pour chaque coup candidat — un coût O(n²) redondant avec la détection des coups gagnants déjà garantie par ailleurs. Supprimé. Le motif gagnant « avant » était également recalculé identiquement pour chaque candidat ; il est désormais calculé une seule fois. Le Path Planner et le Victory Planner disposent ainsi de plus de marge de calcul pour la même profondeur, à budget de temps égal.
- **Régression du budget de réflexion corrigée :** `AI_MAX_TURN_MS`/`AI_WORKER_DEADLINE_MS` étaient retombés à 7000/6500 ms (au lieu des ~10 s prévus), avec le garde-fou principal qui coupait 200 ms **avant** même le délai interne du Worker. Portés à 10000/10500 ms, avec une marge de sécurité correcte.
- **Config du Worker complétée :** les profondeurs/limites tactiques et critiques (`tacticalDepthTwoPlayers`, `criticalCandidateLimitMulti`, etc.) n'étaient jamais transmises par le thread principal — le Worker fonctionnait uniquement grâce à des valeurs de repli codées en dur. Elles sont désormais explicitement envoyées depuis `game.js`.
- **Régression de sécurité corrigée (hors périmètre IA) :** la protection contre l'injection de formule CSV (`csvCell`, ajoutée en v48.2) avait disparu dans cette branche ; rétablie.
- Correctifs déjà présents dans cette branche et vérifiés intacts : XSS (`escapeHtml`), bug `currentRoomCode` du multijoueur.
- Aucune régression : `tests/smoke-test.js` et `tests/v51-path-planner-test.js` passent ; le moteur a été exécuté réellement (pas seulement vérifié syntaxiquement) sur un plateau synthétique multi-pièces pour confirmer que `openingMovePool` et `tacticalMovePool` s'exécutent sans erreur.

## V51 — Path Planner stratégique
- navigation Dijkstra sur les déplacements légaux ;
- recherche de la meilleure porte d’entrée du groupe central ;
- détection et coût des barrières adverses ;
- mémoire locale des itinéraires échoués et des retours ;
- score de contournement fondé sur le coût réel, les alternatives et la progression ;
- Victory Planner et mémoire hybride V50 conservés.

# Changelog

## v51.0.0

- Ajout de `VR50Memory` et migration automatique de la mémoire v48.
- La mémoire ne choisit plus directement le coup avant le Victory Planner.
- Transmission des statistiques de la position courante au Web Worker IA.
- Intégration des résultats appris dans l'ordre des coups et le départage des scores.
- Pondération prudente par moyenne, variance, nombre d'essais et confiance.
- Influence mémoire plafonnée pour empêcher un ancien mauvais apprentissage de masquer une victoire ou une défense forcée.
- Ajout du compteur « Coups fiables (3+ essais) ».
- Préparation des profils IA stable/candidate et de la promotion Champion.
- Conservation des correctifs multijoueur de la v48.3 et du Victory Planner v49.
