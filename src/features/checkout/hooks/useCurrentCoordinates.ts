import { useCallback, useState } from 'react';

import { usePermissionRequest } from '@/hooks/usePermissionRequest';
import { logError } from '@/lib/logger';
import { PermissionType } from '@/services/permissions';
import type { Coordinates } from '@/utils/distance';

import type { PlaceGuess } from '../lib/placeGuess';
import { placeGuessFrom } from '../lib/placeGuess';

type CoordinatesState = {
  coordinates: Coordinates | null;
  isLocating: boolean;
  /** i18n key, so the screen decides the wording. */
  errorKey: string | null;
  /** The address the device thinks it is at. Empty when nothing came back. */
  guess: PlaceGuess;
};

const INITIAL: CoordinatesState = {
  coordinates: null,
  isLocating: false,
  errorKey: null,
  guess: {},
};

/**
 * The device's position, for deciding which restaurants can reach an address.
 * This is what the location permission asked for during onboarding is for.
 */
export function useCurrentCoordinates() {
  const [state, setState] = useState<CoordinatesState>(INITIAL);
  const { request } = usePermissionRequest();

  const locate = useCallback(async () => {
    setState({ ...INITIAL, isLocating: true });

    try {
      const { status } = await request(PermissionType.Location);
      if (status !== 'granted') {
        setState({ ...INITIAL, errorKey: 'address.locationDenied' });
        return;
      }

      const Location = await import('expo-location');
      const position = await Location.getCurrentPositionAsync({});
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setState({ coordinates, isLocating: false, errorKey: null, guess: {} });

      /*
        A separate, later step on purpose. The map should centre the moment
        there is a fix; a reverse lookup is a network call that can be slow or
        come back with nothing, and in Lahore it often does. Failing it must
        not cost the coordinates, which are the part that matters.
      */
      try {
        const [place] = await Location.reverseGeocodeAsync(coordinates);
        setState((current) => ({ ...current, guess: placeGuessFrom(place) }));
      } catch (error) {
        // The point is placed; only the words are missing.
        logError('checkout.reverseGeocode', error);
      }
    } catch (error) {
      logError('checkout.locate', error);
      setState({ ...INITIAL, errorKey: 'address.locationFailed' });
    }
  }, [request]);

  return { ...state, locate };
}
