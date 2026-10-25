import type { PermissionPort, PermissionResult } from './types';
import { PermissionType } from './types';

async function requestLocation(): Promise<PermissionResult> {
  const Location = await import('expo-location');
  const { status } = await Location.requestForegroundPermissionsAsync();
  return { status, type: PermissionType.Location };
}

async function requestNotification(): Promise<PermissionResult> {
  const Notifications = await import('expo-notifications');
  const { status } = await Notifications.requestPermissionsAsync();
  return { status, type: PermissionType.Notification };
}

async function requestPhotoLibrary(): Promise<PermissionResult> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return { status, type: PermissionType.PhotoLibrary };
}

async function requestCamera(): Promise<PermissionResult> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return { status, type: PermissionType.Camera };
}

async function statusOfLocation(): Promise<PermissionResult> {
  const Location = await import('expo-location');
  const { status } = await Location.getForegroundPermissionsAsync();
  return { status, type: PermissionType.Location };
}

async function statusOfNotification(): Promise<PermissionResult> {
  const Notifications = await import('expo-notifications');
  const { status } = await Notifications.getPermissionsAsync();
  return { status, type: PermissionType.Notification };
}

async function statusOfPhotoLibrary(): Promise<PermissionResult> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return { status, type: PermissionType.PhotoLibrary };
}

async function statusOfCamera(): Promise<PermissionResult> {
  const ImagePicker = await import('expo-image-picker');
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return { status, type: PermissionType.Camera };
}

const handlers: Record<PermissionType, () => Promise<PermissionResult>> = {
  [PermissionType.Location]: requestLocation,
  [PermissionType.Notification]: requestNotification,
  [PermissionType.PhotoLibrary]: requestPhotoLibrary,
  [PermissionType.Camera]: requestCamera,
};

const readers: Record<PermissionType, () => Promise<PermissionResult>> = {
  [PermissionType.Location]: statusOfLocation,
  [PermissionType.Notification]: statusOfNotification,
  [PermissionType.PhotoLibrary]: statusOfPhotoLibrary,
  [PermissionType.Camera]: statusOfCamera,
};

export const expoPermissionAdapter: PermissionPort = {
  request: async (type) => {
    const handler = handlers[type];
    return handler();
  },

  status: async (type) => {
    const reader = readers[type];
    return reader();
  },
};
