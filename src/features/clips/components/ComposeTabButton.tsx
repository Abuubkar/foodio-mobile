import { Pressable, View } from 'react-native';

import { usePathname, useRouter } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { colors } from '@/theme';

/**
 * As tall as a whole sibling item — its icon *and* its label.
 *
 * Measured on the device: a tab's icon and label together span 35.3dp, so the
 * disc matches that rather than matching the icon alone. Sized to the icon it
 * read as the smaller thing on the row, because the item beside it is two
 * stacked elements and the disc is one.
 */
const DISC = 36;

/** The glyph: two rounded bars, so the ends are round and the crossing is clean. */
const ARM = 16;
const STROKE = 2.75;

/**
 * Measured, not derived.
 *
 * The bar does not lay its items out the way a plain centred stack would, so
 * reasoning about it put the disc well out of place twice. This is the offset
 * that actually lands the disc's centre on the centre of a sibling's whole
 * block — icon plus label — read off a screenshot.
 */
const DROP = 8;

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
