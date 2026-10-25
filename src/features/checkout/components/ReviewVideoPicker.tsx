import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Button, Photo, Text } from '@/components/ui';
import type { ClipTake } from '@/features/clips/hooks/usePostClip';
import { MAX_CLIP_SECONDS } from '@/features/clips/lib/recordClip';
import { colors } from '@/theme';

type ReviewVideoPickerProps = {
  take: ClipTake | null;
  onFilm: () => void;
  isFilming: boolean;
  /** Whether the footage also goes to the public feed. Off by default. */
  alsoPostToClips: boolean;
  onAlsoPostToClipsChange: (next: boolean) => void;
  disabled: boolean;
};

/**
 * Filming the meal, and deciding who sees it.
 *
 * The checkbox is **unchecked by default**, and that is the decision this
 * component exists to carry. Publishing somebody's footage to a public feed is
 * a different act from leaving a review, and should be their choice rather
 * than a consequence of one — it also lets a customer complain with evidence
 * without broadcasting it.
 *
 * It only appears once there is something to post. A checkbox offering to
 * share a video nobody has filmed is a question about nothing.
 */
export function ReviewVideoPicker({
  take,
  onFilm,
  isFilming,
  alsoPostToClips,
  onAlsoPostToClipsChange,
  disabled,
}: ReviewVideoPickerProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-3 gap-2">
      {take ? (
        <View className="flex-row items-center gap-3">
          {/* The poster, because that is what both surfaces draw first. */}
          <Photo uri={take.posterUri} className="h-20 w-20 rounded-xl" />
          <View className="flex-1">
            <Text variant="bodyMedium">{t('review.video.filmed')}</Text>
            <Text variant="caption" className="text-neutral-600">
              {t('review.video.seconds', { seconds: take.durationSeconds })}
            </Text>
          </View>
          <Button variant="secondary" onPress={onFilm} disabled={disabled || isFilming}>
            {t('review.video.again')}
          </Button>
        </View>
      ) : (
        <Button variant="secondary" onPress={onFilm} disabled={disabled || isFilming}>
          {isFilming
            ? t('review.video.opening')
            : t('review.video.add', { seconds: MAX_CLIP_SECONDS })}
        </Button>
      )}

      {take ? (
        <Pressable
          onPress={() => onAlsoPostToClipsChange(!alsoPostToClips)}
          disabled={disabled}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: alsoPostToClips }}
          accessibilityLabel={t('review.video.alsoPost')}
          className="mt-1 flex-row items-center"
          hitSlop={6}
        >
          <Ionicons
            name={alsoPostToClips ? 'checkbox' : 'square-outline'}
            size={22}
            color={alsoPostToClips ? colors.primary[600] : colors.gray[500]}
          />
          <Text variant="body" className="ml-2 flex-1">
            {t('review.video.alsoPost')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
