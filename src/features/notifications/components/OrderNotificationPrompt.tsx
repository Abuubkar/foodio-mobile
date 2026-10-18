import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Button, Text } from '@/components/ui';
import { colors } from '@/theme';

type OrderNotificationPromptProps = {
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * A card on the Order the customer has just placed, not a modal.
 *
 * Inline because the answer is not urgent and a dialog over a fresh Order
 * reads as an interruption of the thing they came here to look at. It also
 * keeps the buttons out of a Modal inside a ScrollView, which costs the first
 * tap while anything else has the keyboard (#211).
 */
export function OrderNotificationPrompt({ onAccept, onDecline }: OrderNotificationPromptProps) {
  const { t } = useTranslation();

  return (
    <View className="mt-6 rounded-2xl bg-primary-50 p-4">
      <View className="flex-row items-start">
        <Ionicons name="notifications-outline" size={18} color={colors.primary[600]} />
        <View className="ml-3 flex-1">
          <Text variant="bodyMedium" className="text-gray-900">
            {t('notifications.prompt.title')}
          </Text>
          <Text variant="caption" className="mt-1 text-gray-600">
            {t('notifications.prompt.description')}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row gap-2">
        <Button onPress={onAccept} className="flex-1">
          {t('notifications.prompt.accept')}
        </Button>
        <Button variant="secondary" onPress={onDecline} className="flex-1">
          {t('notifications.prompt.decline')}
        </Button>
      </View>
    </View>
  );
}
