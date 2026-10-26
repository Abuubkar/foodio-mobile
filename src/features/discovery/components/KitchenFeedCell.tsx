import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, Text } from '@/components/ui';
import { ClipAuthorLink } from '@/features/clips/components/ClipAuthorLink';
import { useReportClip } from '@/features/clips/hooks/useReportClip';
import { useRestaurantMenu } from '@/features/menu/hooks/useRestaurantMenu';
import type { MenuItem } from '@/features/menu/types/menu.types';
import { useRestaurant } from '@/features/restaurants/hooks/useRestaurant';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useCartStore } from '@/stores/cart.store';
import { selectIsSaved, useSavedStore } from '@/stores/saved.store';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import { useClipPlayback } from '../hooks/useClipPlayback';
import type { Kitchen } from '../lib/kitchens';
import { dishesInClip, primaryAction, requiredGroupName, taggedDish } from '../lib/kitchens';

import { ClipActions } from './ClipActions';
import { ClipChapters } from './ClipChapters';
import { ClipProgress } from './ClipProgress';
import { KitchenHeader } from './KitchenHeader';
import { KitchenMenuDrawer } from './KitchenMenuDrawer';

type KitchenFeedCellProps = {
  kitchen: Kitchen;
  height: number;
  isActive: boolean;
  reduceMotion: boolean;
  /**
   * Raised while the menu is open, so the feed can stop paging. Over-scrolling
   * the drawer otherwise chains into the list and carries you to another
   * kitchen with the first one's menu still open behind you.
   */
  onMenuOpenChange: (open: boolean) => void;
};

/**
 * One kitchen, full screen.
 *
 * Down is the next kitchen; the segments across the top are this one's clips.
 * The foot names the dish rather than the restaurant, because the header above
 * has already said whose kitchen this is — repeating it was the first thing
 * review threw out.
 */
export function KitchenFeedCell({
  kitchen,
  height,
  isActive,
  reduceMotion,
  onMenuOpenChange,
}: KitchenFeedCellProps) {
  const { t, i18n } = useTranslation();
  const { report, isReported } = useReportClip();
  const router = useRouter();
  const guard = useNavigationGuard();
  const insets = useSafeAreaInsets();

  const [chapter, setChapter] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const clip = kitchen.clips[Math.min(chapter, kitchen.clips.length - 1)];

  /*
    Fetch the kitchen's details once it has been looked at, and keep fetching
    after it scrolls away: dropping back to `undefined` would blank a header
    the customer can still see on the way past, and the query is cached so
    returning costs nothing.
  */
  const [seen, setSeen] = useState(isActive);
  useEffect(() => {
    if (isActive) setSeen(true);
  }, [isActive]);

  const { data: restaurant } = useRestaurant(seen ? kitchen.restaurantId : undefined);
  const { data: menu } = useRestaurantMenu(seen ? kitchen.restaurantId : undefined);

  const addItem = useCartStore((state) => state.addItem);
  const isSaved = useSavedStore(selectIsSaved(clip?.id ?? ''));
  const toggleSaved = useSavedStore((state) => state.toggle);
  const isSignedIn = useSessionStore((state) => state.person !== null);

  /* Chapters swap the source on this one player. Everything about keeping it
     from flashing black lives in the hook, which the community cell shares. */
  const { player, isPlaying, hasRenderedFrame, onFirstFrameRender, pausedByTap, togglePlayback } =
    useClipPlayback({ mediaUrl: clip?.mediaUrl, isActive, reduceMotion });

  // A kitchen scrolled away and back opens on its own footage again, with the
  // menu shut: coming back to someone else's open drawer is disorienting.
  useEffect(() => {
    if (isActive) return;
    setChapter(0);
    setMenuOpen(false);
  }, [isActive]);

  useEffect(() => {
    onMenuOpenChange(menuOpen);
  }, [menuOpen, onMenuOpenChange]);

  const dish = menu && clip ? taggedDish(menu, clip) : undefined;
  const inClip = menu && clip ? dishesInClip(menu, clip) : [];
  const primary = primaryAction(dish);
  const alsoHere = inClip.slice(dish ? 1 : 0);

  const currency = restaurant?.currency ?? 'USD';

  const openRestaurant = () => guard(() => router.push(`/restaurant/${kitchen.restaurantId}`));
  const openDish = (item: MenuItem) => guard(() => router.push(`/menu-item/${item.id}`));

  const add = (item: MenuItem) => {
    if (!restaurant) return;
    addItem(
      {
        id: restaurant.id,
        name: restaurant.name,
        currency: restaurant.currency,
        deliveryFeeMinor: restaurant.deliveryFeeMinor,
        deliveryEstimate: restaurant.deliveryEstimate,
      },
      { id: item.id, name: item.name, priceMinor: item.priceMinor, image: item.image },
    );
  };

  /**
   * Saving needs a session. The list lives behind the account sheet, so a
   * signed-out save would land somewhere the person cannot open — and would
   * then be wiped by the next sign-out anyway.
   */
  const save = () => {
    if (!clip) return;
    if (!isSignedIn) {
      guard(() => router.push('/sign-in'));
      return;
    }
    toggleSaved(clip.id);
  };

  const onPrimary = () => {
    if (primary === 'menu') {
      setMenuOpen(true);
      return;
    }
    if (!dish) return;
    if (primary === 'choose') {
      openDish(dish);
      return;
    }
    add(dish);
  };

  /** Price, rating, and whether it needs an answer. Never the kitchen again. */
  const dishLine = dish
    ? [
        formatMoney(dish.priceMinor, currency, i18n.language),
        dish.rating ? `★ ${dish.rating.toFixed(1)}` : undefined,
        requiredGroupName(dish)
          ? t('clips.pickA', { group: requiredGroupName(dish)?.toLowerCase() })
          : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : t('clips.untagged');

  if (!clip) return <View style={{ height }} className="bg-black" />;

  return (
    <View style={{ height }} className="bg-black">
      <VideoView
        player={player}
        style={{ flex: 1 }}
        contentFit="cover"
        nativeControls={false}
        // TextureView: a SurfaceView detached by list recycling goes black and
        // stays black; a TextureView survives the round trip.
        surfaceType="textureView"
        onFirstFrameRender={onFirstFrameRender}
        importantForAccessibility="no"
        accessibilityElementsHidden
      />

      {isPlaying && hasRenderedFrame ? null : (
        <Image
          source={{ uri: clip.thumbnailUrl }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
      )}

      {/* Under every control: later siblings take their own taps. */}
      <Pressable
        onPress={togglePlayback}
        onLongPress={() => report(clip.id)}
        delayLongPress={600}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? t('clips.pause') : t('clips.play')}
        accessibilityHint={t('clips.report.hint')}
        className="absolute inset-0"
      />

      {isReported(clip.id) ? (
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center bg-black/65"
        >
          <Ionicons name="flag" size={22} color={colors.white} />
          <Text variant="caption" className="mt-1 text-white">
            {t('clips.report.reportedShort')}
          </Text>
        </View>
      ) : null}

      {pausedByTap ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-black/50">
            <Ionicons name="play" size={30} color={colors.white} />
          </View>
        </View>
      ) : null}

      {reduceMotion && isActive && !isPlaying ? (
        <Pressable
          onPress={() => player.play()}
          accessibilityRole="button"
          accessibilityLabel={t('clips.play')}
          className="absolute inset-0 items-center justify-center"
        >
          <View className="h-16 w-16 items-center justify-center rounded-full bg-black/50">
            <Ionicons name="play" size={30} color={colors.white} />
          </View>
        </Pressable>
      ) : null}

      {/* Food footage is bright and pale; white text needs the scrim, not luck. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent']}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150 }}
      />

      <View pointerEvents="box-none" style={{ top: insets.top + 8 }} className="absolute inset-x-0">
        <ClipChapters count={kitchen.clips.length} index={chapter} onSelect={setChapter} />
        <View className="mt-2.5">
          <KitchenHeader
            name={kitchen.name}
            restaurant={restaurant}
            onOpenMenu={() => setMenuOpen(true)}
          />
        </View>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.4, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 340 }}
      />

      <ClipProgress player={player} bottomInset={0} />

      <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 px-3.5 pb-5">
        <View className="flex-row flex-wrap items-baseline">
          <Text variant="subheading" className="text-white">
            {dish ? dish.name : clip.caption}
          </Text>
          {dish && alsoHere.length > 0 ? (
            <Text variant="caption" className="text-white/65">
              {` ${t('clips.andMore')}`}
            </Text>
          ) : null}
        </View>

        <Text variant="caption" className="mt-1 text-white/80" numberOfLines={1}>
          {dishLine}
        </Text>

        {/* Under the dish, not over it: the kitchen's header owns the top of
            the cell, and a customer's clip is still about the food first. */}
        <View className="mt-2">
          <ClipAuthorLink clip={clip} onDark />
        </View>

        <ClipActions
          primary={primary}
          isSaved={isSaved}
          onPrimary={onPrimary}
          onSave={save}
          onShare={openRestaurant}
        />

        {alsoHere.length > 0 ? (
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('clips.openMenu', { restaurant: kitchen.name })}
            className="mt-3 rounded-2xl border border-white/15 bg-black/60 px-3 pb-2.5 pt-2 active:bg-black/75"
          >
            <View className="mb-2 items-center">
              <View className="h-1 w-9 rounded-sm bg-white/30" />
            </View>
            <View className="flex-row items-center">
              <View className="flex-row">
                {alsoHere.map((item, index) => (
                  <Photo
                    key={item.id}
                    uri={item.image}
                    className={
                      index === 0
                        ? 'h-7 w-7 rounded-md border border-gray-900'
                        : '-ml-2 h-7 w-7 rounded-md border border-gray-900'
                    }
                  />
                ))}
              </View>
              <Text
                variant="caption"
                className="ml-2.5 flex-1 font-semibold text-white"
                numberOfLines={1}
              >
                {alsoHere.map((item) => item.name).join(', ')}
              </Text>
              <Ionicons name="chevron-up" size={14} color={colors.white} />
            </View>
          </Pressable>
        ) : null}
      </View>

      <KitchenMenuDrawer
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        menu={menu}
        clips={kitchen.clips}
        currency={currency}
        height={height}
        onAdd={add}
        onOpen={openDish}
        reduceMotion={reduceMotion}
      />
    </View>
  );
}
