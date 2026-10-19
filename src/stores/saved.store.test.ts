import { setStoredSavedClips } from '@/services/storage';

import { selectIsSaved, selectSavedCount, useSavedStore } from './saved.store';

jest.mock('@/services/storage', () => ({
  getStoredSavedClips: jest.fn(),
  setStoredSavedClips: jest.fn(),
}));

const mockWrite = setStoredSavedClips as jest.MockedFunction<typeof setStoredSavedClips>;

describe('saved store', () => {
  beforeEach(() => {
    mockWrite.mockClear();
    useSavedStore.setState(useSavedStore.getInitialState());
  });

  const hydrated = (clipIds: string[]) => useSavedStore.setState({ clipIds, isHydrated: true });

  it('saves newest first, so Saved reads in the order things were kept', () => {
    hydrated([]);
    useSavedStore.getState().toggle('a');
    useSavedStore.getState().toggle('b');

    expect(useSavedStore.getState().clipIds).toEqual(['b', 'a']);
  });

  it('is one toggle, not save and unsave, so a double tap cannot desync', () => {
    hydrated(['a']);
    useSavedStore.getState().toggle('a');
    expect(useSavedStore.getState().clipIds).toEqual([]);

    useSavedStore.getState().toggle('a');
    expect(useSavedStore.getState().clipIds).toEqual(['a']);
  });

  it('writes through to the device once hydrated', () => {
    hydrated(['a']);
    useSavedStore.getState().toggle('b');

    expect(mockWrite).toHaveBeenCalledWith(['b', 'a']);
  });

  it('never writes before hydration, or it would persist a list built on an empty start', () => {
    useSavedStore.setState({ clipIds: [], isHydrated: false });
    useSavedStore.getState().toggle('a');

    expect(useSavedStore.getState().clipIds).toEqual(['a']);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('selects membership and count', () => {
    hydrated(['a', 'b']);
    const state = useSavedStore.getState();

    expect(selectIsSaved('a')(state)).toBe(true);
    expect(selectIsSaved('zzz')(state)).toBe(false);
    expect(selectSavedCount(state)).toBe(2);
  });
});
