import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

type PostingPausedNoticeProps = {
  /** Asks the server again, for an owner who has just paid in another window. */
  onCheckAgain: () => void;
  isChecking: boolean;
};

/**
 * The dunning bar, said once and left on screen.
 *
 * An alert was the wrong shape for this: it is a state of the subscription
 * rather than a failed tap, and dismissing it would take the explanation away
 * from the owner who has to act on it. So it reads like the going-live
 * screen's warning — warning tint, the fact, then what it does not touch.
 *
 * It offers no way to pay, deliberately: there is no billing screen yet, and a
 * link to nowhere is worse than no link. Asking again is the one honest action
 * here, and it keeps a filmed take alive across the owner settling up.
 */
export function PostingPausedNotice({ onCheckAgain, isChecking }: PostingPausedNoticeProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-start gap-2 rounded-2xl bg-warning-100 p-4">
      <Ionicons name="alert-circle-outline" size={16} color={colors.warning[700]} />
      <View className="flex-1 gap-1">
        <Text variant="bodyMedium" className="text-warning-700">
          {t('clips.post.pausedTitle')}
        </Text>
        <Text variant="caption" className="text-warning-700">
          {t('clips.post.pausedBody')}
        </Text>
        <Text
          variant="caption"
          className="font-semibold text-warning-700"
          accessibilityRole="button"
          onPress={isChecking ? undefined : onCheckAgain}
        >
          {isChecking ? t('clips.post.pausedChecking') : t('clips.post.pausedCheckAgain')}
        </Text>
      </View>
    </View>
  );
}
