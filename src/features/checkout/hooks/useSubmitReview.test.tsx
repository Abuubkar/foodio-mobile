import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ApiError } from '@/api/errors';
import { queryKeys } from '@/constants/queryKeys';
import { submitOrderReview } from '@/features/restaurants/api/review.api';
import type { Review } from '@/features/restaurants/types/review.types';
import { useRatedOrdersStore } from '@/stores/ratedOrders.store';

import { useSubmitReview } from './useSubmitReview';

jest.mock('@/features/restaurants/api/review.api', () => ({
  submitOrderReview: jest.fn(),
}));

const mockSubmit = jest.mocked(submitOrderReview);

const postedReview: Review = {
  id: 'rev-9',
  author: 'Maria G.',
  avatar: '',
  rating: 5,
  comment: '',
  postedAt: '2026-08-08T12:00:00Z',
  photos: [],
  restaurantId: 'rest-1',
  orderId: 'order-1',
};

function setup() {
  // Infinite gcTime: a scheduled gc timer would keep the jest worker alive.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('useSubmitReview', () => {
  beforeEach(() => useRatedOrdersStore.setState({ ratedOrderIds: {} }));

  it('marks the order rated and invalidates the restaurant caches on success', async () => {
    const { queryClient, wrapper } = setup();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    mockSubmit.mockResolvedValue(postedReview);

    const { result } = await renderHook(() => useSubmitReview(), { wrapper });
    result.current.mutate({ orderId: 'order-1', review: { rating: 5 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useRatedOrdersStore.getState().ratedOrderIds['order-1']).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.restaurants.detail('rest-1'),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.reviews.byRestaurant('rest-1'),
    });
  });

  it('treats a 409 as already-rated, not as a failure to surface', async () => {
    const { wrapper } = setup();
    mockSubmit.mockRejectedValue(
      new ApiError('client', 'You have already reviewed this order.', { status: 409 }),
    );

    const { result } = await renderHook(() => useSubmitReview(), { wrapper });
    result.current.mutate({ orderId: 'order-1', review: { rating: 4 } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useRatedOrdersStore.getState().ratedOrderIds['order-1']).toBe(true);
  });

  it('leaves the order unrated on any other error', async () => {
    const { wrapper } = setup();
    mockSubmit.mockRejectedValue(new ApiError('server', 'Down.', { status: 500 }));

    const { result } = await renderHook(() => useSubmitReview(), { wrapper });
    result.current.mutate({ orderId: 'order-1', review: { rating: 4 } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useRatedOrdersStore.getState().ratedOrderIds['order-1']).toBeUndefined();
  });
});
