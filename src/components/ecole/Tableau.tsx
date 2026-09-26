/** Le code de la classe, écrit à la craie sur le tableau noir. */
export function Tableau({ code }: { code: string }) {
  return (
    <p
      className="rounded-lg px-6 py-3 text-4xl font-bold tracking-[0.35em] text-[#F4F1E6]"
      style={{
        background: 'radial-gradient(ellipse at 30% 20%, #2f4a3d 0%, #243a30 55%, #1c2e26 100%)',
        border: '6px solid #9c6b3f',
        boxShadow: 'inset 0 0 0 2px #7a5130, 0 3px 0 #6d4629',
        textShadow: '0 0 1px rgba(244,241,230,0.6), 0 0 6px rgba(244,241,230,0.18)',
      }}
      aria-label={`Code de classe ${code.split('').join(' ')}`}
    >
      {code}
    </p>
  );
}
