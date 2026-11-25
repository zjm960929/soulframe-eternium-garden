'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8');
const pkg = require('../package.json');

const DOUYIN = 'https://www.douyin.com/user/MS4wLjABAAAAFIQ6-Ww8fODvrsOR2oFTtegpwDnpVq_PKHIUbxkvFSE';
const BILIBILI = 'https://space.bilibili.com/16730771';
const GITHUB = 'https://github.com/zjm960929/soulframe-eternium-garden';
const EMAIL = 'mailto:zjm960929@outlook.com';

test('release metadata is present', () => {
  assert.equal(pkg.version, '0.1.3');
  assert.equal(pkg.private, true);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.engines.node, '>=20');
  for (const file of ['.nojekyll', 'CHANGELOG.md', 'LICENSE', 'NOTICE.md', 'README.md', 'README.zh.md']) {
    assert.ok(fs.existsSync(path.join(root, file)), `missing ${file}`);
  }
  assert.ok(fs.statSync(path.join(root, '.nojekyll')).isFile());
  assert.match(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'), /^MIT License/);
});

test('README files are a bilingual pair', () => {
  const en = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const zh = fs.readFileSync(path.join(root, 'README.zh.md'), 'utf8');
  assert.ok(en.startsWith('# Soulframe Eternium Garden'));
  assert.ok(zh.startsWith('# Soulframe 永恒花园'));
  assert.ok(en.includes('English | [中文](README.zh.md)'));
  assert.ok(zh.includes('[English](README.md) | 中文'));
  assert.ok(en.includes('## License'));
  assert.ok(zh.includes('## 许可证'));
});

test('all local index.html asset references exist', () => {
  const refs = [...html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)].map((match) => match[1]);
  assert.ok(refs.length > 0);
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, ref)), `missing local reference ${ref}`);
  }
});

test('ancestor avatars ship both 128 and 256 variants', () => {
  const stems = [
    'garren-rood', 'bromius', 'orengall', 'dale-seer',
    'zenith', 'tuvalkane', 'verminia', 'orlick'
  ];
  for (const stem of stems) {
    for (const size of [128, 256]) {
      const file = path.join(root, 'assets', 'img', 'ancestors', `${stem}-${size}.png`);
      assert.ok(fs.existsSync(file), `missing ${stem}-${size}.png`);
      assert.ok(fs.statSync(file).size > 1000, `suspiciously small ${stem}-${size}.png`);
    }
  }
  const readmeImage = path.join(root, 'assets', 'img', 'readme-home.png');
  assert.ok(fs.existsSync(readmeImage));
  assert.ok(fs.statSync(readmeImage).size > 1000);
});

test('social profile URLs are exact', () => {
  assert.ok(html.includes(`href="${DOUYIN}"`), 'header Douyin URL mismatch');
  assert.ok(html.includes(`href="${BILIBILI}"`), 'header Bilibili URL mismatch');
  assert.ok(html.includes(`href="${GITHUB}"`), 'header GitHub URL mismatch');
  assert.ok(html.includes(`href="${EMAIL}"`), 'header email URL mismatch');
  assert.ok(app.includes(DOUYIN), 'home Douyin URL mismatch');
  assert.ok(app.includes(BILIBILI), 'home Bilibili URL mismatch');
  assert.ok(app.includes(GITHUB), 'home GitHub URL mismatch');
  assert.ok(app.includes(EMAIL), 'home email URL mismatch');
  assert.ok(!app.includes('PKhiUbxkvFSE'), 'home Douyin URL still has the old casing');
});

test('language and theme controls are segmented switches', () => {
  assert.ok(!html.includes('<select'), 'select controls must not remain');
  assert.ok(html.includes('id="language-switch"'), 'missing language switch');
  assert.ok(html.includes('id="theme-switch"'), 'missing theme switch');
  assert.ok(
    html.indexOf('id="language-switch"') < html.indexOf('id="theme-switch"'),
    'language switch must appear before theme switch'
  );
  assert.equal((html.match(/data-lang=/g) || []).length, 2);
  assert.equal((html.match(/data-theme=/g) || []).length, 3);
});

test('layout editor uses drag handles instead of arrow buttons', () => {
  assert.ok(!app.includes('layout-move'), 'arrow buttons must not remain');
  assert.ok(app.includes('module-drag-handle'), 'missing module drag handle');
  assert.ok(app.includes('is-lifted'), 'missing lifted drag state');
  assert.ok(app.includes('animatePositions'), 'missing FLIP helper');
});

test('layout editor exposes per-module width controls', () => {
  assert.ok(app.includes("WORLD_WIDTH_KEY = 'sf-eg-world-layout-widths'"));
  assert.ok(app.includes('layout-width__select'));
  assert.ok(app.includes('layoutWorldGridWidths'));
});

test('README no longer claims the project is unpublished', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(!readme.includes('尚未发布到 GitHub'));
  assert.ok(readme.includes('v0.1.3'));
  assert.ok(readme.includes('NOTICE.md'));
});
