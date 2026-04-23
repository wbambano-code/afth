// Seeder des 3 comptes membres de test
// Utilisable sur toute machine fraîche (members.json est gitignored).
// Lancement : node scripts/seed-test-members.js
//
// Mot de passe pour les 3 comptes : test1234

import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync } from 'fs';

const PASSWORD = 'test1234';

const SEED = [
  {
    id: 'm-001',
    email: 'jean.dupont@afth-test.fr',
    firstName: 'Jean',
    lastName: 'Dupont',
    structure: 'Thermes de La Bourboule'
  },
  {
    id: 'm-002',
    email: 'marie.martin@afth-test.fr',
    firstName: 'Marie',
    lastName: 'Martin',
    structure: 'KAPPA Ingénierie'
  },
  {
    id: 'm-003',
    email: 'pierre.bernard@afth-test.fr',
    firstName: 'Pierre',
    lastName: 'Bernard',
    structure: 'EAUGEO Environnement'
  }
];

let existing = [];
try { existing = JSON.parse(readFileSync('data/members.json', 'utf8')); } catch {}

const existingEmails = new Set(existing.map(m => m.email.toLowerCase()));
const hash = bcrypt.hashSync(PASSWORD, 10);
let added = 0, skipped = 0;
const now = new Date().toISOString();

SEED.forEach(m => {
  if (existingEmails.has(m.email.toLowerCase())) {
    console.log(`↷ ${m.email} déjà présent (ignoré)`);
    skipped++;
    return;
  }
  existing.push({
    ...m,
    passwordHash: hash,
    status: 'active',
    activationToken: null,
    activationExpires: null,
    resetToken: null,
    resetExpires: null,
    createdAt: now,
    activatedAt: now,
    lastLoginAt: null
  });
  console.log(`✓ ${m.email} créé`);
  added++;
});

writeFileSync('data/members.json', JSON.stringify(existing, null, 2));

console.log('');
console.log(`✅ ${added} créés · ${skipped} déjà présents · ${existing.length} membres au total`);
console.log('');
console.log('Mot de passe pour tous les comptes seedés :', PASSWORD);
console.log('Login : http://localhost:<PORT>/membres/login');
