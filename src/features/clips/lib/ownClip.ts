import type { Clip } from '@/features/discovery/types/clip.types';
import type { Person } from '@/features/identity/types/identity.types';

/**
 * Whether the feed should offer to take this clip down.
 *
 * Two kinds of "mine": a clip you filmed, and a clip your kitchen published.
 * The server also lets entitled staff remove a *customer's* clip at their
 * restaurant, and this deliberately does not — in the feed that would be
 * moderation wearing the same button as authorship, and reporting is already
 * the path for a clip that is somebody else's.
 *
 * `delivery` does not count either: carrying the food says nothing about what
 * the restaurant publishes.
 *
 * The server is the authority, so a false here only means the app declines to
 * *offer* removal. It never widens what a request is allowed to do.
 */
export function canRemoveClip(clip: Clip, person: Person | null): boolean {
  if (!person) return false;
  if (clip.author.kind === 'customer') return clip.author.personId === person.id;

  const restaurantId = clip.restaurantId;
  if (restaurantId === undefined) return false;

  return person.entitlements.some(
    (entitlement) =>
      entitlement.restaurantId === restaurantId && entitlement.capabilities.includes('kitchen'),
  );
}
