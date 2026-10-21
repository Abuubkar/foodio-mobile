import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo, Text } from '@/components/ui';
import { logError } from '@/lib/logger';
import { colors } from '@/theme';

import { reportReviewPhoto } from '../api/review.api';
import type { ReviewPhoto } from '../types/restaurant.types';

type ReviewPhotosProps = {
  photos: readonly ReviewPhoto[];
};

/**
 * The photographs on one review, and the way to object to one.
 *
 * Reporting is a long press rather than a visible button. A flag on every
 * photograph invites tapping, and a review is somebody's account of a meal
 * they paid for — the ordinary reader has no business being nudged toward
 * moderating it. The people who need it are the ones who have seen something
 * wrong, and they go looking.
 *
 * There is no count and no "already reported" state, deliberately: the server
 * answers the same either way, because an endpoint that takes one person's
 * opinion should not report on anybody else's.
 */
export function ReviewPhotos({ photos }: ReviewPhotosProps) {
  const { t } = useTranslation();
  const [reported, setReported] = useState<string[]>([]);

  if (photos.length === 0) return null;

  const report = (mediaId: string) => {
    Alert.alert(t('review.reportTitle'), t('review.reportBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('review.reportConfirm'),
        style: 'destructive',
        onPress: () => {
          // Optimistic, and never rolled back on failure: telling somebody
          // their report did not go through invites them to send it again,
          // and the server already treats a repeat as the same answer.
          setReported((current) => [...current, mediaId]);
          void reportReviewPhoto(mediaId).catch((error: unknown) => {
            logError('review.photos.report', error);
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-2.5"
      contentContainerStyle={{ gap: 8 }}
    >
      {photos.map((photo) => (
        <Pressable
          key={photo.id}
          onLongPress={() => report(photo.id)}
          delayLongPress={500}
          accessibilityRole="image"
          accessibilityLabel={t('review.photoLabel')}
          accessibilityHint={t('review.reportHint')}
        >
          <Photo uri={photo.url} className="h-20 w-20 rounded-xl" />
          {reported.includes(photo.id) ? (
            <View className="absolute inset-0 items-center justify-center rounded-xl bg-black/55">
              <Ionicons name="flag" size={16} color={colors.white} />
              <Text variant="caption" className="mt-0.5 text-white">
                {t('review.reportedShort')}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ))}
    </ScrollView>
  );
}
