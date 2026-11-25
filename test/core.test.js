'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../assets/js/core.js');
const data = require('../assets/data/game.js');

function dayOf(year, month, day) {
  return Math.floor(Date.UTC(year, month - 1, day) / core.DAY_MS);
}

test('data pools match the wiki store lists', () => {
  assert.equal(data.zenith.caster.length, 6);
  assert.equal(data.zenith.ranged.length, 4);
  assert.equal(data.zenith.melee.length, 43);
  assert.equal(Object.keys(data.weapons).length, 53);

  const names = data.zenith.caster.concat(data.zenith.ranged, data.zenith.melee);
  assert.equal(new Set(names).size, names.length, 'pool names must be unique');
  for (const name of names) {
    assert.ok(data.weapons[name], `missing weapon record for ${name}`);
  }
});

test('only Nazilk-Urytes-III lacks a localized name and price', () => {
  const missingName = [];
  const missingPrice = [];
  for (const [name, record] of Object.entries(data.weapons)) {
    if (!record.zh) missingName.push(name);
    if (record.price == null) missingPrice.push(name);
  }
  assert.deepEqual(missingName, ['Nazilk-Urytes-III']);
  assert.deepEqual(missingPrice, ['Nazilk-Urytes-III']);
});

test('meeting weights add up to 7.2 (within float32 noise)', () => {
  const total = data.meeting.order.reduce((sum, name) => sum + data.meeting.weights[name], 0);
  assert.ok(Math.abs(total - 7.2) < 1e-6, `weights sum to ${total}`);
});

test('Zenith anchors match the in-game / wiki examples', () => {
  const cases = [
    [[2026, 11, 13], ['Blitzel', 'Stultin', 'Orst-III', "Basker's Wrest"]],
    [[2026, 11, 24], ['Avex', 'Clivers', 'Ilverac', 'Silistavf']],
    [[2026, 11, 25], ['Maestro', 'Rostrum', "Marrow's Bane", 'Gystalt']],
    [[2026, 11, 26], ['Blitzel', 'Wreath', 'Creance', "Basker's Wrest"]],
  ];
  for (const [[y, m, d], expected] of cases) {
    const offers = core.zenithForDay(dayOf(y, m, d));
    assert.deepEqual(offers.map((offer) => offer.name), expected, `${y}-${m}-${d}`);
    assert.deepEqual(offers.map((offer) => offer.slot), ['bow', 'melee', 'melee', 'magick']);
  }
});

test('Zenith does not reset the LCG between pools', () => {
  // A per-pool reset would produce a different list for this anchor.
  const offers = core.zenithForDay(dayOf(2026, 11, 13)).map((offer) => offer.name);
  assert.deepEqual(offers, ['Blitzel', 'Stultin', 'Orst-III', "Basker's Wrest"]);
});

test('Blessed Meeting anchors and the pre-anchor gate', () => {
  assert.equal(core.meetingForDay(dayOf(2026, 7, 22)), null);
  assert.equal(core.meetingForDay(dayOf(2026, 7, 23)), 'Bromius');
  assert.equal(core.meetingForDay(dayOf(2026, 11, 24)), 'Orengall');
  assert.equal(core.meetingForDay(dayOf(2026, 11, 25)), 'Zenith');
  assert.equal(core.meetingForDay(dayOf(2026, 11, 26)), 'Tuvalkane');
  assert.equal(core.meetingForDay(dayOf(2026, 11, 27)), 'Orlick');
  assert.equal(core.anchorDayNum(), dayOf(2026, 7, 23));
});

test('daysUntilMeeting finds the next appearance', () => {
  const from = dayOf(2026, 11, 24);
  assert.equal(core.daysUntilMeeting('Orengall', from, 60), 11);
  assert.equal(core.daysUntilMeeting('Zenith', from, 60), 1);
});

test('clock anchors', () => {
  const cases = [
    [0, 20.47867476940155, 1, 182.6320885474263],
    [1795566320, 23.26554147899151, 2, 808.4584414891815],
    [1795564800, 10.603942036628723, 0, 407.69004957252514],
  ];
  for (const [seconds, hour, phase, remaining] of cases) {
    const clock = core.clockAt(seconds);
    assert.ok(Math.abs(clock.hour - hour) < 1e-9, `hour at ${seconds}`);
    assert.equal(clock.phase, phase, `phase at ${seconds}`);
    assert.ok(Math.abs(clock.remaining - remaining) < 1e-6, `remaining at ${seconds}`);
    assert.ok(clock.progress >= 0 && clock.progress < 1);
  }
});

test('clock cycles through all three phases', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    seen.add(core.clockAt(1795564800 + i * 60).phase);
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2]);
});

test('weather anchors (float32 simplex)', () => {
  const cases = [
    [0, 'light.0'],
    [1000000000, 'light.1'],
    [1700000000, 'moderate.1'],
    [1795564800, 'light.1'],
    [1795566320, 'moderate.0'],
    [1795570000, 'heavy.0'],
    [1800000000, 'light.1'],
    [2000000000, 'clear.0'],
    [4102444800, 'moderate.2'],
  ];
  for (const [seconds, id] of cases) {
    assert.equal(core.weatherAt(seconds), id, `weather at ${seconds}`);
  }
});

test('forecast is contiguous and starts at the current weather', () => {
  const now = 1795566320000;
  const periods = core.forecastAt(now, 5);
  assert.ok(periods.length >= 1 && periods.length <= 6);
  assert.equal(periods[0].id, core.weatherAt(Math.floor(now / 1000)));
  for (let i = 0; i < periods.length; i++) {
    assert.ok(periods[i].end > periods[i].start, `period ${i} has positive length`);
    if (i > 0) assert.equal(periods[i].start, periods[i - 1].end, `period ${i} is contiguous`);
  }
});

test('UTC reset math', () => {
  const midnight = Date.UTC(2026, 10, 25);
  assert.equal(core.dayNum(midnight), dayOf(2026, 11, 25));
  assert.equal(core.msToNextUtcReset(midnight), 86400000);
  assert.equal(core.msToNextUtcReset(midnight + 1000), 86399000);
});
