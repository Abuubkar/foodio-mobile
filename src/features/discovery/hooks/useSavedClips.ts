import { useSavedStore } from '@/stores/saved.store';

import { kitchensFrom } from '../lib/kitchens';

import { useClips } from './useClips';

/**
 * The saved clips, newest save first, grouped the way the feed groups.
 *
 * Filtered from the feed rather than fetched by id. The API has no by-id
 * filter — `GET /clips?id=…` and `?ids=…` are both ignored and answer with
 * every clip, which is how the first version of this screen came to show all
 * ten when one was saved. Reusing the feed's own query also means Saved costs
 * no extra request and reads from a cache the Clips tab has usually warmed.
 *
 * The limitation this leaves: a saved clip that sits beyond the pages loaded
 * so far will not appear until the feed has reached it. That wants a real
 * endpoint — `GET /clips?ids=` or `/me/saved` — which lives in the backend
 * repo, not this one.
 */
export function useSavedClips() {
  const clipIds = useSavedStore((state) => state.clipIds);
  const isHydrated = useSavedStore((state) => state.isHydrated);

  const query = useClips();

  // Save order, not feed order: Saved promises newest kept first.
  const rank = new Map(clipIds.map((id, index) => [id, index]));
  const clips =
    query.data && isHydrated
      ? query.data
          .filter((clip) => rank.has(clip.id))
          .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
      : undefined;

  return {
    ...query,
    isPending: query.isPending || !isHydrated,
    clips,
    kitchens: clips ? kitchensFrom(clips) : undefined,
  };
}
