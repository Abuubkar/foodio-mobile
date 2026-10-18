import type { MenuOptionGroup } from '../types/menu.types';

import {
  chosenOptionsFrom,
  firstUnanswered,
  needsChoosing,
  toggleChoice,
  unitPriceWith,
} from './chooseOptions';

const size: MenuOptionGroup = {
  id: 'size',
  name: 'Size',
  minChoices: 1,
  maxChoices: 1,
  choices: [
    { id: 'small', name: 'Small', priceDeltaMinor: -20000 },
    { id: 'large', name: 'Large', priceDeltaMinor: 30000 },
  ],
};

const extras: MenuOptionGroup = {
  id: 'extras',
  name: 'Extras',
  minChoices: 0,
  maxChoices: 2,
  choices: [
    { id: 'cheese', name: 'Extra cheese', priceDeltaMinor: 15000 },
    { id: 'olives', name: 'Olives', priceDeltaMinor: 10000 },
    { id: 'truffle', name: 'Truffle', priceDeltaMinor: 50000, isAvailable: false },
  ],
};

const GROUPS = [size, extras];

describe('toggleChoice', () => {
  it('ticks a choice that was not ticked', () => {
    expect(toggleChoice({}, size, 'large')).toEqual({ size: ['large'] });
  });

  it('unticks one that was', () => {
    expect(toggleChoice({ size: ['large'] }, size, 'large')).toEqual({ size: [] });
  });

  /** Making somebody untick Small before ticking Large is a pointless tap. */
  it('swaps rather than refusing in a group that takes one answer', () => {
    expect(toggleChoice({ size: ['small'] }, size, 'large')).toEqual({ size: ['large'] });
  });

  it('collects several in a group that takes several', () => {
    const after = toggleChoice({ extras: ['cheese'] }, extras, 'olives');

    expect(after['extras']).toEqual(['cheese', 'olives']);
  });

  it('ignores a tap once the group is full', () => {
    const full = { extras: ['cheese', 'olives'] };

    expect(toggleChoice(full, extras, 'truffle')).toEqual(full);
  });

  /** Full still means you can change your mind about what is already in it. */
  it('still lets a full group be unticked', () => {
    const after = toggleChoice({ extras: ['cheese', 'olives'] }, extras, 'cheese');

    expect(after['extras']).toEqual(['olives']);
  });

  it('leaves other groups alone', () => {
    const after = toggleChoice({ size: ['large'] }, extras, 'cheese');

    expect(after['size']).toEqual(['large']);
  });
});

describe('firstUnanswered', () => {
  it('names the required group nobody has answered', () => {
    expect(firstUnanswered(GROUPS, {})?.id).toBe('size');
  });

  it('is satisfied once the required group has its answer', () => {
    expect(firstUnanswered(GROUPS, { size: ['large'] })).toBeNull();
  });

  it('never asks for an optional group', () => {
    expect(firstUnanswered([extras], {})).toBeNull();
  });

  it('is satisfied by a dish that asks nothing', () => {
    expect(firstUnanswered([], {})).toBeNull();
  });
});

describe('chosenOptionsFrom', () => {
  it('copies the names and the delta off the menu', () => {
    expect(chosenOptionsFrom(GROUPS, { size: ['large'] })).toEqual([
      {
        groupId: 'size',
        groupName: 'Size',
        choiceId: 'large',
        choiceName: 'Large',
        priceDeltaMinor: 30000,
      },
    ]);
  });

  /** Two identical carts must produce identical lines, whatever was tapped first. */
  it('reads in the menu order, not the order they were tapped', () => {
    const tapped = { extras: ['olives', 'cheese'], size: ['large'] };

    expect(chosenOptionsFrom(GROUPS, tapped).map((option) => option.choiceId)).toEqual([
      'large',
      'cheese',
      'olives',
    ]);
  });

  /** The server refuses one anyway; a stale menu is how a customer holds one. */
  it('drops a sold-out choice rather than carrying it', () => {
    expect(chosenOptionsFrom(GROUPS, { size: ['large'], extras: ['truffle'] })).toHaveLength(1);
  });

  it('has nothing to say about a dish that asks nothing', () => {
    expect(chosenOptionsFrom([], {})).toEqual([]);
  });
});

describe('unitPriceWith', () => {
  it('adds the deltas to the base price', () => {
    const options = chosenOptionsFrom(GROUPS, { size: ['large'], extras: ['cheese'] });

    expect(unitPriceWith(90000, options)).toBe(135000);
  });

  it('takes money off for a choice that costs less', () => {
    const options = chosenOptionsFrom(GROUPS, { size: ['small'] });

    expect(unitPriceWith(90000, options)).toBe(70000);
  });

  it('is the plain price when nothing was chosen', () => {
    expect(unitPriceWith(90000, [])).toBe(90000);
  });
});

describe('needsChoosing', () => {
  /** The menu row has no way to ask, so it must not add silently. */
  it('is true when a group must be answered', () => {
    expect(needsChoosing(GROUPS)).toBe(true);
  });

  it('is false when every group is optional', () => {
    expect(needsChoosing([extras])).toBe(false);
  });

  it('is false for a dish that asks nothing', () => {
    expect(needsChoosing(undefined)).toBe(false);
    expect(needsChoosing([])).toBe(false);
  });
});
