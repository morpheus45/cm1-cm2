import { useState } from 'react';
import { TROUBLE_LABELS, TROUBLES, type Profil, type Trouble } from '../lib/adaptations';
import { QUESTIONNAIRE, REPONSES, suggestion, type Reponse } from '../lib/questionnaire';
import { Choix, Etape } from './HomeScreen';
import { useScreenTitle } from './useScreenTitle';

interface QuestionnaireScreenProps {
  prenom: string;
  onApply: (troubles: Profil['troubles']) => void;
  onCancel: () => void;
}

const DEGRE_LABELS = { 1: 'un peu', 2: 'beaucoup' } as const;

/**
 * Le questionnaire de repérage : un domaine par étape (la lecture, les
 * nombres…), sans nommer le trouble, pour ne pas orienter la réponse. La
 * proposition se lit en bas, et ne s'applique que si l'adulte la valide.
 */
export function QuestionnaireScreen({ prenom, onApply, onCancel }: QuestionnaireScreenProps) {
  const [reponses, setReponses] = useState<Partial<Record<Trouble, Reponse[]>>>({});
  const titleRef = useScreenTitle('questionnaire');
  const propose = suggestion(reponses);
  const proposes = TROUBLES.filter((trouble) => propose[trouble]);
  const repondues = TROUBLES.reduce((n, trouble) => n + (reponses[trouble]?.filter((r) => r !== undefined).length ?? 0), 0);

  const repondre = (trouble: Trouble, index: number, valeur: Reponse) => {
    const liste = [...(reponses[trouble] ?? [])];
    liste[index] = valeur;
    setReponses({ ...reponses, [trouble]: liste });
  };

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="etiquette px-3 py-1.5 text-sm">
            Retour
          </button>
          <h1 ref={titleRef} tabIndex={-1} className="text-2xl font-bold text-encre">
            Questionnaire de repérage
          </h1>
        </div>
        <p className="rounded-2xl border-l-4 border-[#B84A06] bg-[#FFEBDC] px-4 py-3 text-base text-encre">
          <strong>Ce n'est pas un diagnostic.</strong> Il aide à choisir les aides de {prenom} dans l'application. Seul un
          professionnel peut poser un diagnostic : médecin, orthophoniste, psychologue, ergothérapeute ou psychomotricien.
        </p>
        <p className="text-base text-encre-douce">
          Pour chaque phrase, dites ce que vous observez chez {prenom}, depuis plusieurs mois. Les réponses ne quittent pas
          la tablette et ne sont pas gardées.
        </p>

        {TROUBLES.map((trouble, numero) => (
          <Etape key={trouble} numero={numero + 1} titre={QUESTIONNAIRE[trouble].titre}>
            {QUESTIONNAIRE[trouble].affirmations.map((affirmation, index) => (
              <fieldset key={index} className="flex flex-col gap-2 border-t border-encre/10 pt-3 first-of-type:border-0 first-of-type:pt-0">
                <legend className="text-base text-encre">{affirmation}</legend>
                <div className="grid grid-cols-3 gap-2">
                  {REPONSES.map((label, valeur) => (
                    <Choix
                      key={label}
                      actif={reponses[trouble]?.[index] === valeur}
                      onClick={() => repondre(trouble, index, valeur as Reponse)}
                      className="px-1 py-2 text-sm"
                    >
                      {label}
                    </Choix>
                  ))}
                </div>
              </fieldset>
            ))}
          </Etape>
        ))}

        <section className="cahier flex flex-col gap-3 rounded-3xl py-5 pl-12 pr-5" aria-live="polite">
          <h2 className="-ml-9 text-xl font-bold text-encre">Proposition</h2>
          {repondues === 0 ? (
            <p className="text-base text-encre-douce">Répondez aux phrases ci-dessus : la proposition s'affiche ici.</p>
          ) : proposes.length === 0 ? (
            <p className="text-base text-encre">Aucun signe marqué pour l'instant : pas d'aide particulière proposée.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {proposes.map((trouble) => (
                <li key={trouble} className="text-lg text-encre">
                  <strong>{TROUBLE_LABELS[trouble]}</strong> : {DEGRE_LABELS[propose[trouble]!]}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-encre-douce">
            Si un domaine ressort, parlez-en à l'enseignant ou au médecin : un bilan peut confirmer ou non, et ouvrir des
            aménagements à l'école.
          </p>
        </section>

        <button type="button" disabled={repondues === 0} onClick={() => onApply(propose)} className="bouton-encre w-full py-4 text-xl">
          Utiliser cette proposition
        </button>
        <p className="text-center text-sm text-encre-douce">Les aides restent ensuite réglables une à une.</p>
      </div>
    </main>
  );
}
