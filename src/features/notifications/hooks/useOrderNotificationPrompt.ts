import { useCallback, useEffect, useState } from 'react';

import { logError } from '@/lib/logger';
import { expoPermissionAdapter, PermissionType } from '@/services/permissions';
import { hasAskedAboutNotifications, rememberAskedAboutNotifications } from '@/services/storage';

/**
 * Whether to offer notifications, and what to do when the customer answers.
 *
 * Asked at the first placed Order rather than during onboarding. Android only
 * ever shows the OS prompt once, so a refusal there is close to permanent —
 * and a cold prompt, before the Person has seen a Restaurant, is the one most
 * people refuse. Here there is a reason to give: their food is on its way.
 *
 * Our own question comes first. The OS prompt is spent only on somebody who
 * has already said yes to the readable version of it.
 */
export function useOrderNotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        if (await hasAskedAboutNotifications()) return;

        // Already granted needs no reason; anything other than undetermined
        // means the OS has an answer it will not revisit from in here.
        const { status } = await expoPermissionAdapter.status(PermissionType.Notification);
        if (cancelled || status !== 'undetermined') return;

        setVisible(true);
      } catch (error) {
        // A prompt we could not decide about is a prompt not shown.
        logError('notifications.prompt.decide', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Either answer settles it for good: this is asked once per install. */
  const settle = useCallback(() => {
    setVisible(false);
    void rememberAskedAboutNotifications();
  }, []);

  const accept = useCallback(async () => {
    settle();
    try {
      await expoPermissionAdapter.request(PermissionType.Notification);
    } catch (error) {
      // Nothing the customer can do about it, and their Order is unaffected.
      logError('notifications.prompt.request', error);
    }
  }, [settle]);

  return { visible, accept, decline: settle };
}
