# Application installable et hors ligne (design)

Date : 2026-09-25
Statut : implémenté

## Contexte

Le README annonçait « PWA » depuis le premier jour, mais le dépôt ne
contenait ni manifeste, ni icône, ni service worker. Concrètement :
l'application était un site web ordinaire. Impossible de l'ajouter à l'écran
d'accueil d'une tablette, impossible de l'ouvrir dans le train.

C'est pourtant l'usage visé : un enfant ouvre l'application sur la tablette
familiale, pas un navigateur avec une URL à retaper.

## Décision

Faire de l'application une vraie PWA installable, qui fonctionne sans
connexion une fois ouverte la première fois — sans ajouter de dépendance.

## Mécanique technique

### Manifeste

`public/manifest.webmanifest`. Tous ses chemins sont **relatifs** (`start_url`
et `scope` valent `"."`, les icônes `"icon-192.png"`), parce que
l'application est publiée dans un sous-dossier : `/cm1-cm2/` sur GitHub Pages.
Un chemin absolu la ferait démarrer à la racine du domaine.

`short_name` tient en neuf caractères (« Exercices ») : au-delà d'une douzaine,
Android tronque le libellé sous l'icône.

### Icônes

`tools/generate-icons.mjs` les dessine et les écrit dans `public/`
(`npm run icons`). Le script encode lui-même les PNG — en-tête, CRC, `zlib` —
plutôt que d'ajouter une bibliothèque de dessin à un projet qui n'en a aucune.
Les icônes sont versionnées : le build ne les régénère pas.

Trois formats, pour trois usages qui ne se recouvrent pas :

| Fichier | Usage |
|---|---|
| `icon-192.png`, `icon-512.png` | carré arrondi, `purpose: any` |
| `icon-maskable-512.png` | carré plein ; Android applique sa propre découpe, le dessin reste dans les 80 % centraux |
| `apple-touch-icon.png` | iOS, qui applique son masque et n'accepte pas la transparence |

### Service worker

`vite.config.ts` contient un petit plugin qui écrit `dist/sw.js` à la fin du
build, avec la liste réelle des fichiers produits. Ces fichiers portent une
empreinte dans leur nom ; c'est cette liste qui nomme le cache, donc une
nouvelle version remplace l'ancienne au lieu de s'y ajouter.

Deux stratégies, selon ce qui est demandé :

- **une navigation** part d'abord sur le réseau, et retombe sur la page en
  cache si elle échoue. En ligne, l'enfant reçoit donc toujours la dernière
  version ; hors ligne, l'application s'ouvre quand même ;
- **tout le reste** est servi depuis le cache, sans réseau : ces fichiers sont
  immuables puisque leur nom change à chaque build.

### Le piège qui a coûté le mode hors ligne

`caches.match(request)` compare les en-têtes listés dans le `Vary` de la
réponse. Le serveur renvoie `Vary: Origin` ; or les fichiers mis en cache à
l'installation l'ont été sans en-tête `Origin`, tandis que la page les demande
ensuite **avec** (les scripts de module sont chargés en `crossorigin`). Les
deux ne correspondent pas, le cache rate, et hors ligne la page s'affichait
vide — sans la moindre erreur visible.

`caches.match(request, { ignoreVary: true })` règle le cas. Le mode hors ligne
est vérifié dans un vrai navigateur, pas seulement raisonné (voir ci-dessous).

## Hors périmètre

- Prévenir l'utilisateur qu'une nouvelle version est disponible : la
  navigation réseau-d'abord suffit tant que l'application tient en un fichier.
- Mettre en cache autre chose que l'application elle-même. Il n'y a ni
  backend, ni image, ni police distante.

## Test / validation

`tools/manifest.test.ts` (dans `npm test`) vérifie ce qui peut l'être sans
navigateur : les champs du manifeste, le fait que `start_url` et `scope`
restent relatifs, la présence des trois tailles d'icônes et de l'icône
masquable, l'existence réelle des PNG et leur signature, et les balises de
`index.html`.

Le reste demande un vrai navigateur, et a été vérifié ainsi sur le build de
production servi par `vite preview` :

- le manifeste est servi et ses trois icônes répondent ;
- le service worker s'enregistre, avec `/cm1-cm2/` pour portée ;
- une séance complète se déroule sans une seule erreur de console ;
- connexion coupée, un rechargement complet réaffiche l'application.
