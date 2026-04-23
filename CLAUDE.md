# CLAUDE.md — AFTh (Association Française des Techniques Hydrothermales)

## 🎯 Contexte

Site refondu de l'AFTh, association professionnelle française du thermalisme technique. Adhérents : ingénieurs, techniciens, gestionnaires d'établissements thermaux, bureaux d'études, fournisseurs.

- 1 rue Cels, 75014 Paris · info@afth.asso.fr · 01 53 91 05 75
- ~100-200 adhérents payants
- Congrès annuel, bulletin thématique, Prix de l'Initiative
- Site public + back-office admin + espace membres + forum

## 🧱 Stack technique

- **Node.js 18+ / Express** — serveur monolithique, rendu dynamique par substitution de placeholders
- **SQLite** (`better-sqlite3`) — seul pour le forum (concurrence des écritures)
- **JSON** — tout le reste (articles, bulletins, membres, actus, prix, adhésion, hero, congrès)
- **Anthropic SDK** — chat IA streaming SSE
- **bcryptjs** — hash mots de passe membres
- **xlsx / nodemailer** — import adhérents + envoi d'emails
- **sanitize-html** — nettoyage XSS-safe du HTML scrapé depuis afth.asso.fr
- **Frontend** : HTML/CSS/JS vanilla, **zéro framework**, polices Inter + Source Serif 4

## 📂 Arborescence

```
/afth
├── CLAUDE.md            ← ce fichier
├── README.md
├── server.js            ← ~900 lignes, routes publiques + admin + membres + forum
├── package.json         ← deps : express, cors, @anthropic-ai/sdk, bcryptjs, xlsx,
│                          nodemailer, better-sqlite3, cheerio, node-fetch, dotenv
├── .env.example         ← template : ANTHROPIC_API_KEY, ADMIN_PASSWORD, SMTP_*, APP_URL
├── .gitignore           ← exclut .env, node_modules, members.json, forum.db*, backup*
├── scripts/
│   ├── fetch-assets.sh       ← télécharge 22 bulletins PDF + images depuis afth.asso.fr
│   ├── scrape-articles.js    ← scrape 119 articles sur afth.asso.fr
│   └── fetch-article-pdfs.js ← extrait les 78 PDFs embarqués dans les articles
├── data/
│   ├── articles.json            ← 119 articles scrapés (versionné)
│   ├── bulletins-index.json     ← 22 bulletins (versionné)
│   ├── hero-card.json           ← vignette droite de la page d'accueil
│   ├── actualites.json          ← actu principale + 3 sidebar
│   ├── congres.json             ← thème, interventions
│   ├── prix.json                ← Prix Initiative / d'Honneur
│   ├── adhesion.json            ← tarifs + infos paiement
│   ├── system-prompt.txt        ← prompt IA actif (éditable via BO)
│   ├── system-prompt.default.txt← prompt IA original (fallback « restaurer »)
│   ├── system-prompt.backup.txt ← dernière version avant modif (gitignored)
│   ├── members.json             ← comptes membres avec hash bcrypt (gitignored, RGPD)
│   └── forum.db                 ← SQLite : categories, threads, posts (gitignored, RGPD)
├── assets/
│   ├── images/
│   │   ├── InstallThermale.jpg  ← photo hero de la home
│   │   ├── beraud.jpg           ← photo Prix d'Honneur 2025
│   │   ├── articles/            ← images extraites des articles (base64 décodées + HTTP)
│   │   │   └── article-{id}-{n}.{jpg,png}  (14 fichiers actuels)
│   │   ├── logo.gif, logo_cneth.png, afreth.gif, etc.
│   └── pdfs/
│       ├── bulletin-2004.pdf ... bulletin-2025.pdf  (22 fichiers)
│       └── articles/article-{id}.pdf  (78 fichiers)
├── css/
│   ├── main.css       ← styles principaux
│   └── responsive.css ← media queries
├── js/
│   ├── main.js        ← nav, recherche articles, contact form
│   └── chat.js        ← widget chat IA (streaming SSE)
└── pages/
    ├── index.html                 ← home (dynamique, lue au boot)
    ├── association.html           ← L'AFTh (dynamique, adhésion)
    ├── congres.html               ← dynamique (programme du congrès)
    ├── prix.html                  ← dynamique (prix featured + archives)
    ├── archives.html              ← statique (22 bulletins)
    ├── articles.html              ← statique (recherche JS via /api/search)
    ├── contact.html               ← statique (formulaire)
    ├── _article-template.html     ← template pour /article/:id
    ├── _admin-login.html          ← /admin (non authentifié)
    ├── _admin.html                ← /admin dashboard
    ├── _member-login.html         ← /membres/login
    ├── _member-profile.html       ← /membres/profil
    ├── _member-activate.html      ← activation email
    ├── _member-reset-request.html ← mdp oublié
    ├── _member-reset-confirm.html ← reset mdp
    ├── _forum-index.html          ← /forum
    ├── _forum-category.html       ← /forum/c/:slug
    ├── _forum-thread.html         ← /forum/t/:id
    └── _forum-new-thread.html     ← /forum/c/:slug/nouveau
```

## 🚀 Démarrage local

```bash
npm install
cp .env.example .env
# Éditer .env : ANTHROPIC_API_KEY, ADMIN_PASSWORD
npm start
# → http://localhost:3000
```

**Scripts utilitaires** :
```bash
npm run seed:members               # Crée les 3 membres de test (mdp test1234) — RECOMMANDÉ sur clone frais
bash scripts/fetch-assets.sh       # Si les PDFs/images sont manquants (déjà versionnés normalement)
node scripts/scrape-articles.js    # ~3 min, régénère data/articles.json + images extraites
node scripts/fetch-article-pdfs.js # Récupère les 78 PDFs d'articles
```

## 🔐 Accès

**Admin** → `/admin` (mdp dans `.env` sous `ADMIN_PASSWORD`)
- 10 onglets : Vignette accueil, Actualités, Congrès, Bulletins, Articles, Prix, Adhésion, Membres, Forum, Prompt IA

**Membres test** → `/membres/login` (tous avec mdp `test1234`)
- jean.dupont@afth-test.fr · Thermes de La Bourboule
- marie.martin@afth-test.fr · KAPPA Ingénierie
- pierre.bernard@afth-test.fr · EAUGEO Environnement

## 🔑 Points d'architecture importants

1. **Rendu dynamique par substitution** : `server.js` lit les templates HTML **une seule fois au boot** dans des variables (`indexTpl`, `congresTpl`, etc.), puis fait `.split('{{KEY}}').join(value)` à chaque requête.
   → **Toute modif dans un `.html` rendu dynamiquement nécessite un redémarrage du serveur.**
   Pages concernées : index, association, congres, prix, _admin*, _member*, _forum*, _article-template.
   Les pages statiques (archives, articles, contact) sont servies par `express.static` et rechargées à chaque requête.

2. **Deux sessions distinctes** : admin (`afth_admin` cookie, 8 h) et membre (`afth_member` cookie, 30 j). Tokens en mémoire, perdus au redémarrage (pas persistés — OK pour asso petite taille).

3. **Email en mode dev** : si `SMTP_HOST` absent dans `.env`, les emails (activation, reset, désabonnement) sont **loggés dans la console serveur** au lieu d'être envoyés. Pratique pour tester les flux sans configurer SMTP.

4. **Markdown sécurisé** : le forum utilise `mdToHtml()` dans `server.js` — **échappement HTML complet d'abord**, puis substitutions ciblées (gras, italique, liens http(s)/mailto, citations, listes, code inline). **Pas de lib externe**, XSS-safe.

5. **Gitignore strict** : les données sensibles ne sortent jamais (`.env`, `members.json`, `forum.db*`, `system-prompt.backup.txt`). Les données publiques sont versionnées (`articles.json`, `bulletins-index.json`, contenu JSON).

## 🎨 Conventions design

- Palette : primaire `#1a5f7a` (bleu thermal), accent `#4fb8c9` (eau claire), IA `#6c3fa8` (violet). Fond alt `#e4eef3`.
- Navbar : 66 px, logo 34 px, texte « Association Française / des Techniques Hydrothermales » sur 2 lignes Inter 0.8rem
- Hero de la home : photo `InstallThermale.jpg` avec overlay sombre 92/82/72 %
- Alternance `.section` (blanc) / `.section--alt` (bleu-gris) pour le rythme visuel

## ⚠️ À garder en tête

- **Données des membres + forum = RGPD** : ne jamais pousser sur git, jamais exposer via API publique sans auth. Backup via canal chiffré séparé (voir memory `deployment_backup.md`).
- **Redémarrer le serveur après édition des `.html`** templatés (cf. point 1 ci-dessus).
- **Clé Anthropic** : surveiller la facture en cas d'usage massif du chat IA. Plafond mensuel conseillé dans la console Anthropic.
- **Mot de passe admin** : ne jamais laisser `change-me-please` en prod.

## 🗺️ Déploiement prévu

Hébergement recommandé : **VPS OVH FR** (~7 €/mois, RGPD, disque persistant). Railway viable mais +50-100 % de coût. Vercel non compatible (app stateful avec SQLite + uploads).

Stack de mise en prod prévue : Caddy (reverse proxy + SSL auto) + pm2 (process manager) + cron hebdomadaire de backup chiffré vers OVH Object Storage.

## 🔒 Sécurité

Audit complet du projet : [`audit.md`](./audit.md) — classé par gravité (4 haut, 6 moyen, 7 faible, 7 info) avec scénarios d'attaque et remédiations chiffrées. ~1 jour de quick-wins avant mise en ligne publique.

## 📝 Features différées (memory)

- **Actualités en pages individuelles** + archive `/actualites` (~2 h)
- **Scripts de backup/restore** automatisés pour la prod (~3 h)
- **Notifications email** sur nouveau post forum (optionnel)
- **Reset password via email** : implémenté mais nécessite SMTP configuré
