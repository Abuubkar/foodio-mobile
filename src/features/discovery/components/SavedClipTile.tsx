import { Pressable, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo, Text } from '@/components/ui';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';

import type { Clip } from '../types/clip.types';
import { isOwnClip } from '../types/clip.types';

type SavedClipTileProps = {
  clip: Clip;
  /** The dish where a menu is loaded, the caption where one is not. */
  title: string;
  /** Price under a kitchen's header; the kitchen's name without one. */
  subtitle: string | undefined;
  /** Taller tiles break the grid's rhythm so the eye has somewhere to rest. */
  tall: boolean;
};

/**
 * One saved clip, as a poster.
 *
 * A poster rather than video on purpose: a wall of autoplaying tiles is the
 * decoder pressure the clips feed already fought on the A15, and on a screen
 * whose whole job is comparison, nine things moving at once is worse than
 * nine things still.
 *
 * The badge says "Yours" only when this person held the camera. Another
 * customer's clip gets no badge rather than a second author line: who filmed
 * it is the parent's to say — the Dishes tab already titles each tile with it —
 * and the badge means one thing.
 */
export function SavedClipTile({ clip, title, subtitle, tall }: SavedClipTileProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();
  const personId = useSessionStore((state) => state.person?.id ?? null);

  return (
    <Pressable
      onPress={() => guard(() => router.push(`/clip/${clip.id}`))}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="mb-2.5 overflow-hidden rounded-2xl bg-gray-800 active:opacity-80"
    >
      <Photo uri={clip.thumbnailUrl} className={tall ? 'h-56 w-full' : 'h-44 w-full'} />

      <View className="absolute left-2 top-2 h-6 w-6 items-center justify-center rounded-full bg-black/55">
        <Ionicons name="play" size={12} color={colors.white} />
      </View>

      {isOwnClip(clip, personId) ? (
        <View className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5">
          <Text variant="caption" className="font-bold text-emerald-950">
            {t('saved.yours')}
          </Text>
        </View>
      ) : null}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.88)']}
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 72 }}
      />

      <View className="absolute inset-x-0 bottom-0 px-2.5 pb-2">
        <Text variant="caption" className="font-semibold text-white" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" className="text-white/75" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
