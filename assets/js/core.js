/* Soulframe world-state prediction core.
 *
 * Algorithms mirror the Soulframe Wiki's client-reverse-engineered modules:
 *   - clock & weather: MediaWiki:Gadget-MidrathSky.js
 *   - Zenith offers:   Module:ZenithShop
 *   - Blessed Meeting: Module:MeetingRotationV2
 *
 * Everything is a pure function of UTC time; no network access is involved.
 * This file is a classic script (UMD) so index.html works from file:// too.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(root);
  else root.SFCore = factory(root);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  var DAY_MS = 86400000;
  var TWO32 = 4294967296;

  // ES6 Math helpers with small fallbacks so older engines do not crash.
  var f = Math.fround;
  if (!f) {
    var f32 = new Float32Array(1);
    f = function (value) { f32[0] = value; return f32[0]; };
  }
  var trunc = Math.trunc || function (value) {
    return value < 0 ? Math.ceil(value) : Math.floor(value);
  };
  var imul = Math.imul || function (a, b) {
    var aHi = (a >>> 16) & 0xffff, aLo = a & 0xffff;
    var bHi = (b >>> 16) & 0xffff, bLo = b & 0xffff;
    return ((aLo * bLo) + ((((aHi * bLo) + (aLo * bHi)) << 16) >>> 0)) | 0;
  };

  // ---------------------------------------------------------------
  // UTC day helpers
  // ---------------------------------------------------------------

  function dayNum(ms) { return Math.floor(ms / DAY_MS); }
  function dayStartMs(ms) { return dayNum(ms) * DAY_MS; }
  function nextUtcReset(ms) { return (dayNum(ms) + 1) * DAY_MS; }
  function msToNextUtcReset(ms) { return nextUtcReset(ms) - ms; }

  // ---------------------------------------------------------------
  // Midrath clock (build 2026.08.20)
  // ---------------------------------------------------------------

  var CLOCK_EPOCH = 1391990400;          // 2014-02-10T00:00:00Z
  var RATE = f(0.00833);                 // game hours per real second
  var CYCLE = 24 / RATE;                 // ~2881.15 real seconds
  var SHIFT = f(CYCLE / 2);
  var PHASE_STARTS = [6, 14, 22];        // Dawn, Noon, Nightfall: 8 game hours each

  function clockAt(unixSeconds) {
    var turns = (unixSeconds - CLOCK_EPOCH + SHIFT) / CYCLE;
    var hour = (turns - Math.floor(turns)) * 24;
    var phase = hour >= 22 || hour < 6 ? 2 : (hour >= 14 ? 1 : 0);
    var intoPhase = (hour - PHASE_STARTS[phase] + 24) % 24;
    return {
      turns: turns,
      hour: hour,
      phase: phase,
      intoPhase: intoPhase,
      progress: intoPhase / 8,
      remaining: (8 - intoPhase) / RATE
    };
  }

  // ---------------------------------------------------------------
  // Weather: 2D simplex + native preset hash (build 2026-09-24)
  // ---------------------------------------------------------------

  var CYCLE_SECONDS = 2678400;
  var ANGLE_PER_SECOND = 2.345872650530013e-6;
  var NOISE_RADIUS = f(118.41128);
  var KEY_BUCKETS_PER_SECOND = 8.417508417508418e-5;
  var TIER_NAMES = ['clear', 'light', 'moderate', 'heavy'];
  var KEY_COUNTS = [1, 2, 3, 2];
  var MAX_TIME = 4102444800;             // 2100-01-01T00:00:00Z

  var PERM = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
    140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
    247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
    57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
    74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
    60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
    65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
    200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
    52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
    207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
    119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
    218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
    81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
    184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
    222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
  ];

  function perm(i) { return PERM[i & 255]; }

  function gradient(hash, u, v) {
    var h = hash & 63;
    if (h >= 4) {
      var tmp = u; u = v; v = tmp;
    }
    if (h & 1) u = -u;
    v = h & 2 ? f(v * -2) : f(v + v);
    return f(v + u);
  }

  function corner(x, y, hash) {
    var t = f(f(0.5 - f(x * x)) - f(y * y));
    if (t < 0) return 0;
    t = f(t * t);
    return f(gradient(hash, x, y) * f(t * t));
  }

  // The client's nonpositive truncation rule, not Math.floor.
  function nativeFloor(value) {
    return trunc(value) - (value <= 0 ? 1 : 0);
  }

  function simplex(x, y) {
    var F2 = f(0.36602539), G2 = f(0.21132487), G2X2_MINUS_1 = f(0.57735026);
    var s = f(f(x + y) * F2);
    var i = nativeFloor(f(s + x)), j = nativeFloor(f(s + y));
    var t = f(f(i + j) * G2);
    var x0 = f(x - f(i - t)), y0 = f(y - f(j - t));
    var i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    var ii = i & 255, jj = j & 255;
    var n0 = corner(x0, y0, perm(ii + perm(jj)));
    var n1 = corner(f(f(x0 - i1) + G2), f(f(y0 - j1) + G2), perm(ii + i1 + perm(jj + j1)));
    var n2 = corner(f(x0 - G2X2_MINUS_1), f(y0 - G2X2_MINUS_1), perm(ii + 1 + perm(jj + 1)));
    return f(f(f(n1 + n0) + n2) * f(45.230652));
  }

  function noiseValue(unixSeconds) {
    if (!isFinite(unixSeconds) || unixSeconds < 0 || unixSeconds > MAX_TIME) {
      throw new RangeError('Invalid weather time');
    }
    var angle = (unixSeconds % CYCLE_SECONDS) * ANGLE_PER_SECOND;
    var noise = simplex(f(f(Math.cos(angle)) * NOISE_RADIUS), f(f(Math.sin(angle)) * NOISE_RADIUS));
    return f(Math.pow(f(f(f(noise + 1) * 0.5)), 1.25));
  }

  function weatherAt(unixSeconds) {
    var v = noiseValue(unixSeconds);
    var tier = v < 0.25 ? 1 : (v < 0.5 ? 2 : (v < 0.75 ? 3 : 4));
    var h = (trunc(unixSeconds * KEY_BUCKETS_PER_SECOND) >>> 0) ^ imul(tier, 0x9e3779b1);
    h = imul((h >>> 16) ^ h, 0x045d9f3b);
    h = ((h >>> 16) ^ h) >>> 0;
    return TIER_NAMES[tier - 1] + '.' + (h % KEY_COUNTS[tier - 1]);
  }

  // Current period plus `count` upcoming ones, as {id, start, end} in Unix ms.
  // Sampled every second: coarser steps can miss brief threshold crossings.
  function forecastAt(timeMs, count) {
    count = Math.max(0, count | 0);
    var second = Math.floor(timeMs / 1000);
    var id = weatherAt(second);
    var lower = Math.max(0, second - 86400);
    var upper = Math.min(MAX_TIME, second + 86400);
    var start = second;
    while (start > lower && weatherAt(start - 1) === id) start--;

    var periods = [];
    for (var at = second + 1; at <= upper; at++) {
      var next = weatherAt(at);
      if (next === id) continue;
      periods.push({ id: id, start: start * 1000, end: at * 1000 });
      if (periods.length === count + 1) return periods;
      start = at;
      id = next;
    }
    periods.push({ id: id, start: start * 1000, end: upper * 1000 });
    return periods;
  }

  // ---------------------------------------------------------------
  // 64-bit LCG (split into 32-bit halves; no BigInt required)
  // ---------------------------------------------------------------

  var DE_EPOCH = 1074038400;             // 2004-01-14T00:00:00Z
  var MULT_HI = 1481765933, MULT_LO = 1284865837; // 0x5851F42D4C957F2D
  var INC_HI = 335903614, INC_LO = 4150755663;    // 0x14057B7EF767814F

  function mul32(a, b) {
    var aHi = Math.floor(a / 65536), aLo = a % 65536;
    var bHi = Math.floor(b / 65536), bLo = b % 65536;
    var t0 = aLo * bLo;
    var t1 = aHi * bLo + aLo * bHi;
    var t2 = aHi * bHi;
    var lowPart = t0 + (t1 % 65536) * 65536;
    var carry = Math.floor(lowPart / TWO32);
    var lo = lowPart % TWO32;
    var hi = (t2 + Math.floor(t1 / 65536) + carry) % TWO32;
    return [hi, lo];
  }

  function lcgStep(hi, lo) {
    var ll = mul32(lo, MULT_LO);
    var hl = mul32(hi, MULT_LO);
    var lh = mul32(lo, MULT_HI);
    var h = (ll[0] + hl[1] + lh[1]) % TWO32;
    var l = ll[1] + INC_LO;
    if (l >= TWO32) {
      l -= TWO32;
      h += 1;
    }
    return [(h + INC_HI) % TWO32, l];
  }

  function initialState(seed) {
    if (seed === 0) return [0, 1];
    var hi = Math.floor(seed / TWO32);
    var lo = seed - hi * TWO32;
    return [hi, lo];
  }

  function seedState(seed) {
    var state = initialState(seed);
    return lcgStep(state[0], state[1]);
  }

  // ---------------------------------------------------------------
  // Zenith's daily wares (00:00 UTC)
  // ---------------------------------------------------------------

  function zenithForDay(day) {
    var data = (typeof module === 'object' && module.exports)
      ? require('./../data/game.js')
      : root.SFData;
    var pools = {};
    var state = initialState(day * 86400 - DE_EPOCH);
    var order = ['caster', 'ranged', 'melee'];
    for (var oi = 0; oi < order.length; oi++) {
      var slot = order[oi];
      var xs = data.zenith[slot].slice();
      for (var n = xs.length; n >= 2; n--) {
        state = lcgStep(state[0], state[1]);
        var k = (state[0] % 1073741824) % n + 1;
        var tmp = xs[k - 1];
        xs[k - 1] = xs[n - 1];
        xs[n - 1] = tmp;
      }
      pools[slot] = xs;
    }
    return [
      { name: pools.ranged[0], slot: 'bow' },
      { name: pools.melee[0], slot: 'melee' },
      { name: pools.melee[1], slot: 'melee' },
      { name: pools.caster[0], slot: 'magick' }
    ];
  }

  // ---------------------------------------------------------------
  // Blessed Meeting (00:00 UTC, weighted since 2026-07-23)
  // ---------------------------------------------------------------

  function anchorDayNum() {
    return Math.floor(Date.UTC(2026, 6, 23) / DAY_MS);
  }

  function meetingForDay(day) {
    if (day < anchorDayNum()) return null;
    var data = (typeof module === 'object' && module.exports)
      ? require('./../data/game.js')
      : root.SFData;
    var state = seedState(day * 86400 - DE_EPOCH);
    var total = 0;
    var order = data.meeting.order;
    var weights = data.meeting.weights;
    for (var i = 0; i < order.length; i++) total += weights[order[i]];
    var roll = ((state[0] % 1073741824) / 1073741824) * total;
    for (var j = 0; j < order.length; j++) {
      var w = weights[order[j]];
      if (roll < w) return order[j];
      roll -= w;
    }
    return order[order.length - 1];
  }

  function daysUntilMeeting(character, fromDay, maxDays) {
    var limit = maxDays || 60;
    for (var delta = 1; delta <= limit; delta++) {
      if (meetingForDay(fromDay + delta) === character) return delta;
    }
    return null;
  }

  return {
    DAY_MS: DAY_MS,
    dayNum: dayNum,
    dayStartMs: dayStartMs,
    nextUtcReset: nextUtcReset,
    msToNextUtcReset: msToNextUtcReset,
    clockAt: clockAt,
    weatherAt: weatherAt,
    noiseValue: noiseValue,
    forecastAt: forecastAt,
    zenithForDay: zenithForDay,
    meetingForDay: meetingForDay,
    daysUntilMeeting: daysUntilMeeting,
    anchorDayNum: anchorDayNum,
    MAX_TIME: MAX_TIME
  };
}));
