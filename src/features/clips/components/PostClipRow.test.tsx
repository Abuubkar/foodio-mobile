import { fireEvent, render, screen } from '@testing-library/react-native';

// The ui barrel reaches expo-image, whose native side does not load under jest.
jest.mock('expo-image', () => ({ Image: require('react-native').View }));

const mockPush = jest.fn();
// The row navigates, and there is no navigator around a component under test.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: (to: unknown) => mockPush(to) }) }));

import { PostClipRow } from './PostClipRow';

import '@/i18n';

describe('PostClipRow', () => {
  /**
   * The params *are* the feature: the composer reads which kitchen a clip is
   * about from the route, so a mockPush without them posts about nothing — which
   * is what every clip in the app did before this row existed.
   */
  it('opens the composer carrying the kitchen it is about', async () => {
    await render(<PostClipRow restaurantId="rest-1" restaurantName="Taco Fiesta" />);

    fireEvent.press(screen.getByRole('button', { name: 'Post a clip about Taco Fiesta' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/post-clip',
      params: { restaurantId: 'rest-1', restaurantName: 'Taco Fiesta' },
    });
  });
});
