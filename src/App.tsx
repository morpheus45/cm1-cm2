import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { pupilKey, subjectOf } from './types';
import type { Domain, Pupil } from './types';
import { buildSession, type Session } from './lib/sessionBuilder';
import { buildWorksheet, type Stroke, type Worksheet } from './lib/worksheet';
import { activitiesFor, notionsFor } from './lib/contenu';
import { loadPreferences, savePreferences } from './lib/preferences';
import { loadStars, saveStars } from './lib/stars';
import { recentSignatures, recordShownQuestions } from './lib/questionHistory';
import {
  forgetAllResults,
  forgetPupil,
  forgetSession,
  loadResults,
  recordSession,
  revisionDomains,
  type DomainResult,
  type SessionResult,
} from './lib/results';
import { evaluationResults, isReady, type EvaluationAnswer, type OpenEvaluation, type ReadyEvaluation } from './lib/evaluation';
import {
  cachedOpenEvaluations,
  copyParams,
  deliverCopies,
  enqueueCopy,
  evaluationState,
  loadProgress,
  pendingCopyIds,
  progressFor,
  refreshOpenEvaluations,
  saveProgress,
  withoutProgress,
  withProgress,
  type CopyOutcome,
  type EvaluationProgress,
} from './lib/pupilEvaluations';
import { isAnswerCorrect, worksheetScore } from './lib/worksheet';
import {
  depositSession,
  cachedClassProblems,
  cachedClassQuestions,
  flushOutbox,
  isCloudConfigured,
  pendingDepositCount,
  refreshClassProblems,
  refreshClassQuestions,
  sendDeposit,
  type DepositOutcome,
} from './lib/cloud';
import {
  fetchCorrections,
  forgetCorrections,
  loadStoredCorrections,
  markSeen,
  saveStoredCorrections,
  type ReceivedCorrection,
  type StoredCorrection,
} from './lib/pupilCorrections';
import { CorrectedSheetScreen } from './components/CorrectedSheetScreen';
import { EvaluationDoneScreen, EvaluationScreen } from './components/EvaluationScreen';
import { HomeScreen, type ClassEvaluations, type StartOptions } from './components/HomeScreen';
import { InformationsScreen } from './components/InformationsScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { RecapScreen } from './components/RecapScreen';
import { WrittenOperationScreen } from './components/WrittenOperationScreen';
import { WrittenRecapScreen } from './components/WrittenRecapScreen';
import { TablesScreen } from './components/TablesScreen';
import { buildTableFacts, tablesAuProgramme, TABLES_PER_SESSION, type TableFact } from './domains/tables';
import { createRng } from './lib/seededRandom';

// L'accès maîtresse — graphiques, correction, compte — n'est chargé qu'à
// l'ouverture : les tablettes des élèves n'ont pas à le télécharger. Le
// service worker le garde tout de même en cache, pour le hors-ligne.
const TeacherSpace = lazy(() =>
  import('./components/TeacherSpace').then((module) => ({ default: module.TeacherSpace }))
);

type Screen = 'home' | 'tables' | 'question' | 'recap' | 'pose' | 'poseRecap' | 'corrigee' | 'evaluation' | 'evaluationFin';

/** L'évaluation qu'un élève est en train de faire. */
interface TakenEvaluation {
  evaluation: ReadyEvaluation;
  pupil: Pupil;
  joinCode: string;
  answers: EvaluationAnswer[];
}

/** Pas plus d'une demande de corrections par minute, même en allant et venant
 *  entre l'accueil et les séances. */
const CORRECTIONS_CHECK_INTERVAL = 60_000;

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [tableFacts, setTableFacts] = useState<{ seed: number; facts: TableFact[] } | null>(null);
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
  const [corrections, setCorrections] = useState(loadStoredCorrections);
  const [openedCorrection, setOpenedCorrection] = useState<ReceivedCorrection | null>(null);
  const lastCorrectionsCheck = useRef(0);
  // Les évaluations ouvertes par la maîtresse : celles gardées sur la
  // tablette d'abord, pour les montrer même hors connexion.
  const [classEvaluations, setClassEvaluations] = useState<ClassEvaluations & { fetchedAt: string | null }>(() => ({
    joinCode: preferences.joinCode,
    ...cachedOpenEvaluations(preferences.joinCode),
  }));
  const [progress, setProgress] = useState(loadProgress);
  const [pendingCopies, setPendingCopies] = useState(pendingCopyIds);
  const [taking, setTaking] = useState<TakenEvaluation | null>(null);
  const [copyOutcome, setCopyOutcome] = useState<CopyOutcome | 'pending'>('pending');

  const syncEvaluations = useCallback(() => {
    setProgress(loadProgress());
    setPendingCopies(pendingCopyIds());
  }, []);

  // Les copies qui attendaient partent d'abord ; la liste qui revient sait
  // alors lesquelles la base a reçues.
  const refreshEvaluations = useCallback(
    (code: string) => {
      setClassEvaluations((current) =>
        current.joinCode === code ? current : { joinCode: code, ...cachedOpenEvaluations(code) }
      );
      void deliverCopies()
        .then(() => refreshOpenEvaluations(code))
        .then((fresh) => {
          if (fresh) setClassEvaluations({ joinCode: code, ...fresh });
          syncEvaluations();
        })
        .catch(() => syncEvaluations());
    },
    [syncEvaluations]
  );

  const evaluationStateOf = useCallback(
    (evaluation: OpenEvaluation, pupil: Pupil) =>
      evaluationState(evaluation, pupil, progress, pendingCopies, classEvaluations.fetchedAt),
    [progress, pendingCopies, classEvaluations.fetchedAt]
  );

  const updateCorrections = useCallback((change: (list: StoredCorrection[]) => StoredCorrection[]) => {
    setCorrections((list) => {
      const next = change(list);
      saveStoredCorrections(next);
      return next;
    });
  }, []);

  // Les feuilles d'opérations corrigées par la maîtresse : demandées au
  // lancement et à chaque retour à l'accueil, gardées pour le hors-ligne. Une
  // tablette qui n'a pas de code de classe ne demande rien à personne.
  const checkCorrections = useCallback(() => {
    if (!isCloudConfigured() || !loadPreferences().joinCode) return;
    if (Date.now() - lastCorrectionsCheck.current < CORRECTIONS_CHECK_INTERVAL) return;
    lastCorrectionsCheck.current = Date.now();
    void fetchCorrections(loadResults()).then((next) => {
      if (next) setCorrections(next);
    });
  }, []);

  useEffect(() => {
    if (screen === 'home') checkCorrections();
  }, [screen, checkCorrections]);

  // Au lancement, on renvoie ce qui n'avait pas pu partir la dernière fois.
  useEffect(() => {
    if (isCloudConfigured() && pendingDepositCount() > 0) void flushOutbox(sendDeposit);
    // Les problèmes et les questions de la maîtresse : mis à jour à chaque
    // lancement, gardés sur la tablette pour les séances hors connexion.
    if (isCloudConfigured() && preferences.joinCode) {
      void refreshClassProblems(preferences.joinCode);
      void refreshClassQuestions(preferences.joinCode);
    }
  }, []);
  // Une simple ancre dans l'adresse : l'espace maîtresse n'est pas une autre
  // application, et le projet n'a pas besoin d'un routeur pour deux écrans.
  const [teacherView, setTeacherView] = useState(() => window.location.hash === '#maitresse');
  // Les informations pour les familles : une page qu'on peut aussi ouvrir
  // directement, par un lien donné aux parents.
  const [infoView, setInfoView] = useState(() => window.location.hash === '#informations');

  useEffect(() => {
    const sync = () => {
      setTeacherView(window.location.hash === '#maitresse');
      setInfoView(window.location.hash === '#informations');
    };
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

  const rememberChoices = (options: StartOptions) => {
    savePreferences({
      name: options.name,
      lastName: options.lastName,
      joinCode: options.joinCode,
      level: options.level,
      trimester: options.trimester,
      subject: options.subject,
      domains: options.domains,
      activity: options.activity,
      tables: options.tables,
    });
    setConfig(options);
  };

  const startSession = (options: StartOptions) => {
    // Une séance que ce niveau n'offre pas, faute de questions
    // (src/lib/contenu.ts), ne démarre pas : on reste à l'accueil.
    if (!activitiesFor(options.subject, options.level, options.trimester).includes(options.activity)) return;
    const seed = Date.now();
    rememberChoices(options);
    setIndex(0);
    setScore(0);
    setPerDomain({});

    // La révision ciblée choisit elle-même les notions : d'abord les lacunes
    // et les fragilités de la dernière évaluation, puis les notions les plus
    // fragiles de cet élève, dans la matière demandée. Un élève qui n'a
    // encore rien fait travaille simplement toute la matière.
    const pupil: Pupil = { firstName: options.name, lastName: options.lastName };
    const own = results.filter((entry) => pupilKey(entry.pupil) === pupilKey(pupil));
    const available = notionsFor(options.subject, options.level, options.trimester);
    const domains =
      options.activity === 'revision' ? revisionDomains(own, options.subject, 2, available) : options.domains;

    if (options.activity === 'tables') {
      setTableFacts({
        seed,
        facts: buildTableFacts(options.tables, createRng(seed), TABLES_PER_SESSION, tablesAuProgramme(options.level, options.trimester)),
      });
      setDelivery(null);
      setScreen('tables');
      return;
    }

    if (options.activity === 'posees') {
      const sheet = buildWorksheet({
        name: options.name,
        level: options.level,
        trimester: options.trimester,
        seed,
      });
      if (sheet.operations.length === 0) return;
      setWorksheet(sheet);
      setScreen('pose');
      return;
    }

    const built = buildSession({
      domains,
      level: options.level,
      trimester: options.trimester,
      seed,
      classProblems: options.joinCode ? cachedClassProblems(options.joinCode) : [],
      classQuestions: options.joinCode ? cachedClassQuestions(options.joinCode) : [],
      avoidSignatures: recentSignatures(pupil, options.subject),
    });
    if (built.questions.length === 0) return;
    setSession(built);
    recordShownQuestions(pupil, options.subject, built.questions);
    // Un code tout juste saisi : les problèmes et les questions de la classe
    // arriveront pour la séance suivante.
    if (isCloudConfigured() && options.joinCode) {
      void refreshClassProblems(options.joinCode);
      void refreshClassQuestions(options.joinCode);
    }
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

  // --- Les évaluations -------------------------------------------------------

  const startEvaluation = (evaluation: OpenEvaluation, options: StartOptions) => {
    if (!isReady(evaluation)) return;
    rememberChoices(options);
    const pupil: Pupil = { firstName: options.name, lastName: options.lastName };
    const state = evaluationStateOf(evaluation, pupil);
    if (state.kind === 'rendue') return;
    let list = loadProgress();
    // La maîtresse a effacé la copie : l'élève repart de zéro, et l'ancien
    // résultat quitte la tablette.
    if (state.kind === 'a-refaire') {
      setResults(forgetSession(state.previousCopyId));
      list = withoutProgress(list, evaluation.id, pupil);
    }
    const existing = progressFor(list, evaluation.id, pupil);
    const entry: EvaluationProgress =
      existing && !existing.copyId
        ? { ...existing, answers: existing.answers.slice(0, evaluation.items.length - 1) }
        : { evaluationId: evaluation.id, joinCode: options.joinCode, pupil, answers: [], startedAt: new Date().toISOString() };
    list = withProgress(list, entry);
    saveProgress(list);
    setProgress(list);
    setTaking({ evaluation, pupil, joinCode: options.joinCode, answers: entry.answers });
    setScreen('evaluation');
  };

  const progressOf = (taken: TakenEvaluation): EvaluationProgress =>
    progressFor(loadProgress(), taken.evaluation.id, taken.pupil) ?? {
      evaluationId: taken.evaluation.id,
      joinCode: taken.joinCode,
      pupil: taken.pupil,
      answers: [],
      startedAt: new Date().toISOString(),
    };

  const saveEvaluationProgress = (answers: EvaluationAnswer[]) => {
    if (!taking) return;
    const list = withProgress(loadProgress(), { ...progressOf(taking), answers });
    saveProgress(list);
    setProgress(list);
  };

  const finishEvaluation = (answers: EvaluationAnswer[]) => {
    if (!taking) return;
    const { evaluation, pupil, joinCode } = taking;
    // L'identifiant de la copie est aussi celui de sa séance, ici comme dans
    // la base.
    const copyId = crypto.randomUUID();
    setResults(
      recordSession({
        id: copyId,
        pupil,
        at: new Date().toISOString(),
        level: evaluation.level,
        trimester: evaluation.trimester,
        subject: evaluation.subject,
        activity: 'evaluation',
        domains: evaluationResults(evaluation.items, answers).filter((entry) => entry.total > 0),
      })
    );
    enqueueCopy(copyParams(copyId, joinCode, evaluation.id, pupil, answers));
    const list = withProgress(loadProgress(), {
      ...progressOf(taking),
      answers: [],
      copyId,
      delivery: 'en-attente',
    });
    saveProgress(list);
    setProgress(list);
    setPendingCopies(pendingCopyIds());
    setCopyOutcome('pending');
    setScreen('evaluationFin');
    void deliverCopies().then(
      (outcomes) => {
        setCopyOutcome(outcomes[copyId] ?? 'queued');
        syncEvaluations();
      },
      () => setCopyOutcome('queued')
    );
  };

  const restart = () => {
    if (!config) {
      setScreen('home');
      return;
    }
    startSession(config);
  };

  const goHome = () => setScreen('home');

  const openCorrection = (correction: ReceivedCorrection) => {
    setOpenedCorrection(correction);
    updateCorrections((list) => markSeen(list, correction.sessionId));
    setScreen('corrigee');
  };

  if (infoView) {
    return (
      <InformationsScreen
        onBack={() => {
          window.location.hash = '';
          setInfoView(false);
        }}
      />
    );
  }

  if (teacherView) {
    return (
      <Suspense fallback={<p className="min-h-screen py-16 text-center text-encre-douce">Chargement…</p>}>
        <TeacherSpace
          localSessions={results}
          onForgetLocalPupil={(key) => {
            setResults(forgetPupil(key));
            updateCorrections((list) => forgetCorrections(list, key));
          }}
          onForgetAllLocal={() => {
            setResults(forgetAllResults());
            updateCorrections((list) => forgetCorrections(list, null));
          }}
          onBack={() => {
            window.location.hash = '';
            setTeacherView(false);
          }}
        />
      </Suspense>
    );
  }

  const home = (
    <HomeScreen
      initial={config ?? preferences}
      onStart={startSession}
      corrections={corrections}
      onOpenCorrection={openCorrection}
      evaluations={classEvaluations}
      evaluationStateOf={evaluationStateOf}
      onStartEvaluation={startEvaluation}
      onRefreshEvaluations={refreshEvaluations}
    />
  );

  if (screen === 'home') return home;

  if (screen === 'evaluation' && taking) {
    return (
      <EvaluationScreen
        key={`${taking.evaluation.id}-${pupilKey(taking.pupil)}`}
        evaluation={taking.evaluation}
        pupilName={taking.pupil.firstName}
        initialAnswers={taking.answers}
        onProgress={saveEvaluationProgress}
        onFinish={finishEvaluation}
        onQuit={() => {
          setTaking(null);
          goHome();
        }}
      />
    );
  }

  if (screen === 'evaluationFin' && taking) {
    return (
      <EvaluationDoneScreen
        title={taking.evaluation.title}
        pupilName={taking.pupil.firstName}
        level={taking.evaluation.level}
        outcome={copyOutcome}
        onFinish={() => {
          setTaking(null);
          goHome();
        }}
      />
    );
  }

  if (screen === 'corrigee' && openedCorrection) {
    return (
      <CorrectedSheetScreen
        correction={openedCorrection}
        onClose={() => {
          setOpenedCorrection(null);
          goHome();
        }}
      />
    );
  }

  if (screen === 'tables' && tableFacts) {
    return (
      <TablesScreen
        key={tableFacts.seed}
        facts={tableFacts.facts}
        name={config?.name}
        level={config?.level ?? preferences.level}
        delivery={delivery}
        onCorrect={awardStar}
        // Pour la maîtresse et la base, une série de tables est une séance de
        // questions de calcul : aucune nouvelle catégorie à déclarer côté
        // serveur, et les résultats nourrissent la révision ciblée.
        onFinished={(correct, total) => keep([{ domain: 'calcul' as Domain, correct, total }], 'questions')}
        onRestart={restart}
        onQuit={goHome}
      />
    );
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
        level={session.level}
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

  return home;
}
