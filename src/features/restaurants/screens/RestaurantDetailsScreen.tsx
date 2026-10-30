import { useCallback, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { CART_BAR_CLEARANCE, CartBar, type CartRestaurant } from '@/features/cart';
import { PostClipRow } from '@/features/clips/components/PostClipRow';
// Deep import, not the barrel: discovery's barrel pulls RestaurantCarousel,
// which imports this feature back — a require cycle Metro warns about.
import { RestaurantClips } from '@/features/discovery/components/RestaurantClips';
import { Menu, MenuCategoryChips, useRestaurantMenu } from '@/features/menu';

import { RestaurantAbout } from '../components/RestaurantAbout';
import { RestaurantBackButton } from '../components/RestaurantBackButton';
import { RestaurantGallery } from '../components/RestaurantGallery';
import { RestaurantHero } from '../components/RestaurantHero';
import { RestaurantHours } from '../components/RestaurantHours';
import { RestaurantInfo } from '../components/RestaurantInfo';
import { RestaurantReviewPreview } from '../components/RestaurantReviewPreview';
import { useOpeningNotice } from '../hooks/useOpeningNotice';
import { useRestaurant } from '../hooks/useRestaurant';

/** How far above a section's top the chips sit once they are pinned. */
const CHIP_ROW_HEIGHT = 52;

export function RestaurantDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: restaurant, isPending, error, refetch } = useRestaurant(id);
  // Cached: the Menu itself already asked for this.
  const { data: categories } = useRestaurantMenu(id);

  // Before the early returns: a hook. An empty schedule reads as open, which
  // is harmless while the page is still loading.
  const { opensText } = useOpeningNotice(restaurant ?? { openingHours: [], timezone: 'UTC' });

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef(new Map<string, number>());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Where the chip row sits in the content; past it, the row is pinned and
  // shares the top edge with the floating back button.
  const chipsY = useRef(0);
  const [chipsPinned, setChipsPinned] = useState(false);

  const rememberSection = useCallback((categoryId: string, y: number) => {
    offsets.current.set(categoryId, y);
  }, []);

  const scrollToCategory = (categoryId: string) => {
    const y = offsets.current.get(categoryId);
    if (y === undefined) return;

    setActiveCategoryId(categoryId);
    scrollRef.current?.scrollTo({ y: y - CHIP_ROW_HEIGHT, animated: true });
  };

  /** The last section the pinned row has passed is the one being read. */
  const trackActiveCategory = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;
    const pinned = offset >= chipsY.current;
    if (pinned !== chipsPinned) setChipsPinned(pinned);

    const y = offset + CHIP_ROW_HEIGHT + 1;

    // Above the first section nothing has been passed yet, and an empty row
    // reads as broken — the first category is what a customer is looking at.
    let current: string | null = categories?.[0]?.id ?? null;
    for (const category of categories ?? []) {
      const top = offsets.current.get(category.id);
      if (top !== undefined && top <= y) current = category.id;
    }

    if (current !== activeCategoryId) setActiveCategoryId(current);
  };

  if (isPending) {
    return (
      <RestaurantDetailsShell>
        <LoadingState className="flex-1 items-center justify-center" />
      </RestaurantDetailsShell>
    );
  }

  if (error) {
    return (
      <RestaurantDetailsShell>
        <ErrorState
          error={error}
          onRetry={refetch}
          className="flex-1 items-center justify-center px-8"
        />
      </RestaurantDetailsShell>
    );
  }

  if (!restaurant) {
    return (
      <RestaurantDetailsShell>
        <EmptyState
          message={t('restaurant.notFound')}
          className="flex-1 items-center justify-center px-8"
        />
      </RestaurantDetailsShell>
    );
  }

  const cartRestaurant: CartRestaurant = {
    id: restaurant.id,
    name: restaurant.name,
    currency: restaurant.currency,
    deliveryFeeMinor: restaurant.deliveryFeeMinor,
    deliveryEstimate: restaurant.deliveryEstimate,
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: CART_BAR_CLEARANCE }}
        // Index 2: the chips, so they pin at the top once the photograph and
        // the name scroll away.
        stickyHeaderIndices={[2]}
        onScroll={trackActiveCategory}
        scrollEventThrottle={16}
      >
        <RestaurantHero image={restaurant.image} name={restaurant.name} />
        <View className="border-b border-gray-100">
          <RestaurantInfo restaurant={restaurant} />
        </View>
        <View onLayout={(event) => (chipsY.current = event.nativeEvent.layout.y)}>
          <MenuCategoryChips
            categories={categories ?? []}
            activeId={activeCategoryId}
            onSelect={scrollToCategory}
            leadingInset={chipsPinned}
          />
        </View>
        <Menu
          restaurant={cartRestaurant}
          onSectionLayout={rememberSection}
          {...(opensText === null ? {} : { closedNotice: opensText })}
        />
        {/* After the menu — people came to order; the clips argue for it (#26). */}
        <RestaurantClips restaurantId={restaurant.id} restaurantName={restaurant.name} />
        {/* Under the shelf it feeds, and standing on its own: the shelf above
            draws nothing until somebody has posted the first one. */}
        <PostClipRow restaurantId={restaurant.id} restaurantName={restaurant.name} />
        <RestaurantAbout description={restaurant.description} />
        <RestaurantGallery images={restaurant.gallery} />
        <RestaurantHours openingHours={restaurant.openingHours} />
        <RestaurantReviewPreview restaurantId={restaurant.id} reviews={restaurant.reviews} />
      </ScrollView>
      <RestaurantBackButton />
      <CartBar />
    </View>
  );
}

function RestaurantDetailsShell({ children }: PropsWithChildren) {
  return (
    <View className="flex-1 bg-white">
      <RestaurantBackButton />
      {children}
    </View>
  );
}
