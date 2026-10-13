export type DysType =
  | 'dyslexie'
  | 'dysorthographie'
  | 'dysgraphie'
  | 'dyscalculie'
  | 'tdah'
  | 'dyspraxie'
  | 'dysphasia'
  | 'trouble-vision'
  | 'trouble-audition';

export interface AccessibilitySettings {
  selectedDys: DysType[];
  fontSize: 'normal' | 'large' | 'xlarge';
  fontFamily: 'Arial' | 'Dyslexie' | 'OpenDyslexic' | 'sans-serif';
  contrast: 'normal' | 'high' | 'maximum';
  spacing: 'normal' | 'large' | 'xlarge';
  colorScheme: 'light' | 'sepia' | 'dark' | 'blue-yellow';
  reducedMotion: boolean;
  textToSpeech: boolean;
  simplifiedLayout: boolean;
  largerClickAreas: boolean;
}

export const DYS_DESCRIPTIONS: Record<DysType, string> = {
  dyslexie: 'Difficultés de lecture et reconnaissance des lettres',
  dysorthographie: 'Difficultés en orthographe et écriture',
  dysgraphie: 'Difficultés de coordination motrice fine (écriture)',
  dyscalculie: 'Difficultés avec les nombres et calculs',
  tdah: 'Trouble de l\'attention avec ou sans hyperactivité',
  dyspraxie: 'Difficultés de coordination motrice et spatiale',
  dysphasia: 'Difficultés de langage et expression',
  'trouble-vision': 'Troubles visuels (basse vision, daltonisme)',
  'trouble-audition': 'Troubles auditifs',
};

export const DYS_ADAPTATIONS: Record<DysType, Partial<AccessibilitySettings>> = {
  dyslexie: {
    fontFamily: 'Dyslexie',
    fontSize: 'large',
    spacing: 'large',
    colorScheme: 'sepia',
    contrast: 'high',
  },
  dysorthographie: {
    fontSize: 'large',
    contrast: 'high',
    spacing: 'large',
  },
  dysgraphie: {
    simplifiedLayout: true,
    largerClickAreas: true,
    fontSize: 'large',
  },
  dyscalculie: {
    fontSize: 'xlarge',
    spacing: 'xlarge',
    colorScheme: 'blue-yellow',
  },
  tdah: {
    simplifiedLayout: true,
    reducedMotion: true,
    contrast: 'high',
    fontSize: 'large',
  },
  dyspraxie: {
    largerClickAreas: true,
    simplifiedLayout: true,
    fontSize: 'large',
    spacing: 'large',
  },
  dysphasia: {
    simplifiedLayout: true,
    textToSpeech: true,
    fontSize: 'large',
  },
  'trouble-vision': {
    fontSize: 'xlarge',
    contrast: 'maximum',
    spacing: 'xlarge',
  },
  'trouble-audition': {
    textToSpeech: false,
  },
};
