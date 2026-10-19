/* THROWAWAY PROTOTYPE — what lives on a Clip. ?variant=A|B|C|D|E.
   Letters stay stable so feedback keeps its meaning. */

const { clips, pairs, kitchens } = window.FOODIO_CLIPS;

/* Inline outline icons. Unicode has no bookmark worth looking at, and a
   coloured emoji inside a monochrome rail reads as a mistake. */
const icon = (name, size = 23) => {
  const paths = {
    heart:
      '<path d="M12 20s-7-4.3-7-9.2A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.8C19 15.7 12 20 12 20z"/>',
    bookmark: '<path d="M7 4h10v16l-5-4-5 4V4z"/>',
    share: '<path d="M7 17 17 7M9 7h8v8"/>',
    mute: '<path d="M4 9h3l4-3v12l-4-3H4V9z"/><path d="m15 9 5 6M20 9l-5 6"/>',
    bag: '<path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    play: '<path d="M8 5v14l11-7L8 5z" fill="currentColor" stroke="none"/>',
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

const tabbar = (cart = 1, active = 'Clips') => `
  <div class="tabbar">
    <div class="${active === 'Home' ? 'on' : ''}"><span class="ic">&#9750;</span>Home</div>
    <div class="${active === 'Clips' ? 'on' : ''}"><span class="ic">&#9654;</span>Clips</div>
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
               ${dish.needsChoosing ? `<div class="opts">Choose ${dish.optionGroups.join(' and ').toLowerCase()} on the next screen</div>` : ''}
               <div class="cta">
                 <div class="buy">${dish.needsChoosing ? 'Choose and add' : 'Add to cart'}</div>
                 ${dish.needsChoosing ? '' : '<div class="step">&minus;<b>1</b>&plus;</div>'}
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
      : dish.needsChoosing
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
          <span>${dish ? money(dish.priceMinor, c.restaurant.currency) + (dish.needsChoosing ? ' · ' + dish.optionGroups.join(', ').toLowerCase() : '') : c.restaurant.cuisines.join(' · ')}</span>
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
      : dish.needsChoosing
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
      : dish.needsChoosing
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
            <span>${dish ? money(dish.priceMinor, c.restaurant.currency) + (dish.needsChoosing ? ' · choose ' + dish.optionGroups.join(' and ').toLowerCase() : '') : c.restaurant.cuisines.join(' · ')}</span>
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
        : dish.needsChoosing
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
      : dish.needsChoosing
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

/* ================================================================== *
 * BATCH 1 — K to O. Five ways to act, each taken from a shipped app. *
 * Sources are listed in the mockups README.                          *
 * ================================================================== */

/* ============ K — The bag ========================================= */
/* TikTok Shop puts a shopping-bag icon on the video during playback and
   lets one video carry several product tags. A clip of a table is rarely
   one dish, so the bag opens everything the clip is showing. */

function variantK() {
  const page = (c, i) => {
    const open = i === 0;
    /* A clip shows a table, not a dish: the bag holds what is in frame. */
    const tagged = [c.dish, ...clips.filter((x) => x.dish && x.id !== c.id).map((x) => x.dish)]
      .filter(Boolean)
      .slice(0, 3);

    return `
    <div class="cell v-k">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>

      <div class="k-bag ${open ? 'lit' : ''}">
        ${icon('bag', 22)}<i>${tagged.length}</i>
      </div>

      <div class="k-foot">
        ${authorBadge(c)}
        <div class="k-name">${c.restaurantName} &middot; <span>${eta(c.restaurant)}</span></div>
      </div>

      ${
        open
          ? `<div class="k-drawer">
               <div class="k-grab"></div>
               <div class="k-head">In this clip <span>${tagged.length} dishes</span></div>
               ${tagged
                 .map(
                   (d) => `
                 <div class="k-row">
                   <img src="${d.image}" alt="" />
                   <div class="k-meta"><b>${d.name}</b><span>${money(d.priceMinor, c.restaurant.currency)}</span></div>
                   <span class="k-add ${d.needsChoosing ? 'ghost' : ''}">${d.needsChoosing ? 'Choose' : 'Add'}</span>
                 </div>`,
                 )
                 .join('')}
             </div>`
          : ''
      }
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'From TikTok Shop: a bag on the video during playback, and one clip tagging several dishes. A clip of a table is rarely one dish, so the bag counts what is in frame and opens a drawer of all of it. The first clip is shown with the drawer open. Costs: nothing is priced until you open it, so a browser never sees a number.',
  };
}

/* ============ L — Peek ============================================ */
/* Instagram Reels shows a product name and price preview on the video;
   tapping raises a detail sheet. The preview is one small chip, so the
   footage keeps the frame until somebody is interested. */

function variantL() {
  const page = (c, i) => {
    const raised = i === 0;
    const dish = c.dish;

    return `
    <div class="cell v-l">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>

      ${
        dish
          ? `<div class="l-chip">${icon('bag', 14)} ${dish.name} &middot; <b>${money(dish.priceMinor, c.restaurant.currency)}</b></div>`
          : ''
      }

      <div class="l-foot">
        ${authorBadge(c)}
        <div class="l-name">${c.restaurantName}</div>
        <div class="l-cap">${c.caption}</div>
      </div>

      ${
        raised && dish
          ? `<div class="l-sheet">
               <div class="k-grab"></div>
               <img class="l-hero" src="${dish.image}" alt="" />
               <div class="l-title"><b>${dish.name}</b><span>${money(dish.priceMinor, c.restaurant.currency)}</span></div>
               <div class="l-sub">${c.restaurantName} &middot; ${eta(c.restaurant)} &middot; ${fee(c.restaurant)}</div>
               ${
                 dish.needsChoosing
                   ? `<div class="l-opts">${dish.optionGroups.map((g) => `<span>${g}</span>`).join('')}</div>`
                   : ''
               }
               <div class="l-cta">${dish.needsChoosing ? 'Choose and add' : 'Add to cart'}</div>
             </div>`
          : ''
      }
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'From Instagram Reels shopping: a name-and-price chip on the video, and a detail sheet when somebody taps it. The clip keeps its frame until there is interest, and the sheet can be as long as it needs to be. The first clip is shown with the sheet raised. Costs: two taps to order, and a chip is easy to never notice.',
  };
}

/* ============ M — Moods =========================================== */
/* Netflix's Clips feed browses by mood, genre and occasion rather than by
   filter, and offers three actions: add to a list, share, open. Hunger is
   an occasion before it is a cuisine. */

function variantM() {
  const MOODS = ['Late night', 'Cheap and fast', 'Feeding four', 'Something sweet', 'Comfort'];

  const page = (c, i) => `
    <div class="cell v-m">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>

      <div class="m-moods">
        ${MOODS.map((m, n) => `<span class="${n === i % MOODS.length ? 'on' : ''}">${m}</span>`).join('')}
      </div>

      <div class="m-foot">
        <div class="m-mood">${MOODS[i % MOODS.length]}</div>
        <div class="m-dish">${c.dish ? c.dish.name : c.restaurantName}</div>
        <div class="m-line">
          ${c.restaurantName} &middot; ${eta(c.restaurant)}${c.dish ? ' &middot; ' + money(c.dish.priceMinor, c.restaurant.currency) : ''}
        </div>
        <div class="m-acts">
          <span class="primary">${c.dish && !c.dish.needsChoosing ? 'Add' : 'Open'}</span>
          <span>${icon('bookmark', 17)} List</span>
          <span>${icon('share', 17)} Share</span>
        </div>
      </div>
      ${tabbar(2)}
    </div>`;

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'From Netflix Clips, which browses by mood, genre and occasion rather than by filter, and carries exactly three actions. Hunger is an occasion before it is a cuisine — "late night" and "feeding four" are things a person actually is. Costs: somebody has to decide which mood a dish belongs to, and that is editorial work nobody has budgeted.',
  };
}

/* ============ N — Yours =========================================== */
/* Spotify's 2023 home turned into a video feed but kept the shortcuts to
   your own playlists pinned above it. The equivalent here is the thing a
   food app has that a music app does not: you ordered this before. */

function variantN() {
  const page = (c, i) => `
    <div class="cell v-n">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>

      <div class="n-shortcuts">
        <div class="sc"><img src="${theirs[0].dish.image}" alt="" /><span>Order again</span></div>
        <div class="sc"><img src="${theirs[2].dish.image}" alt="" /><span>Saved</span></div>
        <div class="sc"><img src="${theirs[3].dish.image}" alt="" /><span>Last order</span></div>
      </div>

      <div class="n-foot">
        ${i === 2 ? '<div class="n-again">You ordered this in August</div>' : ''}
        <div class="n-dish">${c.dish ? c.dish.name : c.restaurantName}</div>
        <div class="n-line">
          ${c.restaurantName} &middot; ${eta(c.restaurant)}${c.dish ? ' &middot; ' + money(c.dish.priceMinor, c.restaurant.currency) : ''}
        </div>
        <div class="n-btn">${c.dish && !c.dish.needsChoosing ? 'Add to cart' : 'Open the dish'}</div>
      </div>
      ${tabbar(2)}
    </div>`;

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'From Spotify, which turned its home into a video feed but kept shortcuts to your own playlists pinned above it. A food app has something a music app does not: you ate this before, and you would eat it again. The shortcuts are reorder, saved and last order, and a clip you have ordered says so. Costs: three rows of thumbnails is a lot of chrome for a feed that is meant to be watched.',
  };
}

/* ============ O — Deck ============================================ */
/* Feed Me and Crave swipe a deck rather than scroll a feed: right saves,
   left discards. Chicken Tinder added a third gesture for "love it".
   Crave swiped dishes rather than restaurants, which is the right unit. */

function variantO() {
  const deck = theirs.filter((c) => c.dish).slice(0, 3);

  return {
    html: `<div class="cell v-o" style="height:820px">
      <div class="o-head">Tonight &middot; <span>Gulberg</span></div>

      <div class="o-deck">
        ${deck
          .map(
            (c, i) => `
          <div class="o-card" style="--n:${i}">
            ${media(c, 'o-video')}
            <div class="scrim"></div>
            <div class="o-meta">
              <b>${c.dish.name}</b>
              <span>${c.restaurantName} &middot; ${eta(c.restaurant)} &middot; ${money(c.dish.priceMinor, c.restaurant.currency)}</span>
            </div>
            ${i === 0 ? '<div class="o-stamp want">Want it</div>' : ''}
          </div>`,
          )
          .reverse()
          .join('')}
      </div>

      <div class="o-acts">
        <div class="o-act skip">&#10005;<small>Not tonight</small></div>
        <div class="o-act want">&#9650;<small>Want it</small></div>
        <div class="o-act save">${icon('bookmark', 22)}<small>Save</small></div>
      </div>
      ${tabbar(2)}
    </div>`,
    note: 'From Feed Me and Crave, which swipe a deck instead of scrolling a feed — right saves, left discards — and Chicken Tinder, which added a third gesture for "want it". Crave swiped dishes rather than restaurants, which is the right unit for an app whose clips are of dishes. A decision per card, and the deck ends. Costs: it is a different app from a feed, and a rejection mechanic applied to a small restaurant is crueller than it looks.',
  };
}

/* ================================================================== *
 * BATCH 2 — P to T. Five shapes, not five buttons. Each changes what  *
 * the screen *is*, not what sits on top of it.                        *
 * ================================================================== */

/* ============ P — Table =========================================== */
/* Chicken Tinder's group mode: everyone swipes privately and the app
   recommends what fits all of them. Ordering for four is the normal case
   in this market and no surface in the app admits it exists. */

function variantP() {
  const EATERS = ['A', 'S', 'M', 'F'];
  const page = (c, i) => {
    const votes = [3, 4, 1, 2, 2, 3][i];
    const dish = c.dish;

    return `
    <div class="cell v-p">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>

      <div class="p-head">
        <div class="p-who">${EATERS.map((e, n) => `<i class="${n < votes ? 'in' : ''}">${e}</i>`).join('')}</div>
        <span>Friday, four of you</span>
      </div>

      <div class="p-foot">
        <div class="p-tally ${votes === EATERS.length ? 'all' : ''}">
          ${votes === EATERS.length ? 'Everyone wants this' : `${votes} of ${EATERS.length} want this`}
        </div>
        <div class="p-dish">${dish ? dish.name : c.restaurantName}</div>
        <div class="p-line">
          ${c.restaurantName} &middot; ${eta(c.restaurant)}${dish ? ' &middot; ' + money(dish.priceMinor, c.restaurant.currency) : ''}
        </div>
        <div class="p-acts">
          <span class="no">Pass</span>
          <span class="yes">I want this</span>
        </div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'From Chicken Tinder, where each person swipes privately and the app recommends what fits everyone. Ordering for four is the normal case in this market and no surface in the app admits it exists. The tally is the whole interface: a dish everybody wants stops being a debate. Costs: it needs a shared session, which is a backend nobody has built, and a table of one is a worse version of every other variant here.',
  };
}

/* ============ Q — Live =========================================== */
/* Whatnot's model is a live stream with chat, reactions and buy-in-stream.
   A kitchen at 8pm is already a show nobody is broadcasting. */

function variantQ() {
  const CHAT = [
    ['Hira', 'is the karahi spicy?'],
    ['Bilal', 'ordered. 20 min 🤞'],
    ['Taco Fiesta', 'spicy on request — say so in the note'],
    ['Zara', 'that consomé 😍'],
  ];

  const page = (c, i) => {
    const live = i === 0;
    const dish = c.dish;

    return `
    <div class="cell v-q">
      ${media(c)}
      <div class="scrim-top"></div>
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>

      <div class="q-head">
        ${live ? '<span class="q-live">LIVE</span>' : '<span class="q-replay">Replay</span>'}
        <span class="q-watch">${live ? '41 watching' : 'streamed 2h ago'}</span>
      </div>

      ${
        live
          ? `<div class="q-chat">
               ${CHAT.map(
                 ([who, text]) =>
                   `<div class="${who === c.restaurantName ? 'kitchen' : ''}"><b>${who}</b> ${text}</div>`,
               ).join('')}
             </div>`
          : ''
      }

      <div class="q-foot">
        <div class="q-name">${c.restaurantName}</div>
        <div class="q-bar">
          <div class="q-dish">
            <b>${dish ? dish.name : 'Tonight&rsquo;s menu'}</b>
            <span>${dish ? money(dish.priceMinor, c.restaurant.currency) + ' · ' + eta(c.restaurant) : eta(c.restaurant)}</span>
          </div>
          <span class="q-buy">${live ? 'Order now' : 'Order'}</span>
        </div>
        ${live ? '<div class="q-say">Say something…</div>' : ''}
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'From Whatnot and live commerce generally: a stream, a chat, and buying without leaving it. A kitchen at 8pm is already a show nobody is broadcasting, and the Kitchen surface this app already has is the camera. The first clip is live; the rest are replays, which is what most of a live feed actually is. Costs: somebody has to be there, and an empty live tab is worse than no live tab.',
  };
}

/* ============ R — Shelf ========================================== */
/* EasyEat used a Pinterest-style card layout on the reasoning that people
   judge food visually. A feed shows one dish at a time; a shelf shows
   nine, and comparison is the thing a feed cannot do. */

function variantR() {
  const tiles = clips.filter((c) => c.poster);

  return {
    html: `<div class="cell v-r" style="height:820px">
      <div class="r-head">
        <b>Near you</b>
        <div class="r-tabs"><span class="on">All</span><span>Open now</span><span>Under $20</span></div>
      </div>

      <div class="r-grid">
        ${[0, 1]
          .map(
            (col) => `
        <div class="r-col">
        ${tiles
          .filter((_, i) => i % 2 === col)
          .map(
            (c, i) => `
          <div class="r-tile ${(i + col) % 3 === 0 ? 'tall' : ''}">
            <img src="${c.poster}" alt="" />
            <div class="r-play">${icon('play', 13)}</div>
            ${c.kind === 'customer' ? '<span class="r-badge">Delivered</span>' : ''}
            <div class="r-meta">
              <b>${c.dish ? c.dish.name : c.restaurantName}</b>
              <span>${c.dish ? money(c.dish.priceMinor, c.restaurant.currency) + ' · ' : ''}${eta(c.restaurant)}</span>
            </div>
          </div>`,
          )
          .join('')}
        </div>`,
          )
          .join('')}
      </div>
      ${tabbar(2)}
    </div>`,
    note: 'From EasyEat, which used a Pinterest-style layout because people judge food visually. A feed shows one dish at a time and comparison is the thing it cannot do — a shelf shows nine and lets the eye choose. Tapping a tile plays it full screen. Costs: it stops being a clips feed and becomes a gallery, and autoplay across nine tiles is exactly the decoder problem the clips-feed spec fought on the A15.',
  };
}

/* ============ S — Chapters ======================================= */
/* The segmented progress bar from stories, applied to a restaurant rather
   than a person: one kitchen, several clips, tap to advance. A restaurant
   is more than one dish and the feed never says so. */

function variantS() {
  const chapters = theirs.slice(0, 4);
  const at = 1;

  return {
    html: `<div class="cell v-s" style="height:820px">
      ${media(chapters[at])}
      <div class="scrim-top"></div>
      <div class="scrim"></div>
      <div class="mute">&#128263;</div>

      <div class="s-segs">
        ${chapters
          .map((_, i) => `<i><b style="width:${i < at ? 100 : i === at ? 46 : 0}%"></b></i>`)
          .join('')}
      </div>

      <div class="s-head">
        <img src="${chapters[at].restaurant.image}" alt="" />
        <div>
          <b>${chapters[at].restaurantName}</b>
          <span>${eta(chapters[at].restaurant)} &middot; ${fee(chapters[at].restaurant)}</span>
        </div>
        <span class="s-follow">Menu</span>
      </div>

      <div class="s-foot">
        <div class="s-count">Dish ${at + 1} of ${chapters.length}</div>
        <div class="s-dish">${chapters[at].dish ? chapters[at].dish.name : chapters[at].restaurantName}</div>
        <div class="s-line">${chapters[at].dish ? money(chapters[at].dish.priceMinor, chapters[at].restaurant.currency) : ''}</div>
        <div class="s-cta">Add &#43;</div>
      </div>
      ${tabbar(2)}
    </div>`,
    note: 'The segmented bar from stories, applied to a restaurant rather than a person: one kitchen, several dishes, tap to advance. A restaurant is more than one dish and a feed never says so — it shuffles four kitchens and shows you one thing from each. Here you meet a kitchen. Costs: a kitchen with one clip has no chapters, and tap-to-advance fights tap-to-pause for the same gesture.',
  };
}

/* ============ T — Tray =========================================== */
/* Live commerce is built on buying without leaving the stream. The basket
   is usually a number in a corner; here it is a shelf that fills under the
   video as you scroll, so an order is assembled rather than remembered. */

function variantT() {
  const inTray = theirs.filter((c) => c.dish).slice(0, 2);
  const total = inTray.reduce((sum, c) => sum + c.dish.priceMinor, 0);

  const page = (c, i) => `
    <div class="cell v-t">
      <div class="t-stage">
        ${media(c, 't-video')}
        <div class="scrim"></div>
        <div class="t-mute">&#128263;</div>
        <div class="t-meta">
          <b>${c.dish ? c.dish.name : c.restaurantName}</b>
          <span>${c.restaurantName} &middot; ${eta(c.restaurant)}${c.dish ? ' &middot; ' + money(c.dish.priceMinor, c.restaurant.currency) : ''}</span>
        </div>
        <div class="t-add">${c.dish && !c.dish.needsChoosing ? '&#43; Add' : 'Choose &rsaquo;'}</div>
      </div>

      <div class="t-tray">
        <div class="t-items">
          ${inTray
            .map(
              (x) =>
                `<div class="t-chip"><img src="${x.dish.image}" alt="" /><span>${x.dish.name}</span></div>`,
            )
            .join('')}
          <div class="t-chip ghost">+ ${i + 1}</div>
        </div>
        <div class="t-sum">
          <span>${inTray.length + 1} items</span>
          <b>${money(total + (c.dish ? c.dish.priceMinor : 0), c.restaurant.currency)}</b>
          <span class="t-go">Checkout &rsaquo;</span>
        </div>
      </div>
      ${tabbar(3)}
    </div>`;

  return {
    html: `<div class="feed">${theirs.map(page).join('')}</div>`,
    note: 'Live commerce is built on buying without leaving the stream, and the basket is usually a number in a corner. Here it is a shelf under the video that fills as you scroll, so an order is assembled in front of you rather than remembered. Watching and ordering stop being separate screens. Costs: the tray takes a fifth of the frame whether or not anything is in it, and a cart that is always visible is a cart you are always being sold.',
  };
}

/* ================================================================== */
/* BATCH 3 — U to Y. Built from the four things that survived review:  */
/*   K's drawer, but never behind a bag button                         */
/*   M's typography and its three actions                              */
/*   S's chapters, and its name / delivery / Menu header               */
/*   R's shelf, moved to the screen it belongs on — Saved              */
/* The navigation idea underneath all five: two axes. Down is the next  */
/* kitchen, across is the next dish from this one.                     */
/* ================================================================== */

/** What a clip shows. A clip of a table is several dishes and the seed does
    not say which, so this takes the filmed dish plus the kitchen's own
    popular items. Invented, but never other restaurants' food — which is
    what K did, and it was wrong. */
const inClip = (k, clip, n = 3) => {
  const all = k.menu.flatMap((c) => c.items);
  const first = clip.dish ? all.find((i) => i.id === clip.dish.id) : null;
  const rest = all.filter((i) => i.id !== first?.id);
  /* Popular first, then the rest of the menu. Popular alone is exactly two
     dishes per kitchen in this seed, which left V's shelf holding two cards
     and looking broken rather than full. */
  const ranked = [...rest.filter((i) => i.popular), ...rest.filter((i) => !i.popular)];
  return [first, ...ranked].filter(Boolean).slice(0, n);
};

/** A kitchen's chapters are its clips, whoever shot them. Counting only the
    restaurant's own footage gives "1 of 1" on all six kitchens — the seed has
    exactly one marketing clip each — so the chapter bar would be furniture.
    Mixed authorship is also the truer sequence: the kitchen's shot of a dish
    and a customer's shot of the same dish are two chapters worth having. */
const chaptersOf = (k) => k.clips;

/** The dish-level action, and the one place the Add/Choose rule lives.
    `needsChoosing` is the app's own test (chooseOptions.ts): a group that
    REQUIRES an answer means a detour to pick it, while optional extras still
    add in one tap. A clip tagged to no dish can be ordered from at all, so it
    sends you to the menu rather than offering a choice that does not exist. */
const primaryFor = (clip) =>
  !clip.dish ? 'See the menu' : clip.dish.needsChoosing ? 'Choose' : 'Add';

/** Dishes with footage, as opposed to clips: W needs the real ratio. */
const filmedCount = (k) => k.menu.flatMap((c) => c.items).filter((d) => d.clipId).length;

const menuPill = () => `<span class="k-menu">Menu</span>`;

/* The kitchen's identity, and nothing of yours. Saved used to sit here behind
   a bookmark, which put the same glyph on screen twice — once meaning "save
   this clip" in the rail, once meaning "open my saved clips" — and NN/g names
   that exact failure: even a slight difference in meaning hinders a user's
   ability to rely on an icon. Instagram and TikTok both keep the verb on the
   feed and the collection in the profile, so Saved moved to the account
   sheet. */
const kitchenHead = (k) => `
  <div class="u-head">
    <img src="${k.restaurant.image}" alt="" />
    <div class="u-who">
      <b>${k.name}</b>
      <span>${eta(k.restaurant)} &middot; ${fee(k.restaurant)}</span>
    </div>
    ${menuPill()}
  </div>`;

/* ============ U — Kitchen ========================================= */
/* The straight synthesis, and the one I would build. Down is the next
   kitchen; the segments across the top are the dishes this kitchen filmed.
   The foot is M's text and M's three actions. The drawer is not behind a
   bag — its lip sits under the actions, already showing what it holds. */

function variantU() {
  const page = (k, i) => {
    const chapters = chaptersOf(k);
    const at = Math.min(i, chapters.length - 1);
    const clip = chapters[at] ?? k.clips[0];
    const also = inClip(k, clip);
    const r = k.restaurant;

    return `
    <div class="cell v-u">
      ${media(clip)}
      <div class="scrim-top"></div>
      <div class="scrim tall"></div>

      <div class="u-segs">
        ${chapters
          .map((_, n) => `<i><b style="width:${n < at ? 100 : n === at ? 52 : 0}%"></b></i>`)
          .join('')}
      </div>

      ${kitchenHead(k)}

      <div class="u-foot">
        <div class="u-dish">
          ${clip.dish ? clip.dish.name : clip.caption}
          ${clip.dish && also.length > 1 ? '<i class="u-more">and more</i>' : ''}
        </div>
        <div class="u-line">
          ${
            clip.dish
              ? `${money(clip.dish.priceMinor, r.currency)}${clip.dish.rating ? ' &middot; &#9733; ' + clip.dish.rating : ''}${clip.dish.needsChoosing ? ' &middot; pick a ' + clip.dish.optionGroups[0].toLowerCase() : ''}`
              : 'No dish tagged &mdash; the Menu is the only way in'
          }
        </div>

        <div class="u-acts">
          <span class="primary">${primaryFor(clip)}</span>
          <span>${icon('bookmark', 17)} List</span>
          <span>${icon('share', 17)} Share</span>
        </div>

        <div class="u-lip">
          <div class="u-grab"></div>
          <div class="u-lip-row">
            <div class="u-thumbs">
              ${also.map((d) => `<img src="${d.image}" alt="" />`).join('')}
            </div>
            <b>${also
              .slice(1)
              .map((d) => d.name)
              .join(', ')}</b>
            <span>&#8963;</span>
          </div>
        </div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${kitchens.map(page).join('')}</div>`,
    note: 'The four things that survived, in one screen. Down is the next kitchen, the segments across the top are this kitchen’s other clips, and the foot is M’s text and M’s three actions. K’s drawer is not behind a bag: its lip sits under the actions naming the dishes it holds. The top line is the kitchen — name, delivery, Menu — and the bottom line is the dish — price, rating, and whether it needs a choice — so neither repeats the other. “And more” appears beside the dish only when the clip really holds several. Scroll to Green Leaf Bowls for the awkward case: a clip tagged to no dish at all, where the title falls back to the caption and the Menu is the only way to order. Costs: the foot takes roughly 240dp off an 820dp screen once the tab bar is counted, so the video is partly a backdrop; and the lip sits close enough to the Add button that a thumb will hit the wrong one.',
  };
}

/* ============ V — Lip ============================================= */
/* The drawer taken to its conclusion: never opened, because it is never
   closed. The bottom of the screen is the kitchen's dishes, priced, and
   the video keeps what is left. Chapters move to the right edge. */

function variantV() {
  const page = (k, i) => {
    const chapters = chaptersOf(k);
    const at = Math.min(i, chapters.length - 1);
    const clip = chapters[at] ?? k.clips[0];
    const shelf = inClip(k, clip, 4);
    const r = k.restaurant;

    return `
    <div class="cell v-v">
      ${media(clip, 'v-video')}
      <div class="scrim-top"></div>
      <div class="v-mute">&#128263;</div>

      <div class="v-head">
        <b>${k.name}</b>
        <span>${eta(r)} &middot; ${fee(r)}</span>
        ${menuPill()}
      </div>

      <div class="v-dots">
        ${chapters.map((_, n) => `<i class="${n === at ? 'on' : ''}"></i>`).join('')}
      </div>

      <div class="v-say">
        <b>${clip.dish ? clip.dish.name : k.name}</b>
        <span>${clip.dish ? money(clip.dish.priceMinor, r.currency) + ' · ' : ''}${eta(r)}</span>
      </div>

      <div class="v-shelf">
        <div class="v-shelf-head">
          <b>In this clip</b>
          <span>Pull up for the menu &#8963;</span>
        </div>
        <div class="v-cards">
          ${shelf
            .map(
              (d, n) => `
            <div class="v-card ${n === 0 ? 'on' : ''}">
              <img src="${d.image}" alt="" />
              <b>${d.name}</b>
              <div class="v-price">
                <span>${money(d.priceMinor, r.currency)}</span>
                <i>${d.needsChoosing ? '&#8250;' : '+'}</i>
              </div>
            </div>`,
            )
            .join('')}
        </div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${kitchens.map(page).join('')}</div>`,
    note: 'K’s drawer with the lid taken off: it is never opened because it is never closed. The bottom 190dp is the kitchen’s dishes, priced, scrolling sideways; the video keeps the rest and the chapters move to the right edge as dots. This is the version that makes the feed genuinely shoppable — every clip has a price visible without a tap. Costs: it is the least like a clips feed of the five, the video is now a header, and a shelf that is always selling is a shelf people learn to ignore.',
  };
}

/* ============ W — Menu ============================================ */
/* The economical idea: the drawer and the chapters are the same object at
   two heights. A strip of the kitchen's menu under the video — the filmed
   dishes carry a play badge and are the chapter nav; the rest are just
   dishes. Pull the strip up and it is the full menu. */

function variantW() {
  const page = (k, i) => {
    const chapters = chaptersOf(k);
    const at = Math.min(i, chapters.length - 1);
    const clip = chapters[at] ?? k.clips[0];
    const all = k.menu.flatMap((c) => c.items);
    const r = k.restaurant;
    const open = true; /* asked for: the drawer at full height on every cell */

    return `
    <div class="cell v-w ${open ? 'up' : ''}">
      <div class="w-stage">
        ${media(clip, 'w-video')}
        <div class="scrim"></div>
        <div class="w-mute">&#128263;</div>

        <div class="w-over">
          <div class="w-dish">${clip.dish ? clip.dish.name : clip.caption}</div>
          <div class="w-line">
            ${
              clip.dish
                ? `${money(clip.dish.priceMinor, r.currency)}${clip.dish.rating ? ' &middot; &#9733; ' + clip.dish.rating : ''}${clip.dish.needsChoosing ? ' &middot; pick a ' + clip.dish.optionGroups[0].toLowerCase() : ''}`
                : 'No dish tagged &mdash; the menu is below'
            }
          </div>
          <div class="w-acts">
            <span class="primary">${primaryFor(clip)}</span>
            <span>${icon('bookmark', 16)}</span>
            <span>${icon('share', 16)}</span>
          </div>
        </div>
      </div>

      <div class="w-sheet">
        <div class="w-grab"></div>
        <div class="w-sheet-head">
          <b>${k.name}</b>
          <span>${eta(r)} &middot; ${fee(r)}</span>
        </div>

        ${
          open
            ? k.menu
                .map(
                  (cat) => `
          <div class="w-cat">${cat.name}</div>
          ${cat.items
            .map(
              (d) => `
            <div class="w-row ${d.clipId ? 'filmed' : ''}">
              <img src="${d.image}" alt="" />
              <div class="w-meta">
                <b>${d.name}</b>
                <span>${money(d.priceMinor, r.currency)}${d.clipId ? ' &middot; has a clip' : ''}</span>
              </div>
              ${d.clipId ? `<span class="w-play">${icon('play', 12)}</span>` : ''}
              <span class="w-add">${d.needsChoosing ? '&#8250;' : '+'}</span>
            </div>`,
            )
            .join('')}`,
                )
                .join('')
            : `<div class="w-strip">
                 ${all
                   .map(
                     (d) => `
                   <div class="w-tile ${d.clipId ? 'filmed' : ''}">
                     <img src="${d.image}" alt="" />
                     ${d.clipId ? `<span class="w-tplay">${icon('play', 11)}</span>` : ''}
                     <b>${d.name}</b>
                     <span>${money(d.priceMinor, r.currency)}</span>
                   </div>`,
                   )
                   .join('')}
               </div>
               <div class="w-hint">
                 ${filmedCount(k)} of ${all.length} dishes filmed &middot; pull up for the menu
               </div>`
        }
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${kitchens.map(page).join('')}</div>`,
    note: 'One surface doing both jobs: the strip under the video is the kitchen’s menu, and the dishes that were filmed carry a play badge — so the same row is the chapter nav and the drawer, at two different heights. Drawn fully raised on every cell, so this is the menu state; the collapsed strip is the same markup with the raised class off. The overlay says the dish and the sheet header says the kitchen, so neither repeats the other. This is the only one of the five that admits the real ratio: one dish filmed, ten on the menu. Costs: raised, the video is a 300dp header and the clip stops being the point; and “filmed” is a distinction customers did not ask for.',
  };
}

/* ============ X — Two axes ======================================== */
/* M's typography with nothing else allowed: no pills, no cards, no bars.
   The drawer handle is a sentence. Chapters are numerals. If the screen
   works with no rectangles on it, every rectangle elsewhere is a choice. */

function variantX() {
  const page = (k, i) => {
    const chapters = chaptersOf(k);
    const at = Math.min(i, chapters.length - 1);
    const clip = chapters[at] ?? k.clips[0];
    const also = inClip(k, clip, 3).slice(1);
    const r = k.restaurant;
    const open = i === 0;

    return `
    <div class="cell v-x">
      ${media(clip)}
      <div class="scrim-top"></div>
      <div class="scrim tall"></div>
      <div class="x-mute">&#128263;</div>

      <div class="x-top">
        <div class="x-kitchen">${k.name}</div>
        <div class="x-sub">${eta(r)} &nbsp;/&nbsp; ${fee(r)} &nbsp;/&nbsp; <u>Menu</u></div>
      </div>

      <div class="x-nums">
        ${chapters.map((_, n) => `<span class="${n === at ? 'on' : ''}">${n + 1}</span>`).join('')}
      </div>

      <div class="x-foot">
        <div class="x-dish">${clip.dish ? clip.dish.name : k.name}</div>
        <div class="x-line">
          ${k.name} &nbsp;/&nbsp; ${eta(r)}${clip.dish ? ' &nbsp;/&nbsp; ' + money(clip.dish.priceMinor, r.currency) : ''}
        </div>

        ${
          open
            ? `<div class="x-list">
                 <div class="x-list-head">Also in this clip</div>
                 ${also
                   .map(
                     (d) => `
                   <div class="x-item">
                     <span>${d.name}</span>
                     <b>${money(d.priceMinor, r.currency)}</b>
                     <u>${d.needsChoosing ? 'Choose' : 'Add'}</u>
                   </div>`,
                   )
                   .join('')}
               </div>`
            : `<div class="x-also"><u>Also in this clip</u> &mdash; ${also.map((d) => d.name).join(', ')}</div>`
        }

        <div class="x-acts">
          <span class="on">${primaryFor(clip)}${clip.dish ? ' ' + money(clip.dish.priceMinor, r.currency) : ''}</span>
          <span>List</span>
          <span>Share</span>
        </div>
      </div>
      ${tabbar(2)}
    </div>`;
  };

  return {
    html: `<div class="feed">${kitchens.map(page).join('')}</div>`,
    note: 'M’s text with nothing else permitted — no pills, no cards, no bars, not one rectangle. The drawer handle is a sentence that names what it holds ("Also in this clip — Loaded Nachos, Horchata") and opens into a priced list in place; the first cell is shown open. Chapters are numerals. If the screen reads with no boxes, then every box in U and V is a decision somebody has to defend. Costs: underlined text as the only affordance is weak on a busy frame, and type over moving video needs the scrim to do all the work.',
  };
}

/* ============ Y — Saved =========================================== */
/* R, on the screen it was always for. A shelf is wrong as a feed and right
   as a collection: everything here is already chosen, so comparison is the
   whole job. Grouped by kitchen, because that is the unit the other four
   settled on. */

function variantY() {
  const saved = kitchens
    .map((k) => ({ k, tiles: k.clips.filter((c) => c.poster) }))
    .filter((g) => g.tiles.length);
  const count = saved.reduce((n, g) => n + g.tiles.length, 0);

  return {
    html: `<div class="cell v-y" style="height:820px">
      <div class="y-head">
        <div class="y-title">
          <span class="y-back" title="Back to the account sheet">&#8249;</span>
          <b>Saved</b>
          <span>${count} clips &middot; ${saved.length} kitchens</span>
        </div>
        <div class="y-tabs">
          <span>All</span><span class="on">Kitchens</span><span>Dishes</span>
        </div>
      </div>

      <div class="y-scroll">
        ${saved
          .map(
            ({ k, tiles }) => `
          <div class="y-group">
            <div class="y-kitchen">
              <img src="${k.restaurant.image}" alt="" />
              <div class="y-who">
                <b>${k.name}</b>
                <span>${eta(k.restaurant)} &middot; ${fee(k.restaurant)}</span>
              </div>
              ${menuPill()}
            </div>

            <div class="y-grid">
              ${[0, 1]
                .map(
                  (col) => `
                <div class="y-col">
                  ${tiles
                    .filter((_, n) => n % 2 === col)
                    .map(
                      (c, n) => `
                    <div class="y-tile ${(n + col) % 3 === 0 ? 'tall' : ''}">
                      <img src="${c.poster}" alt="" />
                      <div class="y-play">${icon('play', 12)}</div>
                      ${c.kind === 'customer' ? '<span class="y-badge">Yours</span>' : ''}
                      <div class="y-meta">
                        <b>${c.dish ? c.dish.name : k.name}</b>
                        <span>${c.dish ? money(c.dish.priceMinor, k.restaurant.currency) : eta(k.restaurant)}</span>
                      </div>
                    </div>`,
                    )
                    .join('')}
                </div>`,
                )
                .join('')}
            </div>
          </div>`,
          )
          .join('')}
      </div>
      ${tabbar(2, 'Home')}
    </div>`,
    note: 'R moved to the screen it was always for. A shelf is the wrong shape for a feed — nine autoplaying tiles is the decoder problem the clips-feed spec fought — and the right shape for a collection, where everything is already chosen and comparison is the whole job. Posters, not video, so it costs nothing to render. Shown on the Kitchens tab, grouped under the same header the other four use, so a save is a way back into a kitchen rather than a loose clip; All would be one ungrouped shelf, which is R exactly. Reached from the account sheet, which is what Instagram and TikTok do — the verb stays on the feed, the collection lives in the profile — so Home is the lit tab and the chevron goes back there. Costs: our account sheet is behind the identity chip on Home rather than a profile tab, so this is three taps and unreachable from Clips, where the clip was saved. Saves also have no order here — no recency, no “ordered twice” — and a tile is a poster, so a clip you remember by its motion is hard to find.',
  };
}

/* ============ Z — Kitchen, with the menu drawer =================== */
/* The one that was chosen: U's screen, W's drawer. Resting, it is U —
   kitchen header, M's text, three actions, and a lip naming what else is
   in the clip. Pulled up, the lip becomes W's menu, by category, with the
   filmed dishes badged. One object at two heights, so the drawer is never
   behind a bag and the menu is never a separate screen.
   Cells alternate so both heights are visible: 1st and 3rd rest, 2nd and
   4th are raised. */

function variantZ() {
  const page = (k, i) => {
    const chapters = chaptersOf(k);
    const at = Math.min(i, chapters.length - 1);
    const clip = chapters[at] ?? k.clips[0];
    const also = inClip(k, clip);
    const r = k.restaurant;
    const raised = i % 2 === 1;

    /* The dish, never the kitchen: the header above has already said that. */
    const dishLine = clip.dish
      ? `${money(clip.dish.priceMinor, r.currency)}${clip.dish.rating ? ' &middot; &#9733; ' + clip.dish.rating : ''}${clip.dish.needsChoosing ? ' &middot; pick a ' + clip.dish.optionGroups[0].toLowerCase() : ''}`
      : 'No dish tagged &mdash; the menu is the only way in';

    const acts = `
      <div class="u-acts">
        <span class="primary">${primaryFor(clip)}</span>
        <span>${icon('bookmark', 17)} List</span>
        <span>${icon('share', 17)} Share</span>
      </div>`;

    const segs = `
      <div class="u-segs">
        ${chapters.map((_, n) => `<i><b style="width:${n < at ? 100 : n === at ? 52 : 0}%"></b></i>`).join('')}
      </div>`;

    if (!raised) {
      return `
      <div class="cell v-u v-z">
        ${media(clip)}
        <div class="scrim-top"></div>
        <div class="scrim tall"></div>
        ${segs}
        ${kitchenHead(k)}

        <div class="u-foot">
          <div class="u-dish">
            ${clip.dish ? clip.dish.name : clip.caption}
            ${clip.dish && also.length > 1 ? '<i class="u-more">and more</i>' : ''}
          </div>
          <div class="u-line">${dishLine}</div>
          ${acts}

          <div class="u-lip">
            <div class="u-grab"></div>
            <div class="u-lip-row">
              <div class="u-thumbs">${also.map((d) => `<img src="${d.image}" alt="" />`).join('')}</div>
              <b>${also
                .slice(1)
                .map((d) => d.name)
                .join(', ')}</b>
              <span>&#8963;</span>
            </div>
          </div>
        </div>
        ${tabbar(2)}
      </div>`;
    }

    return `
      <div class="cell v-u v-w v-z up">
        <div class="w-stage">
          ${media(clip, 'w-video')}
          <div class="scrim-top"></div>
          <div class="scrim"></div>
          <div class="w-over">
            <div class="w-dish">
              ${clip.dish ? clip.dish.name : clip.caption}
              ${clip.dish && also.length > 1 ? '<i class="u-more">and more</i>' : ''}
            </div>
            <div class="w-line">${dishLine}</div>
            ${acts}
          </div>
        </div>
        ${segs}
        ${kitchenHead(k)}

        <div class="w-sheet">
          <div class="w-grab"></div>
          <div class="w-sheet-head">
            <b>Menu</b>
            <span>${filmedCount(k)} of ${k.menu.flatMap((c) => c.items).length} dishes filmed</span>
          </div>
          ${k.menu
            .map(
              (cat) => `
            <div class="w-cat">${cat.name}</div>
            ${cat.items
              .map(
                (d) => `
              <div class="w-row ${d.clipId ? 'filmed' : ''}">
                <img src="${d.image}" alt="" />
                <div class="w-meta">
                  <b>${d.name}</b>
                  <span>${money(d.priceMinor, r.currency)}${d.clipId ? ' &middot; has a clip' : ''}</span>
                </div>
                ${d.clipId ? `<span class="w-play">${icon('play', 12)}</span>` : ''}
                <span class="w-add">${d.needsChoosing ? '&#8250;' : '+'}</span>
              </div>`,
              )
              .join('')}`,
            )
            .join('')}
        </div>
        ${tabbar(2)}
      </div>`;
  };

  return {
    html: `<div class="feed">${kitchens.map(page).join('')}</div>`,
    note: 'The chosen one: U’s screen with W’s drawer. Resting it is U — kitchen header, the dish in M’s type, three actions, and a lip naming the rest of what is in the clip. Pulled up, that same lip is W’s menu by category, with the filmed dishes badged, so the drawer is never behind a bag and the menu is never a separate screen. Cells alternate between the two heights so both are visible: scroll down to see it open and shut. Nothing in the top-right corner belongs to you — the Menu pill is the kitchen’s, and Saved lives in the account sheet, because a bookmark here would have been the second bookmark on a screen that already has one meaning “save this clip”. Costs: the lip and the Add button are neighbours at the bottom edge and a thumb will sometimes take the wrong one; and raised, the video is a 300dp header, so the clip stops being the point exactly when someone is deciding.',
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
          <div class="buy">${p.dish.needsChoosing ? 'Choose and add' : 'Add to cart'}</div>
          ${p.dish.needsChoosing ? '' : '<div class="step">&minus;<b>1</b>&plus;</div>'}
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
  ['K', 'The bag', variantK],
  ['L', 'Peek', variantL],
  ['M', 'Moods', variantM],
  ['N', 'Yours', variantN],
  ['O', 'Deck', variantO],
  ['P', 'Table', variantP],
  ['Q', 'Live', variantQ],
  ['R', 'Shelf', variantR],
  ['S', 'Chapters', variantS],
  ['T', 'Tray', variantT],
  ['U', 'Kitchen', variantU],
  ['V', 'Lip', variantV],
  ['W', 'Menu', variantW],
  ['X', 'Two axes', variantX],
  ['Y', 'Saved', variantY],
  ['Z', 'Kitchen + menu drawer', variantZ],
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
