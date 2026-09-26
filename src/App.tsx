import { lazy, Suspense, useEffect, useState } from 'react';
import { pupilKey, subjectOf, SUBJECT_DOMAINS } from './types';
import type { Domain, Pupil } from './types';
import { buildSession, type Session } from './lib/sessionBuilder';
import { buildWorksheet, type Stroke, type Worksheet } from './lib/worksheet';
import { loadPreferences, savePreferences } from './lib/preferences';
import {
  forgetAllResults,
  forgetPupil,
  loadResults,
  recordSession,
  summariseByDomain,
  weakestDomains,
  type DomainResult,
  type SessionResult,
} from './lib/results';
import { isAnswerCorrect, worksheetScore } from './lib/worksheet';
import {
  depositSession,
  flushOutbox,
  isCloudConfigured,
  pendingDepositCount,
  sendDeposit,
  type DepositOutcome,
} from './lib/cloud';
import { HomeScreen, type StartOptions } from './components/HomeScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { RecapScreen } from './components/RecapScreen';
import { WrittenOperationScreen } from './components/WrittenOperationScreen';
import { WrittenRecapScreen } from './components/WrittenRecapScreen';

// L'accès maîtresse — graphiques, correction, compte — n'est chargé qu'à
// l'ouverture : les tablettes des élèves n'ont pas à le télécharger. Le
// service worker le garde tout de même en cache, pour le hors-ligne.
const TeacherSpace = lazy(() =>
  import('./components/TeacherSpace').then((module) => ({ default: module.TeacherSpace }))
);

type Screen = 'home' | 'question' | 'recap' | 'pose' | 'poseRecap';

const STARS_KEY = 'exercices-cm1-cm2:stars';

function loadStars(): number {
  try {
    const raw = localStorage.getItem(STARS_KEY);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveStars(value: number) {
  try {
    localStorage.setItem(STARS_KEY, String(value));
  } catch {
    // Stockage refusé : l'élève garde ses étoiles le temps de la séance.
  }
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [perDomain, setPerDomain] = useState<Record<string, DomainResult>>({});
  const [config, setConfig] = useState<StartOptions | null>(null);
  // Lu une seule fois : l'écran d'accueil part de là, et n'est pas remis à
  // zéro quand l'élève revient du bilan.
  const [preferences] = useState(loadPreferences);
  const [totalStars, setTotalStars] = useState(loadStars);
  const [results, setResults] = useState(loadResults);
  const [delivery, setDelivery] = useState<DepositOutcome | 'pending' | null>(null);

  // Au lancement, on renvoie ce qui n'avait pas pu partir la dernière fois.
  useEffect(() => {
    if (isCloudConfigured() && pendingDepositCount() > 0) void flushOutbox(sendDeposit);
  }, []);
  // Une simple ancre dans l'adresse : l'espace maîtresse n'est pas une autre
  // application, et le projet n'a pas besoin d'un routeur pour deux écrans.
  const [teacherView, setTeacherView] = useState(() => window.location.hash === '#maitresse');

  useEffect(() => {
    const sync = () => setTeacherView(window.location.hash === '#maitresse');
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const keep = (
    domains: DomainResult[],
    activity: StartOptions['activity'],
    finishedWorksheet?: Worksheet
  ) => {
    if (!config || domains.every((entry) => entry.total === 0)) return;
    const session: SessionResult = {
      // Un vrai UUID : c'est lui qui empêche la base d'enregistrer deux fois
      // une séance renvoyée après une coupure de réseau.
      id: crypto.randomUUID(),
      pupil: { firstName: config.name, lastName: config.lastName },
      at: new Date().toISOString(),
      level: config.level,
      trimester: config.trimester,
      subject: config.subject,
      activity,
      domains: domains.filter((entry) => entry.total > 0),
    };
    setResults(recordSession(session));

    if (config.joinCode) {
      setDelivery('pending');
      void depositSession(session, config.joinCode, finishedWorksheet).then(setDelivery);
    } else {
      setDelivery(null);
    }
  };

  const startSession = (options: StartOptions) => {
    const seed = Date.now();
    savePreferences({
      name: options.name,
      lastName: options.lastName,
      joinCode: options.joinCode,
      level: options.level,
      trimester: options.trimester,
      subject: options.subject,
      domains: options.domains,
      activity: options.activity,
    });
    setConfig(options);
    setIndex(0);
    setScore(0);
    setPerDomain({});

    // La révision ciblée choisit elle-même les notions : les plus fragiles de
    // cet élève, dans la matière demandée. Un élève qui n'a encore rien fait
    // travaille simplement toute la matière.
    const pupil: Pupil = { firstName: options.name, lastName: options.lastName };
    const own = results.filter((entry) => pupilKey(entry.pupil) === pupilKey(pupil));
    const domains =
      options.activity === 'revision'
        ? own.length > 0
          ? weakestDomains(summariseByDomain(own), options.subject, 2)
          : [...SUBJECT_DOMAINS[options.subject]]
        : options.domains;

    if (options.activity === 'posees') {
      setWorksheet(
        buildWorksheet({
          name: options.name,
          level: options.level,
          trimester: options.trimester,
          seed,
        })
      );
      setScreen('pose');
      return;
    }

    setSession(
      buildSession({
        domains,
        level: options.level,
        trimester: options.trimester,
        seed,
      })
    );
    setScreen('question');
  };

  const awardStar = () => {
    const nextStars = totalStars + 1;
    setTotalStars(nextStars);
    saveStars(nextStars);
  };

  const handleAnswer = (correct: boolean) => {
    if (!session) return;
    const domain = session.questions[index].domain;
    const previous = perDomain[domain] ?? { domain, correct: 0, total: 0 };
    const tally = {
      ...perDomain,
      [domain]: {
        domain,
        correct: previous.correct + (correct ? 1 : 0),
        total: previous.total + 1,
      },
    };
    setPerDomain(tally);
    if (correct) {
      setScore(score + 1);
      awardStar();
    }
    if (index + 1 < session.questions.length) {
      setIndex(index + 1);
    } else {
      keep(Object.values(tally), 'questions');
      setScreen('recap');
    }
  };

  const handleWrittenAnswer = (given: string, strokes: Stroke[]) => {
    if (!worksheet) return;
    const operation = worksheet.operations[index];
    const answered: Worksheet = {
      ...worksheet,
      answers: { ...worksheet.answers, [operation.id]: { given, strokes } },
    };
    setWorksheet(answered);
    if (isAnswerCorrect(given, operation.expected)) awardStar();
    if (index + 1 < answered.operations.length) {
      setIndex(index + 1);
    } else {
      const { correct, total } = worksheetScore(answered);
      keep([{ domain: 'calcul' as Domain, correct, total }], 'posees', answered);
      setScreen('poseRecap');
    }
  };

  const restart = () => {
    if (!config) {
      setScreen('home');
      return;
    }
    startSession(config);
  };

  const goHome = () => setScreen('home');

  if (teacherView) {
    return (
      <Suspense fallback={<p className="min-h-screen py-16 text-center text-encre-douce">Chargement…</p>}>
        <TeacherSpace
          localSessions={results}
          onForgetLocalPupil={(key) => setResults(forgetPupil(key))}
          onForgetAllLocal={() => setResults(forgetAllResults())}
          onBack={() => {
            window.location.hash = '';
            setTeacherView(false);
          }}
        />
      </Suspense>
    );
  }

  if (screen === 'home') {
    return <HomeScreen initial={config ?? preferences} onStart={startSession} />;
  }

  if (screen === 'pose' && worksheet) {
    return (
      <WrittenOperationScreen
        operation={worksheet.operations[index]}
        operationNumber={index + 1}
        totalOperations={worksheet.operations.length}
        onValidate={handleWrittenAnswer}
        onQuit={goHome}
      />
    );
  }

  if (screen === 'poseRecap' && worksheet) {
    return (
      <WrittenRecapScreen
        worksheet={worksheet}
        delivery={delivery}
        onRestart={restart}
        onFinish={goHome}
      />
    );
  }

  if (screen === 'question' && session) {
    const question = session.questions[index];
    return (
      <QuestionScreen
        question={question}
        subject={subjectOf(question.domain)}
        questionNumber={index + 1}
        totalQuestions={session.questions.length}
        stepDomains={session.questions.map((entry) => entry.domain)}
        onAnswer={handleAnswer}
        onQuit={goHome}
      />
    );
  }

  if (screen === 'recap' && session) {
    return (
      <RecapScreen
        name={config?.name}
        subject={session.subject}
        score={score}
        total={session.questions.length}
        totalStars={totalStars}
        delivery={delivery}
        onRestart={restart}
        onFinish={goHome}
      />
    );
  }

  return <HomeScreen initial={config ?? preferences} onStart={startSession} />;
}
