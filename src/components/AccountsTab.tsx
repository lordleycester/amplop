/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../context/BudgetContext';
import { fmtIDR } from '../utils/helpers';
import { 
  Building2, PiggyBank, CreditCard, Banknote, Landmark, GraduationCap, Percent, Home, Key, Plus, ArrowRightLeft, CreditCard as CardIcon
} from 'lucide-react';
import { Account } from '../types';

interface AccountsTabProps {
  onAddAccountClick: () => void;
  onAccountClick: (acc: Account) => void;
  onTransferClick: () => void;
  onPayCreditCardClick: () => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  onAddAccountClick,
  onAccountClick,
  onTransferClick,
  onPayCreditCardClick
}) => {
  const { state, viewMonth, getAccountBalance, getBudgetAccountsTotal, getNetWorth } = useBudget();

  const accounts = state.accounts.slice().sort((a, b) => a.sort - b.sort);
  const budgetAccounts = accounts.filter(a => a.onBudget);
  const trackingAccounts = accounts.filter(a => !a.onBudget);

  const budgetTotal = budgetAccounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const trackingTotal = trackingAccounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const netWorth = getNetWorth();

  // Helper inside component to get account icons
  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'checking': return <Building2 size={16} />;
      case 'savings': return <PiggyBank size={16} />;
      case 'credit_card': return <CreditCard size={15} />;
      case 'cash': return <Banknote size={16} />;
      case 'investment': return <Landmark size={15} />;
      case 'retirement': return <GraduationCap size={16} />;
      case 'mortgage': return <Home size={15} />;
      case 'other_asset': return <Key size={15} />;
      default: return <Building2 size={16} />;
    }
  };

  const getAccountLabel = (type: Account['type']): string => {
    switch (type) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'credit_card': return 'Credit Card';
      case 'cash': return 'Cash';
      case 'investment': return 'Investment';
      case 'retirement': return 'Retirement';
      case 'mortgage': return 'Mortgage/Loan';
      case 'other_asset': return 'Other Asset';
      default: return 'Account';
    }
  };

  const activeInstallments = (accId: string) => {
    return state.installments.filter(i => {
      if (i.accountId !== accId) return false;
      // Is active in current viewMonth
      let [y, mo] = i.startDate.split('-').map(Number);
      mo += i.totalMonths - 1;
      while (mo > 12) {
        mo -= 12;
        y++;
      }
      const end = y + '-' + String(mo).padStart(2, '0');
      return viewMonth >= i.startDate && viewMonth <= end;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-8" id="accounts-tab-view">
      {/* Dynamic Big Net Worth Card Banner */}
      <div className="p-5 bg-white border-b border-gray-150 shadow-sm shrink-0 text-center select-none" id="net-worth-banner">
        <div className="text-[10px] font-bold tracking-widest text-[#8a8680] uppercase mb-1" id="net-worth-lbl">
          Net Worth holdings
        </div>
        <div className="text-3xl font-bold tracking-tight text-emerald-800 font-mono" id="net-worth-val">
          {fmtIDR(netWorth)}
        </div>
        <div className="text-[11px] text-[#8a8680] mt-1 flex justify-center gap-4 font-semibold" id="net-worth-subheading">
          <span>Budget: <span className="font-mono text-gray-800">{fmtIDR(budgetTotal)}</span></span>
          {trackingAccounts.length > 0 && (
            <span>Tracking: <span className="font-mono text-gray-800">{fmtIDR(trackingTotal)}</span></span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5" id="accounts-matrix">
        {/* On-Budget Accounts Section */}
        <div className="space-y-2" id="acc-budget-sec">
          <h4 className="text-[10px] font-bold text-[#8a8680] uppercase tracking-wider pl-1">
            Budget Accounts
          </h4>

          <div className="bg-white rounded-lg border border-gray-150 divide-y divide-gray-100 overflow-hidden shadow-sm" id="acc-budget-list">
            {budgetAccounts.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 italic">No budget accounts added yet.</div>
            ) : (
              budgetAccounts.map(a => {
                const balance = getAccountBalance(a.id);
                const balColor = balance > 0 ? 'text-emerald-700 font-bold' : balance < 0 ? 'text-red-700 font-semibold' : 'text-gray-400';
                
                // Active installments summary (Only for credit cards)
                const activeInst = activeInstallments(a.id);
                const installmentsObligation = activeInst.reduce((s, i) => s + i.monthlyPayment, 0);

                return (
                  <div
                    key={a.id}
                    onClick={() => onAccountClick(a)}
                    className="flex items-center justify-between gap-4 p-3 hover:bg-gray-50/70 cursor-pointer transition select-none"
                    id={`account-row-${a.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0" id={`account-info-${a.id}`}>
                      <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0" id={`account-icon-wrap-${a.id}`}>
                        {getAccountIcon(a.type)}
                      </div>
                      <div className="min-w-0" id={`account-texts-${a.id}`}>
                        <div className="text-xs font-semibold text-gray-800 truncate">{a.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{getAccountLabel(a.type)}</div>
                        
                        {a.type === 'credit_card' && activeInst.length > 0 && (
                          <div className="text-[9px] font-bold text-amber-600 mt-1" id={`account-cc-tag-${a.id}`}>
                            Installments: {activeInst.length} active · {fmtIDR(installmentsObligation)}/mo
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`text-sm font-semibold font-mono ${balColor}`} id={`account-price-${a.id}`}>
                      {fmtIDR(balance)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tracking Accounts Section */}
        {trackingAccounts.length > 0 && (
          <div className="space-y-2" id="acc-tracking-sec">
            <h4 className="text-[10px] font-bold text-[#8a8680] uppercase tracking-wider pl-1 font-sans">
              Tracking Accounts
            </h4>

            <div className="bg-white rounded-lg border border-gray-150 divide-y divide-gray-100 overflow-hidden shadow-sm" id="acc-tracking-list">
              {trackingAccounts.map(a => {
                const balance = getAccountBalance(a.id);
                const balColor = balance > 0 ? 'text-emerald-700 font-bold' : balance < 0 ? 'text-red-700 font-semibold' : 'text-gray-400';

                return (
                  <div
                    key={a.id}
                    onClick={() => onAccountClick(a)}
                    className="flex items-center justify-between gap-4 p-3 hover:bg-gray-50/70 cursor-pointer transition select-none"
                    id={`account-row-${a.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
                        {getAccountIcon(a.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-800 truncate">{a.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{getAccountLabel(a.type)}</div>
                      </div>
                    </div>

                    <div className={`text-sm font-semibold font-mono ${balColor}`}>
                      {fmtIDR(balance)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick action Transfer handles */}
        <div className="space-y-2 pt-2" id="acc-quick-actions">
          {accounts.length >= 2 && (
            <button
              onClick={onTransferClick}
              className="w-full py-3 px-4 border border-emerald-800/20 text-emerald-800 hover:bg-emerald-50 bg-emerald-50/30 text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
              id="acc-transfer-btn"
            >
              <ArrowRightLeft size={14} />
              ↔ Transfer Between Accounts
            </button>
          )}

          {budgetAccounts.some(a => a.type === 'credit_card') && budgetAccounts.some(a => a.type !== 'credit_card') && (
            <button
              onClick={onPayCreditCardClick}
              className="w-full py-3 px-4 border border-emerald-800/20 text-emerald-800 hover:bg-emerald-50 bg-emerald-50/30 text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
              id="acc-ccpay-btn"
            >
              <CardIcon size={14} />
              Pay Credit Card Debt
            </button>
          )}

          {/* Core Master Add Button */}
          <button
            onClick={onAddAccountClick}
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 border border-gray-250 text-gray-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition mt-3"
            id="acc-add-btn"
          >
            <Plus size={15} />
            + Add Account
          </button>
        </div>
      </div>
    </div>
  );
};
