import { Pressable, View } from 'react-native';

import { usePathname, useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { colors } from '@/theme';

/** Bigger than a 24dp tab icon, small enough to clear the bar's top rule. */
const DISC = 30;

/** The glyph: two rounded bars, so the ends are round and the crossing is clean. */
const ARM = 13;
const STROKE = 2.5;

/**
 * Measured, not derived.
 *
 * The bar does not lay its items out the way a plain centred stack would, so
 * reasoning about icon and label heights put the disc 12dp too high — close
 * enough to the top rule to look like it was touching. This is the offset that
 * actually puts the disc's centre on the icons' centre, read off a screenshot.
 */
const DROP = 12;

/**
 * Posting a clip, in the middle of the tab bar.
 *
 * Inline and on the icons' own line — not lifted out of the bar, not carrying
 * a label. One filled circle among four outlined icons is enough to say which
 * one is the action.
 *
 * The plus is drawn from two rounded bars rather than set as a font glyph.
 * `Ionicons` `add` has square ends and sits on a text baseline, which is why
 * it looked slightly off-centre and slightly hard inside a circle.
 *
 * Ink rather than the brand orange. A saturated fill at this size reads heavy,
 * and it put the button in the same colour as the active tab, so the one thing
 * that marks *where you are* and the one thing that marks *what to do* were
 * competing. The Clips tab owns a black bar, where ink would disappear, so the
 * disc inverts there.
 *
 * Sized rather than flexed: a `flex: 1` child inside a bar that measures its
 * own items is a measure loop, and it hung the JS thread.
 */
export function ComposeTabButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const onDarkBar = pathname.startsWith('/clips');
  const disc = onDarkBar ? colors.white : colors.gray[900];
  const glyph = onDarkBar ? colors.gray[900] : colors.white;

  const arm = { backgroundColor: glyph, borderRadius: STROKE / 2 };

  return (
    <Pressable
      onPress={() => router.push('/post-clip')}
      accessibilityRole="button"
      accessibilityLabel={t('clips.post.compose')}
      style={{ width: 72, alignItems: 'center', justifyContent: 'center', paddingTop: DROP }}
      android_ripple={{
        color: onDarkBar ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.18)',
        borderless: true,
        radius: 28,
      }}
    >
      <View
        style={{
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          backgroundColor: disc,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ ...arm, width: ARM, height: STROKE }} />
        <View style={{ ...arm, position: 'absolute', width: STROKE, height: ARM }} />
      </View>
    </Pressable>
  );
}
