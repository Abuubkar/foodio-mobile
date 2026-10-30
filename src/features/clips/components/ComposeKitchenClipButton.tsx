import { Pressable } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { colors } from '@/theme';

type ComposeKitchenClipButtonProps = {
  restaurantId: string;
  restaurantName: string;
};

/**
 * The restaurant filming its own clip, from the header of the screen its staff
 * already live on.
 *
 * In the header beside Manage rather than as a band above the menu, for t4's
 * reason: the menu switches are service-critical and this is not, so it must
 * not take a row away from them mid-service.
 *
 * Ink, not the brand orange, and the same disc the tab bar uses — one control
 * for composing a clip that looks the same wherever it appears. Sized to its
 * neighbour so the header stays a row of equals.
 */
export function ComposeKitchenClipButton({
  restaurantId,
  restaurantName,
}: ComposeKitchenClipButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/post-clip', params: { restaurantId, restaurantName } })
      }
      accessibilityRole="button"
      accessibilityLabel={t('clips.post.fromKitchen', { name: restaurantName })}
      className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-gray-900 active:bg-gray-700"
    >
      <Ionicons name="videocam" size={17} color={colors.white} />
    </Pressable>
  );
}
