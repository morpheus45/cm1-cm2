# Conformité aux exigences de l'Éducation nationale — audit de septembre 2026

L'application est utilisée en classe par des élèves de CM1 et de CM2 : elle
doit être accessible, protéger les données des enfants, rester neutre, et
suivre les programmes en vigueur. Ce document dit ce qui a été vérifié, ce qui
a été corrigé, et ce qui reste à faire hors du code.

## Ce qui a été vérifié, et comment

| Domaine | Méthode | Résultat |
|---|---|---|
| Accessibilité (RGAA 4.1, WCAG 2.1 AA) | axe-core 4.13 sur 14 écrans (règles WCAG A/AA et bonnes pratiques) ; contrastes mesurés texte par texte ; parcours au clavier seul ; texte agrandi à 150 et 200 % sur un téléphone ; largeur de 320 px ; portrait et paysage | 0 défaut après corrections |
| Données personnelles (RGPD) | inventaire des données (tablette, base, comptes) ; hébergement ; durée de conservation ; droits ; cookies ; information des familles | corrigé, voir plus bas |
| Sécurité | recherche de secrets dans le site publié ; `npm audit` ; politique de sécurité du contenu, éprouvée par un script et un traceur injectés ; règles d'accès de la base (tests SQL) | aucun secret, aucune vulnérabilité dans ce que reçoivent les élèves |
| Neutralité commerciale | recherche de marques dans tous les contenus ; requêtes réseau de chaque écran | aucune publicité, aucun traceur ; une marque retirée |
| Programmes | français et mathématiques (BO n° 16 du 17 avril 2025, CM1 depuis 2025, CM2 depuis 2026) ; histoire-géographie du CM1 (BO n° 22 du 28 mai 2026) ; CM2 : programme de 2020 en 2026-2027 | trois écarts corrigés, des manques notés |
| Exactitude et neutralité | relecture de toutes les questions d'histoire et de géographie, et des banques de français | quelques imprécisions corrigées |

Les sites du ministère (education.gouv.fr, eduscol) ne sont pas joignables
depuis l'environnement de travail : les programmes ont été vérifiés sur leurs
résumés publics et les documents d'accompagnement cités. Une relecture sur le
texte du BO reste souhaitable.

## Corrections apportées

**Accessibilité.** Toute l'application est dans une zone principale
(`<main>`) ; chaque écran a un titre de premier niveau (caché à l'écran pour
les questions : « Séance de français, question 3 sur 12 », que le lecteur
d'écran annonce à chaque question) ; après une réponse, le focus passe sur
« Continuer » au lieu de se perdre, et le verdict est annoncé ; l'application
n'est plus bloquée en portrait une fois installée (RGAA 13.9) ; les boutons et
les mots trop longs passent à la ligne quand le texte est agrandi.

**Données des élèves.**
- Conservation d'une année scolaire : chaque 1er septembre, ce qui date de
  l'année précédente est effacé, dans la base (`supabase/005_conservation_une_annee.sql`,
  tâche pg_cron de chaque nuit) et sur les tablettes (`src/lib/conservation.ts`,
  au lancement ; le prénom, le code de classe, la file d'envoi et les étoiles
  de l'an dernier partent aussi). Un test vérifie que chaque donnée gardée sur
  la tablette a sa règle.
- L'élève n'écrit plus que l'initiale de son nom (« Léa M. »). Un nom complet
  saisi auparavant reste tel quel, pour ne pas couper un dossier en deux.
- Page « Informations pour les familles » (`#informations`) : données,
  finalité, destinataires, hébergeurs, durée, droits, cookies, accessibilité,
  éditeur. Liens depuis l'accueil et depuis la connexion de la maîtresse.
- Le chat avec Claude rappelle de n'y écrire aucun nom d'élève.

**Sécurité.** Politique de sécurité du contenu stricte, écrite au build
(`src/lib/securityPolicy.ts`) : scripts du site seulement, connexions au site
et à la base de la classe seulement, aucun `unsafe-inline`. Aucun lien ne
transmet l'adresse de l'application (`referrer`). Mot de passe de 12
caractères au moins pour un nouveau compte de maîtresse (recommandation de la
CNIL), les comptes existants se connectant toujours.

**Programmes.**
- Passé simple : seulement aux troisièmes personnes, comme à l'école
  élémentaire (« Nous eûmes peur » remplacé).
- Décimaux : introduits au CM1 (3e trimestre), retravaillés dès la rentrée du
  CM2, comme le demande le programme de 2025 ; ils n'arrivaient qu'au milieu
  du CM2.
- Accord du participe passé avec « être » : dès le CM1, avec le passé
  composé ; il n'arrivait qu'au CM2.
- Grands nombres écrits avec leurs classes séparées (« 3 095 204 238 ») ;
  les années restent collées (« 1789 »).

**Contenus.** Jacques Cartier en 1534 (golfe, puis le fleuve en 1535) ; lois
Ferry (instruction obligatoire, école publique gratuite) ; premières lignes de
chemin de fer (fin des années 1820) ; La Marseillaise (1795 puis 1879) ;
laïcité (loi de 1905 et Constitution) ; accès à Internet (un habitant sur
quatre hors ligne, UIT 2025) ; eau potable ; fibre optique ; côte
méditerranéenne ; un distracteur ambigu (« un vieux tour ») ; une marque
commerciale retirée d'une question sur les grands magasins.

**Lisibilité pour les élèves.** Les questions sont lues par des enfants de 8 à
11 ans. Tout ce qu'un élève peut lire pendant une séance (5 671 textes) a été
mesuré : longueur des phrases, indice de lisibilité LIX, ponctuation. Les
explications passent d'un LIX médian de 26 à 21 ; plus aucun point-virgule
(il y en avait dans 379 explications), plus aucune phrase de plus de 18 mots,
plus de parenthèses en histoire-géographie ; les réponses font 12 mots au
plus. Les questions de dates se lisent désormais « 1789 : la prise de la
Bastille. En quel siècle ? », les repères sont plus courts (« le premier
train au départ de Paris »), les définitions plus simples (« vivre bien
aujourd'hui sans abîmer la planète de demain »), et les textes de l'accueil
tutoient l'élève. Le test `src/domains/lisibilite.test.ts` garde ces règles.
L'assistant Claude de la maîtresse reçoit la même consigne pour ses énoncés.

## Décisions

- Durée de conservation : une année scolaire.
- Nom de famille : l'initiale seulement.
- Code pour l'espace maîtresse d'une tablette partagée : décision reportée.
  Aujourd'hui, sur une tablette partagée, « Continuer sans compte » montre les
  séances faites sur cette tablette.

## Ce qui reste à faire hors du code

1. Exécuter `005_conservation_une_annee.sql` dans Supabase (il efface aussitôt
   ce qui date d'avant le 1er septembre 2026), régler la longueur minimale des
   mots de passe, fermer les inscriptions une fois les comptes créés, signer le
   DPA de Supabase (voir `supabase/LISEZMOI.md`).
2. Faire inscrire le traitement au registre de l'école, avec la direction et
   le délégué à la protection des données de l'académie, qui dira si une
   analyse d'impact est utile.
3. Donner aux familles le lien de la page d'informations.
4. Relire les progressions sur le texte du BO.

## Manques connus (pas des erreurs)

- Mathématiques 2025 : pas encore de probabilités ni de « pensée algébrique » ;
  la proportionnalité n'arrive qu'à la fin du CM2 ; le programme la travaille
  dès le CM1.
- Français : les synonymes n'arrivent qu'à la fin du CM2 ; le passé simple
  pourrait commencer plus tôt.
- Aucun audit RGAA complet (106 critères) n'a été mené par un auditeur.
- Les outils de développement (Vite 5, Vitest 2) ont des vulnérabilités
  connues ; elles ne concernent que la machine du développeur, pas le site
  publié. Leur mise à jour est une tâche à part.
