import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

type PostClipRowProps = {
  restaurantId: string;
  restaurantName: string;
};

/**
 * The way into the composer from a restaurant's page, carrying which kitchen
 * the clip is about.
 *
 * Its own row rather than a corner of the clips shelf, because that shelf
 * draws nothing until a clip exists — and a restaurant with no clips yet is
 * precisely the one that needs the first one. No receipt is involved: anybody
 * may film a kitchen they are standing in, which is why this sits on the page
 * and not behind an order.
 *
 * The ink disc is the house mark for composing a clip, the same one the tab
 * bar carries. A camera rather than the tab bar's plus — there, the black
 * clips bar supplies the meaning; here nothing else would say what is filmed.
 */
export function PostClipRow({ restaurantId, restaurantName }: PostClipRowProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/post-clip', params: { restaurantId, restaurantName } })
      }
      accessibilityRole="button"
      accessibilityLabel={t('clips.post.fromRestaurantLabel', { name: restaurantName })}
      className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-4 active:bg-gray-50"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-900">
        <Ionicons name="videocam" size={18} color={colors.white} />
      </View>
      <View className="flex-1">
        <Text variant="bodyMedium" className="text-gray-900">
          {t('clips.post.fromRestaurant')}
        </Text>
        <Text variant="caption" className="mt-0.5 text-gray-500">
          {t('clips.post.fromRestaurantHint', { name: restaurantName })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
    </Pressable>
  );
}
