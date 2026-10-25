import { Pressable, View } from 'react-native';

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { colors } from '@/theme';

import type { Clip } from '../types/clip.types';
import { clipHeading, isCustomerClip } from '../types/clip.types';

type ClipCardProps = {
  clip: Clip;
  /** Redundant on a restaurant's own page. */
  showRestaurantName?: boolean;
};

export function ClipCard({ clip, showRestaurantName = true }: ClipCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();

  const label = isCustomerClip(clip)
    ? t('clips.customerClipLabel', { restaurant: clipHeading(clip), caption: clip.caption })
    : t('clips.restaurantClipLabel', { restaurant: clipHeading(clip), caption: clip.caption });

  return (
    <Pressable
      onPress={() => guard(() => router.push(`/clip/${clip.id}`))}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="relative mr-3 w-40 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm active:opacity-80"
    >
      <View className="relative h-60 w-full bg-gray-200">
        <Image
          source={{ uri: clip.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />

        {/* The marker travels with the clip — the shelf heading is not enough. */}
        <View
          className={
            isCustomerClip(clip)
              ? 'absolute left-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-emerald-500/90'
              : 'absolute left-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-black/50'
          }
        >
          <Ionicons
            name={isCustomerClip(clip) ? 'checkmark' : 'storefront-outline'}
            size={13}
            color={colors.white}
          />
        </View>

        {/* Opposite the marker and cut from the same cloth. Anchored to the
            corner rather than stacked above the name, which used to ride up
            whenever a Restaurant's name wrapped to a second line. */}
        <View className="absolute right-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-black/50">
          <Ionicons name="play" size={12} color={colors.white} />
        </View>

        {showRestaurantName ? (
          <View className="absolute inset-x-0 bottom-0 p-2.5">
            <Text
              variant="caption"
              numberOfLines={2}
              className="text-[10px] font-bold uppercase tracking-wider text-white"
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.65)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {clipHeading(clip)}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
