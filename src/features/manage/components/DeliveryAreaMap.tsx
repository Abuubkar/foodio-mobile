import { PinMap } from '@/components/shared';
import { colors } from '@/theme';
import type { Coordinates } from '@/utils/distance';

type DeliveryAreaMapProps = {
  /** Where the pin is right now — the circle follows this, drag by drag. */
  point: Coordinates;
  /**
   * Drives the camera, and so changes only deliberately: prefilling from GPS,
   * or fitting a newly chosen radius. Driving it from the drag would fight the
   * gesture that produced it.
   */
  camera: { center: Coordinates; zoom: number };
  radiusMeters: number;
  onMove: (center: Coordinates) => void;
};

/**
 * The delivery area: a `PinMap` with the reach drawn around it.
 *
 * The map and the never-moving pin live in `PinMap`, because a delivery
 * address wants the same gesture without a circle. What is left here is the
 * one thing that is about delivery areas.
 */
export function DeliveryAreaMap({ point, camera, radiusMeters, onMove }: DeliveryAreaMapProps) {
  const circles = [
    {
      center: point,
      radius: radiusMeters,
      color: 'rgba(249,115,22,0.18)',
      lineColor: colors.primary[500],
      lineWidth: 2,
    },
  ];

  return <PinMap camera={camera} onMove={onMove} circles={circles} />;
}
