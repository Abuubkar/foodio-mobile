export { fetchMe, signInWithProvider, updateMe } from './api/identity.api';
export { AccountSheet } from './components/AccountSheet';
export { IdentityChip } from './components/IdentityChip';
export { PhoneField } from './components/PhoneField';
export { IdentityPickerScreen } from './screens/IdentityPickerScreen';
export type {
  ActiveRole,
  Capability,
  Entitlement,
  Person,
  RoleOption,
  Session,
} from './types/identity.types';
export {
  CUSTOMER_ROLE,
  phoneSchema,
  resolveRole,
  roleOptionsFor,
  sameRole,
} from './types/identity.types';
