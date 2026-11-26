'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
global.window = {};
require('../assets/data/tempers.js');
const data = global.window.SF_TEMPERS;

test('Temper data contains every current wiki entry', () => {
  assert.equal(data.count, 42);
  assert.equal(data.items.length, 42);
  assert.equal(data.source, 'https://wiki.avakot.org/Tempers');
  assert.ok(data.items.some((item) => item.name === 'Aftershock'));
  assert.ok(data.items.some((item) => item.name === 'Well Woven'));
});

test('Temper entries have unique ids, official Chinese names, and icons', () => {
  const ids = new Set();
  for (const item of data.items) {
    assert.ok(item.id, `missing id for ${item.name}`);
    assert.ok(!ids.has(item.id), `duplicate id ${item.id}`);
    ids.add(item.id);
    assert.ok(item.zh, `missing Chinese name for ${item.name}`);
    assert.ok(item.description, `missing description for ${item.name}`);
    assert.ok(item.origin, `missing origin for ${item.name}`);
    assert.ok(Array.isArray(item.weapons) && item.weapons.length, `missing weapons for ${item.name}`);
    assert.ok(/^(universal|cassid|dendrit|feykin|mendicant|ode)$/.test(item.frame), `bad frame ${item.frame}`);
    assert.ok(fs.existsSync(path.join(root, 'assets/img/tempers/icons', item.icon)), `missing icon ${item.icon}`);
    assert.ok(fs.existsSync(path.join(root, 'assets/img/tempers/frames', item.frame + '.png')), `missing frame ${item.frame}`);
  }
});

test('Temper data keeps only the reference fields requested by the page', () => {
  const aftershock = data.items.find((item) => item.name === 'Aftershock');
  assert.ok(aftershock);
  assert.equal(aftershock.description, 'Grants chance to inflict Arcanic Damage on hit.');
  assert.equal(aftershock.stats, undefined);
  assert.equal(aftershock.weapons[0], 'Bow');
  assert.match(aftershock.weaponTable, /Bow/);
});

test('Temper frames and icon directories ship all assets', () => {
  const icons = fs.readdirSync(path.join(root, 'assets/img/tempers/icons')).filter((name) => name.endsWith('.png'));
  const frames = fs.readdirSync(path.join(root, 'assets/img/tempers/frames')).filter((name) => name.endsWith('.png'));
  const origins = fs.readdirSync(path.join(root, 'assets/img/tempers/origins')).filter((name) => name.endsWith('.png'));
  const arts = fs.readdirSync(path.join(root, 'assets/img/tempers/arts')).filter((name) => name.endsWith('.png'));
  assert.equal(icons.length, 42);
  assert.deepEqual(frames.sort(), ['cassid.png', 'dendrit.png', 'feykin.png', 'mendicant.png', 'ode.png', 'universal.png']);
  assert.deepEqual(origins.sort(), ['cassid.png', 'dendrit.png', 'feykin.png', 'mendicant.png', 'ode.png', 'universal.png']);
  assert.deepEqual(arts.sort(), ['bow.png', 'flyblade.png', 'heavy.png', 'long-blade.png', 'magick.png', 'polearm.png', 'shield.png', 'short-blade.png']);
});
