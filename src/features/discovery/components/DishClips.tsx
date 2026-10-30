import { Pressable, View } from 'react-native';

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { colors } from '@/theme';

import { useMenuItemClips } from '../hooks/useMenuItemClips';
import type { Clip } from '../types/clip.types';
import { clipHeading, isCustomerClip } from '../types/clip.types';

type DishClipsProps = {
  menuItemId: string;
};

/**
 * The claim beside the receipt. Paired rather than shelved: the gap between
 * them should be a glance, not something held in mind across two rows.
 */
export function DishClips({ menuItemId }: DishClipsProps) {
  const { t } = useTranslation();
  const { data: clips } = useMenuItemClips(menuItemId);

  if (!clips || clips.length === 0) return null;

  // Sorted newest first by the API, so the first of each is the most recent.
  const theirs = clips.find((clip) => !isCustomerClip(clip));
  const yours = clips.find(isCustomerClip);

  return (
    <View className="mt-8">
      <Text variant="label" className="mb-3 text-gray-700">
        {t('clips.dishHeading')}
      </Text>
      <View className="flex-row gap-3">
        {theirs ? <ClipTile clip={theirs} /> : null}
        {yours ? <ClipTile clip={yours} /> : null}
      </View>
    </View>
  );
}

function ClipTile({ clip }: { clip: Clip }) {
  const { t } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();

  const isCustomer = isCustomerClip(clip);
  const label = isCustomer
    ? t('clips.customerClipLabel', { restaurant: clipHeading(clip), caption: clip.caption })
    : t('clips.restaurantClipLabel', { restaurant: clipHeading(clip), caption: clip.caption });

  return (
    <Pressable
      onPress={() => guard(() => router.push(`/clip/${clip.id}`))}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 active:opacity-80"
    >
      <View className="h-40 w-full overflow-hidden rounded-2xl bg-gray-200">
        <Image
          source={{ uri: clip.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
          accessibilityIgnoresInvertColors
        />
        <View className="absolute inset-0 items-center justify-center">
          <Ionicons name="play-circle" size={30} color={colors.white} />
        </View>
      </View>
      <View className="mt-1.5 flex-row items-center">
        <Ionicons
          name={isCustomer ? 'checkmark-circle' : 'storefront-outline'}
          size={12}
          color={isCustomer ? colors.success[500] : colors.gray[500]}
        />
        <Text
          variant="caption"
          className={isCustomer ? 'ml-1 text-success-500' : 'ml-1 text-gray-500'}
          numberOfLines={1}
        >
          {isCustomer ? t('clips.dishByCustomer') : clipHeading(clip)}
        </Text>
      </View>
    </Pressable>
  );
}
