import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StoredCart } from './cart.storage';
import { clearStoredCart, getStoredCart, setStoredCart } from './cart.storage';

const CART_KEY = 'foodio_cart';

const aCart = (): StoredCart => ({
  restaurant: {
    id: 'rest-1',
    name: 'Taco Fiesta',
    currency: 'PKR',
    deliveryFeeMinor: 199,
    deliveryEstimate: { minMinutes: 20, maxMinutes: 30 },
  },
  lines: [
    {
      id: 'line-1',
      menuItemId: 'r1-pop-1',
      name: 'Birria Tacos',
      image: '',
      unitPriceMinor: 1499,
      quantity: 2,
      instruction: 'no onions',
      options: [],
    },
  ],
  nextLineId: 2,
});

describe('cart storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('has nothing to restore on a fresh install', async () => {
    expect(await getStoredCart()).toBeNull();
  });

  it('gives back the Cart it was given', async () => {
    await setStoredCart(aCart());

    expect(await getStoredCart()).toEqual(aCart());
  });

  /**
   * The whole reason the line keeps a price of its own: checkout compares it
   * against the live one, and a restored Cart that silently repriced would
   * stop `price-changed` ever firing.
   */
  it('keeps the price the dish was added at', async () => {
    await setStoredCart(aCart());

    const restored = await getStoredCart();

    expect(restored?.lines[0]?.unitPriceMinor).toBe(1499);
    expect(restored?.lines[0]?.instruction).toBe('no onions');
  });

  it('forgets the Cart when it is cleared', async () => {
    await setStoredCart(aCart());
    await clearStoredCart();

    expect(await getStoredCart()).toBeNull();
  });

  it('ignores a stored value that is not JSON at all', async () => {
    await AsyncStorage.setItem(CART_KEY, 'not json');

    expect(await getStoredCart()).toBeNull();
  });

  /** A Cart from an older shape is dropped, never half-understood. */
  it('ignores a Cart stored by an older version', async () => {
    await AsyncStorage.setItem(
      CART_KEY,
      JSON.stringify({ version: 0, restaurant: null, lines: [], nextLineId: 1 }),
    );

    expect(await getStoredCart()).toBeNull();
  });

  it('ignores a line missing the price it was added at', async () => {
    const { lines, ...rest } = aCart();
    const [line] = lines;
    const { unitPriceMinor: _dropped, ...withoutPrice } = line!;

    await AsyncStorage.setItem(
      CART_KEY,
      JSON.stringify({ version: 1, ...rest, lines: [withoutPrice] }),
    );

    expect(await getStoredCart()).toBeNull();
  });
});
