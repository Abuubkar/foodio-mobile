import { Pressable } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { colors } from '@/theme';

type RemoveClipButtonProps = {
  onPress: () => void;
  /** True while the removal is in flight, so a second tap cannot send it twice. */
  isRemoving: boolean;
};

/**
 * The way out of a clip you posted.
 *
 * Icon only, in its own corner, clear of the action rail below and of the
 * kitchen's Menu pill above. Practitioner guidance on destructive controls
 * lines up on two things — keep them away from the actions people actually
 * came to press, and confirm before they land — and this is the first half.
 * The second is the hook's dialog.
 *
 * Not a one-item overflow menu, which is the other conventional home for this:
 * `…` promises a list, and a list of one is a tap spent on nothing. Not orange
 * either — that is for the action a cell wants you to take.
 */
export function RemoveClipButton({ onPress, isRemoving }: RemoveClipButtonProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      disabled={isRemoving}
      accessibilityRole="button"
      accessibilityLabel={t('clips.remove.label')}
      accessibilityState={{ disabled: isRemoving }}
      hitSlop={8}
      className="h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/55 active:bg-black/75"
    >
      <Ionicons
        name="trash-outline"
        size={16}
        color={isRemoving ? colors.gray[400] : colors.white}
      />
    </Pressable>
  );
}
