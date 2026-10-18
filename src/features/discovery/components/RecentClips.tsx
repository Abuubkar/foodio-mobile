import { FlatList, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useClips } from '../hooks/useClips';

import { ClipCard } from './ClipCard';
import { SectionHeader } from './SectionHeader';

/** A shelf, not a feed: the Clips tab is where the whole thing lives. */
const SHELF_LENGTH = 10;

/**
 * The newest Clips, on the surface whose job is Discovery. They are the
 * evidence layer — a Restaurant's own Clip is the claim, a customer's is backed
 * by a delivered Order — and behind the Clips tab alone, a customer who never
 * taps that tab never learns they exist.
 *
 * Renders nothing when there is nothing, and nothing when the request fails:
 * this is a supplementary shelf, and an error card here would sit between the
 * carousel and the Restaurants over something nobody asked for.
 */
export function RecentClips() {
  const { t } = useTranslation();
  const { data: clips } = useClips();

  const shelf = clips?.slice(0, SHELF_LENGTH) ?? [];
  if (shelf.length === 0) return null;

  return (
    <View className="mb-6">
      <SectionHeader title={t('home.recentClips')} />
      <FlatList
        data={shelf}
        keyExtractor={(clip) => clip.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-3"
        renderItem={({ item }) => <ClipCard clip={item} />}
      />
    </View>
  );
}
