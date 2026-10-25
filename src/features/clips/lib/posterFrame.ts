import * as ImageManipulator from 'expo-image-manipulator';
import { createVideoPlayer } from 'expo-video';

/**
 * Half a second in, not zero.
 *
 * The first frame of a phone recording is often the moment before the camera
 * settled: dark, or mid-autofocus. Half a second is past that and still before
 * anything has happened.
 */
const POSTER_AT_SECONDS = 0.5;

/** Enough for a full-screen cell on a phone, small enough to upload. */
const POSTER_MAX_WIDTH = 1080;
const POSTER_QUALITY = 0.8;

/**
 * A still from a video, saved as a JPEG file.
 *
 * A poster matters more than it looks. A feed cell and a review both have to
 * draw something before any decoder runs, and the Saved screen already taught
 * this: without one there is a black rectangle where the clip should be for as
 * long as the video takes to open.
 *
 * `generateThumbnailsAsync` hands back a native image reference rather than a
 * file, which `ImageManipulator` accepts directly — so the bytes are produced
 * the same way `pickAndShrink` produces a photograph's, and the upload path
 * does not have to learn a second kind of source.
 */
export async function posterFrame(videoUri: string): Promise<string> {
  const player = createVideoPlayer(videoUri);

  try {
    const [thumbnail] = await player.generateThumbnailsAsync([POSTER_AT_SECONDS], {
      maxWidth: POSTER_MAX_WIDTH,
    });

    if (!thumbnail) throw new Error('No frame could be read from that video');

    const rendered = await ImageManipulator.ImageManipulator.manipulate(thumbnail).renderAsync();
    const saved = await rendered.saveAsync({
      compress: POSTER_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return saved.uri;
  } finally {
    // A player holds a decoder. Left open, filming three clips in a row holds
    // three — and on Android that is the one resource a phone actually runs out of.
    player.release();
  }
}
