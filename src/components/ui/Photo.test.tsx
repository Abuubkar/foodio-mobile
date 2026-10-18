import { act, render, screen } from '@testing-library/react-native';

/**
 * expo-image's native side does not load under jest-expo; the frame is what
 * matters here. The props are kept so a test can say "the photograph arrived"
 * without reaching for a testID the app does not otherwise need.
 */
let imageProps: { onLoadEnd?: () => void } = {};
jest.mock('expo-image', () => ({
  Image: (props: { onLoadEnd?: () => void }) => {
    imageProps = props;
    return require('react').createElement(require('react-native').View, props);
  },
}));

import { Photo } from './Photo';

const arrives = async () => {
  await act(async () => {
    imageProps.onLoadEnd?.();
  });
};

describe('Photo', () => {
  beforeEach(() => {
    imageProps = {};
  });

  it('renders nothing when there is no photograph', async () => {
    await render(<Photo uri="" className="h-36 w-full" />);

    expect(screen.toJSON()).toBeNull();
  });

  it('renders the image when there is one', async () => {
    await render(<Photo uri="https://example.test/dish.jpg" className="h-36 w-full" />);

    expect(screen.toJSON()).not.toBeNull();
  });

  /**
   * The bug this component exists to kill: the frame's grey background used to
   * show through whether or not a `uri` was set, so a dish with no photograph
   * rendered exactly like one whose photograph failed to load. Assert the frame
   * is gone too, or a regression that keeps the empty box still passes.
   */
  it('renders no frame either, so nothing occupies the space', async () => {
    await render(<Photo uri="" className="h-36 w-full bg-gray-200" />);

    expect(JSON.stringify(screen.toJSON())).not.toContain('bg-gray-200');
  });

  it('sweeps the grey while the photograph is still coming', async () => {
    await render(<Photo uri="https://example.test/dish.jpg" className="h-36 w-full" />);

    expect(screen.getByTestId('photo-loading')).toBeTruthy();
  });

  it('stops once the photograph arrives', async () => {
    await render(<Photo uri="https://example.test/dish.jpg" className="h-36 w-full" />);
    await arrives();

    expect(screen.queryByTestId('photo-loading')).toBeNull();
  });

  /** A failed photograph settles too: the plain grey stays, the waiting ends. */
  it('stops when the photograph fails rather than sweeping for ever', async () => {
    await render(<Photo uri="https://example.test/missing.jpg" className="h-36 w-full" />);
    await arrives();

    expect(screen.queryByTestId('photo-loading')).toBeNull();
  });

  /**
   * A list recycles its frames. Were the settled state a boolean it would
   * survive into the next photograph, which would then show no loading state
   * at all — the original bug, arriving by the back door.
   */
  it('sweeps again when the frame is recycled for a different photograph', async () => {
    const { rerender } = await render(
      <Photo uri="https://example.test/first.jpg" className="h-36 w-full" />,
    );
    await arrives();
    expect(screen.queryByTestId('photo-loading')).toBeNull();

    await act(async () => {
      rerender(<Photo uri="https://example.test/second.jpg" className="h-36 w-full" />);
    });

    expect(screen.getByTestId('photo-loading')).toBeTruthy();
  });
});
