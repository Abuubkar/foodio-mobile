import { needsChoosing } from '@/features/menu/lib/chooseOptions';
import type { MenuItem, RestaurantMenu } from '@/features/menu/types/menu.types';

import type { Clip } from '../types/clip.types';

/**
 * One restaurant and the clips it has, in the order the feed met them.
 *
 * The Clips tab scrolls through kitchens, not clips: down is the next kitchen
 * and the chapter bar is this one's clips. Grouping is by restaurant rather
 * than by dish because a kitchen with two clips of the same dish — ours and
 * theirs — is the common case in the catalogue, and those two are worth
 * seeing back to back.
 */
export type Kitchen = {
  readonly restaurantId: string;
  readonly name: string;
  readonly clips: readonly Clip[];
};

/**
 * Group a flat feed into kitchens, keeping first-appearance order.
 *
 * The restaurant's own footage leads: a customer's clip is a different
 * argument and should not be the first thing a kitchen says. Within each
 * author the feed's own order survives, so the newest marketing clip is the
 * one a kitchen opens with.
 */
export function kitchensFrom(clips: readonly Clip[]): Kitchen[] {
  const order: string[] = [];
  const byRestaurant = new Map<string, Clip[]>();

  for (const clip of clips) {
    // A Clip about no Restaurant is not a kitchen and cannot be grouped into
    // one. `looseClips` is where those go. See backend ADR-0023.
    const restaurantId = clip.restaurantId;
    if (restaurantId === undefined) continue;

    const existing = byRestaurant.get(restaurantId);
    if (existing) {
      existing.push(clip);
      continue;
    }
    order.push(restaurantId);
    byRestaurant.set(restaurantId, [clip]);
  }

  return order.map((restaurantId) => {
    const mine = byRestaurant.get(restaurantId) ?? [];
    return {
      restaurantId,
      name: mine[0]?.restaurantName ?? '',
      clips: [
        ...mine.filter((clip) => clip.author.kind === 'restaurant'),
        ...mine.filter((clip) => clip.author.kind === 'customer'),
      ],
    };
  });
}

/**
 * One dish and the clips tagged to it, in the order the feed met them.
 *
 * A level below `Kitchen`: the kitchen is the place that cooks it, this is the
 * thing itself. Keyed by the Menu Item, so the restaurant's own clip of a dish
 * and a customer's receipt clip of the same dish land in one group — the pair
 * worth seeing side by side, which no other view puts together.
 *
 * The name and the price are not here. Only the Menu Item id travels on a
 * Clip, so whoever draws a group reads the rest from that kitchen's menu.
 */
export type SavedDish = {
  readonly menuItemId: string;
  readonly restaurantId: string;
  /** Denormalised on the Clip, so a group can name the kitchen unasked. */
  readonly restaurantName: string;
  readonly clips: readonly Clip[];
};

/**
 * Group clips by the dish they are tagged to, keeping first-appearance order.
 *
 * Grouped by Menu Item id alone and not by restaurant too: a Menu Item belongs
 * to exactly one Restaurant, so the pair cannot disagree and the id is already
 * the narrower key.
 *
 * Within a dish the restaurant's own footage leads, as in `kitchensFrom` — the
 * kitchen's claim first, then the receipt that answers it.
 */
export function dishesFrom(clips: readonly Clip[]): SavedDish[] {
  const order: string[] = [];
  const byDish = new Map<string, Clip[]>();

  for (const clip of clips) {
    // Both or neither: a dish group needs a menu to price it, and a menu is
    // only reachable through a Restaurant. `untaggedClips` is where the rest go.
    const { menuItemId, restaurantId } = clip;
    if (menuItemId === undefined || restaurantId === undefined) continue;

    const existing = byDish.get(menuItemId);
    if (existing) {
      existing.push(clip);
      continue;
    }
    order.push(menuItemId);
    byDish.set(menuItemId, [clip]);
  }

  return order.map((menuItemId) => {
    const mine = byDish.get(menuItemId) ?? [];
    const first = mine[0];

    return {
      menuItemId,
      restaurantId: first?.restaurantId ?? '',
      restaurantName: first?.restaurantName ?? '',
      clips: [
        ...mine.filter((clip) => clip.author.kind === 'restaurant'),
        ...mine.filter((clip) => clip.author.kind === 'customer'),
      ],
    };
  });
}

/**
 * The Clips that name no dish, in the order they arrived.
 *
 * The exact complement of `dishesFrom`, so a dish view can say how many saves
 * it is not showing instead of quietly dropping them. Most community clips
 * land here, and so does a kitchen's clip of a full table.
 */
export function untaggedClips(clips: readonly Clip[]): Clip[] {
  return clips.filter((clip) => clip.menuItemId === undefined || clip.restaurantId === undefined);
}

/**
 * The Clips that belong to no kitchen, in the order they arrived.
 *
 * The feed stops being "kitchens" and becomes kitchens *and loose clips*.
 * Kept as its own function rather than a fourth field on `Kitchen`, because a
 * community Clip has none of what a Kitchen carries — no menu, no dishes, no
 * Add or Choose.
 */
export function looseClips(clips: readonly Clip[]): Clip[] {
  return clips.filter((clip) => clip.restaurantId === undefined);
}

/**
 * How often a loose clip is dealt into the run of kitchens.
 *
 * Revenue is restaurant subscriptions, and a community cell has no path to an
 * order — no menu, no Add, no drawer. Purely chronological would let community
 * content compete for the same scroll as the cells that convert, while a
 * subscribing restaurant pays for the feed. One in three is a starting point
 * and the number is here, in one place, so changing it is a one-line decision
 * rather than an archaeology exercise. See backend ADR-0023.
 */
export const KITCHENS_PER_LOOSE_CLIP = 2;

/**
 * Deals loose clips into the run of kitchens at a fixed ratio.
 *
 * Both orders are preserved — this only decides where the two streams meet.
 * Whatever is left over goes on the end rather than being dropped, so a feed
 * with two kitchens and nine community clips still shows all nine.
 */
export function interleave<K, L>(
  kitchens: readonly K[],
  loose: readonly L[],
  perLoose = KITCHENS_PER_LOOSE_CLIP,
): ({ kind: 'kitchen'; value: K } | { kind: 'loose'; value: L })[] {
  const mixed: ({ kind: 'kitchen'; value: K } | { kind: 'loose'; value: L })[] = [];
  let next = 0;

  kitchens.forEach((kitchen, index) => {
    mixed.push({ kind: 'kitchen', value: kitchen });

    const due = (index + 1) % perLoose === 0;
    const remaining = next < loose.length;
    if (due && remaining) {
      const value = loose[next];
      if (value !== undefined) mixed.push({ kind: 'loose', value });
      next += 1;
    }
  });

  for (const value of loose.slice(next)) mixed.push({ kind: 'loose', value });

  return mixed;
}

const allItems = (menu: RestaurantMenu): MenuItem[] =>
  menu.flatMap((category) => category.menuItems);

/**
 * What a clip is showing, best effort.
 *
 * A clip of a table is several dishes and nothing in the catalogue says which,
 * so only the tagged dish is certain. The rest are filled from the same
 * kitchen — popular first — and never from another restaurant, which would be
 * a lie about what is in frame rather than a guess.
 *
 * Returns the tagged dish first when there is one, so callers can treat index
 * 0 as "the dish this clip is about" and the tail as "also here".
 */
export function dishesInClip(menu: RestaurantMenu, clip: Clip, limit = 3): MenuItem[] {
  if (limit <= 0) return [];

  const items = allItems(menu);
  const tagged = clip.menuItemId ? items.find((item) => item.id === clip.menuItemId) : undefined;

  const rest = items.filter((item) => item.id !== tagged?.id && item.isAvailable !== false);

  return [tagged, ...rest.filter((i) => i.isPopular), ...rest.filter((i) => !i.isPopular)]
    .filter((item): item is MenuItem => item !== undefined)
    .slice(0, limit);
}

/** One dish by id, wherever it sits in the kitchen's categories. */
export function dishInMenu(menu: RestaurantMenu, menuItemId: string): MenuItem | undefined {
  return allItems(menu).find((item) => item.id === menuItemId);
}

/** The dish a clip is about, or nothing when it was never tagged to one. */
export function taggedDish(menu: RestaurantMenu, clip: Clip): MenuItem | undefined {
  if (!clip.menuItemId) return undefined;
  return dishInMenu(menu, clip.menuItemId);
}

/** How many of a kitchen's dishes have a clip. The honest ratio is low. */
export function filmedCount(menu: RestaurantMenu, clips: readonly Clip[]): number {
  const filmed = new Set(clips.map((clip) => clip.menuItemId).filter(Boolean));
  return allItems(menu).filter((item) => filmed.has(item.id)).length;
}

export type PrimaryAction = 'add' | 'choose' | 'menu';

/**
 * What the primary button does.
 *
 * `choose` only where a group *requires* an answer — optional extras still add
 * in one tap, and sending someone to a screen with nothing they must answer is
 * a wasted trip. A clip tagged to no dish has nothing to add at all, so it
 * offers the menu rather than a button that cannot work.
 */
export function primaryAction(dish: MenuItem | undefined): PrimaryAction {
  if (!dish) return 'menu';
  return needsChoosing(dish.optionGroups) ? 'choose' : 'add';
}

/** The first group that has to be answered, named for the dish line. */
export function requiredGroupName(dish: MenuItem | undefined): string | undefined {
  return (dish?.optionGroups ?? []).find((group) => group.minChoices > 0)?.name;
}
