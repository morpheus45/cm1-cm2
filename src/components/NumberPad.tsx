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
        className="h-14 rounded-xl border-2 border-sky-200 bg-white px-4 text-3xl font-bold text-slate-700 flex items-center justify-end"
      >
        {value || <span className="text-slate-300">?</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            className="rounded-xl border-2 border-slate-200 bg-white py-3 text-2xl font-semibold text-slate-700 disabled:opacity-40"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(value.slice(0, -1))}
          aria-label="Effacer le dernier chiffre"
          className="rounded-xl border-2 border-slate-200 bg-white py-3 text-2xl font-semibold text-slate-500 disabled:opacity-40"
        >
          ←
        </button>
      </div>
    </div>
  );
}
