import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { logError } from '@/lib/logger';

/**
 * Ordinary device storage, not Secure Store.
 *
 * A Cart is not a secret — it is a list of dishes somebody is thinking about —
 * and Secure Store pays for encryption this does not need. Tokens stay where
 * they are.
 */
const CART_KEY = 'foodio_cart';

/**
 * Bumped when the stored shape changes. A Cart from an older version is
 * dropped rather than migrated: it is a few taps to rebuild, and a half-
 * understood Cart could carry a price the customer never saw.
 */
const CART_VERSION = 1;

const restaurantSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  deliveryFeeMinor: z.number(),
  deliveryEstimate: z.object({ minMinutes: z.number(), maxMinutes: z.number() }),
});

const chosenOptionSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  choiceId: z.string(),
  choiceName: z.string(),
  priceDeltaMinor: z.number().int(),
});

const lineSchema = z.object({
  id: z.string(),
  menuItemId: z.string(),
  name: z.string(),
  image: z.string(),
  /** The price when it was added, which is the whole point of keeping it. */
  unitPriceMinor: z.number(),
  quantity: z.number().int().positive(),
  instruction: z.string(),
  /** Defaulted, so a Cart stored before options existed still restores. */
  options: z.array(chosenOptionSchema).default([]),
});

const storedCartSchema = z.object({
  version: z.literal(CART_VERSION),
  restaurant: restaurantSchema.nullable(),
  lines: z.array(lineSchema),
  nextLineId: z.number().int().positive(),
});

export type StoredCart = Omit<z.infer<typeof storedCartSchema>, 'version'>;

/**
 * Null for every way this can fail to produce a Cart: nothing stored, a shape
 * from an older version, or a value that is not JSON at all. The caller starts
 * empty, which is what a customer with no Cart expects anyway.
 */
export async function getStoredCart(): Promise<StoredCart | null> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return null;

    const parsed = storedCartSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;

    const { restaurant, lines, nextLineId } = parsed.data;
    return { restaurant, lines, nextLineId };
  } catch (error) {
    logError('cart.storage.get', error);
    return null;
  }
}

export async function setStoredCart(cart: StoredCart): Promise<void> {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify({ version: CART_VERSION, ...cart }));
  } catch (error) {
    // Non-fatal: the Cart on screen is still correct, it just will not survive.
    logError('cart.storage.set', error);
  }
}

export async function clearStoredCart(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CART_KEY);
  } catch (error) {
    logError('cart.storage.clear', error);
  }
}
