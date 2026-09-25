import { useState } from 'react';
import { subjectOf } from './types';
import { buildSession, type Session } from './lib/sessionBuilder';
import { loadPreferences, savePreferences } from './lib/preferences';
import { HomeScreen, type StartOptions } from './components/HomeScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { RecapScreen } from './components/RecapScreen';

type Screen = 'home' | 'question' | 'recap';

const STARS_KEY = 'exercices-cm1-cm2:stars';

function loadStars(): number {
  const raw = localStorage.getItem(STARS_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function saveStars(value: number) {
  localStorage.setItem(STARS_KEY, String(value));
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [config, setConfig] = useState<StartOptions | null>(null);
  const [totalStars, setTotalStars] = useState(loadStars);
  // Lu une seule fois : l'écran d'accueil part de là, et n'est pas remis à
  // zéro quand l'élève revient du bilan.
  const [preferences] = useState(loadPreferences);

  const startSession = (options: StartOptions) => {
    const seed = Date.now();
    const built = buildSession({
      domains: options.domains,
      level: options.level,
      trimester: options.trimester,
      seed,
    });
    savePreferences({
      name: options.name,
      level: options.level,
      trimester: options.trimester,
      subject: options.subject,
      domains: options.domains,
    });
    setConfig(options);
    setSession(built);
    setIndex(0);
    setScore(0);
    setScreen('question');
  };

  const handleAnswer = (correct: boolean) => {
    if (!session) return;
    const nextScore = correct ? score + 1 : score;
    setScore(nextScore);
    if (correct) {
      const nextStars = totalStars + 1;
      setTotalStars(nextStars);
      saveStars(nextStars);
    }
    if (index + 1 < session.questions.length) {
      setIndex(index + 1);
    } else {
      setScreen('recap');
    }
  };

  const restart = () => {
    if (!config) {
      setScreen('home');
      return;
    }
    startSession(config);
  };

  const finish = () => setScreen('home');
  const quit = () => setScreen('home');

  if (screen === 'home' || !session) {
    return <HomeScreen initial={config ?? preferences} onStart={startSession} />;
  }

  if (screen === 'question') {
    const question = session.questions[index];
    return (
      <QuestionScreen
        question={question}
        subject={subjectOf(question.domain)}
        questionNumber={index + 1}
        totalQuestions={session.questions.length}
        onAnswer={handleAnswer}
        onQuit={quit}
      />
    );
  }

  return (
    <RecapScreen
      name={config?.name}
      subject={session.subject}
      score={score}
      total={session.questions.length}
      totalStars={totalStars}
      onRestart={restart}
      onFinish={finish}
    />
  );
}
