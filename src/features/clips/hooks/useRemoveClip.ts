import { useState } from 'react';
import { Alert } from 'react-native';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '@/constants/queryKeys';
import { logError } from '@/lib/logger';
import { useSavedStore } from '@/stores/saved.store';

import { removeClip } from '../api/clip-post.api';

/**
 * Taking down a clip of your own.
 *
 * Behind a visible button rather than the long press, which reporting owns:
 * removing is a different act by a different person, and a gesture that means
 * "somebody should look at this" must not sometimes mean "this is gone".
 *
 * **Not optimistic, unlike reporting.** A report that fails is worth
 * swallowing because the server treats a repeat as the same answer, so saying
 * so would only invite a second one. A removal that fails leaves the clip
 * public — somebody told it worked would walk away believing otherwise, which
 * is the one outcome this feature exists to prevent. So the cell is only
 * crossed out once the server has confirmed it, and a failure says so.
 */
export function useRemoveClip() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const discardSaved = useSavedStore((state) => state.discard);
  const [removed, setRemoved] = useState<string[]>([]);

  const mutation = useMutation({
    // Wrapped, not passed by reference: the mutation hands its function a
    // context argument too, and the API call takes only the id.
    mutationFn: (clipId: string) => removeClip(clipId),
    onSuccess: (_result, clipId) => {
      setRemoved((current) => [...current, clipId]);

      // Saved holds ids, so a removed clip would otherwise sit in the list
      // forever as a tile the API has stopped answering for.
      discardSaved(clipId);

      // Refetched rather than removed from the cache here, so the cell stays
      // put under the overlay instead of collapsing under their thumb. The
      // saved list is keyed under `clips.all` too, so it refetches with it.
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
    onError: (error: unknown) => {
      logError('clips.remove', error);
      Alert.alert(t('clips.remove.failedTitle'), t('clips.remove.failedBody'));
    },
  });

  const remove = (clipId: string) => {
    Alert.alert(t('clips.remove.title'), t('clips.remove.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('clips.remove.confirm'),
        style: 'destructive',
        onPress: () => mutation.mutate(clipId),
      },
    ]);
  };

  const isRemoved = (clipId: string) => removed.includes(clipId);

  return { remove, isRemoved, isRemoving: mutation.isPending };
}
