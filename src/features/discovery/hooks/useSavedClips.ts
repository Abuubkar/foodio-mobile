import { skipToken, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { useSavedStore } from '@/stores/saved.store';

import { fetchClipsByIds } from '../api/clip.api';
import { kitchensFrom } from '../lib/kitchens';

/**
 * The saved clips, newest save first, grouped the way the feed groups.
 *
 * Fetched by id rather than filtered out of the feed, so a clip saved long ago
 * is found whether or not the feed has paged that far. The endpoint answers in
 * its own order, so save order is restored here — Saved promises newest kept
 * first, and the API has no reason to know that.
 *
 * Idle until the store has hydrated: querying an empty list first would cache
 * "nothing saved" against the real answer arriving a tick later.
 */
export function useSavedClips() {
  const clipIds = useSavedStore((state) => state.clipIds);
  const isHydrated = useSavedStore((state) => state.isHydrated);

  const query = useQuery({
    queryKey: queryKeys.clips.byIds(clipIds),
    queryFn: isHydrated ? () => fetchClipsByIds(clipIds) : skipToken,
  });

  const rank = new Map(clipIds.map((id, index) => [id, index]));
  const clips = query.data
    ? [...query.data].sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
    : undefined;

  return {
    ...query,
    isPending: query.isPending || !isHydrated,
    clips,
    kitchens: clips ? kitchensFrom(clips) : undefined,
  };
}
