import { Platform, View } from 'react-native';

import { AppleMaps, GoogleMaps } from 'expo-maps';

import type { Coordinates } from '@/utils/distance';

/** A shaded circle drawn around a point, as the delivery-area screens use. */
export type MapCircle = {
  center: Coordinates;
  radius: number;
  color: string;
  lineColor: string;
  lineWidth: number;
};

type PinMapProps = {
  /**
   * Drives the camera, and so changes only deliberately: prefilling from GPS,
   * or fitting a newly chosen radius. Driving it from the drag would fight the
   * gesture that produced it.
   */
  camera: { center: Coordinates; zoom: number };
  onMove: (center: Coordinates) => void;
  circles?: MapCircle[];
};

/**
 * The map and the pin that never moves.
 *
 * The pin is chrome rather than a map object: it sits dead centre, and the
 * world moves under it. That makes placing yourself a gesture instead of a
 * form field, which is the whole of t8's answer — and the reason the
 * claim-a-Restaurant screen is the strongest in the app.
 *
 * Shared because a delivery address needs exactly the same gesture and none of
 * the delivery-area circle. See issue #160: reuse the pattern rather than
 * inventing a second one.
 */
export function PinMap({ camera, onMove, circles = [] }: PinMapProps) {
  const cameraPosition = { coordinates: camera.center, zoom: camera.zoom };

  // expo-maps reports both coordinates as optional; a half-move is not a move.
  const report = (coordinates: { latitude?: number; longitude?: number }) => {
    const { latitude, longitude } = coordinates;
    if (latitude === undefined || longitude === undefined) return;
    onMove({ latitude, longitude });
  };

  return (
    <View className="flex-1">
      {Platform.OS === 'ios' ? (
        <AppleMaps.View
          style={{ flex: 1 }}
          cameraPosition={cameraPosition}
          circles={circles}
          onCameraMove={(event) => report(event.coordinates)}
        />
      ) : (
        <GoogleMaps.View
          style={{ flex: 1 }}
          cameraPosition={cameraPosition}
          circles={circles}
          onCameraMove={(event) => report(event.coordinates)}
        />
      )}

      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <View className="h-6 w-6 rounded-full border-4 border-white bg-primary-500 shadow" />
      </View>
    </View>
  );
}
