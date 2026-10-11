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
