// Run with: node --test scripts/fetch-live.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStandings, parseLeaders, parseNews, parseSeason } from './fetch-live.mjs';

const stat = (name, abbreviation, value) => ({ name, abbreviation, value });
const entry = (team, abbr, rank, pts, gf, ga) => ({
  team: { displayName: team, abbreviation: abbr },
  stats: [
    stat('rank', 'R', rank),
    stat('gamesPlayed', 'GP', 7),
    stat('wins', 'W', 5),
    stat('ties', 'D', 1),
    stat('losses', 'L', 1),
    stat('pointsFor', 'F', gf),
    stat('pointsAgainst', 'A', ga),
    stat('pointDifferential', 'GD', gf - ga),
    stat('points', 'P', pts),
  ],
});

test('parseStandings reads nested ESPN tables and orders by rank', () => {
  const json = {
    children: [
      {
        standings: {
          seasonDisplayName: '2026-27 English Premier League',
          entries: [entry('Chelsea', 'CHE', 2, 15, 12, 5), entry('Arsenal', 'ARS', 1, 16, 14, 4)],
        },
      },
    ],
  };
  const rows = parseStandings(json);
  assert.equal(rows[0].team, 'Arsenal');
  assert.equal(rows[0].pos, 1);
  assert.equal(rows[1].gd, 7);
  assert.equal(rows[1].pts, 15);
  assert.equal(parseSeason(json), '2026-27 English Premier League');
});

test('parseStandings falls back to points order without rank, and skips broken rows', () => {
  const a = entry('A', 'A', undefined, 10, 5, 5);
  const b = entry('B', 'B', undefined, 12, 5, 5);
  a.stats = a.stats.filter((s) => s.name !== 'rank');
  b.stats = b.stats.filter((s) => s.name !== 'rank');
  const rows = parseStandings({ standings: { entries: [a, b, { team: {}, stats: [] }] } });
  assert.deepEqual(rows.map((r) => r.team), ['B', 'A']);
});

test('parseLeaders finds goal and assist leaders', () => {
  const json = {
    stats: [
      { name: 'goalsLeaders', leaders: [{ value: 9, athlete: { displayName: 'Striker', team: { displayName: 'FC' } } }] },
      { name: 'assistsLeaders', leaders: [{ displayValue: '4', athlete: { displayName: 'Playmaker' } }] },
    ],
  };
  const { scorers, assists } = parseLeaders(json);
  assert.deepEqual(scorers, [{ name: 'Striker', team: 'FC', value: 9 }]);
  assert.equal(assists[0].value, 4);
  assert.deepEqual(parseLeaders({}), { scorers: [], assists: [] });
});

test('parseNews keeps headline, league and link', () => {
  const items = parseNews(
    { articles: [{ headline: 'Big win', description: 'd', published: '2026-10-10', links: { web: { href: 'https://x' } } }, {}] },
    'La Liga',
  );
  assert.equal(items.length, 1);
  assert.equal(items[0].league, 'La Liga');
  assert.equal(items[0].url, 'https://x');
});

test('parseTeams and sameClub match ESPN team names to game clubs', async () => {
  const { parseTeams, sameClub, CLUBS } = await import('./fetch-live.mjs');
  const teams = parseTeams({ sports: [{ leagues: [{ teams: [
    { team: { id: 86, displayName: 'Atlético Madrid', shortDisplayName: 'Atlético' } },
    { team: { id: 110, displayName: 'Internazionale', shortDisplayName: 'Inter' } },
  ] }] }] });
  assert.equal(teams.length, 2);
  const atm = CLUBS.find((c) => c.id === 'atm');
  const int = CLUBS.find((c) => c.id === 'int');
  assert.ok(sameClub(atm, 'Atletico Madrid'));
  assert.ok(sameClub(int, teams[1].name));
  assert.ok(!sameClub(int, 'AC Milan'));
});

test('parseRoster reads names, shirt numbers and positions', async () => {
  const { parseRoster } = await import('./fetch-live.mjs');
  const flat = parseRoster({ athletes: [
    { displayName: 'Keeper One', jersey: '1', position: { abbreviation: 'G' }, age: 30 },
    { displayName: 'Mid Two', jersey: '8', position: { displayName: 'Midfielder' }, citizenship: 'Spain' },
    { displayName: 'No Number', position: { abbreviation: 'F' } },
  ] });
  assert.deepEqual(flat.map((p) => [p.number, p.pos]), [[1, 'GK'], [8, 'MID'], [null, 'FWD']]);
  assert.equal(flat[1].nation, 'Spain');
  const grouped = parseRoster({ athletes: [{ items: [{ displayName: 'A', jersey: '9', position: { abbreviation: 'F' } }] }] });
  assert.equal(grouped[0].number, 9);
});
