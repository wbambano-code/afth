# AFTh — Site modernisé + Assistant IA

Refonte de [afth.asso.fr](https://afth.asso.fr).

## Stack
- **Frontend** : HTML/CSS/JS vanilla (zéro framework)
- **Backend** : Node.js + Express (API chat + fichiers statiques)
- **IA** : Claude Sonnet (Anthropic) via streaming SSE
- **Base de connaissance** : ~150 articles scrapés + 22 bulletins

## Démarrage

```bash
npm install
bash scripts/fetch-assets.sh       # Images + 22 PDFs
node scripts/scrape-articles.js    # ~2 min, 150 articles
cp .env.example .env               # Puis renseigne ANTHROPIC_API_KEY
npm start                          # → http://localhost:3000
```

## Déploiement Render.com
- Build: `npm install && node scripts/scrape-articles.js`
- Start: `npm start`
- Env var: `ANTHROPIC_API_KEY=sk-ant-...`
