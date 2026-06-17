---
name: proposition-financiere-afth
description: "Grille budgétaire poste à poste du devis de refonte du site AFTh (10 000 € one-shot + ~2 000 €/an), avec modules cœur/retirables"
metadata: 
  node_type: memory
  type: project
  originSessionId: 30edc9f0-5668-4567-a86b-b134cc8ebf3f
---

Devis WTC pour la refonte du site AFTh, présenté à la FTH. Choix de présentation validés par Will (2026-06-17) : décompte **par modules activables** + colonnes **prix proposé / valeur marché**, **sans afficher de TJM** (forfait par poste), **forum et IA retirables**, le reste non-optionnel.

Document Word généré : `C:\afth\Proposition-financiere-AFTh.docx` (script régénérable : `C:\afth\_versions\gen_proposition_docx.py`).

## One-shot (total 10 000 € proposé / ~32 500 € valeur marché)
Cœur (non négociable) :
1. Socle technique & architecture — 1 100 € / ~3 500 €
2. Récupération & migration des contenus — 1 500 € / ~4 500 €
3. Modernisation graphique + logo — 1 000 € / ~2 500 €
4. Site vitrine public — 700 € / ~2 200 €
5. Actus + congrès + bulletins + bibliothèque articles — 900 € / ~2 800 €
6. Tags, filtres & recherche — 600 € / ~1 800 €
7. Espace membres (auth, import Excel, emails) — 1 100 € / ~3 500 €
8. Back-office admin autonome — 1 300 € / ~4 200 €
9. Recette, sécurité, doc & formation — 600 € / ~2 000 €
Sous-total cœur = 8 800 € / ~27 000 €

Retirables :
10. Forum + modération — 700 € / ~2 500 €
11. Moteur IA conversationnel (hors tokens) — 500 € / ~3 000 €

## Récurrent ~2 000 €/an
Hébergement ~150 · Sauvegardes/supervision ~150 · Maintenance corrective & sécurité ~700 · Maintenance évolutive ~500 · Bulletin annuel + MAJ congrès/actus ~350 · Support ~150.

## IA tokens (séparé, piloté par FTH)
Plafond proposé 5 $/mois, CB FTH, modèle économique type Haiku + cache. Relevable si usage fort / ajout réglementation.

## Scénarios
Complet : 10 000 € · ~2 000 €/an · ~5 $/mois (recommandé).
Sans forum : 9 300 € · ~1 800 €/an. Sans IA : 9 500 €. Sans forum ni IA : 8 800 € · ~1 800 €/an.

**Why:** sert de base de discussion budgétaire avec le CA de l'asso ; le découpage doit rester stable d'une réunion à l'autre.
**How to apply:** repartir de cette grille pour tout ajustement ; garder le total one-shot à 10 000 € si on rééquilibre des postes ; ne pas exposer de taux/jour. Voir [[versions-css-sauvegardees]].
