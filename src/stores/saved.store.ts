import { create } from 'zustand';

import { getStoredSavedClips, setStoredSavedClips } from '@/services/storage';

type SavedState = {
  /** Newest first. Ids only — the clips themselves come from the API. */
  clipIds: string[];

  /**
   * False until the device's list has been read. Nothing is written back
   * before it flips, or the empty list the store starts with would overwrite
   * the real one on the way past — the same trap the cart hit.
   */
  isHydrated: boolean;
  hydrate: () => Promise<void>;

  toggle: (clipId: string) => void;
  /**
   * Emptied on sign-out. Saving needs a session, so a list left behind would
   * belong to nobody: the next person on a shared device would carry a count
   * they cannot open, since Saved is behind the same session.
   */
  clear: () => void;
};

export const useSavedStore = create<SavedState>((set, get) => ({
  clipIds: [],
  isHydrated: false,

  hydrate: async () => {
    const stored = await getStoredSavedClips();
    set(stored ? { clipIds: stored, isHydrated: true } : { isHydrated: true });
  },

  /**
   * One action, not save/unsave: the button is a toggle, and two entry points
   * would let a double tap leave the list disagreeing with the icon.
   */
  toggle: (clipId) => {
    const { clipIds, isHydrated } = get();
    const next = clipIds.includes(clipId)
      ? clipIds.filter((id) => id !== clipId)
      : [clipId, ...clipIds];

    set({ clipIds: next });
    // Writing before hydration would persist a list built on an empty start.
    if (isHydrated) void setStoredSavedClips(next);
  },

  clear: () => {
    set({ clipIds: [] });
    // Unconditional, unlike `toggle`: emptying a list that was never read is
    // still the right end state, and leaving the device's copy behind would
    // restore it on the next launch.
    void setStoredSavedClips([]);
  },
}));

export const selectIsSaved =
  (clipId: string) =>
  (state: SavedState): boolean =>
    state.clipIds.includes(clipId);

export const selectSavedCount = (state: SavedState): number => state.clipIds.length;
