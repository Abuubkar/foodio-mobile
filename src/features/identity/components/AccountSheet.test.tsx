import { render, screen } from '@testing-library/react-native';

// The ui barrel reaches expo-image, whose native side does not load under jest.
jest.mock('expo-image', () => ({ Image: require('react-native').View }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
/*
  SheetContainer puts a SafeAreaProvider of its own inside the Modal, because a
  Modal is its own native window. Under jest that provider never measures a
  frame, so it renders nothing and the sheet's contents vanish.
*/
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: unknown }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/features/restaurants/hooks/useRestaurants', () => ({
  useRestaurants: () => ({ data: [{ id: 'rest-1', name: 'Taco Fiesta' }] }),
}));

import { useSessionStore } from '@/stores/session.store';

import type { ActiveRole, Person } from '../types/identity.types';
import { CUSTOMER_ROLE } from '../types/identity.types';

import { AccountSheet } from './AccountSheet';

import '@/i18n';

const customer: Person = {
  id: 'aisha',
  displayName: 'Aisha K.',
  phone: '+923001230001',
  entitlements: [],
};

const cook: Person = {
  id: 'marco',
  displayName: 'Marco R.',
  phone: null,
  entitlements: [{ restaurantId: 'rest-1', capabilities: ['kitchen'] }],
};

const signedIn = (person: Person, role: ActiveRole = CUSTOMER_ROLE) => {
  useSessionStore.setState({
    person,
    role,
    setRole: async () => {},
    signOut: async () => {},
  } as Partial<ReturnType<typeof useSessionStore.getState>> as never);
};

const show = () => render(<AccountSheet visible onClose={() => {}} />);

describe('AccountSheet', () => {
  it('offers the things people come to the chip looking for', async () => {
    signedIn(customer);
    await show();

    expect(screen.getByText('Your orders')).toBeTruthy();
    expect(screen.getByText('Delivery addresses')).toBeTruthy();
    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('shows who is signed in', async () => {
    signedIn(customer);
    await show();

    expect(screen.getByText('Aisha K.')).toBeTruthy();
  });

  /**
   * Everyone is a customer, so a lone "Customer" row with a tick beside it is
   * a control that cannot do anything.
   */
  it('hides the role switcher when there is nothing to switch to', async () => {
    signedIn(customer);
    await show();

    expect(screen.queryByText('Acting as')).toBeNull();
  });

  it('shows the role switcher to somebody who holds a role', async () => {
    signedIn(cook);
    await show();

    expect(screen.getByText('Acting as')).toBeTruthy();
    expect(screen.getByText('Taco Fiesta · Kitchen')).toBeTruthy();
  });

  /**
   * The customer tabs and the address screen are registered only under the
   * customer role, so offering them from a Kitchen tablet would push a route
   * that does not exist there.
   */
  it('offers no customer screens while acting as a kitchen', async () => {
    signedIn(cook, { kind: 'kitchen', restaurantId: 'rest-1' });
    await show();

    expect(screen.queryByText('Your orders')).toBeNull();
    expect(screen.queryByText('Delivery addresses')).toBeNull();
    // Sign-out belongs to every role.
    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('renders nothing when nobody is signed in', async () => {
    useSessionStore.setState({ person: null } as never);
    await show();

    expect(screen.toJSON()).toBeNull();
  });
});
