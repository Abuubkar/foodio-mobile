/* THROWAWAY PROTOTYPE — four elegant takes on the centre plus. */

const POSTER =
  'https://images.pexels.com/videos/4676745/pexels-photo-4676745.jpeg?auto=compress&cs=tinysrgb&w=900';
const KITCHEN_AVATAR =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80';

/**
 * The glyph, drawn rather than typed.
 *
 * A font's "+" sits on a text baseline and is optically high inside a circle,
 * which is most of why the first pass looked dropped-on. Two rounded strokes
 * centred on the viewBox cannot be off.
 */
const plusSvg = (size, stroke, colour) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5.5v13M5.5 12h13" stroke="${colour}" stroke-width="${stroke}"
          stroke-linecap="round" />
  </svg>`;

const feed = () => `
  <div class="poster" style="background-image:url('${POSTER}')"></div>
  <div class="scrim-top"></div>
  <div class="scrim-bottom"></div>
  <div class="chapters"><i class="on"></i><i></i><i></i></div>
  <div class="kitchen">
    <div class="avatar" style="background-image:url('${KITCHEN_AVATAR}')"></div>
    <div class="who"><b>Burger &amp; Craft Grill</b><span>20–30 min · PKR 60.00 delivery</span></div>
    <div class="menu-pill">Menu ⌃</div>
  </div>
  <div class="dish">
    <h3>Double Smash Burger <span style="font-size:13px;opacity:.65">and more</span></h3>
    <p>PKR 810.00</p>
    <div class="actions">
      <div class="add">Add</div>
      <div class="ghost">List</div>
      <div class="ghost">Share</div>
    </div>
  </div>`;

const tab = (icon, label, on) =>
  `<div class="tab${on ? ' on' : ''}"><i class="ic">${icon}</i>${label}</div>`;

const TABS = [
  ['⌂', 'Home', false],
  ['▶', 'Clips', true],
  ['🛍', 'Cart', false],
  ['🧾', 'Orders', false],
];

const bar = (centre) => `
  <div class="tabbar refined">
    ${tab(...TABS[0])}${tab(...TABS[1])}
    ${centre}
    ${tab(...TABS[2])}${tab(...TABS[3])}
  </div>`;

const DARK = '#2a1a00';

const TAKES = [
  {
    key: '1',
    name: 'Flush disc',
    note: 'A 46px disc in the brand orange, sitting on the same optical line as the four icons rather than raised above them. A vertical gradient and a one-pixel inner highlight give it a surface; the shadow is the brand hue at low opacity, not black. Nothing protrudes, so the bar still reads as one object.',
    centre: `<div class="plus flush"><div class="disc">${plusSvg(24, 2.2, DARK)}</div></div>`,
  },
  {
    key: '2',
    name: 'Labelled',
    note: 'Smaller disc at 38px with "Post" under it, so the bar keeps one rhythm across five columns — icon over label, five times. The quietest of the four and the only one that says what it does. The label is the same size and colour as an active tab’s.',
    centre: `<div class="plus labelled"><div class="disc">${plusSvg(20, 2.4, DARK)}</div><div class="lbl">Post</div></div>`,
  },
  {
    key: '3',
    name: 'Squircle',
    note: 'The same treatment on a 15px-radius rounded square rather than a circle. It borrows the app’s own card radius, so it belongs to Foodio rather than to the generic circled plus every app has. Slightly wider than tall, which keeps the glyph from looking cramped.',
    centre: `<div class="plus squircle"><div class="disc">${plusSvg(24, 2.2, DARK)}</div></div>`,
  },
  {
    key: '4',
    name: 'Quiet ring',
    note: 'A ring rather than a fill: a thin orange outline on a 14%-opacity wash, with an orange glyph. It is present without shouting, and it leaves solid orange meaning one thing only — the primary action inside the content, which is Add.',
    centre: `<div class="plus quiet"><div class="disc">${plusSvg(24, 2.2, '#FFA726')}</div></div>`,
  },
];

function show(index) {
  const t = TAKES[index];
  document.getElementById('screen').innerHTML = feed() + bar(t.centre);
  document.getElementById('vkey').textContent = t.key;
  document.getElementById('vname').textContent = t.name;
  document.getElementById('vnote').textContent = t.note;
  const url = new URL(window.location.href);
  url.searchParams.set('v', t.key);
  window.history.replaceState({}, '', url);
}

document.getElementById('strip').innerHTML = TAKES.map(
  (t) => `
    <div class="caption">${t.key} · ${t.name}</div>
    <div class="holder">${bar(t.centre)}</div>`,
).join('');

const wanted = new URLSearchParams(window.location.search).get('v');
let current = Math.max(
  0,
  TAKES.findIndex((t) => t.key === (wanted || '1')),
);

document.getElementById('prev').onclick = () => {
  current = (current - 1 + TAKES.length) % TAKES.length;
  show(current);
};
document.getElementById('next').onclick = () => {
  current = (current + 1) % TAKES.length;
  show(current);
};
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') document.getElementById('prev').click();
  if (e.key === 'ArrowRight') document.getElementById('next').click();
});

show(current);
