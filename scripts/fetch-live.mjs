#!/usr/bin/env node
// Fetches this season's league tables, top scorers and headlines for the big
// European competitions from ESPN's public JSON feeds, and writes
// site/data/live.json. The game turns that file into "live" quiz questions.
//
// Runs in GitHub Actions on a schedule (see .github/workflows/deploy.yml).
// Any league that fails to load is skipped; if everything fails, the existing
// file is left untouched so the game keeps working.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LEAGUES = [
  { id: 'eng.1', name: 'Premier League', country: 'England' },
  { id: 'esp.1', name: 'La Liga', country: 'Spain' },
  { id: 'ger.1', name: 'Bundesliga', country: 'Germany' },
  { id: 'ita.1', name: 'Serie A', country: 'Italy' },
  { id: 'fra.1', name: 'Ligue 1', country: 'France' },
  { id: 'uefa.champions', name: 'Champions League', country: 'Europe' },
];

const API = 'https://site.api.espn.com/apis';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../site/data/live.json');

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'ananda-soccer-game (github actions)' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// ESPN stats arrive as [{ name, abbreviation, value }]; index them by both keys.
function statMap(stats = []) {
  const map = {};
  for (const s of stats) {
    const v = Number(s.value);
    if (!Number.isFinite(v)) continue;
    if (s.name) map[s.name] = v;
    if (s.abbreviation) map[s.abbreviation] = v;
  }
  return map;
}

const pick = (...vals) => vals.find((v) => Number.isFinite(v));

export function parseStandings(json) {
  const groups = json?.children?.length ? json.children : [json];
  const entries = groups.flatMap((g) => g?.standings?.entries ?? []);
  const rows = entries
    .map((e) => {
      const s = statMap(e.stats);
      const gf = pick(s.pointsFor, s.F);
      const ga = pick(s.pointsAgainst, s.A);
      return {
        team: e.team?.displayName ?? e.team?.name,
        short: e.team?.abbreviation ?? '',
        played: pick(s.gamesPlayed, s.GP) ?? 0,
        won: pick(s.wins, s.W) ?? 0,
        drawn: pick(s.ties, s.D) ?? 0,
        lost: pick(s.losses, s.L) ?? 0,
        gf: gf ?? 0,
        ga: ga ?? 0,
        gd: pick(s.pointDifferential, s.GD) ?? (gf ?? 0) - (ga ?? 0),
        pts: pick(s.points, s.P),
        rank: pick(s.rank, s.R),
      };
    })
    .filter((r) => r.team && Number.isFinite(r.pts));
  rows.sort((a, b) =>
    a.rank && b.rank ? a.rank - b.rank : b.pts - a.pts || b.gd - a.gd || b.gf - a.gf,
  );
  return rows.map(({ rank, ...r }, i) => ({ pos: i + 1, ...r }));
}

export function parseSeason(json) {
  return json?.children?.[0]?.standings?.seasonDisplayName ?? json?.seasons?.[0]?.displayName ?? null;
}

export function parseLeaders(json) {
  const cats = json?.stats ?? json?.leaders ?? [];
  const find = (re) => cats.find((c) => re.test(`${c.name ?? ''} ${c.displayName ?? ''}`));
  const rows = (cat) =>
    (cat?.leaders ?? [])
      .map((l) => ({
        name: l.athlete?.displayName ?? l.displayName,
        team: l.athlete?.team?.displayName ?? l.team?.displayName ?? '',
        value: Number(l.value ?? parseFloat(l.displayValue)),
      }))
      .filter((r) => r.name && Number.isFinite(r.value))
      .slice(0, 10);
  return { scorers: rows(find(/goal/i)), assists: rows(find(/assist/i)) };
}

export function parseNews(json, league) {
  return (json?.articles ?? [])
    .filter((a) => a.headline)
    .slice(0, 4)
    .map((a) => ({
      headline: a.headline,
      summary: a.description ?? '',
      league,
      published: a.published ?? null,
      url: a.links?.web?.href ?? null,
    }));
}

async function settle(label, promise) {
  try {
    return await promise;
  } catch (err) {
    console.warn(`! ${label}: ${err.message}`);
    return null;
  }
}

async function main() {
  const leagues = [];
  const news = [];
  let season = null;

  for (const lg of LEAGUES) {
    const [standings, stats, articles] = await Promise.all([
      settle(`${lg.name} table`, getJSON(`${API}/v2/sports/soccer/${lg.id}/standings`)),
      settle(`${lg.name} leaders`, getJSON(`${API}/site/v2/sports/soccer/${lg.id}/statistics`)),
      settle(`${lg.name} news`, getJSON(`${API}/site/v2/sports/soccer/${lg.id}/news?limit=6`)),
    ]);
    const table = standings ? parseStandings(standings) : [];
    const { scorers, assists } = stats ? parseLeaders(stats) : { scorers: [], assists: [] };
    season ??= standings ? parseSeason(standings) : null;
    if (articles) news.push(...parseNews(articles, lg.name));
    if (table.length || scorers.length) leagues.push({ ...lg, table, scorers, assists });
    console.log(`✓ ${lg.name}: ${table.length} teams, ${scorers.length} scorers, ${articles?.articles?.length ?? 0} articles`);
  }

  if (!leagues.length) {
    console.warn('No live data loaded; keeping the existing live.json.');
    return;
  }

  news.sort((a, b) => String(b.published).localeCompare(String(a.published)));
  const data = { updated: new Date().toISOString(), season, leagues, news: news.slice(0, 12) };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(data, null, 1));
  console.log(`Wrote ${OUT}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

