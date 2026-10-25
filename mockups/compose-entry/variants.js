/* THROWAWAY PROTOTYPE — six places the compose action could live. */

const POSTER =
  'https://images.pexels.com/videos/4676745/pexels-photo-4676745.jpeg?auto=compress&cs=tinysrgb&w=900';
const KITCHEN_AVATAR =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80';

/** The clip underneath. Identical in every variant — only the entry changes. */
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

/** The bar as it is today: four tabs, nothing in the middle. */
const plainBar = () => `<div class="tabbar">${TABS.map((t) => tab(...t)).join('')}</div>`;

/** The bar split around a centre element. */
const splitBar = (centre) => `
  <div class="tabbar">
    ${tab(...TABS[0])}${tab(...TABS[1])}
    ${centre}
    ${tab(...TABS[2])}${tab(...TABS[3])}
  </div>`;

const VARIANTS = [
  {
    key: 'A',
    name: 'Centre plus — YouTube',
    note: 'A white circled + in the middle of the bar, between Clips and Cart. The bar keeps four labelled destinations and gains one unlabelled action, which is exactly what YouTube did when it put a create button in the centre of its bottom bar.',
    cost: 'Cheapest of the three centre options: nothing moves, nothing is renamed. The + is unlabelled, so what it makes is only learnable by pressing it.',
    render: () => feed() + splitBar('<div class="centre-plus">+</div>'),
  },
  {
    key: 'B',
    name: 'Raised pill — TikTok',
    note: 'The same slot, but a wide rounded rectangle with two offset colour edges rather than a circle. TikTok gives its create button a shape nothing else in the app has, so the eye finds it before it reads any label.',
    cost: 'Loudest, and the one that most says "this app is for posting". It borrows a silhouette people will recognise from somewhere else, which cuts both ways.',
    render: () => feed() + splitBar('<div class="centre-pill">+</div>'),
  },
  {
    key: 'C',
    name: 'Floating button — Material',
    note: 'A round orange button above the tab bar on the right. The bar is untouched; the action floats over the feed in the thumb’s natural arc.',
    cost: 'No tab slot spent, and it can appear only where posting makes sense. It covers part of the clip and sits near the drawer handle, so it has to hide while the menu is open.',
    render: () => feed() + plainBar() + '<div class="fab">+</div>',
  },
  {
    key: 'D',
    name: 'Shutter tab — Snapchat',
    note: 'The camera itself is a destination: a large ringed shutter raised out of the bar, with the four tabs around it. Snapchat treats the camera as the middle of the app rather than a button on top of it.',
    cost: 'Strongest signal by far, and the biggest claim: it says filming is as important as ordering. Hard to justify until people actually post.',
    render: () => feed() + splitBar('<div class="shutter">◉</div>'),
  },
  {
    key: 'E',
    name: 'Labelled header — Instagram',
    note: 'Stays in the feed header where it is now, but becomes a labelled pill rather than a bare icon, moved clear of the Menu pill. Instagram has kept compose out of the centre slot and in a corner.',
    cost: 'Smallest change and the only one that costs nothing elsewhere. Also the least discoverable — a corner control on one tab, competing with the kitchen’s own header.',
    render: () =>
      feed() + plainBar() + '<div class="header-compose"><span>🎥</span> Post a clip</div>',
  },
  {
    key: 'F',
    name: 'Plus opens a sheet — YouTube create',
    note: 'The centre + does not open the camera. It opens a sheet that asks what you are posting, which is how YouTube separates a Short from an upload from a live stream. Foodio has two answers: a clip about nothing in particular, and a clip about a kitchen.',
    cost: 'The only one that makes the restaurant-tagged post reachable, which the compose screen already supports and nothing links to. Costs a tap before the camera.',
    render: () =>
      feed() +
      splitBar('<div class="centre-plus">+</div>') +
      `<div class="sheet-dim"></div>
       <div class="sheet">
         <div class="grab"></div>
         <div class="row"><div class="ic">🎥</div><div><b>Film a clip</b><span>Up to 30 seconds, straight to the feed</span></div></div>
         <div class="row"><div class="ic">🍽</div><div><b>Post about a kitchen</b><span>Pick the restaurant it is about</span></div></div>
         <div class="row"><div class="ic">🧾</div><div><b>Review an order</b><span>Rate it, and film it if you want</span></div></div>
       </div>`,
  },
];

function show(index) {
  const v = VARIANTS[index];
  document.getElementById('screen').innerHTML = v.render();
  document.getElementById('vkey').textContent = v.key;
  document.getElementById('vname').textContent = v.name;
  document.getElementById('vnote').textContent = v.note;
  document.getElementById('vcost').textContent = v.cost;
  const url = new URL(window.location.href);
  url.searchParams.set('variant', v.key);
  window.history.replaceState({}, '', url);
}

const wanted = new URLSearchParams(window.location.search).get('variant');
let current = Math.max(
  0,
  VARIANTS.findIndex((v) => v.key === (wanted || 'A').toUpperCase()),
);

document.getElementById('prev').onclick = () => {
  current = (current - 1 + VARIANTS.length) % VARIANTS.length;
  show(current);
};
document.getElementById('next').onclick = () => {
  current = (current + 1) % VARIANTS.length;
  show(current);
};
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') document.getElementById('prev').click();
  if (e.key === 'ArrowRight') document.getElementById('next').click();
});

show(current);
