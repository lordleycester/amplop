/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { todayMonth, monthLabelShort, fmtIDR, prevMonth as calcPrevMonth, nextMonth as calcNextMonth } from './utils/helpers';
import { useSheetController } from './hooks/useSheetController';
import { useSheetFormState } from './hooks/useSheetFormState';
import { 
  ReadyToAssign 
} from './components/ReadyToAssign';
import { 
  RecurringBanner 
} from './components/RecurringBanner';
import { 
  InstallmentsSection 
} from './components/InstallmentsSection';
import { MonthEndNudge } from './components/MonthEndNudge';
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
  ConfirmDialog 
} from './components/ConfirmDialog';
import { 
  Toast 
} from './components/Toast';
import { CategorySurvey, type StarterCategoryInput } from './components/CategorySurvey';
import { OnboardingGuide } from './components/OnboardingGuide';
import { SetupCoach, type SetupStep } from './components/SetupCoach';
import { AppBottomSheets } from './components/sheets/AppBottomSheets';
import { 
  Wallet, List, Landmark, Settings, ChevronLeft, ChevronRight, CreditCard, Plus, ArrowRightLeft, ReceiptText, BookOpen
} from 'lucide-react';
import type { Category } from './types';

const ONBOARDING_SEEN_KEY = 'amplop_onboarding_seen_v1';

type ActiveView = 'budget' | 'history' | 'accounts' | 'settings' | 'cicilan';

const navItems: { view: ActiveView; label: string; icon: React.ElementType }[] = [
  { view: 'budget', label: 'Budget', icon: Wallet },
  { view: 'history', label: 'History', icon: List },
  { view: 'accounts', label: 'Accounts', icon: Landmark },
  { view: 'cicilan', label: 'Installments', icon: CreditCard },
  { view: 'settings', label: 'Settings', icon: Settings }
];

const viewTitle = (view: ActiveView) => {
  if (view === 'history') return 'Transactions feed';
  if (view === 'cicilan') return 'Installments';
  return view.charAt(0).toUpperCase() + view.slice(1);
};

interface DesktopSidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  onHistoryClick: () => void;
  onQuickAdd: () => void;
  onAddIncome: () => void;
  onOpenGuide: () => void;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeView,
  setActiveView,
  onHistoryClick,
  onQuickAdd,
  onAddIncome,
  onOpenGuide
}) => (
  <aside className="hidden lg:flex w-[248px] shrink-0 flex-col bg-emerald-950 text-white border-r-[3px] border-gray-900" id="desktop-sidebar">
    <div className="px-5 py-5 border-b-[3px] border-gray-900" id="desktop-brand">
      <div className="text-base font-bold tracking-[0.26em] uppercase">Amplop</div>
      <div className="text-[10px] text-white/45 uppercase tracking-[0.18em] mt-1">Envelope budget</div>
    </div>

    <nav className="p-3 space-y-2 flex-1" id="desktop-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeView === item.view;
        const handleClick = () => {
          if (item.view === 'history') {
            onHistoryClick();
            return;
          }
          setActiveView(item.view);
        };

        return (
          <button
            key={item.view}
            onClick={handleClick}
            className={`w-full h-11 px-3 flex items-center gap-3 border-2 text-xs font-bold uppercase tracking-wide transition ${
              isActive
                ? 'bg-amber-500 text-white border-gray-900 shadow-[3px_3px_0_#000]'
                : 'bg-transparent text-white/55 border-transparent hover:bg-white/10 hover:text-white'
            }`}
            id={`desktop-nav-${item.view}`}
          >
            <Icon size={17} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>

    <div className="p-3 border-t-[3px] border-gray-900 space-y-2" id="desktop-quick-actions">
      <button
        onClick={onQuickAdd}
        className="w-full h-11 px-3 flex items-center justify-center gap-2 bg-amber-500 text-white border-2 border-gray-900 text-[10px] font-bold uppercase tracking-wide shadow-[3px_3px_0_#000]"
        id="desktop-add-expense"
      >
        <ReceiptText size={15} />
        Add Expense
      </button>
      <button
        onClick={onAddIncome}
        className="w-full h-10 px-3 flex items-center justify-center gap-2 bg-white text-gray-900 border-2 border-gray-900 text-[10px] font-bold uppercase tracking-wide"
        id="desktop-add-income"
      >
        <Plus size={14} />
        Add Income
      </button>
      <button
        onClick={onOpenGuide}
        className="w-full h-9 px-3 flex items-center justify-center gap-2 text-white/55 hover:text-white text-[10px] font-bold uppercase tracking-wide transition"
        id="desktop-open-guide"
      >
        <BookOpen size={13} />
        Guide
      </button>
    </div>
  </aside>
);

interface DesktopBudgetRailProps {
  onAddIncomeClick: () => void;
  onAssignReadyToAssignClick: () => void;
  onTransferClick: () => void;
  onPayCreditCardClick: () => void;
  onSetToast: (message: string, actionLabel?: string | null, onAction?: (() => void) | null) => void;
  onShowConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const DesktopBudgetRail: React.FC<DesktopBudgetRailProps> = ({
  onAddIncomeClick,
  onAssignReadyToAssignClick,
  onTransferClick,
  onPayCreditCardClick,
  onSetToast,
  onShowConfirm
}) => {
  const { state, viewMonth, getBudgetAccountsTotal, getNetWorth, getRTA, totalIncome, totalAssigned } = useBudget();
  const budgetAccounts = state.accounts.filter(account => account.onBudget);
  const hasCreditCard = budgetAccounts.some(account => account.type === 'credit_card');
  const hasPaymentSource = budgetAccounts.some(account => account.type !== 'credit_card');
  const categoriesWithTargets = state.categories.filter(category => category.target).length;
  const assigned = totalAssigned(viewMonth);
  const income = totalIncome(viewMonth);

  return (
    <aside className="hidden lg:flex flex-col gap-4 overflow-y-auto border-l-[3px] border-gray-900 bg-slate-100 p-4" id="desktop-budget-rail">
      <ReadyToAssign
        onAddIncomeClick={onAddIncomeClick}
        onAssignReadyToAssignClick={onAssignReadyToAssignClick}
        onSetToast={onSetToast}
        onShowConfirm={onShowConfirm}
      />

      <section className="bg-white border-2 border-gray-900 shadow-[4px_4px_0_#1E1E1E]" id="desktop-money-summary">
        <div className="px-4 py-3 border-b-2 border-gray-900">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">Money Summary</div>
          <div className="text-xs font-bold text-gray-900 mt-0.5">{monthLabelShort(viewMonth)}</div>
        </div>
        <div className="divide-y-2 divide-gray-900/10">
          <div className="p-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Ready</span>
            <span className={`text-sm font-mono font-bold ${getRTA(viewMonth) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{fmtIDR(getRTA(viewMonth))}</span>
          </div>
          <div className="p-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Income</span>
            <span className="text-sm font-mono font-bold text-gray-900">{fmtIDR(income)}</span>
          </div>
          <div className="p-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Assigned</span>
            <span className="text-sm font-mono font-bold text-gray-900">{fmtIDR(assigned)}</span>
          </div>
        </div>
      </section>

      <section className="bg-white border-2 border-gray-900 shadow-[4px_4px_0_#1E1E1E]" id="desktop-account-summary">
        <div className="px-4 py-3 border-b-2 border-gray-900">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">Accounts</div>
          <div className="text-xs font-bold text-gray-900 mt-0.5">{budgetAccounts.length} budget account{budgetAccounts.length === 1 ? '' : 's'}</div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Budget Total</span>
            <span className="text-sm font-mono font-bold text-gray-900">{fmtIDR(getBudgetAccountsTotal())}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Net Worth</span>
            <span className="text-sm font-mono font-bold text-gray-900">{fmtIDR(getNetWorth())}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="border-2 border-gray-900 bg-slate-50 p-2">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Categories</div>
              <div className="text-lg font-mono font-bold text-gray-900">{state.categories.length}</div>
            </div>
            <div className="border-2 border-gray-900 bg-slate-50 p-2">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Targets</div>
              <div className="text-lg font-mono font-bold text-gray-900">{categoriesWithTargets}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-2 border-gray-900 shadow-[4px_4px_0_#1E1E1E] p-4 space-y-2" id="desktop-rail-actions">
        <button
          onClick={onTransferClick}
          disabled={state.accounts.length < 2}
          className="w-full py-2.5 px-3 bg-white text-gray-900 border-2 border-gray-900 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-40"
          id="desktop-rail-transfer"
        >
          <ArrowRightLeft size={14} />
          Transfer
        </button>
        <button
          onClick={onPayCreditCardClick}
          disabled={!hasCreditCard || !hasPaymentSource}
          className="w-full py-2.5 px-3 bg-white text-gray-900 border-2 border-gray-900 text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-40"
          id="desktop-rail-card-payment"
        >
          <CreditCard size={14} />
          Pay Card
        </button>
      </section>
    </aside>
  );
};

function MainAppContent() {
  const {
    state,
    hasExistingData,
    viewMonth,
    setViewMonth,
    activeView,
    setActiveView,
    setFilterCatId,
    applyStarterCategories,
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

  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [guideOpenedManually, setGuideOpenedManually] = useState(false);
  const [categorySurveyOpen, setCategorySurveyOpen] = useState(false);
  const [setupCoachOpen, setSetupCoachOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<SetupStep>('targets');

  const closeOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    } catch {}
    setOnboardingDismissed(true);
    setGuideOpenedManually(false);
  };

  const openOnboarding = () => {
    setGuideOpenedManually(true);
  };

  const showOnboarding = guideOpenedManually || (!hasExistingData && !onboardingDismissed);

  const { sheet, openSheet, closeSheet } = useSheetController();
  const sheetForm = useSheetFormState(sheet, state.groups[0]?.id || '');

  const startBudgetingGuide = () => {
    closeOnboarding();
    setSetupCoachOpen(false);
    setCategorySurveyOpen(true);
  };

  const skipCategorySurvey = () => {
    closeOnboarding();
    setCategorySurveyOpen(false);
    setSetupCoachOpen(true);
    setSetupStep('targets');
    setActiveView('budget');
  };

  const applyCategorySurvey = (categories: StarterCategoryInput[]) => {
    applyStarterCategories(categories);
    setCategorySurveyOpen(false);
    setSetupCoachOpen(true);
    setSetupStep('targets');
    setActiveView('budget');
    showToast('Starter categories created. Next: set targets for the envelopes that matter most.', null, undefined);
  };

  const openSetupTarget = (category: Category) => {
    setActiveView('budget');
    openSheet('set_target', `Set Target for ${category.name}`, category);
  };

  const openSetupAccount = () => {
    setActiveView('accounts');
    openSheet('add_account', 'Add Account');
  };

  const openSetupAssignMoney = () => {
    setActiveView('budget');
    showToast('Use Auto-Assign or tap an Assigned amount to fund categories.', null, undefined);
  };

  const openSetupTransaction = () => {
    setActiveView('budget');
    openSheet('quick_add', 'Add Expense');
  };

  const promptAssignMoney = () => {
    setActiveView('budget');
    showToast('Tap an Assigned amount or use Auto-Assign to give the remaining money a job.', null, undefined);
  };

  const openHistory = () => {
    setActiveView('history');
    setFilterCatId(null);
  };

  const renderBudgetView = (isDesktop = false) => (
    <>
      {!isDesktop && (
        <ReadyToAssign 
          onAddIncomeClick={() => openSheet('add_income', 'Add Income')}
          onAssignReadyToAssignClick={() => openSheet('assign_rta', 'Assign Leftover')}
          onSetToast={showToast}
          onShowConfirm={showConfirm}
        />
      )}
      <MonthEndNudge onAssignNow={promptAssignMoney} />
      <RecurringBanner 
        onAddRecurringClick={() => openSheet('add_recurring', 'New Recurring Schedule')}
        onSetToast={showToast}
      />
      <BudgetTab 
        onAddCategoryClick={(groupId) => {
          openSheet('add_category', 'New Category', groupId);
        }}
        onCategoryClick={(cat) => openSheet('category_detail', cat.name, cat)}
        onMoveMoneyClick={(cat) => openSheet('move_money', `Move Money from ${cat.name}`, cat)}
        onSetTargetClick={(cat) => openSheet('set_target', `Set Target for ${cat.name}`, cat)}
        onActivityClick={(cat) => openSheet('category_activity', `Activity for ${cat.name}`, cat)}
        onSetToast={showToast}
      />
    </>
  );

  const renderActiveView = () => {
    if (activeView === 'budget') {
      return (
        <>
          <div className="flex-1 flex flex-col min-h-0 lg:hidden">
            {renderBudgetView(false)}
          </div>
          <div className="hidden lg:grid flex-1 min-h-0 grid-cols-[minmax(0,1fr)_328px]" id="desktop-budget-grid">
            <div className="flex flex-col min-h-0 overflow-hidden" id="desktop-budget-main">
              {renderBudgetView(true)}
            </div>
            <DesktopBudgetRail
              onAddIncomeClick={() => openSheet('add_income', 'Add Income')}
              onAssignReadyToAssignClick={() => openSheet('assign_rta', 'Assign Leftover')}
              onTransferClick={() => openSheet('add_transfer', 'Transfer Between Accounts')}
              onPayCreditCardClick={() => openSheet('pay_credit_card', 'Pay Credit Card Debt')}
              onSetToast={showToast}
              onShowConfirm={showConfirm}
            />
          </div>
        </>
      );
    }

    if (activeView === 'history') {
      return (
        <HistoryTab 
          onTransactionClick={(tx) => openSheet('transaction_detail', 'Transaction Details', tx)}
          onIncomeClick={(inc) => openSheet('income_detail', 'Income Details', inc)}
          onTransferClick={(tf) => openSheet('transfer_detail', 'Transfer Details', tf)}
        />
      );
    }

    if (activeView === 'cicilan') {
      return (
        <InstallmentsSection 
          onAddInstallmentClick={() => openSheet('add_installment', 'Add Installment')}
          onInstallmentClick={(inst) => openSheet('installment_detail', 'Installment Details', inst)}
        />
      );
    }

    if (activeView === 'accounts') {
      return (
        <AccountsTab 
          onAddAccountClick={() => openSheet('add_account', 'Add Account')}
          onAccountClick={(acc) => openSheet('account_detail', acc.name, acc)}
          onTransferClick={() => openSheet('add_transfer', 'Transfer Between Accounts')}
          onPayCreditCardClick={() => openSheet('pay_credit_card', 'Pay Credit Card Debt')}
        />
      );
    }

    return (
      <SettingsTab 
        onOpenGuide={openOnboarding}
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
    );
  };

  return (
    <div className="flex h-full max-w-[480px] lg:max-w-[1280px] lg:h-[calc(100vh-48px)] lg:my-6 mx-auto bg-slate-50 relative border-x border-gray-200 select-none shadow-xl overflow-hidden font-sans" id="app-viewport">
      <DesktopSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onHistoryClick={openHistory}
        onQuickAdd={() => openSheet('quick_add', 'Add Expense')}
        onAddIncome={() => openSheet('add_income', 'Add Income')}
        onOpenGuide={openOnboarding}
      />

      <div className="flex flex-col flex-1 min-w-0 min-h-0" id="app-main-shell">
      
      {/* 1. Header (Navbar topbar) */}
      <header className="px-4 py-3.5 bg-emerald-950 text-white shrink-0 z-10 shadow-sm font-sans" id="topbar">
        <div className="flex items-center justify-between" id="topbar-inner">
          <span className="text-sm font-light tracking-[0.2em] uppercase select-none cursor-pointer hover:opacity-90 transition lg:hidden">amplop</span>
          <span className="hidden lg:block text-sm font-bold tracking-[0.18em] uppercase select-none">{viewTitle(activeView)}</span>
          
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
            <span className="text-xs font-semibold tracking-wide font-sans text-gray-200 capitalize lg:hidden">
              {viewTitle(activeView)}
            </span>
          )}
        </div>
      </header>

      {/* 2. Scrollable Body Area */}
      <div className="flex-1 flex flex-col min-h-0 select-none" id="content-body">
        {setupCoachOpen && (
          <SetupCoach
            step={setupStep}
            onStepChange={setSetupStep}
            onSetTarget={openSetupTarget}
            onAddAccount={openSetupAccount}
            onAssignMoney={openSetupAssignMoney}
            onAddTransaction={openSetupTransaction}
            onDismiss={() => setSetupCoachOpen(false)}
          />
        )}
        {renderActiveView()}
      </div>

      {/* Floating global FAB quick adds expense (Except settings lists or accounts lists) */}
      {activeView !== 'settings' && activeView !== 'accounts' && (
        <button
          onClick={() => openSheet('quick_add', 'Add Expense')}
          className="fixed bottom-[68px] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-900 border border-emerald-400 select-none shadow-lg z-20 flex items-center justify-center font-bold text-2xl tracking-tight transition-transform duration-100 hover:scale-105 active:scale-95 lg:hidden"
          id="fab-button"
        >
          +
        </button>
      )}

      {/* 3. Bottom Navigation bar tabs menu spacer */}
      <footer className="bg-emerald-950 text-white shrink-0 z-10 border-t border-white/5 select-none lg:hidden" id="bottom-bar">
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
              openHistory();
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

      <AppBottomSheets
        sheet={sheet}
        form={sheetForm}
        openSheet={openSheet}
        closeSheet={closeSheet}
        showToast={showToast}
        showConfirm={showConfirm}
      />

      <OnboardingGuide
        isOpen={showOnboarding}
        onClose={closeOnboarding}
        onStartBudgeting={startBudgetingGuide}
        onSkipSurvey={skipCategorySurvey}
      />

      <CategorySurvey
        isOpen={categorySurveyOpen}
        onClose={() => setCategorySurveyOpen(false)}
        onApply={applyCategorySurvey}
      />

      </div>
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
