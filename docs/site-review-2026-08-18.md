# Ernie Reports — site review & re-envisioning proposal (2026-08-18)

Full audit of every tab: code (export methods + renderers), rendered screenshots,
and data quality. Verdicts are recommendations for Ryan's decision.

## Per-tab verdicts

| Tab | Verdict | Why |
|---|---|---|
| **Home** (hero, standings, Elo strip) | **KEEP** | Live standings render correctly (incl. Yahoo tiebreak order); the Press Box design is the site's identity. |
| **Managers** | **REWORK (heavy)** | Ranks real people #1–#N by an opaque "composite" (.591 etc.) that puts 2-season 2004 managers above 20-season champions (Jordan #4, Andrew #1 over Drew's 5 titles, Alex K #12). No era adjustment, no method note, guaranteed grievance generator. Cards themselves are beautiful — replace grades with careers. |
| **Matchups** | **KEEP (fold in)** | Latest-week category detail works; belongs inside a "This Season" section, not a top-level tab. |
| **Draft Room** | **KEEP** | Year-by-year draft browser with costs; needs only year-nav polish. This IS the archive users want. |
| **Season Replay** | **KEEP** | The bar-race replay is the site's most fun element. Label clarifies it races matchup W-L-T, not category pct. |
| **Power Rankings** | **KILL / REPLACE** | Duplicates the Managers composite verbatim; gold medal to a 0-title 4-season manager; the All-Time Records panel is broken (every record holder renders "?" — name-keyed lookups died in the manager repair) and its "6 titles" contradicts the cards' "5". Replace with a proper **Records & Champions** page. |
| **The Wire** | **REWORK (quick fixes now)** | Recent Moves polluted by future-dated synthetic reconciliation rows ("Sep 2"); "Former manager" pooled as one career row (1,390 moves — it's ~40 different people). Post-fix, this page should also surface FAAB bids (scrape-era data the API never had). |
| **Newsletter** | **KEEP** | Just rebuilt (tables render, archive complete). |
| **Playoff Odds** | **KEEP** | New; already the site's best interactive element. |
| **History** | **KEEP + expand** | Timeline works; should absorb champions/records from the killed Power Rankings tab. |

## Cross-cutting problems

1. **Two Elos.** Site computes Elo from 2009; newsletters standardized on 2022+/K=20
   (after the Week 2 2026 hallucination episode). Same managers, different published
   numbers. Decide one canon: recommend the newsletter's 2022+ "modern era" rating
   as the headline number, with the long-history sparkline clearly labeled as the
   all-time series.
2. **Methodology transparency.** draft_quality / management_quality / composite have
   no visible definition anywhere. Anything the site ranks people by needs a
   one-line method note, or it should not rank people.
3. **Monolithic data.js (3.4MB).** Newsletters embedded as strings; every visitor
   downloads 23 seasons before first paint. Split: `data/core.json` (standings,
   this week), lazy-load per-section files, newsletters as static HTML pages.
4. **Old vs current managers mixed** with no visual distinction in every list.
5. **Anonymous records** ("Former manager") need consistent handling: exclude from
   leaderboards, keep in season tables.

## Re-envisioned information architecture

Replace 10 flat tabs with three questions a league member actually has:

- **This Season** — standings, this week's matchups, playoff odds, the wire.
  (Everything that changes weekly; the landing view.)
- **The Archive** — season replay, draft room by year, newsletter archive,
  champions & records, full season pages (2004–2026, one page per season:
  final standings, playoff bracket, draft, transactions).
- **Managers** — one career page per manager: tenure, titles, year-by-year
  finishes, transaction style, draft history, and the headline feature —
  a **12×12 lifetime H2H rivalry grid** (every published Ernie series claim
  becomes a clickable cell showing the full meeting-by-meeting history).
  Former managers listed separately under "Alumni."

The rivalry grid + per-season pages are the two genuinely new builds; everything
else is reorganization and pruning.

## Immediate fixes (no decision needed)

- Wire: exclude `type='reconciled'` and future timestamps from Recent Moves;
  exclude "Former manager" from career leaderboards. (Shipped with this review.)
- Records panel: repair or hide until the Records page replaces it.

## Data protection (done 2026-08-18)

Private repo `langrill42-collab/ernie-remembers` (full working tree + dated
gzip DB snapshots), OneDrive secondary copies, weekly snapshot step in the
newsletter pipeline. The 23-season record now survives any single failure.
