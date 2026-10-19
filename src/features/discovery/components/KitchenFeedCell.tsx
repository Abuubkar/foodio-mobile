import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, Text } from '@/components/ui';
import { useRestaurantMenu } from '@/features/menu/hooks/useRestaurantMenu';
import type { MenuItem } from '@/features/menu/types/menu.types';
import { useRestaurant } from '@/features/restaurants/hooks/useRestaurant';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useCartStore } from '@/stores/cart.store';
import { usePlaybackStore } from '@/stores/playback.store';
import { selectIsSaved, useSavedStore } from '@/stores/saved.store';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

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
};

/**
 * One kitchen, full screen.
 *
 * Down is the next kitchen; the segments across the top are this one's clips.
 * The foot names the dish rather than the restaurant, because the header above
 * has already said whose kitchen this is — repeating it was the first thing
 * review threw out.
 */
export function KitchenFeedCell({ kitchen, height, isActive, reduceMotion }: KitchenFeedCellProps) {
  const { t, i18n } = useTranslation();
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

  const muted = usePlaybackStore((state) => state.muted);
  const addItem = useCartStore((state) => state.addItem);
  const isSaved = useSavedStore(selectIsSaved(clip?.id ?? ''));
  const toggleSaved = useSavedStore((state) => state.toggle);

  const player = useVideoPlayer(clip?.mediaUrl ?? null, (instance) => {
    instance.loop = true;
    instance.audioMixingMode = 'auto';
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const [pausedByTap, setPausedByTap] = useState(false);
  // "Playing" is ExoPlayer's clock, not its canvas. The poster must outlive
  // play() until pixels actually land, or the cell flashes black.
  const [hasRenderedFrame, setHasRenderedFrame] = useState(false);

  /*
    Chapters swap the source on one player rather than mounting a second.
    `replaceAsync` loads off the UI thread — `replace` blocks it on iOS, and
    this runs on a tap. The poster latch drops because the first frame of the
    new track has not arrived yet.
  */
  const mediaUrl = clip?.mediaUrl;
  useEffect(() => {
    if (!mediaUrl) return;
    setHasRenderedFrame(false);
    void player.replaceAsync(mediaUrl);
  }, [player, mediaUrl]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    player.loop = !reduceMotion;
    player.timeUpdateEventInterval = 0.25;
    setPausedByTap(false);

    if (!isActive) {
      player.pause();
      player.currentTime = 0;
      return;
    }
    if (!reduceMotion) player.play();
  }, [player, isActive, reduceMotion]);

  // A kitchen scrolled away and back opens on its own footage again.
  useEffect(() => {
    if (!isActive) setChapter(0);
  }, [isActive]);

  const togglePlayback = () => {
    if (player.playing) {
      player.pause();
      setPausedByTap(true);
      return;
    }
    player.play();
    setPausedByTap(false);
  };

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
        onFirstFrameRender={() => setHasRenderedFrame(true)}
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
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? t('clips.pause') : t('clips.play')}
        className="absolute inset-0"
      />

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

        <ClipActions
          primary={primary}
          isSaved={isSaved}
          onPrimary={onPrimary}
          onSave={() => toggleSaved(clip.id)}
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
