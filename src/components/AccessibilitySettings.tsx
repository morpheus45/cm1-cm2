import { DYS_DESCRIPTIONS, type DysType } from '../types/accessibility';
import { useAccessibility } from '../hooks/useAccessibility';

interface AccessibilitySettingsProps {
  onClose: () => void;
}

export function AccessibilitySettings({ onClose }: AccessibilitySettingsProps) {
  const { settings, toggleDys, updateSetting, reset } = useAccessibility();

  const dysOptions: DysType[] = [
    'dyslexie',
    'dysorthographie',
    'dysgraphie',
    'dyscalculie',
    'tdah',
    'dyspraxie',
    'dysphasia',
    'trouble-vision',
    'trouble-audition',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onClose}
            className="mb-4 px-4 py-2 bg-white text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-50 font-semibold transition"
          >
            ← Retour
          </button>
          <h1 className="text-3xl font-bold text-purple-900">♿ Accessibilité</h1>
          <p className="text-gray-600 mt-2">Personnalisez l'interface pour vos besoins</p>
        </div>

        {/* Troubles d'apprentissage */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">📋 Troubles diagnostiqués</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez les troubles pour adapter automatiquement l'interface
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dysOptions.map((dys) => (
              <button
                key={dys}
                onClick={() => toggleDys(dys)}
                className={`text-left p-4 rounded-lg border-2 transition ${
                  settings.selectedDys.includes(dys)
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 bg-white hover:border-purple-600'
                }`}
              >
                <div className="flex items-start">
                  <div
                    className={`w-6 h-6 rounded border-2 mr-3 mt-1 flex items-center justify-center ${
                      settings.selectedDys.includes(dys)
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {settings.selectedDys.includes(dys) && (
                      <span className="text-white text-sm">✓</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dys}</p>
                    <p className="text-sm text-gray-600">{DYS_DESCRIPTIONS[dys]}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paramètres personnalisés */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">🎨 Paramètres visuels</h2>

          {/* Taille police */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📏 Taille de la police
            </label>
            <div className="flex gap-2">
              {(['normal', 'large', 'xlarge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting('fontSize', size)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.fontSize === size
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{
                    fontSize:
                      size === 'normal' ? '14px' : size === 'large' ? '16px' : '18px',
                  }}
                >
                  {size === 'normal' ? 'Normal' : size === 'large' ? 'Grand' : 'Très grand'}
                </button>
              ))}
            </div>
          </div>

          {/* Police */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔤 Police
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['Arial', 'Dyslexie', 'OpenDyslexic', 'sans-serif'] as const).map((font) => (
                <button
                  key={font}
                  onClick={() => updateSetting('fontFamily', font)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.fontFamily === font
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Contraste */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🌓 Contraste
            </label>
            <div className="flex gap-2">
              {(['normal', 'high', 'maximum'] as const).map((contrast) => (
                <button
                  key={contrast}
                  onClick={() => updateSetting('contrast', contrast)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.contrast === contrast
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {contrast === 'normal' ? 'Normal' : contrast === 'high' ? 'Élevé' : 'Maximum'}
                </button>
              ))}
            </div>
          </div>

          {/* Thème couleur */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎨 Thème
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['light', 'sepia', 'dark', 'blue-yellow'] as const).map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => updateSetting('colorScheme', scheme)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.colorScheme === scheme
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {scheme === 'light'
                    ? 'Clair'
                    : scheme === 'sepia'
                      ? 'Sépia'
                      : scheme === 'dark'
                        ? 'Sombre'
                        : 'Bleu/Jaune'}
                </button>
              ))}
            </div>
          </div>

          {/* Espacement */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📐 Espacement
            </label>
            <div className="flex gap-2">
              {(['normal', 'large', 'xlarge'] as const).map((space) => (
                <button
                  key={space}
                  onClick={() => updateSetting('spacing', space)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    settings.spacing === space
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {space === 'normal' ? 'Normal' : space === 'large' ? 'Grand' : 'Très grand'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Options avancées */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">⚙️ Options avancées</h2>

          <div className="space-y-3">
            {[
              {
                key: 'reducedMotion' as const,
                label: '🚫 Réduire les animations',
                desc: 'Désactive les transitions et animations',
              },
              {
                key: 'textToSpeech' as const,
                label: '🔊 Lire à haute voix',
                desc: 'Lire le texte avec synthèse vocale',
              },
              {
                key: 'simplifiedLayout' as const,
                label: '📦 Disposition simplifiée',
                desc: 'Affichage épuré et minimal',
              },
              {
                key: 'largerClickAreas' as const,
                label: '🖱️ Zones de clic agrandies',
                desc: 'Boutons et zones interactives plus grands',
              },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-600">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => updateSetting(key, e.target.checked)}
                  className="w-5 h-5 mt-1 mr-3"
                />
                <div>
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            🔄 Réinitialiser
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
          >
            ✅ Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}
