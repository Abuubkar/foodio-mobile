import type { ActiveRole, Person } from './identity.types';
import { CUSTOMER_ROLE, resolveRole, roleOptionsFor, sameRole } from './identity.types';

const person = (entitlements: Person['entitlements']): Person => ({
  id: 'marco',
  displayName: 'Marco R.',
  handle: null,
  avatarUrl: '',
  phone: null,
  entitlements,
});

describe('roleOptionsFor', () => {
  it('offers only the customer role to someone with no entitlements', () => {
    expect(roleOptionsFor(person([]))).toEqual([{ role: CUSTOMER_ROLE, restaurantId: null }]);
  });

  it('yields one entry per capability, not per relationship', () => {
    const options = roleOptionsFor(
      person([{ restaurantId: 'rest-1', capabilities: ['kitchen', 'delivery'] }]),
    );

    expect(options.map((option) => option.role.kind)).toEqual(['customer', 'kitchen', 'delivery']);
  });

  it('keeps two jobs at two restaurants apart', () => {
    const options = roleOptionsFor(
      person([
        { restaurantId: 'rest-1', capabilities: ['kitchen'] },
        { restaurantId: 'rest-3', capabilities: ['kitchen'] },
      ]),
    );

    expect(options.map((option) => option.restaurantId)).toEqual([null, 'rest-1', 'rest-3']);
  });
});

describe('sameRole', () => {
  it('separates the kitchen from delivery at one restaurant', () => {
    const kitchen: ActiveRole = { kind: 'kitchen', restaurantId: 'rest-1' };
    const delivery: ActiveRole = { kind: 'delivery', restaurantId: 'rest-1' };

    expect(sameRole(kitchen, delivery)).toBe(false);
  });

  it('separates the same capability at two restaurants', () => {
    expect(
      sameRole(
        { kind: 'kitchen', restaurantId: 'rest-1' },
        { kind: 'kitchen', restaurantId: 'rest-3' },
      ),
    ).toBe(false);
  });
});

describe('resolveRole', () => {
  const marco = person([{ restaurantId: 'rest-1', capabilities: ['kitchen', 'delivery'] }]);

  it('restores a role the person still holds', () => {
    const remembered: ActiveRole = { kind: 'kitchen', restaurantId: 'rest-1' };

    expect(resolveRole(marco, remembered)).toEqual(remembered);
  });

  it('falls back to customer when the entitlement is gone', () => {
    const revoked: ActiveRole = { kind: 'kitchen', restaurantId: 'rest-9' };

    expect(resolveRole(marco, revoked)).toEqual(CUSTOMER_ROLE);
  });

  it('falls back when the capability was dropped but the relationship remains', () => {
    const kitchenOnly = person([{ restaurantId: 'rest-1', capabilities: ['kitchen'] }]);

    expect(resolveRole(kitchenOnly, { kind: 'delivery', restaurantId: 'rest-1' })).toEqual(
      CUSTOMER_ROLE,
    );
  });

  it('falls back when signed out', () => {
    expect(resolveRole(null, { kind: 'kitchen', restaurantId: 'rest-1' })).toEqual(CUSTOMER_ROLE);
  });
});
