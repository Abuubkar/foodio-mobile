import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

/**
 * A few points larger than the 24dp tab icons, not half as large again.
 *
 * At 38 it dominated the bar and pushed its own label a visible step below the
 * other four, which is the rhythm this was supposed to keep. 32 reads as "the
 * filled one" without becoming a different kind of object.
 */
const DISC = 32;

/** Pulls the disc up so "Post" lands on the same baseline as the other labels. */
const LIFT = 4;

/**
 * Posting a clip, in the middle of the tab bar.
 *
 * It keeps the bar's rhythm rather than breaking it: a disc where the other
 * four have an icon, a label where they have a label, five columns on one
 * baseline. The first attempt was a floating circle in the corner of the feed,
 * which collided with the kitchen's Menu pill and explained nothing.
 *
 * Filled in the brand orange, like the Add button a clip already offers, so
 * the one solid-orange thing on screen is always the action. The glyph is
 * `add` rather than a typed "+", which sits on a text baseline and reads high
 * inside a circle. It carries a label because that was the actual complaint:
 * an unlabelled icon in a corner is only discoverable by pressing it.
 *
 * Sized rather than flexed. A `flex: 1` child inside a bar that measures its
 * own items is a measure loop, and it hung the JS thread hard enough for
 * Android to offer to close the app.
 */
export function ComposeTabButton() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/post-clip')}
      accessibilityRole="button"
      accessibilityLabel={t('clips.post.compose')}
      style={{ width: 72, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          backgroundColor: colors.primary[500],
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: -LIFT,
        }}
      >
        <Ionicons name="add" size={21} color={colors.gray[900]} />
      </View>

      <Text variant="caption" style={{ fontSize: 10, color: colors.primary[400], marginTop: 3 }}>
        {t('tabs.post')}
      </Text>
    </Pressable>
  );
}
