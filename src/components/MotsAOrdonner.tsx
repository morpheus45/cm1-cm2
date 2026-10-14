import { useState } from 'react';
import type { Question, VoiceLang } from '../types';
import { dire } from '../lib/voix';
import { NOTION_COLORS } from '../theme';

interface MotsAOrdonnerProps {
  wordOrder: NonNullable<Question['wordOrder']>;
  /** La langue des étiquettes : en anglais, chaque mot touché est prononcé. */
  lang?: VoiceLang;
  validated: boolean | null;
  onValidate: (correct: boolean) => void;
}

const JUSTE = NOTION_COLORS.numeration;
const A_REVOIR = NOTION_COLORS.accords;

/**
 * Remettre les mots dans l'ordre : on touche une étiquette de la banque, elle
 * rejoint la phrase ; on touche un mot de la phrase, il retourne à sa place.
 * Une étiquette posée laisse son emplacement vide dans la banque : rien ne
 * bouge sous le doigt, on retrouve chaque mot là où on l'a vu.
 */
export function MotsAOrdonner({ wordOrder, lang, validated, onValidate }: MotsAOrdonnerProps) {
  const [placed, setPlaced] = useState<number[]>([]);
  const locked = validated !== null;
  const etat = validated === null ? null : validated ? JUSTE : A_REVOIR;

  const poser = (index: number) => {
    if (locked || placed.includes(index)) return;
    if (lang === 'en-GB') dire([{ text: wordOrder.bank[index], lang }]);
    setPlaced([...placed, index]);
  };
  const retirer = (index: number) => {
    if (locked) return;
    setPlaced(placed.filter((entry) => entry !== index));
  };
  const valider = () => {
    const given = placed.map((index) => wordOrder.bank[index]);
    onValidate(given.join(' ') === wordOrder.words.join(' '));
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Ta phrase"
        className="flex min-h-[4.5rem] flex-wrap content-start items-start gap-2 rounded-2xl border-2 border-dashed bg-white px-3 py-3"
        style={etat ? { borderStyle: 'solid', borderColor: etat.deep, background: etat.tint } : { borderColor: 'rgba(30,42,74,0.35)' }}
      >
        {placed.length === 0 && <span className="self-center text-base text-encre-douce">Touche les mots, dans l'ordre.</span>}
        {placed.map((index) => (
          <button
            key={index}
            type="button"
            disabled={locked}
            onClick={() => retirer(index)}
            aria-label={`Retirer ${wordOrder.bank[index]}`}
            className="etiquette px-3 py-2 text-lg disabled:!opacity-100"
          >
            {wordOrder.bank[index]}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Les mots" className="flex flex-wrap justify-center gap-2">
        {wordOrder.bank.map((word, index) =>
          placed.includes(index) ? (
            // L'emplacement reste, vide : la banque ne se réorganise pas sous le doigt.
            <span key={index} aria-hidden="true" className="rounded-2xl border-2 border-dashed border-encre/20 bg-encre/5 px-3 py-2 text-lg font-semibold">
              <span className="invisible">{word}</span>
            </span>
          ) : (
            <button key={index} type="button" disabled={locked} onClick={() => poser(index)} className="etiquette px-3 py-2 text-lg">
              {word}
            </button>
          )
        )}
      </div>

      {validated === false && (
        <p className="text-center text-lg font-bold" style={{ color: A_REVOIR.deep }}>
          La bonne phrase : {wordOrder.sentence}
        </p>
      )}

      {!locked && (
        <button type="button" disabled={placed.length === 0} onClick={valider} className="bouton-encre w-full py-4 text-xl">
          Je valide
        </button>
      )}
    </div>
  );
}
