import { useState } from 'react';
import type { CertificateData } from '../types/competencies';
import { PedagogieScreen } from './PedagogieScreen';
import { CertificateScreen } from './CertificateScreen';
import { useCompetencies } from '../hooks/useCompetencies';
import type { Level } from '../types';

interface LearningWithCertificateProps {
  childName: string;
  initialLevel?: Level;
  onBack?: () => void;
}

export function LearningWithCertificate({
  childName,
  initialLevel,
  onBack,
}: LearningWithCertificateProps) {
  const { certificate, generateCertificate, clearCertificate } = useCompetencies(childName);
  const [showingCertificate, setShowingCertificate] = useState(false);

  const handleShowCertificate = (cert: CertificateData) => {
    setShowingCertificate(true);
  };

  const handleContinue = () => {
    clearCertificate();
    setShowingCertificate(false);
  };

  if (showingCertificate && certificate) {
    return <CertificateScreen certificate={certificate} onContinue={handleContinue} />;
  }

  return (
    <PedagogieScreen
      initialLevel={initialLevel}
      childName={childName}
      onCertificateGenerated={handleShowCertificate}
      onBack={onBack}
    />
  );
}
