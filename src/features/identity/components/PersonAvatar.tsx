import { View } from 'react-native';

import { Photo, Text } from '@/components/ui';

import { initialsOf } from '../lib/initials';

type PersonAvatarProps = {
  displayName: string;
  avatarUrl: string;
  /** Diameter in pixels. The initials scale with it. */
  size?: number;
};

/**
 * A person's face, or their initials when there is no photograph.
 *
 * Never a stock avatar: the same rule restaurant photographs follow, where no
 * picture means no picture. A generic face is a small lie about a real person,
 * and it makes every profile without one look like the same profile.
 */
export function PersonAvatar({ displayName, avatarUrl, size = 40 }: PersonAvatarProps) {
  // Inline because the diameter is a prop; everything else is a class.
  const frame = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View className="overflow-hidden bg-neutral-200" style={frame}>
      {avatarUrl === '' ? (
        <View className="flex-1 items-center justify-center">
          <Text variant="label" style={{ fontSize: Math.round(size * 0.38) }}>
            {initialsOf(displayName)}
          </Text>
        </View>
      ) : (
        <Photo uri={avatarUrl} className="h-full w-full" />
      )}
    </View>
  );
}
