/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR, parseAmount } from '../../utils/helpers';
import type { Account } from '../../types';
import type { AmountFormState, ConfirmCallback, SheetCallbacks } from './SheetFormProps';

interface AccountDetailSheetProps extends AmountFormState, SheetCallbacks, ConfirmCallback {
  account: Account;
  onEditAccount: (account: Account) => void;
}

export const AccountDetailSheet: React.FC<AccountDetailSheetProps> = ({
  account,
  formAmountStr,
  setFormAmountStr,
  closeSheet,
  showToast,
  showConfirm,
  onEditAccount
}) => {
  const {
    state,
    getAccountBalance,
    updateTrackingBalance,
    deleteAccount
  } = useBudget();
  const balance = getAccountBalance(account.id);

  const accountHistory = [
    ...state.transactions.filter(t => t.accountId === account.id).map(t => ({
      id: t.id,
      date: t.date,
      type: 'expense' as const,
      amount: t.amount,
      note: t.note || 'Expense',
      categoryName: state.categories.find(c => c.id === t.catId)?.name || 'Deleted Envelope'
    })),
    ...state.income.filter(i => i.accountId === account.id).map(i => ({
      id: i.id,
      date: i.date,
      type: 'income' as const,
      amount: i.amount,
      note: i.note || 'Income',
      categoryName: 'Inflow'
    })),
    ...state.transfers.filter(tf => tf.fromAccountId === account.id).map(tf => ({
      id: tf.id,
      date: tf.date,
      type: 'transfer_out' as const,
      amount: tf.amount,
      note: tf.note || 'Transfer Out',
      categoryName: `To: ${state.accounts.find(a => a.id === tf.toAccountId)?.name || 'Deleted Account'}`
    })),
    ...state.transfers.filter(tf => tf.toAccountId === account.id).map(tf => ({
      id: tf.id,
      date: tf.date,
      type: 'transfer_in' as const,
      amount: tf.amount,
      note: tf.note || 'Transfer In',
      categoryName: `From: ${state.accounts.find(a => a.id === tf.fromAccountId)?.name || 'Deleted Account'}`
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4" id="account-sheets-details">
      <div className="text-center py-4 select-none" id="acc-details-panel">
        <div className="text-[10px] font-bold text-[#8a8680] uppercase tracking-wider mb-0.5">Account Balance</div>
        <div className={`text-3xl font-bold font-mono ${balance > 0 ? 'text-emerald-700' : balance < 0 ? 'text-red-700' : 'text-gray-400'}`}>{fmtIDR(balance)}</div>
        <div className="text-[10px] text-gray-450 mt-1 font-semibold">{account.onBudget ? 'On Budget Category assets' : 'Tracking Off-Budget Asset'}</div>
      </div>

      {!account.onBudget && (
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
                updateTrackingBalance(account.id, goalBal);
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

      <div className="border-t border-gray-150 pt-4" id="acc-details-history-section">
        <div className="text-[10px] font-bold text-[#8a8680] uppercase tracking-wider pl-0.5 mb-2">
          Transaction History ({accountHistory.length})
        </div>
        {accountHistory.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400 italic bg-gray-50/50 rounded-lg border border-dashed border-gray-250">
            No history records for this account.
          </div>
        ) : (
          <div className="max-h-[180px] overflow-y-auto divide-y divide-gray-150 border border-gray-200 rounded bg-white shadow-inner scrollbar-thin" id="acc-details-tx-scroll">
            {accountHistory.map(t => {
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
                    {isInflow ? '+' : '-'}{fmtIDR(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3" id="acc-details-actions">
        <button
          onClick={() => onEditAccount(account)}
          className="py-2 px-3 border border-emerald-800/10 text-emerald-850 hover:bg-emerald-50 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
        >
          Edit Account
        </button>
        <button
          onClick={() => {
            showConfirm(
              `Delete Account "${account.name}"?`,
              `This unlinks transactions and deletes transfer history. Budget categories remain unchanged.`,
              () => {
                deleteAccount(account.id);
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
};
