/* THROWAWAY PROTOTYPE — what lives on a Clip. ?variant=A|B|C|D|E.
   Letters stay stable so feedback keeps its meaning. */

const { clips, pairs } = window.FOODIO_CLIPS;

/* Inline outline icons. Unicode has no bookmark worth looking at, and a
   coloured emoji inside a monochrome rail reads as a mistake. */
const icon = (name, size = 23) => {
  const paths = {
    heart:
      '<path d="M12 20s-7-4.3-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.7 12 20 12 20z"/>',
    bookmark: '<path d="M7 4h10v16l-5-4-5 4V4z"/>',
    share: '<path d="M7 17 17 7M9 7h8v8"/>',
    mute: '<path d="M4 9h3l4-3v12l-4-3H4V9z"/><path d="m15 9 5 6M20 9l-5 6"/>',
  };
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
    stroke-linejoin="round">${paths[name]}</svg>`;
};

const money = (minor, currency = 'USD') =>
  new Intl.NumberFormat('en', { style: 'currency', currency }).format(minor / 100);

const eta = (r) => `${r.minMinutes}–${r.maxMinutes} min`;
const fee = (r) =>
  r.deliveryFeeMinor === 0 ? 'Free delivery' : money(r.deliveryFeeMinor, r.currency) + ' delivery';

/** Ours = the customer's receipt; theirs = the restaurant's marketing. */
const theirs = clips.filter((c) => c.kind === 'restaurant');

const tabbar = (cart = 1) => `
  <div class="tabbar">
    <div><span class="ic">&#9750;</span>Home</div>
    <div class="on"><span class="ic">&#9654;</span>Clips</div>
    <div><span class="cartwrap"><span class="ic">&#9812;</span><span class="dot">${cart}</span></span>Cart</div>
    <div><span class="ic">&#9776;</span>Orders</div>
  </div>`;

/** `preload="none"` + poster: ten autoplaying videos would stall the page. */
const media = (clip, cls = '') => `
  <video class="${cls}" muted loop playsinline preload="none"
         poster="${clip.poster}" data-src="${clip.media}"></video>`;

const authorBadge = (clip) =>
  clip.kind === 'customer'
    ? `<span class="badge ours">&#10003; Ordered and delivered</span>`
    : `<span class="badge">&#9634; From the restaurant</span>`;

/* ============ A — The pairing ===================================== */
/* One dish per page, both sides of its story stacked. You cannot watch
   the claim without the receipt directly under it. */

function variantA() {
  const page = (p) => {
    const r = p.sold.restaurant;
    return `
    <div class="cell">
      <div class="pair">
        <div class="half sold">
          ${media(p.sold)}
          <div class="scrim-top"></div>
          <div class="label">${authorBadge(p.sold)}</div>
        </div>
        <div class="half got">
          ${media(p.ours)}
          <div class="scrim"></div>
          <div class="label">${authorBadge(p.ours)}</div>
          <div class="foot">
            ${p.ours.person} ordered this &middot; ${new Date(p.ours.postedAt).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      <div class="seam">
        <div class="dish">
          <b>${p.dish.name}</b>
          <span>${p.sold.restaurantName} &middot; ${eta(r)}</span>
        </div>
        <div class="price">${money(p.dish.priceMinor, r.currency)}</div>
        <div class="add">Add &#43;</div>
      </div>

      <div class="mute">&#128263;</div>
      ${tabbar()}
    </div>`;
  };

  return {
    html: `<div class="feed">${pairs.map(page).join('')}</div>`,
    note: 'Every page is one dish arguing with itself: the restaurant’s clip above, the customer’s receipt below, the dish and its price on the seam. Ours-and-theirs stops being a badge and becomes the layout. Costs: half the pixels per video, and it only works for dishes that have both — 4 of 10 clips here.',
  };
}

/* ============ B — Shoppable ======================================= */
/* The clip names what you are looking at and sells it in place. */

function variantB() {
  const page = (c) => {
    const r = c.restaurant;
    const dish = c.dish;
    return `
    <div class="cell">
      ${media(c)}
      <div class="scrim"></div>
      <!-- Food footage is bright and pale: a white bar on it is invisible
           without something behind it. Found by looking, not by guessing. -->
      <div class="scrim-top"></div>
      <div class="mute">&#128263;</div>
      <!-- Top edge, not bottom: the shop card owns the bottom of the frame. -->
      <div class="progress" style="bottom:auto;top:0"><i style="width:38%"></i></div>

      ${
        dish
          ? `<div class="shop">
               <div class="top">
                 <img class="thumb" src="${dish.image}" alt="" />
                 <div class="meta">
                   <b>${dish.name}</b>
                   <span>${c.restaurantName} &middot; ${eta(r)} &middot; ${fee(r)}</span>
                 </div>
                 <div class="price">${money(dish.priceMinor, r.currency)}</div>
               </div>
               ${dish.optionGroups.length ? `<div class="opts">Choose ${dish.optionGroups.join(' and ').toLowerCase()} on the next screen</div>` : ''}
               <div class="cta">
                 <div class="buy">${dish.optionGroups.length ? 'Choose and add' : 'Add to cart'}</div>
                 ${dish.optionGroups.length ? '' : '<div class="step">&minus;<b>1</b>&plus;</div>'}
               </div>
               <span class="menu">View full menu &rsaquo;</span>
             </div>`
          : `<div class="overlay">
               ${authorBadge(c)}
               <div class="rname">${c.restaurantName}</div>
               <div class="cap">${c.caption}</div>
               <div class="ghostbtn">View menu &rsaquo;</div>
             </div>`
      }
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'The clip says what the dish is, what it costs, and sells it where you are standing. A dish with options says so and routes to the dish page rather than guessing a size. Costs: the card eats a third of the frame, and two of these ten clips have no dish attached at all — they fall back to the caption.',
  };
}

/* ============ C — The rail ======================================== */
/* The column every short-video feed has. No follow — nothing to follow yet. */

function variantC() {
  const page = (c, i) => {
    const saved = i === 1;
    const liked = i === 0;
    return `
    <div class="cell">
      ${media(c)}
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>
      <div class="progress"><i style="width:52%"></i></div>

      <div class="rail">
        <div class="act ${liked ? 'on' : ''}">
          <span class="glyph">${liked ? '&#9829;' : '&#9825;'}</span>
          ${124 + i * 17}
        </div>
        <div class="act ${saved ? 'on' : ''}">
          <span class="glyph">&#128278;</span>
          ${saved ? 'Saved' : 'Save'}
        </div>
        <div class="act">
          <span class="glyph">&#8599;</span>
          Share
        </div>
      </div>

      <div class="overlay narrow">
        ${authorBadge(c)}
        <div class="rname">${c.restaurantName}</div>
        <div class="cap">${c.caption}</div>
        <div class="ghostbtn">View menu &rsaquo;</div>
      </div>
      ${tabbar()}
    </div>`;
  };

  return {
    html: `<div class="feed">${clips.map(page).join('')}</div>`,
    note: 'Like, save, share — the convention people arrive expecting, and the cheapest of the four to build. Deliberately no Follow: there is no feed-by-restaurant to follow into, and a button that only changes its own label is a lie. Costs: a saved clip needs somewhere to live, which is a screen that does not exist.',
  };
}

/* ============ D — Steered ========================================= */
/* A river you can point. Filters over the feed, and closed said out loud. */

function variantD() {
  const cuisines = [...new Set(theirs.flatMap((c) => c.restaurant.cuisines))].slice(0, 4);

  const page = (c, i) => {
    const closed = i === 1;
    return `
    <div class="cell v-d">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>

      <div class="filters">
        <span class="pill on">All</span>
        <span class="pill">Delivers to you</span>
        <span class="pill">Open now</span>
        ${cuisines.map((x) => `<span class="pill">${x}</span>`).join('')}
      </div>
      <div class="count">${theirs.length} clips near Gulberg</div>
      <div class="mute">&#128263;</div>

      ${closed ? `<div class="closedbar">&#9201; ${c.restaurantName} is closed &middot; opens 11:00 AM</div>` : ''}

      <div class="overlay">
        ${authorBadge(c)}
        <div class="rname">${c.restaurantName} &middot; <span style="font-weight:400;color:#cbd5e1">${eta(c.restaurant)}</span></div>
        <div class="cap">${c.caption}</div>
        <div class="ghostbtn">${closed ? 'Order for later &rsaquo;' : 'View menu &rsaquo;'}</div>
      </div>
      ${tabbar()}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'Filters turn the tab from a river into something you can point: delivers to you, open now, by cuisine. A closed restaurant says so on the clip rather than at checkout. Costs: chrome at the top of a full-bleed video, and a filtered feed that can come back empty.',
  };
}

/* ============ F — Steered + rail, and a way to get the dish ======== */
/* D and C chosen, plus the thing neither of them does: act on the dish.
   What the button says is decided by the dish, not by the layout — a dish
   that asks a question cannot be added without an answer (#148), and a clip
   that added one silently would contradict the menu row two taps away. */

function variantF() {
  const page = (c, i) => {
    const closed = i === 1;
    const dish = c.dish;
    const liked = i === 0;
    const saved = i === 2;

    const action = !dish
      ? `<a class="act-btn ghost">View menu &rsaquo;</a>`
      : dish.optionGroups.length
        ? `<a class="act-btn ghost">Choose &rsaquo;</a>`
        : `<a class="act-btn">Add &#43;</a>`;

    return `
    <div class="cell v-d">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>

      <div class="filters">
        <span class="pill on">All</span>
        <span class="pill">Delivers to you</span>
        <span class="pill">Open now</span>
        <span class="pill">${c.restaurant.cuisines[0]}</span>
      </div>
      <div class="count">${theirs.length} clips near Gulberg</div>
      <div class="mute">&#128263;</div>

      <div class="rail" style="bottom:196px">
        <div class="act ${liked ? 'on' : ''}">
          <span class="glyph">${liked ? '&#9829;' : '&#9825;'}</span>${124 + i * 17}
        </div>
        <div class="act ${saved ? 'on' : ''}">
          <span class="glyph">&#128278;</span>${saved ? 'Saved' : 'Save'}
        </div>
        <div class="act"><span class="glyph">&#8599;</span>Share</div>
      </div>

      ${closed ? `<div class="closedbar" style="bottom:228px;right:76px">&#9201; Closed &middot; opens 11:00 AM</div>` : ''}

      <div class="overlay narrow" style="bottom:122px">
        ${authorBadge(c)}
        <div class="rname">${c.restaurantName} &middot; <span style="font-weight:400;color:#cbd5e1">${eta(c.restaurant)}</span></div>
        <div class="cap">${c.caption}</div>
      </div>

      <!-- The dish bar spans the full width: the rail stops above it, so
           nothing competes with the one thing you came here to do. -->
      <div class="dishbar">
        <div class="d">
          <b>${dish ? dish.name : c.restaurantName}</b>
          <span>${dish ? money(dish.priceMinor, c.restaurant.currency) + (dish.optionGroups.length ? ' · ' + dish.optionGroups.join(', ').toLowerCase() : '') : c.restaurant.cuisines.join(' · ')}</span>
        </div>
        ${action}
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'D and C together, plus the thing neither does: act on the dish. The button is decided by the dish — Add for one that asks nothing, Choose for one with a required size, View menu when the clip names no dish at all. All three are in this scroll. Costs: a third band of chrome, and the rail has to stop above the dish bar.',
  };
}

/* ============ G — Edge ============================================ */
/* No cards. Everything is type on the edges of the frame: filters are a line
   of words, the rail is outlines, the dish is one rule and one line. Closed
   is not a banner — it replaces the ETA, where the eye already is. */

function variantG() {
  const page = (c, i) => {
    const closed = i === 1;
    const dish = c.dish;
    const liked = i === 0;

    const action = !dish
      ? `<span class="g-link">View menu &rsaquo;</span>`
      : dish.optionGroups.length
        ? `<span class="g-link">Choose &rsaquo;</span>`
        : `<span class="g-plus">&#43;</span>`;

    return `
    <div class="cell v-g">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>

      <div class="g-filters">
        <span class="on">All</span><span>Near you</span><span>Open now</span>
        <span>${c.restaurant.cuisines[0]}</span>
      </div>
      <div class="g-mute">${icon('mute', 21)}</div>

      <div class="g-rail">
        <div class="${liked ? 'on' : ''}"><i>${icon('heart')}</i>${124 + i * 17}</div>
        <div><i>${icon('bookmark')}</i>Save</div>
        <div><i>${icon('share')}</i>Share</div>
      </div>

      <div class="g-foot">
        <div class="g-who">
          ${c.kind === 'customer' ? '<em>Ordered and delivered</em> &middot; ' : ''}
          ${c.restaurantName}
          <span class="${closed ? 'shut' : 'muted'}">
            &middot; ${closed ? 'Closed, opens 11:00' : eta(c.restaurant)}
          </span>
        </div>
        <div class="g-cap">${c.caption}</div>
        <div class="g-rule"></div>
        <div class="g-dish">
          <span class="nm">${dish ? dish.name : 'See the whole menu'}</span>
          ${dish ? `<span class="pr">${money(dish.priceMinor, c.restaurant.currency)}</span>` : ''}
          ${action}
        </div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'No boxes anywhere. Filters are words with the live one underlined, the rail is outlines with no discs behind them, and the dish is one hairline and one line of type. Closed replaces the delivery estimate instead of arriving as a banner — same place, same sentence, no new object. The video keeps almost all of the frame.',
  };
}

/* ============ H — Sheet =========================================== */
/* Stop fighting the footage: the video is a card, the controls live under it
   on solid ground. Nothing floats on the picture except mute. */

function variantH() {
  const page = (c, i) => {
    const closed = i === 1;
    const dish = c.dish;
    const liked = i === 0;

    const action = !dish
      ? `<a class="h-btn ghost">View menu &rsaquo;</a>`
      : dish.optionGroups.length
        ? `<a class="h-btn ghost">Choose size &rsaquo;</a>`
        : `<a class="h-btn">Add to cart &#43;</a>`;

    return `
    <div class="cell v-h">
      <div class="h-col">
      <div class="h-filters">
        <span class="on">All</span><span>Near you</span><span>Open now</span>
        <span>${c.restaurant.cuisines[0]}</span>
      </div>

      <div class="h-stage">
        ${media(c, 'h-video')}
        <div class="h-mute">${icon('mute', 17)}</div>
        <div class="h-prog"><i style="width:46%"></i></div>
      </div>

      <div class="h-sheet">
        <div class="h-top">
          <div class="h-who">
            <b>${c.restaurantName}</b>
            <span>${closed ? '<em class="shut">Closed · opens 11:00</em>' : eta(c.restaurant)} &middot; ${fee(c.restaurant)}</span>
          </div>
          <div class="h-acts">
            <span class="${liked ? 'on' : ''}">${icon('heart', 19)}<small>${124 + i * 17}</small></span>
            <span>${icon('bookmark', 19)}<small>Save</small></span>
            <span>${icon('share', 19)}<small>Share</small></span>
          </div>
        </div>

        <div class="h-cap">${c.caption}</div>

        <div class="h-dish">
          ${dish ? `<img src="${dish.image}" alt="" />` : ''}
          <div class="h-meta">
            <b>${dish ? dish.name : c.restaurantName}</b>
            <span>${dish ? money(dish.priceMinor, c.restaurant.currency) + (dish.optionGroups.length ? ' · choose ' + dish.optionGroups.join(' and ').toLowerCase() : '') : c.restaurant.cuisines.join(' · ')}</span>
          </div>
        </div>
        ${action}
      </div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'The video stops being a backdrop for floating boxes and becomes a card, with the controls under it on solid ground. Everything is legible because nothing is competing with footage — the problem the clips-feed spec solved with a scrim, solved here by not overlapping at all. Costs: the video loses a third of its height, and it reads less like a feed and more like a post.',
  };
}

/* ============ I — Quiet =========================================== */
/* One action, and it carries the dish. The filter is a title, not a toolbar.
   Nothing else is on the picture. */

function variantI() {
  const page = (c, i) => {
    const closed = i === 1;
    const dish = c.dish;
    const liked = i === 0;

    const label = !dish
      ? 'See the menu'
      : closed
        ? `Order ${dish.name} for later`
        : dish.optionGroups.length
          ? `Choose ${dish.name} &middot; ${money(dish.priceMinor, c.restaurant.currency)}`
          : `Add ${dish.name} &middot; ${money(dish.priceMinor, c.restaurant.currency)}`;

    return `
    <div class="cell v-i">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>

      <div class="i-title">All clips <b>&#9662;</b></div>
      <div class="i-mute">${icon('mute', 21)}</div>

      <div class="i-rail">
        <span class="${liked ? 'on' : ''}">${icon('heart', 25)}</span>
        <span>${icon('bookmark', 25)}</span>
        <span>${icon('share', 25)}</span>
      </div>

      <div class="i-foot">
        <div class="i-who">
          ${c.restaurantName}
          <span>&middot; ${closed ? 'opens 11:00' : eta(c.restaurant)}</span>
        </div>
        <div class="i-cap">${c.caption}</div>
        <a class="i-btn ${closed ? 'later' : ''}">${label}</a>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'One button, and it says the dish and the price itself — so the dish row and the action collapse into a single object instead of two stacked ones. The filter becomes a title you can tap rather than a toolbar sitting on the footage. Closed changes what the button offers rather than adding a warning. Costs: one filter visible at a time, and a long dish name has nowhere to go.',
  };
}

/* ============ J — F, without the bar ============================== */
/* F's language kept: pill filters, a rail of discs. What changed is where
   the order lives — in the rail, above Share — and the slab above the tab
   bar is gone. The info block is B's shape: the dish, then its restaurant,
   its time and its price on one line. */

function variantJ() {
  const page = (c, i) => {
    const closed = i === 1;
    const dish = c.dish;
    const liked = i === 0;
    const saved = i === 2;

    /* #148's rule, said in one word: a dish that asks a question opens the
       dish page, it is not added behind the customer's back. */
    const order = !dish
      ? { glyph: '&#9776;', label: 'Menu', ghost: true }
      : dish.optionGroups.length
        ? { glyph: '&rsaquo;', label: 'Choose', ghost: true }
        : { glyph: '&#43;', label: 'Add', ghost: false };

    const title = dish ? dish.name : c.restaurantName;
    const line = dish
      ? `${c.restaurantName} &middot; ${closed ? `<em class="shut">opens 11:00</em>` : eta(c.restaurant)} &middot; ${money(dish.priceMinor, c.restaurant.currency)}`
      : `${c.restaurant.cuisines.join(' · ')} &middot; ${closed ? `<em class="shut">opens 11:00</em>` : eta(c.restaurant)}`;

    return `
    <div class="cell v-j">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>

      <div class="filters">
        <span class="pill on">All</span>
        <span class="pill">Delivers to you</span>
        <span class="pill">Open now</span>
        <span class="pill">${c.restaurant.cuisines[0]}</span>
      </div>
      <div class="count">${theirs.length} clips near Gulberg</div>
      <div class="mute">&#128263;</div>

      <div class="j-rail">
        <div class="act ${liked ? 'on' : ''}">
          <span class="glyph">${icon('heart', 21)}</span>${124 + i * 17}
        </div>
        <div class="act ${saved ? 'on' : ''}">
          <span class="glyph">${icon('bookmark', 21)}</span>${saved ? 'Saved' : 'Save'}
        </div>
        <div class="act order">
          <span class="glyph ${order.ghost ? 'ghost' : ''}">${order.glyph}</span>${order.label}
        </div>
        <div class="act"><span class="glyph">${icon('share', 21)}</span>Share</div>
      </div>

      <div class="j-foot">
        ${authorBadge(c)}
        <div class="j-dish">${title}</div>
        <div class="j-line">${line}</div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: "F with the slab above the tab bar removed and the order moved into the rail, directly above Share. The info is B's shape — the dish, then its restaurant, delivery time and price on one line. Closed takes the slot the delivery time was in rather than arriving as a banner. The video gets back the third of the frame F had taken from it.",
  };
}

/* ============ E — Everything ====================================== */
/* All four at once, on purpose: the honest way to see what it costs. */

function variantE() {
  const page = (p) => {
    const r = p.sold.restaurant;
    return `
    <div class="cell e-compact">
      <div class="pair" style="bottom:216px">
        <div class="half sold">
          ${media(p.sold)}
          <div class="scrim-top"></div>
          <div class="label">${authorBadge(p.sold)}</div>
        </div>
        <div class="half got">
          ${media(p.ours)}
          <div class="label">${authorBadge(p.ours)}</div>
        </div>
      </div>

      <div class="filters">
        <span class="pill on">All</span>
        <span class="pill">Delivers to you</span>
        <span class="pill">Open now</span>
      </div>
      <div class="mute">&#128263;</div>

      <div class="rail" style="bottom:252px">
        <div class="act"><span class="glyph">&#9825;</span>124</div>
        <div class="act"><span class="glyph">&#128278;</span>Save</div>
        <div class="act"><span class="glyph">&#8599;</span>Share</div>
      </div>

      <div class="shop">
        <div class="top">
          <img class="thumb" src="${p.dish.image}" alt="" />
          <div class="meta">
            <b>${p.dish.name}</b>
            <span>${p.sold.restaurantName} &middot; ${eta(r)} &middot; ${fee(r)}</span>
          </div>
          <div class="price">${money(p.dish.priceMinor, r.currency)}</div>
        </div>
        <div class="cta">
          <div class="buy">${p.dish.optionGroups.length ? 'Choose and add' : 'Add to cart'}</div>
          ${p.dish.optionGroups.length ? '' : '<div class="step">&minus;<b>1</b>&plus;</div>'}
        </div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${pairs.map(page).join('')}</div>`,
    note: 'Everything at once — the pairing, the shop card, the rail, the filters. Included so the cost is arguable rather than imagined: the video is now a letterbox between two bands of chrome, and the thing the tab exists to show is the smallest part of the screen. If this looks wrong, that is the finding.',
  };
}

/* ================================================================== */

const VARIANTS = [
  ['A', 'The pairing', variantA],
  ['B', 'Shoppable', variantB],
  ['C', 'The rail', variantC],
  ['D', 'Steered', variantD],
  ['F', 'Steered + rail + act', variantF],
  ['G', 'Edge', variantG],
  ['H', 'Sheet', variantH],
  ['I', 'Quiet', variantI],
  ['J', 'F, without the bar', variantJ],
  ['E', 'Everything', variantE],
];

const screen = document.getElementById('screen');

/** Only the clip you are looking at plays — ten at once stalls the page. */
function wirePlayback() {
  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.intersectionRatio < 0.55) {
          video.pause();
          continue;
        }
        if (!video.src) video.src = video.dataset.src;
        video.play().catch(() => {
          /* autoplay refused: the poster is still the right picture */
        });
      }
    },
    { root: screen.querySelector('.feed'), threshold: [0, 0.55, 1] },
  );

  screen.querySelectorAll('video').forEach((v) => seen.observe(v));
}

function render() {
  const key = (new URLSearchParams(location.search).get('variant') ?? 'A').toUpperCase();
  const i = Math.max(
    0,
    VARIANTS.findIndex((v) => v[0] === key),
  );
  const [k, name, fn] = VARIANTS[i];
  const { html, note } = fn();

  screen.innerHTML = html;
  document.getElementById('vkey').textContent = k;
  document.getElementById('vname').textContent = name;
  document.getElementById('vnote').textContent = note;
  wirePlayback();

  return i;
}

function go(step) {
  const i = render();
  const next = VARIANTS[(i + step + VARIANTS.length) % VARIANTS.length][0];
  const url = new URL(location.href);
  url.searchParams.set('variant', next);
  history.replaceState({}, '', url);
  render();
}

document.getElementById('prev').onclick = () => go(-1);
document.getElementById('next').onclick = () => go(1);

document.addEventListener('keydown', (e) => {
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t?.isContentEditable)
    return;
  if (e.key === 'ArrowLeft') go(-1);
  if (e.key === 'ArrowRight') go(1);
});

render();
