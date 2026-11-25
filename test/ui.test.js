'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const UI = require('../assets/data/ui.js');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('zh and en dictionaries have identical key sets', () => {
  const zh = Object.keys(UI.zh).sort();
  const en = Object.keys(UI.en).sort();
  assert.deepEqual(zh, en);
  for (const key of zh) {
    assert.ok(UI.zh[key].length > 0, `empty zh value for ${key}`);
    assert.ok(UI.en[key].length > 0, `empty en value for ${key}`);
  }
});

test('every literal t() key in app.js exists', () => {
  const keys = new Set();
  const re = /\bt\('([^']+)'/g;
  let match;
  while ((match = re.exec(appSource))) {
    const key = match[1];
    // Dynamic prefixes such as "more.feature." are completed at runtime.
    if (key.endsWith('.')) continue;
    keys.add(key);
  }
  for (const key of keys) {
    assert.ok(UI.zh[key], `missing zh key: ${key}`);
    assert.ok(UI.en[key], `missing en key: ${key}`);
  }
});

test('every data-i18n key in index.html exists', () => {
  const re = /data-i18n="([^"]+)"/g;
  let match;
  while ((match = re.exec(htmlSource))) {
    assert.ok(UI.zh[match[1]], `missing zh key: ${match[1]}`);
    assert.ok(UI.en[match[1]], `missing en key: ${match[1]}`);
  }
});

test('every data-i18n title / aria key in index.html exists', () => {
  const re = /data-i18n-(?:title|aria-label)="([^"]+)"/g;
  let match;
  while ((match = re.exec(htmlSource))) {
    assert.ok(UI.zh[match[1]], `missing zh key: ${match[1]}`);
    assert.ok(UI.en[match[1]], `missing en key: ${match[1]}`);
  }
});
