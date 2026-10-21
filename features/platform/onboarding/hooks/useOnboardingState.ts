'use client';

import { useMemo, useState } from 'react';
import { SECTION_DEFINITIONS, type SectionType, type TemplateKey } from '../config/templates';
import { getItemsFromJsonData, getSeedForTemplate } from '../utils/dataUtils';
import seedData from '../lib/seed.json';

export type OnboardingStep = 'template' | 'progress' | 'done';
export type TemplateType = TemplateKey;

type SectionItems = Record<SectionType, string[]>;

const emptyItems = (): SectionItems =>
  Object.fromEntries(SECTION_DEFINITIONS.map((section) => [section.type, []])) as unknown as SectionItems;

export function useOnboardingState() {
  const [step, setStep] = useState<OnboardingStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('minimal');
  const [progressMessage, setProgressMessage] = useState('');
  const [loadingItems, setLoadingItems] = useState<SectionItems>(emptyItems);
  const [completedItems, setCompletedItems] = useState<SectionItems>(emptyItems);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentJsonData = useMemo(() => getSeedForTemplate(selectedTemplate, seedData), [selectedTemplate]);

  const displayNames = useMemo(
    () => Object.fromEntries(SECTION_DEFINITIONS.map((section) => [section.type, getItemsFromJsonData(currentJsonData, section.type)])) as unknown as SectionItems,
    [currentJsonData],
  );

  const setAllLoading = () => {
    setLoadingItems(displayNames);
    setCompletedItems(emptyItems());
  };

  const setAllCompleted = () => {
    setLoadingItems(emptyItems());
    setCompletedItems(displayNames);
  };

  const resetOnboardingState = () => {
    setError(null);
    setProgressMessage('');
    setLoadingItems(emptyItems());
    setCompletedItems(emptyItems());
  };

  return {
    step,
    selectedTemplate,
    currentJsonData,
    displayNames,
    progressMessage,
    loadingItems,
    completedItems,
    error,
    isLoading,
    setStep,
    setSelectedTemplate,
    setProgressMessage,
    setError,
    setIsLoading,
    setAllLoading,
    setAllCompleted,
    resetOnboardingState,
  };
}
