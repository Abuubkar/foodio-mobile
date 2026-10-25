import { Pressable } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

type ComposeClipButtonProps = {
  /** When the clip should be about one kitchen. Absent posts to the community half. */
  restaurantId?: string | undefined;
  restaurantName?: string | undefined;
};

/**
 * The way in to filming a clip, floated over whatever is behind it.
 *
 * Over the feed rather than in a header, because the feed has no header — it
 * is a full-screen pager, and the one thing that must not move is the video.
 */
export function ComposeClipButton({ restaurantId, restaurantName }: ComposeClipButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/post-clip',
          params: {
            ...(restaurantId === undefined ? {} : { restaurantId }),
            ...(restaurantName === undefined ? {} : { restaurantName }),
          },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={t('clips.post.compose')}
      className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/55"
      style={{ top: insets.top + 8 }}
      hitSlop={8}
    >
      <Ionicons name="videocam-outline" size={22} color={colors.white} />
    </Pressable>
  );
}
