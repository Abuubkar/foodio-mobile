/* THROWAWAY PROTOTYPE — second pass at the centre plus. */

const POSTER =
  'https://images.pexels.com/videos/4676745/pexels-photo-4676745.jpeg?auto=compress&cs=tinysrgb&w=900';
const KITCHEN_AVATAR =
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80';

const plusSvg = (size, stroke, colour) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5.5v13M5.5 12h13" stroke="${colour}" stroke-width="${stroke}"
          stroke-linecap="round" />
  </svg>`;

/** The clips feed, cropped to what sits above the bar. */
const feed = () => `
  <div class="poster" style="background-image:url('${POSTER}')"></div>
  <div class="scrim-top"></div>
  <div class="scrim-bottom"></div>
  <div class="chapters"><i class="on"></i><i></i><i></i></div>
  <div class="kitchen">
    <div class="avatar" style="background-image:url('${KITCHEN_AVATAR}')"></div>
    <div class="who"><b>Burger &amp; Craft Grill</b><span>20–30 min · PKR 60.00</span></div>
    <div class="menu-pill">Menu ⌃</div>
  </div>
  <div class="dish" style="bottom:118px">
    <h3 style="font-size:19px">Double Smash Burger</h3>
    <p>PKR 810.00</p>
    <div class="actions">
      <div class="add">Add</div><div class="ghost">List</div><div class="ghost">Share</div>
    </div>
  </div>`;

/** A light screen, so the plus is judged on white as well as on video. */
const home = () => `
  <div class="home-stub">
    <div class="search"></div>
    <div class="h"></div>
    <div class="cards"><i></i><i></i></div>
    <div class="h" style="width:130px"></div>
    <div class="cards"><i style="height:120px"></i><i style="height:120px"></i></div>
  </div>`;

const ICONS = ['⌂', '▶', '🛍', '🧾'];

/** The full-width bar, with a gap in the middle for the lifted plus. */
const spanBar = (dark) => `
  <div class="bar-span ${dark ? 'on-dark' : 'on-light'}">
    <div class="slot${dark ? ' on' : ''}">${ICONS[0]}</div>
    <div class="slot">${ICONS[1]}</div>
    <div class="slot" style="opacity:0"></div>
    <div class="slot">${ICONS[2]}</div>
    <div class="slot">${ICONS[3]}</div>
  </div>`;

const lifted = (inner, dark) =>
  `<div class="lift"><div class="ring ${dark ? '' : 'on-light'}">${inner}</div></div>`;

const TAKES = [
  {
    key: '1',
    name: 'Ink dot, lifted',
    note: 'A 46px near-black circle that breaks the top edge of the bar, with a thin white plus. Unlabelled. The brand orange stays for state — the active tab — so nothing competes, and the one dark object on a light screen reads as deliberate rather than loud. A hairline ring in the bar’s own colour separates it from whatever is behind.',
    render: (dark) =>
      spanBar(dark) +
      lifted(
        `<div class="dot ink ${dark ? '' : 'light-shadow'}">${plusSvg(22, 2, '#fff')}</div>`,
        dark,
      ),
  },
  {
    key: '2',
    name: 'Amber dot, lifted',
    note: 'The same geometry in the brand orange with a white plus. Warmer and more obviously the action, at the cost of sitting in the same colour as the active tab. Smaller and lifted, which is most of what the first attempt got wrong — it was inline, large, and carried a label that broke the silhouette.',
    render: (dark) =>
      spanBar(dark) + lifted(`<div class="dot amber">${plusSvg(22, 2.1, '#fff')}</div>`, dark),
  },
  {
    key: '3',
    name: 'Floating bar, ink dot',
    note: 'The bar detaches: inset from the edges, fully rounded, on a shadow. Icons only, and the active one wears a tinted pill that carries its label — so the bar names where you are without labelling all five. The plus is an ink dot inline in the bar rather than lifted, because a floating bar has no edge worth breaking.',
    render: (dark) => `
      <div class="bar-float ${dark ? 'on-dark' : 'on-light'}">
        <div class="active-pill">⌂ Home</div>
        <div class="slot">${ICONS[1]}</div>
        <div class="inline-dot"><div class="dot ink ${dark ? '' : 'light-shadow'}" style="width:42px;height:42px">${plusSvg(21, 2, '#fff')}</div></div>
        <div class="slot">${ICONS[2]}</div>
        <div class="slot">${ICONS[3]}</div>
      </div>`,
  },
  {
    key: '4',
    name: 'Floating bar, amber dot',
    note: 'The floating bar with the plus in the brand orange. The most colour of the four, and the only one where the bar itself is the unusual element rather than the button. Worth seeing because the orange on a floating dark bar over video is a different proposition from orange on a flat white one.',
    render: (dark) => `
      <div class="bar-float ${dark ? 'on-dark' : 'on-light'}">
        <div class="active-pill">⌂ Home</div>
        <div class="slot">${ICONS[1]}</div>
        <div class="inline-dot"><div class="dot amber" style="width:42px;height:42px">${plusSvg(21, 2.1, '#fff')}</div></div>
        <div class="slot">${ICONS[2]}</div>
        <div class="slot">${ICONS[3]}</div>
      </div>`,
  },
];

function show(index) {
  const t = TAKES[index];
  document.getElementById('screen').innerHTML = feed() + t.render(true);
  document.getElementById('screen-light').innerHTML = home() + t.render(false);
  document.getElementById('vkey').textContent = t.key;
  document.getElementById('vname').textContent = t.name;
  document.getElementById('vnote').textContent = t.note;
  const url = new URL(window.location.href);
  url.searchParams.set('v', t.key);
  window.history.replaceState({}, '', url);
}

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
