import { useState } from 'react';
import { Platform } from 'react-native';

import * as AppleAuthentication from 'expo-apple-authentication';

import { GoogleOneTapSignIn } from 'react-native-nitro-google-signin';

import { useSessionStore } from '@/stores/session.store';

import { signInWithProvider } from '../api/identity.api';
import type { IdentityProvider } from '../types/identity.types';

type TokenResult = { idToken: string; displayName?: string };

/**
 * The web client id, not the Android one — Credential Manager asks Google for a
 * token addressed to it, and the API checks that same audience. Configured once
 * per process, lazily, so a build without the value fails at the tap rather
 * than at startup on a screen nobody signed in from.
 */
let configured = false;

function configureGoogle(): void {
  if (configured) return;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) {
    throw new Error(
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is unset — Google sign-in cannot be offered.',
    );
  }

  GoogleOneTapSignIn.configure({ webClientId, scopes: ['email'] });
  configured = true;
}

/**
 * Whether this build offers the dev door at all.
 *
 * Two gates, both compile-time-ish: `__DEV__` is false in any release build,
 * and the flag has to be set on purpose. The API is the real guard — it
 * refuses `dev` unless its own switch is on — but a release binary should not
 * even draw the button.
 */
export const devSignInOffered = __DEV__ && process.env.EXPO_PUBLIC_DEV_SIGN_IN?.trim() === 'true';

/** Apple hands over a name only on the very first sign-in, in pieces. */
function nameFrom(
  credential: AppleAuthentication.AppleAuthenticationCredential,
): string | undefined {
  const parts = [credential.fullName?.givenName, credential.fullName?.familyName].filter(
    (part): part is string => typeof part === 'string' && part.trim() !== '',
  );

  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * The two ways in. Both end the same way: a token this app cannot forge, handed
 * to the API, which verifies it against the provider's own keys — the backend's
 * ADR-0019.
 *
 * A cancelled sheet is not an error. Somebody who changes their mind should see
 * the screen they came from rather than a red message about what went wrong,
 * which is why the token step may answer `null`.
 */
export function useProviderSignIn() {
  const signIn = useSessionStore((state) => state.signIn);
  const [pending, setPending] = useState<IdentityProvider | null>(null);
  const [error, setError] = useState<unknown>(null);

  /**
   * Answers whether a session now exists, so a caller can navigate on success
   * and only on success. Returning nothing would make a cancelled sheet and a
   * completed sign-in indistinguishable — which is exactly the bug found by
   * tapping the button on a device with no Google account: the screen closed,
   * no error was ever seen, and the Person was still signed out.
   */
  const run = async (
    provider: IdentityProvider,
    token: () => Promise<TokenResult | null>,
  ): Promise<boolean> => {
    setPending(provider);
    setError(null);

    try {
      const result = await token();
      if (result === null) return false;

      const session = await signInWithProvider({ provider, ...result });
      await signIn(session);
      return true;
    } catch (caught) {
      setError(caught);
      return false;
    } finally {
      setPending(null);
    }
  };

  return {
    pending,
    error,
    /** iOS only: Apple ships no Android sheet, and Android has no Apple account. */
    appleAvailable: Platform.OS === 'ios',

    google: (): Promise<boolean> =>
      run('google', async () => {
        configureGoogle();

        // The quiet path first: it signs in an already-authorised account with
        // no picker at all. `noSavedCredentialFound` is not a refusal — it means
        // there is nobody to offer yet — so the explicit sheet follows, which is
        // also where a Person adds a Google account to the device.
        const quiet = await GoogleOneTapSignIn.signIn();
        const result =
          quiet.type === 'noSavedCredentialFound'
            ? await GoogleOneTapSignIn.presentExplicitSignIn()
            : quiet;

        // Changing your mind is not an error, and says nothing on screen.
        if (result.type === 'cancelled') return null;

        const idToken = result.data?.idToken;
        if (typeof idToken !== 'string' || idToken === '') {
          // Everything else is: a device with no Google account reaches here,
          // and silence would leave the button looking broken.
          throw new Error('No Google account is available on this device.');
        }

        return { idToken };
      }),

    apple: (): Promise<boolean> =>
      run('apple', async () => {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        const idToken = credential.identityToken;
        if (idToken === null) return null;

        const displayName = nameFrom(credential);
        return displayName === undefined ? { idToken } : { idToken, displayName };
      }),

    /**
     * The local door. No sheet, no provider, no network beyond our own API.
     *
     * The handle is both the identity and the person picker: the same handle
     * is the same person every time, so a test can place an order, restart,
     * sign back in and still own it.
     */
    dev: (handle: string): Promise<boolean> =>
      run('dev', () => Promise.resolve({ idToken: handle.trim() })),
  };
}
