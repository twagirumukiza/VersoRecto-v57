// Vérifie que rafraîchir la page NE déconnecte PAS d'une partie en ligne en cours (V53.2).
//
// Simule un vrai rafraîchissement en créant deux instances jsdom séparées partageant :
//   - le même contenu de localStorage (comme un vrai navigateur entre deux chargements) ;
//   - le même "cloud" Firebase en mémoire (simule le fait que la base de données réelle,
//     elle, ne redémarre jamais) ;
//   - la même identité anonyme Firebase (simule la persistance normale de Firebase Auth,
//     qui réutilise le même utilisateur anonyme d'un chargement à l'autre du même
//     navigateur).

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

// --- Faux Firebase minimal, partagé entre les "sessions" (simule le vrai backend) -------
function makeFakeCloud() {
  const data = {};
  const listeners = {}; // path -> Set(callback)

  function makeSnapshot(path) {
    return { val: () => (data[path] === undefined ? null : JSON.parse(JSON.stringify(data[path]))) };
  }
  function notify(path) {
    for (const cb of listeners[path] || []) cb(makeSnapshot(path));
  }

  return {
    ref(path) {
      return {
        async set(value) { data[path] = value; notify(path); },
        async update(partial) { data[path] = { ...(data[path] || {}), ...partial }; notify(path); },
        async once(_event) { return makeSnapshot(path); },
        on(_event, cb) {
          listeners[path] = listeners[path] || new Set();
          listeners[path].add(cb);
          cb(makeSnapshot(path)); // Firebase appelle immédiatement le callback à l'abonnement.
        },
        off() {
          delete listeners[path];
        },
      };
    },
    _dump: () => data,
  };
}

function makeFakeFirebase(cloud, fixedUid) {
  return {
    apps: [],
    initializeApp() { return {}; },
    app() { return {}; },
    database() { return cloud; },
    auth() {
      return {
        // Simule la persistance normale de Firebase Auth : le même utilisateur anonyme
        // est réutilisé d'un chargement de page à l'autre du même navigateur.
        signInAnonymously: async () => ({ user: { uid: fixedUid } }),
      };
    },
  };
}

function loadOnlinePageInFreshWindow({ cloud, fixedUid, localStorageSnapshot }) {
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
  window.firebase = makeFakeFirebase(cloud, fixedUid);

  for (const [key, value] of Object.entries(localStorageSnapshot || {})) {
    window.localStorage.setItem(key, value);
  }

  let loadError = null;
  window.addEventListener('error', event => { loadError = event.error || event.message; });

  const ctx = dom.getInternalVMContext();
  vm.runInContext(source, ctx, { filename: 'online-v39.js' });
  if (loadError) fail(`online-v39.js a levé une erreur au chargement : ${loadError}`);

  return {
    window,
    document: window.document,
    getRoomCode: () => vm.runInContext('roomCode', ctx),
    getGameState: () => vm.runInContext('gameState', ctx),
    waitFor: async (predicate, timeoutMs = 3000) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (predicate()) return true;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      return false;
    },
  };
}

async function main() {
  const cloud = makeFakeCloud();
  const uid = 'test-uid-1';

  // --- "Session 1" : on crée un salon (comme un vrai clic utilisateur) ---
  const session1 = loadOnlinePageInFreshWindow({ cloud, fixedUid: uid, localStorageSnapshot: {} });
  session1.document.getElementById('playerName').value = 'Alice';
  session1.document.getElementById('createRoom')?.click();

  const created = await session1.waitFor(() => !!session1.getRoomCode());
  assert(created, "Le salon n'a pas été créé (roomCode toujours vide).");
  const roomCode = session1.getRoomCode();
  console.log(`OK : salon créé (session 1) — ${roomCode}.`);

  // Force le statut à "playing" pour simuler une partie déjà en cours (le rafraîchissement
  // qui inquiète l'utilisateur se produit typiquement en pleine partie, pas juste en salle
  // d'attente).
  const cloudRef = cloud.ref(`v37Rooms/${roomCode}`);
  const before = (await cloudRef.once('value')).val();
  await cloudRef.update({ status: 'playing', state: { ...before.state, status: 'playing' } });

  // Capture le localStorage tel qu'il serait sur disque entre deux chargements de page.
  const storageSnapshot = {};
  for (let i = 0; i < session1.window.localStorage.length; i++) {
    const key = session1.window.localStorage.key(i);
    storageSnapshot[key] = session1.window.localStorage.getItem(key);
  }
  assert(Object.keys(storageSnapshot).length > 0, "Aucune session en ligne n'a été sauvegardée dans localStorage.");

  // --- "Session 2" : nouvelle page chargée (F5), même cloud, même identité, même localStorage ---
  const session2 = loadOnlinePageInFreshWindow({ cloud, fixedUid: uid, localStorageSnapshot: storageSnapshot });
  const reconnected = await session2.waitFor(() => session2.getRoomCode() === roomCode && session2.getGameState()?.status === 'playing');
  assert(reconnected, `La session n'a pas été restaurée après rechargement (roomCode=${session2.getRoomCode()}, status=${session2.getGameState()?.status}).`);
  console.log(`OK : après un rechargement simulé (F5), reconnecté automatiquement au salon ${roomCode} en cours de partie, sans ressaisir de code.`);

  console.log('\nOK PERSISTANCE EN LIGNE : la session multijoueur survit à un rafraîchissement de page.');
  process.exit(0);
}

main().catch(error => { console.error(error); process.exit(1); });
