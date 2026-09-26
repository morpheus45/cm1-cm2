interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0'];

/** Un pavé numérique à l'écran : le clavier du système cacherait la moitié de
 *  la feuille au moment de saisir le résultat. */
export function NumberPad({ value, onChange, disabled = false }: NumberPadProps) {
  const press = (key: string) => {
    if (disabled) return;
    if (key === ',' && value.includes(',')) return;
    if (value.replace(/[^0-9]/g, '').length >= 12) return;
    onChange(value + key);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        aria-live="polite"
        className="flex h-14 items-center justify-end border-b-2 border-encre bg-transparent px-2 text-4xl font-bold text-encre"
      >
        {value || <span className="text-encre-pale/50">?</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            className="etiquette py-2.5 text-2xl"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(value.slice(0, -1))}
          aria-label="Effacer le dernier chiffre"
          className="etiquette py-2.5 text-2xl"
        >
          ←
        </button>
      </div>
    </div>
  );
}
