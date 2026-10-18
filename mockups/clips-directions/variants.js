/* THROWAWAY PROTOTYPE — what lives on a Clip. ?variant=A|B|C|D|E.
   Letters stay stable so feedback keeps its meaning. */

const { clips, pairs } = window.FOODIO_CLIPS;

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
