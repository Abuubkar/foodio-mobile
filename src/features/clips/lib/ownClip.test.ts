import type { Clip } from '@/features/discovery/types/clip.types';
import { clipSchema } from '@/features/discovery/types/clip.types';
import type { Entitlement, Person } from '@/features/identity/types/identity.types';

import { canRemoveClip } from './ownClip';

const base = {
  id: 'clip-1',
  mediaUrl: 'https://example.test/a.mp4',
  thumbnailUrl: 'https://example.test/a.jpg',
  caption: 'A clip',
  durationSeconds: 9,
  postedAt: '2026-01-01T00:00:00.000Z',
};

const byCustomer = (personId: string, extra: Record<string, unknown> = {}): Clip =>
  clipSchema.parse({
    ...base,
    ...extra,
    author: { kind: 'customer', personId, displayName: 'Sana', avatarUrl: '', handle: 'sana' },
  });

const byRestaurant = (restaurantId: string): Clip =>
  clipSchema.parse({
    ...base,
    restaurantId,
    restaurantName: 'Kebabish',
    author: { kind: 'restaurant' },
  });

const person = (id: string, entitlements: Entitlement[] = []): Person => ({
  id,
  displayName: 'Sana',
  handle: 'sana',
  avatarUrl: '',
  phone: null,
  entitlements,
});

describe('canRemoveClip', () => {
  it('offers removal on a clip the signed-in person filmed', () => {
    expect(canRemoveClip(byCustomer('p1'), person('p1'))).toBe(true);
  });

  it('refuses somebody else’s clip — that is what reporting is for', () => {
    expect(canRemoveClip(byCustomer('p2'), person('p1'))).toBe(false);
  });

  it('refuses when nobody is signed in', () => {
    expect(canRemoveClip(byCustomer('p1'), null)).toBe(false);
  });

  it('offers removal on a kitchen’s own footage to staff entitled there', () => {
    const staff = person('p1', [{ restaurantId: 'rest-1', capabilities: ['kitchen'] }]);

    expect(canRemoveClip(byRestaurant('rest-1'), staff)).toBe(true);
  });

  it('refuses a kitchen clip at a restaurant they are entitled at elsewhere', () => {
    const staff = person('p1', [{ restaurantId: 'rest-2', capabilities: ['kitchen'] }]);

    expect(canRemoveClip(byRestaurant('rest-1'), staff)).toBe(false);
  });

  it('refuses a delivery entitlement: carrying food is not publishing', () => {
    const rider = person('p1', [{ restaurantId: 'rest-1', capabilities: ['delivery'] }]);

    expect(canRemoveClip(byRestaurant('rest-1'), rider)).toBe(false);
  });

  it('refuses a customer’s clip to the kitchen it is about, though the server would allow it', () => {
    // Moderating somebody else's clip would wear the same button as taking
    // down your own. Reporting is the path for that.
    const staff = person('p1', [{ restaurantId: 'rest-1', capabilities: ['kitchen'] }]);
    const clip = byCustomer('p2', { restaurantId: 'rest-1', restaurantName: 'Kebabish' });

    expect(canRemoveClip(clip, staff)).toBe(false);
  });
});
