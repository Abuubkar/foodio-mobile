import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo } from '@/components/ui';
import { colors } from '@/theme';

import type { ReviewVideo as ReviewVideoModel } from '../types/restaurant.types';

type ReviewVideoProps = {
  video: ReviewVideoModel;
};

/**
 * The video on one review: a poster until somebody asks for it.
 *
 * Nothing autoplays here. A restaurant page is a list of reviews, and a list
 * that starts three decoders because three customers filmed their dinner is a
 * page that stutters on the hardware this is for. The poster is also why the
 * cell renders at all before any decoder runs — the Saved screen already
 * taught that one.
 */
export function ReviewVideo({ video }: ReviewVideoProps) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);

  // Null until asked for, so mounting a review mounts no player.
  const player = useVideoPlayer(playing ? video.url : null, (instance) => {
    instance.loop = false;
    instance.play();
  });

  if (!playing) {
    return (
      <Pressable
        onPress={() => setPlaying(true)}
        accessibilityRole="button"
        accessibilityLabel={t('review.video.play')}
        className="mt-2.5 h-40 w-28 overflow-hidden rounded-xl bg-neutral-200"
      >
        <Photo uri={video.posterUrl} className="h-full w-full" />
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-black/55">
            <Ionicons name="play" size={22} color={colors.white} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View className="mt-2.5 h-40 w-28 overflow-hidden rounded-xl bg-black">
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="cover"
        // TextureView for the same reason the feed uses one: a SurfaceView
        // detached by list recycling goes black and stays black.
        surfaceType="textureView"
        accessibilityLabel={t('review.video.play')}
      />
    </View>
  );
}
