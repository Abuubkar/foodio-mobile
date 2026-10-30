import { AxiosError, AxiosHeaders } from 'axios';

import { ApiError } from '@/api/errors';
import type { Person } from '@/features/identity/types/identity.types';

import { isPostingPausedByBilling, postsAsRestaurant } from './kitchenClips';

const person = (entitlements: Person['entitlements']): Person =>
  ({ id: 'p1', displayName: 'Sana', entitlements }) as Person;

const refusal = (status: number): AxiosError => {
  const error = new AxiosError('Request failed');
  const headers = new AxiosHeaders();
  error.response = { status, statusText: '', data: {}, headers, config: { headers } };
  return error;
};

describe('postsAsRestaurant', () => {
  it('is true for somebody holding the kitchen of that restaurant', () => {
    const cook = person([{ restaurantId: 'rest-1', capabilities: ['kitchen'] }]);

    expect(postsAsRestaurant(cook, 'rest-1')).toBe(true);
  });

  /** Riders work for the restaurant without speaking for it. */
  it('is false for a delivery-only entitlement', () => {
    const rider = person([{ restaurantId: 'rest-1', capabilities: ['delivery'] }]);

    expect(postsAsRestaurant(rider, 'rest-1')).toBe(false);
  });

  it('is false for a kitchen somewhere else', () => {
    const cook = person([{ restaurantId: 'rest-2', capabilities: ['kitchen'] }]);

    expect(postsAsRestaurant(cook, 'rest-1')).toBe(false);
  });

  it('is false for a customer, and for a clip about no restaurant at all', () => {
    const cook = person([{ restaurantId: 'rest-1', capabilities: ['kitchen'] }]);

    expect(postsAsRestaurant(person([]), 'rest-1')).toBe(false);
    expect(postsAsRestaurant(null, 'rest-1')).toBe(false);
    expect(postsAsRestaurant(cook, undefined)).toBe(false);
  });
});

describe('isPostingPausedByBilling', () => {
  it('reads the server 402 as the dunning bar', () => {
    expect(isPostingPausedByBilling(refusal(402))).toBe(true);
    expect(isPostingPausedByBilling(new ApiError('client', 'paused', { status: 402 }))).toBe(true);
  });

  /** Everything else is an ordinary failure, and must not blame an invoice. */
  it('leaves every other failure alone', () => {
    expect(isPostingPausedByBilling(refusal(403))).toBe(false);
    expect(isPostingPausedByBilling(refusal(422))).toBe(false);
    expect(isPostingPausedByBilling(refusal(500))).toBe(false);
    expect(isPostingPausedByBilling(new AxiosError('Network Error'))).toBe(false);
    expect(isPostingPausedByBilling(new Error('boom'))).toBe(false);
  });
});
