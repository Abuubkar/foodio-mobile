import { apiClient } from '@/api/client';
import type { Page } from '@/api/page';
import { parsePage } from '@/api/page';
import { parseResponse } from '@/api/parse';

import type { Clip } from '../types/clip.types';
import { clipListSchema } from '../types/clip.types';

export async function fetchClipsPage(cursor?: string): Promise<Page<Clip>> {
  const cursorParam = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
  const { data, headers } = await apiClient.get<unknown>(
    `/clips?_sort=postedAt&_order=desc${cursorParam}`,
  );
  return parsePage(clipListSchema, data, headers['x-next-cursor'], 'GET /clips');
}

export async function fetchClipsByRestaurant(restaurantId: string): Promise<Clip[]> {
  const { data } = await apiClient.get<unknown>(
    `/clips?restaurantId=${encodeURIComponent(restaurantId)}&_sort=postedAt&_order=desc`,
  );
  return parseResponse(clipListSchema, data, 'GET /clips?restaurantId');
}

export async function fetchClipsByMenuItem(menuItemId: string): Promise<Clip[]> {
  const { data } = await apiClient.get<unknown>(
    `/clips?menuItemId=${encodeURIComponent(menuItemId)}&_sort=postedAt&_order=desc`,
  );
  return parseResponse(clipListSchema, data, 'GET /clips?menuItemId');
}

export async function fetchClipsByPerson(personId: string): Promise<Clip[]> {
  const { data } = await apiClient.get<unknown>(
    `/clips?personId=${encodeURIComponent(personId)}&_sort=postedAt&_order=desc`,
  );
  return parseResponse(clipListSchema, data, 'GET /clips?personId');
}

/**
 * The clips behind a batch of saved ids.
 *
 * The API answers `?ids=a,b,c` in its own order, so the caller restores save
 * order itself. It rejects an empty batch, which is why this returns early
 * rather than asking — an empty list is a question not worth a round trip.
 */
export async function fetchClipsByIds(ids: readonly string[]): Promise<Clip[]> {
  if (ids.length === 0) return [];

  const { data } = await apiClient.get<unknown>(
    `/clips?ids=${ids.map(encodeURIComponent).join(',')}`,
  );
  return parseResponse(clipListSchema, data, 'GET /clips?ids');
}
