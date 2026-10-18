import type { AddableMenuItem, CartRestaurant } from '@/features/cart';

import {
  selectIsEmpty,
  selectIsFromOtherRestaurant,
  selectItemCount,
  selectPlainLineOf,
  selectQuantityOf,
  selectSubtotalMinor,
  selectTotalMinor,
  useCartStore,
} from './cart.store';

const tacos: CartRestaurant = {
  id: 'rest-1',
  name: 'Taco Fiesta',
  currency: 'USD',
  deliveryFeeMinor: 199,
  deliveryEstimate: { minMinutes: 20, maxMinutes: 30 },
};

const pizza: CartRestaurant = {
  id: 'rest-2',
  name: 'Bella Italia',
  currency: 'USD',
  deliveryFeeMinor: 0,
  deliveryEstimate: { minMinutes: 25, maxMinutes: 35 },
};

const item = (id: string, priceMinor: number): AddableMenuItem => ({
  id,
  name: id,
  image: `https://example.test/${id}.jpg`,
  priceMinor,
});

const birria = item('r1-pop-1', 1499);
const horchata = item('r1-pop-3', 425);
const margherita = item('r2-pop-2', 1850);

const state = () => useCartStore.getState();

beforeEach(() => {
  useCartStore.getState().clear();
});

describe('addItem', () => {
  it('starts an empty cart with one line', () => {
    state().addItem(tacos, birria);

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.quantity).toBe(1);
    expect(state().restaurant?.id).toBe('rest-1');
  });

  it('snapshots the price rather than referencing the menu item', () => {
    state().addItem(tacos, birria);
    expect(state().lines[0]?.unitPriceMinor).toBe(1499);
  });

  it('increments the existing line when the same item is added again', () => {
    state().addItem(tacos, birria);
    state().addItem(tacos, birria);

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.quantity).toBe(2);
  });

  it('adds a separate line for a different item', () => {
    state().addItem(tacos, birria);
    state().addItem(tacos, horchata);

    expect(state().lines).toHaveLength(2);
    expect(state().lines.map((line) => line.id)).toEqual(['line-1', 'line-2']);
  });

  it('gives each line its own id rather than reusing the menu item id', () => {
    state().addItem(tacos, birria);

    const [line] = state().lines;
    expect(line?.id).not.toBe(line?.menuItemId);
  });

  describe('the one-restaurant invariant', () => {
    it('replaces the cart when adding from a different restaurant', () => {
      state().addItem(tacos, birria);
      state().addItem(tacos, horchata);
      state().addItem(pizza, margherita);

      expect(state().restaurant?.id).toBe('rest-2');
      expect(state().lines).toHaveLength(1);
      expect(state().lines[0]?.menuItemId).toBe('r2-pop-2');
    });

    it('never merges lines across restaurants', () => {
      state().addItem(tacos, birria);
      state().addItem(pizza, margherita);

      expect(state().lines.every((line) => line.menuItemId.startsWith('r2-'))).toBe(true);
    });
  });
});

describe('quantity changes', () => {
  it('increments a line', () => {
    state().addItem(tacos, birria);
    const lineId = state().lines[0]?.id ?? '';
    state().incrementLine(lineId);

    expect(state().lines[0]?.quantity).toBe(2);
  });

  it('decrements a line', () => {
    state().addItem(tacos, birria);
    state().addItem(tacos, birria);
    state().decrementLine(state().lines[0]?.id ?? '');

    expect(state().lines[0]?.quantity).toBe(1);
  });

  it('removes the line when the last unit is decremented', () => {
    state().addItem(tacos, birria);
    state().addItem(tacos, horchata);
    state().decrementLine(state().lines[0]?.id ?? '');

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.menuItemId).toBe('r1-pop-3');
  });

  it('unbinds the restaurant once the last line goes', () => {
    state().addItem(tacos, birria);
    state().decrementLine(state().lines[0]?.id ?? '');

    expect(state().restaurant).toBeNull();
    expect(selectIsEmpty(state())).toBe(true);
  });

  it('unbinds the restaurant when the last line is removed outright', () => {
    state().addItem(tacos, birria);
    state().removeLine(state().lines[0]?.id ?? '');

    expect(state().restaurant).toBeNull();
  });

  it('ignores an unknown line id', () => {
    state().addItem(tacos, birria);
    state().incrementLine('line-does-not-exist');

    expect(state().lines[0]?.quantity).toBe(1);
  });
});

describe('totals', () => {
  it('counts units, not lines', () => {
    state().addItem(tacos, birria);
    state().addItem(tacos, birria);
    state().addItem(tacos, horchata);

    expect(state().lines).toHaveLength(2);
    expect(selectItemCount(state())).toBe(3);
  });

  it('sums line totals exactly', () => {
    state().addItem(tacos, birria); // 1499
    state().addItem(tacos, birria); // 2998
    state().addItem(tacos, horchata); // + 425

    expect(selectSubtotalMinor(state())).toBe(3423);
  });

  it('adds the delivery fee to the total', () => {
    state().addItem(tacos, horchata);
    expect(selectTotalMinor(state())).toBe(425 + 199);
  });

  it('charges nothing on an empty cart, delivery fee included', () => {
    expect(selectTotalMinor(state())).toBe(0);
  });

  it('handles a free delivery fee', () => {
    state().addItem(pizza, margherita);
    expect(selectTotalMinor(state())).toBe(1850);
  });

  it('stays exact where floats would drift', () => {
    // 10c + 20c. As floats, 0.1 + 0.2 is 0.30000000000000004.
    state().addItem(tacos, item('dime', 10));
    state().addItem(tacos, item('score', 20));

    expect(selectSubtotalMinor(state())).toBe(30);
  });
});

describe('selectIsFromOtherRestaurant', () => {
  it('is false for an empty cart, so the first add is never challenged', () => {
    expect(selectIsFromOtherRestaurant('rest-2')(state())).toBe(false);
  });

  it('is false for the restaurant the cart is already bound to', () => {
    state().addItem(tacos, birria);
    expect(selectIsFromOtherRestaurant('rest-1')(state())).toBe(false);
  });

  it('is true when the cart holds another restaurant’s items', () => {
    state().addItem(tacos, birria);
    expect(selectIsFromOtherRestaurant('rest-2')(state())).toBe(true);
  });
});

describe('selectQuantityOf', () => {
  it('is zero for an item not in the cart', () => {
    expect(selectQuantityOf('r1-pop-1')(state())).toBe(0);
  });

  it('reports the units held for an item', () => {
    state().addItem(tacos, birria);
    state().addItem(tacos, birria);

    expect(selectQuantityOf('r1-pop-1')(state())).toBe(2);
  });
});

describe('instructions and line identity', () => {
  const birria = item('r1-pop-1', 1499);
  const add = (instruction?: string, quantity?: number) =>
    useCartStore.getState().addItem(tacos, birria, { instruction, quantity });

  it('splits lines when instructions differ', () => {
    add();
    add('no onions');

    expect(state().lines).toHaveLength(2);
    expect(selectItemCount(state())).toBe(2);
  });

  it('merges lines when instructions are identical', () => {
    add('no onions');
    add('no onions');

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.quantity).toBe(2);
  });

  it('merges on trimmed whitespace but not on case', () => {
    add('no onions');
    add('  no onions  ');
    add('No Onions');

    expect(state().lines).toHaveLength(2);
    expect(selectQuantityOf('r1-pop-1')(state())).toBe(3);
  });

  it('treats a whitespace-only instruction as the plain line', () => {
    add();
    add('   ');

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.instruction).toBe('');
  });

  it('adds a plain line rather than bumping a noted one', () => {
    add('no onions');
    add();

    expect(state().lines.map((line) => line.instruction)).toEqual(['no onions', '']);
  });

  it('adds the requested quantity in one go', () => {
    add('extra hot', 3);

    expect(selectItemCount(state())).toBe(3);
  });

  it('counts every line for a dish, not just the first', () => {
    add();
    add('no onions', 2);

    expect(selectQuantityOf('r1-pop-1')(state())).toBe(3);
  });

  it('subtotal spans split lines', () => {
    add();
    add('no onions');

    expect(selectSubtotalMinor(state())).toBe(2998);
  });
});

describe('setLineInstruction', () => {
  const birria = item('r1-pop-1', 1499);

  it('edits in place when nothing collides', () => {
    useCartStore.getState().addItem(tacos, birria, { instruction: 'no onions' });
    const [line] = state().lines;

    useCartStore.getState().setLineInstruction(line!.id, 'extra hot');

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.instruction).toBe('extra hot');
  });

  it('folds quantity into the collision and drops the edited line', () => {
    useCartStore.getState().addItem(tacos, birria, { instruction: 'no onions' });
    useCartStore.getState().addItem(tacos, birria, { quantity: 2 });
    const noted = state().lines.find((line) => line.instruction === 'no onions');

    useCartStore.getState().setLineInstruction(noted!.id, '');

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.quantity).toBe(3);
    expect(state().lines[0]?.instruction).toBe('');
  });

  it('trims before deciding whether anything changed', () => {
    useCartStore.getState().addItem(tacos, birria, { instruction: 'no onions' });
    const [line] = state().lines;

    useCartStore.getState().setLineInstruction(line!.id, '  no onions  ');

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.instruction).toBe('no onions');
  });

  it('ignores an unknown line', () => {
    useCartStore.getState().addItem(tacos, birria);

    useCartStore.getState().setLineInstruction('line-999', 'no onions');

    expect(state().lines[0]?.instruction).toBe('');
  });
});

describe('selectPlainLineOf', () => {
  const birria = item('r1-pop-1', 1499);

  it('finds the line with no instruction, ignoring noted ones', () => {
    useCartStore.getState().addItem(tacos, birria, { instruction: 'no onions' });
    useCartStore.getState().addItem(tacos, birria);

    expect(selectPlainLineOf('r1-pop-1')(state())?.instruction).toBe('');
  });

  it('is undefined when the dish is only in the cart with an instruction', () => {
    useCartStore.getState().addItem(tacos, birria, { instruction: 'no onions' });

    expect(selectPlainLineOf('r1-pop-1')(state())).toBeUndefined();
  });
});

describe("options as part of a line's identity", () => {
  const large = {
    groupId: 'size',
    groupName: 'Size',
    choiceId: 'large',
    choiceName: 'Large',
    priceDeltaMinor: 30000,
  };
  const small = { ...large, choiceId: 'small', choiceName: 'Small', priceDeltaMinor: -20000 };
  const cheese = {
    groupId: 'extras',
    groupName: 'Extras',
    choiceId: 'cheese',
    choiceName: 'Extra cheese',
    priceDeltaMinor: 15000,
  };

  it('charges the base price plus the deltas', () => {
    state().addItem(tacos, birria, { chosen: [large, cheese] });

    expect(state().lines[0]?.unitPriceMinor).toBe(birria.priceMinor + 45000);
  });

  it('takes money off for a choice that costs less', () => {
    state().addItem(tacos, birria, { chosen: [small] });

    expect(state().lines[0]?.unitPriceMinor).toBe(birria.priceMinor - 20000);
  });

  it('folds two of the same choices into one line', () => {
    state().addItem(tacos, birria, { chosen: [large] });
    state().addItem(tacos, birria, { chosen: [large] });

    expect(state().lines).toHaveLength(1);
    expect(state().lines[0]?.quantity).toBe(2);
  });

  /** A large and a small are different things at different prices. */
  it('keeps differently chosen dishes as separate lines', () => {
    state().addItem(tacos, birria, { chosen: [large] });
    state().addItem(tacos, birria, { chosen: [small] });

    expect(state().lines).toHaveLength(2);
  });

  /** Tapping the same things in a different order is the same order. */
  it('folds regardless of the order the choices were made in', () => {
    state().addItem(tacos, birria, { chosen: [large, cheese] });
    state().addItem(tacos, birria, { chosen: [cheese, large] });

    expect(state().lines).toHaveLength(1);
  });

  it('keeps a chosen dish apart from the plain one', () => {
    state().addItem(tacos, birria);
    state().addItem(tacos, birria, { chosen: [large] });

    expect(state().lines).toHaveLength(2);
  });

  /** The menu row's stepper can only mean the line with nothing chosen. */
  it('leaves the plain-line selector pointing at the plain line', () => {
    state().addItem(tacos, birria, { chosen: [large] });
    state().addItem(tacos, birria);

    const plain = selectPlainLineOf(birria.id)(state());

    expect(plain?.options).toEqual([]);
    expect(plain?.unitPriceMinor).toBe(birria.priceMinor);
  });

  it('counts every line of the dish, however it was chosen', () => {
    state().addItem(tacos, birria, { chosen: [large] });
    state().addItem(tacos, birria, { chosen: [small] });

    expect(selectQuantityOf(birria.id)(state())).toBe(2);
  });
});
