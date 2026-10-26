import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { ScreenHeader, SignInRequired } from '@/components/shared';
import { Button, Photo, Text, TextField } from '@/components/ui';
import { useSessionStore } from '@/stores/session.store';

import type { ClipTake } from '../hooks/usePostClip';
import { usePostClip } from '../hooks/usePostClip';
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

  const isSignedIn = useSessionStore((state) => state.person !== null);
  const { film, isFilming, send } = usePostClip();

  const [take, setTake] = useState<ClipTake | null>(null);
  const [caption, setCaption] = useState('');

  const onFilm = async () => {
    const filmed = await film();
    // Backing out of the camera is not a failure, and must not discard a take
    // they already have.
    if (filmed) setTake(filmed);
  };

  const onPost = () => {
    if (!take) return;

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
        onError: () => Alert.alert(t('clips.post.failedTitle'), t('clips.post.failedBody')),
      },
    );
  };

  if (!isSignedIn) {
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

        <Button onPress={onPost} disabled={take === null || send.isPending}>
          {send.isPending ? t('clips.post.posting') : t('clips.post.post')}
        </Button>
      </ScrollView>
    </View>
  );
}
