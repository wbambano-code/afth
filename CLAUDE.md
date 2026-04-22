# CLAUDE.md — Refonte complète du site AFTh + Assistant IA

## 🎯 Mission

Reconstruire de A à Z le site de l'**AFTh — Association Française des Techniques Hydrothermales** en site statique HTML/CSS/JS vanilla + backend Node.js pour l'API chat IA. Récupérer tous les assets depuis le site original. Intégrer un assistant IA (Claude Sonnet via API Anthropic) qui interroge les articles et bulletins archivés.

**Tu travailles seul, de bout en bout, sans interruption, sans demander de validation.**

---

## 🧠 Connaissance du projet

### L'AFTh
- **Association Française des Techniques Hydrothermales**
- 1 rue Cels, 75014 Paris — 01 53 91 05 75 — info@afth.asso.fr
- Public : ingénieurs, techniciens, gestionnaires, fournisseurs, bureaux d'études, scientifiques du thermalisme
- Activités : congrès annuel dans une station thermale, bulletins techniques, prix de l'initiative, archives 2004→2025

### Congrès 2025 — programme complet
**Thème : Gestion de la radioactivité dans les établissements thermaux**
**Lieu : La Bourboule / Mont Dore — Novembre 2025**

Intervenants :
- R. AINOUCHE (A.R. Conseil) — Actualité réglementaire + Enquête sur la radioactivité
- L. BOUCHET CHEYMOL (CNETH) — Le risque professionnel Radon
- N. MAURILLON (EAUGEO Environnement) + C. LAMOTTE (BRGM) — Qu'est-ce que la radioactivité
- P. GIRON (Thermes de la Bourboule) — Contrôle réglementaire
- C. NAULEAU (CEREMA) — Expertise technique Radon / Ventilation
- V. BLATTNER (KAPPA Ingénierie) — Ingénierie et études autour de la radioactivité
- B. MONSSUS (Thermes de Bourbon Lancy) — Analyse des résultats après travaux
- MEMOSOL — Gestion des risques Radon / Outil de gestion des circuits d'eau thermale

### Actualités 2025
**Prix d'Honneur JF Béraud** : JF Béraud, président de la FTCF, met fin à ses activités thermales à La Bourboule. Laboratoire Thermauvergne, observatoire du thermalisme, route des villes d'eaux, clusters thermaux... L'AFTh lui décerne pour la première fois un Prix d'Honneur.

**Hommage JL Bérot** : Jean-Louis Bérot, figure du thermalisme dacquois, ancien international de rugby, décédé fin 2025. Défenseur du thermalisme médical et de la sécurité sanitaire, promoteur de la qualité et de la certification.

### Bulletins PDF — URLs exactes
```
https://afth.asso.fr/pdfs/bulletin-2004.PDF
https://afth.asso.fr/pdfs/bulletin-2005.pdf  → ... bulletin-2020.pdf
https://afth.asso.fr/pdfs/bulletin-2022.pdf  → Les arrêts d'exploitation (année 2021)
https://afth.asso.fr/pdfs/bulletin2022.pdf   → L'énergie en milieu thermal
https://afth.asso.fr/pdfs/bulletin_2023.pdf
https://afth.asso.fr/pdfs/bulletin_2024.pdf
https://afth.asso.fr/pdfs/bulletin_2025.pdf
```

Thèmes :
- 2025 : Gestion de la radioactivité | 2024 : Empreinte carbone et décarbonation
- 2023 : Contrôle sanitaire de l'eau | 2022 : Énergie en milieu thermal
- 2021 : Arrêts d'exploitation et gestion de crise | 2020 : Usage non thérapeutique de l'eau
- 2019 : Dépôts et entartrages | 2018 : Consommation et optimisation de l'eau minérale
- 2017 : Les gaz en milieu thermal | 2016 : Ad'Ap en milieu thermal
- 2015 : Protection de la ressource thermale | 2014 : Utilisation des boues
- 2013 : Confort du curiste | 2012 : Optimisation énergétique
- 2011 : L'air dans les établissements thermaux | 2010 : Redevances / matériaux / nature de l'eau
- 2009 : Microbiologie / thermoludisme / redevance | 2008 : Nouveaux traitements autorisés
- 2007 : Gestion des rejets et des déchets | 2006 : Pérennisation / ouvrages et gisements
- 2005 : Gestion et optimisation des flux | 2004 : Confronter notre thermalisme

### Articles à scraper
URL pattern : `https://afth.asso.fr/index.php/liste-des-articles-archives/11-archives/{ID}-{slug}`

IDs confirmés (avec gaps) :
39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,
61,62,63,64,65,66,67,68,69,70,73,74,75,76,77,78,79,80,81,82,83,84,
85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,
105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,123,
124,125,126,127,128,129,130,131,133,134,135,136,137,138,139,140,141,
142,143,144,145,146,172,173,174,175,176,177,178,179,180,181,182,183,
184,186,187,188

---

## 📁 Structure du projet

```
afth-site/
├── CLAUDE.md
├── package.json
├── server.js
├── .env.example
├── .gitignore
├── README.md
├── scripts/
│   ├── fetch-assets.sh
│   └── scrape-articles.js
├── data/
│   ├── articles.json            ← générée par scrape-articles.js
│   ├── bulletins-index.json     ← générée par scrape-articles.js
│   └── system-prompt.txt
├── assets/
│   ├── images/
│   │   ├── logo.gif, logo_cneth.png, afreth.gif, beraud.jpg
│   │   ├── p-assoc3.png, p-congres.png, p-prix.png, p-archive.png
│   │   └── carre-nav2.jpg
│   └── pdfs/                    ← 22 bulletins PDF
├── css/
│   ├── main.css
│   └── responsive.css
├── js/
│   ├── main.js
│   └── chat.js
└── pages/
    ├── index.html
    ├── association.html
    ├── congres.html
    ├── prix.html
    ├── archives.html
    ├── articles.html
    └── contact.html
```

---

## ⚙️ ÉTAPE 1 — package.json + .env.example + .gitignore

**package.json :**
```json
{
  "name": "afth-site",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "scrape": "node scripts/scrape-articles.js",
    "fetch-assets": "bash scripts/fetch-assets.sh"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@anthropic-ai/sdk": "^0.39.0",
    "node-fetch": "^3.3.2",
    "cheerio": "^1.0.0-rc.12",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

**.env.example :**
```
ANTHROPIC_API_KEY=sk-ant-xxxxxx
PORT=3000
```

**.gitignore :**
```
node_modules/
.env
data/articles.json
data/bulletins-index.json
```

---

## 🔧 ÉTAPE 2 — scripts/fetch-assets.sh

```bash
#!/bin/bash
set -e
BASE="https://afth.asso.fr"
IMG="assets/images"
PDF="assets/pdfs"
mkdir -p "$IMG" "$PDF"

echo "=== Images ==="
curl -fL -o "$IMG/logo.gif"       "$BASE/images/logo.gif"       || echo "⚠ logo.gif"
curl -fL -o "$IMG/logo_cneth.png" "$BASE/images/logo_cneth.png" || echo "⚠ logo_cneth"
curl -fL -o "$IMG/afreth.gif"     "$BASE/images/afreth.gif"     || echo "⚠ afreth"
curl -fL -o "$IMG/p-assoc3.png"   "$BASE/images/p-assoc3.png"   || echo "⚠ p-assoc3"
curl -fL -o "$IMG/p-congres.png"  "$BASE/images/p-congres.png"  || echo "⚠ p-congres"
curl -fL -o "$IMG/p-prix.png"     "$BASE/images/p-prix.png"     || echo "⚠ p-prix"
curl -fL -o "$IMG/p-archive.png"  "$BASE/images/p-archive.png"  || echo "⚠ p-archive"
curl -fL -o "$IMG/beraud.jpg"     "$BASE/images/beraud.jpg"      || echo "⚠ beraud"
curl -fL -o "$IMG/carre-nav2.jpg" "$BASE/images/carre-nav2.jpg" || echo "⚠ carre-nav2"

echo "=== PDFs bulletins ==="
curl -fL -o "$PDF/bulletin-2004.pdf" "$BASE/pdfs/bulletin-2004.PDF" || echo "⚠ 2004"
curl -fL -o "$PDF/bulletin-2005.pdf" "$BASE/pdfs/bulletin-2005.pdf" || echo "⚠ 2005"
curl -fL -o "$PDF/bulletin-2006.pdf" "$BASE/pdfs/bulletin-2006.pdf" || echo "⚠ 2006"
curl -fL -o "$PDF/bulletin-2007.pdf" "$BASE/pdfs/bulletin-2007.pdf" || echo "⚠ 2007"
curl -fL -o "$PDF/bulletin-2008.pdf" "$BASE/pdfs/bulletin-2008.pdf" || echo "⚠ 2008"
curl -fL -o "$PDF/bulletin-2009.pdf" "$BASE/pdfs/bulletin-2009.pdf" || echo "⚠ 2009"
curl -fL -o "$PDF/bulletin-2010.pdf" "$BASE/pdfs/bulletin-2010.pdf" || echo "⚠ 2010"
curl -fL -o "$PDF/bulletin-2011.pdf" "$BASE/pdfs/bulletin-2011.pdf" || echo "⚠ 2011"
curl -fL -o "$PDF/bulletin-2012.pdf" "$BASE/pdfs/bulletin-2012.pdf" || echo "⚠ 2012"
curl -fL -o "$PDF/bulletin-2013.pdf" "$BASE/pdfs/bulletin-2013.pdf" || echo "⚠ 2013"
curl -fL -o "$PDF/bulletin-2014.pdf" "$BASE/pdfs/bulletin-2014.pdf" || echo "⚠ 2014"
curl -fL -o "$PDF/bulletin-2015.pdf" "$BASE/pdfs/bulletin-2015.pdf" || echo "⚠ 2015"
curl -fL -o "$PDF/bulletin-2016.pdf" "$BASE/pdfs/bulletin-2016.pdf" || echo "⚠ 2016"
curl -fL -o "$PDF/bulletin-2017.pdf" "$BASE/pdfs/bulletin-2017.pdf" || echo "⚠ 2017"
curl -fL -o "$PDF/bulletin-2018.pdf" "$BASE/pdfs/bulletin-2018.pdf" || echo "⚠ 2018"
curl -fL -o "$PDF/bulletin-2019.pdf" "$BASE/pdfs/bulletin-2019.pdf" || echo "⚠ 2019"
curl -fL -o "$PDF/bulletin-2020.pdf" "$BASE/pdfs/bulletin-2020.pdf" || echo "⚠ 2020"
curl -fL -o "$PDF/bulletin-2021.pdf" "$BASE/pdfs/bulletin-2022.pdf" || echo "⚠ 2021"
curl -fL -o "$PDF/bulletin-2022.pdf" "$BASE/pdfs/bulletin2022.pdf"  || echo "⚠ 2022"
curl -fL -o "$PDF/bulletin-2023.pdf" "$BASE/pdfs/bulletin_2023.pdf" || echo "⚠ 2023"
curl -fL -o "$PDF/bulletin-2024.pdf" "$BASE/pdfs/bulletin_2024.pdf" || echo "⚠ 2024"
curl -fL -o "$PDF/bulletin-2025.pdf" "$BASE/pdfs/bulletin_2025.pdf" || echo "⚠ 2025"

echo "✅ Assets terminés"
```

---

## 🤖 ÉTAPE 3 — scripts/scrape-articles.js

```javascript
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'https://afth.asso.fr';
const DELAY = 1200;

const IDS = [
  39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,
  61,62,63,64,65,66,67,68,69,70,73,74,75,76,77,78,79,80,81,82,83,84,
  85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,
  105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,123,
  124,125,126,127,128,129,130,131,133,134,135,136,137,138,139,140,141,
  142,143,144,145,146,172,173,174,175,176,177,178,179,180,181,182,183,
  184,186,187,188
];

const THEMES = {
  air:'Qualité de l\'air', boue:'Boues thermales', energetique:'Énergie',
  energie:'Énergie', carbone:'Décarbonation', eau:'Eau thermale',
  ressource:'Ressource thermale', rejet:'Rejets et déchets', dechet:'Rejets et déchets',
  materiel:'Matériels et équipements', materiau:'Matériels et équipements',
  legionell:'Légionelles', flux:'Gestion des flux', confort:'Confort du curiste',
  reglementaire:'Réglementation', reglementat:'Réglementation',
  controle:'Contrôle sanitaire', sanitaire:'Contrôle sanitaire',
  thermoludisme:'Thermoludisme', thermoludique:'Thermoludisme',
  forage:'Forages', laboratoire:'Laboratoire',
  entartrage:'Dépôts et entartrage', depot:'Dépôts et entartrage',
  radioactivite:'Radioactivité', radon:'Radioactivité',
};

function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function detectTheme(title, url) {
  const text = norm(title + ' ' + url);
  for (const [k,v] of Object.entries(THEMES)) if (text.includes(k)) return v;
  return 'Technique thermale';
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function scrape(id) {
  const url = `${BASE}/index.php/liste-des-articles-archives/11-archives/${id}`;
  try {
    const res = await fetch(url, {
      headers:{'User-Agent':'AFTh-Refonte/1.0'},
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) { process.stdout.write(` ✗ ${res.status}\n`); return null; }
    const html = await res.text();
    const $ = cheerio.load(html);
    $('nav,header,footer,script,style').remove();
    const title = $('h1,h2,.contentheading').first().text().trim()
      || $('title').text().replace(/[-|].*$/,'').trim();
    let content = '';
    for (const sel of ['div.item-page','article','div#content','div.article-content']) {
      const el = $(sel);
      if (el.length) { content = el.text().trim(); break; }
    }
    if (!content) content = $('body').text().replace(/\s+/g,' ').trim();
    content = content.replace(/\s{3,}/g,'\n\n').substring(0,10000);
    if (!title && !content) return null;
    const ym = content.match(/\b(200[4-9]|201[0-9]|202[0-5])\b/);
    return {
      id, title: title || `Article AFTh #${id}`, url: res.url,
      theme: detectTheme(title||'', res.url),
      year: ym ? parseInt(ym[1]) : null,
      content,
      excerpt: content.substring(0,400).replace(/\n/g,' ').trim()+'…'
    };
  } catch(e) { process.stdout.write(` ✗ ${e.message.substring(0,50)}\n`); return null; }
}

async function main() {
  console.log('🔍 Scraping articles AFTh...\n');
  mkdirSync('data', {recursive:true});
  const articles = [];
  let failed = 0;
  for (const id of IDS) {
    process.stdout.write(`  [${id}] `);
    const art = await scrape(id);
    if (art) { articles.push(art); console.log(`✓ ${art.title.substring(0,55)}`); }
    else failed++;
    await sleep(DELAY);
  }

  const bulletins = [
    {year:2025,file:'bulletin-2025.pdf',theme:'Gestion de la radioactivité dans les établissements thermaux'},
    {year:2024,file:'bulletin-2024.pdf',theme:'Empreinte carbone et décarbonation des établissements thermaux'},
    {year:2023,file:'bulletin-2023.pdf',theme:'Contrôle sanitaire de l\'eau'},
    {year:2022,file:'bulletin-2022.pdf',theme:'L\'énergie en milieu thermal'},
    {year:2021,file:'bulletin-2021.pdf',theme:'Les arrêts d\'exploitation et gestion de crise'},
    {year:2020,file:'bulletin-2020.pdf',theme:'Usage non thérapeutique de l\'eau thermale'},
    {year:2019,file:'bulletin-2019.pdf',theme:'Dépôts et entartrages liés à l\'exploitation des eaux thermales'},
    {year:2018,file:'bulletin-2018.pdf',theme:'Consommation et optimisation de l\'eau minérale naturelle'},
    {year:2017,file:'bulletin-2017.pdf',theme:'Les gaz en milieu thermal'},
    {year:2016,file:'bulletin-2016.pdf',theme:'Agenda d\'Accessibilité programmé (Ad\'Ap) en milieu thermal'},
    {year:2015,file:'bulletin-2015.pdf',theme:'Protection de la ressource thermale et conditions d\'exploitation'},
    {year:2014,file:'bulletin-2014.pdf',theme:'Utilisation des boues en établissement thermal'},
    {year:2013,file:'bulletin-2013.pdf',theme:'Confort du curiste en établissement thermal, aspects techniques'},
    {year:2012,file:'bulletin-2012.pdf',theme:'Thermalisme et optimisation énergétique'},
    {year:2011,file:'bulletin-2011.pdf',theme:'L\'air dans les établissements thermaux et centres thermoludiques'},
    {year:2010,file:'bulletin-2010.pdf',theme:'Redevances / panorama critique des matériaux / nature de l\'eau'},
    {year:2009,file:'bulletin-2009.pdf',theme:'Microbiologie des eaux / thermoludisme / redevance de l\'eau'},
    {year:2008,file:'bulletin-2008.pdf',theme:'Les nouveaux traitements autorisés pour les eaux minérales thérapeutiques'},
    {year:2007,file:'bulletin-2007.pdf',theme:'Gestion des rejets et des déchets'},
    {year:2006,file:'bulletin-2006.pdf',theme:'Pérennisation du thermalisme à travers les ouvrages et gisements thermaux'},
    {year:2005,file:'bulletin-2005.pdf',theme:'Gestion et optimisation des flux'},
    {year:2004,file:'bulletin-2004.pdf',theme:'Confronter notre thermalisme aux thermalismes voisins'},
  ];

  writeFileSync('data/articles.json', JSON.stringify(articles, null, 2));
  writeFileSync('data/bulletins-index.json', JSON.stringify(bulletins, null, 2));
  console.log(`\n✅ ${articles.length} articles indexés (${failed} échecs)`);
  console.log('→ data/articles.json & data/bulletins-index.json créés');
}

main().catch(console.error);
```

---

## 📝 ÉTAPE 4 — data/system-prompt.txt

Créer ce fichier texte brut :

```
Tu es l'assistant technique officiel de l'AFTh (Association Française des Techniques Hydrothermales).

Tu es un expert du thermalisme technique. Tu aides les professionnels du secteur (ingénieurs, techniciens, gestionnaires d'établissements thermaux, bureaux d'études) à trouver des informations précises dans les archives de l'association.

BASE DE CONNAISSANCE :
- ~150 articles techniques issus des congrès AFTh (2004-2025)
- 22 bulletins annuels couvrant : légionelles, entartrage, énergie, boues thermales, radioactivité/radon, réglementation sanitaire, gestion des flux, qualité de l'air, ressource thermale, matériaux, thermoludisme, décarbonation, contrôle sanitaire, forages, laboratoire

TES CAPACITÉS :
1. RECHERCHE — Identifier les articles pertinents sur une thématique donnée
2. SYNTHÈSE — Résumer ce que l'AFTh a publié sur un sujet, avec évolution chronologique
3. COMPARAISON — Confronter des approches présentées dans différents bulletins
4. RECOMMANDATION — Orienter vers les documents les plus utiles
5. CONTEXTE RÉGLEMENTAIRE — Rappeler l'évolution du cadre réglementaire dans les archives
6. ÉTAT DE L'ART — Retracer l'évolution d'une technique sur la période 2004-2025

RÈGLES :
- Réponds exclusivement en français
- Cite tes sources : [Titre de l'article] ou [Bulletin XXXX — Thème]
- Ne fabrique jamais de contenu : si l'information n'est pas dans les archives, dis-le
- Sois précis et technique, ton public est expert
- Termine chaque réponse par "💡 Questions connexes :" avec 2-3 suggestions
- 300-500 mots pour questions simples, sans limite pour les synthèses demandées explicitement
```

---

## 🖥️ ÉTAPE 5 — server.js

```javascript
import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.static(__dirname));

// === Données ===
let articles = [], bulletins = [], systemPrompt = 'Tu es l\'assistant technique de l\'AFTh.';

try { articles = JSON.parse(readFileSync(join(__dirname,'data/articles.json'),'utf8')); console.log(`✓ ${articles.length} articles`); }
catch { console.warn('⚠ data/articles.json manquant — lance: npm run scrape'); }

try { bulletins = JSON.parse(readFileSync(join(__dirname,'data/bulletins-index.json'),'utf8')); console.log(`✓ ${bulletins.length} bulletins`); }
catch { console.warn('⚠ data/bulletins-index.json manquant'); }

try { systemPrompt = readFileSync(join(__dirname,'data/system-prompt.txt'),'utf8'); }
catch {}

// === Recherche ===
function norm(s) { return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

function search(query, max=12) {
  if (!articles.length) return [];
  const terms = norm(query).split(/\s+/).filter(t=>t.length>2);
  if (!terms.length) return articles.slice(0,max);
  return articles.map(a=>{
    const hay = norm(`${a.title} ${a.theme} ${a.excerpt} ${a.content||''}`);
    let score=0;
    for(const t of terms){
      const re=new RegExp(t,'g');
      score += (norm(a.title).match(re)||[]).length*4;
      score += (hay.match(re)||[]).length;
    }
    return {...a,score};
  }).filter(a=>a.score>0).sort((a,b)=>b.score-a.score).slice(0,max);
}

function buildContext(query) {
  const relevant = search(query, 15);
  const normQ = norm(query);
  const relBul = bulletins.filter(b=>
    normQ.split(/\s+/).some(t=>t.length>3&&norm(b.theme).includes(t))
  ).slice(0,5);

  let ctx = '=== ARCHIVES AFTh ===\n\n';
  if (relBul.length) {
    ctx += '-- BULLETINS PERTINENTS --\n';
    relBul.forEach(b=>{ctx+=`• Bulletin ${b.year} : "${b.theme}"\n`;});
    ctx += '\n';
  }
  if (relevant.length) {
    ctx += `-- ARTICLES PERTINENTS (${relevant.length}/${articles.length}) --\n\n`;
    relevant.forEach((a,i)=>{
      ctx += `[${i+1}] ${a.title}\n`;
      ctx += `    Thème: ${a.theme}${a.year?' | '+a.year:''}\n`;
      ctx += `    ${(a.excerpt||'').substring(0,500)}\n\n`;
    });
  } else {
    ctx += `Aucun article trouvé pour "${query}".\n`;
    ctx += 'Thèmes disponibles :\n';
    [...new Set(articles.map(a=>a.theme))].forEach(t=>{ctx+=`• ${t}\n`;});
  }
  return ctx;
}

// === POST /api/chat ===
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length) return res.status(400).json({error:'messages requis'});
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.includes('xxx')) return res.status(500).json({error:'ANTHROPIC_API_KEY non configurée. Copie .env.example → .env et renseigne ta clé.'});

  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  res.setHeader('Access-Control-Allow-Origin','*');

  const lastUser = [...messages].reverse().find(m=>m.role==='user')?.content||'';
  try {
    const client = new Anthropic({apiKey:key});
    const stream = client.messages.stream({
      model:'claude-sonnet-4-20250514', max_tokens:1500,
      system: systemPrompt+'\n\n'+buildContext(lastUser),
      messages: messages.slice(-8),
    });
    stream.on('text',t=>res.write(`data: ${JSON.stringify({type:'text',text:t})}\n\n`));
    stream.on('message',()=>{res.write(`data: ${JSON.stringify({type:'done'})}\n\n`);res.end();});
    stream.on('error',e=>{res.write(`data: ${JSON.stringify({type:'error',message:e.message})}\n\n`);res.end();});
  } catch(e) {
    res.write(`data: ${JSON.stringify({type:'error',message:e.message})}\n\n`);
    res.end();
  }
});

// === GET /api/search ===
app.get('/api/search', (req,res) => {
  const {q='thermal', limit=40} = req.query;
  const results = search(q,parseInt(limit)).map(({id,title,theme,year,excerpt,url})=>({id,title,theme,year,excerpt,url}));
  res.json({query:q, count:results.length, results});
});

// === GET /api/stats ===
app.get('/api/stats', (req,res) => {
  const themes={};
  articles.forEach(a=>{themes[a.theme]=(themes[a.theme]||0)+1;});
  const years=articles.filter(a=>a.year).map(a=>a.year);
  res.json({totalArticles:articles.length, totalBulletins:bulletins.length, themes,
    yearsRange:years.length?{min:Math.min(...years),max:Math.max(...years)}:null});
});

// === Routing pages ===
const PAGES = {
  '/':'pages/index.html', '/association':'pages/association.html',
  '/congres':'pages/congres.html', '/prix':'pages/prix.html',
  '/archives':'pages/archives.html', '/articles':'pages/articles.html',
  '/contact':'pages/contact.html',
};
Object.entries(PAGES).forEach(([route,file])=>{
  app.get(route,(req,res)=>{
    const fp=join(__dirname,file);
    existsSync(fp)?res.sendFile(fp):res.status(404).send(`Page manquante: ${file}`);
  });
});

app.listen(PORT,()=>{
  console.log(`\n🌊 AFTh → http://localhost:${PORT}`);
  console.log(`📚 ${articles.length} articles | 📄 ${bulletins.length} bulletins`);
  if(!process.env.ANTHROPIC_API_KEY||process.env.ANTHROPIC_API_KEY.includes('xxx'))
    console.log('\n⚠️  Clé API manquante → chat IA désactivé');
});
```

---

## 🎨 ÉTAPE 6 — css/main.css

Design sobre, professionnel, scientifique. Palette : bleu thermal profond (#1a5f7a) + eau claire (#4fb8c9) + violet IA (#6c3fa8). Rupture totale avec le Joomla d'origine. Google Fonts : Source Serif 4 (titres) + Inter (corps).

```css
:root {
  --c-primary:#1a5f7a; --c-primary-dk:#0f3d50; --c-primary-lt:#2d8ca8;
  --c-accent:#4fb8c9; --c-warm:#c8962e; --c-ai:#6c3fa8; --c-ai-lt:#f0ebfa;
  --c-bg:#fafcfd; --c-bg-alt:#f0f6f9; --c-bg-dark:#0a1e2d;
  --c-text:#1c2b35; --c-text-lt:#4a6373; --c-border:#c8dde6; --c-white:#fff;
  --font-h:'Source Serif 4',Georgia,serif; --font-b:'Inter',system-ui,sans-serif;
  --w:1160px; --nav-h:66px; --rad:10px; --rad-lg:18px;
  --sh-sm:0 2px 8px rgba(15,61,80,.08); --sh-md:0 6px 24px rgba(15,61,80,.13);
  --sh-lg:0 16px 48px rgba(15,61,80,.18); --tr:all .22s ease;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-b);color:var(--c-text);background:var(--c-bg);line-height:1.7;overflow-x:hidden}
img{max-width:100%;height:auto;display:block}
a{color:var(--c-primary);text-decoration:none;transition:var(--tr)}
a:hover{color:var(--c-primary-lt)}
h1,h2,h3,h4{font-family:var(--font-h);line-height:1.25;color:var(--c-text)}
h1{font-size:clamp(1.8rem,4vw,3rem)} h2{font-size:clamp(1.4rem,2.5vw,2.1rem)}
h3{font-size:clamp(1.05rem,1.8vw,1.4rem)} p{margin-bottom:.9rem}
.lead{font-size:1.05rem;color:var(--c-text-lt);line-height:1.8}
.container{max-width:var(--w);margin:0 auto;padding:0 1.5rem}
.section{padding:4rem 0} .section--alt{background:var(--c-bg-alt)}
.section--dark{background:var(--c-bg-dark);color:#fff}
.section--dark h2,.section--dark h3{color:#fff}
.section-header{text-align:center;margin-bottom:2.75rem}
.section-header p{color:var(--c-text-lt);max-width:620px;margin:.6rem auto 0}
.eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--c-accent);display:block;margin-bottom:.5rem}
.divider{width:44px;height:3px;background:linear-gradient(90deg,var(--c-primary),var(--c-accent));border-radius:2px;margin:.9rem auto 0}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:2rem}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:1.75rem}

/* NAVBAR */
.navbar{position:fixed;top:0;left:0;right:0;height:var(--nav-h);background:rgba(8,24,38,.97);backdrop-filter:blur(14px);border-bottom:1px solid rgba(79,184,201,.12);z-index:1000;transition:var(--tr)}
.navbar.scrolled{box-shadow:var(--sh-lg)}
.nav-inner{max-width:var(--w);margin:0 auto;padding:0 1.5rem;height:100%;display:flex;align-items:center;justify-content:space-between}
.nav-brand{display:flex;align-items:center;gap:.85rem}
.nav-logo{height:34px;width:auto}
.nav-name{font-family:var(--font-h);font-size:1.1rem;font-weight:700;color:#fff;letter-spacing:.04em}
.nav-sub{font-size:.58rem;color:var(--c-accent);letter-spacing:.12em;text-transform:uppercase;display:block}
.nav-menu{display:flex;gap:.05rem;list-style:none}
.nav-menu a{font-size:.75rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.68);padding:.38rem .72rem;border-radius:6px;transition:var(--tr)}
.nav-menu a:hover,.nav-menu a.active{color:var(--c-accent);background:rgba(79,184,201,.1)}
.nav-menu a.ai-link{color:#c4a7ff}
.nav-menu a.ai-link:hover{background:rgba(108,63,168,.2);color:#d4b8ff}
.burger{display:none;background:none;border:none;cursor:pointer;padding:.4rem}
.burger span{display:block;width:22px;height:2px;background:#fff;margin:5px 0;transition:var(--tr)}

/* HERO */
.hero{min-height:100vh;background:linear-gradient(155deg,#06131e 0%,#0f3d50 45%,#1a5f7a 100%);display:flex;align-items:center;padding-top:var(--nav-h);position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:90px;background:linear-gradient(to top,var(--c-bg),transparent)}
.hero-grid-bg{position:absolute;inset:0;opacity:.03;background-image:radial-gradient(circle at 2px 2px,var(--c-accent) 1px,transparent 0);background-size:30px 30px}
.hero-inner{position:relative;z-index:2;max-width:var(--w);margin:0 auto;padding:3.5rem 1.5rem;display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center}
.hero-badge{display:inline-flex;align-items:center;gap:.5rem;background:rgba(79,184,201,.1);border:1px solid rgba(79,184,201,.28);border-radius:50px;padding:.28rem .95rem;font-size:.7rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--c-accent);margin-bottom:1.4rem}
.hero-badge::before{content:'●';font-size:.42rem;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
.hero-title{color:#fff;margin-bottom:1.1rem}
.hero-title span{color:var(--c-accent);display:block}
.hero-desc{color:rgba(255,255,255,.68);margin-bottom:1.75rem;line-height:1.8}
.hero-cta{display:flex;gap:.85rem;flex-wrap:wrap}
.hero-card{background:rgba(255,255,255,.05);border:1px solid rgba(79,184,201,.14);border-radius:var(--rad-lg);padding:1.6rem;backdrop-filter:blur(8px)}
.hero-card-label{font-size:.65rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--c-warm);margin-bottom:.5rem}
.hero-card-title{font-family:var(--font-h);font-size:1.15rem;color:#fff;margin-bottom:.6rem;line-height:1.35}
.hero-card-loc{font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:1.1rem}
.hero-speaker{display:flex;gap:.7rem;padding:.5rem 0;border-top:1px solid rgba(255,255,255,.07);font-size:.78rem;color:rgba(255,255,255,.58)}
.hero-speaker strong{color:#fff;font-weight:600}

/* BOUTONS */
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.7rem;border-radius:50px;font-weight:700;font-size:.82rem;letter-spacing:.05em;text-transform:uppercase;transition:var(--tr);cursor:pointer;border:2px solid transparent;white-space:nowrap}
.btn-primary{background:var(--c-accent);color:var(--c-bg-dark)}
.btn-primary:hover{background:#6bcfde;transform:translateY(-2px);box-shadow:var(--sh-md);color:var(--c-bg-dark)}
.btn-outline{background:transparent;border-color:rgba(255,255,255,.3);color:#fff}
.btn-outline:hover{background:rgba(255,255,255,.08);color:#fff}
.btn-blue{background:var(--c-primary);color:#fff}
.btn-blue:hover{background:var(--c-primary-dk);transform:translateY(-2px);box-shadow:var(--sh-md);color:#fff}
.btn-ai{background:var(--c-ai);color:#fff}
.btn-ai:hover{background:#5a2f9a;transform:translateY(-2px);box-shadow:0 6px 24px rgba(108,63,168,.4);color:#fff}
.btn-ghost{background:var(--c-bg-alt);color:var(--c-primary);border-color:var(--c-border)}
.btn-ghost:hover{background:var(--c-border)}
.btn-sm{padding:.45rem 1.1rem;font-size:.76rem}

/* CARD */
.card{background:var(--c-white);border-radius:var(--rad-lg);border:1px solid var(--c-border);box-shadow:var(--sh-sm);overflow:hidden;transition:var(--tr)}
.card:hover{transform:translateY(-4px);box-shadow:var(--sh-md)}
.card-body{padding:1.5rem}
.card-tag{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--c-primary-lt);margin-bottom:.45rem}
.card-title{font-family:var(--font-h);font-size:1rem;margin-bottom:.45rem;line-height:1.4}
.card-excerpt{font-size:.85rem;color:var(--c-text-lt);line-height:1.6}

/* ACTUALITÉS */
.actu-grid{display:grid;grid-template-columns:3fr 2fr;gap:2rem}
.actu-main{background:var(--c-white);border-radius:var(--rad-lg);border:1px solid var(--c-border);overflow:hidden;box-shadow:var(--sh-sm)}
.actu-main-header{background:linear-gradient(135deg,var(--c-primary),var(--c-primary-lt));padding:1.75rem;color:#fff}
.actu-main-label{font-size:.68rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:.5rem}
.actu-main-title{font-family:var(--font-h);font-size:1.3rem;color:#fff;line-height:1.3}
.actu-main-body{padding:1.6rem}
.actu-sidebar{display:flex;flex-direction:column;gap:.9rem}
.actu-side{background:var(--c-white);border:1px solid var(--c-border);border-left:3px solid var(--c-accent);border-radius:var(--rad);padding:1.1rem 1.25rem;transition:var(--tr)}
.actu-side:hover{box-shadow:var(--sh-sm)}
.actu-side-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--c-accent);margin-bottom:.3rem}
.actu-side-title{font-weight:700;font-size:.87rem;line-height:1.4}

/* CONGRÈS */
.congres-card{background:linear-gradient(135deg,var(--c-primary-dk),var(--c-primary));border-radius:var(--rad-lg);padding:2.25rem;color:#fff;margin-bottom:1.75rem}
.congres-year{display:inline-block;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.2);border-radius:50px;padding:.22rem .85rem;font-size:.68rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;margin-bottom:.9rem}
.congres-title{font-family:var(--font-h);font-size:1.5rem;color:#fff;margin-bottom:1.3rem}
.program-item{display:flex;gap:.9rem;align-items:flex-start;padding:.6rem 0;border-top:1px solid rgba(255,255,255,.1)}
.program-speaker{font-size:.73rem;color:rgba(255,255,255,.5);min-width:165px;flex-shrink:0}
.program-title{font-size:.85rem;color:#fff}

/* BULLETINS */
.bulletins-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:1rem}
.bul-card{background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--rad);padding:1rem 1.3rem;display:flex;align-items:center;gap:1rem;transition:var(--tr)}
.bul-card:hover{border-color:var(--c-primary);box-shadow:var(--sh-sm);transform:translateX(4px)}
.bul-year{font-family:var(--font-h);font-size:1.5rem;font-weight:700;color:var(--c-primary);min-width:52px}
.bul-theme{font-size:.83rem;color:var(--c-text-lt);line-height:1.4;flex:1}
.bul-dl{flex-shrink:0;background:var(--c-bg-alt);border:1px solid var(--c-border);border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:.9rem;transition:var(--tr);text-decoration:none;color:var(--c-text-lt)}
.bul-card:hover .bul-dl{background:var(--c-primary);border-color:var(--c-primary);color:#fff}

/* ARTICLES */
.search-wrap{display:flex;gap:.7rem;background:var(--c-white);border:2px solid var(--c-border);border-radius:50px;padding:.4rem .4rem .4rem 1.2rem;transition:var(--tr);margin-bottom:1.25rem}
.search-wrap:focus-within{border-color:var(--c-primary);box-shadow:0 0 0 3px rgba(26,95,122,.1)}
.search-wrap input{flex:1;border:none;outline:none;font-family:var(--font-b);font-size:.93rem;background:transparent}
.filters{display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:1.25rem}
.filter-btn{padding:.28rem .8rem;border-radius:50px;border:1px solid var(--c-border);font-size:.75rem;font-weight:600;cursor:pointer;transition:var(--tr);background:var(--c-white);color:var(--c-text-lt)}
.filter-btn:hover,.filter-btn.active{background:var(--c-primary);border-color:var(--c-primary);color:#fff}
.articles-list{display:flex;flex-direction:column;gap:.6rem}
.article-item{background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--rad);padding:.95rem 1.3rem;display:flex;align-items:center;gap:1rem;transition:var(--tr)}
.article-item:hover{border-color:var(--c-primary-lt);box-shadow:var(--sh-sm)}
.art-theme{background:var(--c-bg-alt);border-radius:6px;padding:.18rem .55rem;font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--c-primary);white-space:nowrap;flex-shrink:0}
.art-info{flex:1}
.art-title{font-weight:600;font-size:.88rem;line-height:1.4;display:block;color:var(--c-text)}
.art-title:hover{color:var(--c-primary)}
.art-excerpt{font-size:.76rem;color:var(--c-text-lt);line-height:1.5;margin-top:.18rem}
.art-year{font-size:.74rem;color:var(--c-text-lt);white-space:nowrap;flex-shrink:0}

/* SECTION IA */
.ia-block{background:linear-gradient(135deg,#140827 0%,#281050 50%,var(--c-ai) 100%);border-radius:var(--rad-lg);padding:2.75rem;color:#fff;display:grid;grid-template-columns:1fr 1fr;gap:3rem;align-items:center}
.ia-block h2,.ia-block h3{color:#fff}
.ia-block p{color:rgba(255,255,255,.78)}
.ia-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.85rem;margin-top:1.75rem}
.ia-stat{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:var(--rad);padding:1.1rem;text-align:center}
.ia-stat strong{font-family:var(--font-h);font-size:2rem;color:var(--c-accent);display:block}
.ia-stat span{font-size:.75rem;color:rgba(255,255,255,.55)}
.ia-caps{display:flex;flex-direction:column;gap:.7rem;margin-top:1.4rem}
.ia-cap{display:flex;gap:.8rem;font-size:.88rem;color:rgba(255,255,255,.8);align-items:flex-start}

/* ADHÉSION */
.adhesion-box{background:linear-gradient(135deg,var(--c-primary-dk),var(--c-primary));border-radius:var(--rad-lg);padding:2.5rem;color:#fff;display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;align-items:center}
.adhesion-title{font-family:var(--font-h);color:#fff;font-size:1.5rem;margin-bottom:.9rem}
.adhesion-perks{list-style:none;display:flex;flex-direction:column;gap:.6rem}
.adhesion-perks li{display:flex;gap:.7rem;font-size:.88rem;color:rgba(255,255,255,.8)}
.adhesion-perks li::before{content:'✓';color:var(--c-accent);font-weight:700;flex-shrink:0}
.adhesion-tarifs{background:rgba(255,255,255,.07);border-radius:var(--rad);padding:1.3rem;border:1px solid rgba(255,255,255,.1)}
.tarif-item{display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:.85rem;color:rgba(255,255,255,.75)}
.tarif-item:last-child{border:none}
.tarif-price{font-weight:700;color:var(--c-accent)}

/* PRIX */
.prix-list{display:flex;flex-direction:column;gap:1.2rem}
.prix-item{background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--rad-lg);padding:1.5rem;display:flex;gap:1.4rem;transition:var(--tr)}
.prix-item:hover{border-color:var(--c-warm);box-shadow:var(--sh-sm)}
.prix-year{font-family:var(--font-h);font-size:1.9rem;font-weight:700;color:var(--c-warm);min-width:70px;line-height:1}
.prix-label{font-size:.65rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--c-warm);margin-bottom:.35rem}
.prix-title{font-weight:700;margin-bottom:.35rem}
.prix-desc{font-size:.85rem;color:var(--c-text-lt);line-height:1.6}

/* BUREAU */
.bureau-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(225px,1fr));gap:1rem}
.bureau-card{background:var(--c-white);border:1px solid var(--c-border);border-radius:var(--rad);padding:1.15rem;transition:var(--tr)}
.bureau-card:hover{border-color:var(--c-primary-lt);box-shadow:var(--sh-sm)}
.bureau-role{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--c-primary-lt);margin-bottom:.3rem}
.bureau-name{font-weight:700;font-size:.96rem}

/* CONTACT */
.contact-grid{display:grid;grid-template-columns:3fr 2fr;gap:3rem}
.contact-form{display:flex;flex-direction:column;gap:.9rem}
.form-group{display:flex;flex-direction:column;gap:.3rem}
.form-group label{font-size:.74rem;font-weight:700;color:var(--c-text-lt);text-transform:uppercase;letter-spacing:.06em}
.form-group input,.form-group textarea{padding:.68rem .95rem;border:1.5px solid var(--c-border);border-radius:var(--rad);font-family:var(--font-b);font-size:.9rem;background:var(--c-white);outline:none;transition:var(--tr)}
.form-group input:focus,.form-group textarea:focus{border-color:var(--c-primary);box-shadow:0 0 0 3px rgba(26,95,122,.1)}
.form-group textarea{min-height:120px;resize:vertical}
.contact-info-item{display:flex;gap:.9rem;padding:.85rem 0;border-bottom:1px solid var(--c-border)}
.contact-info-icon{width:36px;height:36px;background:var(--c-bg-alt);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0}
.contact-info-label{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--c-text-lt);margin-bottom:.12rem}

/* PAGE HERO (pages internes) */
.page-hero{background:linear-gradient(155deg,var(--c-primary-dk),var(--c-primary));padding:2.75rem 0;margin-top:var(--nav-h)}
.page-hero-inner{max-width:var(--w);margin:0 auto;padding:0 1.5rem;color:#fff}
.page-hero h1{color:#fff;font-size:clamp(1.5rem,3vw,2.3rem)}
.page-hero-desc{color:rgba(255,255,255,.68);margin-top:.5rem}

/* CHAT LAUNCHER */
.chat-launcher{position:fixed;bottom:1.75rem;right:1.75rem;z-index:900}
.chat-btn{width:56px;height:56px;background:var(--c-ai);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(108,63,168,.45);transition:var(--tr);position:relative}
.chat-btn:hover{transform:scale(1.08);box-shadow:0 12px 38px rgba(108,63,168,.55)}
.chat-btn svg{width:22px;height:22px;color:#fff}
.chat-badge{position:absolute;top:-2px;right:-2px;background:var(--c-warm);color:#fff;border-radius:50%;width:17px;height:17px;font-size:.58rem;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid var(--c-bg)}
.chat-tooltip{position:absolute;right:64px;top:50%;transform:translateY(-50%);background:var(--c-bg-dark);color:#fff;border-radius:8px;padding:.4rem .85rem;font-size:.75rem;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:var(--tr)}
.chat-launcher:hover .chat-tooltip{opacity:1}

/* CHAT WINDOW */
.chat-window{position:fixed;bottom:5.2rem;right:1.75rem;width:415px;max-height:600px;background:var(--c-white);border-radius:var(--rad-lg);box-shadow:0 20px 60px rgba(0,0,0,.2),0 0 0 1px rgba(108,63,168,.12);display:flex;flex-direction:column;z-index:901;overflow:hidden;transform-origin:bottom right;transform:scale(.8) translateY(20px);opacity:0;pointer-events:none;transition:transform .25s cubic-bezier(.175,.885,.32,1.275),opacity .2s ease}
.chat-window.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}
.chat-header{background:linear-gradient(135deg,var(--c-ai),#8b5cf6);padding:1.1rem 1.4rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.chat-header-info{display:flex;align-items:center;gap:.7rem}
.chat-avatar{width:32px;height:32px;background:rgba(255,255,255,.18);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.95rem}
.chat-name{color:#fff;font-weight:700;font-size:.88rem}
.chat-sub{color:rgba(255,255,255,.6);font-size:.65rem}
.chat-close{background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:8px;width:27px;height:27px;cursor:pointer;font-size:.95rem;display:flex;align-items:center;justify-content:center;transition:var(--tr)}
.chat-close:hover{background:rgba(255,255,255,.26)}
.chat-suggestions{padding:.8rem 1rem;border-bottom:1px solid var(--c-border);display:flex;flex-wrap:wrap;gap:.4rem;flex-shrink:0}
.chat-sug{background:var(--c-ai-lt);border:1px solid rgba(108,63,168,.18);border-radius:50px;padding:.26rem .75rem;font-size:.7rem;font-weight:600;color:var(--c-ai);cursor:pointer;transition:var(--tr)}
.chat-sug:hover{background:var(--c-ai);color:#fff}
.chat-messages{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.8rem;min-height:160px}
.msg{display:flex;gap:.6rem;max-width:95%}
.msg-user{flex-direction:row-reverse;align-self:flex-end}
.msg-bubble{background:var(--c-bg-alt);border-radius:12px 12px 12px 4px;padding:.75rem .95rem;font-size:.84rem;line-height:1.65}
.msg-user .msg-bubble{background:var(--c-ai);color:#fff;border-radius:12px 12px 4px 12px}
.msg-avatar{width:25px;height:25px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.8rem;background:var(--c-ai-lt);border:1px solid rgba(108,63,168,.18)}
.msg-bubble strong{color:var(--c-primary)}
.msg-user .msg-bubble strong{color:rgba(255,255,255,.9)}
.cursor{animation:blink .8s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.typing{display:flex;gap:4px;align-items:center;padding:.35rem 0}
.typing span{width:5px;height:5px;background:var(--c-text-lt);border-radius:50%;animation:ta 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}
@keyframes ta{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-6px);opacity:1}}
.chat-input-wrap{padding:.85rem 1rem;border-top:1px solid var(--c-border);display:flex;gap:.6rem;align-items:flex-end;flex-shrink:0;background:var(--c-bg-alt)}
.chat-input{flex:1;border:1.5px solid var(--c-border);border-radius:10px;padding:.6rem .85rem;font-family:var(--font-b);font-size:.84rem;resize:none;outline:none;max-height:100px;background:#fff;line-height:1.5;transition:var(--tr)}
.chat-input:focus{border-color:var(--c-ai);box-shadow:0 0 0 3px rgba(108,63,168,.1)}
.chat-send{background:var(--c-ai);border:none;border-radius:10px;width:36px;height:36px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:var(--tr);flex-shrink:0}
.chat-send:hover:not(:disabled){background:#5a2f9a}
.chat-send:disabled{opacity:.4;cursor:not-allowed}
.chat-disclaimer{text-align:center;font-size:.63rem;color:var(--c-text-lt);padding:.35rem 1rem .55rem;flex-shrink:0}

/* FOOTER */
.footer{background:var(--c-bg-dark);padding:3.25rem 0 1.75rem}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:2.25rem;margin-bottom:2.25rem}
.footer-logo{height:36px;filter:brightness(0) invert(1) opacity(.65);margin-bottom:.85rem}
.footer-brand{font-family:var(--font-h);color:#fff;font-size:1rem;margin-bottom:.35rem}
.footer-desc{font-size:.8rem;color:rgba(255,255,255,.4);line-height:1.7}
.footer-col-title{font-size:.7rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:1rem}
.footer-links{list-style:none;display:flex;flex-direction:column;gap:.5rem}
.footer-links a,.footer-links span{color:rgba(255,255,255,.5);font-size:.84rem}
.footer-links a:hover{color:var(--c-accent)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.07);padding-top:1.5rem;display:flex;justify-content:space-between;align-items:center;font-size:.76rem;color:rgba(255,255,255,.25);flex-wrap:wrap;gap:.75rem}
.footer-partners{display:flex;gap:1.1rem}
.footer-partners a{color:rgba(255,255,255,.32);font-size:.74rem}
.footer-partners a:hover{color:var(--c-accent)}

/* SCROLL TOP */
.scroll-top{position:fixed;bottom:7.2rem;right:1.9rem;width:38px;height:38px;background:var(--c-bg-dark);border:1px solid rgba(255,255,255,.1);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;pointer-events:none;transition:var(--tr);z-index:899;font-size:.9rem}
.scroll-top.show{opacity:1;pointer-events:all}
.scroll-top:hover{background:var(--c-primary)}
```

---

## 📱 ÉTAPE 7 — css/responsive.css

```css
@media (max-width: 1100px) {
  .nav-sub { display: none; }
  .nav-menu a { padding: .36rem .62rem; font-size: .73rem; }
}
@media (max-width: 1024px) {
  .hero-inner { grid-template-columns: 1fr; gap: 2rem; }
  .hero-card { display: none; }
  .actu-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .adhesion-box { grid-template-columns: 1fr; }
  .contact-grid { grid-template-columns: 1fr; }
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
  .ia-block { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  :root { --nav-h: 54px; }
  .section { padding: 2.75rem 0; }
  .nav-menu {
    display: none; flex-direction: column;
    position: absolute; top: var(--nav-h); left: 0; right: 0;
    background: rgba(8,24,38,.98);
    border-bottom: 1px solid rgba(79,184,201,.15);
    padding: .75rem; gap: .15rem;
  }
  .nav-menu.open { display: flex; }
  .nav-menu a { padding: .6rem .95rem; border-radius: 8px; font-size: .82rem; }
  .burger { display: flex; flex-direction: column; justify-content: center; }
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; }
  .hero-cta { flex-direction: column; align-items: flex-start; }
  .chat-window { width: calc(100vw - 2rem); right: 1rem; bottom: 4.75rem; max-height: 72vh; }
  .chat-launcher { right: 1rem; bottom: 1.4rem; }
  .scroll-top { display: none; }
  .prix-item { flex-direction: column; gap: .6rem; }
  .ia-stats { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 480px) {
  .bulletins-grid { grid-template-columns: 1fr; }
  .chat-suggestions { display: none; }
  .bureau-grid { grid-template-columns: 1fr; }
  h1 { font-size: 1.6rem; }
  .ia-stats { grid-template-columns: 1fr; }
}
```

---

## 🔧 ÉTAPE 8 — js/chat.js

```javascript
(function() {
  'use strict';
  const SUGS = [
    "Légionelles dans les établissements thermaux",
    "Synthèse sur l'entartrage des réseaux",
    "Radioactivité et radon : que dit l'AFTh ?",
    "Décarbonation des établissements thermaux",
    "Contrôle sanitaire de l'eau thermale",
    "Boues thermales : réglementation"
  ];
  let isOpen=false, isLoading=false, history=[];
  const launcher=document.getElementById('chat-launcher-btn');
  const win=document.getElementById('chat-win');
  const closeBtn=document.getElementById('chat-close-btn');
  const msgs=document.getElementById('chat-messages');
  const input=document.getElementById('chat-input');
  const send=document.getElementById('chat-send-btn');
  const sugs=document.getElementById('chat-sugs');
  if(!launcher) return;

  function init() {
    SUGS.slice(0,4).forEach(s=>{
      const b=document.createElement('button');
      b.className='chat-sug'; b.textContent=s;
      b.addEventListener('click',()=>sendMsg(s));
      sugs?.appendChild(b);
    });
    fetch('/api/stats').then(r=>r.json()).then(d=>{
      addMsg('ai',`Bonjour 👋 Je suis l'assistant IA de l'**AFTh**.\n\nJ'ai accès à **${d.totalArticles} articles techniques** et **${d.totalBulletins} bulletins** (${d.yearsRange?.min||2004}–${d.yearsRange?.max||2025}).\n\nPosez-moi votre question ou cliquez sur une suggestion.`);
    }).catch(()=>{
      addMsg('ai',`Bonjour 👋 Je suis l'assistant IA de l'**AFTh**.\n\nJ'explore les archives techniques 2004–2025 (150+ articles, 22 bulletins).\n\nQuelle est votre question ?`);
    });
    launcher.addEventListener('click',toggleChat);
    closeBtn?.addEventListener('click',closeChat);
    send?.addEventListener('click',()=>sendMsg());
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
    input?.addEventListener('input',resize);
    document.addEventListener('click',e=>{
      if(isOpen&&!win.contains(e.target)&&!launcher.contains(e.target)) closeChat();
    });
  }

  function toggleChat(){isOpen?closeChat():openChat();}
  function openChat(){isOpen=true;win.classList.add('open');win.setAttribute('aria-hidden','false');setTimeout(()=>input?.focus(),300);}
  function closeChat(){isOpen=false;win.classList.remove('open');win.setAttribute('aria-hidden','true');}
  function resize(){if(!input)return;input.style.height='auto';input.style.height=Math.min(input.scrollHeight,100)+'px';}

  function md(text){
    return text
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,'<em>$1</em>')
      .replace(/^### (.*)/gm,'<h4>$1</h4>')
      .replace(/^## (.*)/gm,'<h3>$1</h3>')
      .replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')
      .replace(/^/,'<p>').replace(/$/,'</p>');
  }

  function addMsg(role,content){
    const w=document.createElement('div');
    w.className=`msg msg-${role==='user'?'user':'ai'}`;
    const av=document.createElement('div');av.className='msg-avatar';av.textContent=role==='user'?'👤':'🌊';
    const b=document.createElement('div');b.className='msg-bubble';b.innerHTML=md(content);
    w.appendChild(av);w.appendChild(b);msgs.appendChild(w);scrollDown();return b;
  }
  function addTyping(){
    const el=document.createElement('div');el.className='msg msg-ai';el.id='msg-typing';
    el.innerHTML='<div class="msg-avatar">🌊</div><div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
    msgs.appendChild(el);scrollDown();
  }
  function removeTyping(){document.getElementById('msg-typing')?.remove();}
  function scrollDown(){msgs.scrollTop=msgs.scrollHeight;}

  async function sendMsg(text){
    const content=text||input?.value.trim();
    if(!content||isLoading) return;
    addMsg('user',content);
    history.push({role:'user',content});
    if(!text&&input){input.value='';input.style.height='auto';}
    isLoading=true;if(send)send.disabled=true;addTyping();
    try{
      const res=await fetch('/api/chat',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:history})
      });
      removeTyping();
      if(!res.ok){
        const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));
        throw new Error(e.error||'Erreur serveur');
      }
      const bubble=addMsg('ai','');
      let full='';
      const reader=res.body.getReader(),dec=new TextDecoder();
      let buf='';
      while(true){
        const{done,value}=await reader.read();
        if(done) break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split('\n');buf=lines.pop()||'';
        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          try{
            const d=JSON.parse(line.slice(6));
            if(d.type==='text'){full+=d.text;bubble.innerHTML=md(full)+'<span class="cursor">▌</span>';scrollDown();}
            else if(d.type==='done'){bubble.innerHTML=md(full);}
            else if(d.type==='error'){throw new Error(d.message);}
          }catch(_){}
        }
      }
      if(!full) full='Désolé, aucune réponse générée.';
      bubble.innerHTML=md(full);
      history.push({role:'assistant',content:full});
    }catch(err){
      removeTyping();
      let msg='⚠️ ';
      if(err.message.includes('API_KEY')||err.message.includes('configurée'))
        msg+='Clé API Anthropic non configurée. Ajoutez `ANTHROPIC_API_KEY` dans `.env` et relancez `npm start`.';
      else if(err.message.includes('fetch')||err.message.includes('Failed'))
        msg+='Serveur inaccessible. Vérifiez que `npm start` est lancé.';
      else msg+=err.message;
      addMsg('ai',msg);
    }finally{isLoading=false;if(send)send.disabled=false;}
  }

  document.readyState==='loading'
    ?document.addEventListener('DOMContentLoaded',init):init();
})();
```

---

## 🌐 ÉTAPE 9 — js/main.js

```javascript
document.addEventListener('DOMContentLoaded', function() {

  // Navbar scroll + scroll top
  const navbar=document.querySelector('.navbar');
  const scrollBtn=document.querySelector('.scroll-top');
  window.addEventListener('scroll',()=>{
    navbar?.classList.toggle('scrolled',scrollY>40);
    scrollBtn?.classList.toggle('show',scrollY>400);
  },{passive:true});
  scrollBtn?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

  // Burger
  const burger=document.getElementById('burger');
  const navMenu=document.querySelector('.nav-menu');
  burger?.addEventListener('click',()=>{
    navMenu?.classList.toggle('open');
    burger.setAttribute('aria-expanded',navMenu?.classList.contains('open'));
  });
  navMenu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navMenu.classList.remove('open')));

  // Active link
  const path=location.pathname.replace(/\/$/,'')||'/';
  document.querySelectorAll('.nav-menu a[href]').forEach(a=>{
    const href=a.getAttribute('href');
    if(href&&!href.startsWith('#')&&!href.startsWith('http')){
      if(href==='/'?path==='/':path.startsWith(href)) a.classList.add('active');
    }
  });

  // Nav IA → chat
  document.getElementById('nav-ai-btn')?.addEventListener('click',e=>{
    e.preventDefault();document.getElementById('chat-launcher-btn')?.click();
  });

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){
      const t=document.querySelector(this.getAttribute('href'));
      if(t){e.preventDefault();scrollTo({top:t.offsetTop-82,behavior:'smooth'});}
    });
  });

  // Image fallback
  document.querySelectorAll('img[src]').forEach(img=>{
    img.addEventListener('error',function(){this.style.display='none';},{once:true});
  });

  // === Recherche articles (/articles) ===
  const searchInput=document.getElementById('search-input');
  const resultsList=document.getElementById('articles-list');
  const countEl=document.getElementById('articles-count');
  const filtersEl=document.getElementById('filters-dynamic');

  if(searchInput&&resultsList){
    let activeTheme='all',debounce;

    function render(arts){
      if(countEl) countEl.textContent=`${arts.length} article${arts.length!==1?'s':''}`;
      if(!arts.length){
        resultsList.innerHTML='<p style="text-align:center;color:var(--c-text-lt);padding:2rem;">Aucun article trouvé.</p>';
        return;
      }
      resultsList.innerHTML=arts.map(a=>`
        <div class="article-item">
          <span class="art-theme">${a.theme||'Technique'}</span>
          <div class="art-info">
            <a class="art-title" href="${a.url||'#'}" target="_blank" rel="noopener">${a.title}</a>
            ${a.excerpt?`<p class="art-excerpt">${a.excerpt.substring(0,200)}</p>`:''}
          </div>
          ${a.year?`<span class="art-year">${a.year}</span>`:''}
        </div>`).join('');
    }

    function doSearch(){
      const q=searchInput.value.trim()||'thermal';
      fetch(`/api/search?limit=60&q=${encodeURIComponent(q)}`)
        .then(r=>r.json())
        .then(data=>{
          let res=data.results;
          if(activeTheme!=='all') res=res.filter(a=>a.theme===activeTheme);
          render(res);
        })
        .catch(()=>{
          resultsList.innerHTML='<p style="text-align:center;color:var(--c-text-lt);padding:2rem;">⚠️ Lancez <code>npm start</code> pour accéder aux articles.</p>';
        });
    }

    if(filtersEl){
      fetch('/api/stats').then(r=>r.json()).then(data=>{
        Object.entries(data.themes).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([theme,count])=>{
          const btn=document.createElement('button');
          btn.className='filter-btn';btn.dataset.theme=theme;
          btn.textContent=`${theme} (${count})`;
          btn.addEventListener('click',function(){
            document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
            this.classList.add('active');activeTheme=theme;doSearch();
          });
          filtersEl.appendChild(btn);
        });
      }).catch(()=>{});
    }

    document.querySelectorAll('.filter-btn[data-theme="all"]').forEach(btn=>{
      btn.addEventListener('click',function(){
        document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');activeTheme='all';doSearch();
      });
    });

    searchInput.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(doSearch,350);});
    doSearch();
  }

  // Contact form
  document.getElementById('contact-form')?.addEventListener('submit',function(e){
    e.preventDefault();
    const btn=this.querySelector('[type="submit"]');
    btn.textContent='✓ Message envoyé !';btn.style.background='var(--c-success)';btn.disabled=true;
    setTimeout(()=>{btn.textContent='Envoyer';btn.style.background='';btn.disabled=false;this.reset();},4000);
  });
});
```

---

## 📄 ÉTAPE 10 — Pages HTML

### Fragments communs à inclure dans CHAQUE PAGE SANS EXCEPTION

**HEAD (adapter titre/description) :**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AFTh — [TITRE]</title>
  <meta name="description" content="[DESCRIPTION]">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,600;0,700;0,800;1,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/main.css">
  <link rel="stylesheet" href="/css/responsive.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌊</text></svg>">
</head>
```

**NAVBAR :**
```html
<header class="navbar" id="navbar">
  <div class="nav-inner">
    <a href="/" class="nav-brand">
      <img class="nav-logo" src="/assets/images/logo.gif" alt="AFTh" onerror="this.style.display='none'">
      <div><span class="nav-name">AFTh</span><span class="nav-sub">Techniques Hydrothermales</span></div>
    </a>
    <nav>
      <ul class="nav-menu" id="nav-menu">
        <li><a href="/">Accueil</a></li>
        <li><a href="/association">L'AFTh</a></li>
        <li><a href="/congres">Congrès</a></li>
        <li><a href="/prix">Prix Initiative</a></li>
        <li><a href="/archives">Archives</a></li>
        <li><a href="/articles">Articles</a></li>
        <li><a href="/contact">Contact</a></li>
        <li><a href="#" class="ai-link" id="nav-ai-btn">🤖 IA</a></li>
      </ul>
    </nav>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
```

**FOOTER :**
```html
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <img class="footer-logo" src="/assets/images/logo.gif" alt="AFTh" onerror="this.style.display='none'">
        <div class="footer-brand">Association Française des Techniques Hydrothermales</div>
        <p class="footer-desc">Spécialistes du thermalisme technique réunis depuis 2004 : ingénieurs, techniciens, gestionnaires, fournisseurs et scientifiques.</p>
      </div>
      <div>
        <p class="footer-col-title">Navigation</p>
        <ul class="footer-links">
          <li><a href="/">Accueil</a></li><li><a href="/association">L'AFTh</a></li>
          <li><a href="/congres">Congrès &amp; Publications</a></li>
          <li><a href="/prix">Prix Initiative</a></li>
          <li><a href="/archives">Archives bulletins</a></li>
          <li><a href="/articles">Articles techniques</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-col-title">Partenaires</p>
        <ul class="footer-links">
          <li><a href="http://www.medecinethermale.fr/" target="_blank" rel="noopener">CNETH</a></li>
          <li><a href="http://www.afreth.org/" target="_blank" rel="noopener">AFRETh</a></li>
          <li><a href="https://arconseil-eau.fr/" target="_blank" rel="noopener">AR Conseil Eau</a></li>
          <li><a href="http://www.symposium-thermal.org/" target="_blank" rel="noopener">Symposium Thermal</a></li>
        </ul>
      </div>
      <div>
        <p class="footer-col-title">Contact</p>
        <ul class="footer-links">
          <li><span>1 rue Cels, 75014 Paris</span></li>
          <li><a href="tel:+33153910575">01 53 91 05 75</a></li>
          <li><a href="mailto:info@afth.asso.fr">info@afth.asso.fr</a></li>
          <li><a href="/contact">Formulaire de contact</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2025 AFTh — Association Française des Techniques Hydrothermales</span>
      <div class="footer-partners">
        <a href="http://www.medecinethermale.fr/" target="_blank" rel="noopener">CNETH</a>
        <a href="http://www.afreth.org/" target="_blank" rel="noopener">AFRETh</a>
      </div>
    </div>
  </div>
</footer>
```

**CHAT + SCRIPTS (avant `</body>`) :**
```html
<div class="chat-launcher">
  <button class="chat-btn" id="chat-launcher-btn" aria-label="Assistant IA AFTh">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    <span class="chat-badge">IA</span>
  </button>
  <div class="chat-tooltip">Assistant IA AFTh</div>
</div>
<div class="chat-window" id="chat-win" role="dialog" aria-label="Assistant IA" aria-hidden="true">
  <div class="chat-header">
    <div class="chat-header-info">
      <div class="chat-avatar">🌊</div>
      <div><div class="chat-name">Assistant AFTh</div><div class="chat-sub">Archives 2004–2025</div></div>
    </div>
    <button class="chat-close" id="chat-close-btn" aria-label="Fermer">✕</button>
  </div>
  <div class="chat-suggestions" id="chat-sugs"></div>
  <div class="chat-messages" id="chat-messages" role="log" aria-live="polite"></div>
  <div class="chat-input-wrap">
    <textarea class="chat-input" id="chat-input" placeholder="Votre question technique…" rows="1"></textarea>
    <button class="chat-send" id="chat-send-btn" aria-label="Envoyer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    </button>
  </div>
  <div class="chat-disclaimer">Propulsé par Claude (Anthropic) · Sources : archives AFTh</div>
</div>
<button class="scroll-top" aria-label="Haut de page">↑</button>
<script src="/js/main.js"></script>
<script src="/js/chat.js"></script>
```

---

### pages/index.html — Contenu

- **Hero** : badge "Congrès 2025 · La Bourboule", h1 avec `<span>` sur "Techniques Hydrothermales", desc, CTA [Rejoindre l'AFTh `.btn-primary`] [Congrès 2025 `.btn-outline`], + `.hero-card` résumant le congrès 2025 avec 3 hero-speakers
- **Section Actualités** (`.section`) : `.actu-grid` → actu-main = Prix Béraud (photo `beraud.jpg` + texte complet dans `.actu-main-body`) + actu-sidebar : card Hommage JL Bérot + card "Bulletin 2025" avec lien téléchargement
- **Section Congrès 2025** (`.section .section--alt`) : `.congres-card` avec `.congres-year`, `.congres-title` "Gestion de la radioactivité dans les établissements thermaux" + 8 `.program-item` avec tous les intervenants
- **Section IA** (`.section`) : `.ia-block` → colonne gauche : eyebrow "Intelligence Artificielle", h2 "Explorez 20 ans d'expertise thermale", p desc, `.ia-stats` (articles/bulletins/années), `.ia-caps` (5 capacités avec emoji icons), `.btn-ai "Ouvrir l'assistant"` → colonne droite : décoratif SVG simplifié (formes géométriques eau/bulle) ou bloc de stats agrandies
- **Section Bulletins récents** (`.section .section--alt`) : 4 dernières `.bul-card` (2025, 2024, 2023, 2022) + `<a href="/archives">Voir toutes les archives →</a>`
- **Section Adhésion** (`.section`) : `.adhesion-box`

### pages/association.html
- `.page-hero` eyebrow "L'Association" h1 "Association Française des Techniques Hydrothermales"
- Section présentation : qui sommes-nous, objectifs, historique, public
- Section `.adhesion-box` avec avantages (Accès aux bulletins annuels, Congrès à tarif préférentiel, Réseau d'experts nationaux, Prix de l'initiative) et tarifs (Membre actif : 80€/an, Membre associé : 50€/an, Étudiant : 20€/an — valeurs indicatives)
- Section Bureau & CA : `.bureau-grid` avec cartes pour Président, Vice-Président, Secrétaire, Trésorier, Membres CA + logos partenaires CNETH et AFRETh

### pages/congres.html
- `.page-hero` h1 "Congrès & Publications"
- `.congres-card` complet 2025 avec tous les intervenants
- Section "Historique des congrès" : tableau avec toutes les années 2004→2025 et leurs thèmes (utiliser les données des bulletins connues)
- CTA "Télécharger les bulletins" → `/archives`

### pages/prix.html
- `.page-hero` h1 "Prix de l'Initiative AFTh"
- Description du Prix : récompense annuelle d'une réalisation technique améliorant qualité, ergonomie, économie ou efficacité d'un établissement thermal
- **Prix d'honneur 2025** : `.prix-item` an=2025 label="Prix d'honneur" titre="Jean-François Béraud — Président de la FTCF" + texte complet de l'éloge (utiliser le texte du site d'origine)
- Section candidature : formulaire simple (nom, établissement, description du projet, email)
- Archives : quelques `.prix-item` des années précédentes (mettre "Lauréat non documenté en ligne" si info inconnue)

### pages/archives.html
- `.page-hero` h1 "Archives des Bulletins"
- Intro : "22 bulletins techniques issus des congrès annuels AFTh, disponibles au téléchargement"
- `.bulletins-grid` : 22 `.bul-card` de 2025 à 2004, avec `.bul-dl` lié à `/assets/pdfs/bulletin-XXXX.pdf`
- CTA violet "Interroger les archives avec l'IA 🤖" → `id="open-ia-btn"` qui déclenche l'ouverture du chat

### pages/articles.html
- `.page-hero` h1 "Articles Techniques Archivés"
- Intro : "150+ articles techniques indexés et interrogeables via notre assistant IA"
- `.search-wrap` avec `<input id="search-input" placeholder="Rechercher un article…">` + bouton loupe
- `.filters` : `<button class="filter-btn active" data-theme="all">Tous</button>` + `<div id="filters-dynamic"></div>`
- `<p class="lead"><span id="articles-count">–</span> articles</p>`
- `<div class="articles-list" id="articles-list"><p style="text-align:center;padding:2rem;color:var(--c-text-lt);">Chargement…</p></div>`

### pages/contact.html
- `.page-hero` h1 "Contact"
- `.contact-grid` : form (id="contact-form", champs Prénom/Nom, Email, Objet, Message, submit `.btn-blue`) + infos (adresse, tél, email, partenaires)

---

## ✅ ÉTAPE 11 — README.md

```markdown
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
```

---

## ✅ ÉTAPE 12 — Vérifications finales (automatiques)

Après avoir tout créé, effectuer ces vérifications et corriger sans attendre :

1. `npm install` → exit 0
2. `bash scripts/fetch-assets.sh` → ≥ 18 fichiers téléchargés avec taille > 1Ko
3. `node scripts/scrape-articles.js` → `data/articles.json` avec ≥ 40 entrées
4. `npm start` → serveur OK port 3000 sans erreur
5. `curl -s http://localhost:3000/api/stats | head -1` → JSON `{`
6. `curl -s "http://localhost:3000/api/search?q=legionelle"` → `"count":` > 0
7. Toutes les 7 URLs servent HTTP 200 (/, /association, /congres, /prix, /archives, /articles, /contact)
8. Vérifier que `id="chat-win"` et `id="chat-launcher-btn"` existent dans toutes les pages
9. Vérifier que `ANTHROPIC_API_KEY` n'apparaît dans aucun fichier .html ou .js frontend
10. `.gitignore` contient bien `node_modules/` et `.env`

---

## ⚠️ Règles absolues

- **Jamais** tronquer un fichier avec `// ...` ou `<!-- ... -->` — tout fichier doit être complet
- **Jamais** s'interrompre pour demander validation — continuer jusqu'au bout
- **Jamais** exposer `ANTHROPIC_API_KEY` côté client
- **Jamais** utiliser jQuery, Bootstrap, React ou tout framework
- Délai 1200ms entre requêtes de scraping
- Navbar + footer + chat widget : identiques dans les 7 pages
- `"type": "module"` dans package.json est obligatoire
- Si `data/articles.json` est vide, le chat affiche un message d'erreur clair sans crasher
