import { useState } from 'react';
import type { Domain, Level, Question } from './types';
import { buildSession } from './lib/sessionBuilder';
import { HomeScreen } from './components/HomeScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { RecapScreen } from './components/RecapScreen';

type Screen = 'home' | 'question' | 'recap';

const STARS_KEY = 'exercices-cm1-cm2:stars';

function loadStars(): number {
  const raw = localStorage.getItem(STARS_KEY);
  return raw ? Number(raw) : 0;
}

function saveStars(value: number) {
  localStorage.setItem(STARS_KEY, String(value));
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [session, setSession] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [config, setConfig] = useState<{ name: string; subjects: Domain[]; level: Level } | null>(null);
  const [totalStars, setTotalStars] = useState(loadStars);

  const startSession = (name: string, subjects: Domain[], level: Level) => {
    const seed = Date.now();
    const questions = buildSession(subjects, level, seed, 8);
    setConfig({ name, subjects, level });
    setSession(questions);
    setIndex(0);
    setScore(0);
    setScreen('question');
  };

  const handleAnswer = (correct: boolean) => {
    const nextScore = correct ? score + 1 : score;
    setScore(nextScore);
    if (correct) {
      const nextStars = totalStars + 1;
      setTotalStars(nextStars);
      saveStars(nextStars);
    }
    if (index + 1 < session.length) {
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
    startSession(config.name, config.subjects, config.level);
  };

  const finish = () => {
    setScreen('home');
  };

  const quit = () => {
    setScreen('home');
  };

  if (screen === 'home') {
    return <HomeScreen onStart={startSession} />;
  }

  if (screen === 'question') {
    const question = session[index];
    return (
      <QuestionScreen
        question={question}
        questionNumber={index + 1}
        totalQuestions={session.length}
        onAnswer={handleAnswer}
        onQuit={quit}
      />
    );
  }

  return (
    <RecapScreen score={score} total={session.length} totalStars={totalStars} onRestart={restart} onFinish={finish} />
  );
}
