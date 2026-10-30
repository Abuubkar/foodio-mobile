import { toApiError } from '@/api/errors';
import type { Person } from '@/features/identity/types/identity.types';

/**
 * Whether the server will post this clip as the restaurant rather than as a
 * customer.
 *
 * The rule is the API's — holding `kitchen` for that restaurant is what makes
 * a clip the kitchen's own — and it reads the entitlement, not the role the
 * app is currently wearing. An owner browsing their own page as a customer
 * still posts as the restaurant, so a check on `role.kind` would miss exactly
 * the person this matters to.
 *
 * Mirrored here only because the consequence lands on this screen: the
 * restaurant's own clips are refused while an invoice is unpaid, and a
 * customer's never are.
 */
export function postsAsRestaurant(
  person: Person | null,
  restaurantId: string | undefined,
): boolean {
  if (!person || !restaurantId) return false;

  return person.entitlements.some(
    (entitlement) =>
      entitlement.restaurantId === restaurantId && entitlement.capabilities.includes('kitchen'),
  );
}

/**
 * `POST /clips` answers 402 when an unpaid invoice has paused the restaurant's
 * own clips — the same dunning bar the going-live screen explains. A status, not
 * a message match: the copy is the server's to reword.
 */
export function isPostingPausedByBilling(error: unknown): boolean {
  return toApiError(error).status === 402;
}
