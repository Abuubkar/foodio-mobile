import type { MenuCategory, MenuItem } from '@/features/menu/types/menu.types';

import type { Clip } from '../types/clip.types';

import {
  dishesFrom,
  dishesInClip,
  filmedCount,
  interleave,
  kitchensFrom,
  looseClips,
  primaryAction,
  requiredGroupName,
  taggedDish,
  untaggedClips,
} from './kitchens';

const clip = (overrides: Partial<Clip> & Pick<Clip, 'id'>): Clip => ({
  restaurantId: 'rest-1',
  restaurantName: 'Taco Fiesta',
  mediaUrl: 'https://example.test/a.mp4',
  mediaKind: 'mp4',
  thumbnailUrl: 'https://example.test/a.jpg',
  caption: 'A clip',
  durationSeconds: 12,
  postedAt: '2026-01-01T00:00:00.000Z',
  author: { kind: 'restaurant' },
  ...overrides,
});

/** A customer author, with the identity a cell header now needs. */
const customer = (overrides: Record<string, unknown> = {}) =>
  ({
    kind: 'customer',
    orderId: 'o1',
    personId: 'p1',
    displayName: 'Sana',
    avatarUrl: '',
    handle: 'sana',
    ...overrides,
  }) as Clip['author'];

const dish = (overrides: Partial<MenuItem> & Pick<MenuItem, 'id' | 'name'>): MenuItem => ({
  restaurantId: 'rest-1',
  menuCategoryId: 'cat-1',
  description: '',
  priceMinor: 1000,
  image: 'https://example.test/d.jpg',
  ...overrides,
});

const menuOf = (...items: MenuItem[]): MenuCategory[] => [
  { id: 'cat-1', restaurantId: 'rest-1', name: 'Popular', position: 0, menuItems: items },
];

describe('kitchensFrom', () => {
  it('groups clips by restaurant, keeping first-appearance order', () => {
    const kitchens = kitchensFrom([
      clip({ id: 'c1', restaurantId: 'rest-2', restaurantName: 'Bella' }),
      clip({ id: 'c2', restaurantId: 'rest-1' }),
      clip({ id: 'c3', restaurantId: 'rest-2', restaurantName: 'Bella' }),
    ]);

    expect(kitchens.map((k) => k.restaurantId)).toEqual(['rest-2', 'rest-1']);
    expect(kitchens[0]?.clips.map((c) => c.id)).toEqual(['c1', 'c3']);
    expect(kitchens[0]?.name).toBe('Bella');
  });

  it("leads with the restaurant's own footage, whatever order the feed had", () => {
    const kitchens = kitchensFrom([
      clip({
        id: 'ours',
        restaurantId: 'rest-1',
        author: customer(),
      }),
      clip({ id: 'theirs', restaurantId: 'rest-1' }),
    ]);

    expect(kitchens[0]?.clips.map((c) => c.id)).toEqual(['theirs', 'ours']);
  });

  it('returns nothing for an empty feed', () => {
    expect(kitchensFrom([])).toEqual([]);
  });
});

describe('dishesInClip', () => {
  const tagged = dish({ id: 'd1', name: 'Birria Tacos' });
  const popular = dish({ id: 'd2', name: 'Loaded Nachos', isPopular: true });
  const plain = dish({ id: 'd3', name: 'Horchata' });
  const menu = menuOf(tagged, plain, popular);

  it('puts the tagged dish first, then popular, then the rest', () => {
    const found = dishesInClip(menu, clip({ id: 'c1', restaurantId: 'rest-1', menuItemId: 'd1' }));
    expect(found.map((d) => d.id)).toEqual(['d1', 'd2', 'd3']);
  });

  it('fills from the menu when the clip is tagged to nothing', () => {
    const found = dishesInClip(menu, clip({ id: 'c1', restaurantId: 'rest-1' }));
    expect(found.map((d) => d.id)).toEqual(['d2', 'd1', 'd3']);
  });

  it('never offers a dish that is sold out', () => {
    const soldOut = dish({ id: 'd4', name: 'Gone', isPopular: true, isAvailable: false });
    const found = dishesInClip(
      menuOf(tagged, soldOut, plain),
      clip({ id: 'c', restaurantId: 'r' }),
    );
    expect(found.map((d) => d.id)).not.toContain('d4');
  });

  it('honours the limit, and returns nothing for a limit of zero', () => {
    expect(dishesInClip(menu, clip({ id: 'c', restaurantId: 'r' }), 2)).toHaveLength(2);
    expect(dishesInClip(menu, clip({ id: 'c', restaurantId: 'r' }), 0)).toEqual([]);
  });
});

describe('taggedDish', () => {
  const menu = menuOf(dish({ id: 'd1', name: 'Birria Tacos' }));

  it('finds the dish a clip is about', () => {
    const found = taggedDish(menu, clip({ id: 'c', restaurantId: 'r', menuItemId: 'd1' }));
    expect(found?.name).toBe('Birria Tacos');
  });

  it('is undefined for an untagged clip, and for a tag the menu has lost', () => {
    expect(taggedDish(menu, clip({ id: 'c', restaurantId: 'r' }))).toBeUndefined();
    expect(
      taggedDish(menu, clip({ id: 'c', restaurantId: 'r', menuItemId: 'gone' })),
    ).toBeUndefined();
  });
});

describe('filmedCount', () => {
  it('counts dishes with a clip, not clips', () => {
    const menu = menuOf(dish({ id: 'd1', name: 'A' }), dish({ id: 'd2', name: 'B' }));
    const clips = [
      clip({ id: 'c1', restaurantId: 'r', menuItemId: 'd1' }),
      // Ours and theirs of the same dish is one dish filmed, not two.
      clip({ id: 'c2', restaurantId: 'r', menuItemId: 'd1' }),
      clip({ id: 'c3', restaurantId: 'r' }),
    ];
    expect(filmedCount(menu, clips)).toBe(1);
  });
});

describe('primaryAction', () => {
  it('adds a dish that asks nothing', () => {
    expect(primaryAction(dish({ id: 'd', name: 'Plain' }))).toBe('add');
  });

  it('still adds when every group is optional', () => {
    const extrasOnly = dish({
      id: 'd',
      name: 'Margherita',
      optionGroups: [{ id: 'g', name: 'Extras', minChoices: 0, maxChoices: 2, choices: [] }],
    });
    expect(primaryAction(extrasOnly)).toBe('add');
  });

  it('chooses only when a group requires an answer', () => {
    const sized = dish({
      id: 'd',
      name: 'Birria',
      optionGroups: [
        { id: 'g1', name: 'Size', minChoices: 1, maxChoices: 1, choices: [] },
        { id: 'g2', name: 'Extras', minChoices: 0, maxChoices: 3, choices: [] },
      ],
    });
    expect(primaryAction(sized)).toBe('choose');
    expect(requiredGroupName(sized)).toBe('Size');
  });

  it('sends an untagged clip to the menu rather than a button that cannot work', () => {
    expect(primaryAction(undefined)).toBe('menu');
    expect(requiredGroupName(undefined)).toBeUndefined();
  });
});

describe('looseClips', () => {
  it('keeps the clips that belong to no kitchen, in feed order', () => {
    const loose = looseClips([
      clip({ id: 'about-a-kitchen' }),
      clip({ id: 'loose-1', restaurantId: undefined, author: customer({ orderId: undefined }) }),
      clip({ id: 'loose-2', restaurantId: undefined, author: customer({ orderId: undefined }) }),
    ]);

    expect(loose.map((c) => c.id)).toEqual(['loose-1', 'loose-2']);
  });

  it('is empty when every clip is about a kitchen', () => {
    expect(looseClips([clip({ id: 'c1' })])).toEqual([]);
  });
});

describe('kitchensFrom with loose clips in the feed', () => {
  it('does not try to group a clip that names no restaurant', () => {
    const kitchens = kitchensFrom([
      clip({ id: 'loose', restaurantId: undefined, author: customer({ orderId: undefined }) }),
      clip({ id: 'grouped', restaurantId: 'rest-1' }),
    ]);

    expect(kitchens.map((k) => k.restaurantId)).toEqual(['rest-1']);
    expect(kitchens[0]?.clips.map((c) => c.id)).toEqual(['grouped']);
  });
});

describe('interleave', () => {
  const deal = (kitchens: number, loose: number, perLoose?: number) =>
    interleave(
      Array.from({ length: kitchens }, (_, i) => `k${i}`),
      Array.from({ length: loose }, (_, i) => `l${i}`),
      perLoose,
    ).map((entry) => entry.value);

  it('deals one loose clip after every two kitchens', () => {
    expect(deal(4, 2, 2)).toEqual(['k0', 'k1', 'l0', 'k2', 'k3', 'l1']);
  });

  it('keeps both orders, and only decides where they meet', () => {
    expect(deal(6, 3, 2)).toEqual(['k0', 'k1', 'l0', 'k2', 'k3', 'l1', 'k4', 'k5', 'l2']);
  });

  it('puts what is left over on the end rather than dropping it', () => {
    // Two kitchens and four community clips still shows all four.
    expect(deal(2, 4, 2)).toEqual(['k0', 'k1', 'l0', 'l1', 'l2', 'l3']);
  });

  it('is just the kitchens when nothing is loose', () => {
    expect(deal(3, 0, 2)).toEqual(['k0', 'k1', 'k2']);
  });

  it('is just the loose clips when there are no kitchens', () => {
    expect(deal(0, 2, 2)).toEqual(['l0', 'l1']);
  });

  it('alternates when every kitchen is due one', () => {
    expect(deal(3, 3, 1)).toEqual(['k0', 'l0', 'k1', 'l1', 'k2', 'l2']);
  });

  it('labels which stream each entry came from', () => {
    expect(interleave(['k0', 'k1'], ['l0'], 2).map((entry) => entry.kind)).toEqual([
      'kitchen',
      'kitchen',
      'loose',
    ]);
  });
});

describe('dishesFrom', () => {
  it('groups clips by the dish they are tagged to, keeping first-appearance order', () => {
    const dishes = dishesFrom([
      clip({ id: 'c1', menuItemId: 'birria' }),
      clip({ id: 'c2', menuItemId: 'horchata' }),
      clip({ id: 'c3', menuItemId: 'birria' }),
    ]);

    expect(dishes.map((d) => d.menuItemId)).toEqual(['birria', 'horchata']);
    expect(dishes[0]?.clips.map((c) => c.id)).toEqual(['c1', 'c3']);
  });

  it('puts ours and theirs in one group, the kitchen leading', () => {
    const dishes = dishesFrom([
      clip({ id: 'theirs', menuItemId: 'birria', author: customer() }),
      clip({ id: 'ours', menuItemId: 'birria' }),
    ]);

    expect(dishes).toHaveLength(1);
    expect(dishes[0]?.clips.map((c) => c.id)).toEqual(['ours', 'theirs']);
  });

  it('carries the kitchen a dish belongs to, so a group can name it unasked', () => {
    const dishes = dishesFrom([
      clip({ id: 'c1', menuItemId: 'pide', restaurantId: 'rest-2', restaurantName: 'Bella' }),
    ]);

    expect(dishes[0]?.restaurantId).toBe('rest-2');
    expect(dishes[0]?.restaurantName).toBe('Bella');
  });

  it('skips a clip tagged to no dish', () => {
    const dishes = dishesFrom([
      clip({ id: 'table', menuItemId: undefined }),
      clip({ id: 'tagged', menuItemId: 'birria' }),
    ]);

    expect(dishes.map((d) => d.menuItemId)).toEqual(['birria']);
    expect(dishes[0]?.clips.map((c) => c.id)).toEqual(['tagged']);
  });

  it('skips a dish-tagged clip that names no restaurant, having no menu to price it', () => {
    const dishes = dishesFrom([
      clip({
        id: 'loose',
        menuItemId: 'birria',
        restaurantId: undefined,
        restaurantName: undefined,
        author: customer({ orderId: undefined }),
      }),
    ]);

    expect(dishes).toEqual([]);
  });

  it('returns nothing for an empty shelf', () => {
    expect(dishesFrom([])).toEqual([]);
  });
});

describe('untaggedClips', () => {
  it('is the exact complement of dishesFrom, so a dish view can count what it hides', () => {
    const clips = [
      clip({ id: 'tagged', menuItemId: 'birria' }),
      clip({ id: 'table', menuItemId: undefined }),
      clip({ id: 'community', restaurantId: undefined, author: customer({ orderId: undefined }) }),
    ];

    const grouped = dishesFrom(clips).flatMap((dish) => dish.clips.map((c) => c.id));
    const untagged = untaggedClips(clips).map((c) => c.id);

    expect(untagged).toEqual(['table', 'community']);
    expect([...grouped, ...untagged].sort()).toEqual(['community', 'table', 'tagged']);
  });

  it('is empty when every save names a dish', () => {
    expect(untaggedClips([clip({ id: 'c1', menuItemId: 'birria' })])).toEqual([]);
  });
});
