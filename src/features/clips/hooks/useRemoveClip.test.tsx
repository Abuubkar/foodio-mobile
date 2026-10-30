import { Alert, type AlertButton } from 'react-native';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { queryKeys } from '@/constants/queryKeys';
import { useSavedStore } from '@/stores/saved.store';

import { removeClip } from '../api/clip-post.api';

import { useRemoveClip } from './useRemoveClip';

import '@/i18n';

jest.mock('../api/clip-post.api', () => ({
  removeClip: jest.fn(),
}));

jest.mock('@/services/storage', () => ({
  getStoredSavedClips: jest.fn(),
  setStoredSavedClips: jest.fn(),
}));

const mockRemoveClip = jest.mocked(removeClip);

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

/** Presses the destructive button in the confirm the hook just raised. */
const confirm = (alert: jest.SpyInstance) => {
  const buttons = alert.mock.calls[0]?.[2] as AlertButton[] | undefined;
  buttons?.find((button) => button.style === 'destructive')?.onPress?.();
};

describe('useRemoveClip', () => {
  let alert: jest.SpyInstance;

  beforeEach(() => {
    mockRemoveClip.mockReset();
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    useSavedStore.setState({ clipIds: ['clip-1', 'clip-2'], isHydrated: true });
  });

  afterEach(() => {
    alert.mockRestore();
  });

  it('sends nothing until the confirm is answered', async () => {
    const { wrapper } = setup();
    const { result } = await renderHook(() => useRemoveClip(), { wrapper });

    result.current.remove('clip-1');

    expect(alert).toHaveBeenCalledTimes(1);
    expect(mockRemoveClip).not.toHaveBeenCalled();
  });

  it('removes, crosses the cell out, and refetches the feed', async () => {
    const { queryClient, wrapper } = setup();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    mockRemoveClip.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useRemoveClip(), { wrapper });
    result.current.remove('clip-1');
    confirm(alert);

    await waitFor(() => expect(result.current.isRemoved('clip-1')).toBe(true));

    expect(mockRemoveClip).toHaveBeenCalledWith('clip-1');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.clips.all });
  });

  it('drops it from Saved, so no tile is left the API has stopped answering for', async () => {
    const { wrapper } = setup();
    mockRemoveClip.mockResolvedValue(undefined);

    const { result } = await renderHook(() => useRemoveClip(), { wrapper });
    result.current.remove('clip-1');
    confirm(alert);

    await waitFor(() => expect(useSavedStore.getState().clipIds).toEqual(['clip-2']));
  });

  it('says so when it fails, and leaves the cell standing', async () => {
    const { queryClient, wrapper } = setup();
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    mockRemoveClip.mockRejectedValue(new Error('offline'));

    const { result } = await renderHook(() => useRemoveClip(), { wrapper });
    result.current.remove('clip-1');
    confirm(alert);

    // The second alert is the failure. Unlike a report, a removal that did not
    // land must not look as though it did.
    await waitFor(() => expect(alert).toHaveBeenCalledTimes(2));

    expect(result.current.isRemoved('clip-1')).toBe(false);
    expect(useSavedStore.getState().clipIds).toEqual(['clip-1', 'clip-2']);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
