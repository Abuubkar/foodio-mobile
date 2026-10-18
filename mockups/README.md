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

| key | name                 | what it argues                                                       |
| --- | -------------------- | -------------------------------------------------------------------- |
| A   | The pairing          | one dish per page, their clip above the customer's below             |
| B   | Shoppable            | the dish named, priced and added where you are standing              |
| C   | The rail             | like, save, share — the convention, minus Follow                     |
| D   | Steered              | filters over the feed, and closed said on the clip                   |
| F   | Steered + rail + act | D and C together, plus a way to get the dish — **rejected on looks** |
| G   | Edge                 | F's features as type on the edges: no boxes anywhere                 |
| H   | Sheet                | the video is a card; controls stand on solid ground below            |
| I   | Quiet                | one button, and it carries the dish name and price                   |
| J   | F, without the bar   | **F's language, order in the rail, B's info block**                  |
| E   | Everything           | all four at once, so the cost is arguable not imagined               |

Each variant prints its own argument and its own costs under the phone. **E
exists to be rejected** — if everything at once looks wrong, that is the
finding, and it is cheaper to see it here than after it ships.

No Follow in C on purpose: there is no feed-by-restaurant to follow into, and
a button that only changes its own label is a lie.

**F had the right features and the wrong looks** — see G, H and I below. D and C were the two picked, and what neither of
them does is let you get the dish. The button is decided by the dish rather
than by the layout, because issue #148 already made that rule real on the
menu row:

| the dish               | the button                        |
| ---------------------- | --------------------------------- |
| asks nothing           | **Add +**                         |
| has a required group   | **Choose ›**, opens the dish page |
| the clip names no dish | **View menu ›**                   |

A clip that added Birria Tacos silently would pick a size on the customer's
behalf, and contradict the menu row two taps away. All three states are in F's
scroll — four of six clips carry a dish, and one of those has options.

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

### J — the one to build from

F's visual language kept, three things changed on direction:

- **The slab above the tab bar is gone.** The video gets that third of the
  frame back.
- **The order moved into the rail, directly above Share** — and it is the only
  filled disc there, because it is the one control that spends money and
  should not look like another toggle.
- **The info block is B's shape**: the dish, then its restaurant, delivery
  time and price on one line.

The #148 rule survives the move, said in one word under the disc:

| the dish               | the disc                                    |
| ---------------------- | ------------------------------------------- |
| asks nothing           | filled orange **+**, _Add_                  |
| has a required group   | white **›**, _Choose_ — opens the dish page |
| the clip names no dish | white **☰**, _Menu_                        |

Closed takes the delivery time's slot: _"Bella Italia Ristorante · **opens
11:00** · $24.00"_, amber, no banner.

The caption is dropped — "Sizzling Birria Tacos with Consomé" over a dish
titled "Birria Tacos" is the same sentence twice. Easy to put back if the
clip's own voice turns out to be worth the line.

### G, H, I — the same features, three ways of looking

F was right about **what** and wrong about **how**: three bands of chrome on a
suffocated video, every element its own floating rounded box, and a closed
banner that read like an error toast dropped mid-screen. G, H and I carry F's
feature set exactly and argue only about the looks.

| direction   | the idea                                                                                                                                          | what it costs                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **G Edge**  | No boxes. Filters are words with the live one underlined, the rail is outline icons with no discs, the dish is one hairline and one line of type. | Nothing has a tap target you can see; it all leans on the scrim.      |
| **H Sheet** | Stop fighting the footage. The video is a card and the controls stand under it on solid ground.                                                   | The video loses a third of its height; reads as a post, not a feed.   |
| **I Quiet** | One button that _is_ the dish — `Choose Birria Tacos · $14.99`. The filter becomes a tappable title.                                              | One filter visible at a time, and a long dish name has nowhere to go. |

**Closed is a banner in none of them.** G puts it where the delivery estimate
was — _"Bella Italia Ristorante · Closed, opens 11:00"_, amber, same sentence,
no new object. H puts it beside the ETA in the sheet. I changes what the
button offers: _Order Truffle Tagliatelle for later_. The warning box over the
video was the worst of the three answers and is gone.

The rail icons are inline SVG rather than unicode: there is no bookmark glyph
worth looking at, and a coloured emoji inside a monochrome rail reads as a
mistake.

Regenerate `data.js` from the mock after a seed change:

```bash
node mockups/clips-directions/data.gen.cjs
```
