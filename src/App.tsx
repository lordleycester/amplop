/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { todayStr, todayMonth, monthLabelShort, genId, prevMonth as calcPrevMonth, nextMonth as calcNextMonth } from './utils/helpers';
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
import { AccountDetailSheet } from './components/sheets/AccountDetailSheet';
import { AddAccountForm, EditAccountForm } from './components/sheets/AccountForms';
import { AddIncomeForm } from './components/sheets/AddIncomeForm';
import { CategoryDetailSheet, MoveMoneyForm, SetTargetForm } from './components/sheets/CategoryDetailSheets';
import { AddCategoryForm, EditCategoryForm } from './components/sheets/CategoryForms';
import { AddGroupForm, EditGroupForm } from './components/sheets/GroupForms';
import { AddInstallmentForm, EditInstallmentForm, InstallmentDetailSheet } from './components/sheets/InstallmentForms';
import { PayCreditCardForm } from './components/sheets/PayCreditCardForm';
import { QuickAddExpenseForm } from './components/sheets/QuickAddExpenseForm';
import { AddRecurringForm, EditRecurringForm } from './components/sheets/RecurringForms';
import { EditExpenseForm, IncomeDetailSheet, TransactionDetailSheet, TransferDetailSheet } from './components/sheets/TransactionDetailSheets';
import { TransferForm } from './components/sheets/TransferForm';
import { 
  Wallet, List, Landmark, Settings, ChevronLeft, ChevronRight, HelpCircle, AlertCircle, CreditCard
} from 'lucide-react';
import { Category, Group, Account, Installment, Recurring, Transaction, Income, Transfer, SheetState, SheetType } from './types';

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
    deleteCategory,
    deleteGroup,
    deleteAccount,
    deleteInstallment,
    deleteRecurring
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

  const [sheet, setSheet] = useState<SheetState>({
    isOpen: false,
    title: '',
    type: 'quick_add'
  });

  type SheetPayloadMap = {
    add_category: string;
    edit_group: Group;
    edit_category: Category;
    category_detail: Category;
    set_target: Category;
    move_money: Category;
    edit_account: Account;
    account_detail: Account;
    edit_installment: Installment;
    installment_detail: Installment;
    edit_recurring: Recurring;
    transaction_detail: Transaction;
    edit_expense: Transaction;
    income_detail: Income;
    transfer_detail: Transfer;
  };
  type SheetWithPayload = keyof SheetPayloadMap;
  type SheetWithoutPayload = Exclude<SheetType, SheetWithPayload>;

  function openSheet<T extends SheetWithoutPayload>(type: T, title: string): void;
  function openSheet<T extends SheetWithPayload>(type: T, title: string, data: SheetPayloadMap[T]): void;
  function openSheet(type: SheetType, title: string, data?: SheetPayloadMap[SheetWithPayload]) {
    setSheet((data === undefined ? { isOpen: true, title, type } : { isOpen: true, title, type, data }) as SheetState);
  }

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
          <AddGroupForm
            formName={formName}
            setFormName={setFormName}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* RENAME GROUP FORM */}
        {sheet.type === 'edit_group' && (
          <EditGroupForm
            group={sheet.data}
            formName={formName}
            setFormName={setFormName}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* NEW CATEGORY FORM */}
        {sheet.type === 'add_category' && (
          <AddCategoryForm
            formName={formName}
            setFormName={setFormName}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* EDIT CATEGORY FORM */}
        {sheet.type === 'edit_category' && (
          <EditCategoryForm
            category={sheet.data}
            formName={formName}
            setFormName={setFormName}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* CATEGORY OUTFLOW DETAIL OVERVIEW SHEET */}
        {sheet.type === 'category_detail' && sheet.data && (
          <CategoryDetailSheet
            category={sheet.data}
            onSetTarget={(category) => openSheet('set_target', 'Set Target', category)}
            onMoveMoney={(category) => openSheet('move_money', 'Move Money', category)}
          />
        )}

        {/* SET TARGET FORM */}
        {sheet.type === 'set_target' && sheet.data && (
          <SetTargetForm
            category={sheet.data}
            formTargetType={formTargetType}
            setFormTargetType={setFormTargetType}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formTargetMonth={formTargetMonth}
            setFormTargetMonth={setFormTargetMonth}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* MOVE MONEY FORM */}
        {sheet.type === 'move_money' && sheet.data && (
          <MoveMoneyForm
            sourceCategory={sheet.data}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* QUICK ADD EXPENSE FORM */}
        {sheet.type === 'quick_add' && (
          <QuickAddExpenseForm
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formDate={formDate}
            setFormDate={setFormDate}
            formNote={formNote}
            setFormNote={setFormNote}
            qaSelectedGroupId={qaSelectedGroupId}
            setQaSelectedGroupId={setQaSelectedGroupId}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* ADD INCOME FORM */}
        {sheet.type === 'add_income' && (
          <AddIncomeForm
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formDate={formDate}
            setFormDate={setFormDate}
            formNote={formNote}
            setFormNote={setFormNote}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* ADD ACCOUNT FORM */}
        {sheet.type === 'add_account' && (
          <AddAccountForm
            formName={formName}
            setFormName={setFormName}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* EDIT ACCOUNT DETAILS */}
        {sheet.type === 'edit_account' && sheet.data && (
          <EditAccountForm
            account={sheet.data}
            formName={formName}
            setFormName={setFormName}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* ACCOUNT DETAILED SCREEN BRIEF OVERLAYS */}
        {sheet.type === 'account_detail' && sheet.data && (
          <AccountDetailSheet
            account={sheet.data}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            closeSheet={closeSheet}
            showToast={showToast}
            showConfirm={showConfirm}
            onEditAccount={(account) => openSheet('edit_account', 'Edit Account', account)}
          />
        )}

        {/* TRANSFER BETWEEN ACCOUNTS FORM */}
        {sheet.type === 'add_transfer' && (
          <TransferForm
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formDate={formDate}
            setFormDate={setFormDate}
            formNote={formNote}
            setFormNote={setFormNote}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* PAY CREDIT CARD DEBT FORM */}
        {sheet.type === 'pay_credit_card' && (
          <PayCreditCardForm
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formDate={formDate}
            setFormDate={setFormDate}
            formNote={formNote}
            setFormNote={setFormNote}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* ADD INSTALLMENT FORM */}
        {sheet.type === 'add_installment' && (
          <AddInstallmentForm
            formName={formName}
            setFormName={setFormName}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formCountMonths={formCountMonths}
            setFormCountMonths={setFormCountMonths}
            formMonthlyPaymentStr={formMonthlyPaymentStr}
            setFormMonthlyPaymentStr={setFormMonthlyPaymentStr}
            formTargetMonth={formTargetMonth}
            setFormTargetMonth={setFormTargetMonth}
            formNote={formNote}
            setFormNote={setFormNote}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* EDIT INSTALLMENT DETAILS */}
        {sheet.type === 'edit_installment' && sheet.data && (
          <EditInstallmentForm
            installment={sheet.data}
            formName={formName}
            setFormName={setFormName}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formCountMonths={formCountMonths}
            setFormCountMonths={setFormCountMonths}
            formMonthlyPaymentStr={formMonthlyPaymentStr}
            setFormMonthlyPaymentStr={setFormMonthlyPaymentStr}
            formTargetMonth={formTargetMonth}
            setFormTargetMonth={setFormTargetMonth}
            formNote={formNote}
            setFormNote={setFormNote}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* INSTALLMENT DETAILS MODAL PREVIEW */}
        {sheet.type === 'installment_detail' && sheet.data && (
          <InstallmentDetailSheet
            installment={sheet.data}
            closeSheet={closeSheet}
            showToast={showToast}
            showConfirm={showConfirm}
            onEditInstallment={(installment) => openSheet('edit_installment', 'Edit Installment', installment)}
          />
        )}

        {/* ADD RECURRING TRANSACTION FORM */}
        {sheet.type === 'add_recurring' && (
          <AddRecurringForm
            formName={formName}
            setFormName={setFormName}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formDate={formDate}
            setFormDate={setFormDate}
            formNote={formNote}
            setFormNote={setFormNote}
            formRecurringType={formRecurringType}
            setFormRecurringType={setFormRecurringType}
            formDayOfMonth={formDayOfMonth}
            setFormDayOfMonth={setFormDayOfMonth}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* EDIT RECURRING TEMPLATE */}
        {sheet.type === 'edit_recurring' && sheet.data && (
          <EditRecurringForm
            recurring={sheet.data}
            formName={formName}
            setFormName={setFormName}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formDate={formDate}
            setFormDate={setFormDate}
            formNote={formNote}
            setFormNote={setFormNote}
            formRecurringType={formRecurringType}
            setFormRecurringType={setFormRecurringType}
            formDayOfMonth={formDayOfMonth}
            setFormDayOfMonth={setFormDayOfMonth}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* DETAILED TRANSACTION OUTFLOW REVIEWS */}
        {sheet.type === 'transaction_detail' && sheet.data && (
          <TransactionDetailSheet
            transaction={sheet.data}
            closeSheet={closeSheet}
            showToast={showToast}
            showConfirm={showConfirm}
            onEditExpense={(transaction) => openSheet('edit_expense', 'Edit Outflow Expense', transaction)}
          />
        )}

        {/* EDIT OUTFLOW EXPENSE DETAILS */}
        {sheet.type === 'edit_expense' && sheet.data && (
          <EditExpenseForm
            transaction={sheet.data}
            formAmountStr={formAmountStr}
            setFormAmountStr={setFormAmountStr}
            formSelectedId={formSelectedId}
            setFormSelectedId={setFormSelectedId}
            formSelectedId2={formSelectedId2}
            setFormSelectedId2={setFormSelectedId2}
            formDate={formDate}
            setFormDate={setFormDate}
            formNote={formNote}
            setFormNote={setFormNote}
            closeSheet={closeSheet}
            showToast={showToast}
          />
        )}

        {/* DETAILED GENERAL INCOME INFLOW REVIEWS */}
        {sheet.type === 'income_detail' && sheet.data && (
          <IncomeDetailSheet
            income={sheet.data}
            closeSheet={closeSheet}
            showToast={showToast}
            showConfirm={showConfirm}
          />
        )}

        {/* DETAILED GENERAL TRANSFER REVIEWS */}
        {sheet.type === 'transfer_detail' && sheet.data && (
          <TransferDetailSheet
            transfer={sheet.data}
            closeSheet={closeSheet}
            showToast={showToast}
            showConfirm={showConfirm}
          />
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
