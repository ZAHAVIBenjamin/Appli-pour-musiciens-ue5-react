# E-05 — Tablatures : chercher des morceaux sur Songsterr (API + proxy)

- **Date** : 28/10/2026
- **Auteur** : E
- **Fichiers touchés** : `src/services/tablatureApi.ts`, `vite.config.ts`, `vercel.json` (nouveau),
  `.env.example` et `src/vite-env.d.ts` (variables inutilisées retirées)

## Ce qu'on a fait et pourquoi

La face Tablatures doit permettre de **chercher un morceau** et d'en ouvrir la tablature. On a
choisi l'API de recherche de **Songsterr** (gros site de tablatures) :
`https://www.songsterr.com/api/songs?pattern=...` renvoie en JSON les morceaux trouvés, leurs pistes
et l'accordage de chacune (en **numéros MIDI**, comme en E-04 : 40 = Mi2, 45 = La2…).

Deux difficultés : le navigateur **bloque** l'appel direct (CORS) → on passe par un **proxy** ; et
la réponse contient trop de choses (voix, batterie, basse…) → le service la **transforme** en un
format à nous, avec seulement les guitares.

Choix assumés : on n'affiche **pas** la tablature elle-même (contenu protégé de Songsterr), on
renvoie vers sa page ; l'API n'est pas documentée officiellement et pourrait changer — d'où la
couche d'adaptation (voir plus bas).

Options écartées : écrire nos propres tablatures en JSON (pas d'API externe) ; les deux à la fois
(une séance de plus).

## Le code expliqué

### Le CORS : pourquoi l'appel direct est bloqué

- Une page (`localhost:5173`) peut lire ce que **son propre site** lui renvoie. Pour un **autre
  site**, le navigateur ne transmet la réponse au code que si ce site l'autorise avec l'en-tête
  **`Access-Control-Allow-Origin`**.
- **Songsterr répond normalement** (200 OK) mais n'envoie pas cet en-tête : il ne donne pas la
  permission. C'est **le navigateur qui bloque** : il reçoit la réponse et refuse de la donner au
  code.
- **Pourquoi cette règle** : sans elle, un site piégé pourrait lire, avec tes cookies, les données
  d'un site où tu es connecté (messagerie, banque).
- **Ce qui n'est pas concerné** : taper l'adresse dans la barre (c'est toi qui visites Songsterr) et
  `curl` (pas de navigateur). Seul le **JavaScript d'une page** qui lit un **autre site** l'est.

Vérifié dans la console : `fetch('https://www.songsterr.com/api/...')` → erreur CORS ;
`fetch('/api/songsterr/...')` → liste de morceaux.

### Le proxy : passer par notre propre serveur

```
Sans proxy :  page ──X──> songsterr.com                  (bloqué par le navigateur)
Avec proxy :  page ───> localhost/api/songsterr ───> songsterr.com/api
                        (même site : autorisé)  (serveur → serveur : pas de CORS)
```

Le proxy ne valide rien et n'ajoute aucun en-tête : il fait en sorte que la page ne parle qu'à son
propre site, donc la règle CORS ne s'applique plus.

**vite.config.ts** — en développement :

```ts
server: {
  proxy: {
    '/api/songsterr': {
      target: 'https://www.songsterr.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/songsterr/, '/api'),
    },
  },
},
```

- Toute requête qui **commence par** `/api/songsterr` est interceptée par Vite et transmise à
  `target`.
- `changeOrigin` : Vite se présente avec l'adresse de Songsterr (certains serveurs refusent les
  requêtes qui ne leur sont pas adressées).
- `rewrite` : `/api/songsterr/songs?pattern=oasis` → `/api/songs?pattern=oasis`, donc Songsterr
  reçoit `https://www.songsterr.com/api/songs?pattern=oasis`. `/^\/api\/songsterr/` est une
  **expression régulière** : `^` = « au début », `\/` = un `/` échappé.
- Vite ne lit ce fichier **qu'au démarrage** : le relancer après une modification.

**vercel.json** — en ligne :

```json
{ "source": "/api/songsterr/:path*", "destination": "https://www.songsterr.com/api/:path*" }
```

| | Sur le PC (`npm run dev`) | En ligne (Vercel) |
| --- | --- | --- |
| Qui sert la page ? | le serveur **Vite** | **Vercel** (fichiers de `npm run build`) |
| Le proxy | fait par Vite (`vite.config.ts`) | fait par Vercel (`vercel.json`) |

**Vite n'existe pas en ligne.** Sans `vercel.json`, Vercel recevrait `/api/songsterr/...`, ne
trouverait aucune page à cette adresse → **404** : la recherche marcherait sur le PC et serait
cassée en ligne. Il faut **un proxy par monde**.

### src/services/tablatureApi.ts — le service

**Deux familles de types : la couche d'adaptation**

```ts
interface SongsterrSong { songId: number; artist: string; title: string; tracks: SongsterrTrack[] }
export interface Song { id: number; artist: string; title: string; url: string; guitarTracks: GuitarTrack[] }
```

- `SongsterrSong` = ce que **Songsterr envoie** (seulement les champs utiles) ; **non exporté**.
- `Song` = ce que **l'appli utilise** ; **exporté** (la face Tablatures s'en servira).
- Comme un **adaptateur de prise de voyage** : si Songsterr renomme `songId` en `id_song`, on ne
  corrige **que ce fichier** ; la face ne connaît que `Song`. Sans adaptateur, il faudrait corriger
  partout où la donnée est utilisée.

**Appeler : `fetch` + `await`**

```ts
const params = new URLSearchParams({ pattern: query, size: '10' })
const response = await fetch(`${API_URL}/songs?${params}`)
```

- `URLSearchParams` fabrique `pattern=...&size=10` en **encodant** les caractères spéciaux : « AC/DC »
  ne casse pas l'adresse (testé).
- `fetch` renvoie une **Promise** → `await` (comme `getUserMedia`, E-02) → la fonction est `async`
  et renvoie `Promise<Song[]>`.

**Vérifier : `response.ok`**

```ts
if (!response.ok) {
  throw new Error(`Erreur ${response.status} pendant la recherche`)
}
```

- **Le piège** : `fetch` ne lève une erreur que si **aucune réponse n'arrive** (pas d'internet,
  CORS). Un 404 ou un 500 est une réponse : pour `fetch`, ça a marché.
- `response.ok` vaut `true` seulement pour les codes 200 à 299 → c'est **notre** `if` qui détecte le
  problème et **notre** `throw` qui crée l'erreur ; elle remontera au `.catch` de la face.
- Vérifié dans la console : `fetch('/api/songsterr/nexistepas')` → `status` 404, `ok` false, et
  **pas d'exception** (sinon `r` n'existerait pas). La ligne rouge `GET … 404` est un **journal**
  de Chrome, pas une erreur JavaScript.

**Transformer : `json`, `map`, `filter`**

```ts
const songs: SongsterrSong[] = await response.json()
return songs.map((song) => ({
  id: song.songId,
  artist: song.artist,
  title: song.title,
  url: `https://www.songsterr.com/a/wa/song?id=${song.songId}`,
  guitarTracks: song.tracks
    .filter((track) => track.instrument.includes('Guitar'))
    .map((track) => ({ name: track.name, tuning: track.tuning })),
}))
```

- `response.json()` : lit le corps et le transforme en objets JavaScript (Promise → `await`).
- **`map`** : **nouveau tableau, même longueur**, chaque élément transformé.
  `[1, 2, 3].map((x) => x * 10)` → `[10, 20, 30]`. (`forEach` parcourt mais ne renvoie rien.)
- **`filter`** : **nouveau tableau** avec seulement les éléments pour lesquels la condition est
  vraie. `[1, 2, 3].filter((x) => x > 1)` → `[2, 3]`.
- `includes('Guitar')` : sensible à la casse et exact (`'guitare'` ne trouverait rien). Garde
  `Overdriven Guitar`, écarte `Electric Bass (finger)`, `Drums`, les voix (`Baritone Sax`).
- `({ ... })` : les parenthèses indiquent qu'on **renvoie un objet** (sinon les accolades seraient
  le corps de la fonction).

### Ménage

`.env.example` et `vite-env.d.ts` prévoyaient une URL et une **clé** d'API : Songsterr n'en demande
pas → retirées (une config inutilisée pose question à l'oral).

### Test réalisé (console, `await import('/src/services/tablatureApi.ts')`)

- `'wonderwall'` → **10** morceaux (indices 0 à 9 dans la console) ; Oasis original : 14 pistes →
  4 guitares ; chaque morceau a une `url`.
- `'AC/DC'` → fonctionne, le `/` est encodé.
- `'zzzqqqxx'` → **tableau vide** : pas une erreur, zéro résultat.
- À gérer dans l'interface : un morceau peut n'avoir **aucune** piste guitare (« Wonderwall
  Acoustic »).

## Vocabulaire

| Terme | Définition simple |
| --- | --- |
| API | Adresse qui répond avec des données (ici en JSON) plutôt qu'une page |
| JSON | Format texte d'échange de données (objets, tableaux) |
| CORS | Règle du navigateur : le code d'un site ne lit un autre site qu'avec sa permission |
| `Access-Control-Allow-Origin` | En-tête par lequel un serveur autorise un autre site à lire sa réponse |
| Proxy | Intermédiaire qui transmet les requêtes à un autre serveur |
| Expression régulière | Motif pour reconnaître du texte (`^` = début) |
| `fetch` | Fonction du navigateur qui envoie une requête HTTP |
| Code HTTP | Nombre qui résume la réponse : 200 OK, 404 introuvable, 500 erreur serveur |
| `response.ok` | `true` si le code est entre 200 et 299 |
| `throw` | Lance une erreur, qui remonte jusqu'à un `catch` |
| `map` / `filter` | Nouveau tableau transformé (même longueur) / trié selon une condition |
| Couche d'adaptation | Code qui traduit un format extérieur en format interne |
| `URLSearchParams` | Fabrique la partie `?a=1&b=2` d'une adresse en encodant les caractères |

## Quiz

1. Appel direct à songsterr.com avec `fetch` : qui bloque, pourquoi, que manquait-il ?
2. Pourquoi `vite.config.ts` **et** `vercel.json` ? Sans `vercel.json`, en ligne ?
3. Songsterr répond 500 : `fetch` lève-t-il une erreur ? Qui la détecte, et ensuite ?
4. `Electric Bass (finger)` ou `Overdriven Guitar` : laquelle reste, quelle ligne en décide ?
   Différence `map` / `filter` ?
5. Pourquoi deux types, `SongsterrSong` (non exporté) et `Song` (exporté) ?

Rattrapage :

- A. Vrai/faux : (a) Songsterr refuse de répondre à localhost ; (b) le navigateur reçoit la réponse
  mais ne la donne pas au code ; (c) il manque `Access-Control-Allow-Origin`.
- B. En ligne sans `vercel.json`, `fetch('/api/songsterr/songs?pattern=oasis')` : qui reçoit,
  Vite intervient-il, résultat ?
- C. Pour un 500 : `fetch` lève-t-il une erreur ? `response.ok` ? Quelle ligne lance l'erreur ?
- D. `[1, 2, 3]` : `.map((x) => x * 10)` et `.filter((x) => x > 1)`, avec leurs longueurs.
- E. Songsterr renomme `songId` : combien de fichiers à modifier ? Et sans les deux types ?
- F. (console) `fetch('/api/songsterr/nexistepas')` : erreur JavaScript ? `status`, `ok` ? Les
  deux lignes de notre code qui transforment `ok` en erreur ?

<details>
<summary>Corrigé (à ouvrir après avoir répondu)</summary>

1. **Le navigateur** : Songsterr répond, mais sans `Access-Control-Allow-Origin` ; sans cette
   permission, le navigateur ne transmet pas la réponse au code. But : empêcher un site piégé de
   lire les données d'un autre site avec tes cookies. Le proxy est le contournement.
2. Vite (et son proxy) n'existe qu'en développement ; en ligne, Vercel sert les fichiers construits.
   Sans `vercel.json`, Vercel ne trouve rien à `/api/songsterr/...` → 404 : recherche cassée en
   ligne seulement.
3. **Non** : le serveur a répondu. `response.ok` vaut `false` → notre `if (!response.ok)` →
   notre `throw new Error(...)` → l'erreur remonte au `.catch` de la face (message affiché).
4. `Overdriven Guitar`, grâce à `.filter((track) => track.instrument.includes('Guitar'))`. `map`
   transforme chaque élément (même longueur) ; `filter` ne garde que ceux qui passent la condition.
5. Couche d'adaptation : `SongsterrSong` = format de Songsterr (qu'on ne contrôle pas), `Song` =
   notre format. Si Songsterr change, on ne modifie que `tablatureApi.ts`.

- A. (a) faux, Songsterr répond (200) ; (b) vrai ; (c) vrai. Le proxy ne valide rien : la page ne
  parle qu'à son propre site, la règle ne s'applique plus.
- B. **Vercel** reçoit ; Vite n'existe pas en ligne ; aucune page à cette adresse → **404** (pas un
  blocage CORS).
- C. Non ; `false` ; `throw new Error(...)` dans le `if (!response.ok)`.
- D. `[10, 20, 30]` (3) ; `[2, 3]` (2).
- E. Un seul, `tablatureApi.ts`. Sans adaptateur : tous les fichiers qui utilisent la donnée.
- F. Pas d'erreur JavaScript (sinon `r` n'existerait pas) : la ligne rouge est un journal de Chrome.
  `status` 404, `ok` false. `if (!response.ok) {` / `throw new Error(...)`.

</details>

## Points à retravailler (E)

- **CORS** : c'est le serveur qui donne (ou non) la permission, le **navigateur** qui bloque ; le
  proxy contourne, il n'explique pas.
- **Deux mondes** : développement (Vite) et production (Vercel) ; ce qui marche sur le PC peut
  casser en ligne.
- **`fetch` ne lève pas d'erreur sur un 404/500** ; journal rouge de Chrome ≠ exception JavaScript.
- **`map` ≠ parcourir** : il fabrique un nouveau tableau de même longueur.
- **Couche d'adaptation** : savoir dire pourquoi deux types (point d'oral probable).
- Lire la consigne : « séparément » vs « enchaînés ».

## Questions possibles à l'oral

- **D'où viennent vos tablatures ?** De l'API de recherche de Songsterr ; on affiche les morceaux,
  leurs pistes guitare et leur accordage, et on renvoie vers Songsterr pour la tablature (contenu
  protégé).
- **Vous n'avez pas de backend : comment contournez-vous le CORS ?** Un proxy sans code : la
  configuration de Vite en développement, une règle `rewrites` de Vercel en production.
- **Comment gérez-vous les erreurs réseau ?** `fetch` ne rejette que si aucune réponse n'arrive ; on
  teste `response.ok` et on lance une erreur nous-mêmes, affichée par la face.
- **Et si Songsterr change son API ?** Elle n'est pas documentée officiellement, c'est un risque
  assumé ; la couche d'adaptation le limite à un seul fichier.
- **Pourquoi ne gardez-vous que les guitares ?** L'appli est pour guitaristes : `filter` écarte
  voix, basse et batterie.
