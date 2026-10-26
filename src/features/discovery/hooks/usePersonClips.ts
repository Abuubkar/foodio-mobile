import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';

import { fetchClipsByPerson } from '../api/clip.api';

/** One person's own clips, for their profile. */
export function usePersonClips(personId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.clips.byPerson(personId ?? ''),
    queryFn: () => fetchClipsByPerson(personId ?? ''),
    enabled: personId !== undefined && personId !== '',
  });
}
