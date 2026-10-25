import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, SheetContainer, Text, TextField } from '@/components/ui';
import type { ClipTake } from '@/features/clips/hooks/usePostClip';
import { usePostClip } from '@/features/clips/hooks/usePostClip';
import type { ReviewFormValues } from '@/features/restaurants/types/review.types';
import {
  REVIEW_COMMENT_MAX,
  REVIEW_RATING_MAX,
  reviewFormSchema,
  toNewReview,
} from '@/features/restaurants/types/review.types';
import { logError } from '@/lib/logger';
import { colors } from '@/theme';

import { useReviewPhotos } from '../hooks/useReviewPhotos';
import { useSubmitReview } from '../hooks/useSubmitReview';
import { isAlreadyReviewed } from '../lib/reviewSubmission';

import { ReviewPhotoPicker } from './ReviewPhotoPicker';
import { ReviewVideoPicker } from './ReviewVideoPicker';

const STARS = Array.from({ length: REVIEW_RATING_MAX }, (_, index) => index + 1);

type RateOrderSheetProps = {
  visible: boolean;
  orderId: string;
  /** The video is a Clip, and a Clip about an order names the restaurant too. */
  restaurantId: string;
  restaurantName: string;
  onClose: () => void;
};

/** Five stars, an optional comment, one submission. */
export function RateOrderSheet({
  visible,
  orderId,
  restaurantId,
  restaurantName,
  onClose,
}: RateOrderSheetProps) {
  const { t } = useTranslation();
  const submitReview = useSubmitReview();

  /*
    Local files, not uploads. Photographs attach to a review that exists, so
    nothing leaves the phone until the rating has been accepted — see
    backend ADR-0021 for why that order is the one that works.
  */
  const [photos, setPhotos] = useState<string[]>([]);
  const { pick, isPicking, sendPhotos, isSending, outcome, resetPhotos } = useReviewPhotos();

  /*
    The video goes the other way round from the photographs: it has to exist
    before the review, because the review carries its Clip id. Unchecked is the
    default — publishing somebody's footage to a public feed is a different act
    from leaving a review. See backend ADR-0023.
  */
  const [take, setTake] = useState<ClipTake | null>(null);
  const [alsoPostToClips, setAlsoPostToClips] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const { film, isFilming, send: sendClip } = usePostClip();

  const { control, handleSubmit, reset } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    // `rating: 0` means "nothing picked yet"; the schema refuses it.
    defaultValues: { rating: 0, comment: '' },
  });

  // Reopening must not carry a previous draft or a stale error.
  useEffect(() => {
    if (visible) {
      reset();
      submitReview.reset();
      setPhotos([]);
      resetPhotos();
      setTake(null);
      setAlsoPostToClips(false);
      setVideoFailed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset refs are stable
  }, [visible]);

  /**
   * Sends the video first, because the review carries its Clip id.
   *
   * A failure here does **not** fail the review — the same rule the
   * photographs follow. Losing the rating and the comment because an upload
   * timed out is the worse outcome by a long way, so the review goes without
   * the video and the sheet says so.
   */
  const sendVideoFirst = async (): Promise<string | undefined> => {
    if (!take) return undefined;

    try {
      const clip = await sendClip.mutateAsync({
        videoUri: take.videoUri,
        posterUri: take.posterUri,
        durationSeconds: take.durationSeconds,
        caption: '',
        restaurantId,
        orderId,
        postToFeed: alsoPostToClips,
      });

      return clip.id;
    } catch (error) {
      logError('review.video.send', error);
      setVideoFailed(true);
      return undefined;
    }
  };

  const submit = async (values: ReviewFormValues) => {
    const clipId = await sendVideoFirst();

    submitReview.mutate(
      { orderId, review: toNewReview(values, clipId) },
      {
        onSuccess: (review) => {
          // Held open when the video failed, so the note below can be read.
          if (photos.length === 0 && !videoFailed) {
            onClose();
            return;
          }
          if (photos.length === 0) return;

          /*
            The review is posted. Photographs follow, and a failure among them
            is not a failed review — so the sheet stays open only long enough
            to say what happened, and never reopens the rating for editing.
          */
          void sendPhotos(review.id, photos).then((result) => {
            if (result.failed === 0) onClose();
          });
        },
        // Already reviewed settles the affordance into "Rated" — close quietly.
        onError: (error) => {
          if (isAlreadyReviewed(error)) onClose();
        },
      },
    );
  };

  const onFilm = () => {
    void film().then((filmed) => {
      // Backing out of the camera must not discard a take they already have.
      if (filmed) {
        setTake(filmed);
        setVideoFailed(false);
      }
    });
  };

  const addPhoto = () => {
    void pick().then((uri) => {
      if (uri) setPhotos((current) => [...current, uri]);
    });
  };

  const submitError =
    submitReview.error && !isAlreadyReviewed(submitReview.error) ? submitReview.error : null;

  return (
    <SheetContainer visible={visible} onClose={onClose}>
      <Text variant="subheading" className="text-gray-900">
        {t('review.sheetTitle')}
      </Text>
      <Text variant="body" className="mt-1 text-gray-500">
        {t('order.fromRestaurant', { restaurant: restaurantName })}
      </Text>

      <Controller
        control={control}
        name="rating"
        render={({ field, fieldState }) => (
          <View className="mt-4">
            <View className="flex-row justify-center gap-2">
              {STARS.map((star) => (
                <Pressable
                  key={star}
                  onPress={() => field.onChange(star)}
                  accessibilityRole="button"
                  accessibilityLabel={t('review.starLabel', { count: star })}
                  accessibilityState={{ selected: field.value >= star }}
                  className="p-1 active:opacity-70"
                >
                  <Ionicons
                    name={field.value >= star ? 'star' : 'star-outline'}
                    size={34}
                    color={field.value >= star ? colors.warning[500] : colors.gray[300]}
                  />
                </Pressable>
              ))}
            </View>
            {fieldState.error ? (
              <Text
                variant="caption"
                className="mt-2 text-center text-error-500"
                accessibilityLiveRegion="polite"
              >
                {t('review.errors.rating')}
              </Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="comment"
        render={({ field, fieldState }) => (
          <TextField
            label={t('review.commentLabel')}
            placeholder={t('review.commentPlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error ? t('review.errors.comment') : undefined}
            maxLength={REVIEW_COMMENT_MAX}
            multiline
            className="mt-4"
          />
        )}
      />

      <ReviewPhotoPicker
        uris={photos}
        onAdd={addPhoto}
        onRemove={(uri) => setPhotos((current) => current.filter((item) => item !== uri))}
        busy={isPicking}
      />

      <ReviewVideoPicker
        take={take}
        onFilm={onFilm}
        isFilming={isFilming}
        alsoPostToClips={alsoPostToClips}
        onAlsoPostToClipsChange={setAlsoPostToClips}
        disabled={submitReview.isPending || sendClip.isPending}
      />

      {videoFailed ? (
        <Text variant="caption" className="mt-3 text-warning-700" accessibilityLiveRegion="polite">
          {t('review.video.failed')}
        </Text>
      ) : null}

      {outcome && outcome.failed > 0 ? (
        <Text variant="caption" className="mt-3 text-warning-700" accessibilityLiveRegion="polite">
          {t('review.photosFailed', { count: outcome.failed })}
        </Text>
      ) : null}

      {submitError ? (
        <Text variant="caption" className="mt-3 text-error-500" accessibilityLiveRegion="polite">
          {submitError.message}
        </Text>
      ) : null}

      <View className="mt-5 flex-row gap-3">
        <Button variant="ghost" onPress={onClose} className="flex-1">
          {t('common.cancel')}
        </Button>
        <Button
          onPress={() => void handleSubmit(submit)()}
          disabled={submitReview.isPending || isSending || sendClip.isPending}
          className="flex-1"
        >
          {sendClip.isPending
            ? t('review.video.sending')
            : isSending
              ? t('review.sendingPhotos')
              : t('review.submit')}
        </Button>
      </View>
    </SheetContainer>
  );
}
