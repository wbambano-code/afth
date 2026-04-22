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

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function norm(s) {
  return (s||'').toLowerCase().normalize('NFD').replace(DIACRITICS,'');
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
