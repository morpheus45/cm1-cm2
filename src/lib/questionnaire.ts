import { TROUBLES, type Degre, type Profil, type Trouble } from './adaptations';

/**
 * Un questionnaire de REPÉRAGE, pas un diagnostic : l'adulte qui connaît
 * l'enfant dit, pour chaque comportement, s'il l'observe jamais, parfois ou
 * souvent. L'application en déduit une proposition de troubles et de
 * degrés, que l'adulte valide ou non. Seul un professionnel de santé pose un
 * diagnostic. Les réponses ne quittent pas la tablette, et ne sont pas gardées.
 */

export const REPONSES = ['Jamais', 'Parfois', 'Souvent'] as const;
/** 0 : jamais, 1 : parfois, 2 : souvent. */
export type Reponse = 0 | 1 | 2;

export const QUESTIONNAIRE: Record<Trouble, { titre: string; affirmations: string[] }> = {
  dyslexie: {
    titre: 'La lecture',
    affirmations: [
      'L\'enfant lit de manière hésitante en faisant des pauses fréquentes.',
      'L\'enfant confond visuellement certaines lettres qui se ressemblent.',
      'L\'enfant devine la fin des mots longs au lieu de les lire.',
      'L\'enfant saute régulièrement des mots ou des lignes entières en lisant.',
      'L\'enfant comprend mal le sens d\'un texte lu seul.',
      'L\'enfant lit très lentement par rapport aux autres camarades de classe.',
    ],
  },
  dysorthographie: {
    titre: 'L\'orthographe',
    affirmations: [
      'L\'enfant oublie souvent des lettres au milieu des mots écrits.',
      'L\'enfant écrit le même mot avec plusieurs orthographes différentes.',
      'L\'enfant colle plusieurs mots ensemble au lieu de les séparer.',
      'L\'enfant applique difficilement les règles simples d\'accord en écrivant.',
      'L\'enfant écrit les sons de façon phonétique sans respecter l\'orthographe usuelle.',
      'L\'enfant fait de nombreuses erreurs même en recopiant un texte court.',
    ],
  },
  dyscalculie: {
    titre: 'Les nombres et le calcul',
    affirmations: [
      'L\'enfant compte encore sur ses doigts pour des calculs très faciles.',
      'L\'enfant confond facilement les symboles mathématiques comme le plus et le moins.',
      'L\'enfant a du mal à retenir les tables de multiplication de base.',
      'L\'enfant peine à comparer deux nombres pour dire quel est le plus grand.',
      'L\'enfant a des difficultés pour lire l\'heure sur une horloge à aiguilles.',
      'L\'enfant ne sait pas comment poser correctement une opération sur le papier.',
    ],
  },
  dysgraphie: {
    titre: 'L\'écriture à la main',
    affirmations: [
      'L\'enfant tient son crayon avec une crispation visible des doigts.',
      'L\'enfant trace des lettres de tailles très inégales sur la page.',
      'L\'enfant a du mal à respecter la ligne horizontale du cahier.',
      'L\'enfant se plaint de douleurs dans la main après avoir écrit.',
      'L\'enfant produit une écriture difficile à relire par les autres personnes.',
      'L\'enfant met un temps excessif pour écrire une simple phrase.',
    ],
  },
  dyspraxie: {
    titre: 'Les gestes et l\'espace',
    affirmations: [
      'L\'enfant a du mal à utiliser des ciseaux pour découper droit.',
      'L\'enfant renverse souvent des objets posés sur sa table de travail.',
      'L\'enfant peine à nouer ses lacets ou boutonner ses vêtements seul.',
      'L\'enfant se cogne fréquemment contre les meubles ou les encadrements de porte.',
      'L\'enfant a des difficultés pour reproduire un modèle en dessin ou géométrie.',
      'L\'enfant manipule difficilement des instruments scolaires comme la règle ou l\'équerre.',
    ],
  },
  dysphasie: {
    titre: 'Le langage oral',
    affirmations: [
      'L\'enfant cherche régulièrement ses mots pour exprimer une idée simple.',
      'L\'enfant construit des phrases dans un ordre de mots inhabituel.',
      'L\'enfant comprend mal les consignes orales contenant plusieurs étapes successives.',
      'L\'enfant utilise des gestes pour compenser un manque d\'expression verbale.',
      'L\'enfant a du mal à raconter clairement un événement récemment vécu.',
      'L\'enfant a des difficultés pour prononcer correctement certains mots longs et complexes.',
    ],
  },
  tdah: {
    titre: 'L\'attention et l\'agitation',
    affirmations: [
      'L\'enfant quitte souvent sa chaise sans attendre la fin du travail.',
      'L\'enfant interrompt régulièrement les autres sans attendre son tour de parole.',
      'L\'enfant perd constamment ses affaires scolaires ou personnelles dans la journée.',
      'L\'enfant est distrait par le moindre bruit dans son environnement immédiat.',
      'L\'enfant commence plusieurs activités à la fois sans en terminer aucune.',
      'L\'enfant agit de manière impulsive avant d\'écouter les consignes données.',
    ],
  },
};

/** Par trouble, le total des réponses (de 0 à 12) : 4 ou plus, « un peu » ; 8 ou plus, « beaucoup ». */
export const SEUIL_LEGER = 4;
export const SEUIL_MARQUE = 8;

export function suggestion(reponses: Partial<Record<Trouble, Reponse[]>>): Profil['troubles'] {
  const troubles: Profil['troubles'] = {};
  for (const trouble of TROUBLES) {
    const total = (reponses[trouble] ?? []).reduce<number>((somme, reponse) => somme + (reponse ?? 0), 0);
    const degre: Degre | 0 = total >= SEUIL_MARQUE ? 2 : total >= SEUIL_LEGER ? 1 : 0;
    if (degre) troubles[trouble] = degre;
  }
  return troubles;
}
