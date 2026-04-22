import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const BASE = 'https://afth.asso.fr';
const DELAY = 1000;
const OUT_DIR = 'assets/pdfs/articles';

const articles = JSON.parse(readFileSync('data/articles.json','utf8'));
mkdirSync(OUT_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const isPlaceholder = a => /PDF plugin|download the PDF/i.test(a.content||'');

async function detectPdfUrl(articleUrl) {
  const res = await fetch(articleUrl, {
    headers: { 'User-Agent': 'AFTh-Refonte/1.0' },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) return null;
  const html = await res.text();
  const $ = cheerio.load(html);
  const candidates = [];
  $('object[data]').each((_,e) => { const d=$(e).attr('data'); if (d&&d.toLowerCase().includes('.pdf')) candidates.push(d); });
  $('embed[src]').each((_,e) => { const s=$(e).attr('src'); if (s&&s.toLowerCase().includes('.pdf')) candidates.push(s); });
  $('iframe[src]').each((_,e) => { const s=$(e).attr('src'); if (s&&s.toLowerCase().includes('.pdf')) candidates.push(s); });
  $('a[href]').each((_,e) => { const h=$(e).attr('href'); if (h&&h.toLowerCase().endsWith('.pdf')) candidates.push(h); });
  if (!candidates.length) return null;
  let url = candidates[0];
  if (url.startsWith('//')) url = 'https:' + url;
  else if (url.startsWith('/')) url = BASE + url;
  else if (!/^https?:/i.test(url)) url = BASE + '/' + url;
  return url;
}

async function download(pdfUrl, filePath) {
  const res = await fetch(pdfUrl, {
    headers: { 'User-Agent': 'AFTh-Refonte/1.0' },
    signal: AbortSignal.timeout(30000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await pipeline(res.body, createWriteStream(filePath));
  const size = statSync(filePath).size;
  if (size < 1024) throw new Error(`fichier suspect (${size} octets)`);
  return size;
}

async function main() {
  const placeholders = articles.filter(isPlaceholder);
  console.log(`🔍 ${placeholders.length} articles placeholder à traiter\n`);

  let ok = 0, failed = 0, skipped = 0;
  for (const a of placeholders) {
    const outName = `article-${a.id}.pdf`;
    const outPath = `${OUT_DIR}/${outName}`;
    process.stdout.write(`  [${a.id}] `);

    if (existsSync(outPath) && statSync(outPath).size > 1024) {
      a.pdfFile = outName;
      console.log(`↷ déjà téléchargé`);
      skipped++;
      continue;
    }

    try {
      const pdfUrl = await detectPdfUrl(a.url);
      if (!pdfUrl) { console.log('✗ aucun PDF détecté'); failed++; await sleep(DELAY); continue; }
      const size = await download(pdfUrl, outPath);
      a.pdfFile = outName;
      a.pdfSourceUrl = pdfUrl;
      console.log(`✓ ${(size/1024).toFixed(0)} Ko`);
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message.substring(0,60)}`);
      failed++;
    }
    await sleep(DELAY);
  }

  writeFileSync('data/articles.json', JSON.stringify(articles, null, 2));
  console.log(`\n✅ ${ok} téléchargés · ${skipped} déjà présents · ${failed} échecs`);
  console.log('→ data/articles.json mis à jour avec le champ pdfFile');
}

main().catch(console.error);
