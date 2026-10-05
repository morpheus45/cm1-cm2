import { useEffect, useRef, useState } from 'react';
import type { TableFact } from '../domains/tables';
import type { DepositOutcome } from '../lib/cloud';
import type { Level } from '../types';
import { NOTION_COLORS } from '../theme';
import { DeliveryNote } from './DeliveryNote';
import { Intercalaire } from './ecole/Intercalaire';
import { NoteEntouree } from './ecole/NoteEntouree';
import { Tampon } from './ecole/Tampon';
import { NumberPad } from './NumberPad';
import { ProgressBar } from './ProgressBar';
import { useScreenTitle } from './useScreenTitle';

interface TablesScreenProps {
  facts: TableFact[];
  name?: string;
  level: Level;
  delivery?: DepositOutcome | 'pending' | null;
  /** Une bonne réponse : une étoile de plus. */
  onCorrect: () => void;
  /** La série est finie : le score part dans le carnet de l'élève. */
  onFinished: (correct: number, total: number) => void;
  onRestart: () => void;
  onQuit: () => void;
}

const JUSTE = NOTION_COLORS.numeration;
const A_REVOIR = NOTION_COLORS.accords;
const TABLES = NOTION_COLORS.calcul;

/**
 * Les tables de multiplication : du calcul mental, donc pas de brouillon.
 * Le calcul s'affiche en grand, l'élève tape le résultat sur le pavé (ou au
 * clavier), voit tout de suite si c'est juste, et passe au suivant. À la fin,
 * les résultats manqués sont rappelés, pour savoir quoi réviser.
 */
export function TablesScreen({ facts, name, level, delivery = null, onCorrect, onFinished, onRestart, onQuit }: TablesScreenProps) {
  const [index, setIndex] = useState(0);
  const [given, setGiven] = useState('');
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);
  const titleRef = useScreenTitle(finished ? 'fin' : index);

  const fact = facts[index];
  const correct = given !== '' && Number(given.replace(',', '.')) === fact?.result;

  const validate = () => {
    if (checked || given === '') return;
    setChecked(true);
    setAnswers((list) => [...list, correct]);
    if (correct) onCorrect();
  };

  const next = () => {
    if (!checked) return;
    if (index + 1 < facts.length) {
      setIndex(index + 1);
      setGiven('');
      setChecked(false);
      return;
    }
    const score = answers.filter(Boolean).length;
    onFinished(score, facts.length);
    setFinished(true);
  };

  useEffect(() => {
    if (checked) continueRef.current?.focus({ preventScroll: true });
  }, [checked]);

  // Au clavier d'un ordinateur : les chiffres, Retour arrière, Entrée.
  useEffect(() => {
    if (finished) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLButtonElement && event.key === 'Enter') return;
      if (/^[0-9]$/.test(event.key) && !checked) {
        setGiven((value) => (value.length >= 3 ? value : value + event.key));
      } else if (event.key === 'Backspace' && !checked) {
        setGiven((value) => value.slice(0, -1));
      } else if (event.key === 'Enter') {
        if (checked) next();
        else validate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (finished) {
    const score = answers.filter(Boolean).length;
    const missed = facts.filter((_, position) => !answers[position]);
    const ratio = facts.length > 0 ? score / facts.length : 0;
    const headline = ratio === 1 ? 'Sans faute !' : ratio >= 0.5 ? 'Bravo !' : 'Bien essayé !';
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-8">
        <section className="cahier flex flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
          <h1 ref={titleRef} tabIndex={-1} className="text-base font-bold uppercase tracking-[0.18em] text-encre-douce focus:outline-none">
            Tables de multiplication terminées
          </h1>
          <Tampon tilt={-7} className="text-2xl sm:text-3xl">
            {headline}
          </Tampon>
          {name && <p className="font-cursive text-2xl leading-[2] text-encre">{name}</p>}
          <NoteEntouree score={score} total={facts.length} />
          {missed.length > 0 && (
            <div className="w-full rounded-2xl border-l-4 px-4 py-3 text-left" style={{ background: A_REVOIR.tint, borderColor: A_REVOIR.band }}>
              <p className="text-base font-bold text-encre">À revoir :</p>
              <ul className="mt-1 grid grid-cols-2 gap-x-4 text-xl text-encre">
                {missed.map((item) => (
                  <li key={item.id}>
                    {item.a} × {item.b} = <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <DeliveryNote delivery={delivery} level={level} />
        </section>
        <div className="flex w-full flex-col gap-3">
          <button type="button" onClick={onRestart} className="bouton-encre w-full py-4 text-xl">
            Une autre série
          </button>
          <button type="button" onClick={onQuit} className="etiquette w-full py-3.5 text-xl">
            Terminer
          </button>
        </div>
      </div>
    );
  }

  if (!fact) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 px-4 py-5">
      <div className="flex items-start gap-3">
        <button type="button" onClick={onQuit} className="etiquette shrink-0 px-3 py-1.5 text-sm">
          Quitter
        </button>
        <div className="flex-1">
          <ProgressBar current={index + 1} total={facts.length} label="Calcul" colors={Array(facts.length).fill(TABLES.band)} />
        </div>
      </div>

      <h1 ref={titleRef} tabIndex={-1} className="sr-only">
        Tables de multiplication, calcul {index + 1} sur {facts.length}
      </h1>

      <section className="cahier flex flex-col items-center gap-3 rounded-3xl py-6 pl-12 pr-5 text-center shadow-[0_1px_0_rgba(30,42,74,0.08),0_14px_28px_-18px_rgba(30,42,74,0.45)]">
        <div className="-ml-9 self-start">
          <Intercalaire domain="calcul" prefix="Tables" />
        </div>
        <p className="text-lg font-bold text-encre-douce">Donne le résultat de tête</p>
        <p className="text-6xl font-bold text-encre" aria-label={`${fact.a} fois ${fact.b}`}>
          {fact.a} × {fact.b}
        </p>
      </section>

      <NumberPad value={given} onChange={(value) => setGiven(value.replace(',', ''))} disabled={checked} />

      <p className="sr-only" role="status">
        {checked ? (correct ? 'Bravo, c’est juste.' : `${fact.a} fois ${fact.b} égale ${fact.result}.`) : ''}
      </p>

      {!checked ? (
        <button type="button" disabled={given === ''} onClick={validate} className="bouton-encre py-4 text-xl">
          Valider
        </button>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {correct ? (
            <Tampon color={JUSTE.deep} tilt={-4} className="text-lg">
              Bravo&nbsp;!
            </Tampon>
          ) : (
            <p className="text-center text-2xl font-bold" style={{ color: A_REVOIR.deep }}>
              {fact.a} × {fact.b} = {fact.result}
            </p>
          )}
          <button ref={continueRef} type="button" onClick={next} className="bouton-encre w-full py-4 text-xl">
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
