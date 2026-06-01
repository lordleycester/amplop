/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { fmtIDR, todayStr, todayMonth, parseAmount, monthLabelShort, genId, prevMonth as calcPrevMonth, nextMonth as calcNextMonth, fmtDate } from './utils/helpers';
import { 
  ReadyToAssign 
} from './components/ReadyToAssign';
import { 
  RecurringBanner 
} from './components/RecurringBanner';
import { 
  InstallmentsSection 
} from './components/InstallmentsSection';
import { 
  BudgetTab 
} from './components/BudgetTab';
import { 
  HistoryTab 
} from './components/HistoryTab';
import { 
  AccountsTab 
} from './components/AccountsTab';
import { 
  SettingsTab 
} from './components/SettingsTab';
import { 
  BottomSheet 
} from './components/BottomSheet';
import { 
  ConfirmDialog 
} from './components/ConfirmDialog';
import { 
  Toast 
} from './components/Toast';
import { 
  Wallet, List, Landmark, Settings, ArrowLeftRight, ChevronLeft, ChevronRight, HelpCircle, AlertCircle, ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, CreditCard
} from 'lucide-react';
import { Category, Group, Account, Installment, Recurring, Transaction, Income, Transfer } from './types';

function MainAppContent() {
  const {
    state,
    viewMonth,
    setViewMonth,
    activeView,
    setActiveView,
    filterCatId,
    setFilterCatId,
    getRTA,
    getSpent,
    getAssigned,
    getAvailable,
    getAccountBalance,
    addCategory,
    editCategory,
    deleteCategory,
    addGroup,
    editGroup,
    deleteGroup,
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
    deleteRecurring,
    setCategoryTarget,
    setAssigned
  } = useBudget();

  // Toast State
  const [toast, setToast] = useState<{ message: string | null; actionLabel: string | null; onAction: (() => void) | null }>({
    message: null,
    actionLabel: null,
    onAction: null
  });

  const showToast = (message: string, actionLabel: string | null = null, onAction: (() => void) | null = null) => {
    setToast({ message, actionLabel, onAction });
  };

  // Confirm Overlay State
  const [confirm, setConfirm] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirm({ isOpen: true, title, message, onConfirm });
  };

  // BottomSheet State orchestrator
  interface SheetState {
    isOpen: boolean;
    title: string;
    type: 
      | 'add_category' | 'edit_category' | 'add_group' | 'edit_group'
      | 'category_detail' | 'set_target' | 'move_money'
      | 'quick_add' | 'add_income' | 'add_account' | 'edit_account' | 'account_detail'
      | 'add_installment' | 'edit_installment' | 'installment_detail'
      | 'add_recurring' | 'edit_recurring'
      | 'add_transfer' | 'pay_credit_card'
      | 'transaction_detail' | 'transfer_detail' | 'income_detail' | 'edit_expense';
    data?: any;
  }

  const [sheet, setSheet] = useState<SheetState>({
    isOpen: false,
    title: '',
    type: 'quick_add'
  });

  const openSheet = (type: SheetState['type'], title: string, data?: any) => {
    setSheet({ isOpen: true, title, type, data });
  };

  const closeSheet = () => {
    setSheet(prev => ({ ...prev, isOpen: false }));
  };

  // Form local hooks
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('📌');
  const [formSelectedId, setFormSelectedId] = useState('');
  const [formSelectedId2, setFormSelectedId2] = useState('');
  const [formAmountStr, setFormAmountStr] = useState('');
  const [formDate, setFormDate] = useState(todayStr());
  const [formNote, setFormNote] = useState('');
  const [formTargetType, setFormTargetType] = useState<'none' | 'monthly' | 'monthly_builder' | 'by_date'>('none');
  const [formTargetMonth, setFormTargetMonth] = useState(todayMonth());
  const [formCountMonths, setFormCountMonths] = useState('12');
  const [formMonthlyPaymentStr, setFormMonthlyPaymentStr] = useState('');
  const [formRecurringType, setFormRecurringType] = useState<'expense' | 'income'>('expense');
  const [formDayOfMonth, setFormDayOfMonth] = useState('1');
  const [qaSelectedGroupId, setQaSelectedGroupId] = useState('all');

  // Trigger forms setups
  useEffect(() => {
    if (sheet.isOpen) {
      // Clear or preset form states
      setFormName('');
      setFormEmoji('📌');
      setFormSelectedId('');
      setFormSelectedId2('');
      setFormAmountStr('');
      setFormDate(todayStr());
      setFormNote('');
      setFormTargetType('none');
      setFormTargetMonth(todayMonth());
      setFormCountMonths('12');
      setFormMonthlyPaymentStr('');
      setFormRecurringType('expense');
      setFormDayOfMonth('1');
      setQaSelectedGroupId('all');

      if (sheet.type === 'edit_category' && sheet.data) {
        setFormName(sheet.data.name);
        setFormEmoji('');
        setFormSelectedId(sheet.data.groupId);
      }
      if (sheet.type === 'add_category') {
        setFormSelectedId(sheet.data || (state.groups[0]?.id || ''));
      }
      if (sheet.type === 'edit_group' && sheet.data) {
        setFormName(sheet.data.name);
      }
      if (sheet.type === 'set_target' && sheet.data) {
        const tgt = sheet.data.target;
        if (tgt) {
          setFormTargetType(tgt.type);
          setFormAmountStr(String(tgt.amount));
          if (tgt.dueDate) setFormTargetMonth(tgt.dueDate);
        }
      }
      if (sheet.type === 'edit_account' && sheet.data) {
        setFormName(sheet.data.name);
        setFormSelectedId(sheet.data.type);
        setFormAmountStr(String(sheet.data.startingBalance || 0));
      }
      if (sheet.type === 'edit_installment' && sheet.data) {
        setFormName(sheet.data.name);
        setFormEmoji('');
        setFormSelectedId(sheet.data.accountId || '');
        setFormSelectedId2(sheet.data.catId || '');
        setFormAmountStr(String(sheet.data.totalAmount));
        setFormCountMonths(String(sheet.data.totalMonths));
        setFormMonthlyPaymentStr(String(sheet.data.monthlyPayment));
        setFormTargetMonth(sheet.data.startDate);
        setFormNote(sheet.data.note || '');
      }
      if (sheet.type === 'edit_expense' && sheet.data) {
        setFormAmountStr(String(sheet.data.amount));
        setFormSelectedId(sheet.data.catId || '');
        setFormSelectedId2(sheet.data.accountId || '');
        setFormDate(sheet.data.date);
        setFormNote(sheet.data.note || '');
      }
      if (sheet.type === 'edit_recurring' && sheet.data) {
        const rec = sheet.data as Recurring;
        setFormRecurringType(rec.type);
        setFormName(rec.name);
        setFormAmountStr(String(rec.amount));
        setFormSelectedId(rec.catId || '');
        setFormSelectedId2(rec.accountId || '');
        setFormDayOfMonth(String(rec.dayOfMonth));
        setFormDate(rec.startDate);
        setFormNote(rec.endDate || '');
      }
    }
  }, [sheet.isOpen, sheet.type, sheet.data]);

  // Handle live math updates inside Add Installments
  const triggerInstallmentMathByTotal = (totalValStr: string, monthsValStr: string) => {
    const total = parseAmount(totalValStr);
    const months = parseInt(monthsValStr) || 0;
    if (total && months > 0) {
      setFormMonthlyPaymentStr(String(Math.ceil(total / months)));
    }
  };

  const triggerInstallmentMathByMonthly = (totalValStr: string, monthlyValStr: string) => {
    const total = parseAmount(totalValStr);
    const monthly = parseAmount(monthlyValStr);
    if (total && monthly > 0) {
      setFormCountMonths(String(Math.ceil(total / monthly)));
    }
  };

  // Group Color Determinism inside layout
  const getGroupColor = (groupId: string): string => {
    const colors: Record<string, string> = {
      bills: '#3b82f6',
      food: '#f59e0b',
      fun: '#8b5cf6',
      savings: '#10b981',
      other: '#9ca3af',
    };
    if (colors[groupId]) return colors[groupId];
    let hash = 0;
    for (let i = 0; i < groupId.length; i++) hash = (hash * 31 + groupId.charCodeAt(i)) & 0xffffffff;
    const fallbacks = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
    return fallbacks[Math.abs(hash) % fallbacks.length];
  };

  return (
    <div className="flex flex-col h-full max-w-[480px] mx-auto bg-slate-50 relative border-x border-gray-200 select-none shadow-xl overflow-hidden font-sans" id="app-viewport">
      
      {/* 1. Header (Navbar topbar) */}
      <header className="px-4 py-3.5 bg-emerald-950 text-white shrink-0 z-10 shadow-sm font-sans" id="topbar">
        <div className="flex items-center justify-between" id="topbar-inner">
          <span className="text-sm font-light tracking-[0.2em] uppercase select-none cursor-pointer hover:opacity-90 transition">amplop</span>
          
          {activeView === 'budget' ? (
            <div className="flex items-center gap-3 select-none" id="month-navigation">
              <button 
                onClick={() => setViewMonth(calcPrevMonth(viewMonth))}
                className="p-1 hover:bg-white/10 active:bg-white/25 rounded text-white/50 hover:text-white transition"
                id="month-prev-btn"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold tracking-wide font-sans text-gray-150" id="month-display">{monthLabelShort(viewMonth)}</span>
              <button 
                onClick={() => setViewMonth(calcNextMonth(viewMonth))}
                className="p-1 hover:bg-white/10 active:bg-white/25 rounded text-white/50 hover:text-white transition"
                id="month-next-btn"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <span className="text-xs font-semibold tracking-wide font-sans text-gray-200 capitalize">
              {activeView === 'history' ? 'Transactions feed' : activeView}
            </span>
          )}
        </div>
      </header>

      {/* 2. Scrollable Body Area */}
      <div className="flex-1 flex flex-col min-h-0 select-none" id="content-body">
        {activeView === 'budget' && (
          <>
            {/* Top ready to assign overview */}
            <ReadyToAssign 
              onAddIncomeClick={() => openSheet('add_income', 'Add Income')}
              onSetToast={showToast}
              onShowConfirm={showConfirm}
            />
            {/* Scheduled recurrings banner */}
            <RecurringBanner 
              onAddRecurringClick={() => openSheet('add_recurring', 'New Recurring Schedule')}
              onSetToast={showToast}
            />
            {/* Core budgeting envelope rows */}
            <BudgetTab 
              onAddCategoryClick={(groupId) => {
                openSheet('add_category', 'New Category', groupId);
              }}
              onCategoryClick={(cat) => openSheet('category_detail', cat.name, cat)}
              onSetToast={showToast}
            />
          </>
        )}

        {activeView === 'history' && (
          <HistoryTab 
            onTransactionClick={(tx) => openSheet('transaction_detail', 'Transaction Details', tx)}
            onIncomeClick={(inc) => openSheet('income_detail', 'Income Details', inc)}
            onTransferClick={(tf) => openSheet('transfer_detail', 'Transfer Details', tf)}
          />
        )}

        {activeView === 'cicilan' && (
          <InstallmentsSection 
            onAddInstallmentClick={() => openSheet('add_installment', 'Add Installment')}
            onInstallmentClick={(inst) => openSheet('installment_detail', 'Installment Details', inst)}
          />
        )}

        {activeView === 'accounts' && (
          <AccountsTab 
            onAddAccountClick={() => openSheet('add_account', 'Add Account')}
            onAccountClick={(acc) => openSheet('account_detail', acc.name, acc)}
            onTransferClick={() => openSheet('add_transfer', 'Transfer Between Accounts')}
            onPayCreditCardClick={() => openSheet('pay_credit_card', 'Pay Credit Card Debt')}
          />
        )}

        {activeView === 'settings' && (
          <SettingsTab 
            onAddGroupClick={() => openSheet('add_group', 'New Group')}
            onEditGroupClick={(g) => openSheet('edit_group', 'Rename Group', g)}
            onDeleteGroupClick={(g) => showConfirm(`Delete Group "${g.name}"?`, `This moves orphaned categories into remaining groups.`, () => deleteGroup(g.id))}
            onAddCategoryClick={(groupId) => {
              openSheet('add_category', 'New Category', groupId);
            }}
            onEditCategoryClick={(c) => openSheet('edit_category', 'Edit Category', c)}
            onDeleteCategoryClick={(c) => showConfirm(`Delete Category "${c.name}"?`, `All spending transactions are kept but unassigned.`, () => deleteCategory(c.id))}
            
            onAddAccountClick={() => openSheet('add_account', 'Add Account')}
            onEditAccountClick={(a) => openSheet('edit_account', 'Edit Account', a)}
            onDeleteAccountClick={(a) => showConfirm(`Delete Account "${a.name}"?`, `Transactions will stay but become unlinked and transfers deleted.`, () => deleteAccount(a.id))}
            
            onAddInstallmentClick={() => openSheet('add_installment', 'Add Installment')}
            onEditInstallmentClick={(i) => openSheet('edit_installment', 'Edit Installment', i)}
            onDeleteInstallmentClick={(i) => {
              const hasPast = state.transactions.some(t => t.installmentId === i.id && t.date.substring(0, 7) <= todayMonth());
              if (hasPast) {
                // Customized confirm
                showConfirm(`Delete "${i.name}"`, 'Keep historically completed billing transactions or delete all of them?', () => deleteInstallment(i.id, false));
              } else {
                showConfirm(`Delete "${i.name}"`, 'Remove this installment template and all of its transactions?', () => deleteInstallment(i.id, false));
              }
            }}
            
            onAddRecurringClick={() => openSheet('add_recurring', 'New Recurring Template')}
            onEditRecurringClick={(r) => openSheet('edit_recurring', 'Edit Recurring Template', r)}
            onDeleteRecurringClick={(r) => showConfirm(`Delete "${r.name}"?`, 'Template will be deleted, historic entered billing statements will remain intact.', () => deleteRecurring(r.id))}
            
            onSetToast={showToast}
            onShowConfirm={showConfirm}
          />
        )}
      </div>

      {/* Floating global FAB quick adds expense (Except settings lists or accounts lists) */}
      {activeView !== 'settings' && activeView !== 'accounts' && (
        <button
          onClick={() => openSheet('quick_add', 'Add Expense')}
          className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 border border-emerald-400 select-none shadow-lg z-20 flex items-center justify-center font-bold text-2xl tracking-tight transition-transform duration-100 hover:scale-105 active:scale-95"
          id="fab-button"
        >
          +
        </button>
      )}

      {/* 3. Bottom Navigation bar tabs menu spacer */}
      <footer className="bg-emerald-950 text-white shrink-0 z-10 border-t border-white/5 select-none" id="bottom-bar">
        <nav className="flex items-center justify-around h-14 px-1" id="nav-wrapper">
          <button 
            onClick={() => setActiveView('budget')}
            className={`flex flex-col items-center gap-1 py-1 px-1 flex-1 min-w-0 cursor-pointer select-none transition ${activeView === 'budget' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/80'}`}
            id="nav-tab-budget"
          >
            <Wallet size={18} />
            <span className="text-[10px] tracking-wide truncate">Budget</span>
          </button>

          <button 
            onClick={() => {
              setActiveView('history');
              // Clear category filter so all transactions load
              setFilterCatId(null);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-1 flex-1 min-w-0 cursor-pointer select-none transition ${activeView === 'history' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/80'}`}
            id="nav-tab-history"
          >
            <List size={18} />
            <span className="text-[10px] tracking-wide truncate">History</span>
          </button>

          {/* Symmetrical Middle FAB Area Spacer */}
          <div className="w-10 shrink-0 select-none pointer-events-none" />

          <button 
            onClick={() => setActiveView('accounts')}
            className={`flex flex-col items-center gap-1 py-1 px-1 flex-1 min-w-0 cursor-pointer select-none transition ${activeView === 'accounts' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/80'}`}
            id="nav-tab-accounts"
          >
            <Landmark size={18} />
            <span className="text-[10px] tracking-wide truncate font-medium">Accounts</span>
          </button>

          <button 
            onClick={() => setActiveView('cicilan')}
            className={`flex flex-col items-center gap-1 py-1 px-1 flex-1 min-w-0 cursor-pointer select-none transition ${activeView === 'cicilan' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/80'}`}
            id="nav-tab-cicilan"
          >
            <CreditCard size={18} />
            <span className="text-[10px] tracking-wide truncate">Installments</span>
          </button>

          <button 
            onClick={() => setActiveView('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-1 flex-1 min-w-0 cursor-pointer select-none transition ${activeView === 'settings' ? 'text-white font-semibold' : 'text-white/40 hover:text-white/80'}`}
            id="nav-tab-settings"
          >
            <Settings size={18} />
            <span className="text-[10px] tracking-wide truncate">Settings</span>
          </button>
        </nav>
      </footer>

      {/* Global interactive Toast notifications handles */}
      <Toast 
        message={toast.message}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
        onClose={() => setToast({ message: null, actionLabel: null, onAction: null })}
      />

      {/* Global interactive custom Confirm dialog overlay handles */}
      <ConfirmDialog 
        isOpen={confirm.isOpen}
        onClose={() => setConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
      />

      {/* 4. BottomSheet Forms renders */}
      <BottomSheet 
        isOpen={sheet.isOpen} 
        onClose={closeSheet} 
        title={sheet.title}
      >
        {/* NEW GROUP FORM */}
        {sheet.type === 'add_group' && (
          <div className="space-y-4" id="form-add-group">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Group Name</label>
              <input 
                type="text" 
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Transport, Subscriptions"
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                id="form-add-group-input"
              />
            </div>
            <button
              onClick={() => {
                if (!formName.trim()) return;
                addGroup(formName.trim());
                closeSheet();
                showToast(`Group "${formName}" created`, null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
              id="form-add-group-submit"
            >
              Add Group
            </button>
          </div>
        )}

        {/* RENAME GROUP FORM */}
        {sheet.type === 'edit_group' && (
          <div className="space-y-4" id="form-edit-group">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Group Name</label>
              <input 
                type="text" 
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
              />
            </div>
            <button
              onClick={() => {
                if (!formName.trim() || !sheet.data) return;
                editGroup(sheet.data.id, formName.trim());
                closeSheet();
                showToast('Group renamed', null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* NEW CATEGORY FORM */}
        {sheet.type === 'add_category' && (
          <div className="space-y-4" id="form-add-category">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category Name</label>
              <input 
                type="text" 
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Bus Tickets, Coffee"
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                id="form-add-cat-name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Assign to Group</label>
              <select
                value={formSelectedId}
                onChange={(e) => setFormSelectedId(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
              >
                {state.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <button
              onClick={() => {
                if (!formName.trim() || !formSelectedId) return;
                addCategory(formName.trim(), '', formSelectedId);
                closeSheet();
                showToast(`Category "${formName}" created`, null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
              id="form-add-cat-submit"
            >
              Add Category
            </button>
          </div>
        )}

        {/* EDIT CATEGORY FORM */}
        {sheet.type === 'edit_category' && (
          <div className="space-y-4" id="form-edit-category">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category Name</label>
              <input 
                type="text" 
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Group</label>
              <select
                value={formSelectedId}
                onChange={(e) => setFormSelectedId(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
              >
                {state.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <button
              onClick={() => {
                if (!formName.trim() || !formSelectedId || !sheet.data) return;
                editCategory(sheet.data.id, formName.trim(), '', formSelectedId);
                closeSheet();
                showToast('Category updated', null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* CATEGORY OUTFLOW DETAIL OVERVIEW SHEET */}
        {sheet.type === 'category_detail' && sheet.data && (
          (() => {
            const cat = sheet.data as Category;
            const assigned = getAssigned(cat.id, viewMonth);
            const spent = getSpent(cat.id, viewMonth);
            const available = getAvailable(cat.id, viewMonth);

            const thisMonthsTxs = state.transactions
              .filter(t => t.catId === cat.id && t.date.substring(0, 7) === viewMonth)
              .sort((a,b) => b.date.localeCompare(a.date))
              .slice(0, 8);

            const targetInfo = cat.target;

            return (
              <div className="space-y-4" id="cat-details-sheet">
                {/* Stats list rows grid layout */}
                <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/50 space-y-2 select-none" id="cat-details-stats">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Assigned {monthLabelShort(viewMonth)}</span>
                    <span className="font-semibold text-gray-800 font-mono">{fmtIDR(assigned)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
                    <span className="text-gray-400 font-medium">Spent this month</span>
                    <span className="font-semibold text-red-650 font-mono">{spent > 0 ? `−${fmtIDR(spent)}` : 'Rp0'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
                    <span className="text-gray-400 font-medium">Carryover Available</span>
                    <span className={`font-bold font-mono ${available >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{fmtIDR(available)}</span>
                  </div>

                  {targetInfo && (
                    <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-2 select-none" id="cat-details-target">
                      <span className="text-emerald-800 font-semibold">{targetInfo.type === 'monthly' ? 'Monthly Target' : targetInfo.type === 'by_date' ? 'By Date Target' : 'Monthly Builder'}</span>
                      <span className="text-emerald-800 font-bold font-mono">
                        {targetInfo.type === 'by_date' && targetInfo.dueDate 
                          ? `${fmtIDR(targetInfo.amount)} by ${targetInfo.dueDate}` 
                          : `${fmtIDR(targetInfo.amount)} / month`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub action handles */}
                <div className="grid grid-cols-2 gap-3" id="cat-sheet-actions">
                  <button
                    onClick={() => openSheet('set_target', 'Set Target', cat)}
                    className="py-2 px-3 border border-emerald-800/20 text-emerald-800 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    id="cat-action-target"
                  >
                    Set Target
                  </button>
                  <button
                    onClick={() => openSheet('move_money', 'Move Money', cat)}
                    className="py-2 px-3 border border-emerald-800/20 text-emerald-800 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    id="cat-action-move"
                  >
                    Move Money
                  </button>
                </div>

                {/* Categories spend transaction list inside detailed panel */}
                <div className="space-y-2 select-none pt-2" id="cat-sheet-txs">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Category Activity (This Month)</h4>
                  <div className="border border-gray-150 rounded-lg overflow-hidden divide-y divide-gray-100 bg-white" id="cat-sheet-tx-list">
                    {thisMonthsTxs.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400 italic">No category transactions this month</div>
                    ) : (
                      thisMonthsTxs.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2.5 text-xs">
                          <span className="text-gray-500 font-medium truncate max-w-[200px]" id={`cat-tx-note-${t.id}`}>{t.note || 'Expense'}</span>
                          <span className="font-bold text-red-750 shrink-0 font-mono" id={`cat-tx-val-${t.id}`}>−{fmtIDR(t.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* SET TARGET FORM */}
        {sheet.type === 'set_target' && sheet.data && (
          <div className="space-y-4" id="form-set-target">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Target Type</label>
              <div className="flex gap-2">
                {(['none', 'monthly', 'monthly_builder', 'by_date'] as const).map(typeKey => (
                  <button
                    key={typeKey}
                    onClick={() => {
                      setFormTargetType(typeKey);
                      if (typeKey === 'none') {
                        setFormAmountStr('');
                      }
                    }}
                    className={`flex-1 py-1.5 text-[11px] font-bold rounded border transition capitalize ${formTargetType === typeKey ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-white text-gray-450 border-gray-200 hover:bg-gray-100'}`}
                  >
                    {typeKey.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {formTargetType !== 'none' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Goal Amount (Rp)</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={formAmountStr}
                    onChange={(e) => setFormAmountStr(e.target.value)}
                    placeholder="e.g. 500k"
                    className="w-full text-center px-4 py-3 bg-gray-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                  <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5">
                    {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
                  </div>
                </div>

                {formTargetType === 'by_date' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Target Date (Due Month)</label>
                    <input 
                      type="month"
                      value={formTargetMonth}
                      onChange={(e) => setFormTargetMonth(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs font-mono outline-none"
                    />
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => {
                if (!sheet.data) return;
                const cat = sheet.data as Category;
                if (formTargetType === 'none') {
                  setCategoryTarget(cat.id, null);
                } else {
                  const goalAmount = parseAmount(formAmountStr);
                  setCategoryTarget(cat.id, {
                    type: formTargetType,
                    amount: goalAmount,
                    dueDate: formTargetType === 'by_date' ? formTargetMonth : undefined
                  });
                }
                closeSheet();
                showToast('Category targets updated', null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
              id="form-target-submit"
            >
              Save Target Goal
            </button>
          </div>
        )}

        {/* MOVE MONEY FORM */}
        {sheet.type === 'move_money' && sheet.data && (
          (() => {
            const srcCat = sheet.data as Category;
            const srcAvail = getAvailable(srcCat.id, viewMonth);
            const others = state.categories.filter(c => c.id !== srcCat.id);

            return (
              <div className="space-y-4 font-sans" id="form-move-money">
                <div className="text-xs text-gray-500 rounded p-2 border border-gray-150 bg-gray-50 select-none">
                  Sumber: <span className="font-semibold text-gray-700">{srcCat.name}</span> (<span className="font-bold font-mono text-emerald-700">{fmtIDR(srcAvail)}</span> available)
                </div>

                {/* Ke Kategori Selector list grid */}
                <div className="space-y-1.5" id="move-dest-list">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Ke Kategori:</label>
                  <div className="max-h-[140px] overflow-y-auto divide-y divide-gray-100 rounded-md border border-gray-150 shadow-sm bg-white" id="move-dest-elements">
                    {others.map(c => {
                      const av = getAvailable(c.id, viewMonth);
                      const isSelected = formSelectedId === c.id;
                      const dotColor = getGroupColor(c.groupId);

                      return (
                        <div
                          key={c.id}
                          onClick={() => setFormSelectedId(c.id)}
                          className={`flex justify-between items-center p-3 select-none cursor-pointer transition ${isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50/50'}`}
                          id={`move-row-${c.id}`}
                        >
                          <div className="flex items-center gap-2 min-w-0" id={`move-row-left-${c.id}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                            <span className="text-xs font-semibold text-gray-700 truncate">{c.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold font-mono">{fmtIDR(av)} av</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Amount</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={formAmountStr}
                    onChange={(e) => setFormAmountStr(e.target.value)}
                    placeholder="e.g. 100k"
                    className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                    id="move-amt-input"
                  />
                  <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5">
                    {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const cleanAmount = parseAmount(formAmountStr);
                    if (!cleanAmount || !formSelectedId) return;
                    
                    const srcAssigned = getAssigned(srcCat.id, viewMonth);
                    const destAssigned = getAssigned(formSelectedId, viewMonth);

                    setAssigned(srcCat.id, viewMonth, srcAssigned - cleanAmount);
                    setAssigned(formSelectedId, viewMonth, destAssigned + cleanAmount);
                    closeSheet();
                    showToast(`Moved ${fmtIDR(cleanAmount)} from ${srcCat.name}`, null, undefined);
                  }}
                  disabled={!formSelectedId || !parseAmount(formAmountStr)}
                  className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition flex items-center justify-center gap-1"
                  id="move-submit-btn"
                >
                  <ArrowLeftRight size={13} />
                  Move {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
                </button>
              </div>
            );
          })()
        )}

        {/* QUICK ADD EXPENSE FORM */}
        {sheet.type === 'quick_add' && (
          <div className="space-y-4" id="form-quick-add">
            <div>
              <input 
                type="text"
                autoFocus
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                placeholder="0"
                className="w-full text-center px-4 py-3.5 bg-slate-50 border border-gray-200 rounded font-mono text-2xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                id="qa-amount-input"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="qa-amount-preview">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : 'Masukkan jumlah'}
              </div>
              <div className="text-center text-[10px] text-gray-400 mt-1 select-none">
                Hint: k = ribu · m = juta · atau titik: 35.000
              </div>
            </div>

            {/* Categorization chips grid */}
            <div className="space-y-2 select-none" id="qa-category-select">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">Category</label>
              
              {/* Group filter pills */}
              <div className="flex gap-1 overflow-x-auto pb-1.5 select-none" id="qa-group-filters">
                <button
                  type="button"
                  onClick={() => setQaSelectedGroupId('all')}
                  className={`px-3 py-1 rounded text-[9px] font-mono font-extrabold uppercase transition whitespace-nowrap border ${
                    qaSelectedGroupId === 'all' 
                      ? 'bg-slate-800 border-slate-800 text-white shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                  }`}
                  id="qa-group-filter-all"
                >
                  All
                </button>
                {state.groups.map(g => {
                  const isSelected = qaSelectedGroupId === g.id;
                  const gColor = getGroupColor(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setQaSelectedGroupId(g.id)}
                      className={`px-3 py-1 rounded text-[9px] font-mono font-extrabold uppercase transition whitespace-nowrap border`}
                      style={{
                        backgroundColor: isSelected ? gColor : '#ffffff',
                        borderColor: isSelected ? gColor : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#64748b'
                      }}
                      id={`qa-group-filter-${g.id}`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1" id="qa-categories-chiplist">
                {state.categories
                  .filter(c => qaSelectedGroupId === 'all' || c.groupId === qaSelectedGroupId)
                  .map(c => {
                    const isSelected = formSelectedId === c.id;
                    const cColor = getGroupColor(c.groupId);

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormSelectedId(c.id)}
                        className={`flex items-center gap-1.5 p-2 rounded border text-left text-xs font-semibold truncate transition ${isSelected ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold' : 'bg-white hover:bg-slate-50/50 border-gray-150'}`}
                        id={`qa-cat-chip-${c.id}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cColor }} />
                        <span className="truncate">{c.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Account Pills select (If we have on-budget accounts) */}
            {state.accounts.filter(a => a.onBudget).length > 1 && (
              <div className="space-y-2 select-none" id="qa-account-select">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">From Account</label>
                <div className="flex gap-2 overflow-x-auto pb-1.5" id="qa-accounts-pillslist">
                  {state.accounts.filter(a => a.onBudget).map(a => {
                    const isSelected = formSelectedId2 === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setFormSelectedId2(a.id)}
                        className={`px-3 py-1.5 rounded border text-xs font-semibold whitespace-nowrap transition ${isSelected ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold' : 'bg-white hover:bg-slate-50/50 border-gray-150'}`}
                        id={`qa-acc-chip-${a.id}`}
                      >
                        {a.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note & Date Picker */}
            <div className="grid grid-cols-2 gap-3" id="qa-extras">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Note (Optional)</label>
                <input 
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Note / Memo"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="qa-note"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="qa-date"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const spendingValue = parseAmount(formAmountStr);
                if (!spendingValue || !formSelectedId) return;

                // Resolve account
                const budgetAccs = state.accounts.filter(a => a.onBudget);
                const resolvedAccId = formSelectedId2 || budgetAccs[0]?.id || null;

                addExpense(spendingValue, formDate, formSelectedId, resolvedAccId, formNote.trim());
                closeSheet();
                showToast(`Added ${fmtIDR(spendingValue)} to expense feed`, null, undefined);
              }}
              disabled={!parseAmount(formAmountStr) || !formSelectedId}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded shadow transition"
              id="qa-submit-btn"
            >
              Tambah Expense {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
            </button>
          </div>
        )}

        {/* ADD INCOME FORM */}
        {sheet.type === 'add_income' && (
          <div className="space-y-4" id="form-add-income">
            <div>
              <input 
                type="text"
                autoFocus
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                placeholder="0"
                className="w-full text-center px-4 py-3.5 bg-slate-50 border border-gray-200 rounded font-mono text-2xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                id="inc-amount-input"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="inc-amount-preview">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : 'Add Income'}
              </div>
            </div>

            {/* Account Selector (Budget accounts only) */}
            {state.accounts.filter(a => a.onBudget).length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">To Account</label>
                <select
                  value={formSelectedId}
                  onChange={(e) => setFormSelectedId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs select-none"
                  id="inc-acc"
                >
                  {state.accounts.filter(a => a.onBudget).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3" id="inc-extras">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Note (Memos)</label>
                <input 
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Salary, Gig pay"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="inc-note"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="inc-date"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const incomeValue = parseAmount(formAmountStr);
                if (!incomeValue) return;

                const budgetAccs = state.accounts.filter(a => a.onBudget);
                const resolvedAccId = formSelectedId || budgetAccs[0]?.id || null;

                addIncome(incomeValue, formDate, resolvedAccId, formNote.trim() || 'Salary Inflow');
                closeSheet();
                showToast(`Added inflow +${fmtIDR(incomeValue)} explicitly to RTA!`, null, undefined);
              }}
              disabled={!parseAmount(formAmountStr)}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition uppercase tracking-wide"
              id="inc-submit-btn"
            >
              Add Income
            </button>
          </div>
        )}

        {/* ADD ACCOUNT FORM */}
        {sheet.type === 'add_account' && (
          <div className="space-y-4" id="form-add-account">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Name</label>
              <input 
                type="text"
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Mandiri, Cash on Hand"
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                id="na-name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Type</label>
              <select
                value={formSelectedId}
                onChange={(e) => setFormSelectedId(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                id="na-type"
              >
                <optgroup label="Budget Accounts (On-Budget)">
                  <option value="checking">Checking / Bank Account</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card (CC)</option>
                  <option value="cash">Cash on Hand</option>
                </optgroup>
                <optgroup label="Tracking Accounts (Off-Budget)">
                  <option value="investment">Investment Asset</option>
                  <option value="retirement">Retirement Fund</option>
                  <option value="mortgage">Mortgage Loan / Debt</option>
                  <option value="other_asset">Other Asset</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Starting Balance (Rp)</label>
              <input 
                type="text"
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                placeholder="0"
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                id="na-balance"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="na-bal-pv">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
              </div>
            </div>

            <button
              onClick={() => {
                if (!formName.trim()) return;
                const balanceVal = parseAmount(formAmountStr);
                const resolvedType = (formSelectedId || 'checking') as Account['type'];

                addAccount(formName.trim(), resolvedType, balanceVal);
                closeSheet();
                showToast(`Account "${formName}" created with ${fmtIDR(balanceVal)}`, null, undefined);
              }}
              disabled={!formName.trim()}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
              id="na-submit-btn"
            >
              Add Account
            </button>
          </div>
        )}

        {/* EDIT ACCOUNT DETAILS */}
        {sheet.type === 'edit_account' && sheet.data && (
          <div className="space-y-4 font-sans" id="form-edit-account">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Name</label>
              <input 
                type="text" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Type</label>
              <select
                value={formSelectedId}
                onChange={(e) => setFormSelectedId(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
              >
                <optgroup label="Budget Accounts">
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                </optgroup>
                <optgroup label="Tracking Accounts">
                  <option value="investment">Investment</option>
                  <option value="retirement">Retirement</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="other_asset">Other Asset</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Starting Balance (Rp)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            <button
              onClick={() => {
                if (!formName.trim() || !sheet.data) return;
                const startingBal = parseAmount(formAmountStr);
                const resolvedType = (formSelectedId || 'checking') as Account['type'];

                editAccount(sheet.data.id, formName.trim(), resolvedType, startingBal);
                closeSheet();
                showToast('Account details updated', null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* ACCOUNT DETAILED SCREEN BRIEF OVERLAYS */}
        {sheet.type === 'account_detail' && sheet.data && (
          (() => {
            const acc = sheet.data as Account;
            const balance = getAccountBalance(acc.id);

            return (
              <div className="space-y-4" id="account-sheets-details">
                <div className="text-center py-4 select-none" id="acc-details-panel">
                  <div className="text-[10px] font-bold text-[#8a8680] uppercase tracking-wider mb-0.5">Account Balance</div>
                  <div className={`text-3xl font-bold font-mono ${balance > 0 ? 'text-emerald-700' : balance < 0 ? 'text-red-700' : 'text-gray-400'}`}>{fmtIDR(balance)}</div>
                  <div className="text-[10px] text-gray-450 mt-1 font-semibold">{acc.onBudget ? 'On Budget Category assets' : 'Tracking Off-Budget Asset'}</div>
                </div>

                {!acc.onBudget && (
                  <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/50 space-y-2 select-none" id="acc-details-tracking-adjustment">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Adjust Account Balance</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        inputMode="decimal"
                        placeholder="e.g. 5M"
                        value={formAmountStr}
                        onChange={(e) => setFormAmountStr(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 bg-white rounded text-xs outline-none"
                      />
                      <button
                        onClick={() => {
                          const goalBal = parseAmount(formAmountStr);
                          updateTrackingBalance(acc.id, goalBal);
                          closeSheet();
                          showToast('Tracking account balance reconciled', null, undefined);
                        }}
                        disabled={!formAmountStr}
                        className="px-4 py-1.5 bg-emerald-850 hover:bg-emerald-900 disabled:opacity-20 text-white font-bold text-[11px] rounded transition"
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                )}

                {/* Unified Account Transaction History */}
                {(() => {
                  const acctTransports = [
                    // 1. Outflow Expenses
                    ...state.transactions.filter(t => t.accountId === acc.id).map(t => ({
                      id: t.id,
                      date: t.date,
                      type: 'expense' as const,
                      amount: t.amount,
                      note: t.note || 'Expense',
                      categoryName: state.categories.find(c => c.id === t.catId)?.name || 'Deleted Envelope'
                    })),
                    // 2. Inflow Incomes
                    ...state.income.filter(i => i.accountId === acc.id).map(i => ({
                      id: i.id,
                      date: i.date,
                      type: 'income' as const,
                      amount: i.amount,
                      note: i.note || 'Income',
                      categoryName: 'Inflow'
                    })),
                    // 3. Transfers Out (as sender)
                    ...state.transfers.filter(tf => tf.fromAccountId === acc.id).map(tf => ({
                      id: tf.id,
                      date: tf.date,
                      type: 'transfer_out' as const,
                      amount: tf.amount,
                      note: tf.note || 'Transfer Out',
                      categoryName: `To: ${state.accounts.find(a => a.id === tf.toAccountId)?.name || 'Deleted Account'}`
                    })),
                    // 4. Transfers In (as receiver)
                    ...state.transfers.filter(tf => tf.toAccountId === acc.id).map(tf => ({
                      id: tf.id,
                      date: tf.date,
                      type: 'transfer_in' as const,
                      amount: tf.amount,
                      note: tf.note || 'Transfer In',
                      categoryName: `From: ${state.accounts.find(a => a.id === tf.fromAccountId)?.name || 'Deleted Account'}`
                    }))
                  ];

                  // Sort desc by date
                  acctTransports.sort((a, b) => b.date.localeCompare(a.date));

                  return (
                    <div className="border-t border-gray-150 pt-4" id="acc-details-history-section">
                      <div className="text-[10px] font-bold text-[#8a8680] uppercase tracking-wider pl-0.5 mb-2">
                        Transaction History ({acctTransports.length})
                      </div>
                      {acctTransports.length === 0 ? (
                        <div className="text-center py-4 text-xs text-gray-400 italic bg-gray-50/50 rounded-lg border border-dashed border-gray-250">
                          No history records for this account.
                        </div>
                      ) : (
                        <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-150 border border-gray-200 rounded bg-white shadow-inner scrollbar-thin" id="acc-details-tx-scroll">
                          {acctTransports.map(t => {
                            const isInflow = t.type === 'income' || t.type === 'transfer_in';
                            
                            return (
                              <div key={t.id} className="flex justify-between items-center p-2 hover:bg-slate-50 transition text-xs font-sans">
                                <div className="min-w-0 pr-2">
                                  <div className="font-semibold text-gray-800 truncate" title={t.note}>{t.note}</div>
                                  <div className="flex items-center gap-1.5 text-[9px] text-[#8a8680] mt-0.5 font-bold">
                                    <span className="font-mono">{t.date}</span>
                                    <span>·</span>
                                    <span className="uppercase text-amber-800 bg-amber-50 px-1 rounded-sm text-[8px] tracking-tight">{t.categoryName}</span>
                                  </div>
                                </div>
                                <div className={`font-mono font-bold shrink-0 text-right text-xs ${isInflow ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {isInflow ? '+' : '−'}{fmtIDR(t.amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3" id="acc-details-actions">
                  <button
                    onClick={() => openSheet('edit_account', 'Edit Account', acc)}
                    className="py-2 px-3 border border-emerald-800/10 text-emerald-850 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    Edit Account
                  </button>
                  <button
                    onClick={() => {
                      showConfirm(
                        `Delete Account "${acc.name}"?`,
                        `This unlinks transactions and deletes transfer history. Budget categories remain unchanged.`,
                        () => {
                          deleteAccount(acc.id);
                          closeSheet();
                          showToast('Account deleted', null, undefined);
                        }
                      );
                    }}
                    className="py-2 px-3 border border-red-500/20 text-red-650 hover:bg-red-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            );
          })()
        )}

        {/* TRANSFER BETWEEN ACCOUNTS FORM */}
        {sheet.type === 'add_transfer' && (
          <div className="space-y-4" id="form-transfer">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-sans">From Account</label>
              <select
                value={formSelectedId}
                onChange={(e) => setFormSelectedId(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                id="tf-from"
              >
                <option value="">Select Account</option>
                {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtIDR(getAccountBalance(a.id))})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-sans">To Account</label>
              <select
                value={formSelectedId2}
                onChange={(e) => setFormSelectedId2(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                id="tf-to"
              >
                <option value="">Select Destination</option>
                {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtIDR(getAccountBalance(a.id))})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Amount (Rp)</label>
              <input 
                type="text"
                inputMode="decimal"
                autoFocus
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                placeholder="0"
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                id="tf-amt"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="tf-pv">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="tf-extras">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Note (Optional)</label>
                <input 
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Memo / Transfer note"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="tf-note"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="tf-date"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const tfAmount = parseAmount(formAmountStr);
                if (!tfAmount || !formSelectedId || !formSelectedId2 || formSelectedId === formSelectedId2) return;

                addTransfer(formSelectedId, formSelectedId2, tfAmount, formDate, formNote.trim());
                closeSheet();
                showToast(`Transferred ${fmtIDR(tfAmount)} successfully`, null, undefined);
              }}
              disabled={!formSelectedId || !formSelectedId2 || formSelectedId === formSelectedId2 || !parseAmount(formAmountStr)}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition flex items-center justify-center gap-1.5"
              id="tf-submit-btn"
            >
              Transfer Funds
            </button>
          </div>
        )}

        {/* PAY CREDIT CARD DEBT FORM */}
        {sheet.type === 'pay_credit_card' && (
          <div className="space-y-4" id="form-pay-creditcard">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-sans">Payment Account Source</label>
              <select
                value={formSelectedId}
                onChange={(e) => setFormSelectedId(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                id="ccp-from"
              >
                <option value="">Select Bank Account</option>
                {state.accounts.filter(a => a.onBudget && a.type !== 'credit_card').map(a => <option key={a.id} value={a.id}>{a.name} ({fmtIDR(getAccountBalance(a.id))})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider font-sans">Target Credit Card</label>
              <select
                value={formSelectedId2}
                onChange={(e) => setFormSelectedId2(e.target.value)}
                className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                id="ccp-card"
              >
                <option value="">Select Credit Card</option>
                {state.accounts.filter(a => a.onBudget && a.type === 'credit_card').map(a => <option key={a.id} value={a.id}>{a.name} ({fmtIDR(getAccountBalance(a.id))})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Payment Amount (Rp)</label>
              <input 
                type="text"
                inputMode="decimal"
                autoFocus
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                placeholder="0"
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                id="ccp-amt"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="ccp-pv">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="ccp-extras">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Note (Optional)</label>
                <input 
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="ccp-note"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="ccp-date"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const payAmount = parseAmount(formAmountStr);
                if (!payAmount || !formSelectedId || !formSelectedId2) return;

                addTransfer(formSelectedId, formSelectedId2, payAmount, formDate, formNote.trim() || 'Credit card debt payment', 'credit_card_payment');
                closeSheet();
                showToast(`Payment of ${fmtIDR(payAmount)} sent to Credit Card`, null, undefined);
              }}
              disabled={!formSelectedId || !formSelectedId2 || !parseAmount(formAmountStr)}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition flex items-center justify-center gap-1"
              id="ccp-submit-btn"
            >
              Make Card Payment
            </button>
          </div>
        )}

        {/* ADD INSTALLMENT FORM */}
        {sheet.type === 'add_installment' && (
          <div className="space-y-4 font-sans" id="form-add-installment">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Nama Item</label>
              <input 
                type="text" 
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. iPhone, Kulkas, Laptop"
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                id="inst-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Kartu Kredit / Akun</label>
                <select
                  value={formSelectedId}
                  onChange={(e) => setFormSelectedId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                  id="inst-acc"
                >
                  <option value="">Select Account</option>
                  {state.accounts.filter(a => a.onBudget).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Kategori Anggaran</label>
                <select
                  value={formSelectedId2}
                  onChange={(e) => setFormSelectedId2(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                  id="inst-cat"
                >
                  <option value="">Select Category</option>
                  {state.groups.map(g => (
                    <optgroup key={g.id} label={g.name}>
                      {state.categories.filter(c => c.groupId === g.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Total Harga (Rp)</label>
              <input 
                type="text"
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => {
                  setFormAmountStr(e.target.value);
                  triggerInstallmentMathByTotal(e.target.value, formCountMonths);
                }}
                placeholder="e.g. 12M"
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                id="inst-total"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="inst-total-pv">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="inst-duration-form">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Jumlah Bulan (Tenor)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formCountMonths}
                  onChange={(e) => {
                     setFormCountMonths(e.target.value);
                     triggerInstallmentMathByTotal(formAmountStr, e.target.value);
                  }}
                  placeholder="12"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono select-all outline-none focus:border-emerald-600 transition"
                  id="inst-months"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Per Bulan (Rp)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  value={formMonthlyPaymentStr}
                  onChange={(e) => {
                    setFormMonthlyPaymentStr(e.target.value);
                    triggerInstallmentMathByMonthly(formAmountStr, e.target.value);
                  }}
                  placeholder="auto"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono select-all outline-none focus:border-emerald-600 transition"
                  id="inst-monthly"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="inst-details-extras">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Bulan Pertama</label>
                <input 
                  type="month"
                  value={formTargetMonth}
                  onChange={(e) => setFormTargetMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
                  id="inst-start"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Catatan (Optional)</label>
                <input 
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Note / promo 0%"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                  id="inst-note"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const totalAmount = parseAmount(formAmountStr);
                const tenorMonths = parseInt(formCountMonths) || 0;
                const monthlyCharge = parseAmount(formMonthlyPaymentStr) || (tenorMonths > 0 ? Math.ceil(totalAmount / tenorMonths) : 0);
                
                if (!formName.trim() || !totalAmount || tenorMonths <= 0 || monthlyCharge <= 0) return;

                addInstallment(
                  formName.trim(),
                  '',
                  formSelectedId || null,
                  formSelectedId2 || null,
                  totalAmount,
                  tenorMonths,
                  monthlyCharge,
                  formTargetMonth,
                  formNote.trim()
                );
                closeSheet();
                showToast(`Installment "${formName}" added successfully!`, null, undefined);
              }}
              disabled={!formName.trim() || !parseAmount(formAmountStr) || !parseInt(formCountMonths)}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
              id="inst-submit-btn"
            >
              Add New Installment
            </button>
          </div>
        )}

        {/* EDIT INSTALLMENT DETAILS */}
        {sheet.type === 'edit_installment' && sheet.data && (
          <div className="space-y-4" id="form-edit-installment">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Item Name</label>
              <input 
                type="text" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Credit Card / Account</label>
                <select
                  value={formSelectedId}
                  onChange={(e) => setFormSelectedId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                >
                  <option value="">Select Account</option>
                  {state.accounts.filter(a => a.onBudget).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Budget Category</label>
                <select
                  value={formSelectedId2}
                  onChange={(e) => setFormSelectedId2(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                >
                  <option value="">Select Category</option>
                  {state.groups.map(g => (
                    <optgroup key={g.id} label={g.name}>
                      {state.categories.filter(c => c.groupId === g.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Total Harga (Rp)</label>
              <input 
                type="text"
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => {
                  setFormAmountStr(e.target.value);
                  triggerInstallmentMathByTotal(e.target.value, formCountMonths);
                }}
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Jumlah Bulan (Tenor)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formCountMonths}
                  onChange={(e) => {
                     setFormCountMonths(e.target.value);
                     triggerInstallmentMathByTotal(formAmountStr, e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono select-all outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Per Bulan (Rp)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  value={formMonthlyPaymentStr}
                  onChange={(e) => {
                    setFormMonthlyPaymentStr(e.target.value);
                    triggerInstallmentMathByMonthly(formAmountStr, e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono select-all outline-none focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Bulan Pertama</label>
                <input 
                  type="month"
                  value={formTargetMonth}
                  onChange={(e) => setFormTargetMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Catatan (Optional)</label>
                <input 
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!sheet.data || !formName.trim()) return;
                const totalAmt = parseAmount(formAmountStr);
                const durMonths = parseInt(formCountMonths) || 0;
                const monthlyChg = parseAmount(formMonthlyPaymentStr) || (durMonths > 0 ? Math.ceil(totalAmt / durMonths) : 0);

                if (!totalAmt || durMonths <= 0 || monthlyChg <= 0) {
                  showToast('Please enter valid total amount and tenor duration months', 'error', undefined);
                  return;
                }

                editInstallment(
                  sheet.data.id,
                  formName.trim(),
                  '',
                  formSelectedId || null,
                  formSelectedId2 || null,
                  totalAmt,
                  monthlyChg,
                  durMonths,
                  formTargetMonth,
                  formNote.trim()
                );
                closeSheet();
                showToast('Installment updated', null, undefined);
              }}
              disabled={!formName.trim() || !parseAmount(formAmountStr) || !parseInt(formCountMonths)}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
            >
              Save
            </button>
          </div>
        )}

        {/* INSTALLMENT DETAILS MODAL PREVIEW */}
        {sheet.type === 'installment_detail' && sheet.data && (
          (() => {
            const inst = sheet.data as Installment;
            
            // Re-import helper dates calculations
            const _instEndDate = (i: Installment): string => {
              let [y, mo] = i.startDate.split('-').map(Number);
              mo += i.totalMonths - 1;
              while (mo > 12) {
                mo -= 12;
                y++;
              }
              return y + '-' + String(mo).padStart(2, '0');
            };

            const _instPaidMonths = (i: Installment, m: string): number => {
              if (m < i.startDate) return 0;
              const [sy, smo] = i.startDate.split('-').map(Number);
              const [cy, cm]  = m.split('-').map(Number);
              const total = (cy - sy) * 12 + (cm - smo);
              return Math.min(total, i.totalMonths);
            };

            const paidCount = _instPaidMonths(inst, viewMonth);
            const remainingCount = Math.max(0, inst.totalMonths - paidCount);
            const progressPercent = inst.totalMonths > 0 ? (paidCount / inst.totalMonths) * 100 : 0;

            return (
              <div className="space-y-4" id="installment-sheet-view">
                <div className="border border-gray-150 rounded-lg p-3 bg-gray-50/50 space-y-2 select-none" id="inst-sheet-stats">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Total Cost</span>
                    <span className="font-bold text-gray-800 font-mono">{fmtIDR(inst.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
                    <span className="text-gray-400 font-medium">Monthly Payment</span>
                    <span className="font-semibold text-amber-600 font-mono">{fmtIDR(inst.monthlyPayment)} × {inst.totalMonths} mo</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
                    <span className="text-gray-400 font-medium font-sans">Paid Amount</span>
                    <span className="font-bold text-emerald-700 font-mono">{fmtIDR(inst.monthlyPayment * paidCount)} ({paidCount} mo)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-gray-100/50 pt-2">
                    <span className="text-gray-400 font-medium text-sans">Remaining Balance</span>
                    <span className="font-bold text-red-650 font-mono">{fmtIDR(inst.monthlyPayment * remainingCount)} ({remainingCount} mo)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2" id="inst-detail-actions">
                  <button
                    onClick={() => {
                      showConfirm('Mark as Paid Off?', 'Stop upcoming automatically scheduled installments billing transactions after this month immediately?', () => {
                        markInstallmentPaidOff(inst.id);
                        closeSheet();
                        showToast('Installment marked as paid off', null, undefined);
                      });
                    }}
                    className="w-full py-2 px-3 border border-emerald-800/10 text-emerald-850 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    Mark as Paid Off
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openSheet('edit_installment', 'Edit Installment', inst)}
                      className="py-2 px-3 border border-slate-200 text-gray-700 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      Edit details
                    </button>
                    <button
                      onClick={() => {
                        showConfirm(`Delete "${inst.name}"?`, `All upcoming transactions represent future obligations will be deleted. Past entered payments can be kept.`, () => {
                          deleteInstallment(inst.id, false);
                          closeSheet();
                          showToast('Installment deleted', null, undefined);
                        });
                      }}
                      className="py-2 px-3 border border-red-500/10 text-red-650 hover:bg-red-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      Delete Installment
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* ADD RECURRING TRANSACTION FORM */}
        {sheet.type === 'add_recurring' && (
          <div className="space-y-4" id="form-add-recurring">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormRecurringType('expense')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${formRecurringType === 'expense' ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  Expense Outflow
                </button>
                <button
                  onClick={() => setFormRecurringType('income')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded border transition ${formRecurringType === 'income' ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-white text-gray-500 border-gray-200'}`}
                >
                  Income Inflow
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Name</label>
              <input 
                type="text"
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Netflix subscription, Monthly rent"
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                id="rec-name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Amount (Rp)</label>
              <input 
                type="text"
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                placeholder="0"
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
                id="rec-amt"
              />
              <div className="text-center font-bold text-emerald-700 font-mono text-xs mt-1.5" id="rec-amt-pv">
                {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="rec-selections">
              {formRecurringType === 'expense' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category</label>
                  <select
                    value={formSelectedId}
                    onChange={(e) => setFormSelectedId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                    id="rec-cat"
                  >
                    <option value="">Select Category</option>
                    {state.groups.map(g => (
                      <optgroup key={g.id} label={g.name}>
                        {state.categories.filter(c => c.groupId === g.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Source</label>
                <select
                  value={formSelectedId2}
                  onChange={(e) => setFormSelectedId2(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                  id="rec-acc"
                >
                  <option value="">Select Account</option>
                  {state.accounts.filter(a => a.onBudget).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="rec-days-dates">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Day of Month (1-28)</label>
                <input 
                  type="text"
                  inputMode="numeric"
                  value={formDayOfMonth}
                  onChange={(e) => setFormDayOfMonth(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs font-mono outline-none focus:border-emerald-600 transition"
                  id="rec-day"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Start Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
                  id="rec-start"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const recValue = parseAmount(formAmountStr);
                const payDay = Math.min(28, Math.max(1, parseInt(formDayOfMonth) || 1));
                
                if (!formName.trim() || !recValue) return;

                addRecurring(
                  formName.trim(),
                  recValue,
                  formRecurringType,
                  formRecurringType === 'income' ? null : formSelectedId || null,
                  formSelectedId2 || null,
                  payDay,
                  formDate,
                  null
                );
                closeSheet();
                showToast(`Recurring schedule "${formName}" created!`, null, undefined);
              }}
              disabled={!formName.trim() || !parseAmount(formAmountStr)}
              className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition font-sans"
              id="rec-submit-btn"
            >
              Save Recurring Schedule
            </button>
          </div>
        )}

        {/* EDIT RECURRING TEMPLATE */}
        {sheet.type === 'edit_recurring' && sheet.data && (
          <div className="space-y-4" id="form-edit-recurring">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Name</label>
              <input 
                type="text" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Amount (Rp)</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {formRecurringType === 'expense' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category</label>
                  <select
                    value={formSelectedId}
                    onChange={(e) => setFormSelectedId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                  >
                    <option value="">Select Category</option>
                    {state.groups.map(g => (
                      <optgroup key={g.id} label={g.name}>
                        {state.categories.filter(c => c.groupId === g.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account Source</label>
                <select
                  value={formSelectedId2}
                  onChange={(e) => setFormSelectedId2(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs"
                >
                  <option value="">Select Account</option>
                  {state.accounts.filter(a => a.onBudget).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="edit-rec-numeric">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Day of Month</label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={formDayOfMonth}
                  onChange={(e) => setFormDayOfMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Start Date</label>
                <input 
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!sheet.data || !formName.trim()) return;
                const recVal = parseAmount(formAmountStr);
                const dayNum = Math.min(28, Math.max(1, parseInt(formDayOfMonth) || 1));

                editRecurring(
                  sheet.data.id,
                  formName.trim(),
                  recVal,
                  formRecurringType,
                  formRecurringType === 'income' ? null : formSelectedId || null,
                  formSelectedId2 || null,
                  dayNum,
                  formDate,
                  null
                );
                closeSheet();
                showToast('Recurring schedule details updated', null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
            >
              Simpan
            </button>
          </div>
        )}

        {/* DETAILED TRANSACTION OUTFLOW REVIEWS */}
        {sheet.type === 'transaction_detail' && sheet.data && (
          (() => {
            const tx = sheet.data as Transaction;
            const cat = state.categories.find(c => c.id === tx.catId);
            const acc = state.accounts.find(a => a.id === tx.accountId);

            return (
              <div className="space-y-4 text-center select-none" id="tx-details-sheet-box">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto my-2 shadow-sm">
                  <ArrowDownCircle size={20} />
                </div>
                <div className="text-3xl font-extrabold font-mono text-red-650 shrink-0">−{fmtIDR(tx.amount)}</div>
                
                <div className="space-y-1 py-1 text-xs">
                  <div className="text-gray-450 font-bold uppercase tracking-wider text-[10px]">Budget Envelope</div>
                  <div className="font-bold text-gray-800 text-sm">{cat ? cat.name : 'Deleted Envelope'}</div>
                  {acc && (
                    <div className="text-[11px] text-gray-500 font-semibold" id="tx-details-account-display">
                      ({acc.name} holdings)
                    </div>
                  )}
                  {tx.note && <div className="text-xs text-gray-500 italic pt-2">"{tx.note}"</div>}
                  <div className="text-[10px] text-gray-400 font-bold font-mono tracking-wider pt-1">{fmtDate(tx.date)}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 select-none pt-4" id="tx-details-sheet-actions">
                  <button
                    onClick={() => openSheet('edit_expense', 'Edit Outflow Expense', tx)}
                    className="py-2 px-3 border border-slate-200 text-gray-700 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    Edit Detail
                  </button>
                  <button
                    onClick={() => {
                      showConfirm('Delete Transaction?', 'Permanently remove this charge from accounting totals?', () => {
                        deleteExpense(tx.id);
                        closeSheet();
                        showToast('Transaction deleted', null, undefined);
                      });
                    }}
                    className="py-2 px-3 border border-red-500/15 text-red-600 hover:bg-red-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    Delete Tx
                  </button>
                </div>
              </div>
            );
          })()
        )}

        {/* EDIT OUTFLOW EXPENSE DETAILS */}
        {sheet.type === 'edit_expense' && sheet.data && (
          <div className="space-y-4" id="form-edit-expense">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Amount (Rp)</label>
              <input 
                type="text"
                inputMode="decimal"
                value={formAmountStr}
                onChange={(e) => setFormAmountStr(e.target.value)}
                className="w-full text-center px-4 py-3 bg-slate-50 border border-gray-200 rounded font-mono text-xl font-bold select-all outline-none focus:bg-white focus:border-emerald-600 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Category</label>
                <select
                  value={formSelectedId}
                  onChange={(e) => setFormSelectedId(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
                >
                  <option value="">Select Category</option>
                  {state.groups.map(g => (
                    <optgroup key={g.id} label={g.name}>
                      {state.categories.filter(c => c.groupId === g.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Account</label>
                <select
                  value={formSelectedId2}
                  onChange={(e) => setFormSelectedId2(e.target.value)}
                  className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
                >
                  <option value="">Select Account</option>
                  {state.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3" id="edit-ex-note-date">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Note (optional)</label>
                <input 
                  type="text" 
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded text-xs outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Date</label>
                <input 
                  type="date" 
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 bg-white rounded text-xs outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!sheet.data) return;
                const spendVal = parseAmount(formAmountStr);
                if (!spendVal) return;

                editExpense(
                  sheet.data.id,
                  spendVal,
                  formDate,
                  formSelectedId || '',
                  formSelectedId2 || null,
                  formNote.trim()
                );
                closeSheet();
                showToast('Expense details updated', null, undefined);
              }}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition"
            >
              Simpan
            </button>
          </div>
        )}

        {/* DETAILED GENERAL INCOME INFLOW REVIEWS */}
        {sheet.type === 'income_detail' && sheet.data && (
          (() => {
            const inc = sheet.data as Income;
            const acc = state.accounts.find(a => a.id === inc.accountId);

            return (
              <div className="space-y-4 text-center select-none" id="inc-details-sheet-box">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto my-2 shadow-sm animate-bounce">
                  <ArrowUpCircle size={20} />
                </div>
                <div className="text-3xl font-extrabold font-mono text-emerald-700 shrink-0">+{fmtIDR(inc.amount)}</div>
                
                <div className="space-y-1 py-1 text-xs">
                  <div className="text-gray-450 font-bold uppercase tracking-wider text-[10px]">Income Source</div>
                  <div className="font-bold text-gray-800 text-sm">Ready to Assign Inflow</div>
                  {acc && (
                    <div className="text-[11px] text-gray-500 font-semibold">
                      (Credited to {acc.name})
                    </div>
                  )}
                  {inc.note && <div className="text-xs text-gray-500 italic pt-2">"{inc.note}"</div>}
                  <div className="text-[10px] text-gray-400 font-bold font-mono tracking-wider pt-1">{fmtDate(inc.date)}</div>
                </div>

                <div className="pt-4" id="inc-details-sheet-actions">
                  <button
                    onClick={() => {
                      showConfirm('Delete Income?', 'Are you sure you want to permanently erase this income inflow record? Budgets RTA balances will decrease.', () => {
                        deleteIncome(inc.id);
                        closeSheet();
                        showToast('Income transaction deleted', null, undefined);
                      });
                    }}
                    className="w-full py-2.5 px-3 border border-red-500/15 text-red-650 hover:bg-red-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    Delete Income Inflow
                  </button>
                </div>
              </div>
            );
          })()
        )}

        {/* DETAILED GENERAL TRANSFER REVIEWS */}
        {sheet.type === 'transfer_detail' && sheet.data && (
          (() => {
            const tf = sheet.data as Transfer;
            const fAcc = state.accounts.find(a => a.id === tf.fromAccountId);
            const tAcc = state.accounts.find(a => a.id === tf.toAccountId);

            return (
              <div className="space-y-4 text-center select-none" id="tf-details-sheet-box">
                <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mx-auto my-2 shadow-sm">
                  <ArrowRightLeft size={16} />
                </div>
                <div className="text-2xl font-extrabold font-mono text-violet-700 shrink-0">{fmtIDR(tf.amount)}</div>
                
                <div className="space-y-1 py-1 text-xs">
                  <div className="text-gray-450 font-bold uppercase tracking-wider text-[10px]">Inter-Account Transfer</div>
                  <div className="font-bold text-gray-800 text-xs flex items-center justify-center gap-1.5 pt-1">
                    <span>{fAcc ? fAcc.name : 'Unknown'}</span>
                    <span>→</span>
                    <span>{tAcc ? tAcc.name : 'Unknown'}</span>
                  </div>
                  {tf.note && <div className="text-xs text-gray-500 italic pt-2">"{tf.note}"</div>}
                  <div className="text-[10px] text-gray-400 font-bold font-mono tracking-wider pt-1">{fmtDate(tf.date)}</div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      showConfirm('Delete Transfer?', 'Erase this account transfer? Starting account balances will adjust back instantly.', () => {
                        deleteTransfer(tf.id);
                        closeSheet();
                        showToast('Account transfer deleted', null, undefined);
                      });
                    }}
                    className="w-full py-2.5 px-3 border border-red-550/20 text-red-650 hover:bg-red-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
                  >
                    Delete Transfer
                  </button>
                </div>
              </div>
            );
          })()
        )}

      </BottomSheet>

    </div>
  );
}

export default function App() {
  return (
    <BudgetProvider>
      <MainAppContent />
    </BudgetProvider>
  );
}
