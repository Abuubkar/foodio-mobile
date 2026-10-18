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
| K   | The bag              | TikTok Shop — one clip, several dishes, a drawer                     |
| L   | Peek                 | Instagram Reels — a price chip, then a product sheet                 |
| M   | Moods                | Netflix Clips — browse by occasion, three actions                    |
| N   | Yours                | Spotify — your own shortcuts pinned above the feed                   |
| O   | Deck                 | Feed Me / Crave — swipe a deck, not a feed                           |
| P   | Table                | Chicken Tinder — everyone votes, the tally decides                   |
| Q   | Live                 | Whatnot — a stream, a chat, order while it is hot                    |
| R   | Shelf                | EasyEat — nine dishes at once, not one                               |
| S   | Chapters             | stories — one kitchen, several dishes                                |
| T   | Tray                 | live commerce — a basket that fills as you scroll                    |
| U   | Kitchen              | the synthesis — chapters, header, M's text, a lip                    |
| V   | Lip                  | the drawer never closes; the shelf is the bottom                     |
| W   | Menu                 | the drawer and the chapters are one object                           |
| X   | Two axes             | M's type with no rectangle anywhere                                  |
| Y   | Saved                | R, on the screen it was always for                                   |
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

### K to O — five ways to act, each taken from a shipped app

Not invented. Each of these starts from something that exists and is
documented, and the sources are listed below so the lineage is checkable.

| key             | from                             | the idea                                                                                                                                                                           |
| --------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **K — The bag** | TikTok Shop                      | A bag on the video during playback, and one clip tagging several dishes. A clip of a table is rarely one dish, so the bag counts what is in frame and opens a drawer of all of it. |
| **L — Peek**    | Instagram Reels shopping         | A name-and-price chip on the video; tapping raises a product sheet. The footage keeps the frame until somebody is interested.                                                      |
| **M — Moods**   | Netflix _Clips_                  | Browse by mood and occasion rather than by filter — "late night", "feeding four" — with exactly three actions: open, list, share.                                                  |
| **N — Yours**   | Spotify's 2023 home              | A video feed with your own shortcuts pinned above it. A food app has what a music app does not: you ate this before.                                                               |
| **O — Deck**    | Feed Me · Crave · Chicken Tinder | A card deck instead of a feed: left discards, right saves, up is "want it". Crave swiped dishes rather than restaurants, which is the right unit here.                             |

### U to Y — built from the four things that survived

Feedback on K–T kept four pieces and discarded the rest:

- **K's drawer**, for a clip that shows several dishes — but not hidden behind a bag button
- **M's text and its three actions**
- **S's chapters**, and its name / delivery / Menu header
- **R's shelf**, moved to the Saved screen

They turn out to be one idea. The navigation under all five is two axes:
**down is the next kitchen, across is the next dish from this one.**

| key              | the question it answers                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **U — Kitchen**  | What does all four at once look like? Chapters on top, kitchen header under them, M's text and actions at the foot, and the drawer's lip below that already showing three thumbnails. The one I would build.                                     |
| **V — Lip**      | What if the drawer never closes? The bottom fifth is the kitchen's dishes, priced, scrolling sideways; chapters move to the right edge. Every clip has a price without a tap.                                                                    |
| **W — Menu**     | What if the drawer and the chapters are the same object? The strip under the video is the kitchen's menu; the dishes that were filmed carry a play badge, so one row is both the chapter nav and the drawer. Pull it up and it is the full menu. |
| **X — Two axes** | Can it work with no rectangle at all? M's type and nothing else. The drawer handle is a sentence that names what it holds and opens into a priced list in place.                                                                                 |
| **Y — Saved**    | Where does R belong? Not on a feed. On Saved, where everything is already chosen and comparison is the whole job — grouped under the same kitchen header.                                                                                        |

#### What the data forced

Three of these were designed against the seed and the seed argued back.

- **Chapters cannot be "dishes this kitchen filmed."** Every restaurant in
  `db.json` has exactly one marketing clip, so that bar reads "1 of 1" on all
  six kitchens. Chapters are now the kitchen's clips whoever shot them — which
  is also the better sequence, since the kitchen's shot of a dish and a
  customer's shot of the same dish are two chapters worth having.
- **"Popular" is exactly two dishes per kitchen**, so V's shelf held two cards
  and looked broken. It now ranks popular first and fills from the rest of the
  menu.
- **The real ratio is one filmed dish in six to ten.** Only W says so out
  loud, and that honesty is most of its argument.

`data.gen.cjs` now emits a `kitchens` array — restaurant, its clips, and its
whole menu with a `clipId` on the dishes that were filmed — because every one
of these needs the menu, and four unrelated restaurants pretending to be one
kitchen's chapters hid the case that breaks.

#### Measured, not eyeballed

- U's segments ran under the notch (it occupies y 8–30, dead centre) and its
  mute circle fought the Menu pill for the top-right corner. Mute moved into
  the header row, which is what stories do.
- V wasted 25dp under its cards and W wasted 81dp under its strip. Both sheets
  were sized by measuring content against box, and the difference handed back
  to the video.
- X's priced list sat on the brightest part of the frame. Its scrim is now the
  tall one — the only fix available to a design that has banned boxes.

### P to T — five shapes, not five buttons

K to O change what sits on the clip. These change what the screen _is_.

| key              | from                             | the idea                                                                                                                                                        |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P — Table**    | Chicken Tinder's group mode      | Everyone swipes privately and the tally is the interface: "3 of 4 want this". Ordering for four is the normal case here and no surface admits it exists.        |
| **Q — Live**     | Whatnot and live commerce        | A stream, a chat, and buying without leaving it. A kitchen at 8pm is already a show nobody is broadcasting, and the Kitchen surface this app has is the camera. |
| **R — Shelf**    | EasyEat's Pinterest-style layout | Nine dishes at once instead of one. Comparison is the thing a feed cannot do.                                                                                   |
| **S — Chapters** | The segmented story bar          | One kitchen, several dishes, tap to advance. A restaurant is more than one dish and a feed never says so.                                                       |
| **T — Tray**     | Live commerce's instant checkout | The basket is a shelf under the video that fills as you scroll, so an order is assembled in front of you rather than remembered.                                |

Each prints its own costs under the phone. The sharp ones: Q is worse than
nothing when no kitchen is streaming; R stops being a clips feed and becomes a
gallery, and nine autoplaying tiles is exactly the decoder problem the
clips-feed spec fought on the A15; T spends a fifth of the frame on a basket
whether or not anything is in it.

#### Sources

- **Netflix Clips** — a vertical, swipeable feed of clips, built around three
  actions (add to a list, share, open) and collections by mood, genre or
  occasion. Tested May 2025, launched April 2026, Pakistan included in the
  first wave.
  [TechCrunch](https://techcrunch.com/2025/05/07/netflix-is-getting-into-short-videos-with-a-new-vertical-feed-for-mobile) ·
  [Pulse 2.0](https://pulse2.com/netflix-launches-vertical-video-feed-and-redesigned-mobile-experience-for-members/) ·
  [Communicate Online](https://communicateonline.me/news/netflix-launches-clips-feed-in-mobile-app-overhaul/)
- **Spotify** — a 2021 test put a vertical feed of Canvas clips in a Discover
  tab with a heart to like; the 2023 home turned into a video feed while
  keeping playlist shortcuts pinned at the top.
  [TechCrunch](https://techcrunch.com/2023/03/08/spotify-revamps-its-app-with-tiktok-style-discovery-feeds-smart-shuffle-for-playlists-and-more) ·
  [GSMArena](https://www.gsmarena.com/spotify_is_testing_a_tiktokinspired_feed_of_vertical_videos_with_a_new_discover_tab-news-52026.php)
- **TikTok Shop** — a shopping-bag icon appears during playback for products
  from a synced catalogue, and a single video can carry several product tags.
  [Printify](https://printify.com/blog/tiktok-shoppable-videos/) ·
  [ReelPlus](https://apps.shopify.com/reelplus)
- **Instagram Reels shopping** — a product name and price preview on the
  video; tapping opens a detail sheet with images, variants and price.
  Secondary source, so treat the detail as indicative.
  [Racklify glossary](https://racklify.com/encyclopedia/what-is-an-instagram-shopping-reel/)
- **Swipe decks for food** — Feed Me gathered restaurants within four blocks
  and swiped right to save, left to discard; Crave swiped _dishes_ rather than
  restaurants; Chicken Tinder added a swipe-up for "love it" and a group mode;
  EasyEat used a Pinterest-style card layout because people judge food
  visually.
  [MobileSyrup on Feed Me](https://mobilesyrup.com/2017/08/22/montreal-based-app-feed-me-like-tinder-but-restaurants/) ·
  [Newcastle Herald on Crave](https://www.newcastleherald.com.au/story/4929991/new-app-is-tinder-for-food/) ·
  [Chicken Tinder](https://blogs.oregonstate.edu/projectchickentinder/?p=1) ·
  [EasyEat](https://desirabilitylab.com/posts/easyeats-choosing-where-to-eat-in-less-than-5-minutes) ·
  [Ognjen Regoje on the swipe for restaurants](https://ognjen.io/concept-tinder-interface-for-restaurants/)
- **Live commerce** — Whatnot's model is a live stream with chat, emoji
  reactions and bid-or-buy during the stream.
  [Apptunix](https://www.apptunix.com/blog/develop-live-shopping-app-like-whatnot/) ·
  [Wowza on shoppable video](https://www.wowza.com/blog/shoppable-video)
- **Where to look next** — the libraries designers actually use for real app
  screens: [Mobbin](https://mobbin.com), Refero, CollectUI, Scrnshts, UX
  Archive and Pttrns, collected in
  [toools.design's list](https://www.toools.design/blog-posts/ultimate-list-100-best-inspiration-sites-to-inspire-designers)
  and [DesignerUp's pattern roundup](https://designerup.co/blog/the-best-collections-of-real-ux-design-patterns/).

Regenerate `data.js` from the mock after a seed change:

```bash
node mockups/clips-directions/data.gen.cjs
```
