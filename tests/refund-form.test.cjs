// The order page's refund form is rendered only for roles that hold canManagePayments; everyone else gets a plain sentence.
// Same TypeScript-transpiling loader as shared-dashboard.test.cjs. No DB, network or real env.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');

function loadComponent() {
  const filename = path.join(root, 'features/platform/orders/components/PaymentTaskActions.tsx');
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const mocks = {
    react: React,
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@/features/platform/components/rx-ui': { RxButton: (props) => React.createElement('button', props), label: (value) => String(value) },
    '@/components/ui/input': { Input: (props) => React.createElement('input', props) },
    '../actions': { refundPaymentAction: async () => ({}), refundCashPaymentAction: async () => ({}) },
    '@/features/platform/lib/action-result': { unwrapAction: async (value) => value },
  };
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require: (name) => { if (!Object.hasOwn(mocks, name)) throw new Error(`Unmocked dependency: ${name}`); return mocks[name]; }, crypto: globalThis.crypto });
  return module.exports;
}

const order = { id: 'o1', payment: { id: 'p1', status: 'captured', amount: 1499, tenderMethod: 'card', providerName: 'Stripe' } };

test('refund form is absent without canManagePayments and shows the plain sentence', () => {
  const { PaymentTaskActions, REFUND_DENIED_TEXT } = loadComponent();
  assert.equal(REFUND_DENIED_TEXT, 'Your role cannot refund payments. Ask an administrator for the Manage Payments permission.');
  for (const props of [{ order }, { order, canRefund: false }]) {
    const html = renderToStaticMarkup(React.createElement(PaymentTaskActions, props));
    assert.ok(html.includes(REFUND_DENIED_TEXT));
    assert.ok(!html.includes('Issue full refund') && !html.includes('<input') && !html.includes('canManagePayments'));
  }
});

test('refund form is rendered for a role with canManagePayments', () => {
  const { PaymentTaskActions } = loadComponent();
  const html = renderToStaticMarkup(React.createElement(PaymentTaskActions, { order, canRefund: true }));
  assert.ok(html.includes('Issue full refund') && html.includes('Refund reason'));
});
