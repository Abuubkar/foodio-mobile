import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';

import { fetchProfile } from '../api/identity.api';

/** Anybody's public profile. Public, so no session is needed to read one. */
export function useProfile(handle: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profiles.byHandle(handle ?? ''),
    queryFn: () => fetchProfile(handle ?? ''),
    enabled: handle !== undefined && handle !== '',
  });
}
