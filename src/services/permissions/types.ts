export enum PermissionType {
  Location = 'location',
  Notification = 'notification',
  /** The photo library, for putting a picture on a restaurant or a dish. */
  PhotoLibrary = 'photoLibrary',
}

export type ExpoPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type PermissionResult = {
  readonly status: ExpoPermissionStatus;
  readonly type: PermissionType;
};

export type PermissionPort = {
  request: (type: PermissionType) => Promise<PermissionResult>;
  /**
   * What the OS already thinks, without asking. Needed before showing a
   * prompt of our own: there is no point explaining why notifications help
   * to somebody who has already said yes, or already said no for good.
   */
  status: (type: PermissionType) => Promise<PermissionResult>;
};
