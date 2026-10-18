import { useState } from 'react';
import { View } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/shared';
import { useActiveAddress } from '@/features/checkout/hooks/useActiveAddress';
import type { RestaurantSummary } from '@/features/restaurants';
import { useRestaurants } from '@/features/restaurants';

import type { HomeView } from '../lib/homeViews';
import { applyView } from '../lib/homeViews';

import { HomeViewTabs } from './HomeViewTabs';
import { RestaurantPreviewCard } from './RestaurantPreviewCard';

type RestaurantListProps = {
  /** The search field and the carousel, scrolled with the list rather than above it. */
  header: ReactElement;
  refreshing: boolean;
  onRefresh: () => void;
};

/**
 * The tab row is the first item rather than part of the header so it can be
 * sticky: FlashList pins items, not the header component.
 */
type Row =
  { kind: 'tabs' } | { kind: 'restaurant'; restaurant: RestaurantSummary } | { kind: 'empty' };

const keyOf = (row: Row): string => (row.kind === 'restaurant' ? row.restaurant.id : row.kind);

/**
 * Every Restaurant, under the carousel, seen one way at a time — All, Fast
 * delivery, Free delivery, Top rated. A view is a sort or a single filter,
 * never a combination; combining is what the search screen is for (#190).
 *
 * It owns the scrolling for the whole screen: the search field and the carousel
 * ride along as the header, because a FlashList inside a ScrollView virtualises
 * nothing and warns about it.
 *
 * The same request the carousel makes, so the rows come from cache rather than
 * a second round trip.
 */
export function RestaurantList({ header, refreshing, onRefresh }: RestaurantListProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<HomeView>('all');

  const { address } = useActiveAddress();
  const coordinates = address
    ? { latitude: address.latitude, longitude: address.longitude }
    : undefined;
  const { data: restaurants } = useRestaurants(undefined, coordinates);

  const shown = applyView(restaurants ?? [], view);
  const rows: Row[] =
    restaurants === undefined
      ? []
      : [
          { kind: 'tabs' },
          ...(shown.length === 0
            ? [{ kind: 'empty' } as const]
            : shown.map((restaurant) => ({ kind: 'restaurant', restaurant }) as const)),
        ];

  return (
    <FlashList
      data={rows}
      keyExtractor={keyOf}
      getItemType={(row) => row.kind}
      stickyHeaderIndices={[0]}
      renderItem={({ item }) => {
        switch (item.kind) {
          case 'tabs':
            return <HomeViewTabs view={view} onChange={setView} />;
          case 'restaurant':
            return (
              <View className="px-3">
                <RestaurantPreviewCard restaurant={item.restaurant} wide />
              </View>
            );
          case 'empty':
            return (
              <View className="px-3">
                <EmptyState message={t(`home.viewEmpty.${view}`)} />
              </View>
            );
        }
      }}
      ListHeaderComponent={header}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerClassName="pb-6"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
}
