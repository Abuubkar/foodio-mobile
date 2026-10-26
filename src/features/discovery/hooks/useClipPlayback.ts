import { useEffect, useState } from 'react';

import { useEvent } from 'expo';
import { useVideoPlayer } from 'expo-video';

import { usePlaybackStore } from '@/stores/playback.store';

type ClipPlaybackInput = {
  /** Swapping this swaps the source on the same player; see below. */
  mediaUrl: string | undefined;
  isActive: boolean;
  reduceMotion: boolean;
};

/**
 * One clip's player, and every hard-won rule about keeping it from flashing
 * black.
 *
 * Extracted when the community cell arrived and needed all of it. Two copies
 * of this would have been two copies of the poster latch, the `replaceAsync`
 * choice and the reduce-motion handling — and the next person to fix a
 * black-frame bug would have fixed one of them.
 */
export function useClipPlayback({ mediaUrl, isActive, reduceMotion }: ClipPlaybackInput) {
  const muted = usePlaybackStore((state) => state.muted);

  const player = useVideoPlayer(mediaUrl ?? null, (instance) => {
    instance.loop = true;
    instance.audioMixingMode = 'auto';
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const [pausedByTap, setPausedByTap] = useState(false);
  // "Playing" is ExoPlayer's clock, not its canvas. The poster must outlive
  // play() until pixels actually land, or the cell flashes black.
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);

  /*
    A new source goes onto the same player rather than mounting a second.
    `replaceAsync` loads off the UI thread — `replace` blocks it on iOS, and
    this runs on a tap. The poster latch drops because the first frame of the
    new track has not arrived yet.
  */
  useEffect(() => {
    if (!mediaUrl) return;
    setHasRenderedFrame(false);
    void player.replaceAsync(mediaUrl);
  }, [player, mediaUrl]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    player.loop = !reduceMotion;
    player.timeUpdateEventInterval = 0.25;
    setPausedByTap(false);

    if (!isActive) {
      player.pause();
      player.currentTime = 0;
      return;
    }
    if (!reduceMotion) player.play();
  }, [player, isActive, reduceMotion]);

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
      setPausedByTap(true);
      return;
    }
    player.play();
    setPausedByTap(false);
  };

  return {
    player,
    isPlaying,
    /** True once real pixels have landed. Keep the poster up until then. */
    hasRenderedFrame,
    onFirstFrameRender: () => setHasRenderedFrame(true),
    /** Paused by a deliberate tap, which is the only pause worth an overlay. */
    pausedByTap,
    togglePlayback,
  };
}
