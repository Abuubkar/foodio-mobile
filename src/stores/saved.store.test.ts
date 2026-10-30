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

  it('discards a taken-down clip without toggling it back on', () => {
    hydrated(['a', 'b']);
    useSavedStore.getState().discard('a');

    expect(useSavedStore.getState().clipIds).toEqual(['b']);
    expect(mockWrite).toHaveBeenCalledWith(['b']);
  });

  it('discarding something never saved adds nothing — the trap toggle would fall into', () => {
    hydrated(['a']);
    useSavedStore.getState().discard('zzz');

    expect(useSavedStore.getState().clipIds).toEqual(['a']);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('never writes a discard before hydration, same as a toggle', () => {
    useSavedStore.setState({ clipIds: ['a'], isHydrated: false });
    useSavedStore.getState().discard('a');

    expect(useSavedStore.getState().clipIds).toEqual([]);
    expect(mockWrite).not.toHaveBeenCalled();
  });

  it('clears, so a sign-out does not leave a list belonging to nobody', () => {
    hydrated(['a', 'b']);
    useSavedStore.getState().clear();

    expect(useSavedStore.getState().clipIds).toEqual([]);
    // The device's copy too, or the next launch restores someone else's list.
    expect(mockWrite).toHaveBeenCalledWith([]);
  });

  it('clears even when nothing was ever read from the device', () => {
    useSavedStore.setState({ clipIds: ['a'], isHydrated: false });
    useSavedStore.getState().clear();

    expect(useSavedStore.getState().clipIds).toEqual([]);
    expect(mockWrite).toHaveBeenCalledWith([]);
  });

  it('selects membership and count', () => {
    hydrated(['a', 'b']);
    const state = useSavedStore.getState();

    expect(selectIsSaved('a')(state)).toBe(true);
    expect(selectIsSaved('zzz')(state)).toBe(false);
    expect(selectSavedCount(state)).toBe(2);
  });
});
