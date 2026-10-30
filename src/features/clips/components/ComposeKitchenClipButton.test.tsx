import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
// The button navigates, and there is no navigator around a component under test.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: (to: unknown) => mockPush(to) }) }));

import { ComposeKitchenClipButton } from './ComposeKitchenClipButton';

import '@/i18n';

describe('ComposeKitchenClipButton', () => {
  /** Same route, same params — what differs is who the server makes the author. */
  it('opens the composer carrying its own restaurant', async () => {
    await render(<ComposeKitchenClipButton restaurantId="rest-1" restaurantName="Taco Fiesta" />);

    fireEvent.press(screen.getByRole('button', { name: 'Post a clip as Taco Fiesta' }));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/post-clip',
      params: { restaurantId: 'rest-1', restaurantName: 'Taco Fiesta' },
    });
  });
});
