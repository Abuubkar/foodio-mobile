import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';

import { Text } from '@/components/ui';
import type { Clip } from '@/features/discovery/types/clip.types';
import { PersonAvatar } from '@/features/identity/components/PersonAvatar';

type ClipAuthorLinkProps = {
  clip: Clip;
  /** White over a video, the default over a page. */
  onDark?: boolean;
};

/**
 * Who filmed this, and the way to their profile.
 *
 * Only for a customer's clip. A restaurant's own footage has the kitchen
 * header above it, and naming a cook under it would say something about who
 * made the food that nobody has checked.
 *
 * Tappable only when they have a handle, because the profile is addressed by
 * one. Somebody who has not picked one still shows — they just do not link,
 * which is better than a name that does nothing when pressed.
 */
export function ClipAuthorLink({ clip, onDark = false }: ClipAuthorLinkProps) {
  const router = useRouter();

  if (clip.author.kind !== 'customer') return null;

  const { displayName, avatarUrl, handle, personId } = clip.author;
  const nameClass = onDark ? 'text-white' : '';
  const handleClass = onDark ? 'text-white/70' : 'text-neutral-600';

  const body = (
    <View className="flex-row items-center">
      <PersonAvatar displayName={displayName} avatarUrl={avatarUrl} size={28} />
      <View className="ml-2">
        <Text variant="bodyMedium" className={nameClass} numberOfLines={1}>
          {displayName}
        </Text>
        {handle === null ? null : (
          <Text variant="caption" className={handleClass} numberOfLines={1}>
            {`@${handle}`}
          </Text>
        )}
      </View>
    </View>
  );

  if (handle === null) return body;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/profile/[handle]', params: { handle, personId } })}
      accessibilityRole="link"
      accessibilityLabel={displayName}
      hitSlop={6}
    >
      {body}
    </Pressable>
  );
}
