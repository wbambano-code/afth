import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, unlinkSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import Database from 'better-sqlite3';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '200kb' }));

// === Chargement des données ===
const loadJson = (p, fallback) => {
  try { return JSON.parse(readFileSync(join(__dirname, p), 'utf8')); }
  catch { return fallback; }
};
const saveJson = (p, data) => writeFileSync(join(__dirname, p), JSON.stringify(data, null, 2));

let articles = loadJson('data/articles.json', []);
let bulletins = loadJson('data/bulletins-index.json', []);
let heroCard = loadJson('data/hero-card.json', null);
let actualites = loadJson('data/actualites.json', { main: null, sidebar: [] });
let congres = loadJson('data/congres.json', { year:2025, theme:'', dates:'', interventions:[] });
let members = loadJson('data/members.json', []);
let prix = loadJson('data/prix.json', []);
let systemPrompt = 'Tu es l\'assistant technique de l\'AFTh.';
try { systemPrompt = readFileSync(join(__dirname, 'data/system-prompt.txt'), 'utf8'); } catch {}

console.log(`✓ ${articles.length} articles · ${bulletins.length} bulletins · ${members.length} membres · ${actualites.sidebar.length+1} actus · ${congres.interventions.length} interventions`);

let articleTpl = '', indexTpl = '', congresTpl = '', prixTpl = '', adminLoginTpl = '', adminTpl = '';
let memberLoginTpl = '', memberActivateTpl = '', memberResetReqTpl = '', memberResetConfirmTpl = '', memberProfileTpl = '';
let forumIndexTpl = '', forumCategoryTpl = '', forumThreadTpl = '', forumNewThreadTpl = '';
try { articleTpl = readFileSync(join(__dirname, 'pages/_article-template.html'), 'utf8'); } catch {}
try { indexTpl = readFileSync(join(__dirname, 'pages/index.html'), 'utf8'); } catch {}
try { congresTpl = readFileSync(join(__dirname, 'pages/congres.html'), 'utf8'); } catch {}
try { prixTpl = readFileSync(join(__dirname, 'pages/prix.html'), 'utf8'); } catch {}
try { adminLoginTpl = readFileSync(join(__dirname, 'pages/_admin-login.html'), 'utf8'); } catch {}
try { adminTpl = readFileSync(join(__dirname, 'pages/_admin.html'), 'utf8'); } catch {}
try { memberLoginTpl = readFileSync(join(__dirname, 'pages/_member-login.html'), 'utf8'); } catch {}
try { memberActivateTpl = readFileSync(join(__dirname, 'pages/_member-activate.html'), 'utf8'); } catch {}
try { memberResetReqTpl = readFileSync(join(__dirname, 'pages/_member-reset-request.html'), 'utf8'); } catch {}
try { memberResetConfirmTpl = readFileSync(join(__dirname, 'pages/_member-reset-confirm.html'), 'utf8'); } catch {}
try { memberProfileTpl = readFileSync(join(__dirname, 'pages/_member-profile.html'), 'utf8'); } catch {}
try { forumIndexTpl = readFileSync(join(__dirname, 'pages/_forum-index.html'), 'utf8'); } catch {}
try { forumCategoryTpl = readFileSync(join(__dirname, 'pages/_forum-category.html'), 'utf8'); } catch {}
try { forumThreadTpl = readFileSync(join(__dirname, 'pages/_forum-thread.html'), 'utf8'); } catch {}
try { forumNewThreadTpl = readFileSync(join(__dirname, 'pages/_forum-new-thread.html'), 'utf8'); } catch {}

// === Helpers ===
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
const DIACRITICS = new RegExp('[̀-ͯ]', 'g');
function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(DIACRITICS, ''); }

// === Rendu des fragments publics ===
function renderHeroCard(d) {
  if (!d) return '';
  const speakers = (d.speakers || []).map(s =>
    `<div class="hero-speaker"><strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(s.topic)}</span></div>`
  ).join('');
  return `<aside class="hero-card">
      <div class="hero-card-label">${escapeHtml(d.label)}</div>
      <div class="hero-card-title">${escapeHtml(d.title)}</div>
      <div class="hero-card-loc">${escapeHtml(d.location)}</div>
      ${speakers}
    </aside>`;
}

function renderActualites(d) {
  const main = d.main
    ? `<article class="actu-main">
        <div class="actu-main-header">
          <div class="actu-main-label">${escapeHtml(d.main.label)}</div>
          <h3 class="actu-main-title">${escapeHtml(d.main.title)}</h3>
        </div>
        <div class="actu-main-body">
          ${d.main.image ? `<img class="actu-main-img" src="${escapeHtml(d.main.image)}" alt="${escapeHtml(d.main.title)}" onerror="this.style.display='none'">` : ''}
          ${d.main.body_html || ''}
          ${d.main.cta_text ? `<a href="${escapeHtml(d.main.cta_href)}" class="btn btn-ghost btn-sm">${escapeHtml(d.main.cta_text)}</a>` : ''}
        </div>
      </article>`
    : '';
  const sidebar = (d.sidebar || []).map(s => {
    const isIa = (s.cta_href || '') === '#open-ia';
    const cta = s.cta_text
      ? `<a href="${escapeHtml(isIa ? '#' : s.cta_href)}" class="btn ${escapeHtml(s.cta_style || 'btn-blue')} btn-sm" ${isIa ? 'id="open-ia-btn"' : 'target="_blank" rel="noopener"'} style="margin-top:.7rem;">${escapeHtml(s.cta_text)}</a>`
      : '';
    return `<article class="actu-side">
      <div class="actu-side-label">${escapeHtml(s.label)}</div>
      <div class="actu-side-title">${escapeHtml(s.title)}</div>
      <p style="font-size:.83rem;color:var(--c-text-lt);margin-top:.5rem;line-height:1.55;">${s.body_html || ''}</p>
      ${cta}
    </article>`;
  }).join('');
  return `<div class="actu-grid">${main}<aside class="actu-sidebar">${sidebar}</aside></div>`;
}

function renderPrixItem(p) {
  const isFeatured = !!p.featured;
  const styleFeatured = isFeatured ? 'style="border-color:var(--c-warm);box-shadow:var(--sh-md);"' : '';
  return `<article class="prix-item" ${styleFeatured}>
    <div class="prix-year">${escapeHtml(String(p.year || ''))}</div>
    <div style="flex:1;">
      <div class="prix-label">${escapeHtml(p.label || '')}</div>
      <h3 class="prix-title">${escapeHtml(p.title || '')}</h3>
      ${(p.body_html || '').split('\n').map(l => l.trim() ? `<p class="prix-desc">${l.replace(/^<p>|<\/p>$/g, '')}</p>` : '').join('')}
    </div>
  </article>`;
}
function renderPrix(list, featured) {
  const items = (list || []).filter(p => !!p.featured === featured)
    .sort((a, b) => (b.year || 0) - (a.year || 0));
  if (!items.length) return '';
  return items.map(renderPrixItem).join('\n');
}

function renderCongresCard(c, fullTitle = false) {
  const items = (c.interventions || []).map(i =>
    `<div class="program-item"><div class="program-speaker">${escapeHtml(i.speaker)}<br><em style="font-size:.7rem;opacity:.7;">${escapeHtml(i.affiliation)}</em></div><div class="program-title">${escapeHtml(i.title)}</div></div>`
  ).join('');
  const title = fullTitle ? 'Programme complet' : escapeHtml(c.theme);
  return `<article class="congres-card">
      <span class="congres-year">${escapeHtml(c.dates)}</span>
      <h3 class="congres-title">${title}</h3>
      ${items}
    </article>`;
}

function renderPage(tpl, subs) {
  let out = tpl;
  for (const [k, v] of Object.entries(subs)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

// === Recherche articles (pour IA + /articles) ===
function search(query, max = 12) {
  if (!articles.length) return [];
  const terms = norm(query || '').split(/\s+/).filter(t => t.length > 2);
  if (!terms.length) return articles.slice(0, max);
  return articles.map(a => {
    const hay = norm(`${a.title} ${a.theme} ${a.excerpt} ${a.content || ''}`);
    let score = 0;
    for (const t of terms) {
      const re = new RegExp(t, 'g');
      score += (norm(a.title).match(re) || []).length * 4;
      score += (hay.match(re) || []).length;
    }
    return { ...a, score };
  }).filter(a => a.score > 0).sort((a, b) => b.score - a.score).slice(0, max);
}

function buildContext(query) {
  const relevant = search(query, 15);
  const normQ = norm(query);
  const relBul = bulletins.filter(b =>
    normQ.split(/\s+/).some(t => t.length > 3 && norm(b.theme).includes(t))
  ).slice(0, 5);

  let ctx = '=== ARCHIVES AFTh ===\n\n';
  if (relBul.length) {
    ctx += '-- BULLETINS PERTINENTS --\n';
    relBul.forEach(b => { ctx += `• Bulletin ${b.year} : "${b.theme}"\n`; });
    ctx += '\n';
  }
  if (relevant.length) {
    ctx += `-- ARTICLES PERTINENTS (${relevant.length}/${articles.length}) --\n\n`;
    relevant.forEach((a, i) => {
      ctx += `[${i+1}] ${a.title}\n`;
      ctx += `    Thème: ${a.theme}${a.year ? ' | ' + a.year : ''}\n`;
      ctx += `    ${(a.excerpt || '').substring(0, 500)}\n\n`;
    });
  } else {
    ctx += `Aucun article trouvé pour "${query}".\n`;
    ctx += 'Thèmes disponibles :\n';
    [...new Set(articles.map(a => a.theme))].forEach(t => { ctx += `• ${t}\n`; });
  }
  return ctx;
}

// === Article local ===
function renderArticle(a) {
  const rawContent = a.content || a.excerpt || '';
  let body;
  if (a.pdfFile) {
    const pdfPath = `/assets/pdfs/articles/${a.pdfFile}`;
    body = `<div class="pdf-note">📄 Cet article est au format PDF. Lecture directe ci-dessous ou <a href="${pdfPath}" target="_blank" rel="noopener">téléchargement</a>.</div>
      <div class="pdf-embed">
        <object data="${pdfPath}" type="application/pdf">
          <p>Votre navigateur ne peut pas afficher le PDF. <a href="${pdfPath}" target="_blank" rel="noopener">Cliquez ici pour le télécharger</a>.</p>
        </object>
      </div>
      <div style="text-align:center;margin-top:.8rem;"><a href="${pdfPath}" target="_blank" rel="noopener" class="btn btn-blue btn-sm">⬇ Télécharger le PDF</a></div>`;
  } else {
    let paras = rawContent.split(/\n+/).map(p => p.trim()).filter(Boolean);
    if (paras.length === 1 && paras[0].length > 600) {
      paras = paras[0].split(/(?<=[.!?])\s+(?=[A-ZÉÈÀÇÎÔÙ])/);
    }
    body = paras.map(p => `<p>${escapeHtml(p)}</p>`).join('\n');
    if (rawContent.trim().length < 150) {
      body = `<div class="pdf-note">⚠️ Contenu extrait limité — l'article original inclut probablement un document PDF non extractible par le scraper.</div>` + body;
    }
  }
  const yearBadge = a.year
    ? `<span style="background:rgba(255,255,255,.1);color:rgba(255,255,255,.75);border-radius:50px;padding:.22rem .75rem;font-size:.72rem;font-weight:600;">${a.year}</span>`
    : '';
  const metaDesc = (a.excerpt || '').substring(0, 155).replace(/"/g, '').replace(/\s+/g, ' ');
  return renderPage(articleTpl, {
    TITLE: escapeHtml(a.title),
    META_DESC: escapeHtml(metaDesc),
    THEME: escapeHtml(a.theme || 'Technique thermale'),
    YEAR_BADGE: yearBadge,
    BODY: body,
    SOURCE_URL: escapeHtml(a.url || '#')
  });
}

// === Auth admin ===
const sessions = new Map();
const SESSION_COOKIE = 'afth_admin';
const SESSION_TTL = 1000 * 60 * 60 * 8;

// === Auth membre ===
const memberSessions = new Map();
const MEMBER_COOKIE = 'afth_member';
const MEMBER_TTL = 1000 * 60 * 60 * 24 * 30;

function parseCookies(req) {
  const h = req.headers.cookie || '';
  const out = {};
  h.split(';').forEach(p => {
    const [k, ...v] = p.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  });
  return out;
}

function isAuthed(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return false;
  const s = sessions.get(token);
  if (!s) return false;
  if (Date.now() > s.expires) { sessions.delete(token); return false; }
  return true;
}

function requireAuth(req, res, next) {
  if (!isAuthed(req)) return res.status(401).json({ error: 'Non authentifié' });
  next();
}

function getMember(req) {
  const token = parseCookies(req)[MEMBER_COOKIE];
  if (!token) return null;
  const s = memberSessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expires) { memberSessions.delete(token); return null; }
  return members.find(m => m.id === s.memberId) || null;
}

function requireMember(req, res, next) {
  const m = getMember(req);
  if (!m) return res.status(401).json({ error: 'Connectez-vous pour accéder à cette ressource' });
  req.member = m;
  next();
}

// === Email (avec fallback console si SMTP non configuré) ===
let mailer = null;
if (process.env.SMTP_HOST) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
}
async function sendMail({ to, subject, html, text }) {
  if (mailer) {
    const from = process.env.SMTP_FROM || 'AFTh <no-reply@afth.asso.fr>';
    await mailer.sendMail({ from, to, subject, html, text });
    console.log(`  ✉ → ${to} · ${subject}`);
  } else {
    console.log('\n════════════ EMAIL (mode console, SMTP non configuré) ════════════');
    console.log('  À     :', to);
    console.log('  Objet :', subject);
    console.log('  ────────────');
    console.log('  ' + (text || html.replace(/<[^>]+>/g, '')).split('\n').join('\n  '));
    console.log('═══════════════════════════════════════════════════════════════════\n');
  }
}

// === Helpers membres ===
function sanitizeMember(m) {
  if (!m) return null;
  const { passwordHash, activationToken, resetToken, ...safe } = m;
  return safe;
}
function findMemberByEmail(email) {
  const e = (email || '').trim().toLowerCase();
  return members.find(m => m.email.toLowerCase() === e) || null;
}
function appUrl() {
  return (process.env.APP_URL || 'http://localhost:' + PORT).replace(/\/$/, '');
}
function saveMembers() { saveJson('data/members.json', members); }

// === Base SQLite forum ===
const forumDb = new Database(join(__dirname, 'data/forum.db'));
forumDb.pragma('journal_mode = WAL');
forumDb.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_post_at TEXT NOT NULL,
    post_count INTEGER DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    author_id TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_threads_cat ON threads(category_id);
  CREATE INDEX IF NOT EXISTS idx_threads_last ON threads(last_post_at DESC);
  CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id);
`);

// Seed 5 catégories si vide
const catCount = forumDb.prepare('SELECT COUNT(*) c FROM categories').get().c;
if (!catCount) {
  const defaults = [
    { slug: 'reglementation', name: 'Réglementation & sanitaire', description: 'Évolutions réglementaires, ARS, contrôle sanitaire, normes', icon: '⚖️', sort_order: 1 },
    { slug: 'technique', name: 'Technique & exploitation', description: 'Retours d\'expérience, entartrage, traitement, optimisation', icon: '🔧', sort_order: 2 },
    { slug: 'ressource', name: 'Ressource thermale', description: 'Forages, gisements, protection, arrêts d\'exploitation', icon: '💧', sort_order: 3 },
    { slug: 'materiel', name: 'Matériels & équipements', description: 'Fournisseurs, matériaux, corrosion, instrumentation', icon: '🏭', sort_order: 4 },
    { slug: 'divers', name: 'Divers & annonces', description: 'Offres d\'emploi, événements, questions générales', icon: '📢', sort_order: 5 },
  ];
  const ins = forumDb.prepare('INSERT INTO categories (slug, name, description, icon, sort_order) VALUES (?,?,?,?,?)');
  defaults.forEach(c => ins.run(c.slug, c.name, c.description, c.icon, c.sort_order));
  console.log(`✓ Forum seeded : ${defaults.length} catégories`);
}
console.log(`💬 Forum : ${forumDb.prepare('SELECT COUNT(*) c FROM threads').get().c} fils · ${forumDb.prepare('SELECT COUNT(*) c FROM posts').get().c} posts`);

// === Markdown sécurisé pour le forum ===
function mdToHtml(raw) {
  if (!raw) return '';
  let s = String(raw).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  // Code inline
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // Gras, italique
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  // Liens [texte](url) — uniquement http(s)/mailto
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => {
    if (!/^(https?:\/\/|mailto:)/i.test(url)) return m;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${txt}</a>`;
  });
  // Citations > ...
  s = s.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // Listes simples - item
  s = s.replace(/^(?:- (.+)(?:\n|$))+/gm, match => {
    const items = match.trim().split(/\n/).map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });
  // Paragraphes
  s = s.split(/\n\n+/).map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    if (/^<(ul|blockquote|h[1-6])/.test(trimmed)) return trimmed;
    return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  return s;
}

// === Helpers forum ===
function memberNameById(id) {
  const m = members.find(x => x.id === id);
  if (!m) return 'Membre supprimé';
  return `${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email;
}
function memberStructureById(id) {
  const m = members.find(x => x.id === id);
  return m?.structure || '';
}
function fmtDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

// === Pages publiques dynamiques ===
app.get('/', (req, res) => {
  res.send(renderPage(indexTpl, {
    HERO_CARD: renderHeroCard(heroCard),
    ACTUALITES: renderActualites(actualites),
    CONGRES_CARD: renderCongresCard(congres, false)
  }));
});

app.get('/congres', (req, res) => {
  res.send(renderPage(congresTpl, {
    CONGRES_YEAR: escapeHtml(String(congres.year || '')),
    CONGRES_THEME: escapeHtml(congres.theme || ''),
    CONGRES_CARD_FULL: renderCongresCard(congres, true)
  }));
});

app.get('/prix', (req, res) => {
  const featuredYears = prix.filter(p => p.featured).map(p => p.year).sort((a,b) => b-a);
  const currentYear = featuredYears[0] || new Date().getFullYear();
  res.send(renderPage(prixTpl, {
    PRIX_CURRENT_YEAR: escapeHtml(String(currentYear)),
    PRIX_FEATURED: renderPrix(prix, true),
    PRIX_ARCHIVES: renderPrix(prix, false)
  }));
});

// === Autres pages statiques ===
const STATIC_PAGES = {
  '/association': 'pages/association.html',
  '/archives': 'pages/archives.html',
  '/articles': 'pages/articles.html',
  '/contact': 'pages/contact.html',
};
Object.entries(STATIC_PAGES).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    const fp = join(__dirname, file);
    existsSync(fp) ? res.sendFile(fp) : res.status(404).send(`Page manquante: ${file}`);
  });
});

// === API publique ===
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'messages requis' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.includes('xxx')) return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurée. Copie .env.example → .env et renseigne ta clé.' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  try {
    const client = new Anthropic({ apiKey: key });
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt + '\n\n' + buildContext(lastUser),
      messages: messages.slice(-8),
    });
    stream.on('text', t => res.write(`data: ${JSON.stringify({ type: 'text', text: t })}\n\n`));
    stream.on('message', () => { res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`); res.end(); });
    stream.on('error', e => { res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`); res.end(); });
  } catch (e) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`);
    res.end();
  }
});

app.get('/api/search', (req, res) => {
  const { q = '', limit = 300 } = req.query;
  const results = search(q, parseInt(limit)).map(({ id, title, theme, year, excerpt, url, pdfFile }) =>
    ({ id, title, theme, year, excerpt, url, pdfFile }));
  res.json({ query: q, count: results.length, results });
});

app.get('/api/stats', (req, res) => {
  const themes = {};
  articles.forEach(a => { themes[a.theme] = (themes[a.theme] || 0) + 1; });
  const years = articles.filter(a => a.year).map(a => a.year);
  res.json({
    totalArticles: articles.length,
    totalBulletins: bulletins.length,
    themes,
    yearsRange: years.length ? { min: Math.min(...years), max: Math.max(...years) } : null
  });
});

app.get('/article/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const art = articles.find(a => a.id === id);
  if (!art) return res.status(404).send('<h1>Article introuvable</h1><p><a href="/articles">← Retour aux articles</a></p>');
  if (!articleTpl) return res.status(500).send('Template manquant');
  res.send(renderArticle(art));
});

// === ROUTES ADMIN ===
app.get('/admin', (req, res) => {
  if (!isAuthed(req)) return res.send(adminLoginTpl || 'Template login manquant');
  res.send(adminTpl || 'Template admin manquant');
});

app.post('/admin/login', (req, res) => {
  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected === 'change-me-please') {
    return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré dans .env' });
  }
  if (password !== expected) return res.status(401).json({ error: 'Mot de passe incorrect' });
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { expires: Date.now() + SESSION_TTL });
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_TTL/1000}`);
  res.json({ ok: true });
});

app.post('/admin/logout', (req, res) => {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`);
  res.json({ ok: true });
});

// --- Prompt IA ---
app.get('/admin/api/prompt', requireAuth, (req, res) => {
  let defaultPrompt = '';
  let backupPrompt = '';
  try { defaultPrompt = readFileSync(join(__dirname, 'data/system-prompt.default.txt'), 'utf8'); } catch {}
  try { backupPrompt = readFileSync(join(__dirname, 'data/system-prompt.backup.txt'), 'utf8'); } catch {}
  res.json({
    current: systemPrompt,
    default: defaultPrompt,
    hasBackup: !!backupPrompt
  });
});
app.put('/admin/api/prompt', requireAuth, (req, res) => {
  const { prompt } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'prompt requis (non vide)' });
  if (prompt.length > 50000) return res.status(400).json({ error: 'prompt trop long (max 50 000 caractères)' });
  // Sauvegarde de l'ancien avant écrasement
  try { writeFileSync(join(__dirname, 'data/system-prompt.backup.txt'), systemPrompt); } catch {}
  writeFileSync(join(__dirname, 'data/system-prompt.txt'), prompt);
  systemPrompt = prompt;
  res.json({ ok: true });
});
app.post('/admin/api/prompt/restore-backup', requireAuth, (req, res) => {
  try {
    const backup = readFileSync(join(__dirname, 'data/system-prompt.backup.txt'), 'utf8');
    if (!backup.trim()) return res.status(400).json({ error: 'Aucune sauvegarde disponible' });
    // Le courant devient la nouvelle sauvegarde
    writeFileSync(join(__dirname, 'data/system-prompt.backup.txt'), systemPrompt);
    writeFileSync(join(__dirname, 'data/system-prompt.txt'), backup);
    systemPrompt = backup;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Restauration impossible: ' + e.message });
  }
});
app.post('/admin/api/prompt/restore-default', requireAuth, (req, res) => {
  try {
    const def = readFileSync(join(__dirname, 'data/system-prompt.default.txt'), 'utf8');
    if (!def.trim()) return res.status(500).json({ error: 'Version par défaut introuvable' });
    writeFileSync(join(__dirname, 'data/system-prompt.backup.txt'), systemPrompt);
    writeFileSync(join(__dirname, 'data/system-prompt.txt'), def);
    systemPrompt = def;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Hero card ---
app.get('/admin/api/hero', requireAuth, (req, res) => res.json(heroCard));
app.put('/admin/api/hero', requireAuth, (req, res) => {
  heroCard = req.body;
  saveJson('data/hero-card.json', heroCard);
  res.json({ ok: true });
});

// --- Prix ---
app.get('/admin/api/prix', requireAuth, (req, res) => res.json(prix));
app.put('/admin/api/prix', requireAuth, (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'tableau requis' });
  prix = req.body;
  saveJson('data/prix.json', prix);
  res.json({ ok: true });
});

// --- Actualités ---
app.get('/admin/api/actualites', requireAuth, (req, res) => res.json(actualites));
app.put('/admin/api/actualites', requireAuth, (req, res) => {
  actualites = req.body;
  saveJson('data/actualites.json', actualites);
  res.json({ ok: true });
});

// --- Congrès ---
app.get('/admin/api/congres', requireAuth, (req, res) => res.json(congres));
app.put('/admin/api/congres', requireAuth, (req, res) => {
  congres = req.body;
  saveJson('data/congres.json', congres);
  res.json({ ok: true });
});

// --- Bulletins ---
app.get('/admin/api/bulletins', requireAuth, (req, res) => res.json(bulletins));
app.put('/admin/api/bulletins', requireAuth, (req, res) => {
  bulletins = req.body;
  saveJson('data/bulletins-index.json', bulletins);
  res.json({ ok: true });
});
app.post('/admin/api/bulletins/upload/:year',
  requireAuth,
  express.raw({ type: 'application/pdf', limit: '50mb' }),
  (req, res) => {
    const year = parseInt(req.params.year);
    if (!year || year < 2000 || year > 2100) return res.status(400).json({ error: 'Année invalide' });
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'PDF vide' });
    const file = `bulletin-${year}.pdf`;
    writeFileSync(join(__dirname, 'assets/pdfs', file), req.body);
    res.json({ ok: true, file, size: req.body.length });
  }
);
app.delete('/admin/api/bulletins/:year', requireAuth, (req, res) => {
  const year = parseInt(req.params.year);
  bulletins = bulletins.filter(b => b.year !== year);
  saveJson('data/bulletins-index.json', bulletins);
  const pdfPath = join(__dirname, 'assets/pdfs', `bulletin-${year}.pdf`);
  if (existsSync(pdfPath)) try { unlinkSync(pdfPath); } catch {}
  res.json({ ok: true });
});

// --- Articles (CRUD manuel) ---
app.get('/admin/api/articles', requireAuth, (req, res) => {
  res.json(articles.map(({ id, title, theme, year, excerpt, pdfFile, url }) =>
    ({ id, title, theme, year, excerpt, pdfFile, url })));
});
app.post('/admin/api/articles', requireAuth, (req, res) => {
  const { title, theme, year, content } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title requis' });
  const id = Math.max(0, ...articles.map(a => a.id)) + 1;
  const article = {
    id,
    title: String(title),
    theme: theme || 'Technique thermale',
    year: year ? parseInt(year) : null,
    content: String(content || ''),
    excerpt: String(content || '').substring(0, 400).replace(/\n/g, ' ').trim() + '…',
    url: `/article/${id}`,
  };
  articles.push(article);
  saveJson('data/articles.json', articles);
  res.json({ ok: true, id, article });
});
app.put('/admin/api/articles/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = articles.findIndex(a => a.id === id);
  if (idx < 0) return res.status(404).json({ error: 'introuvable' });
  const a = articles[idx];
  const { title, theme, year, content } = req.body || {};
  if (title !== undefined) a.title = String(title);
  if (theme !== undefined) a.theme = String(theme);
  if (year !== undefined) a.year = year ? parseInt(year) : null;
  if (content !== undefined) {
    a.content = String(content);
    a.excerpt = a.content.substring(0, 400).replace(/\n/g, ' ').trim() + '…';
  }
  articles[idx] = a;
  saveJson('data/articles.json', articles);
  res.json({ ok: true });
});
app.delete('/admin/api/articles/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const art = articles.find(a => a.id === id);
  if (art?.pdfFile) {
    const pdfPath = join(__dirname, 'assets/pdfs/articles', art.pdfFile);
    if (existsSync(pdfPath)) try { unlinkSync(pdfPath); } catch {}
  }
  articles = articles.filter(a => a.id !== id);
  saveJson('data/articles.json', articles);
  res.json({ ok: true });
});

// Upload / remplacement PDF pour un article
app.post('/admin/api/articles/:id/pdf',
  requireAuth,
  express.raw({ type: 'application/pdf', limit: '30mb' }),
  (req, res) => {
    const id = parseInt(req.params.id);
    const idx = articles.findIndex(a => a.id === id);
    if (idx < 0) return res.status(404).json({ error: 'Article introuvable' });
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'PDF vide' });
    const file = `article-${id}.pdf`;
    writeFileSync(join(__dirname, 'assets/pdfs/articles', file), req.body);
    articles[idx].pdfFile = file;
    saveJson('data/articles.json', articles);
    res.json({ ok: true, file, size: req.body.length });
  }
);

// Retirer le PDF d'un article (revient au mode texte)
app.delete('/admin/api/articles/:id/pdf', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const idx = articles.findIndex(a => a.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Article introuvable' });
  const a = articles[idx];
  if (a.pdfFile) {
    const pdfPath = join(__dirname, 'assets/pdfs/articles', a.pdfFile);
    if (existsSync(pdfPath)) try { unlinkSync(pdfPath); } catch {}
    delete a.pdfFile;
    saveJson('data/articles.json', articles);
  }
  res.json({ ok: true });
});

// === ROUTES MEMBRES (public) ===
function renderMemberPage(tpl, subs = {}) {
  return renderPage(tpl, subs);
}

// Login
app.get('/membres/login', (req, res) => {
  if (getMember(req)) return res.redirect('/membres/profil');
  res.send(renderMemberPage(memberLoginTpl, { ERROR: '' }));
});
app.post('/membres/login', async (req, res) => {
  const { email, password } = req.body || {};
  const m = findMemberByEmail(email);
  if (!m || m.status !== 'active' || !m.passwordHash) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  const ok = await bcrypt.compare(password || '', m.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  m.lastLoginAt = new Date().toISOString();
  saveMembers();
  const token = randomBytes(32).toString('hex');
  memberSessions.set(token, { memberId: m.id, expires: Date.now() + MEMBER_TTL });
  res.setHeader('Set-Cookie', `${MEMBER_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${MEMBER_TTL/1000}`);
  res.json({ ok: true });
});
app.post('/membres/logout', (req, res) => {
  const token = parseCookies(req)[MEMBER_COOKIE];
  if (token) memberSessions.delete(token);
  res.setHeader('Set-Cookie', `${MEMBER_COOKIE}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`);
  res.json({ ok: true });
});

// Profil
app.get('/membres/profil', (req, res) => {
  const m = getMember(req);
  if (!m) return res.redirect('/membres/login');
  res.send(renderMemberPage(memberProfileTpl, {
    FIRST_NAME: escapeHtml(m.firstName || ''),
    LAST_NAME: escapeHtml(m.lastName || ''),
    EMAIL: escapeHtml(m.email),
    STRUCTURE: escapeHtml(m.structure || '—'),
    LAST_LOGIN: m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString('fr-FR') : 'Première connexion',
    MEMBER_SINCE: m.activatedAt ? new Date(m.activatedAt).toLocaleDateString('fr-FR') : '—'
  }));
});

// Activation (lien reçu par mail)
app.get('/membres/activer', (req, res) => {
  const { token } = req.query;
  const m = members.find(x => x.activationToken === token);
  if (!m || !m.activationExpires || new Date(m.activationExpires) < new Date()) {
    return res.send(renderMemberPage(memberActivateTpl, { TOKEN: '', EMAIL: '', STATE: 'invalid' }));
  }
  res.send(renderMemberPage(memberActivateTpl, {
    TOKEN: escapeHtml(token), EMAIL: escapeHtml(m.email), STATE: 'ok'
  }));
});
app.post('/membres/activer', async (req, res) => {
  const { token, password } = req.body || {};
  const m = members.find(x => x.activationToken === token);
  if (!m || !m.activationExpires || new Date(m.activationExpires) < new Date()) {
    return res.status(400).json({ error: 'Lien invalide ou expiré' });
  }
  if (!password || password.length < 8) return res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' });
  m.passwordHash = await bcrypt.hash(password, 10);
  m.status = 'active';
  m.activationToken = null;
  m.activationExpires = null;
  m.activatedAt = new Date().toISOString();
  saveMembers();
  res.json({ ok: true });
});

// Mot de passe oublié
app.get('/membres/mot-de-passe-oublie', (req, res) => {
  res.send(renderMemberPage(memberResetReqTpl, {}));
});
app.post('/membres/mot-de-passe-oublie', async (req, res) => {
  const { email } = req.body || {};
  const m = findMemberByEmail(email);
  if (m && m.status === 'active') {
    m.resetToken = randomUUID();
    m.resetExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    saveMembers();
    const link = `${appUrl()}/membres/reinitialiser?token=${m.resetToken}`;
    try {
      await sendMail({
        to: m.email,
        subject: 'AFTh — Réinitialisation de votre mot de passe',
        text: `Bonjour ${m.firstName},\n\nVous avez demandé la réinitialisation de votre mot de passe sur l'espace membres AFTh.\n\nCliquez sur ce lien (valable 30 minutes) :\n${link}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\n— L'AFTh`,
        html: `<p>Bonjour ${escapeHtml(m.firstName)},</p><p>Vous avez demandé la réinitialisation de votre mot de passe sur l'espace membres AFTh.</p><p><a href="${link}">Cliquez ici pour choisir un nouveau mot de passe</a> (lien valable 30 minutes).</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p><p>— L'AFTh</p>`
      });
    } catch (e) { console.error('Mail reset error:', e.message); }
  }
  // Réponse identique pour ne pas révéler si l'email existe
  res.json({ ok: true });
});

app.get('/membres/reinitialiser', (req, res) => {
  const { token } = req.query;
  const m = members.find(x => x.resetToken === token);
  if (!m || !m.resetExpires || new Date(m.resetExpires) < new Date()) {
    return res.send(renderMemberPage(memberResetConfirmTpl, { TOKEN: '', STATE: 'invalid' }));
  }
  res.send(renderMemberPage(memberResetConfirmTpl, { TOKEN: escapeHtml(token), STATE: 'ok' }));
});
app.post('/membres/reinitialiser', async (req, res) => {
  const { token, password } = req.body || {};
  const m = members.find(x => x.resetToken === token);
  if (!m || !m.resetExpires || new Date(m.resetExpires) < new Date()) {
    return res.status(400).json({ error: 'Lien invalide ou expiré' });
  }
  if (!password || password.length < 8) return res.status(400).json({ error: 'Mot de passe : 8 caractères minimum' });
  m.passwordHash = await bcrypt.hash(password, 10);
  m.resetToken = null;
  m.resetExpires = null;
  saveMembers();
  res.json({ ok: true });
});

// API profil membre
app.get('/api/me', (req, res) => {
  const m = getMember(req);
  res.json(m ? sanitizeMember(m) : null);
});
app.put('/api/me', requireMember, async (req, res) => {
  const m = req.member;
  const { firstName, lastName, structure, newPassword, currentPassword } = req.body || {};
  if (firstName !== undefined) m.firstName = String(firstName);
  if (lastName !== undefined) m.lastName = String(lastName);
  if (structure !== undefined) m.structure = String(structure);
  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, m.passwordHash))) {
      return res.status(403).json({ error: 'Mot de passe actuel incorrect' });
    }
    if (newPassword.length < 8) return res.status(400).json({ error: '8 caractères min.' });
    m.passwordHash = await bcrypt.hash(newPassword, 10);
  }
  saveMembers();
  res.json({ ok: true });
});

// === ROUTES ADMIN — MEMBRES ===

// Liste
app.get('/admin/api/members', requireAuth, (req, res) => {
  res.json(members.map(sanitizeMember));
});

// Stockage transitoire des imports en attente (preview → apply)
const pendingImports = new Map();

// Upload + preview + diff
app.post('/admin/api/members/import/preview',
  requireAuth,
  express.raw({ type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','application/octet-stream','text/plain'], limit: '10mb' }),
  (req, res) => {
    try {
      if (!req.body || !req.body.length) return res.status(400).json({ error: 'Fichier vide' });
      let rows;
      try {
        const wb = XLSX.read(req.body, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      } catch (e) { return res.status(400).json({ error: 'Impossible de lire le fichier : ' + e.message }); }

      if (!rows.length) return res.status(400).json({ error: 'Aucune ligne dans la 1ère feuille' });

      const findCol = (row, aliases) => {
        const keys = Object.keys(row);
        for (const a of aliases) {
          const k = keys.find(k => k.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g,'') === a);
          if (k) return k;
        }
        return null;
      };
      const sample = rows[0];
      const colEmail = findCol(sample, ['email','e-mail','mail','courriel','adresse email','adresse mail']);
      const colFirst = findCol(sample, ['prenom','prénom','first name','firstname']);
      const colLast = findCol(sample, ['nom','last name','lastname','name']);
      const colStruct = findCol(sample, ['structure','organisation','etablissement','société','societe','entreprise']);

      if (!colEmail) return res.status(400).json({ error: 'Colonne email introuvable (acceptées : Email, Mail, Courriel…)' });

      const parsed = [], errors = [];
      rows.forEach((r, i) => {
        const email = String(r[colEmail] || '').trim().toLowerCase();
        if (!email) { errors.push({ line: i+2, error: 'Email vide' }); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errors.push({ line: i+2, error: 'Email invalide: ' + email }); return; }
        parsed.push({
          email,
          firstName: colFirst ? String(r[colFirst] || '').trim() : '',
          lastName: colLast ? String(r[colLast] || '').trim() : '',
          structure: colStruct ? String(r[colStruct] || '').trim() : ''
        });
      });

      // Diff
      const incomingEmails = new Set(parsed.map(p => p.email));
      const existingEmails = new Set(members.filter(m => m.status === 'active' || m.status === 'pending').map(m => m.email.toLowerCase()));
      const toAdd = parsed.filter(p => !existingEmails.has(p.email));
      const toKeep = parsed.filter(p => existingEmails.has(p.email));
      const toRevoke = members
        .filter(m => (m.status === 'active' || m.status === 'pending') && !incomingEmails.has(m.email.toLowerCase()))
        .map(sanitizeMember);

      const stageId = randomUUID();
      pendingImports.set(stageId, { toAdd, toRevoke, parsed, errors, createdAt: Date.now() });
      // Nettoie les imports vieux de plus de 30 min
      for (const [id, data] of pendingImports) {
        if (Date.now() - data.createdAt > 30 * 60 * 1000) pendingImports.delete(id);
      }

      res.json({
        stageId,
        columns: { email: colEmail, firstName: colFirst, lastName: colLast, structure: colStruct },
        totalRows: rows.length,
        validRows: parsed.length,
        errors,
        toAdd,
        toKeep: toKeep.length,
        toRevoke,
        sample: parsed.slice(0, 5)
      });
    } catch (e) {
      res.status(500).json({ error: 'Erreur serveur: ' + e.message });
    }
  }
);

// Appliquer un import
app.post('/admin/api/members/import/apply', requireAuth, (req, res) => {
  const { stageId, addEmails, revokeEmails } = req.body || {};
  const stage = pendingImports.get(stageId);
  if (!stage) return res.status(400).json({ error: 'Import introuvable ou expiré — relancez la prévisualisation.' });

  const addSet = new Set((addEmails || stage.toAdd.map(a => a.email)).map(e => e.toLowerCase()));
  const revokeSet = new Set((revokeEmails || stage.toRevoke.map(r => r.email)).map(e => e.toLowerCase()));

  const added = [], revoked = [];
  // Ajouts
  stage.toAdd.forEach(p => {
    if (!addSet.has(p.email)) return;
    if (findMemberByEmail(p.email)) return;
    const id = 'm-' + randomUUID().slice(0, 8);
    const activationToken = randomUUID();
    const newMember = {
      id, email: p.email, firstName: p.firstName, lastName: p.lastName, structure: p.structure,
      passwordHash: null, status: 'pending',
      activationToken, activationExpires: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      resetToken: null, resetExpires: null,
      createdAt: new Date().toISOString(), activatedAt: null, lastLoginAt: null
    };
    members.push(newMember);
    added.push(newMember);
  });
  // Révocations
  members.forEach(m => {
    if (revokeSet.has(m.email.toLowerCase()) && m.status !== 'revoked') {
      m.status = 'revoked';
      m.passwordHash = null;
      m.activationToken = null;
      m.resetToken = null;
      m.revokedAt = new Date().toISOString();
      revoked.push(m);
    }
  });

  saveMembers();
  // Stage conservé pour permettre l'envoi d'emails juste après
  stage.addedIds = added.map(a => a.id);
  stage.revokedEmails = revoked.map(r => r.email);

  res.json({
    ok: true,
    added: added.map(sanitizeMember),
    revoked: revoked.map(sanitizeMember)
  });
});

// Envoi des emails post-apply
app.post('/admin/api/members/import/send-emails', requireAuth, async (req, res) => {
  const { stageId } = req.body || {};
  const stage = pendingImports.get(stageId);
  if (!stage) return res.status(400).json({ error: 'Import introuvable ou expiré' });

  const results = { activation: [], revocation: [], errors: [] };

  for (const id of (stage.addedIds || [])) {
    const m = members.find(x => x.id === id);
    if (!m || !m.activationToken) continue;
    const link = `${appUrl()}/membres/activer?token=${m.activationToken}`;
    try {
      await sendMail({
        to: m.email,
        subject: 'AFTh — Bienvenue sur l\'espace membres',
        text: `Bonjour ${m.firstName},\n\nVotre adhésion à l'AFTh vous donne accès à l'espace membres (forum, archives techniques).\n\nCréez votre mot de passe en cliquant sur ce lien (valable 7 jours) :\n${link}\n\n— L'AFTh`,
        html: `<p>Bonjour ${escapeHtml(m.firstName)},</p><p>Votre adhésion à l'AFTh vous donne accès à l'espace membres (forum, archives techniques).</p><p><a href="${link}">Cliquez ici pour créer votre mot de passe</a> (lien valable 7 jours).</p><p>— L'AFTh</p>`
      });
      results.activation.push(m.email);
    } catch (e) {
      results.errors.push({ email: m.email, error: e.message });
    }
  }

  for (const email of (stage.revokedEmails || [])) {
    try {
      await sendMail({
        to: email,
        subject: 'AFTh — Fin d\'accès à l\'espace membres',
        text: `Bonjour,\n\nVotre adhésion à l'AFTh n'ayant pas été renouvelée pour cette année, votre accès à l'espace membres est désormais désactivé.\n\nPour renouveler votre adhésion ou pour toute question, contactez-nous : info@afth.asso.fr\n\n— L'AFTh`,
        html: `<p>Bonjour,</p><p>Votre adhésion à l'AFTh n'ayant pas été renouvelée pour cette année, votre accès à l'espace membres est désormais désactivé.</p><p>Pour renouveler votre adhésion ou pour toute question : <a href="mailto:info@afth.asso.fr">info@afth.asso.fr</a></p><p>— L'AFTh</p>`
      });
      results.revocation.push(email);
    } catch (e) {
      results.errors.push({ email, error: e.message });
    }
  }

  pendingImports.delete(stageId);
  res.json({ ok: true, ...results });
});

// Actions individuelles sur un membre
app.post('/admin/api/members/:id/resend-activation', requireAuth, async (req, res) => {
  const m = members.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Membre introuvable' });
  m.activationToken = randomUUID();
  m.activationExpires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  m.status = 'pending';
  saveMembers();
  const link = `${appUrl()}/membres/activer?token=${m.activationToken}`;
  try {
    await sendMail({
      to: m.email,
      subject: 'AFTh — Lien d\'activation renouvelé',
      text: `Bonjour ${m.firstName},\n\nVoici un nouveau lien d'activation pour l'espace membres AFTh (valable 7 jours) :\n${link}\n\n— L'AFTh`,
      html: `<p>Bonjour ${escapeHtml(m.firstName)},</p><p><a href="${link}">Cliquez ici pour activer votre compte</a> (lien valable 7 jours).</p><p>— L'AFTh</p>`
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
  res.json({ ok: true });
});

app.delete('/admin/api/members/:id', requireAuth, (req, res) => {
  const i = members.findIndex(m => m.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Introuvable' });
  members.splice(i, 1);
  saveMembers();
  res.json({ ok: true });
});

// === FORUM (espace membre) ===

function ensureMember(req, res) {
  const m = getMember(req);
  if (!m) {
    res.redirect('/membres/login?next=' + encodeURIComponent(req.originalUrl));
    return null;
  }
  return m;
}

// Index : catégories + fils récents
app.get('/forum', (req, res) => {
  const me = ensureMember(req, res);
  if (!me) return;
  const cats = forumDb.prepare(`
    SELECT c.id, c.slug, c.name, c.description, c.icon,
           (SELECT COUNT(*) FROM threads WHERE category_id = c.id) thread_count,
           (SELECT COUNT(*) FROM posts p JOIN threads t ON t.id = p.thread_id WHERE t.category_id = c.id) post_count
    FROM categories c ORDER BY sort_order
  `).all();
  const recent = forumDb.prepare(`
    SELECT t.*, c.slug cat_slug, c.name cat_name, c.icon cat_icon
    FROM threads t JOIN categories c ON c.id = t.category_id
    ORDER BY t.last_post_at DESC LIMIT 10
  `).all();
  const catList = cats.map(c => `
    <a href="/forum/c/${c.slug}" class="forum-cat">
      <div class="forum-cat-icon">${c.icon}</div>
      <div class="forum-cat-info">
        <div class="forum-cat-name">${escapeHtml(c.name)}</div>
        <div class="forum-cat-desc">${escapeHtml(c.description || '')}</div>
      </div>
      <div class="forum-cat-meta"><strong>${c.thread_count}</strong> fils<br><span>${c.post_count} posts</span></div>
    </a>`).join('');
  const recentList = recent.length ? recent.map(t => `
    <a href="/forum/t/${t.id}" class="forum-recent-item">
      <span class="forum-recent-cat">${t.cat_icon} ${escapeHtml(t.cat_name)}</span>
      <span class="forum-recent-title">${escapeHtml(t.title)}</span>
      <span class="forum-recent-meta">${escapeHtml(memberNameById(t.author_id))} · ${fmtDate(t.last_post_at)} · ${t.post_count} posts</span>
    </a>`).join('') : '<p class="forum-empty">Aucun fil pour l\'instant. Soyez le premier à lancer une discussion !</p>';
  res.send(renderPage(forumIndexTpl, {
    CATEGORIES: catList,
    RECENT: recentList,
    MEMBER_NAME: escapeHtml(me.firstName || me.email)
  }));
});

// Catégorie : fils paginés
app.get('/forum/c/:slug', (req, res) => {
  const me = ensureMember(req, res);
  if (!me) return;
  const cat = forumDb.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
  if (!cat) return res.status(404).send('Catégorie introuvable');
  const threads = forumDb.prepare(`
    SELECT * FROM threads WHERE category_id = ? ORDER BY last_post_at DESC LIMIT 100
  `).all(cat.id);
  const list = threads.length ? threads.map(t => `
    <a href="/forum/t/${t.id}" class="forum-thread-row">
      <div class="forum-thread-title">${escapeHtml(t.title)}</div>
      <div class="forum-thread-meta">
        <span>Par <strong>${escapeHtml(memberNameById(t.author_id))}</strong></span>
        <span>·</span>
        <span>${t.post_count} post${t.post_count>1?'s':''}</span>
        <span>·</span>
        <span>Dernier : ${fmtDate(t.last_post_at)}</span>
      </div>
    </a>`).join('') : '<p class="forum-empty">Aucun fil dans cette catégorie.</p>';
  res.send(renderPage(forumCategoryTpl, {
    CAT_ICON: cat.icon,
    CAT_NAME: escapeHtml(cat.name),
    CAT_DESC: escapeHtml(cat.description || ''),
    CAT_SLUG: cat.slug,
    THREADS: list
  }));
});

// Formulaire : nouveau fil
app.get('/forum/c/:slug/nouveau', (req, res) => {
  const me = ensureMember(req, res);
  if (!me) return;
  const cat = forumDb.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
  if (!cat) return res.status(404).send('Catégorie introuvable');
  res.send(renderPage(forumNewThreadTpl, {
    CAT_NAME: escapeHtml(cat.name),
    CAT_SLUG: cat.slug,
    CAT_ID: String(cat.id)
  }));
});

// Fil avec tous ses posts
app.get('/forum/t/:id', (req, res) => {
  const me = ensureMember(req, res);
  if (!me) return;
  const tid = parseInt(req.params.id);
  const thread = forumDb.prepare(`
    SELECT t.*, c.slug cat_slug, c.name cat_name, c.icon cat_icon
    FROM threads t JOIN categories c ON c.id = t.category_id WHERE t.id = ?
  `).get(tid);
  if (!thread) return res.status(404).send('<h1>Fil introuvable</h1><p><a href="/forum">← Forum</a></p>');
  const posts = forumDb.prepare('SELECT * FROM posts WHERE thread_id = ? ORDER BY created_at').all(tid);
  const postsHtml = posts.map((p, i) => {
    const isAuthor = p.author_id === me.id;
    const authorName = memberNameById(p.author_id);
    const structure = memberStructureById(p.author_id);
    const edited = p.updated_at ? `<span class="post-edited">(modifié le ${fmtDate(p.updated_at)})</span>` : '';
    const actions = isAuthor ? `
      <div class="post-actions">
        <button class="mini-btn" onclick="editPost(${p.id})">✏️ Modifier</button>
        <button class="mini-btn danger" onclick="deletePost(${p.id}, ${i === 0 ? 1 : 0})">🗑 Supprimer</button>
      </div>` : '';
    return `
      <article class="forum-post" id="post-${p.id}" data-id="${p.id}">
        <div class="post-head">
          <div class="post-author">
            <div class="post-avatar">${escapeHtml(authorName[0] || '?')}</div>
            <div>
              <div class="post-author-name">${escapeHtml(authorName)}${i === 0 ? ' <span class="post-op">AUTEUR</span>' : ''}</div>
              ${structure ? `<div class="post-author-struct">${escapeHtml(structure)}</div>` : ''}
            </div>
          </div>
          <div class="post-date">${fmtDate(p.created_at)} ${edited}</div>
        </div>
        <div class="post-body" id="post-body-${p.id}">${mdToHtml(p.body)}</div>
        ${actions}
      </article>`;
  }).join('');
  res.send(renderPage(forumThreadTpl, {
    THREAD_ID: String(tid),
    THREAD_TITLE: escapeHtml(thread.title),
    CAT_SLUG: thread.cat_slug,
    CAT_NAME: escapeHtml(thread.cat_name),
    CAT_ICON: thread.cat_icon,
    POSTS: postsHtml,
    POST_COUNT: String(thread.post_count)
  }));
});

// API forum (JSON, protégé)
app.post('/forum/api/threads', requireMember, (req, res) => {
  const { categoryId, title, body } = req.body || {};
  if (!title?.trim() || !body?.trim() || !categoryId) return res.status(400).json({ error: 'Titre, message et catégorie requis' });
  if (title.length > 200) return res.status(400).json({ error: 'Titre trop long (200 max)' });
  if (body.length > 20000) return res.status(400).json({ error: 'Message trop long (20 000 max)' });
  const cat = forumDb.prepare('SELECT id FROM categories WHERE id = ?').get(parseInt(categoryId));
  if (!cat) return res.status(400).json({ error: 'Catégorie invalide' });
  const now = new Date().toISOString();
  const tx = forumDb.transaction(() => {
    const tr = forumDb.prepare('INSERT INTO threads (category_id, author_id, title, created_at, last_post_at, post_count) VALUES (?,?,?,?,?,1)')
      .run(cat.id, req.member.id, title.trim(), now, now);
    forumDb.prepare('INSERT INTO posts (thread_id, author_id, body, created_at) VALUES (?,?,?,?)')
      .run(tr.lastInsertRowid, req.member.id, body.trim(), now);
    return tr.lastInsertRowid;
  });
  const id = tx();
  res.json({ ok: true, threadId: id });
});

app.post('/forum/api/threads/:id/reply', requireMember, (req, res) => {
  const tid = parseInt(req.params.id);
  const { body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'Message vide' });
  if (body.length > 20000) return res.status(400).json({ error: 'Message trop long' });
  const thread = forumDb.prepare('SELECT id FROM threads WHERE id = ?').get(tid);
  if (!thread) return res.status(404).json({ error: 'Fil introuvable' });
  const now = new Date().toISOString();
  const tx = forumDb.transaction(() => {
    forumDb.prepare('INSERT INTO posts (thread_id, author_id, body, created_at) VALUES (?,?,?,?)')
      .run(tid, req.member.id, body.trim(), now);
    forumDb.prepare('UPDATE threads SET last_post_at = ?, post_count = post_count + 1 WHERE id = ?').run(now, tid);
  });
  tx();
  res.json({ ok: true });
});

app.get('/forum/api/posts/:id/raw', requireMember, (req, res) => {
  const pid = parseInt(req.params.id);
  const post = forumDb.prepare('SELECT body, author_id FROM posts WHERE id = ?').get(pid);
  if (!post) return res.status(404).json({ error: 'Introuvable' });
  if (post.author_id !== req.member.id) return res.status(403).json({ error: 'Interdit' });
  res.json({ body: post.body });
});

app.put('/forum/api/posts/:id', requireMember, (req, res) => {
  const pid = parseInt(req.params.id);
  const { body } = req.body || {};
  if (!body?.trim()) return res.status(400).json({ error: 'Message vide' });
  const post = forumDb.prepare('SELECT * FROM posts WHERE id = ?').get(pid);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });
  if (post.author_id !== req.member.id) return res.status(403).json({ error: 'Vous ne pouvez éditer que vos propres posts' });
  forumDb.prepare('UPDATE posts SET body = ?, updated_at = ? WHERE id = ?')
    .run(body.trim(), new Date().toISOString(), pid);
  res.json({ ok: true });
});

app.delete('/forum/api/posts/:id', requireMember, (req, res) => {
  const pid = parseInt(req.params.id);
  const post = forumDb.prepare('SELECT * FROM posts WHERE id = ?').get(pid);
  if (!post) return res.status(404).json({ error: 'Post introuvable' });
  if (post.author_id !== req.member.id) return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres posts' });

  const posts = forumDb.prepare('SELECT id, created_at FROM posts WHERE thread_id = ? ORDER BY created_at').all(post.thread_id);
  const isFirst = posts[0]?.id === pid;

  const tx = forumDb.transaction(() => {
    if (isFirst) {
      // Suppression du premier post = suppression du fil entier
      forumDb.prepare('DELETE FROM posts WHERE thread_id = ?').run(post.thread_id);
      forumDb.prepare('DELETE FROM threads WHERE id = ?').run(post.thread_id);
    } else {
      forumDb.prepare('DELETE FROM posts WHERE id = ?').run(pid);
      forumDb.prepare('UPDATE threads SET post_count = post_count - 1 WHERE id = ?').run(post.thread_id);
      const lastRemaining = forumDb.prepare('SELECT created_at FROM posts WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1').get(post.thread_id);
      if (lastRemaining) forumDb.prepare('UPDATE threads SET last_post_at = ? WHERE id = ?').run(lastRemaining.created_at, post.thread_id);
    }
  });
  tx();
  res.json({ ok: true, threadDeleted: isFirst });
});

// === ADMIN forum (modération) ===
app.get('/admin/api/forum/threads', requireAuth, (req, res) => {
  const list = forumDb.prepare(`
    SELECT t.*, c.name cat_name, c.slug cat_slug, c.icon cat_icon
    FROM threads t JOIN categories c ON c.id = t.category_id
    ORDER BY t.last_post_at DESC
  `).all();
  res.json(list.map(t => ({
    ...t,
    author_name: memberNameById(t.author_id)
  })));
});

app.delete('/admin/api/forum/threads/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  forumDb.prepare('DELETE FROM posts WHERE thread_id = ?').run(id);
  forumDb.prepare('DELETE FROM threads WHERE id = ?').run(id);
  res.json({ ok: true });
});

app.delete('/admin/api/forum/posts/:id', requireAuth, (req, res) => {
  const pid = parseInt(req.params.id);
  const post = forumDb.prepare('SELECT * FROM posts WHERE id = ?').get(pid);
  if (!post) return res.status(404).json({ error: 'Introuvable' });
  const posts = forumDb.prepare('SELECT id FROM posts WHERE thread_id = ? ORDER BY created_at').all(post.thread_id);
  const isFirst = posts[0]?.id === pid;
  const tx = forumDb.transaction(() => {
    if (isFirst) {
      forumDb.prepare('DELETE FROM posts WHERE thread_id = ?').run(post.thread_id);
      forumDb.prepare('DELETE FROM threads WHERE id = ?').run(post.thread_id);
    } else {
      forumDb.prepare('DELETE FROM posts WHERE id = ?').run(pid);
      forumDb.prepare('UPDATE threads SET post_count = post_count - 1 WHERE id = ?').run(post.thread_id);
    }
  });
  tx();
  res.json({ ok: true });
});

// === Static EN DERNIER pour ne pas shadower les routes ===
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n🌊 AFTh → http://localhost:${PORT}`);
  console.log(`🔐 Admin → http://localhost:${PORT}/admin`);
  console.log(`👥 Membres → http://localhost:${PORT}/membres/login`);
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('xxx'))
    console.log('⚠️  ANTHROPIC_API_KEY manquante → chat IA désactivé');
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'change-me-please')
    console.log('⚠️  ADMIN_PASSWORD manquant ou par défaut → admin désactivé');
  if (!process.env.SMTP_HOST)
    console.log('ℹ️  SMTP non configuré → emails affichés dans cette console (mode dev)');
});
