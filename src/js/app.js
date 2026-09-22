/* ═══════════════════════════════════════════════════════════
   ERNIE REPORTS — App Shell

   Reads window.ERNIE_DATA (set by data.js) and populates
   all pages. Hash-based routing, scroll animations.
   ═══════════════════════════════════════════════════════════ */

let ACTIVE_LEAGUE = 'lpt';
const D = () => (ACTIVE_LEAGUE === 'lpt'
  ? window.ERNIE_DATA
  : window['ERNIE_DATA_' + ACTIVE_LEAGUE.toUpperCase()]) || {};

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  initRouter();
  initScrollAnimations();
  initLeagueToggle();
  initHamburger();
});


/* ── RENDER ALL PAGES ─────────────────────────────────────*/

function renderAll() {
  const d = D();
  if (!d.summary) return;

  renderHero(d);
  renderStandings(d);
  renderElo(d);
  renderManagers(d);
  renderMatchups(d);
  renderDraft(d);
  renderSeasonReplay(d);
  renderRecords(d);
  renderKeepers();
  renderWire(d);
  renderNewsletter(d);
  renderHistory(d);
}


/* ── HERO ─────────────────────────────────────────────────*/

function renderHero(d) {
  const s = d.summary;
  const m = d.matchups || {};
  const eyebrow = document.getElementById('hero-eyebrow');
  if (eyebrow && m.week) {
    eyebrow.textContent = `${s.last_year} Season — Week ${m.week} Complete`;
  }
  const title = document.querySelector('.hero-title');
  const sub = document.querySelector('.hero-subtitle');
  if (title) {
    if (ACTIVE_LEAGUE === 'lpt') {
      title.innerHTML = "Let's Play <em>Two!</em>";
      if (sub) sub.textContent = "Twenty-three seasons. Twelve managers. One league that refuses to die. Ernie remembers everything—the dynasties, the heartbreak, and that one trade in 2017 everyone is still mad about.";
    } else {
      title.innerHTML = escHtml(s.name || 'Statesman League');
      if (sub) sub.textContent = `${s.seasons} seasons, ${s.first_year}–${s.last_year}. NL-only, auction-drafted, lineup-locked on Mondays. Ernie keeps this book too.`;
    }
  }
  const sbTitle = document.querySelector('.scoreboard-title');
  if (sbTitle) sbTitle.textContent = `${s.name || ''} — Head-to-Head Categories`;

  setIf('hero-stat-seasons', s.seasons);
  setIf('hero-stat-teams', s.teams.toLocaleString());
  setIf('hero-stat-picks', s.draft_picks.toLocaleString());
  setIf('hero-stat-txns', s.transactions.toLocaleString());
  setIf('hero-stat-matchups', s.matchups.toLocaleString());
}


/* ── STANDINGS ────────────────────────────────────────────*/

function renderStandings(d) {
  const el = document.getElementById('standings-body');
  if (!el || !d.standings.length) return;

  const m = d.matchups || {};
  setIf('standings-subtitle', `Week ${m.week || '?'} · ${d.summary.last_year}`);

  const elo = {};
  (d.elo || []).forEach(e => elo[e.manager] = e.rating);

  // Sort by category record (the real standings) if available
  const sorted = [...d.standings].sort((a, b) => (b.cat_pct || 0) - (a.cat_pct || 0));

  // Find Elo data for detail expansion
  const eloMap = {};
  (d.elo || []).forEach(e => eloMap[e.manager] = e);

  // Find manager profiles for detail
  const mgrMap = {};
  (d.managers || []).forEach(m => mgrMap[m.manager] = m);

  el.innerHTML = sorted.map((s, i) => {
    const rank = s.cat_rank || i + 1;
    const rankClass = rank <= 3 ? 'top' : rank >= sorted.length - 1 ? 'bottom' : 'mid';
    const catRec = s.cat_record || s.record;
    const catW = s.cat_wins != null ? s.cat_wins : s.wins;
    const catL = s.cat_losses != null ? s.cat_losses : s.losses;
    const recClass = catW > catL ? 'bright' : 'dim';
    const pct = s.cat_pct != null ? `${(s.cat_pct * 100).toFixed(0)}%` : '';
    const streakClass = s.streak.startsWith('W') ? 'streak-w' : s.streak.startsWith('L') ? 'streak-l' : '';

    // Detail data
    const e = eloMap[s.manager] || {};
    const mgr = mgrMap[s.manager] || {};
    const matchRec = s.matchup_record || '';
    const eloRating = e.rating ? Math.round(e.rating) : '—';
    const eloPeak = e.peak ? Math.round(e.peak) : '—';
    const rv = ((D().rivalries || {}).current || []).find(x => x.name === s.manager) || {};
    const titles = rv.titles ? '★'.repeat(rv.titles) : '—';

    return `<div class="scoreboard-row cols-5 interactive" data-mgr="${s.manager}">
      <span class="sb-name">${s.manager}</span>
      <span class="sb-val ${recClass}">${catRec}</span>
      <span class="sb-val">${pct}</span>
      <span class="sb-val ${streakClass}">${s.streak}</span>
      <span class="sb-val"><span class="sb-rank ${rankClass}">${rank}</span></span>
    </div>
    <div class="sb-detail" data-detail="${s.manager}">
      <div class="sb-detail-inner">
        <div class="sb-detail-stat"><span class="sb-detail-stat-label">Matchup</span><span class="sb-detail-stat-val">${matchRec}</span></div>
        <div class="sb-detail-stat"><span class="sb-detail-stat-label">Elo</span><span class="sb-detail-stat-val">${eloRating}</span></div>
        <div class="sb-detail-stat"><span class="sb-detail-stat-label">Peak</span><span class="sb-detail-stat-val">${eloPeak}</span></div>
        <div class="sb-detail-stat"><span class="sb-detail-stat-label">Titles</span><span class="sb-detail-stat-val">${titles}</span></div>
        <div class="sb-detail-stat"><span class="sb-detail-stat-label">Seasons</span><span class="sb-detail-stat-val">${mgr.seasons || '—'}</span></div>
        <div class="sb-detail-stat"><span class="sb-detail-stat-label">Avg Rank</span><span class="sb-detail-stat-val">#${mgr.avg_rank || '—'}</span></div>
      </div>
    </div>`;
  }).join('');

  // Click to expand
  el.querySelectorAll('.scoreboard-row.interactive').forEach(row => {
    row.addEventListener('click', () => {
      const mgr = row.dataset.mgr;
      const detail = el.querySelector(`.sb-detail[data-detail="${mgr}"]`);
      const wasOpen = detail.classList.contains('open');
      // Close all
      el.querySelectorAll('.sb-detail').forEach(d => d.classList.remove('open'));
      el.querySelectorAll('.scoreboard-row.interactive').forEach(r => r.classList.remove('expanded'));
      // Toggle
      if (!wasOpen) {
        detail.classList.add('open');
        row.classList.add('expanded');
      }
    });
  });
}


/* ── ELO ──────────────────────────────────────────────────*/

function renderElo(d) {
  const el = document.getElementById('elo-body');
  if (!el || !d.elo.length) return;

  const maxElo = Math.max(...d.elo.map(e => e.peak));
  const minElo = Math.min(...d.elo.map(e => e.rating));
  const range = maxElo - 1300;  // 1300 as floor for visualization

  el.innerHTML = d.elo.slice(0, 15).map(e => {
    const pct = ((e.rating - 1300) / range) * 100;
    const peakPct = ((e.peak - 1300) / range) * 100;
    const color = e.rating >= 1500
      ? 'linear-gradient(90deg, var(--board), var(--board-dim))'
      : e.rating >= 1450
        ? 'linear-gradient(90deg, var(--amber-dim), var(--amber))'
        : 'linear-gradient(90deg, var(--clay), var(--clay-light))';

    const sparkline = buildSparkline(e.history || [], e.rating);

    return `<div class="elo-row">
      <span class="elo-name">${e.manager}</span>
      <span class="elo-current">${Math.round(e.rating)}</span>
      <div class="elo-bar-track">
        <div class="elo-bar-fill" style="width:${pct}%; background:${color}"></div>
        <div class="elo-bar-peak" style="left:${peakPct}%"></div>
      </div>
      ${sparkline}
      <span class="elo-peak">pk ${Math.round(e.peak)}</span>
    </div>`;
  }).join('');
}


/* ── MANAGERS ─────────────────────────────────────────────*/

function renderManagers(d) {
  const el = document.getElementById('managers-grid');
  const riv = d.rivalries;
  if (!el || !riv || !riv.current) return;

  const finishLine = m => m.years.map(y =>
    `<span title="${y.year}: ${escHtml(y.team)}${y.rank ? ' (#' + y.rank + ')' : ''}"
       style="display:inline-block;width:14px;text-align:center;font-family:var(--font-mono);
       font-size:10px;color:${y.rank === 1 ? 'var(--amber)' : y.rank && y.rank <= 3 ? 'var(--ink)' : 'var(--ink-muted)'}">${y.rank === 1 ? '★' : (y.rank || '·')}</span>`).join('');

  const card = m => {
    const [w, l, t] = m.career_wlt;
    const titles = m.titles ? '★'.repeat(m.titles) : '';
    return `<div class="manager-card">
      <div class="manager-card-header">
        <div class="manager-card-name">${escHtml(m.name)} <span style="color:var(--amber)">${titles}</span></div>
        <div class="manager-card-meta">${m.first}–${m.last} · ${m.seasons} seasons · ${w}-${l}-${t} lifetime</div>
      </div>
      <div class="manager-card-body">
        <div style="margin-bottom:var(--space-sm);font-size:var(--text-xs);color:var(--ink-muted);
          font-family:var(--font-stat);letter-spacing:0.05em">FINISHES ${m.first}→${m.last} (★ = title)</div>
        <div style="line-height:1.9">${finishLine(m)}</div>
      </div>
    </div>`;
  };

  // rivalry grid among current managers
  const names = riv.current.map(m => m.name);
  const short = n => n.split(' ')[0];
  const rec = (a, b) => {
    const k1 = a + '|' + b, k2 = b + '|' + a;
    if (riv.grid[k1]) return riv.grid[k1];
    if (riv.grid[k2]) { const [w, l, t] = riv.grid[k2]; return [l, w, t]; }
    return null;
  };
  let grid = `<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:11px;font-family:var(--font-mono)">
    <tr><th style="padding:4px 6px"></th>${names.map(n => `<th style="padding:4px 6px;color:var(--ink-muted)">${escHtml(short(n))}</th>`).join('')}</tr>`;
  for (const a of names) {
    grid += `<tr><th style="padding:4px 6px;text-align:right;color:var(--ink-muted)">${escHtml(short(a))}</th>`;
    for (const b of names) {
      if (a === b) { grid += '<td style="padding:4px 6px;background:var(--parchment-deep)"></td>'; continue; }
      const r = rec(a, b);
      if (!r || (r[0] + r[1] + r[2]) === 0) { grid += '<td style="padding:4px 6px;text-align:center;color:var(--ink-muted)">—</td>'; continue; }
      const lead = r[0] > r[1] ? 'var(--grass, #2e7d32)' : r[0] < r[1] ? 'var(--clay, #b3562e)' : 'var(--ink-muted)';
      grid += `<td style="padding:4px 6px;text-align:center;color:${lead}" title="${escHtml(a)} vs ${escHtml(b)}: ${r[0]}-${r[1]}-${r[2]}">${r[0]}-${r[1]}${r[2] ? '-' + r[2] : ''}</td>`;
    }
    grid += '</tr>';
  }
  grid += '</table></div>';

  const alumni = riv.alumni.map(m => {
    const [w, l, t] = m.career_wlt;
    return `<div style="padding:var(--space-sm) var(--space-md);border-left:3px solid var(--parchment-deep)">
      <strong>${escHtml(m.name)}</strong> ${m.titles ? '<span style="color:var(--amber)">' + '★'.repeat(m.titles) + '</span>' : ''}
      <span style="color:var(--ink-muted);font-size:var(--text-sm)"> · ${m.first}–${m.last} · ${m.seasons} seasons${(w+l+t) ? ' · ' + w + '-' + l + '-' + t : ''}</span>
    </div>`;
  }).join('');

  el.innerHTML = riv.current.map(card).join('') +
    `<div style="grid-column:1/-1;margin-top:var(--space-xl)">
       <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-xs)">The Rivalry Grid</h3>
       <p style="color:var(--ink-muted);font-size:var(--text-sm);margin-bottom:var(--space-md)">
         Lifetime head-to-head, row vs column — every meeting since 2004, playoffs included,
         post-census identities. Green = row leads.</p>
       ${grid}
     </div>
     <div style="grid-column:1/-1;margin-top:var(--space-xl)">
       <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">Alumni</h3>
       ${alumni}
     </div>`;
}


/* ── MATCHUPS ─────────────────────────────────────────────*/

function renderMatchups(d) {
  const el = document.getElementById('matchups-body');
  const m = d.matchups;
  if (!el || !m || !m.matchups.length) return;

  setIf('matchups-subtitle', `Week ${m.week} · ${m.year}`);

  el.innerHTML = m.matchups.map(g => {
    const homeWon = g.home.score > g.away.score;
    const pips = (g.categories || []).map(c =>
      `<div class="cat-pip ${c.winner}"></div>`
    ).join('');

    const homeWins = (g.categories || []).filter(c => c.winner === 'home').map(c => c.name);
    const awayWins = (g.categories || []).filter(c => c.winner === 'away').map(c => c.name);
    const ties = (g.categories || []).filter(c => c.winner === 'tied').map(c => c.name);

    let detail = '';
    if (homeWins.length) detail += `<span><span class="matchup-detail-label">${g.home.manager} won:</span> ${homeWins.join(', ')}</span>`;
    if (awayWins.length) detail += `<span><span class="matchup-detail-label">${g.away.manager} won:</span> ${awayWins.join(', ')}</span>`;
    if (ties.length) detail += `<span><span class="matchup-detail-label">Tied:</span> ${ties.join(', ')}</span>`;

    // Build expandable stat comparison table
    const statRows = (g.categories || []).map(c => {
      const hv = c.home_val != null ? c.home_val : '—';
      const av = c.away_val != null ? c.away_val : '—';
      const hClass = c.winner === 'home' ? 'won' : c.winner === 'away' ? 'lost' : '';
      const aClass = c.winner === 'away' ? 'won' : c.winner === 'home' ? 'lost' : '';
      return `<div class="matchup-stat-grid">
        <span class="stat-cat">${c.name}</span>
        <span class="stat-val ${hClass}">${hv}</span>
        <span class="stat-val ${aClass}">${av}</span>
      </div>`;
    }).join('');

    return `<div class="matchup-card animate-in">
      <div class="matchup-card-main">
        <div class="matchup-team">
          <div class="matchup-team-name">${g.home.manager}</div>
          <div class="matchup-team-record">${g.home.record} · #${g.home.rank || '?'}</div>
        </div>
        <div class="matchup-score">
          <span class="matchup-score-num ${homeWon ? 'winner' : 'loser'}">${Math.round(g.home.score)}</span>
          <span class="matchup-score-divider">—</span>
          <span class="matchup-score-num ${homeWon ? 'loser' : 'winner'}">${Math.round(g.away.score)}</span>
        </div>
        <div class="matchup-team away">
          <div class="matchup-team-name">${g.away.manager}</div>
          <div class="matchup-team-record">${g.away.record} · #${g.away.rank || '?'}</div>
        </div>
      </div>
      <div class="matchup-categories">${pips}</div>
      <div class="matchup-detail">${detail}</div>
      <div class="matchup-expand-hint">click for stats</div>
      <div class="matchup-stat-table">
        <div class="matchup-stat-grid stat-header">
          <span>Category</span>
          <span style="text-align:right">${g.home.manager}</span>
          <span style="text-align:right">${g.away.manager}</span>
        </div>
        ${statRows}
      </div>
    </div>`;
  }).join('');

  // Click to expand stat tables
  setTimeout(() => {
    document.querySelectorAll('.matchup-card').forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('expanded');
      });
    });
    // Re-observe new elements for scroll animation
    document.querySelectorAll('.matchup-card.animate-in:not(.visible)').forEach(el => observer.observe(el));
  }, 50);
}


/* ── DRAFT ROOM ───────────────────────────────────────────*/

function renderDraft(d) {
  const el = document.getElementById('draft-body');
  const yearSel = document.getElementById('draft-year-select');
  if (!el || !d.draft) return;

  const years = d.draft.years;
  if (yearSel) {
    yearSel.innerHTML = years.map(y =>
      `<option value="${y}" ${y === years[years.length - 1] ? 'selected' : ''}>${y}</option>`
    ).join('');
    yearSel.addEventListener('change', () => renderDraftYear(d, yearSel.value));
  }

  renderDraftYear(d, years[years.length - 1]);
}

function renderDraftYear(d, year) {
  const el = document.getElementById('draft-body');
  const picks = d.draft.picks[year] || [];
  if (!picks.length) {
    el.innerHTML = '<p style="color:var(--ink-muted)">No draft data for this year.</p>';
    return;
  }

  const isAuction = picks.some(p => p.cost > 0);

  // Top picks / biggest spends
  const sorted = [...picks].sort((a, b) => (b.cost || 0) - (a.cost || 0));
  const topSpends = isAuction ? sorted.slice(0, 10) : picks.slice(0, 10);

  // Per-manager summary
  const byMgr = {};
  picks.forEach(p => {
    if (!byMgr[p.manager]) byMgr[p.manager] = { total: 0, count: 0, players: [] };
    byMgr[p.manager].total += p.cost || 0;
    byMgr[p.manager].count++;
    byMgr[p.manager].players.push(p);
  });

  let html = `<div class="two-col" style="gap:var(--space-xl)">`;

  // Left: top picks
  html += `<div>
    <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">
      ${isAuction ? 'Biggest Spends' : 'Top Picks'}
    </h3>
    <div class="scoreboard">
      <div class="scoreboard-row header" style="grid-template-columns:0.5fr 2fr 1.5fr 0.8fr">
        <span>#</span><span>Player</span><span>Manager</span><span style="text-align:right">${isAuction ? 'Cost' : 'Pick'}</span>
      </div>
      ${topSpends.map((p, i) => `<div class="scoreboard-row" style="grid-template-columns:0.5fr 2fr 1.5fr 0.8fr">
        <span class="sb-val">${i + 1}</span>
        <span class="sb-name">${p.player || 'Unknown'}</span>
        <span class="sb-val">${p.manager || '?'}</span>
        <span class="sb-val bright">${isAuction ? p.cost : p.pick}</span>
      </div>`).join('')}
    </div>
  </div>`;

  // Right: manager spend summary
  html += `<div>
    <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">
      ${isAuction ? 'Manager Spending' : 'Picks by Manager'}
    </h3>
    <div class="scoreboard">
      <div class="scoreboard-row header" style="grid-template-columns:2fr 1fr 1fr">
        <span>Manager</span><span style="text-align:right">Picks</span><span style="text-align:right">${isAuction ? 'Total' : 'Avg Pick'}</span>
      </div>
      ${Object.entries(byMgr).sort((a, b) => b[1].total - a[1].total).map(([mgr, data]) => `<div class="scoreboard-row" style="grid-template-columns:2fr 1fr 1fr">
        <span class="sb-name">${mgr}</span>
        <span class="sb-val">${data.count}</span>
        <span class="sb-val">${isAuction ? data.total : Math.round(data.total / data.count || 0)}</span>
      </div>`).join('')}
    </div>
  </div>`;

  html += `</div>`;
  el.innerHTML = html;
}


/* ── SEASON REPLAY ────────────────────────────────────────*/

function renderSeasonReplay(d) {
  const ws = d.weekly_standings;
  const yearSel = document.getElementById('replay-year-select');
  const el = document.getElementById('replay-body');
  if (!el || !ws || !ws.years.length) return;

  yearSel.innerHTML = ws.years.map(y =>
    `<option value="${y}" ${y === ws.years[0] ? 'selected' : ''}>${y}</option>`
  ).join('');

  let animFrame = null;
  let currentWeek = 0;
  let playing = false;

  function renderWeek(year, weekIdx) {
    const yearData = ws.data[year] || [];
    if (!yearData.length) { el.innerHTML = '<p style="color:var(--ink-muted)">No standings data for this year.</p>'; return; }

    const week = yearData[Math.min(weekIdx, yearData.length - 1)];
    const totalWeeks = yearData.length;

    setIf('replay-week-label', `Week ${week.week} of ${yearData[yearData.length - 1].week}`);

    // Progress bar
    const pct = ((weekIdx + 1) / totalWeeks) * 100;
    const prog = document.getElementById('replay-progress');
    if (prog) prog.style.width = pct + '%';

    // Render standings as a bar race
    const maxWins = Math.max(...week.standings.map(s => s.wins + s.ties * 0.5), 1);

    el.innerHTML = week.standings.map(s => {
      const winPct = (s.wins + s.ties * 0.5) / maxWins * 100;
      const color = s.rank <= 3 ? 'var(--board)' : s.rank <= 6 ? 'var(--amber)' : 'var(--clay)';
      return `<div class="replay-bar-row" style="display:grid;grid-template-columns:110px 1fr 80px;align-items:center;gap:var(--space-md);padding:3px 0;transition:all 0.3s ease">
        <span style="font-family:var(--font-stat);font-size:var(--text-sm);color:var(--ink)">${s.rank}. ${s.manager}</span>
        <div style="height:18px;background:var(--parchment-deep);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${winPct}%;background:${color};border-radius:2px;transition:width 0.4s var(--ease-out)"></div>
        </div>
        <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--ink-muted);text-align:right">${s.wins}-${s.losses}-${s.ties}</span>
      </div>`;
    }).join('');
  }

  function play() {
    const year = yearSel.value;
    const yearData = ws.data[year] || [];
    if (!yearData.length) return;

    playing = true;
    document.getElementById('replay-play').textContent = '⏸ Pause';

    function step() {
      if (!playing) return;
      if (currentWeek >= yearData.length - 1) {
        playing = false;
        document.getElementById('replay-play').textContent = '▶ Play';
        return;
      }
      currentWeek++;
      renderWeek(year, currentWeek);
      animFrame = setTimeout(step, 400);
    }
    step();
  }

  function pause() {
    playing = false;
    if (animFrame) clearTimeout(animFrame);
    document.getElementById('replay-play').textContent = '▶ Play';
  }

  // Controls
  document.getElementById('replay-play').addEventListener('click', () => {
    if (playing) pause(); else play();
  });

  document.getElementById('replay-reset').addEventListener('click', () => {
    pause();
    currentWeek = 0;
    renderWeek(yearSel.value, 0);
  });

  yearSel.addEventListener('change', () => {
    pause();
    currentWeek = 0;
    renderWeek(yearSel.value, 0);
  });

  // Initial render
  renderWeek(yearSel.value, 0);
}


/* ── POWER RANKINGS ───────────────────────────────────────*/

function renderPowerRankings(d) {
  const el = document.getElementById('power-body');
  if (!el || !d.managers.length) return;

  const elo = {};
  (d.elo || []).forEach(e => elo[e.manager] = e);

  // Combined ranking: composite + Elo + titles
  const ranked = d.managers.filter(m => m.seasons >= 2).map(m => {
    const e = elo[m.manager] || {};
    const titles = d.history.filter(h => h.champion === m.manager).length;
    return { ...m, elo_rating: e.rating || 1500, elo_peak: e.peak || 1500, titles };
  }).sort((a, b) => b.composite - a.composite);

  el.innerHTML = ranked.map((m, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    const titleStr = m.titles > 0 ? `<span style="color:var(--amber)">${'★'.repeat(m.titles)}</span>` : '';

    return `<div class="power-card" style="display:grid;grid-template-columns:50px 1fr;gap:var(--space-lg);padding:var(--space-lg);background:var(--chalk);border:1px solid var(--parchment-deep);border-radius:var(--radius-lg);margin-bottom:var(--space-md)">
      <div style="font-family:var(--font-stat);font-size:var(--text-3xl);font-weight:600;color:${rank <= 3 ? 'var(--amber)' : 'var(--ink-muted)'};text-align:center;line-height:1">${medal}</div>
      <div>
        <div style="display:flex;align-items:baseline;gap:var(--space-sm);margin-bottom:var(--space-xs)">
          <span style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700">${m.manager}</span>
          ${titleStr}
        </div>
        <div style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--ink-muted);margin-bottom:var(--space-sm)">
          ${m.seasons} seasons · Avg #${m.avg_rank} · Elo ${Math.round(m.elo_rating)} (pk ${Math.round(m.elo_peak)}) · ${m.titles} title${m.titles !== 1 ? 's' : ''}
        </div>
        <div style="display:flex;gap:var(--space-xl);font-family:var(--font-mono);font-size:var(--text-xs)">
          <span>Composite <strong style="color:var(--ink)">${m.composite.toFixed(3)}</strong></span>
          <span>Draft <strong style="color:var(--grass)">${m.draft_quality.toFixed(3)}</strong></span>
          <span>Mgmt <strong style="color:var(--amber)">${m.management_quality.toFixed(3)}</strong></span>
          <span>Adds/yr <strong>${m.avg_adds}</strong></span>
        </div>
      </div>
    </div>`;
  }).join('');

  // Records sidebar
  const recEl = document.getElementById('power-records');
  if (recEl && d.power_rankings.records) {
    const recs = d.power_rankings.records;
    recEl.innerHTML = Object.entries(recs).slice(0, 10).map(([key, val]) => {
      const display = typeof val === 'object' && val !== null
        ? `${val.manager || val.player || '?'} — ${val.value || val.detail || ''}`
        : String(val);
      return `<div style="padding:var(--space-sm) 0;border-bottom:1px solid rgba(212,228,200,0.06)">
        <div style="font-family:var(--font-mono);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--board-dim)">${key.replace(/_/g, ' ')}</div>
        <div style="font-family:var(--font-stat);font-size:var(--text-sm);color:var(--board-text)">${display}</div>
      </div>`;
    }).join('');
  }
}


/* ── THE WIRE ─────────────────────────────────────────────*/

function renderWire(d) {
  const el = document.getElementById('wire-body');
  const tx = d.transactions;
  if (!el || !tx) return;

  // Activity chart (season counts as bar chart)
  const maxMoves = Math.max(...tx.season_counts.map(c => c.moves));

  let html = `<div class="two-col" style="gap:var(--space-xl)">`;

  // Left: activity bars
  html += `<div>
    <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">
      ${tx.year} Transaction Activity
    </h3>
    <div style="display:flex;flex-direction:column;gap:4px">
      ${tx.season_counts.map(c => {
        const pct = (c.moves / maxMoves) * 100;
        const color = pct > 70 ? 'var(--grass)' : pct > 40 ? 'var(--amber)' : 'var(--clay)';
        return `<div style="display:grid;grid-template-columns:110px 1fr 40px;align-items:center;gap:var(--space-md)">
          <span style="font-family:var(--font-stat);font-size:var(--text-sm)">${c.manager}</span>
          <div style="height:16px;background:var(--parchment-deep);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:2px"></div>
          </div>
          <span style="font-family:var(--font-mono);font-size:var(--text-xs);text-align:right">${c.moves}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  // Right: recent transaction feed
  html += `<div>
    <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">
      Recent Moves
    </h3>
    <div style="display:flex;flex-direction:column;gap:2px;max-height:500px;overflow-y:auto">
      ${tx.recent.map(t => {
        const icon = t.action === 'add' ? '↑' : t.action === 'drop' ? '↓' : t.action === 'trade' ? '↔' : '·';
        const iconColor = t.action === 'add' ? 'var(--grass)' : t.action === 'drop' ? 'var(--clay)' : 'var(--amber)';
        const ts = t.timestamp ? new Date(t.timestamp * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '';
        return `<div style="display:grid;grid-template-columns:20px 1fr 90px 60px;align-items:center;padding:var(--space-xs) 0;border-bottom:1px solid var(--parchment-deep);font-size:var(--text-sm)">
          <span style="color:${iconColor};font-weight:700;font-family:var(--font-stat)">${icon}</span>
          <span style="font-family:var(--font-body)">${t.player || '?'}</span>
          <span style="font-family:var(--font-stat);font-size:var(--text-xs);color:var(--ink-muted)">${t.manager}</span>
          <span style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--ink-muted);text-align:right">${ts}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;

  html += `</div>`;

  // Career totals
  if (tx.career && tx.career.length) {
    const maxCareer = Math.max(...tx.career.map(c => c.moves));
    html += `<div style="margin-top:var(--space-xl)">
      <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">All-Time Career Transactions</h3>
      <div class="scoreboard">
        <div class="scoreboard-row header" style="grid-template-columns:2fr 1fr 1fr 1fr">
          <span>Manager</span><span style="text-align:right">Moves</span><span style="text-align:right">Seasons</span><span style="text-align:right">Avg/yr</span>
        </div>
        ${tx.career.slice(0, 15).map(c => `<div class="scoreboard-row" style="grid-template-columns:2fr 1fr 1fr 1fr">
          <span class="sb-name">${c.manager}</span>
          <span class="sb-val bright">${c.moves}</span>
          <span class="sb-val">${c.seasons}</span>
          <span class="sb-val">${(c.moves / c.seasons).toFixed(1)}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  el.innerHTML = html;
}


/* ── NEWSLETTER ───────────────────────────────────────────*/

function renderNewsletter(d) {
  const listEl = document.getElementById('newsletter-list');
  const bodyEl = document.getElementById('newsletter-content');
  if (!listEl || !d.newsletters || !d.newsletters.length) return;
  if (!d.newsletters[0].content) return;  // index only — lazy loader will re-render

  listEl.innerHTML = d.newsletters.map((n, i) => {
    const label = n.label.replace('week', 'Week ').replace('preseason', 'Preseason')
      .replace('draft-review', 'Draft Review').replace('free-agency', 'Free Agency')
      .replace('waiver-wire', 'Waiver Wire').replace('season-preview', 'Season Preview');
    return `<a class="newsletter-link ${i === 0 ? 'active' : ''}" data-idx="${i}"
      style="display:block;padding:var(--space-sm) var(--space-md);border-left:3px solid ${i === 0 ? 'var(--amber)' : 'transparent'};
        font-family:var(--font-stat);font-size:var(--text-sm);color:${i === 0 ? 'var(--ink)' : 'var(--ink-muted)'};
        cursor:pointer;transition:all 0.15s ease">
      <div>${n.year} ${label}</div>
    </a>`;
  }).join('');

  function showNewsletter(idx) {
    const n = d.newsletters[idx];
    if (!n) return;

    // Convert markdown to basic HTML
    let src = n.content.replace(/<!--[\s\S]*?-->/g, '');  // strip HTML comments

    // Markdown tables -> styled tables (must run before inline formatting)
    src = src.replace(
      /((?:^\|.*\|[ \t]*\n)+)/gm,
      (block) => {
        const lines = block.trim().split('\n').filter(l => l.trim());
        if (lines.length < 2 || !/^\|[\s:-]+\|/.test(lines[1].replace(/[^|:\s-]/g, ''))) {
          // no separator row -> not a table
          if (!/^\|[-\s|:]+\|$/.test(lines[1] || '')) return block;
        }
        const cells = l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const head = cells(lines[0]);
        const rows = lines.slice(2).map(cells);
        const th = head.map(h => `<th style="text-align:left;padding:6px 10px;border-bottom:2px solid var(--parchment-deep);font-family:var(--font-stat);font-size:var(--text-xs);letter-spacing:0.05em;text-transform:uppercase;color:var(--ink-muted)">${h}</th>`).join('');
        const tr = rows.map(r => `<tr>${r.map(c => `<td style="padding:5px 10px;border-bottom:1px solid var(--parchment-deep);font-variant-numeric:tabular-nums">${c}</td>`).join('')}</tr>`).join('');
        return `\n<div style="overflow-x:auto"><table style="border-collapse:collapse;margin:var(--space-md) 0;width:100%">` +
               `<thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>\n\n`;
      });

    let html = src
      .replace(/^#### (.+)$/gm, '<h5 style="font-family:var(--font-display);font-weight:700;margin:var(--space-md) 0 var(--space-xs)">$1</h5>')
      .replace(/^### (.+)$/gm, '<h4 style="font-family:var(--font-display);font-weight:700;margin:var(--space-lg) 0 var(--space-sm)">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 style="font-family:var(--font-display);font-weight:700;font-size:var(--text-lg);margin:var(--space-xl) 0 var(--space-sm)">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 style="font-family:var(--font-display);font-weight:700;font-size:var(--text-xl);margin:var(--space-xl) 0 var(--space-md)">$1</h2>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/^---$/gm, '<hr style="border:none;height:1px;background:var(--parchment-deep);margin:var(--space-lg) 0">')
      .replace(/^- (.+)$/gm, '<li style="margin-left:var(--space-lg);margin-bottom:var(--space-xs)">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li style="margin-left:var(--space-lg);margin-bottom:var(--space-xs)">$1</li>');

    // Wrap paragraphs
    html = html.split('\n\n').map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h') || block.startsWith('<hr') || block.startsWith('<li')
          || block.startsWith('<div') || block.startsWith('<table')) return block;
      return `<p>${block}</p>`;
    }).join('\n');

    bodyEl.innerHTML = `<div class="newsletter-body" style="padding:var(--space-xl)">${html}</div>`;

    // Update active state
    listEl.querySelectorAll('.newsletter-link').forEach((a, i) => {
      a.style.borderLeftColor = i === idx ? 'var(--amber)' : 'transparent';
      a.style.color = i === idx ? 'var(--ink)' : 'var(--ink-muted)';
    });
  }

  listEl.addEventListener('click', e => {
    const link = e.target.closest('.newsletter-link');
    if (link) showNewsletter(parseInt(link.dataset.idx));
  });

  showNewsletter(0);
}


/* ── HISTORY ──────────────────────────────────────────────*/

function renderHistory(d) {
  const timelineEl = document.getElementById('history-timeline');
  const champsEl = document.getElementById('history-champs');
  if (!timelineEl || !d.history.length) return;

  timelineEl.innerHTML = d.history.map((h, i) => {
    const isActive = i === 0;
    const champLine = h.champion
      ? `<span class="timeline-champ">Champion: ${h.champion}</span>${h.champion_record ? ` (${h.champion_record})` : ''}`
      : `<span class="timeline-champ">${h.league_name || 'Season'}</span> — ${h.num_teams || '?'} teams, ${h.scoring_type || '?'} scoring`;

    return `<div class="timeline-node ${isActive ? 'active' : ''}">
      <div class="timeline-year">${h.year}</div>
      <div class="timeline-event">${champLine}</div>
    </div>`;
  }).join('');

  // Championship counts
  if (champsEl) {
    const counts = {};
    const seasons = {};
    d.history.forEach(h => {
      if (h.champion) {
        counts[h.champion] = (counts[h.champion] || 0) + 1;
      }
      // Count seasons per manager from standings
      (h.standings || []).forEach(s => {
        if (s.manager) seasons[s.manager] = (seasons[s.manager] || 0) + 1;
      });
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    champsEl.innerHTML = `<div class="scoreboard-title">All-Time Championships</div>` +
      sorted.map(([mgr, cnt]) => `<div class="scoreboard-row" style="grid-template-columns:2fr 0.5fr 1fr">
        <span class="sb-name">${mgr}</span>
        <span class="sb-val bright">${cnt}</span>
        <span class="sb-val dim">${seasons[mgr] || '?'} seasons</span>
      </div>`).join('');
  }
}




/* ── RECORDS & CHAMPIONS ─────────────────────────────────*/

const RECORD_LABELS = {
  best_week: 'Best single week', worst_week: 'Worst single week',
  most_wins: 'Most category wins, season', fewest_wins: 'Fewest category wins, season',
  best_career_pct: 'Best career pct', most_transactions: 'Most moves, season',
  biggest_blowout: 'Biggest blowout', most_titles: 'Most titles',
  longest_drought: 'Longest title drought',
};

function renderRecords(d) {
  const champs = document.getElementById('records-champions');
  if (!champs) return;
  const hist = (d.history || []).filter(h => h.champion);
  champs.innerHTML = `<div class="scoreboard"><div class="scoreboard-title">Champions, ${hist[hist.length-1].year}–${hist[0].year}</div>` +
    hist.map(h => {
      const rec = (h.champion_record && h.champion_record !== '0-0-0') ? h.champion_record : '';
      return `<div class="scoreboard-row" style="display:grid;grid-template-columns:60px 1fr 1fr 110px;padding:4px 12px">
      <span style="font-family:var(--font-mono)">${h.year}</span>
      <span><strong>${escHtml(h.champion)}</strong></span>
      <span style="color:var(--board-dim)">${escHtml(h.champion_team || '')}</span>
      <span style="text-align:right;font-family:var(--font-mono);white-space:nowrap">${escHtml(rec)}</span>
    </div>`; }).join('') + '</div>';

  const rec = document.getElementById('records-alltime');
  const R = d.records || {};
  rec.innerHTML = '<h3 style="font-family:var(--font-display);margin-bottom:var(--space-md)">All-Time Records</h3>' +
    Object.entries(RECORD_LABELS).filter(([k]) => R[k]).map(([k, label]) => {
      const r = R[k];
      const holder = r.manager || r.holder || '?';
      const detail = r.detail || [r.score, r.wins, r.pct, r.moves, r.value].find(v => v !== undefined) || '';
      const when = r.year ? ` (${r.year}${r.week ? ' wk' + r.week : ''})` : '';
      return `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--parchment-deep)">
        <span style="color:var(--ink-muted)">${label}</span>
        <span><strong>${escHtml(String(holder))}</strong> ${escHtml(String(detail))}${when}</span></div>`;
    }).join('');

  const titles = document.getElementById('records-titles');
  const counts = {};
  hist.forEach(h => counts[h.champion] = (counts[h.champion] || 0) + 1);
  titles.innerHTML = '<h3 style="font-family:var(--font-display);margin-bottom:var(--space-md)">Title Count</h3>' +
    Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([m, c]) =>
      `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--parchment-deep)">
        <span>${escHtml(m)}</span><span style="color:var(--amber)">${'★'.repeat(c)}</span></div>`).join('');
}

/* ── KEEPERS ─────────────────────────────────────────────*/

function renderKeepers() {
  const body = document.getElementById('keepers-body');
  const K = window.ERNIE_KEEPERS;
  if (!body || !K || ACTIVE_LEAGUE !== 'lpt') { if (body) body.innerHTML = ''; return; }
  setIf('keepers-subtitle', `2027 Outlook · as of ${K.generated}`);

  const managers = [...new Set(K.rows.map(r => r.manager))];
  const filterEl = document.getElementById('keepers-filter');
  let active = window.__keeperFilter || 'All';

  const chip = (label) =>
    `<button class="chip-k" data-m="${escHtml(label)}" style="border:1px solid var(--parchment-deep);
       background:${label === active ? 'var(--board)' : 'var(--parchment)'};
       color:${label === active ? 'var(--board-text)' : 'var(--ink-muted)'};
       padding:4px 12px;border-radius:14px;cursor:pointer;font-family:var(--font-stat);
       font-size:var(--text-xs);letter-spacing:0.04em">${escHtml(label)}</button>`;
  filterEl.innerHTML = ['All', ...managers].map(chip).join('');
  filterEl.querySelectorAll('.chip-k').forEach(b => b.onclick = () => {
    window.__keeperFilter = b.dataset.m; renderKeepers();
  });

  const rows = K.rows.filter(r => active === 'All' || r.manager === active);
  const statusColor = st =>
    /MAXED OUT/.test(st) ? 'var(--clay)' :
    /final year/.test(st) ? 'var(--amber-dim, #b8860b)' : 'var(--ink-muted)';

  let html = '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:var(--text-sm)">';
  html += `<tr>${['Manager','Player','MLB','Price','Status','Keepable through']
    .map((h,i) => `<th style="text-align:${i===3?'right':'left'};padding:6px 10px;border-bottom:2px solid var(--parchment-deep);font-family:var(--font-stat);font-size:var(--text-xs);letter-spacing:0.05em;color:var(--ink-muted)">${h}</th>`).join('')}</tr>`;
  let lastMgr = null;
  for (const r of rows) {
    const mgrCell = r.manager === lastMgr && active === 'All' ? '' : escHtml(r.manager);
    lastMgr = r.manager;
    html += `<tr>
      <td style="padding:4px 10px;border-bottom:1px solid var(--parchment-deep);font-weight:600">${mgrCell}</td>
      <td style="padding:4px 10px;border-bottom:1px solid var(--parchment-deep)">${escHtml(r.player)}</td>
      <td style="padding:4px 10px;border-bottom:1px solid var(--parchment-deep);color:var(--ink-muted)">${escHtml(r.mlb || '')}</td>
      <td style="padding:4px 10px;border-bottom:1px solid var(--parchment-deep);text-align:right;font-variant-numeric:tabular-nums">${r.price != null ? '$' + r.price : ''}</td>
      <td style="padding:4px 10px;border-bottom:1px solid var(--parchment-deep);color:${statusColor(r.status)}">${escHtml(r.status)}</td>
      <td style="padding:4px 10px;border-bottom:1px solid var(--parchment-deep);font-variant-numeric:tabular-nums">${r.last_year || '—'}</td>
    </tr>`;
  }
  html += '</table></div>';
  body.innerHTML = html;
}



/* ── REPORT CARDS ─────────────────────────────────────────*/

const RC_AMBER = '#c4841d';      // kept contracts / focus series
const RC_GREEN = '#2e7d32';      // auction buys  (pair validated for CVD)
const RC_CLAY  = '#b85c38';      // negative side of diverging bars
let _rcLoaded = false;

function ensureReportCards() {
  if (_rcLoaded) return;
  _rcLoaded = true;
  const sc = document.createElement('script');
  sc.src = 'src/data/report_cards_2026.js?v=' + encodeURIComponent(D().exported_at || '');
  sc.onload = () => renderReportCards();
  sc.onerror = () => {
    const b = document.getElementById('rc-body');
    if (b) b.innerHTML = '<p style="color:var(--ink-muted)">Report cards are not available yet.</p>';
  };
  document.head.appendChild(sc);
}

function rcOrdinal(n) {
  if (!n) return '—';
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* Season Elo, one line per manager, the chosen one in focus. */
function rcEloChart(name, year) {
  const series = (D().elo || [])
    .map(e => ({ name: e.manager, pts: (e.history || []).filter(h => h.year === year).sort((a, b) => a.week - b.week) }))
    .filter(s => s.pts.length > 1);
  if (!series.length) return '';
  const W = 760, H = 250, P = { l: 46, r: 92, t: 14, b: 30 };
  const weeks = series.flatMap(s => s.pts.map(p => p.week));
  const vals = series.flatMap(s => s.pts.map(p => p.elo));
  const x0 = Math.min(...weeks), x1 = Math.max(...weeks);
  const lo = Math.min(...vals, 1500) - 12, hi = Math.max(...vals, 1500) + 12;
  const X = w => P.l + (w - x0) / Math.max(x1 - x0, 1) * (W - P.l - P.r);
  const Y = v => P.t + (hi - v) / Math.max(hi - lo, 1) * (H - P.t - P.b);
  const path = pts => pts.map((p, i) => (i ? 'L' : 'M') + X(p.week).toFixed(1) + ',' + Y(p.elo).toFixed(1)).join(' ');
  const ticks = [];
  for (let v = Math.ceil(lo / 50) * 50; v <= hi; v += 50) ticks.push(v);
  const me = series.find(s => s.name === name);
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img"
      aria-label="Elo rating by week, ${escHtml(name)} highlighted against the other managers"
      style="font-family:var(--font-mono);font-size:10px">`;
  svg += ticks.map(v => `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"
      stroke="var(--parchment-deep)" stroke-width="1"/>
      <text x="${P.l - 8}" y="${(Y(v) + 3).toFixed(1)}" text-anchor="end" fill="var(--ink-muted)">${v}</text>`).join('');
  svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(1500).toFixed(1)}" y2="${Y(1500).toFixed(1)}"
      stroke="var(--ink-muted)" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`;
  for (const s of series) if (s.name !== name)
    svg += `<path d="${path(s.pts)}" fill="none" stroke="var(--ink-muted)" stroke-width="1" opacity="0.22"/>`;
  if (me) {
    svg += `<path d="${path(me.pts)}" fill="none" stroke="${RC_AMBER}" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round"/>`;
    svg += me.pts.map(p => `<circle cx="${X(p.week).toFixed(1)}" cy="${Y(p.elo).toFixed(1)}" r="9" fill="transparent">
        <title>Week ${p.week} · ${Math.round(p.elo)}</title></circle>`).join('');
    const last = me.pts[me.pts.length - 1];
    svg += `<circle cx="${X(last.week).toFixed(1)}" cy="${Y(last.elo).toFixed(1)}" r="4"
        fill="${RC_AMBER}" stroke="var(--chalk)" stroke-width="2"/>
      <text x="${(X(last.week) + 10).toFixed(1)}" y="${(Y(last.elo) + 4).toFixed(1)}"
        fill="var(--ink)" style="font-family:var(--font-stat);font-size:12px">${escHtml(name)} ${Math.round(last.elo)}</text>`;
  }
  for (let w = x0; w <= x1; w += Math.ceil((x1 - x0) / 8))
    svg += `<text x="${X(w).toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="var(--ink-muted)">wk ${w}</text>`;
  svg += '</svg>';
  return `<div style="overflow-x:auto">${svg}</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;color:var(--ink-muted);font-size:var(--text-xs);
      font-family:var(--font-mono);margin-top:4px">
      <span><span style="display:inline-block;width:14px;height:2px;background:${RC_AMBER};vertical-align:middle"></span> ${escHtml(name)}</span>
      <span><span style="display:inline-block;width:14px;height:2px;background:var(--ink-muted);opacity:.4;vertical-align:middle"></span> other managers</span>
      <span><span style="display:inline-block;width:14px;border-top:1px dashed var(--ink-muted);vertical-align:middle"></span> 1500 baseline</span>
    </div>`;
}

/* Draft price against what the pick returned. */
function rcDraftScatter(m, RC) {
  const pts = (m.draft.detail || []).filter(p => p.cost != null);
  if (!pts.length) return '<p style="color:var(--ink-muted)">No draft picks on record.</p>';
  const dpw = RC.league.dollars_per_win || 4.5;
  const W = 760, H = 300, P = { l: 46, r: 18, t: 16, b: 38 };
  const maxC = Math.max(...pts.map(p => p.cost), 10) * 1.06;
  const maxW = Math.max(...pts.map(p => p.war), 2) * 1.12;
  const minW = Math.min(...pts.map(p => p.war), 0) * 1.2 - 0.3;
  const X = c => P.l + c / maxC * (W - P.l - P.r);
  const Y = w => P.t + (maxW - w) / (maxW - minW) * (H - P.t - P.b);
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img"
      aria-label="Auction price against wins above replacement for each of ${escHtml(m.manager)}'s draft picks"
      style="font-family:var(--font-mono);font-size:10px">`;
  for (let w = Math.ceil(minW); w <= maxW; w += Math.max(1, Math.round((maxW - minW) / 6)))
    svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(w).toFixed(1)}" y2="${Y(w).toFixed(1)}"
        stroke="var(--parchment-deep)" stroke-width="1"/>
      <text x="${P.l - 8}" y="${(Y(w) + 3).toFixed(1)}" text-anchor="end" fill="var(--ink-muted)">${w}</text>`;
  svg += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(0).toFixed(1)}" y2="${Y(0).toFixed(1)}"
      stroke="var(--ink-muted)" stroke-width="1" opacity="0.5"/>`;
  const beX = Math.min(maxC, maxW * dpw);
  svg += `<line x1="${X(0).toFixed(1)}" y1="${Y(0).toFixed(1)}" x2="${X(beX).toFixed(1)}" y2="${Y(beX / dpw).toFixed(1)}"
      stroke="var(--ink-muted)" stroke-width="1" stroke-dasharray="5 4" opacity="0.7"/>`;
  const mark = p => {
    const x = X(p.cost), y = Y(p.war), t =
      `<title>${escHtml(p.player)} · $${p.cost} · ${p.war.toFixed(1)} WAR${p.kept ? ' · kept' : ''}${p.days ? ' · ' + p.days + ' active days' : ' · never started'}</title>`;
    return p.kept
      ? `<path d="M ${x.toFixed(1)},${(y - 6).toFixed(1)} L ${(x + 6).toFixed(1)},${y.toFixed(1)} L ${x.toFixed(1)},${(y + 6).toFixed(1)} L ${(x - 6).toFixed(1)},${y.toFixed(1)} Z"
             fill="${RC_AMBER}" stroke="var(--chalk)" stroke-width="2">${t}</path>`
      : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="${RC_GREEN}" stroke="var(--chalk)" stroke-width="2">${t}</circle>`;
  };
  svg += pts.map(mark).join('');
  const resid = p => p.war - p.cost / dpw;
  const best = pts.reduce((a, b) => resid(b) > resid(a) ? b : a);
  const worst = pts.reduce((a, b) => resid(b) < resid(a) ? b : a);
  for (const [p, dy] of [[best, -12], [worst, 16]]) {
    const anchor = X(p.cost) > W - 160 ? 'end' : 'start';
    svg += `<text x="${(X(p.cost) + (anchor === 'end' ? -9 : 9)).toFixed(1)}" y="${(Y(p.war) + dy).toFixed(1)}"
        text-anchor="${anchor}" fill="var(--ink)" style="font-family:var(--font-stat);font-size:11px">${escHtml(p.player)}</text>`;
  }
  for (let c = 0; c <= maxC; c += Math.max(5, Math.round(maxC / 6 / 5) * 5))
    svg += `<text x="${X(c).toFixed(1)}" y="${H - 16}" text-anchor="middle" fill="var(--ink-muted)">$${c}</text>`;
  svg += `<text x="${((W - P.r + P.l) / 2).toFixed(0)}" y="${H - 2}" text-anchor="middle"
      fill="var(--ink-muted)" style="letter-spacing:.08em">AUCTION PRICE</text>`;
  svg += `<text transform="translate(12 ${(H / 2).toFixed(0)}) rotate(-90)" text-anchor="middle"
      fill="var(--ink-muted)" style="letter-spacing:.08em">WAR</text>`;
  svg += '</svg>';
  const rows = [...pts].sort((a, b) => b.cost - a.cost).map(p => `<tr>
      <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep)">${escHtml(p.player)}</td>
      <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);text-align:right;font-variant-numeric:tabular-nums">$${p.cost}</td>
      <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);text-align:right;font-variant-numeric:tabular-nums;
        color:${p.war < 0 ? RC_CLAY : 'var(--ink)'}">${p.war.toFixed(1)}</td>
      <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);color:var(--ink-muted)">${p.kept ? 'kept' : 'auction'}</td>
      <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);text-align:right;color:var(--ink-muted)">${p.days || 0}</td>
    </tr>`).join('');
  return `<div style="overflow-x:auto">${svg}</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;color:var(--ink-muted);font-size:var(--text-xs);
      font-family:var(--font-mono);margin:4px 0 var(--space-sm)">
      <span><span style="display:inline-block;width:9px;height:9px;background:${RC_AMBER};transform:rotate(45deg);vertical-align:middle"></span> kept contract</span>
      <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${RC_GREEN};vertical-align:middle"></span> auction buy</span>
      <span><span style="display:inline-block;width:14px;border-top:1px dashed var(--ink-muted);vertical-align:middle"></span> league break-even ($${dpw}/win)</span>
    </div>
    <details><summary style="cursor:pointer;color:var(--board);font-family:var(--font-stat);font-size:var(--text-sm)">
      Every pick, in dollars</summary>
      <table style="border-collapse:collapse;font-size:var(--text-sm);margin-top:var(--space-xs);width:100%;max-width:560px">
        <tr style="text-align:left;color:var(--ink-muted);font-family:var(--font-mono);font-size:10px">
          <th style="padding:3px 10px">PLAYER</th><th style="padding:3px 10px;text-align:right">PRICE</th>
          <th style="padding:3px 10px;text-align:right">WAR</th><th style="padding:3px 10px">ORIGIN</th>
          <th style="padding:3px 10px;text-align:right">DAYS</th></tr>${rows}
      </table></details>`;
}

function rcBar(label, value, rank, teams, scale, fmt) {
  const pos = value >= 0;
  const frac = Math.max(0, Math.min(1, Math.abs(value) / (scale || 1)));
  const bar = scale === null
    ? ''
    : `<div style="flex:1;min-width:90px;height:8px;background:var(--parchment-deep);border-radius:4px;overflow:hidden">
         <div style="width:${(frac * 100).toFixed(1)}%;height:100%;border-radius:4px;
           background:${pos ? RC_AMBER : RC_CLAY}"></div></div>`;
  return `<div style="display:flex;align-items:center;gap:12px;padding:5px 0;border-bottom:1px solid var(--parchment-deep)">
      <div style="width:132px;font-family:var(--font-mono);font-size:10px;letter-spacing:.07em;color:var(--ink-muted)">${label}</div>
      <div style="width:76px;text-align:right;font-family:var(--font-stat);font-size:var(--text-md);
        color:${pos ? 'var(--ink)' : RC_CLAY};font-variant-numeric:tabular-nums">${fmt(value)}</div>
      ${bar}
      <div style="width:74px;text-align:right;font-family:var(--font-mono);font-size:10px;color:var(--ink-muted)">${rcOrdinal(rank)} of ${teams}</div>
    </div>`;
}

function renderReportCards() {
  const RC = window.ERNIE_REPORT_CARDS;
  const body = document.getElementById('rc-body');
  if (!body || !RC || ACTIVE_LEAGUE !== 'lpt') { if (body) body.innerHTML = ''; return; }
  setIf('rc-subtitle', `${RC.year} Season · ranks, not grades`);
  const all = RC.managers, n = all.length;
  let sel = window.__rcManager;
  if (!all.some(m => m.manager === sel)) sel = all[0].manager;
  const m = all.find(x => x.manager === sel);
  const C = m.components;

  const chips = all.map(x => `<button class="rc-chip" data-m="${escHtml(x.manager)}"
      style="border:1px solid var(--parchment-deep);border-radius:14px;cursor:pointer;padding:4px 12px;
      font-family:var(--font-stat);font-size:var(--text-xs);letter-spacing:.04em;
      background:${x.manager === sel ? 'var(--board)' : 'var(--parchment)'};
      color:${x.manager === sel ? 'var(--board-text)' : 'var(--ink-muted)'}">
      ${escHtml(x.manager)} <span style="opacity:.7">${rcOrdinal(x.final_place)}</span></button>`).join('');

  const maxOf = k => Math.max(...all.map(x => Math.abs(x.components[k] ? x.components[k].value : 0)), 1);
  const w1 = v => v.toFixed(1);
  const bars =
    rcBar('TEAM WAR', C.team_war.value, C.team_war.rank, n, maxOf('team_war'), w1) +
    rcBar('FROM THE DRAFT', C.draft_war.value, C.draft_war.rank, n, maxOf('draft_war'), w1) +
    rcBar('FROM THE WIRE', C.wire_war.value, C.wire_war.rank, n, maxOf('wire_war'), w1) +
    rcBar('TRADE NET', C.trade_net.value, C.trade_net.rank, n, maxOf('trade_net'), v => (v >= 0 ? '+' : '') + v.toFixed(1)) +
    rcBar('2027 CONTRACTS', C.keeper_war.value, C.keeper_war.rank, n, maxOf('keeper_war'), w1) +
    (C.luck ? rcBar('SCHEDULE LUCK', C.luck.value, C.luck.rank, n, maxOf('luck'),
      v => (v >= 0 ? '+' : '') + v.toFixed(1) + ' cats') : '');

  const [cw, cl, ct] = m.cat, [mw, ml, mt] = m.matchup;
  const head = `<div style="display:flex;flex-wrap:wrap;gap:var(--space-lg);align-items:baseline;
      padding-bottom:var(--space-sm);border-bottom:2px solid var(--board)">
      <div><div style="font-family:var(--font-display);font-size:var(--text-xl)">${escHtml(m.manager)}</div>
        <div style="color:var(--ink-muted);font-size:var(--text-sm)">${escHtml(m.team)}</div></div>
      <div style="display:flex;gap:var(--space-lg);flex-wrap:wrap;font-family:var(--font-mono);font-size:var(--text-xs);color:var(--ink-muted)">
        <div>FINISH<div style="font-family:var(--font-stat);font-size:var(--text-lg);color:${m.final_place === 1 ? RC_AMBER : 'var(--ink)'}">${rcOrdinal(m.final_place)}</div></div>
        <div>SEED<div style="font-family:var(--font-stat);font-size:var(--text-lg);color:var(--ink)">${rcOrdinal(m.seed)}</div></div>
        <div>CATEGORIES<div style="font-family:var(--font-stat);font-size:var(--text-lg);color:var(--ink)">${cw}-${cl}-${ct}</div></div>
        <div>PCT<div style="font-family:var(--font-stat);font-size:var(--text-lg);color:var(--ink)">${m.pct.toFixed(3).replace(/^0/, '')}</div></div>
        <div>MATCHUPS<div style="font-family:var(--font-stat);font-size:var(--text-lg);color:var(--ink)">${mw}-${ml}-${mt}</div></div>
        <div>ELO<div style="font-family:var(--font-stat);font-size:var(--text-lg);color:var(--ink)">${m.elo.now || '—'}
          <span style="font-size:var(--text-xs);color:${(m.elo.delta || 0) >= 0 ? RC_GREEN : RC_CLAY}">${(m.elo.delta || 0) >= 0 ? '+' : ''}${m.elo.delta || 0}</span></div></div>
      </div></div>`;

  const wire = `<div><h4 style="font-family:var(--font-display);font-size:var(--text-md);margin-bottom:4px">The Wire</h4>
      <div style="color:var(--ink-muted);font-size:var(--text-sm);margin-bottom:6px">
        ${m.wire.adds} pickups · ${w1(m.wire.war)} WAR</div>
      ${(m.wire.top.length ? m.wire.top : []).map(p => `<div style="display:flex;justify-content:space-between;gap:10px;
        padding:3px 0;border-bottom:1px solid var(--parchment-deep);font-size:var(--text-sm)">
        <span>${escHtml(p.player)} <span style="color:var(--ink-muted);font-size:var(--text-xs)">${p.date ? p.date.slice(5) : ''}${p.faab ? ' · $' + p.faab : ''}</span></span>
        <span style="font-family:var(--font-stat);font-variant-numeric:tabular-nums;color:${p.war < 0 ? RC_CLAY : 'var(--ink)'}">${p.war.toFixed(1)}</span></div>`).join('') ||
        '<div style="color:var(--ink-muted);font-size:var(--text-sm)">No pickups.</div>'}</div>`;

  const trades = `<div><h4 style="font-family:var(--font-display);font-size:var(--text-md);margin-bottom:4px">Trades</h4>
      <div style="color:var(--ink-muted);font-size:var(--text-sm);margin-bottom:6px">
        ${m.trades.length} deal${m.trades.length === 1 ? '' : 's'} · net ${(m.components.trade_net.value >= 0 ? '+' : '')}${w1(m.components.trade_net.value)} WAR after the deal</div>
      ${m.trades.map(t => `<div style="padding:5px 0;border-bottom:1px solid var(--parchment-deep);font-size:var(--text-sm)">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--ink-muted);font-family:var(--font-mono);font-size:10px">
          ${t.date.slice(5)} · with ${escHtml(t.partner)}</span>
          <span style="font-family:var(--font-stat);color:${t.net >= 0 ? RC_GREEN : RC_CLAY}">${t.net >= 0 ? '+' : ''}${t.net.toFixed(1)}</span></div>
        <div style="color:var(--ink)">in: ${t.in.map(p => escHtml(p.player) + ' <span style="color:var(--ink-muted)">' + p.war.toFixed(1) + '</span>').join(', ') || '—'}</div>
        <div style="color:var(--ink-muted)">out: ${t.out.map(p => escHtml(p.player) + ' ' + p.war.toFixed(1)).join(', ') || '—'}</div>
      </div>`).join('') || '<div style="color:var(--ink-muted);font-size:var(--text-sm)">No trades.</div>'}</div>`;

  const kp = m.keepers;
  const keeperRows = kp.held.slice(0, 14).map((r, i) => `<tr style="${i < kp.cap ? '' : 'opacity:.55'}">
      <td style="padding:3px 10px;border-bottom:${i === kp.cap - 1 ? '2px solid var(--board)' : '1px solid var(--parchment-deep)'}">${escHtml(r.player)}
        <span style="color:var(--ink-muted);font-size:10px">${escHtml(r.mlb || '')}</span></td>
      <td style="padding:3px 10px;border-bottom:${i === kp.cap - 1 ? '2px solid var(--board)' : '1px solid var(--parchment-deep)'};text-align:right;font-variant-numeric:tabular-nums">${r.price != null ? '$' + r.price : '—'}</td>
      <td style="padding:3px 10px;border-bottom:${i === kp.cap - 1 ? '2px solid var(--board)' : '1px solid var(--parchment-deep)'};text-align:right;font-variant-numeric:tabular-nums;
        color:${(r.war || 0) < 0 ? RC_CLAY : 'var(--ink)'}">${r.war != null ? r.war.toFixed(1) : '—'}</td>
      <td style="padding:3px 10px;border-bottom:${i === kp.cap - 1 ? '2px solid var(--board)' : '1px solid var(--parchment-deep)'};color:var(--ink-muted);font-size:var(--text-xs)">through ${r.last_year}</td>
    </tr>`).join('');
  const keepers = `<div><h4 style="font-family:var(--font-display);font-size:var(--text-md);margin-bottom:4px">2027 Keeper Outlook</h4>
      <div style="color:var(--ink-muted);font-size:var(--text-sm);margin-bottom:6px">
        ${kp.held.length} eligible contracts at $${kp.held_cost}; he may keep ${kp.cap} — the rule is seven, from draft rounds one through seven.
        Priciest first; WAR is what the player returned <em>for this manager</em> in ${RC.year}, so a midseason pickup or trade piece shows only his time here.</div>
      <table style="border-collapse:collapse;width:100%;max-width:520px;font-size:var(--text-sm)">
        <tr style="text-align:left;color:var(--ink-muted);font-family:var(--font-mono);font-size:10px">
          <th style="padding:3px 10px">PLAYER</th><th style="padding:3px 10px;text-align:right">PRICE</th>
          <th style="padding:3px 10px;text-align:right">${RC.year} WAR</th><th style="padding:3px 10px">TERM</th></tr>
        ${keeperRows || '<tr><td style="padding:6px 10px;color:var(--ink-muted)">No contracts carry past ' + RC.year + '.</td></tr>'}
      </table>
      ${kp.expiring.length ? `<div style="margin-top:var(--space-xs);color:var(--ink-muted);font-size:var(--text-xs)">
        Expiring: ${kp.expiring.slice(0, 8).map(r => escHtml(r.player) + (r.price != null ? ' $' + r.price : '')).join(' · ')}</div>` : ''}</div>`;

  const kindLabel = p => p.kind === 'keep' ? 'kept $' + (p.price != null ? p.price : '?')
    : p.kind === 'draft' ? 'drafted $' + (p.price != null ? p.price : '?')
    : p.kind === 'trade' ? 'trade'
    : p.kind === 'add' ? 'waiver' + (p.price ? ' $' + p.price : '') : '—';
  const ledger = `<table style="border-collapse:collapse;width:100%;font-size:var(--text-sm)">
      <tr style="text-align:left;color:var(--ink-muted);font-family:var(--font-mono);font-size:10px">
        <th style="padding:4px 10px">PLAYER</th><th style="padding:4px 10px;text-align:right">WAR</th>
        <th style="padding:4px 10px;text-align:right">LEAGUE</th><th style="padding:4px 10px">ACQUIRED</th>
        <th style="padding:4px 10px;text-align:right">DAYS</th><th style="padding:4px 10px">HELD</th>
        <th style="padding:4px 10px">CATEGORIES</th></tr>
      ${m.players.map(p => `<tr>
        <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep)">${escHtml(p.player)}</td>
        <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);text-align:right;font-family:var(--font-stat);
          font-variant-numeric:tabular-nums;color:${p.war < 0 ? RC_CLAY : 'var(--ink)'}">${p.war.toFixed(2)}</td>
        <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);text-align:right;color:var(--ink-muted);font-size:var(--text-xs)">#${p.lg_rank}</td>
        <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);color:var(--ink-muted);font-size:var(--text-xs)">${kindLabel(p)}</td>
        <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);text-align:right;color:var(--ink-muted)">${p.days}</td>
        <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);color:var(--ink-muted);font-size:var(--text-xs);white-space:nowrap">${p.from ? p.from.slice(5) + '–' + p.to.slice(5) : ''}</td>
        <td style="padding:3px 10px;border-bottom:1px solid var(--parchment-deep);color:var(--ink-muted);font-size:var(--text-xs)">
          ${p.up.map(u => u[0] + ' +' + u[1].toFixed(1)).join(', ')}${p.down.length ? '<span style="color:' + RC_CLAY + '"> · ' + p.down.map(u => u[0] + ' ' + u[1].toFixed(1)).join(', ') + '</span>' : ''}</td>
      </tr>`).join('')}</table>`;

  const sec = (title, inner, note) => `<div style="margin-top:var(--space-lg)">
      <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:2px">${title}</h3>
      ${note ? `<p style="color:var(--ink-muted);font-size:var(--text-sm);margin-bottom:var(--space-xs)">${note}</p>` : ''}
      ${inner}</div>`;

  body.innerHTML =
    `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:var(--space-md)">${chips}</div>` +
    head +
    sec('The Ledger', bars, `Where ${escHtml(m.manager)} stands among the ${n} managers. WAR is category wins above replacement; each row is his number and his rank, not a grade. Draft, wire and trade value is credited to the stint that earned it.`) +
    sec('Elo Through the Season', rcEloChart(m.manager, RC.year), 'Weekly Elo, 2022-era ratings, K=20.') +
    sec('Draft Price vs. Return', rcDraftScatter(m, RC),
      `$${m.draft.spend} across ${m.draft.picks} picks returned ${w1(m.draft.war)} WAR` +
      (m.draft.per_win ? ` — $${m.draft.per_win} per win against a league average of $${RC.league.dollars_per_win}` : '') +
      '. Points above the dashed line beat the going rate.') +
    sec('Wire &amp; Trades', `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-lg)">${wire}${trades}</div>`,
      'Value is credited to the stint that earned it: a traded player’s later production counts for his new team.') +
    sec('Keepers', keepers) +
    sec('Every Player', `<details><summary style="cursor:pointer;color:var(--board);font-family:var(--font-stat)">
        Show all ${m.players.length} player-stints</summary><div style="overflow-x:auto;margin-top:var(--space-xs)">${ledger}</div></details>`,
      'Every stint on this roster, best to worst.');

  body.querySelectorAll('.rc-chip').forEach(b => b.onclick = () => {
    window.__rcManager = b.dataset.m; renderReportCards();
    document.getElementById('page-report-cards').scrollIntoView({ behavior: 'instant', block: 'start' });
  });
}


/* ── ROUTER ───────────────────────────────────────────────*/

let observer;

function initRouter() {
  const getSections = () => ({
    season:  ACTIVE_LEAGUE === 'lpt'
      ? [["home", "Standings"], ["matchups", "This Week"], ["keepers", "Keepers"], ["odds", "Playoff Odds"], ["wire", "The Wire"]]
      : [["home", "Standings"], ["matchups", "This Week"], ["wire", "The Wire"]],
    archive: [["newsletter", "Newsletters"], ["replay", "Season Replay"], ["draft", "Draft Room"], ["records", "Records & Champions"], ["history", "History"]],
    managers: ACTIVE_LEAGUE === 'lpt'
      ? [["managers", "Careers & Rivalries"], ["report-cards", "2026 Report Card"]]
      : [["managers", "Careers & Rivalries"]],
  });
  const sectionOf = {};
  for (const [sec, pages] of Object.entries(getSections()))
    for (const [pg] of pages) sectionOf[pg] = sec;
  sectionOf["odds"] = "season";

  const secLinks = document.querySelectorAll('#section-nav a[data-section]');
  const subnav = document.getElementById('subnav');

  function navigate(page) {
    if (!sectionOf[page]) page = 'home';
    const sec = sectionOf[page];
    document.querySelectorAll('[id^="page-"]').forEach(el => el.style.display = 'none');
    const target = document.getElementById('page-' + page);
    if (target) target.style.display = 'block';

    secLinks.forEach(a => a.classList.toggle('active', a.dataset.section === sec));
    subnav.innerHTML = getSections()[sec].map(([pg, label]) =>
      `<a data-page="${pg}" style="cursor:pointer;font-family:var(--font-stat);font-size:var(--text-sm);
         letter-spacing:0.06em;color:${pg === page ? 'var(--board-bright,#E8F0D8)' : 'var(--board-dim,#6B8B73)'};
         ${pg === page ? 'border-bottom:2px solid var(--amber);' : ''}padding-bottom:2px">${label}</a>`).join('');
    subnav.querySelectorAll('a[data-page]').forEach(a => a.addEventListener('click', () => {
      window.location.hash = a.dataset.page; navigate(a.dataset.page);
    }));

    if (page === 'newsletter') ensureNewsletters();
    if (page === 'report-cards') ensureReportCards();
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(triggerVisible, 50);
  }

  secLinks.forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const first = getSections()[a.dataset.section][0][0];
    window.location.hash = first;
    navigate(first);
    const nav = document.querySelector('.masthead-nav');
    const burger = document.getElementById('hamburger');
    if (nav) nav.classList.remove('open');
    if (burger) burger.classList.remove('open');
  }));

  window.addEventListener('hashchange', () => navigate(window.location.hash.slice(1) || 'home'));
  navigate(window.location.hash.slice(1) || 'home');
}

/* newsletters.js is lazy-loaded the first time the archive opens */
let _nlLoaded = false;
function ensureNewsletters() {
  if (_nlLoaded) return;
  _nlLoaded = true;
  const league = ACTIVE_LEAGUE;
  const file = league === 'lpt' ? 'newsletters.js' : 'newsletters-' + league + '.js';
  const sc = document.createElement('script');
  sc.src = 'src/data/' + file + '?v=' + encodeURIComponent(D().exported_at || '');
  sc.onload = () => {
    const d = D();
    const payload = window['ERNIE_NEWSLETTERS_' + league.toUpperCase()] || window.ERNIE_NEWSLETTERS;
    if (payload) d.newsletters = payload;
    renderNewsletter(d);
  };
  document.head.appendChild(sc);
}


/* ── SCROLL ANIMATIONS ────────────────────────────────────*/

function initScrollAnimations() {
  observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.animate-in, .stagger').forEach(el => observer.observe(el));
}

function triggerVisible() {
  document.querySelectorAll('.animate-in, .stagger').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('visible');
  });
  // Observe any new elements
  document.querySelectorAll('.animate-in:not(.visible), .stagger:not(.visible)').forEach(el => observer.observe(el));
}


/* ── LEAGUE TOGGLE ────────────────────────────────────────*/

function initLeagueToggle() {
  document.querySelectorAll('.league-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const league = pill.dataset.league;
      if (league === ACTIVE_LEAGUE) return;
      const activate = () => {
        ACTIVE_LEAGUE = league;
        document.querySelectorAll('.league-pill').forEach(p =>
          p.classList.toggle('active', p.dataset.league === league));
        _nlLoaded = false;   // newsletters are per-league; reload lazily
        renderAll();
        // odds chart is LPT-only — hide its subnav entry off-league
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      };
      if (league !== 'lpt' && !window['ERNIE_DATA_' + league.toUpperCase()]) {
        const sc = document.createElement('script');
        sc.src = 'src/data/data-' + league + '.js?v=' + Date.now();
        sc.onload = activate;
        sc.onerror = () => alert('No data exported yet for ' + league);
        document.head.appendChild(sc);
      } else {
        activate();
      }
    });
  });
}


/* ── HAMBURGER MENU ───────────────────────────────────────*/

function initHamburger() {
  const burger = document.getElementById('hamburger');
  const nav = document.querySelector('.masthead-nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    nav.classList.toggle('open');
  });
}


/* ── SPARKLINE BUILDER ────────────────────────────────────*/

function buildSparkline(history, currentRating) {
  if (!history || history.length < 2) return '<div class="elo-sparkline"></div>';

  const W = 100;
  const H = 24;
  const pad = 2;

  const elos = history.map(h => h.elo);
  const min = Math.min(...elos) - 10;
  const max = Math.max(...elos) + 10;
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = pad + (i / (history.length - 1)) * (W - pad * 2);
    const y = H - pad - ((h.elo - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Color based on current rating
  const color = currentRating >= 1500 ? 'var(--board-dim)'
    : currentRating >= 1450 ? 'var(--amber)' : 'var(--clay-light)';

  // Last point for the dot
  const lastX = pad + ((history.length - 1) / (history.length - 1)) * (W - pad * 2);
  const lastY = H - pad - ((currentRating - min) / range) * (H - pad * 2);

  // Area fill (line down to bottom, across, back up)
  const areaPoints = points.join(' ') + ` ${W - pad},${H - pad} ${pad},${H - pad}`;

  return `<svg class="elo-sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <polygon class="spark-area" points="${areaPoints}" fill="${color}" />
    <polyline points="${points.join(' ')}" stroke="${color}" />
    <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" fill="${color}" />
  </svg>`;
}


/* ── HELPERS ──────────────────────────────────────────────*/

function setIf(id, val) {
  const el = document.getElementById(id);
  if (el && val != null) el.textContent = val;
}

function escHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
