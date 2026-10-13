import { useAccessibility } from '../hooks/useAccessibility';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
}

export function AccessibilityWrapper({ children }: AccessibilityWrapperProps) {
  const { settings } = useAccessibility();

  // Appliquer les styles globaux basés sur les paramètres d'accessibilité
  const getStylesFromSettings = () => {
    const styles: React.CSSProperties = {};

    // Taille police
    switch (settings.fontSize) {
      case 'large':
        styles.fontSize = '1.125rem'; // 18px
        break;
      case 'xlarge':
        styles.fontSize = '1.25rem'; // 20px
        break;
      default:
        styles.fontSize = '1rem'; // 16px
    }

    // Police
    switch (settings.fontFamily) {
      case 'Dyslexie':
        styles.fontFamily = '"Dyslexie", Arial, sans-serif';
        break;
      case 'OpenDyslexic':
        styles.fontFamily = '"OpenDyslexic", Arial, sans-serif';
        break;
      default:
        styles.fontFamily = 'Arial, sans-serif';
    }

    // Espacement
    switch (settings.spacing) {
      case 'large':
        styles.lineHeight = 1.8;
        styles.letterSpacing = '0.05em';
        break;
      case 'xlarge':
        styles.lineHeight = 2;
        styles.letterSpacing = '0.1em';
        break;
      default:
        styles.lineHeight = 1.5;
    }

    // Schéma de couleur
    let bgColor = '#ffffff';
    let textColor = '#000000';
    switch (settings.colorScheme) {
      case 'sepia':
        bgColor = '#f4eae0';
        textColor = '#5c4033';
        break;
      case 'dark':
        bgColor = '#1a1a1a';
        textColor = '#ffffff';
        break;
      case 'blue-yellow':
        bgColor = '#000080'; // Bleu foncé
        textColor = '#ffff00'; // Jaune
        break;
    }
    styles.backgroundColor = bgColor;
    styles.color = textColor;

    // Contraste
    if (settings.contrast === 'high' || settings.contrast === 'maximum') {
      styles.fontWeight = 'bold';
    }

    // Réduire motion
    if (settings.reducedMotion) {
      styles.transition = 'none';
    }

    return styles;
  };

  return (
    <div
      style={getStylesFromSettings()}
      className={`${
        settings.simplifiedLayout ? 'max-w-2xl' : 'w-full'
      } ${settings.largerClickAreas ? 'p-4' : ''}`}
    >
      {children}
    </div>
  );
}
