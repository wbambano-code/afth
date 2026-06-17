---
name: versions-css-sauvegardees
description: Le dossier _versions/ conserve des variantes CSS/maquette du site AFTh et le script de génération du devis Word
metadata: 
  node_type: memory
  type: project
  originSessionId: 30edc9f0-5668-4567-a86b-b134cc8ebf3f
---

`C:\afth\_versions\` regroupe les versions de travail sauvegardées hors du flux principal :
- `v1-bandeau-blanc-parallax/` — variante de la home (index.html + main.css + responsive.css) avec bandeau blanc / effet parallax, conservée comme point de retour.
- `gen_proposition_docx.py` — script python-docx qui régénère `Proposition-financiere-AFTh.docx` (cf. [[proposition-financiere-afth]]).

Autres essais non suivis à la racine au 2026-06-17 : `css/main bandeau.css`, `assets/images/hero-source.jpg`, dossier `Exemple Souces/` (images de référence design).

**Why:** Will travaille par variantes CSS versionnées (cf. commits « essais CSS versionnés ») et veut pouvoir revenir en arrière + redémarrer cross-machine.
**How to apply:** ne pas supprimer ces variantes sans confirmation ; tout est committé sur origin/main pour reprise sur une autre machine.
