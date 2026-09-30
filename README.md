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

## The logo

Ahmad's mark (`src/components/Logo.tsx`, and `src/app/icon.svg` for the browser tab) is a pen nib
in 3D whose slit runs on into a circuit trace ending in a node: drawn by hand, built with code. The
nib is a solid sienna slab with its thickness running back and its face lit from the top left, the
trace a raised sage wire with its shadow, and the node a glossy sphere. Pointed at, the nib turns a
little in space, the trace draws itself again and the node lights up.

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

## About: the spec sheet

About is a spec sheet (`src/components/sections/AboutSheet.tsx`, styled in `About.module.css`): the
photo in the middle, and four numbered callouts either side of it — ships production web apps, builds
AI that is simple to use, designs APIs and data architecture, and now at Anma Tech — each with its
paragraph. Under it, a rating plate riveted on like the
ones on the factory's machines: building since, years, projects, tools, hackathons, education and
where he is based. It fits one screen on a laptop; on a phone the callouts follow the photo.

## The scroll reveal

As the page is scrolled, each section's heading, intro and main pieces fade in and rise gently into
place the first time they come into view, one after another (`src/components/sketch/ScrollReveal.tsx`
and the `[data-reveal]` styles in `globals.css`). Anything marked `data-reveal` takes part, staggered
by `--reveal-i`; one IntersectionObserver watches the whole page, and only opacity and translate are
animated, so the browser can run it smoothly on its own. Without scripts everything is simply there,
and for anyone who has asked for less motion it only fades.

## The factory

The hero's right side is an isometric factory (`src/components/factory/`), built with the
drawing kit in `src/components/desk/iso.tsx` in the language of the site's cards and
buttons: every part is a soft rounded block (`Block`: a rounded top swept straight down) in
paper or a pastel, edged in the cards' 55% ink, and put through the same kind of noise
filter and hard offset shadow the cards and chips have (`desk-card`, `desk-chip`).

Ideas (named after Ahmad's projects) drop out of a hopper fed from a thought cloud onto a
conveyor that runs from the top right of the picture to the bottom left, across a factory floor.
The belt runs right through three machines, each a tunnel with an open frame at either end and
glass along the near side, so the work inside can be watched: at DESIGN a pen comes down and
draws the idea into a wireframe, at BUILD (with a tank piped into it) a press stamps it into a
laptop running the app, and at SHIP a box is lowered over it. Little clouds of smoke puff up out
of a pipe on each machine's roof, with a bigger puff each time the machine works. A robot arm at TEST scans
each laptop and ticks it off. Two jointed robot arms stand at the end of the belt: the first
lifts each box off the belt and stacks it at the right side of the belt, two high, and the second
takes the boxes off the stack and carries them into the warehouse. A robot on wheels, with an arm
of its own, drives them one at a time from the warehouse to the truck and packs it, six to a
truck, in two rows of three. Three trucks, each its own colour, take turns: full, a truck drives
off over the words of the hero, leaving tyre tracks across them that fade, and up under the bar
along the top of the page (whatever of it is above the bar's bottom edge is clipped away). Out of
sight, it runs along under the bar to the link to Experience, comes out from under it there on to
a road above the factory, and turns up into the dock on the left of the live server; while one
truck is at the dock, the next waits under the bar. The live server is three racks on a raised
floor — each with its name and vents, a status screen, a row of drive bays and three deploy slots,
lights blinking — with a cooling unit, a fan and an antenna on the roof, a LIVE sign counting the
deploys, and an uptime monitor on the side. A robot on wheels with its own arm (BOT-2, drawn in one
layer with its arm so the two always move together) drives along its lane to the truck's tail,
lifts each box out, drives it to the next slot and deploys it there, where a server blade lights
up. The empty truck backs out on to the road and drives off the right of the page, and comes back
round to the bay when it is free; the next truck pulls in there as soon as the last has gone. A control desk charts
the output; a pallet and a lamp stand about. Clicking the factory drops in an idea. The robot arms are drawn in 3D from their pose each frame (`beam` and `rigParts` in
`Factory.tsx`): every link is a block whose visible faces are shaded by the way they face, the
turret turns to face where the arm reaches, and the parts are painted furthest first.

It is drawn as layers of SVG in one view box, stacked in the order they are painted: whatever is
on the belt moves between them as it goes, from under a machine, to inside it (over its far wall,
under its tool and glass), to over it once it is out. Everything that moves slides by its CSS
translate (the tools by the Web Animations API), so the wobbling edges are never redrawn; only
the robot arms, whose joints bend, are redrawn. Parts that come and go are switched off with
`display`, not `visibility`, since in SVG a child can make itself visible inside a hidden parent.

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

## Skills: the periodic table

The toolbox is a periodic table (`src/components/sections/SkillsTable.tsx`, styled in
`Skills.module.css`): every tool an element with its number, a two-letter symbol and its name,
laid out the way the elements are — the languages down the left like the alkali metals, the web and
the cloud in the block on the right, the databases and the testing tools along the bottom row — and
the AI and LLM tools in a dark row of their own under the table, as the lanthanides are. Each is
coloured by its kind, and its dots count the projects it was used in. In the gap at the top of the
table stand the heading, a key to the kinds (pointed at, a kind lights its elements up; pressed, it
keeps them lit), and one element drawn large with an atom going round it: whichever is pointed at,
with the projects that used it (read from their stacks), or each in turn when nothing is. The
elements are stamped on one after another when the table comes into view, and the whole section,
with the strip of tape sliding by under it, fits one screen on a laptop. Below a laptop's width the
elements simply run in rows, kind by kind.

## Experience: the journey

Experience is a long hand-drawn map laid across the whole width of the page
(`src/components/sections/CareerMap.tsx`, with the 3D places, mountains and trees in
`MapScenes.tsx` and the styling in `Map.module.css`): every role on one road that flows from the
top of the map to the bottom in long, smooth curves (a Catmull–Rom curve through the stops,
which stand at either side of the middle in turn), and the workshop and hackathons as flags
beside it. As the page scrolls, a little robot drone flies down the road level with the middle of
the screen — a floating grey orb split round its middle by a seam glowing orange, with an eye in a
segmented ring round an orange iris, an antenna, and a glowing hover pod on either side, drawn in
the buildings' own wobbling ink with a warm glow all round it — leaning into the bends and bobbing over its
shadow on waves that ripple out over the road under it, with its thruster pushing the air down; the
road behind it is inked in. While the map fills the middle of the screen, the wheel and
trackpad glide: the page eases on towards each turn of the wheel, quickly at first and settling
softly, never faster than about 1250px a second, with half a screen at most waiting; touch screens
and reduced motion scroll as usual. For smoothness the drone's inked body is drawn once and only
moved and turned, with its lights in layers of their own that fade as a whole, and the road is
wobbled a stretch at a time rather than in one filter the length of the page. Each stop's card pops up on the outside of its bend as the ball arrives, and across the
road stands the place itself in 3D — a home office, the university, a Git tree, an easel, a
stepped office, a hackathon tent, a camp, a tower — under 3D mountains, with forests between the
rows. The drone and the inked road move by their transforms only (the inked road is a window
sliding down the sheet over a road sliding back up), so scrolling stays smooth. The road is drawn
through wherever the stops fall on the page, so it fits any width; below a laptop's width it runs
straight down the left with the cards beside it.

## Contact: the postcard and the post box

The contact form is a postcard (`src/components/sections/ContactForm.tsx`, styled in
`Postcard.module.css`) with an airmail edge: the message is written on its left half, on ruled
lines under "Dear Ahmad,", and signed with the name as it is typed; on the right, the address, and
the name and email it is from. Sending it posts to `/api/contact`, which emails Ahmad; once it has
gone, the card shrinks into an envelope, the flap shuts, the envelope turns over, a stamp is stuck
on and franked with the day's date, and the envelope flies to the post box beside it and in through
the slot, whose flap lifts to take it. Then, in the post box's own 3D scene
(`src/components/sections/PostScene.tsx`, drawn with the factory's kit), a post truck drives up the
road from the foot of the picture, and a robot on wheels rolls down its lane from the top; its arm
opens the collection door in the side of the box, takes the letter out, shuts the door and drops the
letter into the MAIL crate on the truck; the truck drives off up the road and the robot rolls away
down its lane. Under it all, the site's own buttons: copy the email address, GitHub and LinkedIn.
The robot arms here and in the factory are drawn by `src/components/desk/rig.tsx`.

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
