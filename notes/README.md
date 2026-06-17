# notes/ — mémoire de travail Claude (copie versionnée)

Ce dossier est une **copie** de la mémoire Claude locale, versionnée pour qu'elle suive le repo cross-machine.
La mémoire « vivante » utilisée par Claude reste dans `~/.claude/projects/C--afth/memory/` (locale, non transférée par git).

Contenu :
- `memory/MEMORY.md` — index
- `memory/proposition-financiere-afth.md` — grille budgétaire poste à poste du devis AFTh
- `memory/versions-css-sauvegardees.md` — contenu du dossier `_versions/` et essais CSS

## Restaurer sur une autre machine
Copier le contenu de `notes/memory/` vers le dossier mémoire local de Claude :

```bash
# adapter le chemin home selon la machine
mkdir -p ~/.claude/projects/C--afth/memory
cp -r notes/memory/* ~/.claude/projects/C--afth/memory/
```

> Pense à resynchroniser ce dossier (`cp` dans l'autre sens) si la mémoire locale évolue.
