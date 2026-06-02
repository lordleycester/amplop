/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Account, AppState, Installment } from '../types';
import { installmentIsActive } from './sharedUtils';

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

export function activeInstallments(state: AppState, month: string): Installment[] {
  return state.installments.filter(inst => installmentIsActive(inst, month));
}

export function totalInstallmentObligation(state: AppState, month: string): number {
  return activeInstallments(state, month).reduce((s, inst) => s + inst.monthlyPayment, 0);
}

export function accountIsOnBudgetType(type: Account['type']): boolean {
  return ['checking', 'savings', 'credit_card', 'cash'].includes(type);
}

function getAvailableWithBudget(state: AppState, catId: string, month: string, activeBudget: Record<string, number>): number {
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
    assigned += m === month ? (activeBudget[catId] || 0) : (state.budgets[m]?.[catId] || 0);
    spent += state.transactions
      .filter(t => t.catId === catId && t.date.substring(0, 7) === m)
      .reduce((s, t) => s + t.amount, 0);
  }

  return assigned - spent;
}

function targetSortValue(type: string | undefined): number {
  if (type === 'monthly_builder' || type === 'by_date') return 0;
  if (!type || type === 'none') return 1;
  if (type === 'monthly') return 2;
  return 3;
}

function getReadyToAssignWithBudget(state: AppState, month: string, activeBudget: Record<string, number>): number {
  let assigned = 0;

  for (const [budgetMonth, categoryAssignedMap] of Object.entries(state.budgets)) {
    if (budgetMonth > month) continue;
    const monthBudget = budgetMonth === month ? activeBudget : categoryAssignedMap;
    for (const amount of Object.values(monthBudget)) {
      assigned += amount || 0;
    }
  }

  return totalIncome(state, month) - assigned;
}

export function rebalanceBudgetAssignments(state: AppState, month: string): Record<string, number> {
  const activeBudget = { ...(state.budgets[month] || {}) };

  const getCategoryAssigned = (catId: string) => activeBudget[catId] || 0;
  const getCategoryAvailable = (catId: string) => getAvailableWithBudget(state, catId, month, activeBudget);

  const getCategorySurplus = (catId: string) => {
    const assignedThisMonth = getCategoryAssigned(catId);
    const available = getCategoryAvailable(catId);
    if (assignedThisMonth <= 0 || available <= 0) return 0;
    return Math.min(assignedThisMonth, available);
  };

  const donorQueue = state.categories
    .map((cat, index) => ({
      cat,
      amount: getCategorySurplus(cat.id),
      priority: targetSortValue(cat.target?.type),
      index
    }))
    .filter(item => item.amount > 0)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.index - b.index;
    });

  const needs = state.categories
    .map((cat, index) => ({
      cat,
      amount: Math.max(0, -getCategoryAvailable(cat.id)),
      index
    }))
    .filter(item => item.amount > 0)
    .sort((a, b) => a.index - b.index);

  let readyToAssign = Math.max(0, getReadyToAssignWithBudget(state, month, activeBudget));
  for (const need of needs) {
    if (readyToAssign <= 0) break;
    const moved = Math.min(readyToAssign, need.amount);
    activeBudget[need.cat.id] = (activeBudget[need.cat.id] || 0) + moved;
    need.amount -= moved;
    readyToAssign -= moved;
  }

  let donorIndex = 0;
  for (const need of needs) {
    let remaining = need.amount;
    while (remaining > 0 && donorIndex < donorQueue.length) {
      const donor = donorQueue[donorIndex];
      if (donor.cat.id === need.cat.id || donor.amount <= 0) {
        donorIndex++;
        continue;
      }

      const moved = Math.min(donor.amount, remaining);
      activeBudget[donor.cat.id] = (activeBudget[donor.cat.id] || 0) - moved;
      activeBudget[need.cat.id] = (activeBudget[need.cat.id] || 0) + moved;
      donor.amount -= moved;
      remaining -= moved;

      if (donor.amount <= 0) donorIndex++;
    }

    if (donorIndex >= donorQueue.length) break;
  }

  return activeBudget;
}
