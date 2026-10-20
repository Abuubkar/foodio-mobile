import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';
import { formatDate } from '@/utils/date';

import type { RestaurantReview } from '../types/restaurant.types';

import { ReviewAvatar } from './ReviewAvatar';
import { ReviewPhotos } from './ReviewPhotos';

type ReviewCardProps = {
  review: RestaurantReview;
};

export function ReviewCard({ review }: ReviewCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <View className="mb-3 rounded-2xl bg-gray-50 p-4 border border-gray-100">
      <View className={review.comment ? 'mb-2 flex-row items-center' : 'flex-row items-center'}>
        <ReviewAvatar author={review.author} avatar={review.avatar} />
        <View className="ml-3 flex-1">
          <Text variant="label" className="text-gray-900">
            {review.author}
          </Text>
          <Text variant="caption" className="text-gray-400">
            {formatDate(review.postedAt, i18n.language)}
          </Text>
        </View>
        <View
          className="flex-row items-center"
          accessibilityLabel={t('restaurant.ratingOutOfFive', { rating: review.rating })}
        >
          {Array.from({ length: review.rating }).map((_, index) => (
            <Ionicons key={index} name="star" size={12} color={colors.warning[500]} />
          ))}
        </View>
      </View>
      {review.comment ? (
        <Text variant="body" className="text-gray-600 text-sm leading-5">
          {review.comment}
        </Text>
      ) : null}

      <ReviewPhotos photos={review.photos} />
    </View>
  );
}
