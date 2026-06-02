/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { todayMonth, monthLabelShort, genId, prevMonth as calcPrevMonth, nextMonth as calcNextMonth } from './utils/helpers';
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
import { AppBottomSheets } from './components/sheets/AppBottomSheets';
import { 
  Wallet, List, Landmark, Settings, ChevronLeft, ChevronRight, HelpCircle, AlertCircle, CreditCard
} from 'lucide-react';

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

  const { sheet, openSheet, closeSheet } = useSheetController();
  const sheetForm = useSheetFormState(sheet, state.groups[0]?.id || '');

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

      <AppBottomSheets
        sheet={sheet}
        form={sheetForm}
        openSheet={openSheet}
        closeSheet={closeSheet}
        showToast={showToast}
        showConfirm={showConfirm}
      />

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
