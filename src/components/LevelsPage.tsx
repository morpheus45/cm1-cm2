export function LevelsPage() {
  const levels = [
    { id: 'CE1', label: 'CE1', cycle: 'Cycle 2' },
    { id: 'CE2', label: 'CE2', cycle: 'Cycle 2' },
    { id: 'CM1', label: 'CM1', cycle: 'Cycle 3' },
    { id: 'CM2', label: 'CM2', cycle: 'Cycle 3' },
    { id: '6e', label: '6e', cycle: 'Cycle 3' },
    { id: '5e', label: '5e', cycle: 'Cycle 4' },
    { id: '4e', label: '4e', cycle: 'Cycle 4' },
    { id: '3e', label: '3e', cycle: 'Cycle 4' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-purple-900 mb-2">📚 Plateforme Pédagogique</h1>
          <p className="text-lg text-gray-600">Sélectionnez votre niveau scolaire</p>
        </div>

        {/* Niveaux par cycle */}
        <div className="space-y-8">
          {['Cycle 2', 'Cycle 3', 'Cycle 4'].map((cycle) => (
            <div key={cycle}>
              <h2 className="text-2xl font-bold text-purple-900 mb-4">{cycle}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {levels
                  .filter((l) => l.cycle === cycle)
                  .map((level) => (
                    <a
                      key={level.id}
                      href={`#${level.id.toLowerCase()}`}
                      className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300"
                    >
                      {/* Gradient background on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Content */}
                      <div className="relative z-10 text-center">
                        <div className="text-4xl font-bold text-purple-900 group-hover:text-white mb-2 transition-colors">
                          {level.label}
                        </div>
                        <p className="text-sm text-gray-600 group-hover:text-purple-100 transition-colors">
                          {level.cycle}
                        </p>
                        <div className="mt-4 text-2xl group-hover:translate-y-0 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          📖
                        </div>
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 text-sm">
            Cliquez sur votre niveau pour accéder aux contenus pédagogiques (vocabulaire et questions)
          </p>
          <p className="text-gray-500 text-xs mt-2">
            URL directes : https://morpheus45.github.io/cm1-cm2/#ce1, #ce2, #cm1, #cm2, #6e, #5e, #4e, #3e
          </p>
        </div>
      </div>
    </div>
  );
}
