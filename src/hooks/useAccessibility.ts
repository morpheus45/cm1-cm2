import { useState, useEffect } from 'react';
import type { AccessibilitySettings, DysType } from '../types/accessibility';
import { DYS_ADAPTATIONS } from '../types/accessibility';

const STORAGE_KEY = 'a11y-settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  selectedDys: [],
  fontSize: 'normal',
  fontFamily: 'Arial',
  contrast: 'normal',
  spacing: 'normal',
  colorScheme: 'light',
  reducedMotion: false,
  textToSpeech: false,
  simplifiedLayout: false,
  largerClickAreas: false,
};

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleDys = (dys: DysType) => {
    setSettings((prev) => {
      const newDys = prev.selectedDys.includes(dys)
        ? prev.selectedDys.filter((d) => d !== dys)
        : [...prev.selectedDys, dys];

      // Appliquer les adaptations pour tous les dys sélectionnés
      const combined: Partial<AccessibilitySettings> = {};
      newDys.forEach((d) => {
        const adaptation = DYS_ADAPTATIONS[d];
        Object.assign(combined, adaptation);
      });

      return {
        ...prev,
        selectedDys: newDys,
        ...combined,
      };
    });
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    toggleDys,
    updateSetting,
    reset,
  };
}
