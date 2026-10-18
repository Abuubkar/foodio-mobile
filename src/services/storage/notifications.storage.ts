import AsyncStorage from '@react-native-async-storage/async-storage';

import { logError } from '@/lib/logger';

/**
 * Whether this device has been asked, in our own words, whether it wants to
 * hear about an Order. Not the OS permission — that is the OS's to remember,
 * and it only answers once.
 *
 * Ordinary device storage: it is a yes-or-no about a prompt, not a secret.
 */
const ASKED_KEY = 'foodio_notifications_asked';

export async function hasAskedAboutNotifications(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ASKED_KEY)) !== null;
  } catch (error) {
    // Treated as already asked: the cost of forgetting is nagging somebody.
    logError('notifications.storage.get', error);
    return true;
  }
}

export async function rememberAskedAboutNotifications(): Promise<void> {
  try {
    await AsyncStorage.setItem(ASKED_KEY, '1');
  } catch (error) {
    logError('notifications.storage.set', error);
  }
}
