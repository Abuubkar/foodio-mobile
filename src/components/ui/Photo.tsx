import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { cn } from '@/lib/cn';

type PhotoProps = {
  /** Empty means there is no photograph — not that one failed to load. */
  uri: string;
  /** Sizing and shape of the frame. The image always fills it. */
  className?: string;
  accessibilityLabel?: string;
};

/** One pass of the highlight. Slow enough to read as waiting, not as a flicker. */
const SWEEP_MS = 1200;

/**
 * A highlight crossing the grey, so a slow photograph reads as loading rather
 * than as a failure. On Lahore mobile data that state lasts long enough to be
 * read as broken.
 *
 * `Animated` with the native driver rather than Reanimated: the sweep is one
 * transform on a loop, and the cheap Android hardware this pilot targets runs
 * it off the JS thread either way.
 */
function Sweep() {
  const [width, setWidth] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: SWEEP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  // Travels its own width out on each side, so the highlight enters and leaves
  // rather than appearing in the middle of the frame.
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      testID="photo-loading"
      className="absolute inset-0"
      pointerEvents="none"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Animated.View style={{ width, height: '100%', transform: [{ translateX }] }}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/**
 * Renders nothing at all when there is no photograph.
 *
 * The grey box these sites used to show was never a placeholder — it was the
 * frame's own background with an `expo-image` on top of it, so a photograph
 * that failed to load and one that was never set looked identical. Keeping the
 * grey only where a `uri` exists makes it what it should have been all along:
 * the loading state. See ADR-0015 in the backend repo.
 */
export function Photo({ uri, className, accessibilityLabel }: PhotoProps) {
  /*
    The uri that finished, not a boolean. A list recycles its rows, so a
    `loaded` flag would survive into the next photograph and leave that one
    with no loading state at all — the bug this component exists to kill,
    arriving by the back door.
  */
  const [settled, setSettled] = useState<string | null>(null);

  if (!uri) return null;

  return (
    <View className={cn('overflow-hidden bg-gray-200', className)}>
      {/* A photograph that failed keeps the plain grey: the waiting is over. */}
      {settled === uri ? null : <Sweep />}
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={200}
        onLoadEnd={() => setSettled(uri)}
        {...(accessibilityLabel === undefined ? {} : { accessibilityLabel })}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
