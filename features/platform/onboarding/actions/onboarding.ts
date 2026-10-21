'use server';

import { revalidatePath } from 'next/cache';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'dismissed';

export async function updateOnboardingStatus(status: OnboardingStatus) {
  try {
    const query = `
      mutation UpdateOnboardingStatus($data: UserUpdateProfileInput!) {
        updateActiveUser(data: $data) {
          id
          onboardingStatus
        }
      }
    `;

    const response = await keystoneClient(query, {
      data: { onboardingStatus: status },
    });

    if (!response.success) {
      return { success: false, error: response.error };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/(admin)');

    return { success: true, data: (response.data as any)?.updateActiveUser };
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function dismissOnboarding() {
  return updateOnboardingStatus('dismissed');
}

export async function startOnboarding() {
  return updateOnboardingStatus('in_progress');
}

export async function completeOnboarding() {
  return updateOnboardingStatus('completed');
}

type OnboardingCounts = {
  paymentProviders: number;
  suppliers: number;
  products: number;
  lots: number;
  patients: number;
  prescribers: number;
};

// Creates the store, location, catalog and opening stock in one server transaction.
export async function runOnboardingAction(template: 'minimal' | 'full') {
  const response = await keystoneClient<{ runPharmacyOnboarding: { organizationId: string; counts: OnboardingCounts } }>(
    `mutation RunPharmacyOnboarding($template: String) {
      runPharmacyOnboarding(template: $template) {
        organizationId
        counts { paymentProviders suppliers products lots patients prescribers }
      }
    }`,
    { template },
  );
  if (!response.success) return { success: false as const, error: response.error };
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/');
  return { success: true as const, data: response.data.runPharmacyOnboarding };
}
