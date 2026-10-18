# Food Platform Mobile

A production-grade React Native application built with Expo and TypeScript.

---

## The app

Android, running against the real backend with the seeded Restaurants. Every
delivery is performed by the Restaurant's own Delivery Staff — there is no
platform rider pool — so a Restaurant's Delivery Area, hours and fee are its
own, and the app renders what it is handed.

|                                                                Home                                                                |                                                    Search                                                     |                                                                      Restaurant                                                                      |
| :--------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------: |
| <img src="docs/screenshots/app-home.png" width="240" alt="Home: a rail of cuisines, restaurants near you, and the latest clips" /> | <img src="docs/screenshots/app-search.png" width="240" alt="Search: filter pills over compact result rows" /> | <img src="docs/screenshots/app-restaurant.png" width="240" alt="Restaurant: hero, rating, opening state, and a menu behind sticky category chips" /> |
|                                        Cuisines, the Restaurants that reach you, and Clips                                         |                                    Filter pills and sort, results as rows                                     |                                                         Sticky category chips over the Menu                                                          |

|                                             Clips                                              |                                                        Checkout                                                         |                                                 Order                                                 |
| :--------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------------------------------------------------: |
| <img src="docs/screenshots/app-clips.png" width="240" alt="Clips: a full-screen video feed" /> | <img src="docs/screenshots/app-checkout.png" width="240" alt="Checkout: deliver-to, cash on delivery, order summary" /> | <img src="docs/screenshots/app-order.png" width="240" alt="Order placed, with the status timeline" /> |
|                           A Restaurant's own clips beside customers'                           |                                    Cash on delivery; card is announced, not offered                                     |                              The Order's life, from placed to delivered                               |

The Cart sits between the Menu and Checkout:

<img src="docs/screenshots/app-cart.png" width="240" alt="Cart: line items, delivery, total" />

---

## Tech Stack

- Expo (Continuous Native Generation)
- React Native
- TypeScript
- Expo Router
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Axios
- Expo Image

---

## Requirements

- Node.js >= 22 LTS
- pnpm
- Xcode (iOS)
- Android Studio
- Expo CLI

---

## Getting Started

Install dependencies

```bash
pnpm install
```

Start the API (in its own terminal — the app needs it). Prefer the real
backend — see [Mock API](#mock-api) below.

```bash
cd ../foodio-backend && pnpm services:up && pnpm db:migrate && pnpm dev
```

Start development server

```bash
pnpm start
```

Run Android

```bash
pnpm android
```

Run iOS

```bash
pnpm ios
```

Both `pnpm ios` and `pnpm prebuild` pin `LANG` and `LC_ALL` to UTF-8, because
CocoaPods calls `String#unicode_normalize` on the project path and Ruby hands it
an ASCII-8BIT string under a `C` locale — which macOS gives a shell with no
`LANG` set. The failure is `Unicode Normalization not appropriate for
ASCII-8BIT`, several frames deep in CocoaPods, and says nothing about locales.
Android is unaffected; it never runs Ruby.

---

## Mock API

The real backend (`foodio-backend`, a separate repo) is the default target —
it owns Postgres and implements the full contract. Both default to port 3000,
so only one of the two runs at a time — `MOCK_PORT` moves the mock and `PORT`
moves the backend when something else already has it.

`pnpm api` remains as an offline fallback: it runs
[json-server](https://github.com/typicode/json-server) against `mocks/db.json`,
with `mocks/routes.json` mapping the URLs the app actually wants onto it. See
[docs/adr/0001](docs/adr/0001-json-server-owns-the-api-contract.md). Use it
only when the backend isn't running — do not run both at once.

The app finds the API automatically: with `EXPO_PUBLIC_API_URL` unset it derives
the dev machine's address from Expo, so an Android emulator or a physical device
works without editing anything. Copy `.env.example` to `.env` only when you need
to point at a deployed API.

Push notifications on Android need `GOOGLE_SERVICES_JSON` in `.env`, pointing
at the `google-services.json` downloaded from the Firebase console for
`com.hedonarc.foodio`. It is not a secret — it ships inside the APK — but it is
gitignored, because this repository is public. Without it an Android build
registers no push token and every notification goes nowhere, silently.

That file alone is not enough. `getExpoPushTokenAsync` also needs an Expo
`projectId`, which this project does not yet have, so the Expo push service has
nothing to address. Two account-bound commands close that, and only the account
holder can run them:

```bash
npx eas-cli@latest login && npx eas-cli@latest init
npx eas-cli@latest credentials --platform android
```

The first writes `extra.eas.projectId` into `app.json`; the second uploads the
FCM V1 service-account key, under Push Notifications. See issue #143.

The delivery-area map needs `GOOGLE_MAPS_API_KEY` in `.env` on Android — put
the Maps SDK key there, never in `app.json`, because this repository is public.
`app.config.ts` reads it at build time and fails an EAS Android build outright
if it is missing, rather than shipping a grey rectangle. iOS uses Apple Maps and
needs nothing. The key is not a secret — it ships inside the APK — so restrict
it in the Cloud console to this package and to Maps SDK for Android.

The mock serves identity too — `POST /auth/provider` takes any token at all
and mints a session for a seeded Person, so Orders, the Manage hub and the
Kitchen and Delivery surfaces are reachable with no Postgres. Send a seeded id
as the token (`marco` for Kitchen and Delivery at rest-1) to sign in as them;
anything else, a real Google token included, lands on the customer. Nothing is
verified, on purpose — see the comment in `mocks/middlewares.cjs`.

The mock's responses are delayed 400ms so loading states are real. To exercise
failure paths against it, or to move it off a taken port:

```bash
MOCK_FAIL_RATE=0.3 pnpm api
MOCK_PORT=3002 pnpm api
```

---

## Testing

```bash
pnpm test
```

Jest via `jest-expo`. Tests live beside the code they cover, as `*.test.ts`.
Cover business logic, hooks and utilities; avoid snapshots.

---

## Project Principles

- Feature-first architecture
- Type-safe APIs
- Minimal global state
- Server state managed by TanStack Query
- Client state managed by Zustand
- Clean Architecture
- SOLID principles
- Reusable UI components

---

## Folder Structure

```
app/
src/
    features/
    components/
    hooks/
    services/
    api/
    stores/
    lib/
    constants/
    theme/
    types/
    utils/
assets/
```

---

## State Management

### Server State

TanStack Query

### Client State

Zustand

---

## Validation

Zod

---

## Forms

React Hook Form

---

## Networking

Axios

---

## Styling

NativeWind

---

## Linting

ESLint

Prettier

Husky

Lint Staged

---

## Commits

Conventional Commits

Example

feat(feed): add autoplay support

fix(auth): refresh token bug

refactor(search): simplify filters

---

## Branch Strategy

main

develop

feature/*

bugfix/*

hotfix/*

---

## Pull Requests

Every PR should

- pass lint
- pass typecheck
- pass tests
- include screenshots when UI changes
- be reviewed before merge

---

## Performance Goals

- 60 FPS scrolling
- Fast startup
- Minimal re-renders
- Lazy loading
- Memoization only when necessary

---

## Philosophy

Prefer simple solutions.

Avoid premature abstractions.

Optimize for readability and maintainability.
