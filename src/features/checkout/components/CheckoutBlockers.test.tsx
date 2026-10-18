import { fireEvent, render, screen } from '@testing-library/react-native';

// The ui barrel reaches expo-image, whose native side does not load under jest.
jest.mock('expo-image', () => ({ Image: require('react-native').View }));

import type { CheckoutBlocker } from '../lib/reviewCheckout';

import { CheckoutBlockers } from './CheckoutBlockers';

import '@/i18n';

const show = (blockers: CheckoutBlocker[], onFix?: (kind: CheckoutBlocker['kind']) => void) =>
  render(<CheckoutBlockers blockers={blockers} currency="PKR" {...(onFix ? { onFix } : {})} />);

describe('CheckoutBlockers', () => {
  it('says nothing when nothing is wrong', async () => {
    await show([]);

    expect(screen.toJSON()).toBeNull();
  });

  /**
   * The box sits under the Order summary, a screen away from the field it is
   * talking about. A blocker a customer can act on has to be the way to act,
   * or the message and the fix stay far apart — issue #159.
   */
  it.each([
    ['no-phone', 'Add a contact number so the restaurant can reach you.'],
    ['no-address', 'Add a delivery address to continue.'],
    ['not-signed-in', 'Sign in to place this order. Your cart is waiting.'],
  ] as const)('offers %s as something to tap', async (kind, message) => {
    const onFix = jest.fn();
    await show([{ kind }], onFix);

    fireEvent.press(screen.getByRole('button', { name: message }));

    expect(onFix).toHaveBeenCalledWith(kind);
  });

  /** Closed is a fact about the restaurant. Tapping it would promise a fix. */
  it('leaves a blocker the customer cannot clear as plain text', async () => {
    await show([{ kind: 'restaurant-closed' }], jest.fn());

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('This restaurant is closed right now.')).toBeTruthy();
  });

  it('stays plain text when the screen offers no way to fix anything', async () => {
    await show([{ kind: 'no-phone' }]);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
