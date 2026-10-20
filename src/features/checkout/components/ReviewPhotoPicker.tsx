import { Pressable, ScrollView, View } from 'react-native';

import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { REVIEW_PHOTO_MAX } from '@/features/restaurants/types/review.types';
import { colors } from '@/theme';

type ReviewPhotoPickerProps = {
  /** Local file URIs, already shrunk. Nothing has been uploaded yet. */
  uris: readonly string[];
  onAdd: () => void;
  onRemove: (uri: string) => void;
  /** True while the picker is open, so a second tap cannot open it twice. */
  busy: boolean;
};

/**
 * Pick photographs before the review is sent.
 *
 * Nothing uploads here. The review is written first — the server counts a
 * review's photographs to enforce its limit of five, and before the review
 * exists there is nothing to count — so these are local files until the rating
 * and the comment have actually been accepted.
 *
 * That also means removing one before submitting costs nothing and leaves no
 * orphan, which is the common case: people pick the wrong picture.
 */
export function ReviewPhotoPicker({ uris, onAdd, onRemove, busy }: ReviewPhotoPickerProps) {
  const { t } = useTranslation();
  const full = uris.length >= REVIEW_PHOTO_MAX;

  return (
    <View className="mt-4">
      <Text variant="label" className="text-gray-700">
        {t('review.photosLabel')}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2"
        contentContainerStyle={{ gap: 8 }}
      >
        {uris.map((uri) => (
          <View key={uri}>
            <Image
              source={{ uri }}
              style={{ width: 72, height: 72, borderRadius: 12 }}
              contentFit="cover"
            />
            <Pressable
              onPress={() => onRemove(uri)}
              accessibilityRole="button"
              accessibilityLabel={t('review.removePhoto')}
              hitSlop={8}
              className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full bg-gray-900"
            >
              <Ionicons name="close" size={14} color={colors.white} />
            </Pressable>
          </View>
        ))}

        {full ? null : (
          <Pressable
            onPress={onAdd}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t('review.addPhoto')}
            accessibilityState={{ disabled: busy }}
            className="h-[72px] w-[72px] items-center justify-center rounded-xl border border-dashed border-gray-300 active:bg-gray-50"
          >
            <Ionicons name="camera-outline" size={22} color={colors.gray[400]} />
          </Pressable>
        )}
      </ScrollView>

      <Text variant="caption" className="mt-1.5 text-gray-400">
        {full
          ? t('review.photosFull', { count: REVIEW_PHOTO_MAX })
          : t('review.photosHint', { count: REVIEW_PHOTO_MAX })}
      </Text>
    </View>
  );
}
