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

Everything respects `prefers-reduced-motion`.

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
