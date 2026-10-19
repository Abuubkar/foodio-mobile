import { useCallback, useRef, useState } from 'react';
import { FlatList, View, type ViewToken } from 'react-native';

import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { useReduceMotion } from '@/hooks/useReduceMotion';

import { ClipEndCard } from '../components/ClipEndCard';
import { KitchenFeedCell } from '../components/KitchenFeedCell';
import { useClips } from '../hooks/useClips';
import type { Kitchen } from '../lib/kitchens';
import { kitchensFrom } from '../lib/kitchens';

type FeedItem = { kind: 'kitchen'; kitchen: Kitchen } | { kind: 'end' };

const keyOf = (item: FeedItem): string =>
  item.kind === 'kitchen' ? item.kitchen.restaurantId : 'end';

export function ClipsFeedScreen() {
  const { t } = useTranslation();
  const reduceMotion = useReduceMotion();
  const { data: clips, isPending, error, refetch, fetchNextPage, hasNextPage } = useClips();

  const [activeIndex, setActiveIndex] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  /** The feed must hold still while a kitchen's menu is up. */
  const [menuOpen, setMenuOpen] = useState(false);

  // One threshold only — setting both throws (RN source, via #23).
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActiveIndex(first.index);
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) =>
      item.kind === 'end' ? (
        <ClipEndCard height={pageHeight} />
      ) : (
        <KitchenFeedCell
          kitchen={item.kitchen}
          height={pageHeight}
          isActive={index === activeIndex}
          reduceMotion={reduceMotion}
          onMenuOpenChange={setMenuOpen}
        />
      ),
    [pageHeight, activeIndex, reduceMotion],
  );

  if (isPending) {
    return <LoadingState className="flex-1 items-center justify-center bg-white" />;
  }
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={refetch}
        className="flex-1 items-center justify-center bg-white px-8"
      />
    );
  }
  if (!clips || clips.length === 0) {
    return (
      <EmptyState
        message={t('clips.empty')}
        className="flex-1 items-center justify-center bg-white px-8"
      />
    );
  }

  /*
    The feed scrolls through kitchens, not clips. Grouping happens here, over
    everything loaded so far, so a later page can still add a chapter to a
    kitchen already on screen rather than repeating it further down.
  */
  const items: FeedItem[] = [
    ...kitchensFrom(clips).map((kitchen) => ({ kind: 'kitchen', kitchen }) as FeedItem),
    // The end card means the true end of the feed, not just this page's tail.
    ...(hasNextPage === false ? [{ kind: 'end' } as FeedItem] : []),
  ];

  return (
    <View className="flex-1 bg-black" onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}>
      {pageHeight > 0 ? (
        <FlatList
          data={items}
          keyExtractor={keyOf}
          renderItem={renderItem}
          pagingEnabled
          scrollEnabled={!menuOpen}
          showsVerticalScrollIndicator={false}
          // 5, not 3: neighbours stay mounted through a fast fling, so a fresh
          // cell's black flash cannot outrun the scroll.
          windowSize={5}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          // Explicit: Android defaults this ON, and a clipped cell's video
          // surface dies under it.
          removeClippedSubviews={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onEndReached={() => {
            if (hasNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
        />
      ) : null}
    </View>
  );
}
