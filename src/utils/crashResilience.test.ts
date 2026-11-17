import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coerceCountryString,
  isTransientDomMutationError,
  isExternalExtensionOnlyError,
  patchNodeDomMethods,
} from './crashResilience';
import {
  normalizeCountryCode,
  normalizeCountry,
  getLeagueInfo,
  getDynamicLeagueAvgOvr,
  getCountryFlag,
  isCountryModOnly,
} from '../data/gameConstants';
import { getBroadcastingPackage } from '../data/broadcastingPackages';
import { ALL_CLUBS } from '../data/clubsData';

test('HMS-MWI2JDIQ-CMV1: country normalizers and getDynamicLeagueAvgOvr never throw on non-string inputs', () => {
  const hostileInputs: unknown[] = [
    undefined,
    null,
    '',
    '   ',
    101,
    true,
    false,
    {},
    [],
    ALL_CLUBS, // Simulates mistakenly passing clubsDb array as countryOverride!
  ];

  for (const bad of hostileInputs) {
    assert.equal(coerceCountryString(bad, 'GER'), 'GER');
    assert.equal(normalizeCountryCode(bad), 'GER');
    assert.equal(normalizeCountry(bad), 'GER');

    const league = getLeagueInfo(1, bad as any);
    assert.ok(league && typeof league.name === 'string');

    const flag = getCountryFlag(bad);
    assert.equal(typeof flag, 'string');

    assert.equal(typeof isCountryModOnly(bad), 'boolean');

    const pkg = getBroadcastingPackage(bad);
    assert.ok(pkg && typeof pkg.networkName === 'string');
  }

  // Object country payload extraction ({ country: 'ESP' } / { code: 'DEN' })
  assert.equal(normalizeCountryCode({ country: 'españa' }), 'ESP');
  assert.equal(normalizeCountryCode({ code: 'denmark' }), 'DEN');

  // Reproduce exact HMS-MWI2JDIQ-CMV1 SC Magdeburg state with clubsDb passed as 3rd arg or malformed club.country
  const magdeburgState: any = {
    club: {
      id: 101,
      name: 'SC Magdeburg',
      country: { invalidObject: true },
      tier: 1,
      baseOvr: 93,
    },
    worldClubs: {},
  };
  const avg1 = getDynamicLeagueAvgOvr(magdeburgState);
  assert.ok(Number.isFinite(avg1) && avg1 >= 30 && avg1 <= 99);

  // Passing clubsDb array as 3rd argument (countryOverride) must ignore the array and never call .trim() on it
  const avg2 = getDynamicLeagueAvgOvr(
    { club: { id: 101, name: 'SC Magdeburg', country: 'GER', tier: 1, baseOvr: 93 } },
    1,
    ALL_CLUBS as any
  );
  assert.ok(Number.isFinite(avg2) && avg2 >= 70 && avg2 <= 95);

  // Passing null/undefined state or numeric (tier, country) fallback
  assert.ok(Number.isFinite(getDynamicLeagueAvgOvr(null)));
  assert.ok(Number.isFinite(getDynamicLeagueAvgOvr(1 as any, 'ESP' as any)));
});

// Minimal mock DOM tree to verify HMS-MWI3K0O6-PN9D, HMS-MWI3UJTQ-I6KG, and HMS-MWI4GKBT-FL6E
class MockNode {
  nodeName: string;
  parentNode: MockNode | null = null;
  childNodes: MockNode[] = [];

  constructor(nodeName: string = 'DIV') {
    this.nodeName = nodeName;
  }

  contains(target: MockNode | null): boolean {
    let cur: MockNode | null = target;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentNode;
    }
    return false;
  }

  removeChild<T extends Node>(child: T): T {
    const c = child as unknown as MockNode;
    const idx = this.childNodes.indexOf(c);
    if (idx === -1 || c.parentNode !== this) {
      const err = new Error("Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.");
      err.name = 'NotFoundError';
      throw err;
    }
    this.childNodes.splice(idx, 1);
    c.parentNode = null;
    return child;
  }

  insertBefore<T extends Node>(newNode: T, refNode: Node | null): T {
    const n = newNode as unknown as MockNode;
    const r = refNode as unknown as MockNode | null;
    if (n.parentNode) {
      n.parentNode.removeChild(n as unknown as Node);
    }
    if (r === null) {
      this.childNodes.push(n);
      n.parentNode = this;
      return newNode;
    }
    const idx = this.childNodes.indexOf(r);
    if (idx === -1 || r.parentNode !== this) {
      const err = new Error("Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.");
      err.name = 'NotFoundError';
      throw err;
    }
    this.childNodes.splice(idx, 0, n);
    n.parentNode = this;
    return newNode;
  }
}

test('HMS-MWI3K0O6-PN9D, HMS-MWI3UJTQ-I6KG & HMS-MWI4GKBT-FL6E: patched removeChild and insertBefore survive extension & Google Translate mutations', () => {
  patchNodeDomMethods(MockNode.prototype as any);
  // Calling patchNodeDomMethods a second time is idempotent
  patchNodeDomMethods(MockNode.prototype as any);

  const parent = new MockNode('DIV');
  const textNode = new MockNode('#text');
  const fontWrapper = new MockNode('FONT');

  // Simulate Google Translate wrapping `textNode` inside `<font>` under `parent`
  parent.insertBefore(fontWrapper as any, null);
  fontWrapper.insertBefore(textNode as any, null);
  assert.equal(textNode.parentNode, fontWrapper);
  assert.equal(fontWrapper.parentNode, parent);

  // 1. React tries `parent.insertBefore(badgeNode, textNode)` where `textNode.parentNode === fontWrapper !== parent`
  const badgeNode = new MockNode('SPAN');
  assert.doesNotThrow(() => {
    parent.insertBefore(badgeNode as any, textNode as any);
  });
  // `badgeNode` was cleanly inserted right before `fontWrapper`!
  assert.equal(parent.childNodes[0], badgeNode);
  assert.equal(parent.childNodes[1], fontWrapper);

  // 2. React tries `parent.removeChild(textNode)` where `textNode` is inside `fontWrapper`
  assert.doesNotThrow(() => {
    parent.removeChild(textNode as any);
  });
  // Both `textNode` and the now-empty `<font>` wrapper were cleaned up!
  assert.equal(textNode.parentNode, null);
  assert.equal(parent.childNodes.includes(fontWrapper), false);

  // 3. React tries `parent.removeChild` & `parent.insertBefore` with a completely detached node (e.g. removed by extension)
  const detached = new MockNode('I');
  const newItem = new MockNode('DIV');
  assert.doesNotThrow(() => {
    parent.removeChild(detached as any);
    parent.insertBefore(newItem as any, detached as any);
  });
  assert.equal(newItem.parentNode, parent);
});

test('HMS-MWI3UJTQ-I6KG: detects transient DOM NotFoundErrors and extension-wrapped insertBefore crashes', () => {
  const extInsertErr = new Error(
    "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
  );
  extInsertErr.name = 'NotFoundError';
  extInsertErr.stack = `NotFoundError: ${extInsertErr.message}\n    at u.proto.<computed> [as insertBefore] (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/101.js:1:3567)\n    at Cp (https://handballmanagersim.com/assets/index-DqrbCajy.js:48:96112)`;

  assert.equal(isTransientDomMutationError(extInsertErr), true);
  assert.equal(isExternalExtensionOnlyError(extInsertErr), true);

  const realAppBug = new TypeError('Cannot read properties of undefined (reading "ovr")');
  realAppBug.stack = `TypeError: ${realAppBug.message}\n    at Dashboard (http://localhost:3000/src/components/Dashboard.tsx:500:12)`;
  assert.equal(isTransientDomMutationError(realAppBug), false);
  assert.equal(isExternalExtensionOnlyError(realAppBug), false);
});
