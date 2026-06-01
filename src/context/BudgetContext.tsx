/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  AppState, Group, Category, Transaction, Income, BudgetMap, Account, Transfer, Installment, Recurring, SyncConfig, Target
} from '../types';
import { 
  genId, todayMonth, todayStr, prevMonth as calcPrevMonth, nextMonth as calcNextMonth, calculateAgeOfMoney 
} from '../utils/helpers';

interface BudgetContextType {
  state: AppState;
  viewMonth: string;
  setViewMonth: (month: string) => void;
  activeView: 'budget' | 'history' | 'accounts' | 'settings' | 'cicilan';
  setActiveView: (view: 'budget' | 'history' | 'accounts' | 'settings' | 'cicilan') => void;
  filterCatId: string | null;
  setFilterCatId: (id: string | null) => void;
  syncStatus: string;
  setSyncStatus: (status: string) => void;
  
  // RTA & Balance calculations
  getRTA: (month: string) => number;
  totalIncome: (month: string) => number;
  totalAssigned: (month: string) => number;
  getSpent: (catId: string, month: string) => number;
  getAssigned: (catId: string, month: string) => number;
  getAvailable: (catId: string, month: string) => number;
  getAccountBalance: (accountId: string) => number;
  getBudgetAccountsTotal: () => number;
  getNetWorth: () => number;
  getAgeOfMoney: () => number | null;
  activeInstallments: (month: string) => Installment[];
  totalInstallmentObligation: (month: string) => number;
  getPendingRecurring: (month: string) => Recurring[];
  
  // Mutations
  setAssigned: (catId: string, month: string, amount: number) => void;
  autoAssign: (month: string) => void;
  rebalanceAssignments: (month: string) => void;
  resetAssignments: (month: string) => void;
  copyBudgets: (fromMonth: string, toMonth: string) => void;
  
  toggleGroupCollapsed: (groupId: string) => void;
  addCategory: (name: string, emoji: string, groupId: string) => void;
  editCategory: (catId: string, name: string, emoji: string, groupId: string) => void;
  deleteCategory: (catId: string) => void;
  
  addGroup: (name: string) => void;
  editGroup: (groupId: string, name: string) => void;
  deleteGroup: (groupId: string) => void;
  moveGroup: (groupId: string, direction: 'up' | 'down') => void;
  moveCategory: (catId: string, direction: 'up' | 'down') => void;
  
  addAccount: (name: string, type: Account['type'], balance: number) => void;
  editAccount: (accountId: string, name: string, type: Account['type'], startingBalance: number) => void;
  deleteAccount: (accountId: string) => void;
  updateTrackingBalance: (accountId: string, newBalance: number) => void;
  
  addExpense: (amount: number, date: string, catId: string, accountId: string | null, note: string) => void;
  editExpense: (txId: string, amount: number, date: string, catId: string, accountId: string | null, note: string) => void;
  deleteExpense: (txId: string) => void;
  
  addIncome: (amount: number, date: string, accountId: string | null, note: string) => void;
  deleteIncome: (incId: string) => void;
  
  addTransfer: (fromId: string, toId: string, amount: number, date: string, note: string, kind?: string) => void;
  deleteTransfer: (tfId: string) => void;
  
  addInstallment: (name: string, emoji: string, accId: string | null, catId: string | null, total: number, months: number, monthly: number, start: string, note: string) => void;
  editInstallment: (instId: string, name: string, emoji: string, accId: string | null, catId: string | null, total: number, monthly: number, months: number, start: string, note: string) => void;
  deleteInstallment: (instId: string, futureOnly: boolean) => void;
  markInstallmentPaidOff: (instId: string) => void;
  
  addRecurring: (name: string, amount: number, type: 'expense' | 'income', catId: string | null, accountId: string | null, day: number, start: string, end: string | null) => void;
  editRecurring: (recId: string, name: string, amount: number, type: 'expense' | 'income', catId: string | null, accountId: string | null, day: number, start: string, end: string | null) => void;
  toggleRecurringActive: (recId: string) => void;
  deleteRecurring: (recId: string) => void;
  approveRecurring: (recId: string, month: string) => void;
  approveAllPendingRecurring: (month: string) => void;
  
  setCategoryTarget: (catId: string, target: Category['target']) => void;
  
  // Global Persistence & Backup
  clearAllData: () => void;
  importBackup: (backupState: any) => boolean;
  saveSyncConfig: (cfg: SyncConfig) => void;
  getSyncConfig: () => SyncConfig;
}

const STORAGE_KEY = 'amplop_v3_react';
const SYNC_CONFIG_KEY = 'amplop_sync_config_v1';

const DEFAULT_GROUPS: Group[] = [
  { id: 'bills',   name: 'Bills',         collapsed: false, sort: 0 },
  { id: 'food',    name: 'Food & Drink',  collapsed: false, sort: 1 },
  { id: 'fun',     name: 'Fun Money',     collapsed: false, sort: 2 },
  { id: 'savings', name: 'Savings Goals', collapsed: false, sort: 3 },
  { id: 'other',   name: 'Other',         collapsed: false, sort: 4 },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'bank_account', name: 'Bank Account', type: 'checking', onBudget: true,  startingBalance: 0, sort: 0 },
  { id: 'cash',         name: 'Cash',         type: 'cash',     onBudget: true,  startingBalance: 0, sort: 1 },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'rent',      name: 'Rent',           emoji: '', groupId: 'bills',   sort: 0, target: null },
  { id: 'electric',  name: 'Electricity',    emoji: '', groupId: 'bills',   sort: 1, target: null },
  { id: 'internet',  name: 'Internet',       emoji: '', groupId: 'bills',   sort: 2, target: null },
  { id: 'coffee',    name: 'Coffee',         emoji: '', groupId: 'food',    sort: 0, target: { type: 'monthly', amount: 800000 } },
  { id: 'dining',    name: 'Dining Out',     emoji: '', groupId: 'food',    sort: 1, target: { type: 'monthly', amount: 2000000 } },
  { id: 'groceries', name: 'Groceries',      emoji: '', groupId: 'food',    sort: 2, target: { type: 'monthly', amount: 3000000 } },
  { id: 'gaming',    name: 'Gaming',         emoji: '', groupId: 'fun',     sort: 0, target: null },
  { id: 'shopping',  name: 'Shopping',       emoji: '', groupId: 'fun',     sort: 1, target: null },
  { id: 'emergency', name: 'Emergency Fund', emoji: '', groupId: 'savings', sort: 0, target: { type: 'monthly_builder', amount: 500000 } },
  { id: 'transport', name: 'Transport',      emoji: '', groupId: 'other',   sort: 0, target: null },
  { id: 'misc',      name: 'Other',          emoji: '', groupId: 'other',   sort: 1, target: null },
];

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure properties exist due to incremental features
        return {
          groups: parsed.groups || DEFAULT_GROUPS,
          categories: parsed.categories || DEFAULT_CATEGORIES,
          transactions: parsed.transactions || [],
          income: parsed.income || [],
          budgets: parsed.budgets || {},
          accounts: parsed.accounts || DEFAULT_ACCOUNTS,
          transfers: parsed.transfers || [],
          installments: parsed.installments || [],
          recurring: parsed.recurring || []
        };
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return {
      groups: DEFAULT_GROUPS,
      categories: DEFAULT_CATEGORIES,
      transactions: [],
      income: [],
      budgets: {},
      accounts: DEFAULT_ACCOUNTS,
      transfers: [],
      installments: [],
      recurring: []
    };
  });

  const [viewMonth, setViewMonth] = useState<string>(todayMonth);
  const [activeView, setActiveView] = useState<'budget' | 'history' | 'accounts' | 'settings' | 'cicilan'>('budget');
  const [filterCatId, setFilterCatId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('Local only');

  // Trigger save whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Installment helpers
  const _instEndDate = (inst: Installment): string => {
    let [y, mo] = inst.startDate.split('-').map(Number);
    mo += inst.totalMonths - 1;
    while (mo > 12) {
      mo -= 12;
      y++;
    }
    return y + '-' + String(mo).padStart(2, '0');
  };

  const _instIsActive = (inst: Installment, m: string): boolean => {
    const end = _instEndDate(inst);
    return m >= inst.startDate && m <= end;
  };

  const _instIsCompleted = (inst: Installment, m: string): boolean => {
    return m > _instEndDate(inst);
  };

  const _instRemainingMonths = (inst: Installment, m: string): number => {
    const end = _instEndDate(inst);
    if (m > end) return 0;
    if (m < inst.startDate) return inst.totalMonths;
    const [cy, cm] = m.split('-').map(Number);
    const [ey, em] = end.split('-').map(Number);
    return (ey - cy) * 12 + (em - cm) + 1;
  };

  const _instPaidMonths = (inst: Installment, m: string): number => {
    if (m < inst.startDate) return 0;
    const [sy, smo] = inst.startDate.split('-').map(Number);
    const [cy, cm]  = m.split('-').map(Number);
    const total = (cy - sy) * 12 + (cm - smo);
    return Math.min(total, inst.totalMonths);
  };

  const activeInstallments = (month: string) => {
    return state.installments.filter(inst => _instIsActive(inst, month));
  };

  const totalInstallmentObligation = (month: string) => {
    return activeInstallments(month).reduce((s, inst) => s + inst.monthlyPayment, 0);
  };

  // Generate complete installment transactions
  const _generateInstallmentTransactions = (inst: Installment): Transaction[] => {
    const freshTxs: Transaction[] = [];
    const [sy, smo] = inst.startDate.split('-').map(Number);
    for (let i = 0; i < inst.totalMonths; i++) {
      let mm = smo + i, yy = sy;
      while (mm > 12) {
        mm -= 12;
        yy++;
      }
      const txMonth = yy + '-' + String(mm).padStart(2, '0');
      const txDate  = txMonth + '-01';
      freshTxs.push({
        id: 'itx_' + inst.id + '_' + i,
        date: txDate,
        amount: inst.monthlyPayment,
        catId: inst.catId,
        accountId: inst.accountId,
        note: `${inst.name} (cicilan ${i + 1}/${inst.totalMonths})`,
        installmentId: inst.id
      });
    }
    return freshTxs;
  };

  // Balance and RTA Logic
  const getAccountBalance = (accountId: string): number => {
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
  };

  const getBudgetAccountsTotal = () => {
    return state.accounts
      .filter(a => a.onBudget)
      .reduce((s, a) => s + getAccountBalance(a.id), 0);
  };

  const getNetWorth = () => {
    return state.accounts.reduce((s, a) => s + getAccountBalance(a.id), 0);
  };

  const getAgeOfMoney = () => {
    return calculateAgeOfMoney(state.income, state.transactions);
  };

  // Ready To Assign Computations
  // Critical Fix: include positive starting balances of all on-budget accounts into totalIncome calculation!
  const totalIncome = (month: string): number => {
    const inflowSum = state.income
      .filter(i => i.date.substring(0, 7) <= month)
      .reduce((s, i) => s + i.amount, 0);
      
    // Include starting balances of checking, savings, cash, etc. (excluding credit card debt)
    const onBudgetStartingBalances = state.accounts
      .filter(a => a.onBudget && a.type !== 'credit_card')
      .reduce((s, a) => s + (a.startingBalance || 0), 0);
      
    return inflowSum + onBudgetStartingBalances;
  };

  const totalAssigned = (month: string): number => {
    let sum = 0;
    for (const [m, categoryAssignedMap] of Object.entries(state.budgets)) {
      if (m <= month) {
        for (const amt of Object.values(categoryAssignedMap)) {
          sum += (amt || 0);
        }
      }
    }
    return sum;
  };

  const getRTA = (month: string): number => {
    return totalIncome(month) - totalAssigned(month);
  };

  const getSpent = (catId: string, month: string): number => {
    return state.transactions
      .filter(t => t.catId === catId && t.date.substring(0, 7) === month)
      .reduce((s, t) => s + t.amount, 0);
  };

  const getAssigned = (catId: string, month: string): number => {
    return state.budgets[month]?.[catId] || 0;
  };

  const getAvailable = (catId: string, month: string): number => {
    let assigned = 0;
    let spent = 0;
    
    // Find all distinct months where a budget, transaction, or income existed up to "month"
    const monthsSet = new Set<string>();
    state.transactions.forEach(t => monthsSet.add(t.date.substring(0, 7)));
    state.income.forEach(i => monthsSet.add(i.date.substring(0, 7)));
    Object.keys(state.budgets).forEach(m => monthsSet.add(m));
    monthsSet.add(month);
    
    const sortedMonths = Array.from(monthsSet)
      .filter(m => m <= month)
      .sort();
      
    for (const m of sortedMonths) {
      assigned += getAssigned(catId, m);
      spent += getSpent(catId, m);
    }
    
    return assigned - spent;
  };

  // Recurring Scheduled templates
  const _recDateForMonth = (rec: Recurring, m: string) => {
    const [y, mo] = m.split('-').map(Number);
    const day = Math.min(rec.dayOfMonth || 1, 28);
    return `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const _recInRange = (rec: Recurring, m: string) => {
    if (m < rec.startDate.substring(0, 7)) return false;
    if (rec.endDate && m > rec.endDate.substring(0, 7)) return false;
    return true;
  };

  const _recEnteredForMonth = (rec: Recurring, m: string) => {
    if (rec.type === 'income') {
      return state.income.some(i => i.recurringId === rec.id && i.date.substring(0, 7) === m);
    }
    return state.transactions.some(t => t.recurringId === rec.id && t.date.substring(0, 7) === m);
  };

  const getPendingRecurring = (month: string) => {
    const today = todayStr();
    return state.recurring.filter(rec => {
      if (!rec.active) return false;
      if (!_recInRange(rec, month)) return false;
      if (_recEnteredForMonth(rec, month)) return false;
      
      // If viewing current month, only suggest items whose actual dayOfMonth has arrived or passed
      if (month === todayMonth()) {
        const dueDate = _recDateForMonth(rec, month);
        if (dueDate > today) return false;
      }
      return true;
    });
  };

  // State mutations
  const setAssigned = (catId: string, month: string, amount: number) => {
    setState(prev => {
      const freshBudgets = { ...prev.budgets };
      if (!freshBudgets[month]) freshBudgets[month] = {};
      freshBudgets[month] = { ...freshBudgets[month], [catId]: amount };
      return { ...prev, budgets: freshBudgets };
    });
  };

  const autoAssign = (month: string) => {
    let rta = getRTA(month);
    if (rta <= 0) return;

    setState(prev => {
      const pendingByCat: Record<string, number> = {};
      const queue: { cat: Category; needed: number; priority: number; dueDate?: string }[] = [];
      const freshBudgets = { ...prev.budgets };
      if (!freshBudgets[month]) freshBudgets[month] = {};
      const activeBudget = { ...freshBudgets[month] };

      // Helpers within function
      const getCategoryAssigned = (catId: string) => activeBudget[catId] || 0;
      
      const getCategoryAvailable = (catId: string) => {
        let assigned = 0;
        let spent = 0;
        
        const monthsSet = new Set<string>();
        prev.transactions.forEach(t => monthsSet.add(t.date.substring(0, 7)));
        prev.income.forEach(i => monthsSet.add(i.date.substring(0, 7)));
        Object.keys(prev.budgets).forEach(m => monthsSet.add(m));
        monthsSet.add(month);
        
        const sortedMonths = Array.from(monthsSet)
          .filter(m => m <= month)
          .sort();
          
        for (const m of sortedMonths) {
          assigned += m === month ? (activeBudget[catId] || 0) : (prev.budgets[m]?.[catId] || 0);
          spent += prev.transactions
            .filter(t => t.catId === catId && t.date.substring(0, 7) === m)
            .reduce((s, t) => s + t.amount, 0);
        }
        return assigned - spent;
      };

      // Priority 0: Cover overspending first
      prev.categories.forEach(c => {
        const overspent = Math.max(0, -getCategoryAvailable(c.id));
        if (overspent > 0) {
          pendingByCat[c.id] = (pendingByCat[c.id] || 0) + overspent;
          queue.push({ cat: c, needed: overspent, priority: 0 });
        }
      });

      // Priority 1: By Date targets
      prev.categories.filter(c => c.target && c.target.type === 'by_date').forEach(c => {
        if (!c.target) return;
        const avail = getCategoryAvailable(c.id);
        const needed = Math.max(0, c.target.amount - (avail + (pendingByCat[c.id] || 0)));
        if (needed > 0) {
          queue.push({ cat: c, needed, priority: 1, dueDate: c.target.dueDate || '9999-12' });
        }
      });

      // Priority 2: Monthly Targets
      prev.categories.filter(c => c.target && c.target.type === 'monthly').forEach(c => {
        if (!c.target) return;
        const cur = getCategoryAssigned(c.id);
        const needed = Math.max(0, c.target.amount - (cur + (pendingByCat[c.id] || 0)));
        if (needed > 0) {
          queue.push({ cat: c, needed, priority: 2 });
        }
      });

      // Priority 3: Monthly Builders
      prev.categories.filter(c => c.target && c.target.type === 'monthly_builder').forEach(c => {
        if (!c.target) return;
        const cur = getCategoryAssigned(c.id);
        const needed = Math.max(0, c.target.amount - (cur + (pendingByCat[c.id] || 0)));
        if (needed > 0) {
          queue.push({ cat: c, needed, priority: 3 });
        }
      });

      // Sort queue
      queue.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.priority === 1) return (a.dueDate || '').localeCompare(b.dueDate || '');
        return prev.categories.indexOf(a.cat) - prev.categories.indexOf(b.cat);
      });

      // Disburse starting RTA
      for (const item of queue) {
        if (rta <= 0) break;
        const give = Math.min(rta, item.needed);
        const currentAssigned = activeBudget[item.cat.id] || 0;
        activeBudget[item.cat.id] = currentAssigned + give;
        rta -= give;
      }

      // Sweep leftover to leftover_savings if RTA still > 0
      if (rta > 0) {
        let leftSavingsCat = prev.categories.find(c => c.id === 'leftover_savings');
        let newCategories = [...prev.categories];
        let newGroups = [...prev.groups];

        if (!leftSavingsCat) {
          let savingsGroup = prev.groups.find(g => g.id === 'savings');
          if (!savingsGroup) {
            savingsGroup = { id: 'savings', name: 'Savings Goals', collapsed: false, sort: prev.groups.length };
            newGroups.push(savingsGroup);
          }
          const groupCats = prev.categories.filter(c => c.groupId === savingsGroup!.id);
          leftSavingsCat = {
            id: 'leftover_savings',
            name: 'Leftover Savings',
            emoji: '',
            groupId: savingsGroup.id,
            sort: groupCats.length,
            target: null
          };
          newCategories.push(leftSavingsCat);
        }

        const currentAssigned = activeBudget[leftSavingsCat.id] || 0;
        activeBudget[leftSavingsCat.id] = currentAssigned + rta;
        freshBudgets[month] = activeBudget;
        return { ...prev, budgets: freshBudgets, categories: newCategories, groups: newGroups };
      }

      freshBudgets[month] = activeBudget;
      return { ...prev, budgets: freshBudgets };
    });
  };

  const rebalanceAssignments = (month: string) => {
    setState(prev => {
      const activeBudget = { ...prev.budgets[month] };
      const getCategoryAssigned = (catId: string) => activeBudget[catId] || 0;
      
      const getCategoryAvailable = (catId: string) => {
        let assigned = 0;
        let spent = 0;
        const sortedMonths = Object.keys(prev.budgets).filter(m => m <= month).sort();
        for (const m of sortedMonths) {
          assigned += m === month ? (activeBudget[catId] || 0) : (prev.budgets[m]?.[catId] || 0);
          spent += prev.transactions
            .filter(t => t.catId === catId && t.date.substring(0, 7) === m)
            .reduce((s, t) => s + t.amount, 0);
        }
        return assigned - spent;
      };

      const getCategorySurplus = (cat: Category) => {
        const assigned = getCategoryAssigned(cat.id);
        const avail = getCategoryAvailable(cat.id);
        if (assigned <= 0 || avail <= 0) return 0;
        if (!cat.target) return Math.min(assigned, avail);
        if (cat.target.type === 'by_date') return Math.min(assigned, Math.max(0, avail - cat.target.amount));
        return Math.min(assigned, Math.max(0, assigned - cat.target.amount));
      };

      const surplus = prev.categories
        .map(cat => ({ cat, amount: getCategorySurplus(cat) }))
        .filter(x => x.amount > 0);

      const needs: { cat: Category; amount: number; priority: number; dueDate?: string }[] = [];
      prev.categories.forEach(cat => {
        const overspent = Math.max(0, -getCategoryAvailable(cat.id));
        if (overspent > 0) needs.push({ cat, amount: overspent, priority: 0 });
      });
      prev.categories.filter(c => c.target && c.target.type === 'by_date').forEach(cat => {
        if (!cat.target) return;
        const need = Math.max(0, cat.target.amount - getCategoryAvailable(cat.id));
        if (need > 0) needs.push({ cat, amount: need, priority: 1, dueDate: cat.target.dueDate || '9999-12' });
      });
      prev.categories.filter(c => c.target && c.target.type === 'monthly').forEach(cat => {
        if (!cat.target) return;
        const need = Math.max(0, cat.target.amount - getCategoryAssigned(cat.id));
        if (need > 0) needs.push({ cat, amount: need, priority: 2 });
      });
      prev.categories.filter(c => c.target && c.target.type === 'monthly_builder').forEach(cat => {
        if (!cat.target) return;
        const need = Math.max(0, cat.target.amount - getCategoryAssigned(cat.id));
        if (need > 0) needs.push({ cat, amount: need, priority: 3 });
      });

      needs.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.priority === 1) return (a.dueDate || '').localeCompare(b.dueDate || '');
        return prev.categories.indexOf(a.cat) - prev.categories.indexOf(b.cat);
      });

      let fromIdx = 0;
      for (const need of needs) {
        let remaining = need.amount;
        while (remaining > 0 && fromIdx < surplus.length) {
          const src = surplus[fromIdx];
          if (src.cat.id === need.cat.id || src.amount <= 0) {
            fromIdx++;
            continue;
          }
          const give = Math.min(src.amount, remaining);
          activeBudget[src.cat.id] = (activeBudget[src.cat.id] || 0) - give;
          activeBudget[need.cat.id] = (activeBudget[need.cat.id] || 0) + give;
          src.amount -= give;
          remaining -= give;
          if (src.amount <= 0) fromIdx++;
        }
        if (fromIdx >= surplus.length) break;
      }

      return {
        ...prev,
        budgets: { ...prev.budgets, [month]: activeBudget }
      };
    });
  };

  const resetAssignments = (month: string) => {
    setState(prev => ({
      ...prev,
      budgets: { ...prev.budgets, [month]: {} }
    }));
  };

  const copyBudgets = (fromMonth: string, toMonth: string) => {
    setState(prev => {
      const source = prev.budgets[fromMonth] || {};
      return {
        ...prev,
        budgets: { ...prev.budgets, [toMonth]: { ...source } }
      };
    });
  };

  const toggleGroupCollapsed = (groupId: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g)
    }));
  };

  const addCategory = (name: string, emoji: string, groupId: string) => {
    setState(prev => {
      const groupCats = prev.categories.filter(c => c.groupId === groupId);
      const newCat: Category = {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36),
        name,
        emoji: emoji || '',
        groupId,
        sort: groupCats.length,
        target: null
      };
      return {
        ...prev,
        categories: [...prev.categories, newCat]
      };
    });
  };

  const editCategory = (catId: string, name: string, emoji: string, groupId: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? { ...c, name, emoji, groupId } : c)
    }));
  };

  const deleteCategory = (catId: string) => {
    setState(prev => {
      const freshBudgets = { ...prev.budgets };
      for (const m of Object.keys(freshBudgets)) {
        if (freshBudgets[m]) {
          const catMap = { ...freshBudgets[m] };
          delete catMap[catId];
          freshBudgets[m] = catMap;
        }
      }
      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== catId),
        budgets: freshBudgets,
        transactions: prev.transactions.map(t => t.catId === catId ? { ...t, catId: null } : t),
        installments: prev.installments.map(i => i.catId === catId ? { ...i, catId: null } : i),
        recurring: prev.recurring.map(r => r.catId === catId ? { ...r, catId: null } : r)
      };
    });
  };

  const addGroup = (name: string) => {
    setState(prev => {
      const newGroup: Group = {
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36),
        name,
        collapsed: false,
        sort: prev.groups.length
      };
      return {
        ...prev,
        groups: [...prev.groups, newGroup]
      };
    });
  };

  const editGroup = (groupId: string, name: string) => {
    setState(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === groupId ? { ...g, name } : g)
    }));
  };

  const deleteGroup = (groupId: string) => {
    setState(prev => {
      const remaining = prev.groups.filter(g => g.id !== groupId);
      const fallback = remaining.find(g => g.id === 'other') || remaining[0];
      
      return {
        ...prev,
        groups: remaining,
        categories: prev.categories.map(c => {
          if (c.groupId === groupId) {
            return { ...c, groupId: fallback ? fallback.id : 'other' };
          }
          return c;
        })
      };
    });
  };

  const moveGroup = (groupId: string, direction: 'up' | 'down') => {
    setState(prev => {
      // 1. Sort a cloned list of groups by their current sort value
      const groups = prev.groups.map(g => ({ ...g })).sort((a, b) => a.sort - b.sort);
      const index = groups.findIndex(g => g.id === groupId);
      if (index === -1) return prev;
      
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= groups.length) return prev;
      
      // 2. Physically swap items in the cloned array
      const temp = groups[index];
      groups[index] = groups[targetIndex];
      groups[targetIndex] = temp;
      
      // 3. Re-assign sort values based on the new array order
      const sorted = groups.map((g, i) => ({
        ...g,
        sort: i
      }));
      
      return { ...prev, groups: sorted };
    });
  };

  const moveCategory = (catId: string, direction: 'up' | 'down') => {
    setState(prev => {
      const cat = prev.categories.find(c => c.id === catId);
      if (!cat) return prev;
      
      const groupId = cat.groupId;
      // 1. Filter, clone, and sort categories belonging to this group
      const groupCats = prev.categories
        .filter(c => c.groupId === groupId)
        .map(c => ({ ...c }))
        .sort((a, b) => a.sort - b.sort);
      
      const index = groupCats.findIndex(c => c.id === catId);
      if (index === -1) return prev;
      
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= groupCats.length) return prev;
      
      // 2. Physically swap items in the cloned array
      const temp = groupCats[index];
      groupCats[index] = groupCats[targetIndex];
      groupCats[targetIndex] = temp;
      
      // 3. Re-assign sort values based on the new array order
      const updatedGroupCats = groupCats.map((c, i) => ({
        ...c,
        sort: i
      }));
      
      // 4. Update the categories array without altering other groups' categories
      const updatedCategories = prev.categories.map(originalCat => {
        const matchingUpdated = updatedGroupCats.find(u => u.id === originalCat.id);
        return matchingUpdated ? matchingUpdated : originalCat;
      });
      
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };

  // Accounts
  const addAccount = (name: string, type: Account['type'], balance: number) => {
    setState(prev => {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);
      const isBudget = ['checking', 'savings', 'credit_card', 'cash'].includes(type);
      const newAcc: Account = {
        id,
        name,
        type,
        onBudget: isBudget,
        startingBalance: balance,
        sort: prev.accounts.length
      };
      return {
        ...prev,
        accounts: [...prev.accounts, newAcc]
      };
    });
  };

  const editAccount = (accountId: string, name: string, type: Account['type'], startingBalance: number) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(a => a.id === accountId ? {
        ...a,
        name,
        type,
        onBudget: ['checking', 'savings', 'credit_card', 'cash'].includes(type),
        startingBalance
      } : a)
    }));
  };

  const deleteAccount = (accountId: string) => {
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(a => a.id !== accountId),
      transactions: prev.transactions.map(t => t.accountId === accountId ? { ...t, accountId: null } : t),
      income: prev.income.map(i => i.accountId === accountId ? { ...i, accountId: null } : i),
      transfers: prev.transfers.filter(tf => tf.fromAccountId !== accountId && tf.toAccountId !== accountId),
      installments: prev.installments.map(i => i.accountId === accountId ? { ...i, accountId: null } : i),
      recurring: prev.recurring.map(r => r.accountId === accountId ? { ...r, accountId: null } : r)
    }));
  };

  const updateTrackingBalance = (accountId: string, newBalance: number) => {
    const curBal = getAccountBalance(accountId);
    const diff = newBalance - curBal;
    if (diff === 0) return;
    
    if (diff > 0) {
      addIncome(diff, todayStr(), accountId, 'Balance adjustment');
    } else {
      addExpense(Math.abs(diff), todayStr(), '', accountId, 'Balance adjustment');
    }
  };

  // Expenses, Incomes & Transfers
  const addExpense = (amount: number, date: string, catId: string, accountId: string | null, note: string) => {
    setState(prev => {
      const newTx: Transaction = {
        id: 'tx_' + genId(),
        date,
        amount,
        catId: catId || null,
        accountId: accountId || null,
        note
      };
      return {
        ...prev,
        transactions: [...prev.transactions, newTx]
      };
    });
  };

  const editExpense = (txId: string, amount: number, date: string, catId: string, accountId: string | null, note: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === txId ? {
        ...t, date, amount, catId: catId || null, accountId: accountId || null, note
      } : t)
    }));
  };

  const deleteExpense = (txId: string) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== txId)
    }));
  };

  const addIncome = (amount: number, date: string, accountId: string | null, note: string) => {
    setState(prev => {
      const newInc: Income = {
        id: 'inc_' + genId(),
        date,
        amount,
        accountId: accountId || null,
        note
      };
      return {
        ...prev,
        income: [...prev.income, newInc]
      };
    });
  };

  const deleteIncome = (incId: string) => {
    setState(prev => ({
      ...prev,
      income: prev.income.filter(i => i.id !== incId)
    }));
  };

  const addTransfer = (fromAccountId: string, toAccountId: string, amount: number, date: string, note: string, kind?: string) => {
    setState(prev => {
      const newTf: Transfer = {
        id: 'tf_' + genId(),
        date,
        fromAccountId,
        toAccountId,
        amount,
        note,
        kind
      };
      return {
        ...prev,
        transfers: [...prev.transfers, newTf]
      };
    });
  };

  const deleteTransfer = (tfId: string) => {
    setState(prev => ({
      ...prev,
      transfers: prev.transfers.filter(tf => tf.id !== tfId)
    }));
  };

  // Installments
  const addInstallment = (name: string, emoji: string, accId: string | null, catId: string | null, total: number, months: number, monthly: number, start: string, note: string) => {
    setState(prev => {
      const inst: Installment = {
        id: 'inst_' + genId(),
        name,
        emoji: emoji || '',
        accountId: accId,
        catId,
        totalAmount: total,
        monthlyPayment: monthly,
        totalMonths: months,
        startDate: start || todayMonth(),
        note
      };
      const freshTxs = _generateInstallmentTransactions(inst);
      return {
        ...prev,
        installments: [...prev.installments, inst],
        transactions: [...prev.transactions, ...freshTxs]
      };
    });
  };

  const editInstallment = (instId: string, name: string, emoji: string, accId: string | null, catId: string | null, total: number, monthly: number, months: number, start: string, note: string) => {
    setState(prev => {
      const updatedList = prev.installments.map(i => i.id === instId ? {
        ...i, name, emoji: emoji || '', accountId: accId, catId, totalAmount: total, monthlyPayment: monthly, totalMonths: months, startDate: start, note
      } : i);
      
      const targetInst = updatedList.find(i => i.id === instId);
      if (!targetInst) return prev;
      
      const oldInst = prev.installments.find(i => i.id === instId);
      
      // Regenerate future transactions (remove current installments txs, generate fresh ones)
      const currentLocMonth = todayMonth();
      const keptTxList = prev.transactions.filter(t => {
        if (t.installmentId !== instId) return true;
        return t.date.substring(0, 7) <= currentLocMonth;
      });

      // Update past transactions associated with this installment with updated category, account, and label
      const updatedKeptTxList = keptTxList.map(t => {
        if (t.installmentId !== instId) return t;
        
        let newNote = t.note;
        if (oldInst && t.note.includes(oldInst.name)) {
          newNote = t.note.replace(oldInst.name, name);
        } else {
          const match = t.note.match(/cicilan \d+\/\d+/i);
          if (match) {
            newNote = `${name} (${match[0]})`;
          } else {
            newNote = `${name} (cicilan)`;
          }
        }

        return {
          ...t,
          catId: catId || null,
          accountId: accId || null,
          note: newNote
        };
      });
      
      const freshTxs = _generateInstallmentTransactions(targetInst).filter(t => t.date.substring(0, 7) > currentLocMonth);
      
      return {
        ...prev,
        installments: updatedList,
        transactions: [...updatedKeptTxList, ...freshTxs]
      };
    });
  };

  const deleteInstallment = (instId: string, futureOnly: boolean) => {
    setState(prev => {
      const currentLocMonth = todayMonth();
      return {
        ...prev,
        installments: prev.installments.filter(i => i.id !== instId),
        transactions: prev.transactions.filter(t => {
          if (t.installmentId !== instId) return true;
          return futureOnly ? (t.date.substring(0, 7) <= currentLocMonth) : false;
        })
      };
    });
  };

  const markInstallmentPaidOff = (instId: string) => {
    setState(prev => {
      const inst = prev.installments.find(i => i.id === instId);
      if (!inst) return prev;
      const paid = _instPaidMonths(inst, viewMonth);
      if (paid <= 0) return prev;
      
      // Stop upcoming transactions
      return {
        ...prev,
        installments: prev.installments.map(i => i.id === instId ? { ...i, totalMonths: paid } : i),
        transactions: prev.transactions.filter(t => {
          if (t.installmentId !== instId) return true;
          return t.date.substring(0, 7) <= todayMonth();
        })
      };
    });
  };

  // Scheduled / Recurring
  const addRecurring = (name: string, amount: number, type: 'expense' | 'income', catId: string | null, accountId: string | null, day: number, start: string, end: string | null) => {
    setState(prev => {
      const activeAccount = accountId || prev.accounts.find(a => a.onBudget)?.id || null;
      const rec: Recurring = {
        id: 'rec_' + genId(),
        name,
        amount,
        type,
        catId: type === 'income' ? null : catId,
        accountId: activeAccount,
        frequency: 'monthly',
        dayOfMonth: day,
        startDate: start || todayStr(),
        endDate: end || null,
        lastCreated: null,
        active: true
      };
      return {
        ...prev,
        recurring: [...prev.recurring, rec]
      };
    });
  };

  const editRecurring = (recId: string, name: string, amount: number, type: 'expense' | 'income', catId: string | null, accountId: string | null, day: number, start: string, end: string | null) => {
    setState(prev => ({
      ...prev,
      recurring: prev.recurring.map(r => r.id === recId ? {
        ...r, name, amount, type, catId: type === 'income' ? null : catId, accountId, dayOfMonth: day, startDate: start, endDate: end
      } : r)
    }));
  };

  const toggleRecurringActive = (recId: string) => {
    setState(prev => ({
      ...prev,
      recurring: prev.recurring.map(r => r.id === recId ? { ...r, active: !r.active } : r)
    }));
  };

  const deleteRecurring = (recId: string) => {
    setState(prev => ({
      ...prev,
      recurring: prev.recurring.filter(r => r.id !== recId)
    }));
  };

  const approveRecurring = (recId: string, month: string) => {
    const rec = state.recurring.find(r => r.id === recId);
    if (!rec) return;
    if (_recEnteredForMonth(rec, month)) return;
    
    const dateStr = _recDateForMonth(rec, month);
    const activeAccount = rec.accountId || state.accounts.find(a => a.onBudget)?.id || null;
    
    if (rec.type === 'income') {
      const inc: Income = {
        id: 'inc_' + genId(),
        date: dateStr,
        amount: rec.amount,
        accountId: activeAccount,
        note: rec.name,
        recurringId: rec.id
      };
      setState(prev => ({ ...prev, income: [...prev.income, inc] }));
    } else {
      const tx: Transaction = {
        id: 'tx_' + genId(),
        date: dateStr,
        amount: rec.amount,
        catId: rec.catId,
        accountId: activeAccount,
        note: rec.name,
        recurringId: rec.id
      };
      setState(prev => ({ ...prev, transactions: [...prev.transactions, tx] }));
    }
  };

  const approveAllPendingRecurring = (month: string) => {
    const pending = getPendingRecurring(month);
    if (!pending.length) return;
    
    setState(prev => {
      const newTransactions = [...prev.transactions];
      const newIncome = [...prev.income];
      const activeAccount = prev.accounts.find(a => a.onBudget)?.id || null;
      
      pending.forEach(rec => {
        const dateStr = _recDateForMonth(rec, month);
        const resolvedAccount = rec.accountId || activeAccount;
        if (rec.type === 'income') {
          newIncome.push({
            id: 'inc_' + genId(),
            date: dateStr,
            amount: rec.amount,
            accountId: resolvedAccount,
            note: rec.name,
            recurringId: rec.id
          });
        } else {
          newTransactions.push({
            id: 'tx_' + genId(),
            date: dateStr,
            amount: rec.amount,
            catId: rec.catId,
            accountId: resolvedAccount,
            note: rec.name,
            recurringId: rec.id
          });
        }
      });
      return { ...prev, transactions: newTransactions, income: newIncome };
    });
  };

  const setCategoryTarget = (catId: string, target: Category['target']) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? { ...c, target } : c)
    }));
  };

  // Global Persistence & Backup
  const clearAllData = () => {
    setState({
      groups: DEFAULT_GROUPS,
      categories: DEFAULT_CATEGORIES,
      transactions: [],
      income: [],
      budgets: {},
      accounts: DEFAULT_ACCOUNTS,
      transfers: [],
      installments: [],
      recurring: []
    });
    setViewMonth(todayMonth());
  };

  const importBackup = (backupState: any): boolean => {
    try {
      if (backupState && Array.isArray(backupState.categories) && Array.isArray(backupState.transactions)) {
        setState({
          groups: backupState.groups || DEFAULT_GROUPS,
          categories: backupState.categories || DEFAULT_CATEGORIES,
          transactions: backupState.transactions || [],
          income: backupState.income || [],
          budgets: backupState.budgets || {},
          accounts: backupState.accounts || DEFAULT_ACCOUNTS,
          transfers: backupState.transfers || [],
          installments: backupState.installments || [],
          recurring: backupState.recurring || []
        });
        return true;
      }
    } catch (e) {
      console.error('Failed to import backup:', e);
    }
    return false;
  };

  const saveSyncConfig = (cfg: SyncConfig) => {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
  };

  const getSyncConfig = (): SyncConfig => {
    try {
      const raw = localStorage.getItem(SYNC_CONFIG_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { url: '', anonKey: '', syncId: 'default', passphrase: '' };
  };

  return (
    <BudgetContext.Provider value={{
      state,
      viewMonth,
      setViewMonth,
      activeView,
      setActiveView,
      filterCatId,
      setFilterCatId,
      syncStatus,
      setSyncStatus,
      
      getRTA,
      totalIncome,
      totalAssigned,
      getSpent,
      getAssigned,
      getAvailable,
      getAccountBalance,
      getBudgetAccountsTotal,
      getNetWorth,
      getAgeOfMoney,
      activeInstallments,
      totalInstallmentObligation,
      getPendingRecurring,
      
      setAssigned,
      autoAssign,
      rebalanceAssignments,
      resetAssignments,
      copyBudgets,
      
      toggleGroupCollapsed,
      addCategory,
      editCategory,
      deleteCategory,
      
      addGroup,
      editGroup,
      deleteGroup,
      moveGroup,
      moveCategory,
      
      addAccount,
      editAccount,
      deleteAccount,
      updateTrackingBalance,
      
      addExpense,
      editExpense,
      deleteExpense,
      
      addIncome,
      deleteIncome,
      
      addTransfer,
      deleteTransfer,
      
      addInstallment,
      editInstallment,
      deleteInstallment,
      markInstallmentPaidOff,
      
      addRecurring,
      editRecurring,
      toggleRecurringActive,
      deleteRecurring,
      approveRecurring,
      approveAllPendingRecurring,
      
      setCategoryTarget,
      clearAllData,
      importBackup,
      saveSyncConfig,
      getSyncConfig
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
