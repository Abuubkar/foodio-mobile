# Identity and entitlement

**A Person** is `id`, `displayName` and nested `entitlements[]` — nothing else.
Every extra field would be unverified data dressed as real. Zero entitlements
means customer: the baseline, not a row.

**An entitlement** is one relationship per Restaurant carrying capabilities —
`(person, restaurantId, [kitchen, delivery])`. Delivery is a capability _inside_
a Restaurant, never a peer role, per [ADR 0003](../adr/0003-restaurant-owned-delivery.md).
Seeded in `db.json`; nobody grants themselves anything.

**The three roles are nouns**: Customer, Kitchen, Delivery. A capability names
somewhere you work, so the switcher can read "Taco Fiesta · Kitchen" — a place —
rather than joining a place to an activity. A fourth capability slots in without
rewording the other three.

**Signing in** is Google or Apple, and no code to type. It POSTs
`/auth/provider` and receives a session. Against the real backend that token is
verified against Google's or Apple's own keys; against `pnpm api` it is
believed on sight, because the mock exists so the app runs, not so it is
secure.

**The client never decides who it is.** The token attaches in a single Axios
interceptor; no call site puts a person in a URL. `mocks/middlewares.cjs`
resolves token → person and scopes server-side:

- `GET /orders` without a token is **401**.
- `GET /orders` sets `req.query.customerId` before the router, so
  `X-Total-Count` stays honest.
- `GET /orders/:id` for someone else's order is **404**, not an empty 200 the
  client has to interpret.
- `POST /orders` stamps `customerId` from the token, alongside `status` and
  `placedAt`. The client asserts none of the three.

Swapping in real auth replaces the picker and this middleware — no hook, no
component, no query key. That is [ADR 0001](../adr/0001-json-server-owns-the-api-contract.md)'s
test.

**Storage.** Token and active role in Expo Secure Store. iOS keeps Secure Store
across app uninstall and Android does not, so **explicit sign-out is required**
and "uninstall to reset" is wrong on one platform.

**Hydration.** The root splash waits for both onboarding and session, so no
screen renders against an unknown identity. A stored token is a claim: it is
resolved through the server, and a token whose person no longer resolves is
simply not a session.

Decided in [#54](https://github.com/hedonarc/foodio/issues/54)–[#61](https://github.com/hedonarc/foodio/issues/61).

## Roles change the navigator

`Stack.Protected` on the active role selects between `(tabs)`, `(kitchen)` and
`(delivery)` — the idiom the layout already used for onboarding, applied to a
second axis. Conditional children inside one `Tabs` was rejected: the kitchen
has no Cart and delivery has no Menu, so a bar that swaps every tab is two bars
pretending to be one.

Switching resets to the role's home in both directions, because the screen you
were on usually does not exist in the destination. The cart survives — it is
memory-only anyway, and **sign-out**, not switching, is what clears a person's
state.

The active role persists in Secure Store and is re-resolved against current
entitlements on launch, so a revoked role falls back to Customer silently
rather than showing a dead surface. The stored value is the role's own name, so
a device holding a pre-rename `serve:rest-1` fails to decode and lands on
Customer — the same place any unrecognised role belongs.

**Staff read a Restaurant's orders, not their own.** `?forRestaurantId=` says
_which_ of your restaurants; the middleware checks the token's entitlements and
answers **403** if you do not work there. The client never asserts the right.

**Advancing an Order is not built.** Accept, reject and mark-ready are a real
workflow with decisions behind them and no charted spec, so the queue is
read-only rather than invented.

Named in [#67](https://github.com/hedonarc/foodio/pull/67)'s follow-up: the
roles were Ordering / Serving / Delivering, gerunds that described activities
and clashed with [#58](https://github.com/hedonarc/foodio/issues/58)'s own rule
that menu entries name places.
