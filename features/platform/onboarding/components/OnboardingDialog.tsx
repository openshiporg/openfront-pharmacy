'use client';

import React from 'react';
import {
  AlertCircle,
  AppWindowIcon as Apps,
  Loader2,
  CircleCheck,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge-button';
import { SectionRenderer } from './SectionRenderer';
import { useOnboardingState, type TemplateType } from '../hooks/useOnboardingState';
import { useOnboardingApi } from '../hooks/useOnboardingApi';
import { PHARMACY_TEMPLATES, SECTION_DEFINITIONS } from '../config/templates';

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATE_ORDER: TemplateType[] = ['minimal', 'full'];

const plural = (count: number, singular: string, pluralLabel = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralLabel}`;

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    step,
    selectedTemplate,
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
  } = useOnboardingState();

  const { runOnboarding } = useOnboardingApi({
    selectedTemplate,
    setStep,
    setProgressMessage,
    setError,
    setIsLoading,
    setAllLoading,
    setAllCompleted,
    resetOnboardingState,
  });

  if (!isOpen) return null;

  const summary = [
    plural(displayNames.location.length, 'location'),
    plural(displayNames.paymentProviders.length, 'payment provider'),
    plural(displayNames.suppliers.length, 'supplier'),
    plural(displayNames.products.length, 'product'),
    plural(displayNames.inventory.length, 'inventory lot'),
    ...(displayNames.patients.length ? [plural(displayNames.patients.length, 'patient')] : []),
    ...(displayNames.prescribers.length ? [plural(displayNames.prescribers.length, 'prescriber')] : []),
  ];

  const errorBanner = error && !isLoading && step !== 'done' && (
    <Badge color="rose" className="rounded-none gap-3 text-sm border-b">
      <AlertCircle className="size-4 sm:size-7" />
      <span className="text-xs sm:text-sm">Error: {error}</span>
    </Badge>
  );

  const actions = (className: string) =>
    step === 'done' ? (
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <DialogClose asChild>
          <Button type="button" variant="outline" className={className}>
            Close
          </Button>
        </DialogClose>
        <Button asChild className={className}>
          <a href="/" target="_blank" rel="noopener noreferrer">
            View your storefront
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
      </div>
    ) : (
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <DialogClose asChild>
          <Button type="button" variant="ghost" disabled={isLoading} className={className}>
            Cancel
          </Button>
        </DialogClose>
        {isLoading ? (
          <Button disabled className={className}>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </Button>
        ) : (
          <Button onClick={runOnboarding} className={className}>
            Confirm
          </Button>
        )}
      </div>
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-[95vw] flex-col overflow-hidden p-0 gap-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-4 sm:px-6 py-4 mb-0 shrink-0">
          <DialogTitle>Onboarding</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="order-1 flex shrink-0 flex-col lg:order-none lg:w-80 lg:justify-between lg:border-r">
            <div className="flex-1">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-3">
                  <div className="inline-flex shrink-0 items-center justify-center rounded-sm bg-muted p-3">
                    <Apps className="size-5 text-foreground" aria-hidden={true} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium text-foreground">Store Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      {step === 'done' ? 'Your pharmacy is ready' : 'Configure your new pharmacy'}
                    </p>
                  </div>
                </div>
                <Separator className="my-4" />

                {step === 'done' ? (
                  <>
                    <h4 className="text-sm font-medium text-foreground mb-2">Setup Complete</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your {PHARMACY_TEMPLATES[selectedTemplate].name.toLowerCase()} is ready to use.
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-500 mb-4">
                      <CircleCheck className="h-4 w-4 fill-emerald-500 text-background" />
                      <span>Onboarding complete</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      {summary.map((line) => (
                        <div key={line} className="flex items-center space-x-2 text-muted-foreground">
                          <CircleCheck className="h-4 w-4 fill-muted-foreground text-background" />
                          <span className="font-medium">{line} created</span>
                        </div>
                      ))}
                    </div>
                    {selectedTemplate === 'full' && <p className="mt-4 text-sm text-muted-foreground">
                      Card payments: Stripe is added but off. Set the Stripe keys, then install it under <a href="/dashboard/platform/payments#providers" className="font-medium underline underline-offset-4">Payments</a>.
                    </p>}
                    <p className="mt-2 text-sm text-muted-foreground">
                      Before the first prescription: <a href="/dashboard/platform/credentials" className="font-medium underline underline-offset-4">Credential review</a>.
                    </p>
                  </>
                ) : !isLoading ? (
                  <>
                    <h4 className="text-sm font-medium text-foreground mb-4">Setup Type</h4>

                    <div className="block lg:hidden">
                      <Select value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value as TemplateType)}>
                        <SelectTrigger className="w-full h-auto py-3">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_ORDER.map((key) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium">{PHARMACY_TEMPLATES[key].name}</span>
                                <span className="text-xs text-muted-foreground">{PHARMACY_TEMPLATES[key].description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="hidden lg:block">
                      <RadioGroup
                        value={selectedTemplate}
                        onValueChange={(value) => setSelectedTemplate(value as TemplateType)}
                        className="space-y-4"
                      >
                        {TEMPLATE_ORDER.map((key) => {
                          const template = PHARMACY_TEMPLATES[key];
                          const selected = selectedTemplate === key;
                          return (
                            <div
                              key={key}
                              className={`border p-4 rounded-md transition-colors cursor-pointer ${
                                selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-blue-200'
                              }`}
                              onClick={() => setSelectedTemplate(key)}
                            >
                              <div className="flex gap-4">
                                <div className={`flex-shrink-0 mt-[3px] ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                                  {template.icon}
                                </div>
                                <div className="flex-1">
                                  <RadioGroupItem value={key} id={key} className="sr-only" />
                                  <Label htmlFor={key} className="flex-1 cursor-pointer">
                                    <div className="font-medium text-base mb-1">{template.name}</div>
                                    <div className="text-sm text-muted-foreground">{template.description}</div>
                                  </Label>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="text-sm font-medium text-foreground">
                      Creating {PHARMACY_TEMPLATES[selectedTemplate].name}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{progressMessage}</p>
                  </>
                )}
              </div>
            </div>
            <div className="hidden lg:flex flex-col border-t mt-auto">
              {errorBanner}
              <div className="flex items-center justify-between p-4">{actions('w-full sm:w-auto')}</div>
            </div>
          </div>

          <div className="order-2 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:order-none">
            <SectionRenderer
              sections={SECTION_DEFINITIONS}
              displayNames={displayNames}
              isLoading={isLoading}
              loadingItems={loadingItems}
              completedItems={completedItems}
              error={error}
              step={step}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col border-t lg:hidden">
          {errorBanner}
          <div className="flex items-center justify-between p-4">{actions('flex-1')}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
