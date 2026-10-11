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

// Clubs in the game's "My Team" mode (ids match site/teams.js). We fetch their
// current squads. `names` are spellings ESPN might use for the club.
export const CLUBS = [
  { id: 'ars', league: 'eng.1', names: ['Arsenal'] },
  { id: 'che', league: 'eng.1', names: ['Chelsea'] },
  { id: 'liv', league: 'eng.1', names: ['Liverpool'] },
  { id: 'mci', league: 'eng.1', names: ['Manchester City', 'Man City'] },
  { id: 'mun', league: 'eng.1', names: ['Manchester United', 'Man United', 'Man Utd'] },
  { id: 'tot', league: 'eng.1', names: ['Tottenham Hotspur', 'Tottenham', 'Spurs'] },
  { id: 'new', league: 'eng.1', names: ['Newcastle United', 'Newcastle'] },
  { id: 'rma', league: 'esp.1', names: ['Real Madrid'] },
  { id: 'bar', league: 'esp.1', names: ['Barcelona', 'FC Barcelona'] },
  { id: 'atm', league: 'esp.1', names: ['Atlético Madrid', 'Atletico Madrid', 'Atlético de Madrid'] },
  { id: 'bay', league: 'ger.1', names: ['Bayern Munich', 'Bayern München', 'FC Bayern'] },
  { id: 'bvb', league: 'ger.1', names: ['Borussia Dortmund', 'Dortmund'] },
  { id: 'lev', league: 'ger.1', names: ['Bayer Leverkusen', 'Leverkusen', 'Bayer 04 Leverkusen'] },
  { id: 'juv', league: 'ita.1', names: ['Juventus'] },
  { id: 'int', league: 'ita.1', names: ['Internazionale', 'Inter Milan', 'Inter'] },
  { id: 'acm', league: 'ita.1', names: ['AC Milan', 'Milan'] },
  { id: 'nap', league: 'ita.1', names: ['Napoli', 'SSC Napoli'] },
  { id: 'psg', league: 'fra.1', names: ['Paris Saint-Germain', 'Paris Saint Germain', 'PSG'] },
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

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// True when an ESPN team name is one of the club's known spellings.
export const sameClub = (club, name) => club.names.some((n) => norm(n) === norm(name));

export function parseTeams(json) {
  const leagues = json?.sports?.[0]?.leagues ?? [];
  return leagues.flatMap((l) => l.teams ?? []).map((t) => t.team ?? t).filter((t) => t?.id && t.displayName)
    .map((t) => ({ id: String(t.id), name: t.displayName, alt: [t.shortDisplayName, t.name, t.nickname].filter(Boolean) }));
}

const POS = { G: 'GK', D: 'DEF', M: 'MID', F: 'FWD', A: 'FWD', S: 'FWD' };

export function parseRoster(json) {
  // Soccer rosters are usually a flat list; some sports group them as [{ items: [...] }].
  const raw = (json?.athletes ?? []).flatMap((a) => (Array.isArray(a.items) ? a.items : [a]));
  return raw
    .map((a) => {
      const p = a.position ?? {};
      const letter = String(p.abbreviation ?? p.displayName ?? p.name ?? '').trim().charAt(0).toUpperCase();
      const num = Number.parseInt(a.jersey, 10);
      return {
        name: a.displayName ?? a.fullName,
        number: Number.isFinite(num) ? num : null,
        pos: POS[letter] ?? null,
        age: Number.isFinite(a.age) ? a.age : null,
        nation: a.citizenship ?? a.flag?.alt ?? null,
      };
    })
    .filter((p) => p.name);
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

  // Squads, table rows and top scorers for the "My Team" clubs.
  const clubs = {};
  for (const id of [...new Set(CLUBS.map((c) => c.league))]) {
    const teamsJson = await settle(`${id} teams`, getJSON(`${API}/site/v2/sports/soccer/${id}/teams`));
    const teams = teamsJson ? parseTeams(teamsJson) : [];
    const league = leagues.find((l) => l.id === id);
    for (const club of CLUBS.filter((c) => c.league === id)) {
      const team = teams.find((t) => [t.name, ...t.alt].some((n) => sameClub(club, n)));
      const row = league?.table.find((r) => sameClub(club, r.team) || (team && r.team === team.name)) ?? null;
      const teamName = team?.name ?? row?.team;
      const scorers = (league?.scorers ?? []).filter((p) => p.team && (p.team === teamName || sameClub(club, p.team)));
      const rosterJson = team ? await settle(`${club.id} roster`, getJSON(`${API}/site/v2/sports/soccer/${id}/teams/${team.id}/roster`)) : null;
      const roster = rosterJson ? parseRoster(rosterJson) : [];
      if (row || roster.length) clubs[club.id] = { name: teamName, row, scorers, roster };
      console.log(`${team ? '✓' : '!'} ${club.id}: ${team ? team.name : 'no ESPN team match'}, table ${row ? `#${row.pos}` : 'not found'}, ${roster.length} players`);
    }
  }

  news.sort((a, b) => String(b.published).localeCompare(String(a.published)));
  const data = { updated: new Date().toISOString(), season, leagues, clubs, news: news.slice(0, 12) };
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

