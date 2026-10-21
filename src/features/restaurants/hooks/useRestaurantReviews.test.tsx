import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { fetchRestaurantReviewsPage } from '../api/review.api';
import type { Review } from '../types/review.types';

import { useRestaurantReviews } from './useRestaurantReviews';

jest.mock('../api/review.api', () => ({
  fetchRestaurantReviewsPage: jest.fn(),
}));

const mockFetchPage = jest.mocked(fetchRestaurantReviewsPage);

const reviewWith = (id: string): Review => ({
  id,
  author: 'Maria G.',
  avatar: '',
  rating: 5,
  comment: 'Great.',
  postedAt: '2026-08-01',
  photos: [],
  restaurantId: 'rest-1',
  orderId: `order-${id}`,
});

function setup() {
  // Infinite gcTime: a scheduled gc timer would keep the jest worker alive.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper };
}

describe('useRestaurantReviews', () => {
  it('asks for the first page without a cursor', async () => {
    mockFetchPage.mockResolvedValue({ items: [reviewWith('rev-1')], nextCursor: null });

    const { result } = await renderHook(() => useRestaurantReviews('rest-1'), setup());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetchPage).toHaveBeenCalledWith('rest-1', undefined);
    expect(result.current.hasNextPage).toBe(false);
  });

  it('carries the cursor forward and flattens the pages', async () => {
    mockFetchPage
      .mockResolvedValueOnce({
        items: [reviewWith('rev-1'), reviewWith('rev-2')],
        nextCursor: 'rev-2',
      })
      .mockResolvedValueOnce({ items: [reviewWith('rev-3')], nextCursor: null });

    const { result } = await renderHook(() => useRestaurantReviews('rest-1'), setup());

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    await result.current.fetchNextPage();

    await waitFor(() =>
      expect(result.current.data?.map((review) => review.id)).toEqual(['rev-1', 'rev-2', 'rev-3']),
    );
    expect(mockFetchPage).toHaveBeenLastCalledWith('rest-1', 'rev-2');
    expect(result.current.hasNextPage).toBe(false);
  });
});
