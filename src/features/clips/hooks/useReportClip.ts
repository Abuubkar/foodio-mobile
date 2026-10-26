import { useState } from 'react';
import { Alert } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '@/constants/queryKeys';
import { logError } from '@/lib/logger';

import { reportClip } from '../api/clip-post.api';

/**
 * Objecting to a clip in the feed.
 *
 * Behind a long press rather than a visible button, the same way a review's
 * photographs work: a flag on every clip invites tapping, and the ordinary
 * viewer has no business being nudged toward moderating somebody's dinner. The
 * people who need it have seen something wrong and go looking.
 *
 * There is no count and no "already reported" state, deliberately — the server
 * answers the same either way, because an endpoint that takes one person's
 * opinion should not report on anybody else's.
 */
export function useReportClip() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [reported, setReported] = useState<string[]>([]);

  const report = (clipId: string) => {
    Alert.alert(t('clips.report.title'), t('clips.report.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('clips.report.confirm'),
        style: 'destructive',
        onPress: () => {
          /* Optimistic, and never rolled back on failure: telling somebody
             their report did not go through invites them to send it again, and
             the server already treats a repeat as the same answer. */
          setReported((current) => [...current, clipId]);

          void reportClip(clipId)
            .then(() => {
              // The feed no longer serves it. Refetched rather than removed
              // here, so the cell stays put until the person scrolls away
              // instead of collapsing under their thumb.
              void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
            })
            .catch((error: unknown) => {
              logError('clips.report', error);
            });
        },
      },
    ]);
  };

  const isReported = (clipId: string) => reported.includes(clipId);

  return { report, isReported };
}
