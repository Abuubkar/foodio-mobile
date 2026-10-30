import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState, SignInRequired } from '@/components/shared';
import { Text } from '@/components/ui';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';

import { SavedClipTile } from '../components/SavedClipTile';
import { SavedDishGroup } from '../components/SavedDishGroup';
import { SavedKitchenGroup } from '../components/SavedKitchenGroup';
import { useSavedClips } from '../hooks/useSavedClips';
import { clipHeading } from '../types/clip.types';

const VIEWS = ['all', 'kitchens', 'dishes'] as const;

type View_ = (typeof VIEWS)[number];

/**
 * Everything the customer kept.
 *
 * A shelf, which is the wrong shape for a feed and the right one for a
 * collection: nothing here needs discovering, so the whole job is comparing
 * things already chosen. Grouped by kitchen on the default tab, because a save
 * is most useful as a way back into the place that cooks it.
 *
 * The three chips are one idea at three levels of grouping: **All** is
 * ungrouped, **Kitchens** groups by the place that cooks it, **Dishes** by the
 * dish itself.
 *
 * Pushed from the account sheet rather than owned by a tab, so it keeps a back
 * affordance and the tab bar stays on Home.
 */
export function SavedClipsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [view, setView] = useState<View_>('kitchens');
  const isSignedIn = useSessionStore((state) => state.person !== null);
  const { clips, kitchens, dishes, untagged, isPending, error, refetch } = useSavedClips();

  const body = () => {
    /* Saving needs a session, so this screen does too. It is normally reached
       from the account sheet, which is already behind one — but the route is
       addressable, and a deep link should not land on an empty shelf that
       looks like "you have saved nothing". */
    if (!isSignedIn) {
      return (
        <SignInRequired
          message={t('saved.signInRequired')}
          className="flex-1 items-center justify-center px-8"
        />
      );
    }
    if (isPending) return <LoadingState className="flex-1 items-center justify-center" />;
    if (error) {
      return (
        <ErrorState
          error={error}
          onRetry={refetch}
          className="flex-1 items-center justify-center px-8"
        />
      );
    }
    if (!clips || clips.length === 0) {
      return (
        <EmptyState
          message={t('saved.empty')}
          className="flex-1 items-center justify-center px-8"
        />
      );
    }

    if (view === 'kitchens') {
      return (
        <FlashList
          data={kitchens ?? []}
          keyExtractor={(kitchen) => kitchen.restaurantId}
          renderItem={({ item }) => <SavedKitchenGroup kitchen={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (view === 'dishes') {
      const untaggedCount = untagged?.length ?? 0;

      return (
        <View className="flex-1">
          {/* Said before the groups, not after: a view that hides a quarter of
              the shelf should admit it where the eye starts, and the way to
              those saves is the chip it offers. */}
          {untaggedCount > 0 ? (
            <Pressable
              onPress={() => setView('all')}
              accessibilityRole="button"
              accessibilityLabel={t('saved.untaggedNote', { count: untaggedCount })}
              accessibilityHint={t('saved.untaggedAction')}
              className="mx-3 mt-3 flex-row items-center rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 active:bg-gray-800"
            >
              <Ionicons name="information-circle-outline" size={14} color={colors.gray[400]} />
              <Text variant="caption" className="ml-1.5 flex-1 text-gray-400">
                {t('saved.untaggedNote', { count: untaggedCount })}
              </Text>
              <Text variant="caption" className="font-semibold text-primary-500">
                {t('saved.untaggedAction')}
              </Text>
            </Pressable>
          ) : null}

          {dishes && dishes.length > 0 ? (
            <FlashList
              data={dishes}
              keyExtractor={(dish) => dish.menuItemId}
              renderItem={({ item }) => <SavedDishGroup dish={item} />}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState
              message={t('saved.noDishes')}
              className="flex-1 items-center justify-center px-8"
            />
          )}
        </View>
      );
    }

    /*
      Ungrouped: no kitchen header means no menu is loaded for these, so the
      tile falls back to the clip's own caption and names the restaurant
      underneath. Loading every kitchen's menu to title a flat grid would be
      several requests for two lines of text.
    */
    const columns = [
      clips.filter((_, index) => index % 2 === 0),
      clips.filter((_, index) => index % 2 === 1),
    ];

    return (
      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row px-3">
          {columns.map((column, columnIndex) => (
            <View key={columnIndex} className={columnIndex === 0 ? 'flex-1' : 'ml-2.5 flex-1'}>
              {column.map((clip, index) => (
                <SavedClipTile
                  key={clip.id}
                  clip={clip}
                  title={clip.caption}
                  subtitle={clipHeading(clip)}
                  tall={(index + columnIndex) % 3 === 0}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-black">
      <View className="border-b border-gray-800 px-3 pb-3 pt-2">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={8}
            className="mr-1.5 h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
          >
            <Ionicons name="chevron-back" size={22} color={colors.gray[200]} />
          </Pressable>

          <Text variant="subheading" className="text-white">
            {t('saved.title')}
          </Text>

          {isSignedIn && clips && clips.length > 0 ? (
            <Text variant="caption" className="ml-2.5 text-gray-400">
              {t('saved.count', {
                clips: t('saved.clipCount', { count: clips.length }),
                kitchens: t('saved.kitchenCount', { count: kitchens?.length ?? 0 }),
              })}
            </Text>
          ) : null}
        </View>

        {isSignedIn && clips && clips.length > 0 ? (
          <View className="mt-3 flex-row">
            {VIEWS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setView(option)}
                accessibilityRole="tab"
                accessibilityState={{ selected: view === option }}
                className={
                  view === option
                    ? 'mr-2 rounded-full bg-white px-3.5 py-1.5'
                    : 'mr-2 rounded-full border border-gray-700 bg-gray-800 px-3.5 py-1.5'
                }
              >
                <Text
                  variant="caption"
                  className={view === option ? 'font-semibold text-gray-900' : 'text-gray-200'}
                >
                  {t(`saved.view.${option}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {body()}
    </View>
  );
}
