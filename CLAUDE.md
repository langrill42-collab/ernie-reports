# Ernie Reports

The public-facing frontend for the **Let's Play Two!** fantasy baseball league. Built on data from **Ernie Remembers** (`~/Projects/ernie-remembers/`), which handles all Yahoo API fetching, analytics, and SQLite storage.

## Relationship to Ernie Remembers

- **Ernie Remembers** = data engine (Python, SQLite, Yahoo API, analytics)
- **Ernie Reports** = presentation layer (static site, HTML/CSS/JS)
- Data flows one way: Remembers exports JSON snapshots -> Reports reads them
- Reports never touches the SQLite database directly

## Design Direction: "The Press Box"

The aesthetic is inspired by the Wrigley Field hand-operated scoreboard — deep green steel panels, hand-hung number plates, decades of Chicago weather and stadium lights. The design should feel like walking into a legendary press box where a beat writer has covered this league since 2004.

### The Wrigley Green

The real Wrigley Field scoreboard paint is Benjamin Moore SC-62 "Wrigley Field Green" (`#4b5a51` — a muted grey-green). For screen use, we boost saturation slightly to capture the *under-the-lights* feeling while keeping the authentic warmth:

- **Board background**: `#3B5346` (the core Wrigley green, screen-optimized)
- **Board dark**: `#2A3D32` (deep shadow)
- **Board text**: `#D4E4C8` (aged white number plates)
- **Board bright**: `#E8F0D8` (freshly hung numbers, slight glow)
- **Board dim**: `#6B8B73` (faded/inactive numbers)

### Full Palette

- Ink (text): `#1a1612` (warm near-black)
- Parchment (backgrounds): `#f4efe6` (aged paper)
- Amber (accent/brand): `#c4841d` (stadium lights, brass fixtures)
- Grass (positive): `#2d6b3f` (outfield grass, wins)
- Clay (negative): `#b85c38` (warning track, losses)
- Chalk (white): `#fefcf6` (baseline chalk)

### Typography

- **Display**: Playfair Display (headlines, names, editorial)
- **Stats**: Oswald (numbers, rankings, scoreboard)
- **Body**: Source Serif 4 (readable prose, newsletter text)
- **Mono**: JetBrains Mono (metadata, labels, records)

## Tech Stack

- Static HTML/CSS/JS (vanilla, no framework yet)
- Data from JSON exports (see `src/data/`)
- Future: Astro static site generator for templating
- Deploy target: GitHub Pages, Netlify, or Vercel

## Project Structure

```
ernie-reports/
  public/             — static assets (images, favicon)
  src/
    css/
      tokens.css      — design tokens (colors, type, spacing)
      components.css  — reusable component styles
      layout.css      — page layout and navigation
      pages.css       — page-specific styles
    js/
      app.js          — routing, state, initialization
      data.js         — JSON data loading
    data/             — JSON snapshots from ernie-remembers
  index.html          — single-page app shell
  CLAUDE.md           — this file
```

## Data Export (from Ernie Remembers)

Future: `python -m src.cli export` command in ernie-remembers will write JSON to `ernie-reports/src/data/`. For now, data is stubbed with representative values.
