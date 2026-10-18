import { act, renderHook, waitFor } from '@testing-library/react-native';

import { PermissionType } from '@/services/permissions';

const mockRequest = jest.fn();
const mockStatus = jest.fn();

jest.mock('@/services/permissions', () => {
  const actual =
    jest.requireActual<typeof import('@/services/permissions')>('@/services/permissions');
  return {
    ...actual,
    expoPermissionAdapter: {
      request: (type: unknown) => mockRequest(type),
      status: (type: unknown) => mockStatus(type),
    },
  };
});

const mockHasAsked = jest.fn();
const mockRememberAsked = jest.fn();

jest.mock('@/services/storage', () => ({
  hasAskedAboutNotifications: () => mockHasAsked(),
  rememberAskedAboutNotifications: () => mockRememberAsked(),
}));

import { useOrderNotificationPrompt } from './useOrderNotificationPrompt';

const notDecidedYet = () => {
  mockHasAsked.mockResolvedValue(false);
  mockStatus.mockResolvedValue({ status: 'undetermined', type: PermissionType.Notification });
  mockRequest.mockResolvedValue({ status: 'granted', type: PermissionType.Notification });
  mockRememberAsked.mockResolvedValue(undefined);
};

describe('useOrderNotificationPrompt', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockStatus.mockReset();
    mockHasAsked.mockReset();
    mockRememberAsked.mockReset();
  });

  it('offers to tell them, when nobody has been asked yet', async () => {
    notDecidedYet();

    const { result } = await renderHook(() => useOrderNotificationPrompt());

    await waitFor(() => expect(result.current.visible).toBe(true));
  });

  /** The OS prompt is spent only on somebody who already said yes to ours. */
  it('does not spend the OS prompt until the customer accepts', async () => {
    notDecidedYet();
    const { result } = await renderHook(() => useOrderNotificationPrompt());
    await waitFor(() => expect(result.current.visible).toBe(true));

    expect(mockRequest).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.accept();
    });

    expect(mockRequest).toHaveBeenCalledWith(PermissionType.Notification);
    expect(result.current.visible).toBe(false);
  });

  it('asks the OS nothing when the customer says not now', async () => {
    notDecidedYet();
    const { result } = await renderHook(() => useOrderNotificationPrompt());
    await waitFor(() => expect(result.current.visible).toBe(true));

    await act(async () => {
      result.current.decline();
    });

    expect(mockRequest).not.toHaveBeenCalled();
    expect(result.current.visible).toBe(false);
  });

  it.each(['accept', 'decline'] as const)('remembers that it asked, on %s', async (answer) => {
    notDecidedYet();
    const { result } = await renderHook(() => useOrderNotificationPrompt());
    await waitFor(() => expect(result.current.visible).toBe(true));

    await act(async () => {
      await result.current[answer]();
    });

    expect(mockRememberAsked).toHaveBeenCalled();
  });

  it('stays quiet once this device has been asked', async () => {
    notDecidedYet();
    mockHasAsked.mockResolvedValue(true);

    const { result } = await renderHook(() => useOrderNotificationPrompt());

    await waitFor(() => expect(mockHasAsked).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
    expect(mockStatus).not.toHaveBeenCalled();
  });

  /**
   * Explaining why notifications help to somebody who already turned them on
   * is noise; explaining it to somebody the OS will never re-prompt is worse,
   * because the button would do nothing.
   */
  it.each(['granted', 'denied'] as const)('stays quiet when the OS already said %s', async (os) => {
    notDecidedYet();
    mockStatus.mockResolvedValue({ status: os, type: PermissionType.Notification });

    const { result } = await renderHook(() => useOrderNotificationPrompt());

    await waitFor(() => expect(mockStatus).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
  });

  it('stays quiet rather than throwing when storage is unreadable', async () => {
    notDecidedYet();
    mockHasAsked.mockRejectedValue(new Error('no storage'));

    const { result } = await renderHook(() => useOrderNotificationPrompt());

    await waitFor(() => expect(mockHasAsked).toHaveBeenCalled());
    expect(result.current.visible).toBe(false);
  });
});
