import * as ImagePicker from 'expo-image-picker';

/** Long enough to show a dish, short enough to upload on mobile data. */
export const MAX_CLIP_SECONDS = 30;

export type RecordedClip = {
  /** A local file. Already a progressive MP4 — see below. */
  uri: string;
  durationSeconds: number;
};

/**
 * Opens the camera and hands back what was filmed.
 *
 * **Record, do not browse**, and that is the whole reason there is no
 * transcoder in this app. Both cameras already produce H.264/AAC in an MP4
 * container, which is exactly what ADR-0005 asks for, so constraining the
 * input removes the need to fix the output. A clip from the library can be any
 * container — HEVC, ProRes, whatever a desktop exported — and fixing that
 * means a native transcoder, a custom dev build, and a step that can fail
 * after the person has already waited.
 *
 * It is the same trick `pickAndShrink` plays with photographs by re-encoding
 * everything to JPEG, one step earlier.
 *
 * The length cap is passed to the picker rather than checked afterwards, so a
 * person cannot film for two minutes and then be told it was wasted.
 *
 * `undefined` means they backed out, which is not an error.
 */
export async function recordClip(): Promise<RecordedClip | undefined> {
  const filmed = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: MAX_CLIP_SECONDS,
    quality: 1,
  });

  const asset = filmed.canceled ? undefined : filmed.assets[0];
  if (!asset) return undefined;

  return { uri: asset.uri, durationSeconds: durationOf(asset.duration) };
}

/**
 * The picker reports duration in **milliseconds**, and `null` when it could
 * not read one.
 *
 * Rounded up and floored at one second, because the server refuses a
 * non-positive duration — and a clip that really is under a second is better
 * described as one second than rejected after it has been filmed and uploaded.
 */
export function durationOf(milliseconds: number | null | undefined): number {
  if (milliseconds === null || milliseconds === undefined) return 1;

  return Math.max(1, Math.min(MAX_CLIP_SECONDS, Math.ceil(milliseconds / 1000)));
}
