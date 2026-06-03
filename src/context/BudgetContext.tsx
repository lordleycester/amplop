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
import {
  accountIsOnBudgetType,
  activeInstallments as calculateActiveInstallments,
  getAccountBalance as calculateAccountBalance,
  getAssigned as calculateAssigned,
  getAvailable as calculateAvailable,
  getBudgetAccountsTotal as calculateBudgetAccountsTotal,
  getNetWorth as calculateNetWorth,
  getRTA as calculateRTA,
  getSpent as calculateSpent,
  rebalanceBudgetAssignments,
  totalAssigned as calculateTotalAssigned,
  totalIncome as calculateTotalIncome,
  totalInstallmentObligation as calculateTotalInstallmentObligation
} from '../utils/budgetMath';
import { FALLBACK_GROUP_COLORS, getGroupColor, installmentPaidMonths } from '../utils/sharedUtils';
import { clearPersistedState, loadPersistedState, savePersistedState } from '../storage/budgetStorage';

interface BudgetContextType {
  state: AppState;
  hasExistingData: boolean;
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
  
  addExpense: (amount: number, date: string, catId: string, accountId: string | null, note: string, recurringId?: string) => void;
  editExpense: (txId: string, amount: number, date: string, catId: string, accountId: string | null, note: string) => void;
  deleteExpense: (txId: string) => void;
  
  addIncome: (amount: number, date: string, accountId: string | null, note: string, recurringId?: string) => void;
  editIncome: (incId: string, amount: number, date: string, accountId: string | null, note: string) => void;
  deleteIncome: (incId: string) => void;
  
  addTransfer: (fromId: string, toId: string, amount: number, date: string, note: string, kind?: string) => void;
  editTransfer: (tfId: string, fromId: string, toId: string, amount: number, date: string, note: string) => void;
  deleteTransfer: (tfId: string) => void;
  
  addInstallment: (name: string, emoji: string, accId: string | null, catId: string | null, total: number, months: number, monthly: number, start: string, note: string) => void;
  editInstallment: (instId: string, name: string, emoji: string, accId: string | null, catId: string | null, total: number, monthly: number, months: number, start: string, note: string) => void;
  deleteInstallment: (instId: string, futureOnly: boolean) => void;
  markInstallmentPaidOff: (instId: string) => void;
  
  addRecurring: (name: string, amount: number, type: 'expense' | 'income', catId: string | null, accountId: string | null, day: number, start: string, end: string | null) => string;
  editRecurring: (recId: string, name: string, amount: number, type: 'expense' | 'income', catId: string | null, accountId: string | null, day: number, start: string, end: string | null) => void;
  toggleRecurringActive: (recId: string) => void;
  deleteRecurring: (recId: string) => void;
  approveRecurring: (recId: string, month: string) => void;
  approveAllPendingRecurring: (month: string) => void;
  
  setCategoryTarget: (catId: string, target: Category['target']) => void;
  applyStarterCategories: (items: { name: string; groupId: string }[]) => void;
  
  // Global Persistence & Backup
  clearAllData: () => void;
  importBackup: (backupState: any) => boolean;
  saveSyncConfig: (cfg: SyncConfig) => void;
  getSyncConfig: () => SyncConfig;
}

const SYNC_CONFIG_KEY = 'amplop_sync_config_v1';

const DEFAULT_GROUPS: Group[] = [
  { id: 'needs',         name: 'Needs',         collapsed: false, sort: 0 },
  { id: 'wants',         name: 'Wants',         collapsed: false, sort: 1 },
  { id: 'subscriptions', name: 'Subscriptions', collapsed: false, sort: 2 },
  { id: 'debt',          name: 'Debt',          collapsed: false, sort: 3 },
  { id: 'savings',       name: 'Savings Goals', collapsed: false, sort: 4 },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'bank_account', name: 'Bank Account', type: 'checking', onBudget: true,  startingBalance: 0, sort: 0 },
  { id: 'cash',         name: 'Cash',         type: 'cash',     onBudget: true,  startingBalance: 0, sort: 1 },
];

const DEFAULT_CATEGORIES: Category[] = [];

const createDefaultState = (): AppState => ({
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

const normalizeState = (rawState: Partial<AppState> | null | undefined): AppState => ({
  groups: rawState?.groups || DEFAULT_GROUPS,
  categories: rawState?.categories || DEFAULT_CATEGORIES,
  transactions: rawState?.transactions || [],
  income: rawState?.income || [],
  budgets: rawState?.budgets || {},
  accounts: rawState?.accounts || DEFAULT_ACCOUNTS,
  transfers: rawState?.transfers || [],
  installments: rawState?.installments || [],
  recurring: rawState?.recurring || []
});

const hasBudgetAssignments = (budgets: BudgetMap): boolean => {
  return Object.values(budgets).some(categoryMap => {
    return Object.values(categoryMap).some(amount => Boolean(amount));
  });
};

const matchesDefaultSetup = (state: AppState): boolean => {
  return (
    JSON.stringify(state.groups) === JSON.stringify(DEFAULT_GROUPS) &&
    JSON.stringify(state.categories) === JSON.stringify(DEFAULT_CATEGORIES) &&
    JSON.stringify(state.accounts) === JSON.stringify(DEFAULT_ACCOUNTS)
  );
};

const hasMeaningfulUserData = (state: AppState): boolean => {
  return (
    state.transactions.length > 0 ||
    state.income.length > 0 ||
    hasBudgetAssignments(state.budgets) ||
    state.transfers.length > 0 ||
    state.installments.length > 0 ||
    state.recurring.length > 0 ||
    !matchesDefaultSetup(state)
  );
};

const slugifyCategoryName = (name: string): string => {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return cleaned || 'category';
};

const createGroupIdWithUniqueColor = (name: string, existingGroups: Group[]): string => {
  const base = slugifyCategoryName(name);
  const seed = Date.now().toString(36);
  const usedColors = new Set(existingGroups.map(group => getGroupColor(group.id)));

  for (let attempt = 0; attempt < FALLBACK_GROUP_COLORS.length * 3; attempt++) {
    const candidate = attempt === 0 ? `${base}_${seed}` : `${base}_${seed}_${attempt}`;
    if (!usedColors.has(getGroupColor(candidate))) return candidate;
  }

  return `${base}_${seed}`;
};

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => createDefaultState());
  const [storageReady, setStorageReady] = useState(false);

  const [viewMonth, setViewMonth] = useState<string>(todayMonth);
  const [activeView, setActiveView] = useState<'budget' | 'history' | 'accounts' | 'settings' | 'cicilan'>('budget');
  const [filterCatId, setFilterCatId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('Local only');

  useEffect(() => {
    let cancelled = false;

    const loadState = async () => {
      const persistedState = await loadPersistedState();
      if (cancelled) return;

      if (persistedState) {
        setState(normalizeState(persistedState));
      }
      setStorageReady(true);
    };

    loadState();

    return () => {
      cancelled = true;
    };
  }, []);

  // Trigger save whenever state changes after IndexedDB/localStorage migration finishes.
  useEffect(() => {
    if (!storageReady) return;
    savePersistedState(state);
  }, [state, storageReady]);

  const activeInstallments = (month: string) => {
    return calculateActiveInstallments(state, month);
  };

  const totalInstallmentObligation = (month: string) => {
    return calculateTotalInstallmentObligation(state, month);
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
    return calculateAccountBalance(state, accountId);
  };

  const getBudgetAccountsTotal = () => {
    return calculateBudgetAccountsTotal(state);
  };

  const getNetWorth = () => {
    return calculateNetWorth(state);
  };

  const getAgeOfMoney = () => {
    return calculateAgeOfMoney(state.income, state.transactions);
  };

  // Ready To Assign Computations
  // Critical Fix: include positive starting balances of all on-budget accounts into totalIncome calculation!
  const totalIncome = (month: string): number => {
    return calculateTotalIncome(state, month);
  };

  const totalAssigned = (month: string): number => {
    return calculateTotalAssigned(state, month);
  };

  const getRTA = (month: string): number => {
    return calculateRTA(state, month);
  };

  const getSpent = (catId: string, month: string): number => {
    return calculateSpent(state, catId, month);
  };

  const getAssigned = (catId: string, month: string): number => {
    return calculateAssigned(state, catId, month);
  };

  const getAvailable = (catId: string, month: string): number => {
    return calculateAvailable(state, catId, month);
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
    setState(prev => {
      let rta = calculateRTA(prev, month);
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

      freshBudgets[month] = activeBudget;
      const autoAssignedState = { ...prev, budgets: freshBudgets };
      return {
        ...autoAssignedState,
        budgets: {
          ...autoAssignedState.budgets,
          [month]: rebalanceBudgetAssignments(autoAssignedState, month)
        }
      };
    });
  };

  const rebalanceAssignments = (month: string) => {
    setState(prev => {
      return {
        ...prev,
        budgets: { ...prev.budgets, [month]: rebalanceBudgetAssignments(prev, month) }
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
        id: createGroupIdWithUniqueColor(name, prev.groups),
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
      const isBudget = accountIsOnBudgetType(type);
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
        onBudget: accountIsOnBudgetType(type),
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
  const addExpense = (amount: number, date: string, catId: string, accountId: string | null, note: string, recurringId?: string) => {
    setState(prev => {
      const newTx: Transaction = {
        id: 'tx_' + genId(),
        date,
        amount,
        catId: catId || null,
        accountId: accountId || null,
        note,
        recurringId
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

  const addIncome = (amount: number, date: string, accountId: string | null, note: string, recurringId?: string) => {
    setState(prev => {
      const newInc: Income = {
        id: 'inc_' + genId(),
        date,
        amount,
        accountId: accountId || null,
        note,
        recurringId
      };
      return {
        ...prev,
        income: [...prev.income, newInc]
      };
    });
  };

  const editIncome = (incId: string, amount: number, date: string, accountId: string | null, note: string) => {
    setState(prev => ({
      ...prev,
      income: prev.income.map(i => i.id === incId ? {
        ...i,
        date,
        amount,
        accountId: accountId || null,
        note
      } : i)
    }));
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

  const editTransfer = (tfId: string, fromAccountId: string, toAccountId: string, amount: number, date: string, note: string) => {
    setState(prev => ({
      ...prev,
      transfers: prev.transfers.map(tf => tf.id === tfId ? {
        ...tf,
        date,
        fromAccountId,
        toAccountId,
        amount,
        note
      } : tf)
    }));
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
      const paid = installmentPaidMonths(inst, viewMonth);
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
    const id = 'rec_' + genId();
    setState(prev => {
      const activeAccount = accountId || prev.accounts.find(a => a.onBudget)?.id || null;
      const rec: Recurring = {
        id,
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
    return id;
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

  const applyStarterCategories = (items: { name: string; groupId: string }[]) => {
    setState(prev => {
      const hasExistingSetup = hasMeaningfulUserData(prev);
      const sortByGroup: Record<string, number> = {};
      const usedIds = new Set<string>();
      const existingGroups = hasExistingSetup ? prev.groups : [];
      const existingCategories = hasExistingSetup ? prev.categories : [];
      const groups = hasExistingSetup
        ? [
            ...existingGroups,
            ...DEFAULT_GROUPS
              .filter(defaultGroup => !existingGroups.some(group => group.id === defaultGroup.id))
              .map(defaultGroup => ({ ...defaultGroup, sort: existingGroups.length + defaultGroup.sort }))
          ]
        : DEFAULT_GROUPS;
      const categories: Category[] = [...existingCategories];

      categories.forEach(category => {
        usedIds.add(category.id);
        sortByGroup[category.groupId] = Math.max(sortByGroup[category.groupId] || 0, category.sort + 1);
      });

      items.forEach(item => {
        const groupExists = groups.some(group => group.id === item.groupId);
        const trimmedName = item.name.trim();
        const categoryExists = categories.some(category => (
          category.groupId === item.groupId &&
          category.name.trim().toLowerCase() === trimmedName.toLowerCase()
        ));
        if (!trimmedName || !groupExists || categoryExists) return;
 
        const baseId = slugifyCategoryName(trimmedName);
        let id = baseId;
        let counter = 2;
        while (usedIds.has(id)) {
          id = `${baseId}_${counter}`;
          counter += 1;
        }
        usedIds.add(id);

        const sort = sortByGroup[item.groupId] || 0;
        sortByGroup[item.groupId] = sort + 1;

        categories.push({
          id,
          name: trimmedName,
          emoji: '',
          groupId: item.groupId,
          sort,
          target: null
        });
      });

      return {
        ...prev,
        groups,
        categories,
        budgets: hasExistingSetup ? prev.budgets : {}
      };
    });
  };

  // Global Persistence & Backup
  const clearAllData = () => {
    clearPersistedState();
    setState(createDefaultState());
    setViewMonth(todayMonth());
  };

  const importBackup = (backupState: any): boolean => {
    try {
      if (backupState && Array.isArray(backupState.categories) && Array.isArray(backupState.transactions)) {
        setState(normalizeState(backupState));
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

  const hasExistingData = hasMeaningfulUserData(state);

  if (!storageReady) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 text-xs font-semibold text-gray-400">
        Loading Amplop...
      </div>
    );
  }

  return (
    <BudgetContext.Provider value={{
      state,
      hasExistingData,
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
      editIncome,
      deleteIncome,
      
      addTransfer,
      editTransfer,
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
      applyStarterCategories,
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
