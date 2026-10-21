import React from 'react';
import { Label } from '@/components/ui/label';
import { SectionItem } from './SectionItem';
import type { SectionDefinition, SectionType } from '../config/templates';

// Payment providers that need keys in the environment before they can take payments.
const PROVIDER_ENV_VARS: Record<string, string[]> = {
  Stripe: ['NEXT_PUBLIC_STRIPE_KEY', 'STRIPE_SECRET_KEY'],
};

interface SectionRendererProps {
  sections: SectionDefinition[];
  displayNames: Record<SectionType, string[]>;
  isLoading: boolean;
  loadingItems: Record<SectionType, string[]>;
  completedItems: Record<SectionType, string[]>;
  error: string | null;
  step: 'template' | 'progress' | 'done';
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({
  sections,
  displayNames,
  isLoading,
  loadingItems,
  completedItems,
  error,
  step,
}) => {
  const visibleSections = sections.filter((section) => displayNames[section.type]?.length);
  return (
    <div className="space-y-0">
      {visibleSections.map((section, idx) => {
        const isLastItem = idx === visibleSections.length - 1;
        const items = displayNames[section.type] || [];

        return (
          <div key={section.type} className="relative">
            {!isLastItem && (
              <div className="absolute left-3 top-3 bottom-0 w-[1px] bg-border"></div>
            )}

            <div className="flex items-center space-x-3 mb-2 relative">
              <div className="inline-flex size-6 items-center justify-center rounded-sm border border-border bg-background text-sm text-foreground shadow-sm z-10">
                {idx + 1}
              </div>
              <Label className="text-sm font-medium text-foreground">
                {section.label}
              </Label>
            </div>

            <div className="pl-9">
              <div className="flex flex-wrap gap-2 pb-6">
                {items.map((item) => {
                  let status: 'normal' | 'loading' | 'completed' | 'error' = 'normal';
                  if (step === 'done' || completedItems[section.type]?.includes(item)) {
                    status = 'completed';
                  } else if (isLoading && loadingItems[section.type]?.includes(item)) {
                    status = 'loading';
                  }
                  const envVars = section.type === 'paymentProviders' ? PROVIDER_ENV_VARS[item] : undefined;

                  return (
                    <SectionItem
                      key={item}
                      item={item}
                      sectionType={section.type}
                      status={status}
                      errorMessage={error || undefined}
                      requiresEnvVar={envVars ? { vars: envVars } : undefined}
                      step={step}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
