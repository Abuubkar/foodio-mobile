import { Pressable, View } from 'react-native';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { ClipAuthorLink } from '@/features/clips/components/ClipAuthorLink';
import { ClipRemovedOverlay } from '@/features/clips/components/ClipRemovedOverlay';
import { RemoveClipButton } from '@/features/clips/components/RemoveClipButton';
import { useRemoveClip } from '@/features/clips/hooks/useRemoveClip';
import { useReportClip } from '@/features/clips/hooks/useReportClip';
import { canRemoveClip } from '@/features/clips/lib/ownClip';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { selectIsSaved, useSavedStore } from '@/stores/saved.store';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';

import { useClipPlayback } from '../hooks/useClipPlayback';
import type { Clip } from '../types/clip.types';

import { ClipProgress } from './ClipProgress';

type CommunityFeedCellProps = {
  clip: Clip;
  height: number;
  isActive: boolean;
  reduceMotion: boolean;
};

/**
 * One clip that belongs to no kitchen, full screen.
 *
 * **Not a degraded kitchen cell.** That one is built around a restaurant: a
 * header with its delivery estimate, a dish with a price, Add or Choose, and a
 * drawer holding its menu. A community clip has none of those, and drawing
 * empty furniture where they would be is worse than not drawing it — so this
 * is a second cell rather than the first one with its middle removed.
 *
 * What it keeps is everything that is about the clip rather than the kitchen:
 * the same player, the same poster latch, saving, and press-and-hold to
 * report. The person is the header, because there is nobody else it could be.
 */
export function CommunityFeedCell({
  clip,
  height,
  isActive,
  reduceMotion,
}: CommunityFeedCellProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();
  const insets = useSafeAreaInsets();

  const { report, isReported } = useReportClip();
  const { remove, isRemoved, isRemoving } = useRemoveClip();
  const isSaved = useSavedStore(selectIsSaved(clip.id));
  const toggleSaved = useSavedStore((state) => state.toggle);
  const person = useSessionStore((state) => state.person);
  const isSignedIn = person !== null;
  const canRemove = canRemoveClip(clip, person);

  const { player, isPlaying, hasRenderedFrame, onFirstFrameRender, pausedByTap, togglePlayback } =
    useClipPlayback({ mediaUrl: clip.mediaUrl, isActive, reduceMotion });

  /** Saving needs a session: the list lives behind the account sheet. */
  const save = () => {
    if (!isSignedIn) {
      guard(() => router.push('/sign-in'));
      return;
    }
    toggleSaved(clip.id);
  };

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

      {pausedByTap ? (
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-black/50">
            <Ionicons name="play" size={30} color={colors.white} />
          </View>
        </View>
      ) : null}

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

      {isRemoved(clip.id) ? <ClipRemovedOverlay /> : null}

      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 150 }}
      />

      <View
        pointerEvents="box-none"
        style={{ top: insets.top + 8 }}
        className="absolute inset-x-0 flex-row items-center justify-between px-3.5"
      >
        <ClipAuthorLink clip={clip} onDark />

        {/* Opposite the byline, which is the only other thing up here: there
            is no kitchen header to crowd, and the foot belongs to saving. */}
        {canRemove && !isRemoved(clip.id) ? (
          <RemoveClipButton onPress={() => remove(clip.id)} isRemoving={isRemoving} />
        ) : null}
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.4, 1]}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 280 }}
      />

      <ClipProgress player={player} bottomInset={0} />

      <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 px-3.5 pb-5">
        {clip.caption === '' ? null : (
          <Text variant="subheading" className="text-white">
            {clip.caption}
          </Text>
        )}

        {/* One action, not three. There is no dish to add and no menu to open,
            and a rail of disabled controls says the cell is broken. */}
        <View className="mt-3 flex-row">
          <Pressable
            onPress={save}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? t('clips.unsave') : t('clips.save')}
            className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
            hitSlop={8}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={colors.white}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
