import { describe, expect, it } from 'vitest';
import { createRng } from '../lib/seededRandom';
import { ALL_TRIMESTERS, type Level, type Trimester } from '../types';
import { generate as generateAccords } from './accords';
import { generate as generateOrthographe } from './orthographe';
import {
  ADJECTIVES,
  NOUNS,
  adjectiveForm,
  nounForm,
  type Adjective,
  type Gender,
  type GrammaticalNumber,
  type Noun,
} from './accordsLexique';
import { ALL_VERBS } from './conjugaisonVerbes';

/**
 * Ce fichier vérifie, à partir du lexique lui-même (genre, nombre,
 * homophones), qu'une question n'a jamais deux bonnes réponses et qu'aucune
 * association absurde (sujet/verbe, nom/adjectif, possessif/sujet) n'est
 * proposée. C'est le filet qui a manqué avant la relecture manuelle :
 * « des grandes filles/lampes », « Marion range ses/ces affaires », etc.
 */

const LEVELS: Level[] = ['CM1', 'CM2'];
const NUMBERS: GrammaticalNumber[] = ['singulier', 'pluriel'];
const GENDERS: Gender[] = ['m', 'f'];
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 733 + 11);

function everyAccords(count: number) {
  return LEVELS.flatMap((level) =>
    ALL_TRIMESTERS.flatMap((trimester) => SEEDS.flatMap((seed) => generateAccords(level, trimester, createRng(seed), count)))
  );
}

function everyOrthographe(count: number) {
  return LEVELS.flatMap((level) =>
    ALL_TRIMESTERS.flatMap((trimester) => SEEDS.flatMap((seed) => generateOrthographe(level, trimester, createRng(seed), count)))
  );
}

// --- Index du lexique : quelle(s) case(s) genre/nombre chaque mot occupe. ---

const nounFormIndex = new Map<string, { noun: Noun; number: GrammaticalNumber }>();
NOUNS.forEach((noun) => {
  NUMBERS.forEach((number) => {
    nounFormIndex.set(nounForm(noun, number), { noun, number });
  });
});

const adjectiveFormIndex = new Map<string, { gender: Gender; number: GrammaticalNumber }[]>();
ADJECTIVES.forEach((adjective) => {
  GENDERS.forEach((gender) => {
    NUMBERS.forEach((number) => {
      const word = adjectiveForm(adjective, gender, number);
      const entries = adjectiveFormIndex.get(word) ?? [];
      entries.push({ gender, number });
      adjectiveFormIndex.set(word, entries);
    });
  });
});

/** Enlève l'article (un/une/des) et le trou « ... » pour ne garder que le mot fixe. */
function fixedWordOf(prompt: string): string {
  return prompt.split(' ').slice(1).join(' ').replace('...', '').trim();
}

describe('accords — une seule bonne réponse, jamais une association absurde', () => {
  const questions = everyAccords(24);

  it('le lexique ne confond pas deux noms ou deux adjectifs sous la même forme', () => {
    // Si ce test échoue, les vérifications ci-dessous ne veulent plus rien dire.
    NOUNS.forEach((noun) => {
      NUMBERS.forEach((number) => {
        expect(nounFormIndex.get(nounForm(noun, number))?.noun).toBe(noun);
      });
    });
  });

  it('groupe nominal (nom manquant) : un seul choix a le bon genre et le bon nombre', () => {
    questions
      .filter((q) => q.id.startsWith('accords-nominal-'))
      .forEach((q) => {
        // Le nombre vient toujours de l'article (un/une = singulier, des =
        // pluriel) : sans fixer ça d'abord, une forme d'adjectif invariable
        // au-delà du genre (« mauvais » masculin singulier ET pluriel)
        // ferait croire à une ambiguïté qui n'existe pas pour l'élève, qui
        // lit l'article avant l'adjectif.
        const article = q.prompt.split(' ')[0];
        const number: GrammaticalNumber = article === 'des' ? 'pluriel' : 'singulier';
        const adjectiveWord = fixedWordOf(q.prompt);
        const slotsAtNumber = (adjectiveFormIndex.get(adjectiveWord) ?? []).filter((slot) => slot.number === number);
        expect(slotsAtNumber.length, `adjectif inconnu dans « ${q.prompt} » au ${number}`).toBeGreaterThan(0);
        // « un »/« une » donnent le genre directement ; « des » ne le donne
        // pas — seul l'adjectif peut alors le trahir (ou pas, s'il est
        // invariable en genre, auquel cas les deux genres restent acceptés).
        const genders: Gender[] = article === 'des' ? slotsAtNumber.map((slot) => slot.gender) : [article === 'un' ? 'm' : 'f'];
        const valid = q.choices.map((choice) => {
          const entry = nounFormIndex.get(choice);
          if (!entry) return false;
          return entry.number === number && genders.includes(entry.noun.gender);
        });
        expect(valid.filter(Boolean).length, q.prompt).toBe(1);
        expect(valid[q.correctIndex], q.prompt).toBe(true);
      });
  });

  it('groupe nominal (adjectif manquant) : un seul choix accorde avec le nom donné', () => {
    questions
      .filter((q) => q.id.startsWith('accords-adjectif-'))
      .forEach((q) => {
        const nounWord = fixedWordOf(q.prompt);
        const entry = nounFormIndex.get(nounWord);
        expect(entry, `nom inconnu dans « ${q.prompt} »`).toBeDefined();
        const valid = q.choices.map((choice) => {
          const slots = adjectiveFormIndex.get(choice) ?? [];
          return slots.some((slot) => slot.gender === entry!.noun.gender && slot.number === entry!.number);
        });
        expect(valid.filter(Boolean).length, q.prompt).toBe(1);
        expect(valid[q.correctIndex], q.prompt).toBe(true);
      });
  });

  it('sujet + verbe : le sujet est toujours une personne, jamais un objet ou un lieu', () => {
    questions
      .filter((q) => q.id.startsWith('accords-sujet-'))
      .forEach((q) => {
        const nounWord = q.prompt.split(' ')[1];
        const entry = nounFormIndex.get(nounWord);
        expect(entry, `sujet inconnu dans « ${q.prompt} »`).toBeDefined();
        expect(entry!.noun.category, q.prompt).toBe('personne');
      });
  });

  it('adjectif et nom partagent une catégorie de sens (jamais « un jardin fort »)', () => {
    questions
      .filter((q) => q.id.startsWith('accords-nominal-') || q.id.startsWith('accords-adjectif-'))
      .forEach((q) => {
        const words = q.prompt.replace('...', '').split(' ').slice(1).filter(Boolean);
        const nounWord = words.find((word) => nounFormIndex.has(word));
        const adjectiveWord = words.find((word) => adjectiveFormIndex.has(word));
        if (!nounWord || !adjectiveWord) return;
        const noun = nounFormIndex.get(nounWord)!.noun;
        const adjective = ADJECTIVES.find(
          (candidate) =>
            GENDERS.some((g) => NUMBERS.some((n) => adjectiveForm(candidate, g, n) === adjectiveWord))
        ) as Adjective | undefined;
        expect(adjective, adjectiveWord).toBeDefined();
        expect(adjective!.categories, q.prompt).toContain(noun.category);
      });
  });
});

describe('conjugaison — aucun possessif figé qui ne suit pas le sujet', () => {
  it("aucun complément de verbe ne porte un possessif (son/sa/ses/leur...) puisqu'il est réutilisé avec tous les sujets", () => {
    const forbidden = /\b(son|sa|ses|ton|ta|tes|leur|leurs|notre|nos|votre|vos)\b/i;
    ALL_VERBS.forEach((verb) => {
      expect(verb.complement, verb.infinitive).not.toMatch(forbidden);
    });
  });

  it('« être » utilise un attribut invariable en genre, pour convenir aux sujets féminins et masculins', () => {
    // Sans ça, « Elle est très content. » resterait faux : le sujet peut être
    // féminin (Elle, Léa, Marion...) dans conjugaison.ts.
    const invariantAdjectives = ['calme', 'sage', 'rapide', 'malade', 'aimable', 'timide', 'honnête', 'sympathique', 'célèbre', 'tranquille'];
    const etre = ALL_VERBS.find((verb) => verb.infinitive === 'être');
    expect(etre).toBeDefined();
    const word = etre!.complement.replace(/^très /, '').replace(/\.$/, '');
    expect(invariantAdjectives).toContain(word);
  });
});

// --- Homophones : la substitution par le compagnon (pairPartner) doit ------
// --- toujours casser la phrase, jamais rester valable. ---------------------

/** Vrai si substituer le compagnon de l'homophone garde une phrase valable —
 *  ce qui serait un vrai bug (deux réponses justes). Chaque famille est
 *  structurellement sans ambiguïté, SAUF ses/ces sans marqueur dédié. */
function pairPartnerAlsoFits(correct: string, prompt: string): boolean {
  if (correct === 'ces') return !prompt.includes('-là');
  if (correct === 'ses') return !prompt.includes('propres');
  return false;
}

describe('orthographe — homophones : jamais deux mots possibles', () => {
  const questions = everyOrthographe(30).filter((q) => q.id.startsWith('orthographe-homophone-'));

  it('chaque énoncé a exactement un trou à compléter', () => {
    questions.forEach((q) => {
      expect(q.prompt.split('...').length - 1, q.prompt).toBe(1);
    });
  });

  it('le compagnon de l\'homophone ne peut jamais remplacer la bonne réponse', () => {
    questions.forEach((q) => {
      const correct = q.choices[q.correctIndex].toLowerCase();
      expect(pairPartnerAlsoFits(correct, q.prompt), q.prompt).toBe(false);
    });
  });
});
