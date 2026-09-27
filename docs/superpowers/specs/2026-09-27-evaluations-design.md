# Évaluations de la maîtresse (design)

Date : 2026-09-27
Statut : implémenté. Demande `supabase/006_evaluations.sql` dans le projet
Supabase ; sans ce fichier, l'écran des évaluations dit que cette partie
n'est pas installée, et le reste de l'application ne change pas.

## La demande

> Des évaluations qui collent avec le calendrier scolaire et académique.
> Seules les évaluations sont lancées par la maîtresse. Elle doit pouvoir
> choisir pour chaque matière les questions à poser à l'ensemble des élèves
> (même évaluation pour tous). Un contrôle des acquis, qui permettra de cibler
> aussi les révisions sur les lacunes et les fragilités de chaque élève.

Décisions prises avec l'utilisateur :

| Question | Réponse retenue |
|---|---|
| Ce que voit l'élève pendant et après | Rien, comme un vrai contrôle : ni correction, ni étoiles, ni note. À la fin : « C'est fini ! Ta maîtresse va regarder tes réponses. » |
| Zone de vacances | Zone C par défaut ; la maîtresse peut la changer. |
| Types de questions | Les questions de l'application (choix, cartes, frises, constructions de géométrie) **et** des opérations posées. |

## Le calendrier

`src/lib/calendrier.ts` porte l'arrêté du calendrier scolaire 2026-2027 : la
rentrée (mardi 1er septembre 2026), la Toussaint et Noël (communes aux trois
zones), l'hiver et le printemps (propres à chaque zone), l'été (samedi 3
juillet 2027). Il en tire les **cinq périodes** de l'année, et pour chacune la
**semaine conseillée** pour l'évaluation : la dernière avant les vacances, du
lundi au vendredi.

- Les académies de chaque zone sont écrites sous les boutons, pour choisir
  sans chercher.
- Une période correspond au trimestre de l'application (P1-P2 → 1er, P3-P4 →
  2e, P5 → 3e) : les questions proposées sont celles du programme déjà vu.
- Chaque année, l'arrêté du ministère s'ajoute à `CALENDARS`. Sans lui, la
  maîtresse choisit la période elle-même : rien ne se bloque.

## Le parcours de la maîtresse

1. **Évaluations de la classe** (bouton de l'espace maîtresse) : le
   calendrier, la zone, la liste des évaluations.
2. **Préparer une évaluation** : une matière, une période, un titre proposé
   (« Maths — fin de la période 1 »), puis, notion par notion, des questions
   à choisir une à une, avec leur figure et la bonne réponse marquée ;
   « Autres questions » en tire de nouvelles, jamais deux fois la même. Ses
   propres problèmes de la classe s'y mêlent. En maths, des opérations posées
   en plus. Quarante questions au plus.
3. **Ouvrir aux élèves** : l'évaluation apparaît sur l'accueil des tablettes
   de la classe en moins de 30 secondes. Une seule ouverte à la fois.
4. **Résultats**, qui se mettent à jour pendant l'évaluation :
   - les copies reçues, et les élèves connus qui n'ont pas encore rendu la
     leur ;
   - **à reprendre, notion par notion** : les groupes de besoin, élèves en
     maîtrise insuffisante puis fragile ;
   - **par élève** : le niveau du livret scolaire dans chaque notion ;
   - **question par question** : la réussite de la classe, les questions à
     reprendre en classe (moins d'une réussite sur deux) ;
   - la **copie** de chaque élève : ses réponses, les bonnes, et pour une
     construction ses points posés sur la figure attendue.
5. **Faire refaire** une copie (élève dérangé, absent en cours de route) :
   elle s'efface avec sa séance, et l'élève retrouve l'évaluation sur sa
   tablette.
6. **Terminer** : plus aucune tablette ne la propose. Une copie encore en
   route (tablette sans réseau) arrive tout de même.

Les opérations posées d'une évaluation rejoignent les feuilles à corriger au
stylet, intitulées « Évaluation » ; l'élève retrouve ensuite sa feuille
corrigée, comme pour les autres.

## Le parcours de l'élève

- Sur l'accueil : « Ta maîtresse a lancé une évaluation », avec un bouton
  « Commencer l'évaluation ». L'élève ne peut ni en lancer une autre, ni
  refaire celle qu'il a rendue.
- Avant de commencer : le nombre de questions, et trois phrases courtes (lis
  bien, tu ne verras pas si c'est juste, ta maîtresse corrigera).
- Chaque question : on choisit, on peut changer d'avis, puis « Valider ma
  réponse ». Pas de couleur juste/faux, pas d'explication, pas d'étoile.
- **Quitter** garde les réponses sur la tablette : l'élève reprend à la
  question où il s'était arrêté, même si la tablette a été éteinte.
- Sans réseau, la copie attend sur la tablette et part d'elle-même au retour
  du réseau.

## La révision ciblée

Après une évaluation, la **Révision ciblée** de l'élève reprend d'abord les
notions en maîtrise insuffisante de sa dernière évaluation dans la matière,
puis celles en maîtrise fragile ; une notion en sort quand l'élève l'a
retravaillée depuis et la réussit (huit réponses au moins, niveau
satisfaisant). Le reste vient, comme avant, des notions les plus fragiles de
toutes ses séances (`revisionDomains`, `src/lib/results.ts`).

Limite connue : la tablette ne connaît que ce qui a été fait sur elle. Sur
des tablettes partagées, la révision d'un élève s'appuie sur l'évaluation
faite sur cette tablette-là. La maîtresse, elle, voit les groupes de besoin
de toute la classe. Lire les résultats d'un élève d'après son seul prénom
aurait permis à n'importe quel camarade de les lire aussi : c'est écarté.

## Données et sécurité

| Table ou fonction | Qui | Ce qu'elle permet |
|---|---|---|
| `evaluations` | la maîtresse (RLS) | préparer, ouvrir, terminer, supprimer les évaluations de ses classes |
| `evaluation_copies` | la maîtresse (RLS) | lire les copies de ses élèves, en effacer une ; jamais en écrire |
| `evaluations_ouvertes(code, copies)` | la tablette | la liste légère des évaluations ouvertes de la classe |
| `questions_de_l_evaluation(code, id)` | la tablette | les questions d'une évaluation **ouverte** de la classe |
| `rendre_evaluation(…)` | la tablette | rendre sa copie, **corrigée par la base** |
| `lire_evaluations(classe)`, `lire_copies(id)` | la maîtresse | la liste et les copies, sous la RLS |

- **La base corrige** : la tablette ne décide pas seule de ce qui est juste.
  Une tablette qui se dit « juste » partout est corrigée « faux » (testé).
  Seule une construction au doigt se vérifie sur la tablette.
- **Une copie par élève** et par évaluation ; une copie renvoyée après une
  coupure n'est gardée qu'une fois.
- **Questions figées** dès la première copie : la base refuse de les changer.
- **Une copie vit avec sa séance** : effacée avec l'élève, avec l'évaluation,
  ou à la rentrée (`005_conservation_une_annee.sql`, sans modification).
- Les bonnes réponses voyagent avec les questions, comme pour les exercices :
  aucun écran ne les montre à l'élève.
- La tablette apprend qu'une copie a été effacée (« faire refaire ») par les
  identifiants de ses propres copies, tirés au hasard et connus d'elle seule.

## Le poids sur le réseau

Les tablettes redemandent la liste toutes les 30 secondes tant qu'elles sont
sur l'accueil. Cette liste ne pèse que quelques centaines d'octets ; les
questions (des cartes peuvent peser des dizaines de kilo-octets chacune) se
téléchargent **une fois par tablette**, puis restent sur la tablette. Côté
maîtresse, seules les copies de l'évaluation affichée se relisent. De quoi
rester très loin du quota gratuit de Supabase.

## Vérifications

- `bash supabase/tests/lancer.sh` : droits de la clé publique et de chaque
  maîtresse, correction par la base, copie unique, questions figées,
  effacements en cascade, conservation d'une année.
- `npm test` : correction identique à celle de la base, toutes les questions
  de l'application relues sans perte (cartes, frises, constructions),
  avancement et « faire refaire » sur la tablette, révision ciblée, dates du
  calendrier.
- Essai de bout en bout sur une vraie base PostgreSQL : une maîtresse, quatre
  tablettes d'élèves (dont une qui quitte et reprend, une sans réseau, une
  seconde copie refusée), résultats, copie refaite, correction au stylet.
- axe-core : aucun défaut sur les dix nouveaux écrans.
