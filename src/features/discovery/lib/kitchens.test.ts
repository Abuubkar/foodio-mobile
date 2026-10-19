import type { MenuCategory, MenuItem } from '@/features/menu/types/menu.types';

import type { Clip } from '../types/clip.types';

import {
  dishesInClip,
  filmedCount,
  kitchensFrom,
  primaryAction,
  requiredGroupName,
  taggedDish,
} from './kitchens';

const clip = (overrides: Partial<Clip> & Pick<Clip, 'id' | 'restaurantId'>): Clip => ({
  restaurantName: 'Taco Fiesta',
  mediaUrl: 'https://example.test/a.mp4',
  thumbnailUrl: 'https://example.test/a.jpg',
  caption: 'A clip',
  durationSeconds: 12,
  postedAt: '2026-01-01T00:00:00.000Z',
  author: { kind: 'restaurant' },
  ...overrides,
});

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
        author: { kind: 'customer', orderId: 'o1', personId: 'p1' },
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
