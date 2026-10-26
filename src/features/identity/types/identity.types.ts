import { z } from 'zod';

/**
 * Where in one Restaurant a person may work. See docs/adr/0003 — never shared.
 * Nouns, not verbs: an entitlement names a place you belong to, and the switcher
 * reads "Taco Fiesta · Kitchen" rather than joining a place to an activity.
 */
export const CAPABILITIES = ['kitchen', 'delivery'] as const;

export const capabilitySchema = z.enum(CAPABILITIES);

export const entitlementSchema = z.object({
  restaurantId: z.string(),
  capabilities: z.array(capabilitySchema).nonempty(),
});

/**
 * A person's public name, and the only thing that is theirs to pick.
 *
 * Lowercase, because `@Sana` and `@sana` must not be two people — the server
 * holds the case typed and compares on `lower(handle)`. Narrow on purpose: a
 * handle sits beside a caption in a feed cell, and anything that can carry
 * spaces or punctuation can be made to look like somebody else.
 */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/);

export const personSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  /** Null until they pick one. Somebody with no handle still has a name. */
  handle: z.string().nullable().default(null),
  /** Empty means no photograph; the app draws initials rather than a stock face. */
  avatarUrl: z.string().default(''),
  /**
   * Contact information, not a credential — a rider calls it. Null until
   * checkout asks for one. See the backend's ADR-0019.
   */
  phone: z.string().nullable(),
  /** Empty means customer — the baseline, not a row. */
  entitlements: z.array(entitlementSchema),
});

/**
 * What anybody may see of a person: a name, a face, and the handle that
 * addresses them. Never the phone or the email — a public page keyed to a
 * guessable name is the one place that mistake is permanent.
 */
export const publicProfileSchema = z.object({
  handle: z.string(),
  displayName: z.string(),
  avatarUrl: z.string(),
});

/**
 * E.164. Contact information rather than a credential since ADR-0019 — stored
 * and compared in this exact form, so the client normalises before sending.
 */
/**
 * Who vouched for a person. The server verifies the token; this only names it.
 *
 * `dev` is a local testing door rather than a provider: the API refuses it
 * unless `DEV_SIGN_IN` is on, which its environment schema will not allow in
 * production. See backend ADR-0022.
 */
export const IDENTITY_PROVIDERS = ['google', 'apple', 'dev'] as const;

export const identityProviderSchema = z.enum(IDENTITY_PROVIDERS);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/);

/** Replaces the mock's `{ token, person }` — see backend ADR-0007. */
export const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  person: personSchema,
});

export type IdentityProvider = z.infer<typeof identityProviderSchema>;
export type Capability = z.infer<typeof capabilitySchema>;
export type Entitlement = z.infer<typeof entitlementSchema>;
export type Person = z.infer<typeof personSchema>;
export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type Session = z.infer<typeof sessionSchema>;

/**
 * What the person is currently acting as. `customer` needs no restaurant —
 * everyone can order, which is why it is the baseline rather than a row.
 */
export type ActiveRole =
  | { kind: 'customer' }
  | { kind: 'kitchen'; restaurantId: string }
  | { kind: 'delivery'; restaurantId: string };

export const CUSTOMER_ROLE: ActiveRole = { kind: 'customer' };

/** One entry per capability: the kitchen and delivery are different jobs. */
export type RoleOption = {
  role: ActiveRole;
  restaurantId: string | null;
};

export function roleOptionsFor(person: Person): RoleOption[] {
  const fromEntitlements = person.entitlements.flatMap((entitlement) =>
    entitlement.capabilities.map((capability) => ({
      role: { kind: capability, restaurantId: entitlement.restaurantId } as ActiveRole,
      restaurantId: entitlement.restaurantId,
    })),
  );

  return [{ role: CUSTOMER_ROLE, restaurantId: null }, ...fromEntitlements];
}

export function sameRole(a: ActiveRole, b: ActiveRole): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'customer' || b.kind === 'customer') return true;
  return a.restaurantId === b.restaurantId;
}

/** A remembered role the person no longer holds falls back to customer. */
export function resolveRole(person: Person | null, remembered: ActiveRole | null): ActiveRole {
  if (!person || !remembered || remembered.kind === 'customer') return CUSTOMER_ROLE;

  const held = person.entitlements.some(
    (entitlement) =>
      entitlement.restaurantId === remembered.restaurantId &&
      entitlement.capabilities.includes(remembered.kind),
  );

  return held ? remembered : CUSTOMER_ROLE;
}
