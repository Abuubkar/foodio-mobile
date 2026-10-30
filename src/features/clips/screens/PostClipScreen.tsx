import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { ScreenHeader, SignInRequired } from '@/components/shared';
import { Button, Photo, Text, TextField } from '@/components/ui';
// Deep import, not the manage barrel: that barrel pulls every Manage screen,
// and this needs one query.
import { useSubscription } from '@/features/manage/hooks/useSubscription';
import { useSessionStore } from '@/stores/session.store';

import { PostingPausedNotice } from '../components/PostingPausedNotice';
import type { ClipTake } from '../hooks/usePostClip';
import { usePostClip } from '../hooks/usePostClip';
import { isPostingPausedByBilling, postsAsRestaurant } from '../lib/kitchenClips';
import { MAX_CLIP_SECONDS } from '../lib/recordClip';

const CAPTION_LIMIT = 280;

/**
 * Filming a clip and posting it. One screen for all three shapes a clip takes.
 *
 * What it is **about** comes from the route, not from a picker on this screen:
 * opened from the feed it is about nothing in particular, opened from a
 * restaurant it is about that kitchen, and opened from an order it carries the
 * receipt. A person who has just tapped "post a clip" on a restaurant page has
 * already told us which restaurant, and asking again is a form to fill in
 * before the thing they wanted to do.
 */
export function PostClipScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    restaurantId?: string;
    restaurantName?: string;
    menuItemId?: string;
    orderId?: string;
  }>();

  const person = useSessionStore((state) => state.person);
  const { film, isFilming, send } = usePostClip();

  const [take, setTake] = useState<ClipTake | null>(null);
  const [caption, setCaption] = useState('');
  const [refusedForBilling, setRefusedForBilling] = useState(false);

  const asRestaurant = postsAsRestaurant(person, params.restaurantId);
  // Only asked when the clip would be the restaurant's own. A customer's clip
  // is never refused over somebody else's invoice, and asking would be a
  // request they are not entitled to make.
  const subscription = useSubscription(asRestaurant ? (params.restaurantId ?? '') : '');

  /**
   * Said before they film where we can, and after the refusal where we cannot.
   * An unheard-from subscription claims nothing — that is the going-live
   * screen's rule, and the server refuses anyway if we guessed wrong.
   */
  const isPaused = refusedForBilling || subscription.data?.status === 'past_due';

  const checkAgain = () => {
    setRefusedForBilling(false);
    void subscription.refetch();
  };

  const onFilm = async () => {
    const filmed = await film();
    // Backing out of the camera is not a failure, and must not discard a take
    // they already have.
    if (filmed) setTake(filmed);
  };

  const onPost = () => {
    if (!take) return;

    setRefusedForBilling(false);

    send.mutate(
      {
        videoUri: take.videoUri,
        posterUri: take.posterUri,
        durationSeconds: take.durationSeconds,
        caption,
        restaurantId: params.restaurantId,
        menuItemId: params.menuItemId,
        orderId: params.orderId,
      },
      {
        onSuccess: () => router.back(),
        onError: (cause) => {
          // The dunning bar is a state, not a slip — it stays on screen for
          // the owner to act on rather than flashing past in an alert. The
          // take survives either way.
          //
          // Only for the restaurant's own clip: a 402 reaching a customer is
          // not their invoice to settle, so it stays an ordinary failure.
          if (asRestaurant && isPostingPausedByBilling(cause)) {
            setRefusedForBilling(true);
            return;
          }

          Alert.alert(t('clips.post.failedTitle'), t('clips.post.failedBody'));
        },
      },
    );
  };

  if (person === null) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title={t('clips.post.title')} />
        <SignInRequired
          message={t('clips.post.signInRequired')}
          className="flex-1 items-center justify-center px-8"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={t('clips.post.title')} />

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="caption" className="text-neutral-600">
          {params.restaurantName
            ? t('clips.post.aboutKitchen', { name: params.restaurantName })
            : t('clips.post.aboutNothing')}
        </Text>

        {isPaused ? (
          <PostingPausedNotice onCheckAgain={checkAgain} isChecking={subscription.isFetching} />
        ) : null}

        {take ? (
          <View className="gap-3">
            {/* The poster, not the video. It is what a feed cell will draw
                before any decoder runs, so it is what they should approve. */}
            <Photo uri={take.posterUri} className="h-80 w-full rounded-2xl" />
            <Text variant="caption" className="text-neutral-600">
              {t('clips.post.took', { seconds: take.durationSeconds })}
            </Text>
            <Button variant="secondary" onPress={onFilm} disabled={isFilming || send.isPending}>
              {t('clips.post.filmAgain')}
            </Button>
          </View>
        ) : (
          <View className="gap-3">
            <Text variant="body" className="text-neutral-700">
              {t('clips.post.explain', { seconds: MAX_CLIP_SECONDS })}
            </Text>
            <Button onPress={onFilm} disabled={isFilming}>
              {isFilming ? t('clips.post.filming') : t('clips.post.film')}
            </Button>
          </View>
        )}

        <TextField
          label={t('clips.post.caption')}
          value={caption}
          onChangeText={setCaption}
          maxLength={CAPTION_LIMIT}
          multiline
          editable={!send.isPending}
        />

        <Button onPress={onPost} disabled={take === null || send.isPending || isPaused}>
          {send.isPending ? t('clips.post.posting') : t('clips.post.post')}
        </Button>
      </ScrollView>
    </View>
  );
}
