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

/** The dish a clip is about, or nothing when it was never tagged to one. */
export function taggedDish(menu: RestaurantMenu, clip: Clip): MenuItem | undefined {
  if (!clip.menuItemId) return undefined;
  return allItems(menu).find((item) => item.id === clip.menuItemId);
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
