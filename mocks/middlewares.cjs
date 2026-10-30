/**
 * json-server middleware for the local mock API.
 *
 * CommonJS on purpose: package.json declares `"type": "module"`, so a `.js`
 * file here would be parsed as ESM and `module.exports` would throw.
 *
 *   MOCK_FAIL_RATE=0.3 pnpm api     # ~30% of reads fail with a 503
 *   curl -H 'x-mock-fail: 500' ...  # force one response to a given status
 *
 * Sessions are theatre with one honest property: the server, not the client,
 * decides who the requester is. The token is a name badge — nothing hashes,
 * signs, expires or revokes it — but every scoped read resolves through it,
 * so swapping in real auth replaces this file and the picker, nothing else.
 */

const FAIL_RATE = Number.parseFloat(process.env.MOCK_FAIL_RATE ?? '0') || 0;

/**
 * Must match `--delay` in the `api` script. A middleware that responds here
 * never reaches json-server's delay, so without this every failure returns in
 * about a millisecond — and the failures are exactly the responses whose
 * loading states we most need to see.
 */
const DELAY_MS = Number.parseInt(process.env.MOCK_DELAY_MS ?? '400', 10) || 0;

/** Answers at the same speed json-server would, instead of instantly. */
function respondLater(res, status, body) {
  setTimeout(() => res.status(status).jsonp(body), DELAY_MS);
}

/** A 204 carries no body, and `jsonp` would give it one. */
function endLater(res, status) {
  setTimeout(() => res.status(status).end(), DELAY_MS);
}

const MESSAGES = {
  400: 'Bad request.',
  401: 'Not authenticated.',
  403: 'You do not work here.',
  404: 'Not found.',
  409: 'This order has moved on. Pull to refresh.',
  500: 'Something went wrong on our end.',
  503: 'The kitchen is temporarily unreachable.',
};

function errorBody(status, message) {
  return { error: { status, message: message ?? MESSAGES[status] ?? 'Request failed.' } };
}

/**
 * A restaurant kitchen the client cannot see, so order status advances on the
 * server as it would in production rather than being faked in the app. Seconds
 * rather than minutes so the flow is watchable while developing.
 */
const TIMELINE = [
  { after: 0, status: 'placed' },
  { after: 20, status: 'accepted' },
  { after: 45, status: 'preparing' },
  { after: 90, status: 'ready' },
  { after: 120, status: 'out_for_delivery' },
  { after: 180, status: 'delivered' },
];

const SETTLED = new Set(['delivered', 'rejected', 'cancelled']);

function progressed(order) {
  if (!order || typeof order !== 'object' || !order.placedAt) return order;
  if (SETTLED.has(order.status)) return order;
  // Once staff have driven this order, the invisible kitchen lets go of it.
  if (order.statusLocked) return order;

  const elapsedSeconds = (Date.now() - Date.parse(order.placedAt)) / 1000;
  const reached = TIMELINE.filter((step) => elapsedSeconds >= step.after).pop();

  return reached ? { ...order, status: reached.status } : order;
}

/** `Bearer person:<id>` — deliberately readable, so nobody mistakes it for a credential. */
const TOKEN_PREFIX = 'person:';

/** Who a provider sign-in lands on when its token names nobody. A customer, deliberately. */
const DEFAULT_PERSON_ID = 'aisha';

const personIdIn = (raw) =>
  typeof raw === 'string' && raw.startsWith(TOKEN_PREFIX) ? raw.slice(TOKEN_PREFIX.length) : null;

function personIdFrom(req) {
  const header = req.get('authorization') ?? '';
  return personIdIn(header.startsWith('Bearer ') ? header.slice(7) : '');
}

/**
 * Both tokens are the same name badge. Nothing here expires, so nothing needs
 * rotating, and a refresh hands back exactly what it was given.
 */
const sessionFor = (person) => ({
  accessToken: TOKEN_PREFIX + person.id,
  refreshToken: TOKEN_PREFIX + person.id,
  person,
});

const findPerson = (req, id) =>
  (req.app.db.get('people').value() ?? []).find((person) => person.id === id) ?? null;

const AVAILABILITY_PATH = /^\/restaurants\/([^/]+)\/menu-items\/([^/]+)\/availability$/;
const ORDER_REVIEW_PATH = /^\/orders\/([^/]+)\/review$/;
const RESTAURANT_REVIEWS_PATH = /^\/restaurants\/([^/]+)\/reviews$/;
const RESTAURANT_ITEM_PATH = /^\/restaurants\/[^/]+$/;
const ADDRESS_ITEM_PATH = /^\/me\/addresses\/([^/]+)$/;
const PUSH_TOKEN_ITEM_PATH = /^\/me\/push-tokens\/(.+)$/;

const isPushTokenList = (req) => req.path === '/me/push-tokens';

const isAddressList = (req) => req.path === '/me/addresses';

/** The owner and the save time are the mock's bookkeeping, not the contract's. */
function withoutOwner(row) {
  const address = { ...row };
  delete address.personId;
  delete address.savedAt;
  return address;
}

/** Mirrors the contract's `deliveryAddressSchema` loosely — enough to catch a wrong shape. */
function invalidAddress(body) {
  if (!body || typeof body !== 'object') return true;
  const required = ['label', 'line1', 'city', 'postcode'];
  if (required.some((key) => typeof body[key] !== 'string' || body[key].trim() === '')) return true;
  return typeof body.latitude !== 'number' || typeof body.longitude !== 'number';
}

const PUSH_PLATFORMS = new Set(['ios', 'android']);

/** E.164, the one form the contract stores and compares. */
const PHONE = /^\+[1-9]\d{7,14}$/;

/**
 * Lowercase and narrow, mirroring the client's `handleSchema`. A handle sits
 * beside a caption in a feed cell, so anything that can carry spaces or
 * punctuation can be made to look like somebody else.
 */
const HANDLE = /^[a-z0-9_]{3,20}$/;

const PROFILE_PATH = /^\/profiles\/([^/]+)$/;

/** What anybody may see of a person. Never the phone — see the contract. */
const publicProfile = (person) => ({
  handle: person.handle,
  displayName: person.displayName,
  avatarUrl: person.avatarUrl ?? '',
});

/** `lower(handle)`, the way the backend compares them. */
const findByHandle = (req, handle) =>
  (req.app.db.get('people').value() ?? []).find(
    (person) =>
      typeof person.handle === 'string' && person.handle.toLowerCase() === handle.toLowerCase(),
  ) ?? null;

/** Everything the app's `clip.api.ts` sends. Anything else is a typo. */
const CLIP_QUERY_KEYS = new Set([
  'restaurantId',
  'menuItemId',
  'personId',
  'ids',
  '_sort',
  '_order',
  'cursor',
]);

/** A batch of ids is a lookup, not a feed. Mirrors the backend's cap. */
const MAX_CLIP_IDS = 50;

/** Newest first, the order every clip read in the app asks for. */
const clipsWhere = (req, keep) =>
  (req.app.db.get('clips').value() ?? [])
    .filter(keep)
    .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));

/** Newest first — the sort the backend's reviews list and embed both use. */
const reviewsFor = (req, restaurantId) =>
  (req.app.db.get('reviews').value() ?? [])
    .filter((review) => review.restaurantId === restaurantId)
    .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));

const REVIEWS_PAGE_SIZE = 5;
const EMBEDDED_REVIEWS = 5;

const isOrdersRead = (req) => req.method === 'GET' && req.path.startsWith('/orders');
const isOrderItem = (req) => /^\/orders\/[^/]+$/.test(req.path);
const isOrderCreate = (req) => req.method === 'POST' && req.path.startsWith('/orders');
const isOrderPatch = (req) => req.method === 'PATCH' && isOrderItem(req);

/** Mirror of the backend's `order-status.ts` TRANSITIONS. */
const TRANSITIONS = {
  placed: ['accepted', 'rejected', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready'],
  ready: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivered: [],
  delivery_failed: [],
  rejected: [],
  cancelled: [],
};

module.exports = function mockApi(req, res, next) {
  // A session is issued, never verified — but it is issued by the server.
  //
  // Nothing below checks a signature, an issuer or an audience, and that is
  // the whole point: this file exists so the app runs with no Postgres and no
  // Docker, not so it is secure. `POST /auth/provider` believes any idToken —
  // Google's real one, or a word you typed — and mints `person:<id>`, the
  // name badge every scoped read already resolves through. Real verification
  // lives in the backend's provider-verifier service, and replaces this
  // block rather than being weakened to match it.
  //
  // The token doubles as a Person picker, so the surfaces behind an
  // entitlement stay reachable: send a seeded id as the idToken — `marco` for
  // a Kitchen and Delivery hand at rest-1 — and the session comes back as
  // them. A real Google token matches nobody and lands on the customer.
  if (req.method === 'POST' && req.path === '/auth/provider') {
    const named = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
    const person = findPerson(req, named) ?? findPerson(req, DEFAULT_PERSON_ID);
    if (!person) {
      respondLater(res, 404, errorBody(404, 'No Person is seeded in mocks/db.json.'));
      return;
    }
    respondLater(res, 200, sessionFor(person));
    return;
  }

  if (req.method === 'POST' && req.path === '/auth/refresh') {
    const person = findPerson(req, personIdIn(req.body?.refreshToken));
    if (!person) {
      respondLater(res, 401, errorBody(401));
      return;
    }
    respondLater(res, 200, sessionFor(person));
    return;
  }

  // There is no token family to revoke, so this only has to not fail.
  if (req.method === 'POST' && req.path === '/auth/sign-out') {
    endLater(res, 204);
    return;
  }

  const forced = Number.parseInt(req.get('x-mock-fail') ?? '', 10);
  if (Number.isInteger(forced) && forced >= 400 && forced <= 599) {
    respondLater(res, forced, errorBody(forced));
    return;
  }

  // Only reads are sampled. Randomly losing a write would corrupt db.json.
  if (FAIL_RATE > 0 && req.method === 'GET' && Math.random() < FAIL_RATE) {
    respondLater(res, 503, errorBody(503));
    return;
  }

  // A profile is public: a name, a face, and the handle that addresses it.
  // Reached from an author's name under a clip, so a handle that leads to a
  // 404 is worse than one that is not tappable at all.
  const profileRead = req.method === 'GET' ? PROFILE_PATH.exec(req.path) : null;
  if (profileRead) {
    const person = findByHandle(req, decodeURIComponent(profileRead[1]));
    if (!person) {
      respondLater(res, 404, errorBody(404, 'Nobody by that name.'));
      return;
    }
    respondLater(res, 200, publicProfile(person));
    return;
  }

  /*
    Clips, where the filter has to actually filter.

    json-server matches on top-level keys only, so `?personId=` — the author is
    nested — matched nothing and it answered with the whole collection. Same for
    `?ids=`, which it does not know at all. Both read as "show me these" and
    returned "here is everything", which is the failure the backend's clip DTO
    now guards against by name. An unknown key is a 400 here for the same
    reason: a filter that fails open is the worst default an endpoint can have.
  */
  if (req.method === 'GET' && req.path === '/clips') {
    const unknown = Object.keys(req.query).filter((key) => !CLIP_QUERY_KEYS.has(key));
    if (unknown.length > 0) {
      respondLater(res, 400, errorBody(400, `Unknown query parameter: ${unknown.join(', ')}.`));
      return;
    }

    const { personId, ids } = req.query;

    if (typeof ids === 'string') {
      const wanted = ids
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id !== '');
      if (wanted.length === 0 || wanted.length > MAX_CLIP_IDS) {
        respondLater(res, 400, errorBody(400));
        return;
      }
      respondLater(
        res,
        200,
        clipsWhere(req, (clip) => wanted.includes(clip.id)),
      );
      return;
    }

    if (typeof personId === 'string') {
      respondLater(
        res,
        200,
        clipsWhere(req, (clip) => clip.author?.personId === personId),
      );
      return;
    }
  }

  // Everything behind `/me` resolves through the token and nothing else, the
  // same way the backend's tenant scope does. An address row carries a
  // `personId` the client never sees, so one Person's addresses cannot be
  // listed by asking for them.
  const item = ADDRESS_ITEM_PATH.exec(req.path);
  const pushToken = PUSH_TOKEN_ITEM_PATH.exec(req.path);
  if (req.path === '/me' || isAddressList(req) || item || isPushTokenList(req) || pushToken) {
    const person = findPerson(req, personIdFrom(req));
    if (!person) {
      respondLater(res, 401, errorBody(401));
      return;
    }

    if (req.method === 'GET' && req.path === '/me') {
      respondLater(res, 200, person);
      return;
    }

    // The phone arrives here from checkout, already normalised by the client.
    if (req.method === 'PATCH' && req.path === '/me') {
      const { displayName, phone, handle } = req.body ?? {};
      const named = typeof displayName === 'string' && displayName.trim() !== '';
      const numbered = typeof phone === 'string';
      const renamed = typeof handle === 'string';

      if (numbered && !PHONE.test(phone)) {
        respondLater(res, 400, errorBody(400));
        return;
      }

      // Stored lowercase, so `@Sana` and `@sana` cannot become two people.
      const wanted = renamed ? handle.trim().toLowerCase() : '';
      if (renamed && !HANDLE.test(wanted)) {
        respondLater(res, 400, errorBody(400));
        return;
      }

      const taken = renamed ? findByHandle(req, wanted) : null;
      if (taken && taken.id !== person.id) {
        respondLater(res, 409, errorBody(409, 'Somebody already uses that handle.'));
        return;
      }

      const people = req.app.db.get('people');
      void people
        .find({ id: person.id })
        .assign({
          ...(named ? { displayName } : {}),
          ...(numbered ? { phone } : {}),
          ...(renamed ? { handle: wanted } : {}),
        })
        .write();
      respondLater(res, 200, people.find({ id: person.id }).value());
      return;
    }

    /*
      Where a notification would be sent, if the mock sent any. It does not —
      there is no FCM here — but the app registers a token the moment it has a
      session, and a 404 there is an error state on a screen that has nothing
      to do with notifications.
    */
    if (req.method === 'POST' && isPushTokenList(req)) {
      const { token, platform } = req.body ?? {};
      if (typeof token !== 'string' || token === '' || !PUSH_PLATFORMS.has(platform)) {
        respondLater(res, 400, errorBody(400));
        return;
      }

      const tokens = req.app.db.get('pushTokens');
      // One row per device: registering the same token twice is not two devices.
      const existing = tokens.find({ token }).value();
      if (existing) void tokens.find({ token }).assign({ personId: person.id, platform }).write();
      else void tokens.push({ token, platform, personId: person.id }).write();

      respondLater(res, 201, { token, platform });
      return;
    }

    // Signing out deregisters exactly what was registered.
    if (req.method === 'DELETE' && pushToken) {
      void req.app.db
        .get('pushTokens')
        .remove({ token: decodeURIComponent(pushToken[1]) })
        .write();
      endLater(res, 204);
      return;
    }

    const addresses = req.app.db.get('addresses');

    // Newest first, which is the order `resolveActiveAddress` assumes.
    if (req.method === 'GET' && isAddressList(req)) {
      const mine = (addresses.value() ?? [])
        .filter((row) => row.personId === person.id)
        .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
        .map(withoutOwner);
      respondLater(res, 200, mine);
      return;
    }

    if (req.method === 'POST' && isAddressList(req)) {
      if (invalidAddress(req.body)) {
        respondLater(res, 400, errorBody(400));
        return;
      }
      const row = {
        ...req.body,
        id: `addr-${Date.now().toString(36)}`,
        personId: person.id,
        savedAt: new Date().toISOString(),
      };
      void addresses.push(row).write();
      respondLater(res, 201, withoutOwner(row));
      return;
    }

    if (item) {
      const addressId = item[1];
      const stored = addresses.find({ id: addressId }).value();

      // Someone else's address is a 404, never a 403 — the client has no
      // business learning that the row exists.
      if (!stored || stored.personId !== person.id) {
        respondLater(res, 404, errorBody(404));
        return;
      }

      // A full replacement, not a diff: the edit form always sends every field.
      if (req.method === 'PATCH') {
        if (invalidAddress(req.body)) {
          respondLater(res, 400, errorBody(400));
          return;
        }
        void addresses
          .find({ id: addressId })
          .assign({ ...req.body, id: addressId, personId: person.id })
          .write();
        respondLater(res, 200, withoutOwner(addresses.find({ id: addressId }).value()));
        return;
      }

      if (req.method === 'DELETE') {
        void addresses.remove({ id: addressId }).write();
        endLater(res, 204);
        return;
      }
    }

    respondLater(res, 404, errorBody(404));
    return;
  }

  // "Sold out", said in one request. Mirrors the backend's tenant scope
  // exactly: authenticated + entitled at this restaurant, no capability
  // narrowing — `setAvailability` calls `narrowToRestaurant`, nothing more.
  const availability = req.method === 'PATCH' ? AVAILABILITY_PATH.exec(req.path) : null;
  if (availability) {
    const [, restaurantId, itemId] = availability;

    const personId = personIdFrom(req);
    if (!personId) {
      respondLater(res, 401, errorBody(401));
      return;
    }

    const person = findPerson(req, personId);
    const entitled = (person?.entitlements ?? []).some((e) => e.restaurantId === restaurantId);
    if (!entitled) {
      respondLater(res, 403, errorBody(403));
      return;
    }

    if (typeof req.body?.isAvailable !== 'boolean') {
      respondLater(res, 400, errorBody(400));
      return;
    }

    const items = req.app.db.get('menuItems');
    if (!items.find({ id: itemId, restaurantId }).value()) {
      respondLater(res, 404, errorBody(404));
      return;
    }

    // `.write()` resolves async; the in-memory value is already updated.
    void items.find({ id: itemId }).assign({ isAvailable: req.body.isAvailable }).write();
    respondLater(res, 200, items.find({ id: itemId }).value());
    return;
  }

  // Every review the restaurant has, a page at a time. The cursor is the id
  // of the last row served — opaque to the client, carried forward verbatim.
  const reviewsRead = req.method === 'GET' ? RESTAURANT_REVIEWS_PATH.exec(req.path) : null;
  if (reviewsRead) {
    const all = reviewsFor(req, reviewsRead[1]);
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : '';
    const after = cursor ? all.findIndex((review) => review.id === cursor) : -1;
    const start = after >= 0 ? after + 1 : 0;
    const page = all.slice(start, start + REVIEWS_PAGE_SIZE);
    const last = page[page.length - 1];

    if (last && start + page.length < all.length) {
      res.set('Access-Control-Expose-Headers', 'X-Next-Cursor');
      res.set('X-Next-Cursor', last.id);
    }
    respondLater(res, 200, page);
    return;
  }

  // The detail's embedded reviews[] are the newest few real ones — served from
  // the reviews collection, exactly as the backend serves them from its table.
  if (req.method === 'GET' && RESTAURANT_ITEM_PATH.test(req.path)) {
    const send = res.jsonp.bind(res);
    res.jsonp = (body) =>
      send(
        body && body.id
          ? { ...body, reviews: reviewsFor(req, body.id).slice(0, EMBEDDED_REVIEWS) }
          : body,
      );
  }

  // A delivered order earns the right to speak — once. Mirrors the backend:
  // 403 on someone else's order, 409 undelivered, 409 already reviewed, and
  // the rating aggregate moves in the same write.
  const reviewCreate = req.method === 'POST' ? ORDER_REVIEW_PATH.exec(req.path) : null;
  if (reviewCreate) {
    const personId = personIdFrom(req);
    if (!personId) {
      respondLater(res, 401, errorBody(401));
      return;
    }

    const orderId = reviewCreate[1];
    const order = req.app.db.get('orders').find({ id: orderId }).value();
    if (!order) {
      respondLater(res, 404, errorBody(404));
      return;
    }
    if (order.customerId !== personId) {
      respondLater(res, 403, errorBody(403, 'That is not your order.'));
      return;
    }
    if (progressed(order).status !== 'delivered') {
      respondLater(res, 409, errorBody(409, 'Only a delivered order can be reviewed.'));
      return;
    }

    const reviews = req.app.db.get('reviews');
    if (reviews.find({ orderId }).value()) {
      respondLater(res, 409, errorBody(409, 'You have already reviewed this order.'));
      return;
    }

    const rating = req.body?.rating;
    const comment = req.body?.comment ?? '';
    const validRating = Number.isInteger(rating) && rating >= 1 && rating <= 5;
    if (!validRating || typeof comment !== 'string' || comment.length > 1000) {
      respondLater(res, 400, errorBody(400));
      return;
    }

    const person = findPerson(req, personId);
    const review = {
      id: `rev-${orderId}`,
      author: person?.displayName ?? 'Customer',
      avatar: '',
      rating,
      comment,
      postedAt: new Date().toISOString(),
      restaurantId: order.restaurantId,
      orderId,
    };
    void reviews.push(review).write();

    // The aggregate moves with the row — the discovery list never recomputes it.
    const restaurants = req.app.db.get('restaurants');
    const restaurant = restaurants.find({ id: order.restaurantId }).value();
    if (restaurant) {
      const reviewCount = restaurant.reviewCount + 1;
      const nextRating =
        Math.round(((restaurant.rating * restaurant.reviewCount + rating) / reviewCount) * 10) / 10;
      void restaurants
        .find({ id: order.restaurantId })
        .assign({ rating: nextRating, reviewCount })
        .write();
    }

    respondLater(res, 201, review);
    return;
  }

  if (isOrdersRead(req)) {
    const personId = personIdFrom(req);
    if (!personId) {
      respondLater(res, 401, errorBody(401));
      return;
    }

    // Staff read a Restaurant's orders; customers read their own. The scope
    // comes from the token's entitlements, never from a client-supplied param.
    const asRestaurant = req.query.forRestaurantId;
    const person = findPerson(req, personId);
    const entitled =
      asRestaurant && (person?.entitlements ?? []).some((e) => e.restaurantId === asRestaurant);

    if (asRestaurant && !entitled) {
      respondLater(res, 403, errorBody(403));
      return;
    }

    if (!isOrderItem(req)) {
      delete req.query.forRestaurantId;
      if (entitled) req.query.restaurantId = asRestaurant;
      else req.query.customerId = personId;
    }

    // Staff see the customer's phone, so a rider can call about a wrong gate
    // number. Customers reading their own orders never get this field.
    const phoneOf = (order) =>
      entitled ? (findPerson(req, order.customerId)?.phone ?? undefined) : undefined;
    const serve = (order) => {
      const shaped = progressed(order);
      const phone = shaped && phoneOf(shaped);
      return phone ? { ...shaped, customerPhone: phone } : shaped;
    };

    const send = res.jsonp.bind(res);
    res.jsonp = (body) => {
      // Someone else's order is a 404, not an empty 200 the client must interpret.
      if (isOrderItem(req) && body && body.customerId && body.customerId !== personId) {
        res.status(404);
        return send(errorBody(404));
      }
      return send(Array.isArray(body) ? body.map(serve) : serve(body));
    };
  }

  // Legality lives server-side, exactly like the real backend: an illegal
  // transition is a 409, and a staff-driven order stops auto-progressing.
  if (isOrderPatch(req) && req.body && typeof req.body === 'object' && req.body.status) {
    const orderId = req.path.split('/')[2];
    const stored = req.app.db.get('orders').find({ id: orderId }).value();

    if (stored) {
      const current = progressed(stored).status;
      const to = req.body.status;
      if (current !== to && !(TRANSITIONS[current] ?? []).includes(to)) {
        respondLater(res, 409, errorBody(409));
        return;
      }
      req.body.statusLocked = true;
    }
  }

  // The server owns status, placedAt and whose order it is.
  if (isOrderCreate(req) && req.body && typeof req.body === 'object') {
    const personId = personIdFrom(req);
    if (!personId) {
      respondLater(res, 401, errorBody(401));
      return;
    }
    req.body.customerId = personId;
    req.body.status = 'placed';
    req.body.placedAt = new Date().toISOString();
  }

  next();
};
