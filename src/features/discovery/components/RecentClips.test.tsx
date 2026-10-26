import { render, screen } from '@testing-library/react-native';

// The ui barrel reaches expo-image, whose native side does not load under jest.
jest.mock('expo-image', () => ({ Image: require('react-native').View }));
// A ClipCard navigates, and there is no navigator around a component under test.
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/hooks/useNavigationGuard', () => ({
  useNavigationGuard: () => (navigate: () => void) => navigate(),
}));

import type { Clip } from '../types/clip.types';

import { RecentClips } from './RecentClips';

import '@/i18n';

const mockClips = jest.fn<{ data: Clip[] | undefined }, []>();
jest.mock('../hooks/useClips', () => ({ useClips: () => mockClips() }));

const clip = (id: string): Clip => ({
  id,
  restaurantId: 'rest-1',
  restaurantName: 'Sweet Tooth Bakery',
  mediaUrl: `https://example.test/${id}.mp4`,
  thumbnailUrl: `https://example.test/${id}.jpg`,
  caption: 'What actually turned up',
  durationSeconds: 12,
  postedAt: '2026-09-07T00:00:00.000Z',
  author: { kind: 'restaurant' },
  mediaKind: 'mp4' as const,
});

describe('RecentClips', () => {
  it('renders nothing when there are no clips', async () => {
    mockClips.mockReturnValue({ data: [] });

    await render(<RecentClips />);

    expect(screen.queryByText('Latest clips')).toBeNull();
  });

  it('renders nothing before the first page arrives', async () => {
    mockClips.mockReturnValue({ data: undefined });

    await render(<RecentClips />);

    expect(screen.queryByText('Latest clips')).toBeNull();
  });

  it('is a shelf, not the whole feed', async () => {
    mockClips.mockReturnValue({ data: Array.from({ length: 25 }, (_, i) => clip(`clip-${i}`)) });

    await render(<RecentClips />);

    expect(screen.getByText('Latest clips')).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(10);
  });
});
