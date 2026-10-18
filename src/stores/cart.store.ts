import { create } from 'zustand';

import type { AddableMenuItem, CartLine, CartRestaurant } from '@/features/cart';
// Deep import: the cart barrel pulls components that import this store back.
import { sameLine } from '@/features/cart/types/cart.types';
import { clearStoredCart, getStoredCart, setStoredCart } from '@/services/storage';

type CartState = {
  /** Null when the Cart is empty. A Cart is always bound to one restaurant. */
  restaurant: CartRestaurant | null;
  lines: CartLine[];
  /** Monotonic, so line ids are unique without randomness. */
  nextLineId: number;

  /**
   * False until the Cart stored on the device has been read. Nothing is
   * written back before it flips, or the empty Cart the store starts with
   * would overwrite the real one on the way past.
   */
  isHydrated: boolean;
  hydrate: () => Promise<void>;

  addItem: (
    restaurant: CartRestaurant,
    item: AddableMenuItem,
    options?: { instruction?: string | undefined; quantity?: number | undefined },
  ) => void;
  incrementLine: (lineId: string) => void;
  decrementLine: (lineId: string) => void;
  removeLine: (lineId: string) => void;
  setLineInstruction: (lineId: string, instruction: string) => void;
  clear: () => void;
};

type CartContents = Pick<CartState, 'restaurant' | 'lines' | 'nextLineId'>;

/** A function so no two callers share one `lines` array. */
const emptyCart = (): CartContents => ({ restaurant: null, lines: [], nextLineId: 1 });

export const useCartStore = create<CartState>((set) => ({
  ...emptyCart(),
  isHydrated: false,

  /**
   * The cheap Android hardware this pilot targets kills a backgrounded app
   * readily, so a Cart that lived only in memory was lost by switching to a
   * message and back. Restored prices are the ones the customer was shown,
   * which is what lets the `price-changed` check at checkout still fire.
   */
  hydrate: async () => {
    const stored = await getStoredCart();
    set(stored ? { ...stored, isHydrated: true } : { isHydrated: true });
  },

  /** Enforces one restaurant per cart. Warn first with selectIsFromOtherRestaurant. */
  addItem: (restaurant, item, options) =>
    set((state) => {
      const instruction = (options?.instruction ?? '').trim();
      const quantity = options?.quantity ?? 1;

      const isSameRestaurant = state.restaurant?.id === restaurant.id;
      const lines = isSameRestaurant ? state.lines : [];

      const existing = lines.find((line) => sameLine(line, item.id, instruction));
      if (existing) {
        return {
          restaurant,
          lines: lines.map((line) =>
            line.id === existing.id ? { ...line, quantity: line.quantity + quantity } : line,
          ),
        };
      }

      const line: CartLine = {
        id: `line-${state.nextLineId}`,
        menuItemId: item.id,
        name: item.name,
        image: item.image,
        unitPriceMinor: item.priceMinor,
        quantity,
        instruction,
      };

      return { restaurant, lines: [...lines, line], nextLineId: state.nextLineId + 1 };
    }),

  incrementLine: (lineId) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.id === lineId ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    })),

  decrementLine: (lineId) =>
    set((state) => {
      const lines = state.lines
        .map((line) => (line.id === lineId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0);

      return lines.length === 0 ? emptyCart() : { lines };
    }),

  removeLine: (lineId) =>
    set((state) => {
      const lines = state.lines.filter((line) => line.id !== lineId);
      return lines.length === 0 ? emptyCart() : { lines };
    }),

  /**
   * Re-applies the identity rule: an edit that collides with another line for
   * the same dish folds into it. A plain setter would leave two lines that are
   * the same thing, which is what identity exists to prevent.
   */
  setLineInstruction: (lineId, instruction) =>
    set((state) => {
      const edited = state.lines.find((line) => line.id === lineId);
      if (!edited) return {};

      const next = instruction.trim();
      if (next === edited.instruction) return {};

      const collision = state.lines.find(
        (line) => line.id !== lineId && sameLine(line, edited.menuItemId, next),
      );

      if (!collision) {
        return {
          lines: state.lines.map((line) =>
            line.id === lineId ? { ...line, instruction: next } : line,
          ),
        };
      }

      return {
        lines: state.lines
          .filter((line) => line.id !== lineId)
          .map((line) =>
            line.id === collision.id
              ? { ...line, quantity: line.quantity + edited.quantity }
              : line,
          ),
      };
    }),

  clear: () => set(emptyCart()),
}));

/**
 * One subscription rather than a write inside every action: a new action
 * cannot forget to persist, and the store stays about Carts rather than about
 * storage. Writes are skipped until hydration has run, and skipped again when
 * the contents have not actually changed — `set` fires for `isHydrated` too.
 */
let lastWritten: string | null = null;

useCartStore.subscribe((state) => {
  if (!state.isHydrated) return;

  const contents: CartContents = {
    restaurant: state.restaurant,
    lines: state.lines,
    nextLineId: state.nextLineId,
  };

  const serialised = JSON.stringify(contents);
  if (serialised === lastWritten) return;
  lastWritten = serialised;

  // An empty Cart is removed rather than stored as empty, so a fresh install
  // and a cleared Cart read back the same way.
  void (state.lines.length === 0 ? clearStoredCart() : setStoredCart(contents));
});

/** Total units, not lines. */
export const selectItemCount = (state: CartState): number =>
  state.lines.reduce((count, line) => count + line.quantity, 0);

export const selectSubtotalMinor = (state: CartState): number =>
  state.lines.reduce((total, line) => total + line.unitPriceMinor * line.quantity, 0);

export const selectTotalMinor = (state: CartState): number => {
  if (state.lines.length === 0) return 0;
  return selectSubtotalMinor(state) + (state.restaurant?.deliveryFeeMinor ?? 0);
};

export const selectIsEmpty = (state: CartState): boolean => state.lines.length === 0;

/** True when adding from `restaurantId` would discard the current Cart. */
export const selectIsFromOtherRestaurant =
  (restaurantId: string) =>
  (state: CartState): boolean =>
    state.lines.length > 0 && state.restaurant !== null && state.restaurant.id !== restaurantId;

/** Every line for the dish — one per instruction — not just the first. */
export const selectQuantityOf =
  (menuItemId: string) =>
  (state: CartState): number =>
    state.lines
      .filter((line) => line.menuItemId === menuItemId)
      .reduce((count, line) => count + line.quantity, 0);

/**
 * The line with no instruction. The menu row is a plain-line-only control —
 * it cannot say which noted line its stepper would mean.
 */
export const selectPlainLineOf =
  (menuItemId: string) =>
  (state: CartState): CartLine | undefined =>
    state.lines.find((line) => sameLine(line, menuItemId, ''));
