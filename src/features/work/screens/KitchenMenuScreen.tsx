import { SectionList, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toApiError } from '@/api/errors';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared';
import { Text } from '@/components/ui';
import { ComposeKitchenClipButton } from '@/features/clips/components/ComposeKitchenClipButton';
import { IdentityChip } from '@/features/identity/components/IdentityChip';
import { ManageButton } from '@/features/manage';
import { useRestaurantMenu } from '@/features/menu/hooks/useRestaurantMenu';
import type { MenuItem } from '@/features/menu/types/menu.types';
import { usePhotoUpload } from '@/features/photos/hooks/usePhotoUpload';
import { useRestaurants } from '@/features/restaurants/hooks/useRestaurants';
import { useSessionStore } from '@/stores/session.store';

import { KitchenMenuRow } from '../components/KitchenMenuRow';
import { PhotoButton } from '../components/PhotoButton';
import { QueueToast } from '../components/QueueToast';
import { useMenuAvailability } from '../hooks/useMenuAvailability';
import { useMenuItemPhoto } from '../hooks/useMenuItemPhoto';
import { useRestaurantPhoto } from '../hooks/useRestaurantPhoto';
import { useTransientMessage } from '../hooks/useTransientMessage';
import { soldOutLast } from '../lib/kitchenMenu';
import { photoErrorMessage } from '../lib/photoError';

type MenuSection = { key: string; title: string; data: MenuItem[] };

/** The menu as switches: mark a dish sold out, flip it back at prep. #97 */
export function KitchenMenuScreen() {
  const { t } = useTranslation();
  const role = useSessionStore((state) => state.role);
  const restaurantId = role.kind === 'customer' ? undefined : role.restaurantId;

  const { data: menu, isPending, error, refetch } = useRestaurantMenu(restaurantId);
  const { data: restaurants } = useRestaurants();
  const availability = useMenuAvailability(restaurantId ?? '');
  const photoUpload = usePhotoUpload();
  const savePhoto = useMenuItemPhoto(restaurantId ?? '');
  const saveRestaurantPhoto = useRestaurantPhoto();
  const { message: toast, show: showToast } = useTransientMessage();

  const restaurant = restaurants?.find((entry) => entry.id === restaurantId);

  const sections: MenuSection[] = menu
    ? soldOutLast(menu)
        .map((category) => ({ key: category.id, title: category.name, data: category.menuItems }))
        .filter((section) => section.data.length > 0)
    : [];

  /**
   * Upload then save, as two steps on purpose: an upload that is never saved
   * leaves an orphaned object, where one write covering both could leave a dish
   * pointing at bytes that never arrived. Backing out of the picker returns
   * nothing and must stay silent — it is not a failure.
   */
  /** The restaurant's own photograph, on the same two-step path as a dish's. */
  const pickRestaurantPhoto = () => {
    if (!restaurantId) return;

    photoUpload.mutate(
      { restaurantId },
      {
        onSuccess: (image) => {
          if (image === undefined) return;
          saveRestaurantPhoto.mutate(
            { restaurantId, image },
            {
              onSuccess: () => showToast(t('work.menu.restaurantPhotoSaved')),
              onError: () => showToast(t('work.menu.photoFailed')),
            },
          );
        },
        onError: (cause) => showToast(photoErrorMessage(cause, t)),
      },
    );
  };

  const pickPhoto = (itemId: string) => {
    if (!restaurantId) return;

    photoUpload.mutate(
      { restaurantId, menuItemId: itemId },
      {
        onSuccess: (image) => {
          if (image === undefined) return;
          savePhoto.mutate(
            { restaurantId, itemId, image },
            {
              onSuccess: () => showToast(t('work.menu.photoSaved')),
              onError: () => showToast(t('work.menu.photoFailed')),
            },
          );
        },
        onError: (cause) => showToast(photoErrorMessage(cause, t)),
      },
    );
  };

  const toggle = (itemId: string, isAvailable: boolean) => {
    if (!restaurantId) return;
    availability.mutate(
      { restaurantId, itemId, isAvailable },
      // Optimistic rollback already snapped the switch back; say why.
      { onError: (cause) => showToast(toApiError(cause).message) },
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3">
        <PhotoButton
          uri={restaurant?.image ?? ''}
          onPress={pickRestaurantPhoto}
          isBusy={
            (photoUpload.isPending && photoUpload.variables?.menuItemId === undefined) ||
            saveRestaurantPhoto.isPending
          }
          accessibilityLabel={t('work.menu.restaurantPhoto', { name: restaurant?.name ?? '' })}
          accessibilityHint={
            restaurant?.image ? t('work.menu.changePhoto') : t('work.menu.addPhoto')
          }
          className="mr-3 h-11 w-11"
        />
        <View className="flex-1">
          <Text variant="subheading" className="text-gray-900" numberOfLines={1}>
            {restaurant?.name ?? ''}
          </Text>
          <Text variant="caption" className="mt-0.5 text-gray-500">
            {t('work.menu.subtitle')}
          </Text>
        </View>
        {/* The kitchen's own voice, so the kitchen only — a rider works for the
            restaurant without speaking for it. Waits for the name it carries. */}
        {role.kind === 'kitchen' && restaurant ? (
          <ComposeKitchenClipButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
        ) : null}
        {role.kind === 'kitchen' ? <ManageButton /> : null}
        <IdentityChip />
      </View>

      {isPending ? <LoadingState className="flex-1 items-center justify-center" /> : null}
      {error ? (
        <ErrorState
          error={error}
          onRetry={refetch}
          className="flex-1 items-center justify-center px-8"
        />
      ) : null}
      {!isPending && !error && sections.length === 0 ? (
        <EmptyState message={t('menu.empty')} className="flex-1 items-center justify-center px-8" />
      ) : null}

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerClassName="px-4 pb-8"
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center pb-2 pt-4">
              <Text variant="label" className="text-gray-500">
                {section.title}
              </Text>
              <Text variant="label" className="ml-2 text-gray-400">
                {section.data.length}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <KitchenMenuRow
              onPickPhoto={() => pickPhoto(item.id)}
              isUploadingPhoto={
                (photoUpload.isPending && photoUpload.variables?.menuItemId === item.id) ||
                (savePhoto.isPending && savePhoto.variables?.itemId === item.id)
              }
              item={item}
              currency={restaurant?.currency}
              onToggle={(isAvailable) => toggle(item.id, isAvailable)}
            />
          )}
        />
      ) : null}

      <QueueToast message={toast} />
    </SafeAreaView>
  );
}
