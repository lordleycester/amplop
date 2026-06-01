/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Group {
  id: string;
  name: string;
  collapsed: boolean;
  sort: number;
}

export interface Target {
  type: 'none' | 'monthly' | 'monthly_builder' | 'by_date';
  amount: number;
  dueDate?: string; // Format: 'YYYY-MM'
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  groupId: string;
  sort: number;
  target: Target | null;
}

export interface Transaction {
  id: string;
  date: string; // Format: 'YYYY-MM-DD'
  amount: number;
  catId: string | null;
  accountId: string | null;
  note: string;
  installmentId?: string;
  recurringId?: string;
}

export interface Income {
  id: string;
  date: string; // Format: 'YYYY-MM-DD'
  amount: number;
  accountId: string | null;
  note: string;
  recurringId?: string;
}

// Map from month (e.g. "2026-06") to a map of category ID to assigned amount
export type BudgetMap = Record<string, Record<string, number>>;

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment' | 'retirement' | 'mortgage' | 'other_asset';
  onBudget: boolean;
  startingBalance: number;
  sort: number;
}

export interface Transfer {
  id: string;
  date: string; // Format: 'YYYY-MM-DD'
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  kind?: string; // e.g. "credit_card_payment"
}

export interface Installment {
  id: string;
  name: string;
  emoji: string;
  accountId: string | null;
  catId: string | null;
  totalAmount: number;
  monthlyPayment: number;
  totalMonths: number;
  startDate: string; // Format: 'YYYY-MM'
  note: string;
}

export interface Recurring {
  id: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  catId: string | null;
  accountId: string | null;
  frequency: string; // 'monthly'
  dayOfMonth: number; // 1-28
  startDate: string; // Format: 'YYYY-MM-DD'
  endDate: string | null; // Format: 'YYYY-MM-DD'
  lastCreated: string | null;
  active: boolean;
}

export interface SyncConfig {
  url: string;
  anonKey: string;
  syncId: string;
  passphrase?: string;
}

export interface AppState {
  groups: Group[];
  categories: Category[];
  transactions: Transaction[];
  income: Income[];
  budgets: BudgetMap;
  accounts: Account[];
  transfers: Transfer[];
  installments: Installment[];
  recurring: Recurring[];
}
