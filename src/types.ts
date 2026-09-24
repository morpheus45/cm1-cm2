export type Level = 'CM1' | 'CM2';

export type Domain =
  | 'conjugaison'
  | 'accords'
  | 'orthographe'
  | 'numeration'
  | 'calcul'
  | 'problemes';

export interface Question {
  id: string;
  domain: Domain;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
}

export const ALL_DOMAINS: Domain[] = [
  'conjugaison',
  'accords',
  'orthographe',
  'numeration',
  'calcul',
  'problemes',
];

export const DOMAIN_LABELS: Record<Domain, string> = {
  conjugaison: 'Conjugaison',
  accords: 'Accords',
  orthographe: 'Orthographe et vocabulaire',
  numeration: 'Numération',
  calcul: 'Calcul',
  problemes: 'Problèmes',
};
