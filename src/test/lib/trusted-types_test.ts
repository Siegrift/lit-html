/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {unsafeHTML} from '../../directives/unsafe-html';
import {html, render} from '../../lit-html.js';
import {stripExpressionMarkers} from '../test-utils/strip-markers';

const assert = chai.assert;

// NOTE: these tests are executed with loaded polyfill (see trusted-types.html)
// which can change or may have a bug. If the tests stop working, it's likely
// that the tests or polyfill needs to be updated.
//
// If the problem is in the polyfill, please open an issue on
// https://github.com/WICG/trusted-types.
suite('rendering with trusted types enforced', () => {
  let container: HTMLDivElement;
  // tslint:disable-next-line
  let policy: any;

  suiteSetup(() => {
    // create app root in the DOM
    container = document.createElement('div');
    document.body.appendChild(container);

    // tslint:disable-next-line
    policy = (window as any).trustedTypes.createPolicy('test-policy', {
      createHTML: (s: string) => s
    });
  });

  suiteTeardown(() => {
    document.body.removeChild(container);
  });

  test('Trusted types emulation works', () => {
    const el = document.createElement('div');
    assert.equal(el.innerHTML, '');
    el.innerHTML = policy.createHTML('<span>val</span>');
    assert.equal(el.innerHTML, '<span>val</span>');

    assert.throws(() => {
      el.innerHTML = '<span>val</span>';
    });
  });

  suite('throws on untrusted values', () => {
    test('unsafe html', () => {
      const template = html`${unsafeHTML('<b>unsafe bold</b>')}`;
      assert.throws(() => {
        render(template, container);
      });
    });

    test('unsafe attribute', () => {
      const template = html`<iframe srcdoc="<b>unsafe iframe</b>"></iframe>`;
      assert.throws(() => {
        render(template, container);
      });
    });
  });

  suite('runs without error on trusted values', () => {
    test('unsafe html', () => {
      const template =
          html`${unsafeHTML(policy.createHTML('<b>unsafe bold</b>'))}`;
      render(template, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML), '<b>unsafe bold</b>');
    });

    test('unsafe attribute', () => {
      const template =
          html`<iframe srcdoc=${policy.createHTML('<b>safe iframe</b>')}>`;
      render(template, container);
      assert.equal(
          stripExpressionMarkers(container.innerHTML),
          '<iframe srcdoc="<b>safe iframe</b>"></iframe>');
    });
  });
});
