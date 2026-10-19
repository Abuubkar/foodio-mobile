import { usePlaybackStore } from './playback.store';

describe('playback store', () => {
  beforeEach(() => {
    // Restore the real initial state, rather than asserting a value the test
    // itself has just written — which is how this file went on claiming the
    // feed started muted long after it stopped.
    usePlaybackStore.setState(usePlaybackStore.getInitialState());
  });

  it('starts with sound on, because the Clips tab has no control to undo a mute', () => {
    expect(usePlaybackStore.getInitialState().muted).toBe(false);
  });

  it('toggles the one global flag', () => {
    usePlaybackStore.getState().toggleMuted();
    expect(usePlaybackStore.getState().muted).toBe(true);

    usePlaybackStore.getState().toggleMuted();
    expect(usePlaybackStore.getState().muted).toBe(false);
  });
});
