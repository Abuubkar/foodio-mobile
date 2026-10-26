import { apiClient } from '@/api/client';
import { parseResponse } from '@/api/parse';
import type { PhotoContentType, SignedUpload } from '@/features/photos/types/photo.types';
import { signedUploadSchema } from '@/features/photos/types/photo.types';

import type { IdentityProvider, Person, PublicProfile, Session } from '../types/identity.types';
import { personSchema, publicProfileSchema, sessionSchema } from '../types/identity.types';

/**
 * Hands the provider's signed token to the API, which verifies it against
 * Google's or Apple's own keys before believing a word of it. The app never
 * sends an email address and asks the server to trust it.
 */
export async function signInWithProvider(input: {
  provider: IdentityProvider;
  idToken: string;
  /** Apple only, first sign-in only — Apple sends the name once and never again. */
  displayName?: string;
}): Promise<Session> {
  const { data } = await apiClient.post<unknown>('/auth/provider', {
    provider: input.provider,
    idToken: input.idToken,
    ...(input.displayName ? { displayName: input.displayName } : {}),
  });
  return parseResponse(sessionSchema, data, 'POST /auth/provider');
}

/**
 * The client never attaches an access token to `/auth/*` (see `api/client.ts`),
 * so a stale one from the old session cannot be presented — and rejected —
 * here.
 */
export async function refreshSession(refreshToken: string): Promise<Session> {
  const { data } = await apiClient.post<unknown>('/auth/refresh', { refreshToken });
  return parseResponse(sessionSchema, data, 'POST /auth/refresh');
}

/** Revokes the whole token family server-side. Best-effort: local sign-out never waits on it. */
export async function signOutSession(refreshToken: string): Promise<void> {
  await apiClient.post<unknown>('/auth/sign-out', { refreshToken });
}

export async function fetchMe(): Promise<Person> {
  const { data } = await apiClient.get<unknown>('/me');
  return parseResponse(personSchema, data, 'GET /me');
}

export type MeUpdate = {
  displayName?: string;
  phone?: string;
  handle?: string;
  /**
   * A path from `signAvatarUpload`, never a URL. An avatar a client could name
   * by URL is an avatar that can be somebody else's photograph, or a tracker
   * on every feed cell they appear in. See backend ADR-0023.
   */
  avatarPath?: string;
};

export async function updateMe(update: MeUpdate): Promise<Person> {
  const { data } = await apiClient.patch<unknown>('/me', update);
  return parseResponse(personSchema, data, 'PATCH /me');
}

/** Signs a place to PUT a person's own photograph. */
export async function signAvatarUpload(contentType: PhotoContentType): Promise<SignedUpload> {
  const { data } = await apiClient.post<unknown>('/avatar-uploads', { contentType });
  return parseResponse(signedUploadSchema, data, 'POST /avatar-uploads');
}

/** Anybody's profile, by the handle that addresses it. Public. */
export async function fetchProfile(handle: string): Promise<PublicProfile> {
  const endpoint = `/profiles/${encodeURIComponent(handle)}`;
  const { data } = await apiClient.get<unknown>(endpoint);
  return parseResponse(publicProfileSchema, data, `GET ${endpoint}`);
}
