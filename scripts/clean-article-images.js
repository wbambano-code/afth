import { readFileSync, writeFileSync, existsSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

const articles = JSON.parse(readFileSync('data/articles.json', 'utf8'));
const MIN_SIZE = 1500; // octets
let removedTags = 0, deletedFiles = 0, strippedDims = 0;

articles.forEach(a => {
  if (!a.content_html) return;

  // Trouve toutes les balises img
  let html = a.content_html;
  const imgRegex = /<img[^>]+>/g;
  const imgs = html.match(imgRegex) || [];

  imgs.forEach(imgTag => {
    const srcMatch = imgTag.match(/src="([^"]+)"/);
    if (!srcMatch) return;
    const src = srcMatch[1];
    const localPath = src.replace(/^\//, '');

    // Si fichier local ET trop petit → on retire l'img tag + on supprime le fichier
    if (src.startsWith('/assets/images/articles/')) {
      let size = 0;
      try { size = statSync(localPath).size; } catch {}
      if (size > 0 && size < MIN_SIZE) {
        html = html.replace(imgTag, '');
        try { unlinkSync(localPath); deletedFiles++; } catch {}
        removedTags++;
        return;
      }
    }

    // Sinon : on retire les attributs width/height qui forcent un affichage minuscule
    if (/(width|height)\s*=/.test(imgTag)) {
      const cleanTag = imgTag.replace(/\s*(width|height)="[^"]*"/g, '');
      html = html.replace(imgTag, cleanTag);
      strippedDims++;
    }
  });

  // Nettoie les paragraphes vides résultants
  html = html.replace(/<p>\s*<strong>\s*<\/strong>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<strong>\s*<\/strong>/g, '');

  // Recompte les images restantes
  const remainingImgs = html.match(/<img/g);
  a.imageCount = remainingImgs ? remainingImgs.length : 0;
  a.content_html = html;
});

writeFileSync('data/articles.json', JSON.stringify(articles, null, 2));

const withRealImages = articles.filter(a => a.imageCount > 0);
console.log(`✅ Nettoyage terminé`);
console.log(`  ${removedTags} balises <img> retirées (icônes < ${MIN_SIZE} octets)`);
console.log(`  ${deletedFiles} fichiers supprimés`);
console.log(`  ${strippedDims} attributs width/height nettoyés`);
console.log(`  ${withRealImages.length} articles ont encore au moins une image`);
console.log('');
console.log('Articles avec images visibles :');
withRealImages.sort((a,b) => b.imageCount - a.imageCount).forEach(a => {
  console.log(`  #${String(a.id).padEnd(4)} [${a.imageCount} img] ${a.title.substring(0,60)}`);
});
