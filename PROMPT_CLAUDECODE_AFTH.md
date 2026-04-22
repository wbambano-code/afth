# PROMPT À COLLER DANS CLAUDE CODE — Projet AFTh

---

Tu vas construire un site web complet de A à Z en suivant scrupuleusement le fichier CLAUDE.md présent dans ce répertoire. **Commence par le lire intégralement avant toute action.**

## Règles absolues d'exécution

- Tu exécutes TOUTES les étapes dans l'ordre, sans t'arrêter, sans poser de question, sans demander de validation.
- Tu n'interagis avec l'utilisateur qu'**une seule fois** : à la toute fin, pour signaler que tout est terminé et donner les commandes de démarrage.
- Si une image ou un PDF ne se télécharge pas (403/404), tu notes l'échec dans `ASSETS_MISSING.md` et tu continues immédiatement.
- Si `node scripts/scrape-articles.js` récupère moins de 40 articles, tu continues quand même — le chat fonctionnera avec ce qu'il y a.
- Tu ne tronques jamais un fichier. Tout code doit être complet, jusqu'au dernier accolade.
- Tu ne sautes aucune section HTML, aucune page, aucun composant CSS.

## Ordre d'exécution strict

1. Lire `CLAUDE.md` en entier
2. Créer toute l'arborescence des dossiers (`mkdir -p`)
3. Créer `package.json`, `.env.example`, `.gitignore`
4. Créer `scripts/fetch-assets.sh` puis l'exécuter : `bash scripts/fetch-assets.sh`
5. Créer `scripts/scrape-articles.js`
6. Créer `data/system-prompt.txt`
7. Créer `server.js`
8. Créer `css/main.css`
9. Créer `css/responsive.css`
10. Créer `js/main.js`
11. Créer `js/chat.js`
12. Créer `pages/index.html`
13. Créer `pages/association.html`
14. Créer `pages/congres.html`
15. Créer `pages/prix.html`
16. Créer `pages/archives.html`
17. Créer `pages/articles.html`
18. Créer `pages/contact.html`
19. Créer `README.md`
20. Exécuter `npm install`
21. Exécuter `node scripts/scrape-articles.js` (attendre la fin — prend ~2 minutes)
22. Effectuer toutes les vérifications listées dans CLAUDE.md Étape 12
23. Corriger automatiquement les problèmes détectés
24. Afficher le résumé final

## Message final attendu

À la fin et seulement à la fin, afficher :

```
✅ PROJET AFTh TERMINÉ

Pour démarrer :
1. cp .env.example .env
2. Ajouter ANTHROPIC_API_KEY dans .env
3. npm start → http://localhost:3000

Statistiques :
- X articles indexés dans data/articles.json
- 22 bulletins dans data/bulletins-index.json
- 7 pages HTML créées
- Assets téléchargés : voir ASSETS_MISSING.md si des fichiers manquent

Pour déployer sur Render.com :
- Build: npm install && node scripts/scrape-articles.js
- Start: npm start
- Env: ANTHROPIC_API_KEY=sk-ant-...
```

**Lance-toi maintenant. Commence par lire CLAUDE.md.**
