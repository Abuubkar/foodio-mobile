import { FlatList, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { useActiveAddress } from '@/features/checkout/hooks/useActiveAddress';
import { useRestaurants } from '@/features/restaurants';

import { RestaurantPreviewCard } from './RestaurantPreviewCard';
import { SectionHeader } from './SectionHeader';

/** Owns its query so a failure here does not blank the whole screen. */
export function RestaurantCarousel() {
  const { t } = useTranslation();
  const { address } = useActiveAddress();
  const coordinates = address
    ? { latitude: address.latitude, longitude: address.longitude }
    : undefined;
  const { data: restaurants, isPending, error, refetch } = useRestaurants(undefined, coordinates);

  const isEmpty = !isPending && !error && restaurants?.length === 0;

  return (
    <View className="mb-6">
      <SectionHeader title={t('home.restaurants')} />
      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState error={error} onRetry={refetch} /> : null}
      {isEmpty ? <EmptyState message={t('home.noRestaurants')} /> : null}
      {restaurants && restaurants.length > 0 ? (
        /*
          The gutter is content inset, not padding on an ancestor, so the row
          reaches the real screen edge. Inheriting it from the screen clipped
          the row 12dp early and shaved the last few dp off a card that
          otherwise fitted, so the second card's rating arrived cut in half —
          issue #153. A negative margin cannot undo it: Android clips a child
          back to its parent's box whatever margin the child gives itself.
        */
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3"
          renderItem={({ item }) => <RestaurantPreviewCard restaurant={item} />}
        />
      ) : null}
    </View>
  );
}
