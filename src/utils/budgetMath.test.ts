/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { Account, AppState, Category, Group, Installment } from '../types.ts';
import {
  activeInstallments,
  getAvailable,
  getNetWorth,
  getRTA,
  rebalanceBudgetAssignments,
  totalInstallmentObligation
} from './budgetMath.ts';

const month = '2026-06';

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    groups: [group('everyday')],
    categories: [category('groceries', 'everyday')],
    transactions: [],
    income: [],
    budgets: {},
    accounts: [],
    transfers: [],
    installments: [],
    recurring: [],
    ...overrides
  };
}

function group(id: string): Group {
  return { id, name: id, collapsed: false, sort: 0 };
}

function category(id: string, groupId: string): Category {
  return { id, name: id, emoji: '', groupId, sort: 0, target: null };
}

function categoryWithTarget(id: string, groupId: string, target: Category['target']): Category {
  return { ...category(id, groupId), target };
}

function account(id: string, type: Account['type'], startingBalance: number): Account {
  return {
    id,
    name: id,
    type,
    onBudget: ['checking', 'savings', 'credit_card', 'cash'].includes(type),
    startingBalance,
    sort: 0
  };
}

function installment(overrides: Partial<Installment> = {}): Installment {
  return {
    id: 'installment',
    name: 'Laptop',
    emoji: '',
    accountId: 'card',
    catId: 'groceries',
    totalAmount: 6000000,
    monthlyPayment: 1000000,
    totalMonths: 6,
    startDate: month,
    note: '',
    ...overrides
  };
}

test('income increases Ready to Assign', () => {
  const state = makeState({
    income: [{ id: 'income', date: '2026-06-01', amount: 5000000, accountId: 'bank', note: 'Salary' }]
  });

  assert.equal(getRTA(state, month), 5000000);
});

test('new budget account balances increase Ready to Assign', () => {
  const state = makeState({
    accounts: [account('bank', 'checking', 2500000), account('cash', 'cash', 500000)]
  });

  assert.equal(getRTA(state, month), 3000000);
});

test('tracking account balances do not increase Ready to Assign', () => {
  const state = makeState({
    accounts: [account('brokerage', 'investment', 2500000)]
  });

  assert.equal(getRTA(state, month), 0);
});

test('future income is not ready to assign in the current month', () => {
  const state = makeState({
    income: [
      { id: 'current', date: '2026-06-01', amount: 5000000, accountId: 'bank', note: 'Salary' },
      { id: 'future', date: '2026-07-01', amount: 5000000, accountId: 'bank', note: 'Next salary' }
    ]
  });

  assert.equal(getRTA(state, month), 5000000);
});

test('account balance adjustments count as inflow or outflow', () => {
  const state = makeState({
    accounts: [account('bank', 'checking', 1000000)],
    income: [{ id: 'adjustment', date: '2026-06-02', amount: 750000, accountId: 'bank', note: 'Balance adjustment' }]
  });

  assert.equal(getRTA(state, month), 1750000);
});

test('assigning money to a category decreases Ready to Assign', () => {
  const state = makeState({
    accounts: [account('bank', 'checking', 5000000)],
    budgets: { [month]: { groceries: 1250000 } }
  });

  assert.equal(getRTA(state, month), 3750000);
});

test('spending from a category decreases that category available amount', () => {
  const state = makeState({
    budgets: { [month]: { groceries: 1000000 } },
    transactions: [{
      id: 'tx',
      date: '2026-06-12',
      amount: 350000,
      catId: 'groceries',
      accountId: 'bank',
      note: 'Groceries'
    }]
  });

  assert.equal(getAvailable(state, 'groceries', month), 650000);
});

test('category available balance carries forward across months', () => {
  const state = makeState({
    budgets: {
      '2026-05': { groceries: 1000000 },
      [month]: { groceries: 500000 }
    },
    transactions: [{
      id: 'may_tx',
      date: '2026-05-20',
      amount: 250000,
      catId: 'groceries',
      accountId: 'bank',
      note: 'Groceries'
    }]
  });

  assert.equal(getAvailable(state, 'groceries', month), 1250000);
});

test('transfers between accounts do not change total net worth', () => {
  const before = makeState({
    accounts: [account('bank', 'checking', 1000000), account('cash', 'cash', 0)]
  });
  const after = makeState({
    accounts: [account('bank', 'checking', 1000000), account('cash', 'cash', 0)],
    transfers: [{
      id: 'transfer',
      date: '2026-06-10',
      fromAccountId: 'bank',
      toAccountId: 'cash',
      amount: 250000,
      note: 'ATM'
    }]
  });

  assert.equal(getNetWorth(before), 1000000);
  assert.equal(getNetWorth(after), 1000000);
});

test('credit card payments are transfers, not expenses', () => {
  const state = makeState({
    accounts: [account('bank', 'checking', 1000000), account('card', 'credit_card', -300000)],
    transfers: [{
      id: 'payment',
      date: '2026-06-15',
      fromAccountId: 'bank',
      toAccountId: 'card',
      amount: 300000,
      note: 'Credit card payment',
      kind: 'credit_card_payment'
    }],
    transactions: []
  });

  assert.equal(state.transactions.length, 0);
  assert.equal(getNetWorth(state), 700000);
});

test('installments create monthly obligations only for active months', () => {
  const state = makeState({
    installments: [installment()]
  });

  assert.equal(activeInstallments(state, '2026-05').length, 0);
  assert.equal(activeInstallments(state, '2026-06').length, 1);
  assert.equal(totalInstallmentObligation(state, '2026-06'), 1000000);
  assert.equal(activeInstallments(state, '2026-11').length, 1);
  assert.equal(activeInstallments(state, '2026-12').length, 0);
  assert.equal(totalInstallmentObligation(state, '2026-12'), 0);
});

test('unassigned surplus can remain Ready to Assign', () => {
  const state = makeState({
    accounts: [account('bank', 'checking', 5000000)],
    budgets: { [month]: { groceries: 3000000 } }
  });

  assert.equal(getRTA(state, month), 2000000);
});

test('rebalance moves unspent assigned money into an overspent category', () => {
  const state = makeState({
    categories: [
      category('category_a', 'everyday'),
      category('category_b', 'everyday')
    ],
    budgets: {
      [month]: {
        category_a: 2000000,
        category_b: 1000000
      }
    },
    transactions: [
      { id: 'a_spend', date: '2026-06-10', amount: 1000000, catId: 'category_a', accountId: 'bank', note: '' },
      { id: 'b_spend', date: '2026-06-11', amount: 2000000, catId: 'category_b', accountId: 'bank', note: '' }
    ]
  });

  const rebalanced = rebalanceBudgetAssignments(state, month);

  assert.equal(rebalanced.category_a, 1000000);
  assert.equal(rebalanced.category_b, 2000000);
});

test('rebalance uses Ready to Assign before moving money from categories', () => {
  const state = makeState({
    accounts: [account('bank', 'checking', 5000000)],
    categories: [
      category('surplus', 'everyday'),
      category('overspent', 'everyday')
    ],
    budgets: {
      [month]: {
        surplus: 2000000,
        overspent: 1000000
      }
    },
    transactions: [
      { id: 'surplus_spend', date: '2026-06-10', amount: 1000000, catId: 'surplus', accountId: 'bank', note: '' },
      { id: 'overspend', date: '2026-06-11', amount: 2000000, catId: 'overspent', accountId: 'bank', note: '' }
    ]
  });

  const rebalanced = rebalanceBudgetAssignments(state, month);

  assert.equal(rebalanced.surplus, 2000000);
  assert.equal(rebalanced.overspent, 2000000);
});

test('rebalance uses remaining Ready to Assign before borrowing the rest from flexible categories', () => {
  const state = makeState({
    accounts: [account('bank', 'checking', 3500000)],
    categories: [
      categoryWithTarget('builder', 'everyday', { type: 'monthly_builder', amount: 2000000 }),
      category('overspent', 'everyday')
    ],
    budgets: {
      [month]: {
        builder: 2000000,
        overspent: 1000000
      }
    },
    transactions: [
      { id: 'builder_spend', date: '2026-06-10', amount: 1000000, catId: 'builder', accountId: 'bank', note: '' },
      { id: 'overspend', date: '2026-06-11', amount: 2500000, catId: 'overspent', accountId: 'bank', note: '' }
    ]
  });

  const rebalanced = rebalanceBudgetAssignments(state, month);

  assert.equal(rebalanced.builder, 1000000);
  assert.equal(rebalanced.overspent, 2500000);
});

test('rebalance uses monthly builder and by-date categories as donors first', () => {
  const state = makeState({
    categories: [
      category('no_target', 'everyday'),
      categoryWithTarget('builder', 'everyday', { type: 'monthly_builder', amount: 2000000 }),
      categoryWithTarget('by_date', 'everyday', { type: 'by_date', amount: 3000000, dueDate: '2026-12' }),
      category('overspent', 'everyday')
    ],
    budgets: {
      [month]: {
        no_target: 2000000,
        builder: 2000000,
        by_date: 2000000,
        overspent: 1000000
      }
    },
    transactions: [
      { id: 'builder_spend', date: '2026-06-10', amount: 1000000, catId: 'builder', accountId: 'bank', note: '' },
      { id: 'overspend', date: '2026-06-11', amount: 2500000, catId: 'overspent', accountId: 'bank', note: '' }
    ]
  });

  const rebalanced = rebalanceBudgetAssignments(state, month);

  assert.equal(rebalanced.builder, 1000000);
  assert.equal(rebalanced.by_date, 1500000);
  assert.equal(rebalanced.no_target, 2000000);
  assert.equal(rebalanced.overspent, 2500000);
});

test('rebalance only moves money that is still available', () => {
  const state = makeState({
    categories: [
      categoryWithTarget('builder', 'everyday', { type: 'monthly_builder', amount: 2000000 }),
      category('overspent', 'everyday')
    ],
    budgets: {
      [month]: {
        builder: 2000000,
        overspent: 1000000
      }
    },
    transactions: [
      { id: 'builder_spend', date: '2026-06-10', amount: 1800000, catId: 'builder', accountId: 'bank', note: '' },
      { id: 'overspend', date: '2026-06-11', amount: 2000000, catId: 'overspent', accountId: 'bank', note: '' }
    ]
  });

  const rebalanced = rebalanceBudgetAssignments(state, month);

  assert.equal(rebalanced.builder, 1800000);
  assert.equal(rebalanced.overspent, 1200000);
});
