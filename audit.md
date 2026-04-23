# Audit de sécurité — AFTh

_Date : 2026-04-22 · Version auditée : commit `d1e3b4a` · Périmètre : `server.js`, templates, dépendances npm, configuration_

Ce rapport recense les vulnérabilités et mauvaises pratiques identifiées dans le projet AFTh, classées par gravité. Chaque point est accompagné d'un scénario d'exploitation concret et d'une remédiation chiffrée en effort.

---

## 🟢 Ce qui est déjà bien fait

| | Détail |
|---|---|
| ✅ **Hash bcrypt** | Mots de passe membres hashés avec `bcrypt.hash(pw, 10)` — résistant aux rainbow tables |
| ✅ **Cookies HttpOnly + SameSite=Strict** | Vol par XSS impossible, CSRF cross-site bloqué pour les méthodes sensibles |
| ✅ **Requêtes SQL préparées** | 100 % des requêtes SQLite utilisent `prepare(…).run(…)` avec paramètres liés — pas d'injection possible |
| ✅ **Échappement HTML systématique** | Fonction `escapeHtml()` appelée **54 fois** dans `server.js` pour les données utilisateur rendues en HTML |
| ✅ **Tokens cryptographiquement sûrs** | `randomBytes(32)` pour les sessions, `randomUUID()` pour les liens d'activation/reset |
| ✅ **Markdown forum XSS-safe** | `mdToHtml()` échappe le HTML d'abord, puis applique les patterns markdown (pas l'inverse) |
| ✅ **Limites de taille des requêtes** | `express.json({ limit: '200kb' })`, uploads PDF limités à 30-50 Mo |
| ✅ **Secrets en `.env`** | Aucun secret hardcodé, `.env` gitignored, `.env.example` sans valeurs réelles |
| ✅ **Données RGPD gitignored** | `members.json`, `forum.db*`, `system-prompt.backup.txt` absents du repo |
| ✅ **Early return sur login sans révéler l'erreur** | Réponse uniforme « Email ou mot de passe incorrect » (pas d'enum d'utilisateurs via message d'erreur) |

---

## 🔴 Haute gravité

### 1. `xlsx` (SheetJS) a une vulnérabilité CVE non patchée

**Détail** : `npm audit` signale 1 vulnérabilité **high** dans la lib `xlsx@0.18.5` :
- Prototype Pollution (GHSA-4r6h-8v6p-xvw6)
- ReDoS sur certains fichiers malformés (GHSA-5pgg-2g8v-p4x9)

**Impact** : un fichier xlsx malveillant uploadé via `/admin/api/members/import/preview` pourrait polluer le prototype de `Object` (risque chaîné selon ce qui l'utilise ensuite) ou geler le thread Node pendant plusieurs secondes.

**Probabilité** : faible — l'endpoint est derrière `requireAuth` (admin uniquement). Il faudrait qu'un admin bienveillant soit trompé ou qu'un compte admin soit compromis.

**Remédiation** :
- Court terme : accepter le risque (surface réduite par l'auth admin) et mentionner dans la checklist "ne jamais importer un xlsx venant d'une source inconnue"
- Long terme : remplacer `xlsx` par `exceljs` (pas de CVE active) — ~30 min de refactor
- Ou : parser uniquement le CSV côté client (drop du support xlsx)

---

### 2. Pas de rate-limiting sur les endpoints sensibles

**Endpoints concernés** :
- `POST /admin/login` — brute-force du mot de passe admin unique
- `POST /membres/login` — brute-force par email
- `POST /membres/mot-de-passe-oublie` — enumération d'emails + flood SMTP
- `POST /api/chat` — spam de l'API Anthropic (**risque financier direct**)
- `POST /admin/api/members/import/preview` — DoS via gros fichiers répétés

**Impact** :
- Un attaquant peut tester **des milliers de mots de passe par seconde** sur l'admin
- `POST /api/chat` **sans aucune auth** : un bot peut envoyer 100 req/s et générer des centaines d'euros de facture Anthropic en quelques minutes
- Le reset password peut être utilisé pour inonder la boîte mail d'une victime

**Probabilité** : élevée dès la mise en ligne publique.

**Remédiation** :
- Ajouter `express-rate-limit` — ~15 min :
  ```js
  import rateLimit from 'express-rate-limit';
  app.use('/admin/login', rateLimit({ windowMs: 15*60*1000, max: 10 }));
  app.use('/membres/login', rateLimit({ windowMs: 15*60*1000, max: 10 }));
  app.use('/membres/mot-de-passe-oublie', rateLimit({ windowMs: 60*60*1000, max: 5 }));
  app.use('/api/chat', rateLimit({ windowMs: 60*1000, max: 20 }));
  ```
- Alternative maison : Map en mémoire `{ ip: { count, resetAt } }` — ~30 min

---

### 3. HTTPS non imposé, cookies sans flag `Secure`

**Détail** : les cookies de session sont créés avec `HttpOnly; Path=/; SameSite=Strict` mais **sans** `Secure`. Si le site est déployé accidentellement en HTTP, tous les cookies de session sont envoyés en clair.

**Impact** : interception de session admin ou membre via Wi-Fi public, proxy d'entreprise, FAI malveillant.

**Probabilité** : dépend de la mise en prod. Si Caddy/Nginx gère bien HTTPS, risque négligeable en pratique. Mais le code ne le **garantit pas**.

**Remédiation** (~10 min) :
- Ajouter `Secure` au flag en prod :
  ```js
  const secureCookie = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly;${secureCookie} Path=/; SameSite=Strict; Max-Age=${TTL/1000}`);
  ```
- Ajouter header HSTS en prod
- Middleware qui redirige HTTP → HTTPS

---

### 4. XSS stockée dans les actualités et prix (admin-only mais réel)

**Détail** : les champs `body_html` (actus main, actus sidebar, prix) sont **injectés sans échappement** :
```js
// server.js:91
${d.main.body_html || ''}
// server.js:104
<p ...>${s.body_html || ''}</p>
// server.js:135
${(p.body_html || '').split('\n').map(...).join('')}
```

**Impact** : un admin dont la session est volée (via XSS dans une autre partie, ou session fixation) pourrait injecter du JavaScript dans les actualités, qui s'exécuterait chez tous les visiteurs publics.

**Probabilité** : faible — nécessite compromission admin d'abord. Mais c'est un **vecteur d'amplification** : un faille admin devient une faille utilisateur.

**Remédiation** :
- **Idéal** : utiliser DOMPurify côté serveur (`isomorphic-dompurify`) pour filtrer le HTML, autoriser `<p><strong><em><a><br>` uniquement. +30 min.
- **Minimum** : passer `body_html` à une fonction qui filtre par regex les balises autorisées. Moins robuste.
- **Acceptable** : documenter que ce champ est HTML-brut et faire confiance aux admins (modèle actuel). À risque.

---

## 🟠 Moyenne gravité

### 5. Pas de protection CSRF explicite

**Détail** : `SameSite=Strict` sur les cookies bloque déjà 95 % des attaques CSRF (le navigateur n'envoie pas le cookie depuis un site tiers). Mais :
- Un attaquant sur un subdomain compromis pourrait bypasser SameSite
- Si l'utilisateur clique un lien `http://afth.asso.fr/admin/api/articles/42` qui déclenche une méthode GET (on n'a pas de mutation en GET, donc OK en pratique)

**Remédiation** : actuellement suffisant si on continue à :
- Ne jamais faire de mutation en GET (convention respectée)
- Exiger `Content-Type: application/json` pour les POST/PUT/DELETE (déjà le cas de facto via `express.json`)

Pour durcir : token CSRF double-submit (~1 h). **Pas prioritaire.**

---

### 6. Absence de security headers (pas de `helmet`)

**Headers manquants** :
- `Content-Security-Policy` (CSP)
- `X-Frame-Options: DENY` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HSTS)
- `Permissions-Policy`

**Impact** : clickjacking (un attaquant affiche ton `/admin` dans une iframe et trompe l'utilisateur), MIME sniffing, exfiltration via Referer.

**Remédiation** (~10 min) :
```bash
npm install helmet
```
```js
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
      'script-src': ["'self'", "'unsafe-inline'"], // nécessaire pour les scripts inline dans templates
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'"],
    },
  },
}));
```

**Note** : la CSP complique l'inline JS actuel. Compromis : `unsafe-inline` au début, migration progressive vers des scripts externes.

---

### 7. Validation du mot de passe admin inexistante

**Détail** : `process.env.ADMIN_PASSWORD` est comparé tel quel. Pas de longueur minimale, pas de vérification de complexité.

**Impact** : si l'admin choisit `1234`, aucun garde-fou.

**Remédiation** : documenter dans CLAUDE.md + ajouter un check au boot :
```js
const pw = process.env.ADMIN_PASSWORD;
if (!pw || pw.length < 12 || pw === 'change-me-please') {
  console.warn('⚠ ADMIN_PASSWORD faible ou par défaut — minimum 12 caractères recommandé');
}
```

---

### 8. Absence de journal d'audit des actions admin (requis RGPD)

**Détail** : aucune trace des modifications admin (qui a modifié quoi et quand). Pour un système qui gère des données personnelles d'adhérents, c'est un manquement RGPD.

**Impact** :
- En cas de fuite de données, impossible de tracer l'origine
- Pas de preuve de conformité en cas de contrôle CNIL
- Si le compte admin est compromis, aucune visibilité sur les dégâts

**Remédiation** (~2 h) :
- Créer `data/audit.log` (append-only JSONL)
- Middleware qui log chaque requête `/admin/api/*` avec `{ timestamp, method, path, body hash, ip, user_agent }`
- Rotation mensuelle (les logs > 13 mois sont purgés = RGPD)

---

### 9. CORS ouvert à toutes les origines

**Détail** : `app.use(cors())` autorise `Access-Control-Allow-Origin: *` par défaut.

**Impact** : n'importe quel site peut faire des requêtes AJAX vers ton API. Comme tu n'as pas de tokens dans les URL et que les cookies HttpOnly+SameSite=Strict ne sont pas envoyés cross-site, l'impact réel est limité. Mais autant restreindre.

**Remédiation** (~5 min) :
```js
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://afth.asso.fr' : true,
  credentials: true
}));
```

---

### 10. Upload PDF : confiance aveugle au `Content-Type` du client

**Détail** : `express.raw({ type: 'application/pdf' })` vérifie seulement le header HTTP, qui est **entièrement contrôlé par le client**. Un attaquant (admin) peut envoyer un fichier arbitraire en mentant sur le type.

**Impact** : le fichier est stocké sous `.pdf` dans `assets/pdfs/`. Si c'est un fichier HTML/SVG/XML avec script, et que le serveur le sert avec `Content-Type: application/pdf` (express.static fait cela automatiquement selon l'extension), le navigateur ne l'interprétera pas comme PDF mais le téléchargera — donc **pas de RCE**. OK pour la confidentialité et l'intégrité.

**Probabilité d'abus réel** : faible (admin-only).

**Remédiation optionnelle** :
- Vérifier la "magic number" PDF : `%PDF-` en début de fichier (~2 lignes)
- Scanner anti-virus (ClamAV) — plus lourd

---

## 🟡 Faible gravité

### 11. Sessions en mémoire perdues au redémarrage

Tous les utilisateurs admin et membres sont déconnectés à chaque redémarrage du serveur. Pas un risque de sécurité en soi, mais une fiabilité opérationnelle dégradée. Migration vers un store Redis ou SQLite possible (~1 h), mais pas critique à cette échelle.

### 12. Pas de limite sur les tentatives de connexion par compte

Un attaquant peut tenter N mots de passe différents sur un même email membre jusqu'à trouver le bon (pas de verrouillage de compte). Le rate-limiting par IP (point #2) atténue mais ne résout pas les attaques depuis un botnet.

**Remédiation** : champ `failed_attempts` + `locked_until` sur le modèle membre (~1 h).

### 13. Email enumeration via timing

`POST /membres/mot-de-passe-oublie` répond toujours `{ok: true}` mais **prend plus de temps** quand le membre existe (génération token + écriture fichier + envoi mail). Un attaquant peut mesurer le timing pour savoir si un email est enregistré.

**Remédiation** : réponse toujours retardée de 500-800 ms (~5 lignes).

### 14. Messages d'erreur verbeux au client

Certaines erreurs remontent le message brut de l'exception (`e.message`) au client. Peut révéler le chemin absolu d'un fichier, un détail de config, etc.

**Remédiation** : en prod, renvoyer un message générique et logger les détails côté serveur.

### 15. Pas de rotation des tokens de session

Un token de session admin reste valide 8 h même si le mot de passe est changé. Idem pour les membres.

**Remédiation** : purger les sessions d'un utilisateur dès qu'il change son mot de passe (~10 lignes).

### 16. Anthropic API sans cap de dépense

Si la clé `ANTHROPIC_API_KEY` fuite ou que `/api/chat` est abusé (cf. point #2), la facture peut exploser. Le cap doit être configuré **dans la console Anthropic** côté compte.

### 17. Pas de backup automatisé

Tout est dans `data/` et `assets/pdfs/`. En cas de crash serveur, perte des données. Documenté dans `memory/deployment_backup.md`, à implémenter au déploiement.

---

## 🔵 Informationnel (améliorations souhaitables)

1. **Pas de 2FA** pour l'admin — à ajouter si risque élevé (~1 j avec TOTP)
2. **Pas de notification email** en cas de changement de mot de passe membre (prévention compromission)
3. **Pas de politique de rétention** des données — `members.json` et `forum.db` grossissent indéfiniment. RGPD exige une durée de conservation documentée et appliquée.
4. **Pas de page "Politique de confidentialité"** ni CGU pour l'espace membre. **Obligatoire** avant mise en ligne publique (RGPD).
5. **Pas de droit à l'oubli côté membre** — un membre ne peut pas demander la suppression de son compte via l'interface, il doit écrire à l'admin.
6. **Session unique : pas de "déconnexion sur tous les appareils"** pour un membre qui suspecte un vol.
7. **Logs applicatifs uniquement sur stdout** — sans fichier rotatif, on perd tout au redémarrage. En prod : pm2 + winston/pino.

---

## 🎯 Quick wins (ordre de priorité pour production)

Avant toute mise en ligne publique :

| Priorité | Action | Effort |
|---|---|---|
| 🔴 1 | `helmet` + security headers | 10 min |
| 🔴 2 | `express-rate-limit` sur /api/chat + auth endpoints | 15 min |
| 🔴 3 | Cookie `Secure` flag en prod | 10 min |
| 🔴 4 | Redirect HTTP → HTTPS (ou fait par Caddy) | 5 min |
| 🔴 5 | Restreindre CORS à `afth.asso.fr` | 5 min |
| 🟠 6 | Cap de dépense Anthropic dans la console | 5 min (externe) |
| 🟠 7 | Page "Politique de confidentialité" + CGU forum | 2-3 h |
| 🟠 8 | Migration `xlsx` → `exceljs` | 30 min |
| 🟠 9 | Journal d'audit admin `data/audit.log` | 2 h |
| 🟡 10 | Vérif magic number PDF à l'upload | 5 min |
| 🟡 11 | Validation complexité mdp admin au boot | 5 min |

**Total des quick wins (hors CGU) : ~1 jour de travail.**

---

## 📊 Résumé tableau

| Gravité | Nombre | Notes |
|---|---|---|
| 🔴 Haute | **4** | `xlsx` CVE, rate-limiting, HTTPS/Secure, XSS `body_html` |
| 🟠 Moyenne | **6** | CSRF, headers, mdp admin, audit log, CORS, upload MIME |
| 🟡 Faible | **7** | sessions, lockout, timing, erreurs, rotation, cap API, backup |
| 🔵 Info | **7** | 2FA, email notifs, rétention, CGU, droit oubli, multi-session, logs |

**Verdict global** : le code est **globalement correct** (bcrypt, prepared statements, cookies sûrs, escapeHtml systématique). Mais il n'est **pas prêt pour la mise en ligne publique** : les points 1-5 sont bloquants pour une exposition Internet. Environ **1 jour de travail** couvre les quick wins essentiels.

---

## 🧭 Conformité RGPD (indicative)

| Exigence | Statut |
|---|---|
| Consentement explicite | ❌ Pas de formulaire d'adhésion affichant les finalités |
| Politique de confidentialité | ❌ Page à créer |
| Droit d'accès | 🟡 Partiel (profil membre consultable) |
| Droit de rectification | 🟡 Partiel (profil membre éditable, mais pas email) |
| Droit à l'oubli | ❌ Pas de bouton self-service |
| Droit à la portabilité | ❌ Pas d'export JSON des données membre |
| Registre des traitements | ❌ À tenir hors du code |
| Journal des accès | ❌ (cf. point #8) |
| Durée de conservation | ❌ Pas définie, pas appliquée |
| Chiffrement des données sensibles | 🟡 Mots de passe hashés, reste en clair |
| Backup sécurisé | ❌ Non mis en place (prévu au déploiement) |

**Priorité RGPD avant prod** : politique de confidentialité + droit à l'oubli + durée de conservation. ~1 journée de travail juridique + technique.

---

_Fin du rapport. Questions, priorisation, implémentations à discuter lors d'une prochaine session._
