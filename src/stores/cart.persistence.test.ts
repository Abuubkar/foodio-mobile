import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AddableMenuItem, CartRestaurant } from '@/features/cart';
import { getStoredCart, setStoredCart } from '@/services/storage';

import { useCartStore } from './cart.store';

const tacos: CartRestaurant = {
  id: 'rest-1',
  name: 'Taco Fiesta',
  currency: 'PKR',
  deliveryFeeMinor: 199,
  deliveryEstimate: { minMinutes: 20, maxMinutes: 30 },
};

const pizza: CartRestaurant = {
  id: 'rest-2',
  name: 'Bella Italia',
  currency: 'PKR',
  deliveryFeeMinor: 0,
  deliveryEstimate: { minMinutes: 25, maxMinutes: 35 },
};

const birria: AddableMenuItem = {
  id: 'r1-pop-1',
  name: 'Birria Tacos',
  image: '',
  priceMinor: 1499,
};

const margherita: AddableMenuItem = {
  id: 'r2-pop-2',
  name: 'Margherita',
  image: '',
  priceMinor: 1850,
};

const state = () => useCartStore.getState();

/** The store writes on a `set`, which resolves a tick later than the action. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A fresh launch: nothing in memory, whatever is on the device still there. */
const relaunch = async () => {
  useCartStore.setState({ restaurant: null, lines: [], nextLineId: 1, isHydrated: false });
  await state().hydrate();
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useCartStore.setState({ restaurant: null, lines: [], nextLineId: 1, isHydrated: true });
  await settled();
});

describe('a Cart that survives closing the app', () => {
  it('is still there after a relaunch', async () => {
    state().addItem(tacos, birria, { instruction: 'no onions', quantity: 2 });
    await settled();

    await relaunch();

    expect(state().restaurant?.id).toBe('rest-1');
    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.quantity).toBe(2);
    expect(state().lines[0]?.instruction).toBe('no onions');
  });

  /**
   * Checkout compares the line's price against the live one. A restored Cart
   * that quietly took today's price would stop `price-changed` ever firing.
   */
  it('restores the price the dish was added at, not a fresh one', async () => {
    state().addItem(tacos, birria);
    await settled();

    await relaunch();

    expect(state().lines[0]?.unitPriceMinor).toBe(1499);
  });

  /** Line ids must not collide with the restored ones. */
  it('carries on numbering lines where it left off', async () => {
    state().addItem(tacos, birria);
    await settled();

    await relaunch();
    state().addItem(tacos, { ...birria, id: 'r1-pop-3', name: 'Horchata', priceMinor: 425 });

    expect(state().lines.map((line) => line.id)).toEqual(['line-1', 'line-2']);
  });

  /** The one-restaurant rule is the store's, and persistence must not soften it. */
  it('still replaces the Cart when a restored one meets another restaurant', async () => {
    state().addItem(tacos, birria);
    await settled();
    await relaunch();

    state().addItem(pizza, margherita);
    await settled();
    await relaunch();

    expect(state().restaurant?.id).toBe('rest-2');
    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.menuItemId).toBe('r2-pop-2');
  });

  it('is gone after it is cleared', async () => {
    state().addItem(tacos, birria);
    await settled();

    state().clear();
    await settled();

    expect(await getStoredCart()).toBeNull();

    await relaunch();
    expect(state().lines).toHaveLength(0);
  });

  it('is gone once its last line is removed', async () => {
    state().addItem(tacos, birria);
    await settled();

    state().removeLine('line-1');
    await settled();

    expect(await getStoredCart()).toBeNull();
  });

  /**
   * The store starts empty and hydrates a moment later. Were it writing all
   * along, that empty start would erase the Cart before it was ever read.
   */
  it('does not overwrite the stored Cart before it has been read', async () => {
    await setStoredCart({
      restaurant: tacos,
      lines: [
        {
          id: 'line-1',
          menuItemId: 'r1-pop-1',
          name: 'Birria Tacos',
          image: '',
          unitPriceMinor: 1499,
          quantity: 1,
          instruction: '',
        },
      ],
      nextLineId: 2,
    });

    useCartStore.setState({ restaurant: null, lines: [], nextLineId: 1, isHydrated: false });
    await settled();

    expect(await getStoredCart()).not.toBeNull();

    await state().hydrate();
    expect(state().lines).toHaveLength(1);
  });
});
