# Mockups

Browser-viewable design mockups. Not production code — the app itself is
React Native; these exist to make design decisions cheap to see and argue
about. Serve the folder and open on a phone or in devtools mobile view:

```
python3 -m http.server 4173 --directory mockups
```

## home-directions/ — the wheel

Ten Home-screen directions, switchable via `?variant=` (arrows or the pill).
All render real content from `mocks/db.json`.

| key | name         | fabric                                      |
| --- | ------------ | ------------------------------------------- |
| B   | Marketplace  | white, dense, carousels + grid — **chosen** |
| C   | Clips first  | full-bleed snapping video feed              |
| D   | Dish first   | dark 2-up dish grid, restaurant demoted     |
| F   | Clips + list | clip hero over a scannable sheet            |
| H   | Gallery      | pure typography, no cards                   |
| I   | Decided      | one recommendation, rest behind a link      |
| J   | Ask          | the app converses and justifies picks       |
| K   | Tonight      | pick the arrival time, food follows         |
| L   | The Block    | night map, kitchens as lit windows          |
| M   | One          | one dish at a time — PASS / EAT             |

Cut along the way: A (editorial serif), E (single column), G (ad-vs-arrived
proof cards).

**Decision: B** for the app's design language (2026-08-03). The brand colour
is NOT settled — `#FF9800` everywhere is scaffolding.

## app-b/ — B through the app

The chosen language applied to the four screens that stress it most, all
built on real `db.json` content for Taco Fiesta. Switch with `?screen=`.

| screen     | what it stresses                                                        |
| ---------- | ----------------------------------------------------------------------- |
| Home       | the reference implementation of variant B                               |
| Restaurant | sticky category rail, dish rows, ours-vs-theirs clip shelf              |
| Dish       | quantity + instructions, paired clips, a real review                    |
| Cart       | line items with instructions, delivery block, tax-correct totals        |
| Checkout   | deliver-to + cash-on-delivery cards, order summary, place order         |
| Order      | real order-seed-1 content, status timeline held at a mid-progress state |

Palette is closed to exactly B's eight tokens (`#fff #0f1115 #7c828d #8a909a
#9aa0a8 #eceef1 #f2f3f5 #43484f`) plus `var(--brand)` for accent — nothing
else. Radii, type scale and spacing all trace back to the chosen variant.

### Screenshots

| Home                                | Restaurant                                      | Dish                                |
| ----------------------------------- | ----------------------------------------------- | ----------------------------------- |
| ![Home](screenshots/app-b-Home.png) | ![Restaurant](screenshots/app-b-Restaurant.png) | ![Dish](screenshots/app-b-Dish.png) |

| Cart                                | Checkout                                    | Order                                 |
| ----------------------------------- | ------------------------------------------- | ------------------------------------- |
| ![Cart](screenshots/app-b-Cart.png) | ![Checkout](screenshots/app-b-Checkout.png) | ![Order](screenshots/app-b-Order.png) |

## clips-directions/ — what lives on a clip

Five takes on the Clips tab, switchable via `?variant=A|B|C|D|E`. Real data
from `mocks/db.json`, and real video: only the clip you are looking at loads
and plays, because ten at once stalls the page.

The question: the tab plays video and offers almost nothing to do. The cell
carries a mute button, the ours/theirs badge, a caption and _View menu_ — so
the only thing you can do with a dish you just watched is go and look for it
in a list.

| key | name        | what it argues                                           |
| --- | ----------- | -------------------------------------------------------- |
| A   | The pairing | one dish per page, their clip above the customer's below |
| B   | Shoppable   | the dish named, priced and added where you are standing  |
| C   | The rail    | like, save, share — the convention, minus Follow         |
| D   | Steered     | filters over the feed, and closed said on the clip       |
| E   | Everything  | all four at once, so the cost is arguable not imagined   |

Each variant prints its own argument and its own costs under the phone. **E
exists to be rejected** — if everything at once looks wrong, that is the
finding, and it is cheaper to see it here than after it ships.

No Follow in C on purpose: there is no feed-by-restaurant to follow into, and
a button that only changes its own label is a lie.

### Two things the data makes awkward

- **Only 4 of 10 clips are paired.** A needs both sides of a dish, and only
  Birria Tacos, Truffle Tagliatelle, Dragon Roll and Double Smash Burger have
  them. A direction that cannot render 6 of the clips is a real constraint,
  not a prototype gap.
- **The seed's clip thumbnails do not match their dishes** — Birria Tacos is
  illustrated by a burger. That is `mocks/db.json` being stock footage, not
  the prototype inventing it, and it does blunt A's argument. The real app has
  the same mismatch. Prices show as USD for the same reason; the backend seed
  is PKR.

Regenerate `data.js` from the mock after a seed change:

```bash
node mockups/clips-directions/data.gen.cjs
```
