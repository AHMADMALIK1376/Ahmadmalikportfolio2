# ahmad.malik — portfolio v2

The personal portfolio of **Muhammad Ahmad Malik**, Full-Stack AI Engineer — drawn as a
sketchbook. Every button, card and heading is made from one hand-drawn button design:
Courier New set bold, an SVG noise filter that makes edges wobble like ink, a soft offset
shadow instead of a border, and a highlighter that scribbles itself across on hover.

## Run it locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Stack

| Layer      | Choice                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| Framework  | **Next.js 16** (App Router, Turbopack) — every page prerendered static |
| Language   | **TypeScript**                                                         |
| UI         | **React 19**                                                           |
| Styling    | **Tailwind CSS 4** — its default palette is cleared; only ours exists  |
| Animation  | **Motion** (`motion/react`) for scroll and interaction, CSS keyframes for the first screen and the wobble |
| Email      | **Resend**, from `/api/contact`                                        |
| Hosting    | **Vercel**                                                             |

## Palette

| Colour         | Main      | Used for                                           |
| -------------- | --------- | -------------------------------------------------- |
| Sage green     | `#9CAF88` | highlighter, tinted cards, the typewriter cursor   |
| Concrete gray  | `#9A9F98` | the paper, the ink, the marquee band, the footer   |
| Burnt sienna   | `#BC4E26` | a touch: numbers, the scroll line, circled words   |

Each has a full ramp in `src/app/globals.css` (`sage-50…800`, `concrete-100…900`,
`sienna-100…700`). Text colours are picked from the darker steps so they pass WCAG AA
on the paper.

## The design system

All of it lives in `src/app/globals.css` and `src/components/sketch/`.

| Piece             | What it is                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| `SketchButton`    | The design's button, unchanged in spirit: idle wobble, hover highlighter, pressed state, the hanging lasso. Sizes `sm` / `md` / `lg`, tones `plain` / `sage` / `sienna`, `calm` for rows of buttons, `lasso` for the big calls to action. |
| `SketchFilters`   | The design's four noise filters, plus gentler ones for large frames and chips. |
| `.sketch-box`     | A card in the button's language. The wobble is drawn on a layer behind the content, so text stays crisp. `--tinted`, `--lift`. |
| `.sketch-well`    | Pressed into the page like the held button: the form fields.             |
| `.sketch-chip`    | Small tags.                                                               |
| `Highlight`       | Marks a word by hand — `marker`, `underline` or `circle` — when it scrolls into view. |
| `Doodle`, `Sketch`| Margin drawings that draw themselves stroke by stroke.                    |
| `Reveal`          | Lays a block onto the page as it scrolls in, settling from a tilt.        |

The three inks (`ink-sage`, `ink-sienna`, `ink-concrete`) are utilities that set a
component's fill, accent, text and highlighter colours at once.

## The pen plotter

The hero's right side is an isometric pen plotter (`src/components/plotter/`), built with
the drawing kit in `src/components/desk/iso.tsx` in the language of the site's cards and
buttons: every part is a soft rounded block (`Block`: a rounded top swept straight down) in
paper or a pastel, edged in the cards' 55% ink, and put through the same kind of noise
filter and hard offset shadow the cards and chips have (`desk-card`, `desk-chip`).

When the page opens it builds itself (outlines, then colour, the gantry lowered onto its
rails, the carriage and pen dropped in, a sheet out of the feed), then plots Ahmad's
projects one sheet at a time (`plots.ts`): Folium's editor, NeuraCache's network,
GraphForge's charts and the Bid Engine's GO / NO-GO flow. The pen writes the labels itself,
in a small single-stroke letter set. A finished sheet is fed out and the next comes in with
the next pen; clicking the machine skips ahead. It is drawn as layers of SVG in one view box,
and the moving ones (gantry, carriage, pen, sheet) slide by their CSS translate, so their
wobbling edges are not redrawn every frame. One number, `--p`, drives the whole opening.

Everything respects `prefers-reduced-motion`.

## What I do: the wallet

The five kinds of work are cards tucked into a stitched sage wallet
(`src/components/sections/ServiceWallet.tsx`, styled in `Wallet.module.css`). Pointed at, it
opens and the cards fan up out of the pocket; the one under the pointer lifts clear. Naming
one in the list beside it lifts its card too. On a phone the wallet starts open.

Clicking a card opens it (`ServiceModal.tsx`): everything about the work on one side, and on
the other its working drawing, rebuilt from the first portfolio's What I do in this one's
style (`src/components/rigs/`): a model training, a system as a staircase of floors, a web
app in layers shipped down a belt, a backend rack serving requests, and a page under a
magnifying glass. Each draws itself as the card opens and then runs on its own clock
(`kit.tsx`). The arrows, or ← and →, step to the next card; Escape closes it.

## Stuff I've built: the ring

The projects stand in a revolving 3D ring (`src/components/sections/Projects.tsx`, styled in
`Ring.module.css`). Each card is solid, drawn like the site's cards, with a sage patterned
back for when it faces away. The ring turns slowly on its own, even under the pointer; it
can be dragged and flung, spun with a sideways swipe on a trackpad, or turned by the
keyboard, which brings each focused card to the front. The card at the front is named
under the ring.

Clicking a card opens it (`ProjectModal.tsx`) with that project's working drawing — the
first portfolio's nine project animations, redrawn in this one's style
(`src/components/rigs/projects/`, sharing the parts-pipes-packets engine in `flow.tsx`).
Every pop-up fits on one screen, on a laptop and on a phone, with nothing to scroll.

## Experience: the road trip

Experience is a hand-drawn map (`src/components/sections/CareerMap.tsx`, with the land in
`MapArt.tsx` and the styling in `Map.module.css`): every role on one road in order, and the
workshop and hackathons as flags just off it. When it scrolls in, the road draws itself, the
pins drop on, and a small van drives from stop to stop while the card beside the map shows
each in full, with a passport stamp. Pointing at a pin puts up its road sign (green on the
road, brown for the landmarks); choosing one sends the van there. Map and card fit one screen.

## Content

Everything the site says is in `src/lib/content.ts` — profile, services, projects,
experience, skills, education — so no two sections can disagree. The phone number and the
private AI testing platform are deliberately left out. The resume is
`public/M-Ahmad-Malik-Resume.pdf`, also reachable at `/resume`.

## Deploying on Vercel

1. On [vercel.com/new](https://vercel.com/new), import this GitHub repository. The defaults
   (Next.js, `npm run build`) are right; nothing needs changing.
2. Under **Settings → Environment Variables**, add `RESEND_API_KEY` so the contact form can
   send. Without it the form politely asks visitors to email directly.
3. Optional: `CONTACT_FROM` once a domain is verified in Resend, and `NEXT_PUBLIC_SITE_URL`
   once there is a custom domain. See `.env.example`.

Every push to `main` deploys to production; every other branch gets a preview URL.
