import { create } from 'zustand';

type PlaybackState = {
  /** One global: per-cell mute would let a fast fling play two audios at once. */
  muted: boolean;
  toggleMuted: () => void;
};

/**
 * Deliberately not persisted — sound is a fresh choice each app open.
 *
 * Starts unmuted. The Clips tab carries no mute control, the way TikTok and
 * Reels carry none: the hardware volume keys are the control. Muting by
 * default with nothing on screen to undo it would make the clips permanently
 * silent, since this resets every launch. The single-clip viewer still has a
 * toggle, and it writes here.
 */
export const usePlaybackStore = create<PlaybackState>((set) => ({
  muted: false,
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
}));
