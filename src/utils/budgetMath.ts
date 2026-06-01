/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Account, AppState, Installment } from '../types';

export function getAccountBalance(state: AppState, accountId: string): number {
  const acc = state.accounts.find(a => a.id === accountId);
  if (!acc) return 0;

  const start = acc.startingBalance || 0;
  const incomeIn = state.income
    .filter(i => i.accountId === accountId)
    .reduce((s, i) => s + i.amount, 0);
  const spent = state.transactions
    .filter(t => t.accountId === accountId)
    .reduce((s, t) => s + t.amount, 0);
  const transferIn = state.transfers
    .filter(tf => tf.toAccountId === accountId)
    .reduce((s, tf) => s + tf.amount, 0);
  const transferOut = state.transfers
    .filter(tf => tf.fromAccountId === accountId)
    .reduce((s, tf) => s + tf.amount, 0);

  if (acc.type === 'credit_card') {
    return start - spent + incomeIn + transferIn - transferOut;
  }

  return start + incomeIn - spent + transferIn - transferOut;
}

export function getBudgetAccountsTotal(state: AppState): number {
  return state.accounts
    .filter(a => a.onBudget)
    .reduce((s, a) => s + getAccountBalance(state, a.id), 0);
}

export function getNetWorth(state: AppState): number {
  return state.accounts.reduce((s, a) => s + getAccountBalance(state, a.id), 0);
}

export function totalIncome(state: AppState, month: string): number {
  const inflowSum = state.income
    .filter(i => i.date.substring(0, 7) <= month)
    .reduce((s, i) => s + i.amount, 0);

  const onBudgetStartingBalances = state.accounts
    .filter(a => a.onBudget && a.type !== 'credit_card')
    .reduce((s, a) => s + (a.startingBalance || 0), 0);

  return inflowSum + onBudgetStartingBalances;
}

export function totalAssigned(state: AppState, month: string): number {
  let sum = 0;
  for (const [m, categoryAssignedMap] of Object.entries(state.budgets)) {
    if (m <= month) {
      for (const amt of Object.values(categoryAssignedMap)) {
        sum += amt || 0;
      }
    }
  }
  return sum;
}

export function getRTA(state: AppState, month: string): number {
  return totalIncome(state, month) - totalAssigned(state, month);
}

export function getSpent(state: AppState, catId: string, month: string): number {
  return state.transactions
    .filter(t => t.catId === catId && t.date.substring(0, 7) === month)
    .reduce((s, t) => s + t.amount, 0);
}

export function getAssigned(state: AppState, catId: string, month: string): number {
  return state.budgets[month]?.[catId] || 0;
}

export function getAvailable(state: AppState, catId: string, month: string): number {
  let assigned = 0;
  let spent = 0;

  const monthsSet = new Set<string>();
  state.transactions.forEach(t => monthsSet.add(t.date.substring(0, 7)));
  state.income.forEach(i => monthsSet.add(i.date.substring(0, 7)));
  Object.keys(state.budgets).forEach(m => monthsSet.add(m));
  monthsSet.add(month);

  const sortedMonths = Array.from(monthsSet)
    .filter(m => m <= month)
    .sort();

  for (const m of sortedMonths) {
    assigned += getAssigned(state, catId, m);
    spent += getSpent(state, catId, m);
  }

  return assigned - spent;
}

export function installmentEndDate(inst: Installment): string {
  let [y, mo] = inst.startDate.split('-').map(Number);
  mo += inst.totalMonths - 1;
  while (mo > 12) {
    mo -= 12;
    y++;
  }
  return y + '-' + String(mo).padStart(2, '0');
}

export function installmentIsActive(inst: Installment, month: string): boolean {
  const end = installmentEndDate(inst);
  return month >= inst.startDate && month <= end;
}

export function activeInstallments(state: AppState, month: string): Installment[] {
  return state.installments.filter(inst => installmentIsActive(inst, month));
}

export function totalInstallmentObligation(state: AppState, month: string): number {
  return activeInstallments(state, month).reduce((s, inst) => s + inst.monthlyPayment, 0);
}

export function accountIsOnBudgetType(type: Account['type']): boolean {
  return ['checking', 'savings', 'credit_card', 'cash'].includes(type);
}
