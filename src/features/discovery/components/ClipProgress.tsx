import { View } from 'react-native';

import { useEvent } from 'expo';
import type { VideoPlayer } from 'expo-video';

type ClipProgressProps = {
  player: VideoPlayer;
  /** The tab bar owns the bottom edge in the Clips tab; the viewer does not. */
  bottomInset: number;
};

/**
 * How far through the Clip is.
 *
 * Its own component on purpose. The player reports the time four times a
 * second, and the clips feed has already fought black frames and flicker
 * caused by re-rendering a cell while its surface is live — so what re-renders
 * at that rate is a 2dp bar, not the `VideoView` above it.
 *
 * It also answers a question the feed could not: a paused Clip and a stalled
 * one looked identical before this.
 */
export function ClipProgress({ player, bottomInset }: ClipProgressProps) {
  const { currentTime } = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });

  // Unknown until the media is ready, and zero would divide badly.
  const duration = player.duration;
  if (!Number.isFinite(duration) || duration <= 0) return null;

  const progress = Math.min(Math.max(currentTime / duration, 0), 1);

  return (
    <View
      pointerEvents="none"
      style={{ bottom: bottomInset }}
      className="absolute inset-x-0 h-0.5 bg-white/25"
    >
      <View style={{ width: `${progress * 100}%` }} className="h-full bg-white" />
    </View>
  );
}
