import { useEffect, useState } from 'react';
import {
  AIDES_DE_BASE,
  AIDE_LABELS,
  aidesDesTroubles,
  aidesDuProfil,
  appliquerAuDocument,
  ESPACEMENT_LABELS,
  LECTURE_LABELS,
  loadProfil,
  raisons,
  saveProfil,
  TAILLE_LABELS,
  TROUBLE_HINTS,
  TROUBLE_LABELS,
  TROUBLES,
  type Aide,
  type Aides,
  type Degre,
  type Profil,
  type Trouble,
} from '../lib/adaptations';
import { Choix, Etape } from './HomeScreen';
import { Ecouter } from './Ecouter';
import { colorerChiffres, LegendeDesRangs } from './ChiffresColores';
import { useScreenTitle } from './useScreenTitle';
import { QuestionnaireScreen } from './QuestionnaireScreen';

interface AidesScreenProps {
  /** La clé de l'élève (pupilKey) : les aides sont rangées à son nom. */
  eleve: string;
  prenom: string;
  onClose: () => void;
}

const DEGRES: { valeur: Degre | 0; label: string }[] = [
  { valeur: 0, label: 'Non' },
  { valeur: 1, label: 'Un peu' },
  { valeur: 2, label: 'Beaucoup' },
];

/** L'ordre des aides à l'écran : lire, répondre, la séance, les maths, les gestes. */
const ORDRE: Aide[] = [
  'texte',
  'espacement',
  'fondUni',
  'lecture',
  'lireReponses',
  'moinsDeChoix',
  'validerEnDeuxTemps',
  'seanceCourte',
  'chiffresColores',
  'brouillonPartout',
  'sansEcritureMain',
  'sansConstructions',
  'grandesCibles',
];

function options(aide: Aide): { valeur: Aides[Aide]; label: string }[] {
  if (aide === 'texte') return Object.entries(TAILLE_LABELS).map(([valeur, label]) => ({ valeur: valeur as Aides['texte'], label }));
  if (aide === 'espacement') return Object.entries(ESPACEMENT_LABELS).map(([valeur, label]) => ({ valeur: valeur as Aides['espacement'], label }));
  if (aide === 'lecture') return Object.entries(LECTURE_LABELS).map(([valeur, label]) => ({ valeur: valeur as Aides['lecture'], label }));
  return [
    { valeur: true, label: 'Oui' },
    { valeur: false, label: 'Non' },
  ];
}

/**
 * Les aides d'un élève : ce qui est difficile pour lui, puis chaque aide qui
 * en découle, avec la raison, réglable une à une. Tout s'applique tout de
 * suite à l'écran, pour qu'on voie ce que ça change.
 */
export function AidesScreen({ eleve, prenom, onClose }: AidesScreenProps) {
  const [profil, setProfil] = useState<Profil>(() => loadProfil(eleve));
  const aides = aidesDuProfil(profil);
  const conseil = aidesDesTroubles(profil.troubles);
  const titleRef = useScreenTitle('aides');
  // Le réglage une à une est un second niveau : on voit d'abord les aides en service.
  const [detail, setDetail] = useState(false);
  const enService = ORDRE.filter((aide) => aides[aide] !== AIDES_DE_BASE[aide]);
  const valeurLue = (aide: Aide) => {
    const valeur = aides[aide];
    if (aide === 'texte') return TAILLE_LABELS[valeur as Aides['texte']];
    if (aide === 'espacement') return ESPACEMENT_LABELS[valeur as Aides['espacement']];
    if (aide === 'lecture') return LECTURE_LABELS[valeur as Aides['lecture']];
    return null;
  };

  useEffect(() => {
    saveProfil(eleve, profil);
    appliquerAuDocument(aidesDuProfil(profil));
  }, [eleve, profil]);

  const cocher = (trouble: Trouble, degre: Degre | 0) => {
    const troubles = { ...profil.troubles };
    if (degre === 0) delete troubles[trouble];
    else troubles[trouble] = degre;
    setProfil({ ...profil, troubles });
  };

  const regler = (aide: Aide, valeur: Aides[Aide]) => {
    const reglages = { ...profil.reglages };
    // Revenir à ce que conseillent les troubles efface le réglage : le conseil reprend la main.
    if (valeur === conseil[aide]) delete reglages[aide];
    else (reglages as Record<Aide, unknown>)[aide] = valeur;
    setProfil({ ...profil, reglages });
  };

  const toutEffacer = () => setProfil({ troubles: {}, reglages: {} });
  const [questionnaire, setQuestionnaire] = useState(false);
  if (questionnaire) {
    return (
      <QuestionnaireScreen
        prenom={prenom}
        onCancel={() => setQuestionnaire(false)}
        onApply={(troubles) => {
          setProfil({ ...profil, troubles });
          setQuestionnaire(false);
        }}
      />
    );
  }
  const exemple = 'Léa a 1 245 billes. Elle en gagne 38. Combien en a-t-elle maintenant ?';

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="etiquette px-3 py-1.5 text-sm">
            Retour
          </button>
          <h1 ref={titleRef} tabIndex={-1} className="text-2xl font-bold text-encre">
            Les aides de {prenom}
          </h1>
        </div>
        <p className="text-base text-encre-douce">
          À remplir avec un adulte. Ces réglages restent sur cette tablette, pour {prenom} seulement : ils ne sont jamais
          envoyés à l'école ni sur internet.
        </p>

        <Etape numero={1} titre="Ce qui est difficile">
          <button type="button" onClick={() => setQuestionnaire(true)} className="etiquette flex flex-col items-start gap-0.5 px-4 py-3 text-left">
            <span className="text-lg">Je ne sais pas : faire le questionnaire</span>
            <span className="text-sm font-normal text-encre-douce">42 phrases, environ 5 minutes. Un repérage, pas un diagnostic.</span>
          </button>
          <p className="text-sm text-encre-douce">Plusieurs choix sont possibles : les aides s'additionnent.</p>
          {TROUBLES.map((trouble) => {
            const degre = profil.troubles[trouble] ?? 0;
            return (
              <fieldset key={trouble} className="flex flex-col gap-2 border-t border-encre/10 pt-3 first-of-type:border-0 first-of-type:pt-0">
                <legend className="sr-only">{TROUBLE_LABELS[trouble]}</legend>
                <p className="text-lg font-bold text-encre">{TROUBLE_LABELS[trouble]}</p>
                <p className="text-sm text-encre-douce">{TROUBLE_HINTS[trouble]}</p>
                {/* Les boutons passent à la ligne plutôt que de se couper, même en très grand texte. */}
                <div className="flex flex-wrap gap-2">
                  {DEGRES.map(({ valeur, label }) => (
                    <Choix key={valeur} actif={degre === valeur} onClick={() => cocher(trouble, valeur)} className="flex-1 whitespace-nowrap px-3 py-2 text-base">
                      {label}
                    </Choix>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </Etape>

        <Etape numero={2} titre="Les aides">
          {enService.length === 0 ? (
            <p className="text-base text-encre-douce">Aucune aide pour l'instant. Coche ce qui est difficile, juste au-dessus.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {enService.map((aide) => (
                <li key={aide} className="flex items-start gap-2 text-base text-encre">
                  <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-encre" />
                  <span>
                    {AIDE_LABELS[aide]}
                    {valeurLue(aide) && <span className="font-bold"> : {valeurLue(aide)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            aria-expanded={detail}
            onClick={() => setDetail(!detail)}
            className="etiquette px-4 py-2 text-base"
          >
            {detail ? 'Masquer le détail' : 'Régler les aides une à une'}
          </button>
          {detail && (
            <p className="text-sm text-encre-douce">
              Elles découlent de ce qui est coché. Chacune peut être changée à la main.
            </p>
          )}
          {detail && ORDRE.map((aide) => {
            const pourquoi = raisons(profil.troubles, aide);
            const aLaMain = aide in profil.reglages;
            return (
              <fieldset key={aide} className="flex flex-col gap-2 border-t border-encre/10 pt-3 first-of-type:border-0 first-of-type:pt-0">
                <legend className="text-base font-bold text-encre">{AIDE_LABELS[aide]}</legend>
                <div className="flex flex-wrap gap-2">
                  {options(aide).map(({ valeur, label }) => (
                    <Choix key={String(valeur)} actif={aides[aide] === valeur} onClick={() => regler(aide, valeur)} className="flex-1 whitespace-nowrap px-3 py-2 text-sm">
                      {label}
                    </Choix>
                  ))}
                </div>
                {aLaMain ? (
                  <p className="text-sm text-encre-douce">
                    Réglé à la main.{' '}
                    <button type="button" onClick={() => regler(aide, conseil[aide])} className="font-bold underline decoration-2 underline-offset-4">
                      Revenir au conseil
                    </button>
                  </p>
                ) : (
                  pourquoi.length > 0 && (
                    <p className="text-sm text-encre-douce">
                      {pourquoi[0].startsWith('Retiré') ? '' : 'Conseillé : '}
                      {pourquoi.join(' · ')}
                    </p>
                  )
                )}
              </fieldset>
            );
          })}
        </Etape>

        <Etape numero={3} titre="Essayer">
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 text-[1.6rem] leading-relaxed text-encre">
              {aides.chiffresColores ? colorerChiffres(exemple) : exemple}
            </p>
            {aides.lecture !== 'non' && <Ecouter parts={[{ text: exemple, lang: 'fr-FR' }]} label="Écouter l'exemple" />}
          </div>
          {aides.chiffresColores && <LegendeDesRangs />}
        </Etape>

        <button type="button" onClick={onClose} className="bouton-encre w-full py-4 text-xl">
          C'est réglé
        </button>
        {(Object.keys(profil.troubles).length > 0 || Object.keys(profil.reglages).length > 0) && (
          <button type="button" onClick={toutEffacer} className="self-center text-sm font-bold text-encre-douce underline decoration-2 underline-offset-4">
            Effacer les aides de {prenom}
          </button>
        )}
      </div>
    </main>
  );
}
