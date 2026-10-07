import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authService from '@/services/authService';
import { useAuth } from '@/context/AuthContext';
import { invalidateGroup } from './invalidate';

/**
 * Account mutations. They go through AuthContext so the signed-in user stays in sync,
 * and give forms pending and error state for free.
 */

/** mutate({ name?, email?, avatar? }) -> user. */
export function useUpdateProfile() {
  const { updateUser } = useAuth();
  return useMutation({ mutationFn: (patch) => updateUser(patch) });
}

/** mutate({ tempUnit?, city?, weatherSource?, defaultOccasion?, urgentAfterDays?, occasions?, coords? }) -> user. */
export function useUpdatePreferences() {
  const client = useQueryClient();
  const { updatePreferences } = useAuth();
  return useMutation({
    mutationFn: (patch) => updatePreferences(patch),
    onSettled: () => invalidateGroup(client, 'preferences'),
  });
}

/** mutate({ preferences, sampleWardrobe }) -> { user, importedCount }. */
export function useCompleteOnboarding() {
  const client = useQueryClient();
  const { completeOnboarding } = useAuth();
  return useMutation({
    mutationFn: (values) => completeOnboarding(values),
    onSettled: () => client.invalidateQueries(),
  });
}

/** mutate({ currentPassword, newPassword }) -> { ok }. */
export function useChangePassword() {
  return useMutation({ mutationFn: (values) => authService.changePassword(values) });
}

/** mutate({ password }) -> { ok }. Signs out and clears every cache on success. */
export function useDeleteAccount() {
  const { deleteAccount } = useAuth();
  return useMutation({ mutationFn: (values) => deleteAccount(values) });
}

/** mutate(email) -> { sent, email }. */
export function useRequestPasswordReset() {
  return useMutation({ mutationFn: (email) => authService.requestPasswordReset(email) });
}

/**
 * mutateAsync() -> the user's data as a plain object (profile without secrets, items,
 * outfits, wear logs, plans). The caller turns it into a download.
 */
export function useExportData() {
  return useMutation({ mutationFn: () => authService.exportMyData() });
}
