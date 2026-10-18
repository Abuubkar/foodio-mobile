import { View } from 'react-native';

import { Text } from '@/components/ui';

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View className="mb-3 px-3">
      <Text variant="subheading" className="text-gray-900">
        {title}
      </Text>
    </View>
  );
}
