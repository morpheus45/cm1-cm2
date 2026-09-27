import { useEffect } from 'react';
import { typographieFrancaise } from '../lib/typographie';
import { SchoolTitle } from './ecole/SchoolTitle';

/**
 * Ce que les familles doivent savoir : les données des élèves, leurs droits,
 * les cookies, l'accessibilité, l'éditeur du site. Chaque phrase décrit ce
 * que fait vraiment l'application : si elle change, cette page aussi.
 */
interface Section {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

const SECTIONS: Section[] = [
  {
    title: 'En bref',
    items: [
      'Pas de publicité, pas de mesure d\'audience, pas de cookie : l\'application ne suit personne.',
      'Les élèves n\'ont pas de compte. Ils écrivent leur prénom, et l\'initiale de leur nom si un camarade a le même prénom.',
      'Les résultats restent sur la tablette, sauf si l\'enseignante a donné un code de classe : ils rejoignent alors l\'espace de la classe, qu\'elle seule peut consulter.',
      'Tout est effacé automatiquement à la rentrée, le 1er septembre.',
    ],
  },
  {
    title: 'Ce qui est enregistré',
    items: [
      'Sur la tablette : le prénom de l\'élève et l\'initiale de son nom, le code de la classe, ses réglages, ses étoiles, et les résultats de ses séances (la date, la matière, les notions travaillées, le nombre de bonnes réponses). Pour les opérations posées, ce que l\'élève a écrit au doigt, puis la correction de l\'enseignante.',
      'Pour une évaluation lancée par l\'enseignante : la réponse de l\'élève à chaque question, que l\'application corrige. Pendant l\'évaluation, la tablette garde aussi où il en est, pour qu\'il puisse reprendre s\'il s\'interrompt.',
      'Dans l\'espace de la classe, seulement avec un code de classe : les mêmes résultats, les mêmes feuilles d\'opérations et les copies des évaluations, avec le prénom et l\'initiale de l\'élève.',
      'Pour l\'enseignante : l\'adresse e-mail et le mot de passe de son compte. Le mot de passe est enregistré sous une forme que personne ne peut relire.',
    ],
  },
  {
    title: 'À quoi cela sert',
    paragraphs: [
      'À suivre les progrès de chaque élève, à faire le point sur ses acquis lors des évaluations de l\'enseignante, à lui proposer de réviser les notions qu\'il maîtrise le moins, et à permettre à l\'enseignante de corriger les opérations posées. Ces données servent uniquement à l\'enseignement, dans le cadre de la mission de l\'école : ni publicité, ni profil commercial, ni revente.',
    ],
  },
  {
    title: 'Qui peut les voir',
    items: [
      'Dans l\'espace de la classe, l\'enseignante voit les résultats de ses élèves, et elle seule : la base de données refuse toute autre lecture. Ces règles d\'accès sont vérifiées par des tests automatiques à chaque modification de l\'application.',
      'Sur la tablette, l\'Espace maîtresse montre aussi les séances faites sur cette tablette.',
      'Deux prestataires techniques interviennent. GitHub publie le site : il ne reçoit aucune donnée d\'élève, seulement, comme tout hébergeur, l\'adresse technique des appareils qui ouvrent le site. Supabase héberge l\'espace des classes, dans un centre de données situé à Francfort, en Allemagne (Union européenne).',
      'Si l\'enseignante demande l\'aide de l\'assistant de l\'espace maîtresse, une intelligence artificielle (Claude, de la société Anthropic), pour préparer des problèmes de maths, seuls ses messages lui sont envoyés : aucun nom, aucun résultat d\'élève.',
    ],
  },
  {
    title: 'Combien de temps',
    paragraphs: [
      'Une année scolaire. Le 1er septembre, tout ce qui date de l\'année précédente est effacé automatiquement, sur les tablettes comme dans l\'espace de la classe. L\'enseignante peut aussi effacer à tout moment le dossier d\'un élève, ou celui de toute la classe.',
    ],
  },
  {
    title: 'Vos droits',
    paragraphs: [
      'Vous pouvez demander à consulter, à corriger ou à effacer les données de votre enfant, ou vous opposer à leur utilisation : adressez-vous à l\'enseignante ou à la direction de l\'école. Vous pouvez aussi écrire au délégué à la protection des données de l\'académie et, en cas de désaccord, adresser une réclamation à la [CNIL](https://www.cnil.fr/fr/plaintes).',
    ],
  },
  {
    title: 'Cookies et sécurité',
    items: [
      'Aucun cookie, aucun traceur. L\'application garde seulement sur la tablette ce qu\'il lui faut pour fonctionner : ce stockage ne demande pas de consentement.',
      'Le navigateur n\'accepte que les fichiers du site, et ne communique qu\'avec l\'espace des classes : aucun script venu d\'ailleurs ne peut s\'exécuter dans l\'application.',
    ],
  },
  {
    title: 'Accessibilité',
    paragraphs: [
      'L\'application a été vérifiée avec l\'outil d\'audit axe-core, sans défaut relevé sur les vingt-trois écrans testés. Elle s\'utilise entièrement au clavier, reste lisible avec un texte agrandi à 200 %, et fonctionne en portrait comme en paysage. Un audit complet selon le référentiel officiel (RGAA) n\'a pas encore été mené. Les constructions de géométrie au doigt et les opérations écrites à la main restent difficiles sans la vue. Signalez tout obstacle à l\'enseignante.',
    ],
  },
  {
    title: 'Les programmes',
    paragraphs: [
      'Les exercices suivent les programmes de l\'Éducation nationale : français et mathématiques du cycle 3 (Bulletin officiel n° 16 du 17 avril 2025) ; histoire et géographie du CM1 (Bulletin officiel n° 22 du 28 mai 2026) ; au CM2, cette année encore, le programme d\'histoire et de géographie de 2020.',
    ],
  },
  {
    title: 'Qui publie ce site',
    items: [
      'Ce cahier d\'exercices est réalisé à titre non professionnel, pour des classes de CM1 et de CM2. Il est gratuit.',
      'Hébergement du site : GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.',
      'Hébergement de l\'espace des classes : Supabase, centre de données de Francfort (Allemagne).',
      'Page mise à jour en septembre 2026.',
    ],
  },
];

/** Un texte, où « [mot](adresse) » devient un lien. */
function Texte({ text }: { text: string }) {
  const parts = typographieFrancaise(text).split(/\[([^\]]+)\]\((https:\/\/[^)]+)\)/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 3 === 1 ? (
          <a
            key={index}
            href={parts[index + 1]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline decoration-2 underline-offset-2"
          >
            {part}
          </a>
        ) : index % 3 === 2 ? null : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

export function InformationsScreen({ onBack }: { onBack: () => void }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen px-4 py-5">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <SchoolTitle size="petit" subtitle="Informations pour les familles" />
        <button type="button" onClick={onBack} className="etiquette self-start px-4 py-2 text-sm">
          Retour
        </button>
        {SECTIONS.map((section, index) => (
          <section
            key={section.title}
            aria-labelledby={`info-${index}`}
            className="flex flex-col gap-2 rounded-2xl bg-[#fffdf8] p-4 text-base leading-relaxed text-encre shadow-[0_1px_0_rgba(30,42,74,0.08),0_12px_24px_-16px_rgba(30,42,74,0.4)] ring-1 ring-encre/10"
          >
            <h2 id={`info-${index}`} className="text-lg font-bold">
              {section.title}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>
                <Texte text={paragraph} />
              </p>
            ))}
            {section.items && (
              <ul className="flex list-disc flex-col gap-1.5 pl-5">
                {section.items.map((item) => (
                  <li key={item}>
                    <Texte text={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <button type="button" onClick={onBack} className="etiquette self-center px-6 py-3 text-base">
          Retour
        </button>
      </div>
    </div>
  );
}
