import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

import type { PrimaryAction } from '../lib/kitchens';

type ClipActionsProps = {
  primary: PrimaryAction;
  isSaved: boolean;
  onPrimary: () => void;
  onSave: () => void;
  onShare: () => void;
};

/**
 * Three actions, never four.
 *
 * `add` puts the dish straight in the cart; `choose` opens it because a group
 * requires an answer; `menu` appears when the clip was never tagged to a dish,
 * where offering to add anything would be a lie. The distinction is the app's
 * own `needsChoosing` — optional extras do not earn a detour.
 */
export function ClipActions({ primary, isSaved, onPrimary, onSave, onShare }: ClipActionsProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-3 flex-row items-center">
      <Pressable
        onPress={onPrimary}
        accessibilityRole="button"
        accessibilityLabel={t(`clips.action.${primary}`)}
        className="rounded-full bg-primary-500 px-5 py-2.5 active:bg-primary-600"
      >
        <Text variant="label" className="text-gray-900">
          {t(`clips.action.${primary}`)}
        </Text>
      </Pressable>

      <Pressable
        onPress={onSave}
        accessibilityRole="button"
        accessibilityState={{ selected: isSaved }}
        accessibilityLabel={isSaved ? t('clips.unsave') : t('clips.save')}
        className="ml-2 flex-row items-center rounded-full border border-white/20 bg-white/15 px-3.5 py-2.5 active:bg-white/25"
      >
        <Ionicons
          name={isSaved ? 'bookmark' : 'bookmark-outline'}
          size={16}
          color={isSaved ? colors.primary[400] : colors.white}
        />
        <Text variant="caption" className="ml-1.5 font-semibold text-white">
          {t('clips.list')}
        </Text>
      </Pressable>

      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel={t('clips.share')}
        className="ml-2 flex-row items-center rounded-full border border-white/20 bg-white/15 px-3.5 py-2.5 active:bg-white/25"
      >
        <Ionicons name="arrow-redo-outline" size={16} color={colors.white} />
        <Text variant="caption" className="ml-1.5 font-semibold text-white">
          {t('clips.share')}
        </Text>
      </Pressable>
    </View>
  );
}
