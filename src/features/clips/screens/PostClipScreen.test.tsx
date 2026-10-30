import { Alert } from 'react-native';

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders } from 'axios';

// The ui barrel reaches expo-image, whose native side does not load under jest.
jest.mock('expo-image', () => ({ Image: require('react-native').View }));
// The shared barrel reaches PinMap, and expo-maps has no native side here either.
jest.mock('expo-maps', () => ({ AppleMaps: {}, GoogleMaps: {} }));

const mockRouteParams = jest.fn<Record<string, string>, []>();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockRouteParams(),
}));

const mockAskedFor = jest.fn<void, [string]>();
const mockRefetch = jest.fn();
const mockSubscriptionStatus = jest.fn<string | undefined, []>();
jest.mock('@/features/manage/hooks/useSubscription', () => ({
  useSubscription: (restaurantId: string) => {
    mockAskedFor(restaurantId);
    // Mirrors the real hook, which is disabled without a restaurant.
    const status = restaurantId === '' ? undefined : mockSubscriptionStatus();
    return {
      data: status === undefined ? undefined : { status },
      isFetching: false,
      refetch: () => mockRefetch(),
    };
  },
}));

const mockRefusal = jest.fn<unknown, []>();
jest.mock('../hooks/usePostClip', () => ({
  usePostClip: () => ({
    film: async () => ({
      videoUri: 'file:///take.mp4',
      posterUri: 'file:///take.jpg',
      durationSeconds: 8,
    }),
    isFilming: false,
    send: {
      isPending: false,
      mutate: (_draft: unknown, options: { onError: (cause: unknown) => void }) =>
        options.onError(mockRefusal()),
    },
  }),
}));

import type { Person } from '@/features/identity/types/identity.types';
import { useSessionStore } from '@/stores/session.store';

import { PostClipScreen } from './PostClipScreen';

import '@/i18n';

const PAUSED = 'Posting clips is paused';

const person = (entitlements: Person['entitlements']): Person => ({
  id: 'p1',
  displayName: 'Sana',
  handle: null,
  avatarUrl: '',
  phone: null,
  entitlements,
});

const customer = person([]);
const owner = person([{ restaurantId: 'rest-1', capabilities: ['kitchen'] }]);

const serverError = (status: number): AxiosError => {
  const error = new AxiosError('Request failed');
  const headers = new AxiosHeaders();
  error.response = { status, statusText: '', data: {}, headers, config: { headers } };
  return error;
};

const open = async (who: Person) => {
  useSessionStore.setState({ person: who });
  mockRouteParams.mockReturnValue({ restaurantId: 'rest-1', restaurantName: 'Taco Fiesta' });

  await render(<PostClipScreen />);
};

/** Filming is mocked, so this only gets the screen to the state with a take. */
const film = async () => {
  fireEvent.press(screen.getByRole('button', { name: 'Film a clip' }));
  await waitFor(() => expect(screen.getByText('8 seconds')).toBeTruthy());
};

describe('PostClipScreen', () => {
  beforeEach(() => {
    mockSubscriptionStatus.mockReturnValue(undefined);
    mockRefusal.mockReturnValue(serverError(500));
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  /**
   * The 402 is the restaurant's own clips being paused by an unpaid invoice.
   * An alert would say "that did not post" and take the reason away with it.
   */
  it('leaves the dunning bar on screen when the server refuses with 402', async () => {
    await open(owner);
    await film();

    mockRefusal.mockReturnValue(serverError(402));
    fireEvent.press(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => expect(screen.getByText(PAUSED)).toBeTruthy());
    expect(Alert.alert).not.toHaveBeenCalled();
    // Nothing they filmed is thrown away by a refusal they can settle.
    expect(screen.getByText('8 seconds')).toBeTruthy();
  });

  it('still alerts on an ordinary failure', async () => {
    await open(owner);
    await film();

    fireEvent.press(screen.getByRole('button', { name: 'Post' }));

    expect(Alert.alert).toHaveBeenCalledWith(
      'That did not post',
      'Nothing was published. Check your connection and try again.',
    );
    expect(screen.queryByText(PAUSED)).toBeNull();
  });

  /** Known in advance, so it is said before they spend a take on it. */
  it('says so before filming when the subscription is already past due', async () => {
    mockSubscriptionStatus.mockReturnValue('past_due');

    await open(owner);
    await film();

    expect(screen.getByText(PAUSED)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Post' })).toBeDisabled();
  });

  it('asks the server again for an owner who has just paid', async () => {
    mockSubscriptionStatus.mockReturnValue('past_due');

    await open(owner);
    fireEvent.press(screen.getByRole('button', { name: 'Already paid? Check again' }));

    expect(mockRefetch).toHaveBeenCalled();
  });

  /**
   * A customer's clip is never refused over the kitchen's invoice, and asking
   * about a subscription they do not hold would be a request the API refuses.
   */
  it('never mentions billing to a customer, and never asks about it', async () => {
    mockSubscriptionStatus.mockReturnValue('past_due');

    await open(customer);
    await film();

    expect(mockAskedFor).toHaveBeenCalledWith('');
    expect(mockAskedFor).not.toHaveBeenCalledWith('rest-1');

    mockRefusal.mockReturnValue(serverError(402));
    fireEvent.press(screen.getByRole('button', { name: 'Post' }));

    expect(screen.queryByText(PAUSED)).toBeNull();
    // Unexplained, but never silent.
    expect(Alert.alert).toHaveBeenCalled();
  });
});
