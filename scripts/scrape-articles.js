import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';
import { writeFileSync, mkdirSync, existsSync, statSync, unlinkSync, createWriteStream } from 'fs';
import { Buffer } from 'buffer';
import { pipeline } from 'stream/promises';
import { URL } from 'url';
import { extname } from 'path';

const BASE = 'https://afth.asso.fr';
const DELAY = 1200;
const IMG_DIR = 'assets/images/articles';

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

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');
function norm(s) { return (s||'').toLowerCase().normalize('NFD').replace(DIACRITICS,''); }
function detectTheme(title, url) {
  const text = norm(title + ' ' + url);
  for (const [k,v] of Object.entries(THEMES)) if (text.includes(k)) return v;
  return 'Technique thermale';
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Règles de sanitize-html : on garde la structure sémantique + images + liens
const SANITIZE_OPTS = {
  allowedTags: ['p','br','h2','h3','h4','h5','h6','strong','b','em','i','u','ul','ol','li',
                'blockquote','a','img','table','thead','tbody','tr','th','td','figure','figcaption','hr'],
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    table: ['border'],
    td: ['colspan','rowspan'],
    th: ['colspan','rowspan','scope'],
  },
  allowedSchemes: ['http','https','mailto'],
  transformTags: {
    // Vire les liens "javascript:" etc, force target/rel pour les externes
    a: (tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })
  },
  allowedSchemesAppliedToAttributes: ['href','src'],
  // Pas de exclusiveFilter — on nettoie les <p> vides en post-traitement
  // (avec une regex qui ne touche PAS les <p> contenant des médias)
};

function extToGuess(contentType) {
  if (!contentType) return '.bin';
  const ct = contentType.toLowerCase();
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('gif')) return '.gif';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('svg')) return '.svg';
  return '.bin';
}

async function downloadImage(imgUrl, articleId, index) {
  try {
    // Cas 1 : data URL en base64 → décoder et sauvegarder
    if (imgUrl.startsWith('data:')) {
      const m = imgUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return null;
      const mime = m[1];
      const base64 = m[2];
      const ext = extToGuess(mime);
      const filename = `article-${articleId}-${index}${ext}`;
      const filepath = `${IMG_DIR}/${filename}`;
      const buf = Buffer.from(base64, 'base64');
      if (buf.length < 500) return null; // ignore les data URLs minuscules
      writeFileSync(filepath, buf);
      return `/${filepath}`;
    }
    // Cas 2 : URL classique http(s)
    let ext = extname(new URL(imgUrl).pathname).toLowerCase();
    if (!['.jpg','.jpeg','.png','.gif','.webp','.svg'].includes(ext)) ext = '';
    const filename = `article-${articleId}-${index}${ext || '.bin'}`;
    const filepath = `${IMG_DIR}/${filename}`;
    if (existsSync(filepath) && statSync(filepath).size > 500) {
      return `/${filepath}`;
    }
    const res = await fetch(imgUrl, { signal: AbortSignal.timeout(15000), headers:{'User-Agent':'AFTh-Refonte/1.0'} });
    if (!res.ok) return null;
    if (!ext) {
      const realExt = extToGuess(res.headers.get('content-type'));
      const newPath = `${IMG_DIR}/article-${articleId}-${index}${realExt}`;
      await pipeline(res.body, createWriteStream(newPath));
      return `/${newPath}`;
    }
    await pipeline(res.body, createWriteStream(filepath));
    return `/${filepath}`;
  } catch (e) {
    process.stdout.write(` (img ✗ ${e.message.substring(0,30)})`);
    return null;
  }
}

const MIN_IMG_SIZE = 1500; // octets : filtre les icônes/bullets < 1.5 Ko

async function processImages($, $el, articleId, baseUrl) {
  const imgs = $el.find('img').toArray();
  let idx = 0, kept = 0;
  for (const img of imgs) {
    idx++;
    const src = img.attribs?.src;
    if (!src) continue;
    let absUrl = src;
    if (!src.startsWith('data:')) {
      try { absUrl = new URL(src, baseUrl).href; } catch { continue; }
    }
    const localPath = await downloadImage(absUrl, articleId, idx);

    let tooSmall = false;
    if (localPath) {
      try {
        const sz = statSync(localPath.replace(/^\//, '')).size;
        if (sz < MIN_IMG_SIZE) tooSmall = true;
      } catch {}
    }

    if (localPath && !tooSmall) {
      img.attribs.src = localPath;
      if (!img.attribs.alt) img.attribs.alt = '';
      delete img.attribs.width;
      delete img.attribs.height;
      delete img.attribs.style;
      kept++;
    } else {
      // Suppression sûre via cheerio (l'API officielle)
      $(img).remove();
      // Nettoie aussi le fichier si on l'avait téléchargé (pour éviter l'accumulation d'icônes orphelines)
      if (localPath) try { unlinkSync(localPath.replace(/^\//, '')); } catch {}
    }
  }
  return kept;
}

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
    $('nav,header,footer,script,style,noscript,iframe,form').remove();
    const title = $('h1,h2,.contentheading').first().text().trim()
      || $('title').text().replace(/[-|].*$/,'').trim();

    // Trouve la zone article principale
    let $article = null;
    for (const sel of ['div.item-page','article','div#content','div.article-content']) {
      const el = $(sel);
      if (el.length) { $article = el.first(); break; }
    }
    if (!$article) return null;

    // Retire le titre interne (déjà en h1 du rendu) et les méta
    $article.find('h1,h2.contentheading,.article-info,.item-title,.contentpaneopen').first().remove();

    // Télécharge les images et réécrit les src
    const imgCount = await processImages($, $article, id, res.url);

    // HTML brut puis sanitize, puis nettoyage léger des <p> totalement vides
    const rawHtml = $article.html() || '';
    let cleanHtml = sanitizeHtml(rawHtml, SANITIZE_OPTS);
    // Retire les <p> qui ne contiennent ni texte, ni img/figure/media
    cleanHtml = cleanHtml.replace(/<p>(?:\s|<br\s*\/?>|<strong>\s*<\/strong>|<em>\s*<\/em>)*<\/p>/g, '');

    // Texte plat pour l'IA et la recherche
    const plainText = $article.text().replace(/\s{3,}/g,'\n\n').trim().substring(0,10000);

    if (!title && !cleanHtml.trim()) return null;

    const ym = plainText.match(/\b(200[4-9]|201[0-9]|202[0-5])\b/);
    return {
      id,
      title: title || `Article AFTh #${id}`,
      url: res.url,
      theme: detectTheme(title||'', res.url),
      year: ym ? parseInt(ym[1]) : null,
      content: plainText,
      content_html: cleanHtml.trim(),
      excerpt: plainText.substring(0,400).replace(/\n/g,' ').trim()+'…',
      imageCount: imgCount
    };
  } catch(e) { process.stdout.write(` ✗ ${e.message.substring(0,50)}\n`); return null; }
}

async function main() {
  console.log('🔍 Scraping articles AFTh (v2 avec HTML + images)...\n');
  mkdirSync('data', {recursive:true});
  mkdirSync(IMG_DIR, {recursive:true});
  const articles = [];
  let failed = 0, totalImages = 0;
  for (const id of IDS) {
    process.stdout.write(`  [${id}] `);
    const art = await scrape(id);
    if (art) {
      articles.push(art);
      totalImages += art.imageCount || 0;
      const imgInfo = art.imageCount ? ` [${art.imageCount} img]` : '';
      console.log(`✓ ${art.title.substring(0,50)}${imgInfo}`);
    } else {
      failed++;
    }
    await sleep(DELAY);
  }

  // Preserve pdfFile et pdfSourceUrl des articles existants (ajoutés par fetch-article-pdfs.js)
  let existing = [];
  try { existing = JSON.parse(await import('fs').then(f => f.readFileSync('data/articles.json','utf8'))); } catch {}
  const pdfMap = new Map(existing.filter(a => a.pdfFile).map(a => [a.id, { pdfFile: a.pdfFile, pdfSourceUrl: a.pdfSourceUrl }]));
  articles.forEach(a => {
    const pdf = pdfMap.get(a.id);
    if (pdf) { a.pdfFile = pdf.pdfFile; if (pdf.pdfSourceUrl) a.pdfSourceUrl = pdf.pdfSourceUrl; }
  });

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
  console.log(`\n✅ ${articles.length} articles indexés (${failed} échecs, ${totalImages} images téléchargées)`);
  console.log('→ data/articles.json & data/bulletins-index.json mis à jour');
}

main().catch(console.error);
