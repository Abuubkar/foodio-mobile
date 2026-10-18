/** A Cart belongs to exactly one — see docs/adr/0003. */
export type CartRestaurant = {
  id: string;
  name: string;
  /** ISO 4217. Every amount in this Cart is denominated in it. */
  currency: string;
  deliveryFeeMinor: number;
  /**
   * What the Restaurant said when the dish was added. A snapshot like the
   * price: the Cart shows what the customer was told, and the Cart is the
   * screen where they decide (#203).
   */
  deliveryEstimate: { minMinutes: number; maxMinutes: number };
};

/** Enough of a menu item to render a cart line without refetching. */
export type AddableMenuItem = {
  id: string;
  name: string;
  image: string;
  priceMinor: number;
};

/**
 * A choice as it was made, frozen.
 *
 * Declared here rather than imported from the menu feature, for the same
 * reason `AddableMenuItem` is: the Cart holds what the customer was shown, not
 * a live view of the catalogue. The names and the delta are copies.
 */
export type ChosenOption = {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  priceDeltaMinor: number;
};

export type CartLine = {
  /** The line's own id — one dish can hold several lines, one per instruction. */
  id: string;
  menuItemId: string;
  name: string;
  image: string;
  /** Snapshot at add time — the Cart must not reprice under the customer. */
  unitPriceMinor: number;
  quantity: number;
  /**
   * What the customer asked for. Empty is a value, not an absence: the plain
   * line is simply the one with no instruction.
   */
  instruction: string;
  /**
   * What the customer chose. Empty for a dish that asks nothing.
   *
   * Distinct from `instruction`: the Kitchen reads "no onions" and cooks
   * differently, but "Large" is what was paid for.
   */
  options: ChosenOption[];
};

/** The deltas, summed. Signed, so this can be negative. */
export const optionsTotalMinor = (options: readonly ChosenOption[]): number =>
  options.reduce((total, option) => total + option.priceDeltaMinor, 0);

/**
 * What the dish cost before any option touched it.
 *
 * Derived rather than stored, so it cannot drift from the price that was
 * actually shown. It is what the reprice check at checkout compares against
 * the Menu Item's current price.
 */
export const basePriceMinor = (line: CartLine): number =>
  line.unitPriceMinor - optionsTotalMinor(line.options);

/** Order-independent, because two carts that chose the same things are the same. */
const choiceKey = (options: readonly ChosenOption[]): string =>
  options
    .map((option) => option.choiceId)
    .sort()
    .join('|');

/**
 * Identity is dish, instruction *and* the choices made. Trimmed, because
 * trailing whitespace is invisible and merging on it never surprises anyone —
 * but never case-folded, since capitalisation is a deliberate keystroke.
 *
 * Two large pizzas fold into one line; a large and a small do not, because
 * they are different things at different prices.
 */
export const sameLine = (
  line: CartLine,
  menuItemId: string,
  instruction: string,
  options: readonly ChosenOption[] = [],
): boolean =>
  line.menuItemId === menuItemId &&
  line.instruction === instruction.trim() &&
  choiceKey(line.options) === choiceKey(options);
