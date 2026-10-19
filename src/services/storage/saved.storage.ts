import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { logError } from '@/lib/logger';

/**
 * Which clips the customer kept.
 *
 * Ordinary device storage, like the cart: a shortlist of dishes somebody is
 * thinking about is not a secret, and Secure Store pays for encryption this
 * does not need.
 *
 * Ids only. The clip itself is re-read from the API, so a saved clip whose
 * dish was reprised or repriced shows what is true now rather than a snapshot
 * of what it cost the day it was saved. A saved clip the API has since dropped
 * simply stops appearing.
 */
const SAVED_KEY = 'foodio_saved_clips';
const SAVED_VERSION = 1;

const savedSchema = z.object({
  version: z.literal(SAVED_VERSION),
  /** Newest first — the order Saved renders in. */
  clipIds: z.array(z.string()),
});

export async function getStoredSavedClips(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (!raw) return null;

    const parsed = savedSchema.safeParse(JSON.parse(raw));
    // An older or corrupt shape is dropped, not migrated: re-saving is a tap.
    if (!parsed.success) return null;

    return parsed.data.clipIds;
  } catch (error) {
    logError('saved.storage.get', error);
    return null;
  }
}

export async function setStoredSavedClips(clipIds: readonly string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify({ version: SAVED_VERSION, clipIds }));
  } catch (error) {
    logError('saved.storage.set', error);
  }
}
