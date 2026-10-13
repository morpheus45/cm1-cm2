import { useState, useCallback } from 'react';
import type { CertificateData, CompetencyScore } from '../types/competencies';
import { calculateMasteryLevel } from '../types/competencies';

interface CompetencySession {
  childName: string;
  level: string;
  subject: string;
  questionsAnswered: number;
  correctAnswers: number;
  date: string;
}

export function useCompetencies(childName: string) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [sessions, setSessions] = useState<CompetencySession[]>(() => {
    try {
      const saved = localStorage.getItem(`competencies-${childName}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addSession = useCallback(
    (session: Omit<CompetencySession, 'date'>) => {
      const newSession = { ...session, date: new Date().toISOString() };
      setSessions((prev) => {
        const updated = [...prev, newSession];
        localStorage.setItem(`competencies-${childName}`, JSON.stringify(updated));
        return updated;
      });
    },
    [childName]
  );

  const generateCertificate = useCallback(
    (level: string) => {
      const subjects = ['Français', 'Mathématiques', 'Géographie', 'Histoire', 'Sciences', 'EMC', 'Anglais'];

      const competencies: CompetencyScore[] = subjects.map((subject) => {
        const subjectSessions = sessions.filter((s) => s.subject === subject && s.level === level);
        const totalCorrect = subjectSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
        const totalAnswered = subjectSessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
        const percentage = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

        return {
          subject,
          level,
          percentage: Math.round(percentage),
          masteryLevel: calculateMasteryLevel(percentage),
          questionsAnswered: totalAnswered,
          correctAnswers: totalCorrect,
        };
      });

      const overallPercentage = competencies.length > 0
        ? competencies.reduce((sum, c) => sum + c.percentage, 0) / competencies.length
        : 0;

      const strengths = competencies
        .filter((c) => c.percentage >= 85)
        .map((c) => `${c.subject}: ${c.percentage}%`);

      const areasToImprove = competencies
        .filter((c) => c.percentage < 80)
        .map((c) => `${c.subject}: ${c.percentage}%`);

      const cert: CertificateData = {
        childName,
        level,
        date: new Date().toISOString(),
        competencies,
        overallLevel: calculateMasteryLevel(overallPercentage),
        overallPercentage: Math.round(overallPercentage),
        canProgressToNextLevel: overallPercentage >= 80,
        strengths,
        areasToImprove,
      };

      setCertificate(cert);
      return cert;
    },
    [childName, sessions]
  );

  const clearCertificate = useCallback(() => {
    setCertificate(null);
  }, []);

  return {
    certificate,
    sessions,
    addSession,
    generateCertificate,
    clearCertificate,
  };
}
