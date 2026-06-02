/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowDownCircle, ArrowRightLeft, ArrowUpCircle } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { fmtDate, fmtIDR, parseAmount } from '../../utils/helpers';
import type { Income, Transaction, Transfer } from '../../types';
import type {
  AmountFormState,
  ConfirmCallback,
  DateFormState,
  NoteFormState,
  SecondSelectFormState,
  SelectFormState,
  SheetCallbacks
} from './SheetFormProps';

interface TransactionDetailSheetProps extends SheetCallbacks, ConfirmCallback {
  transaction: Transaction;
  onEditExpense: (transaction: Transaction) => void;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  transaction,
  closeSheet,
  showToast,
  showConfirm,
  onEditExpense
}) => {
  const { state, deleteExpense } = useBudget();
  const cat = state.categories.find(c => c.id === transaction.catId);
  const acc = state.accounts.find(a => a.id === transaction.accountId);

  return (
    <div className="space-y-4 text-center select-none" id="tx-details-sheet-box">
      <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto my-2 shadow-sm">
        <ArrowDownCircle size={20} />
      </div>
      <div className="text-3xl font-extrabold font-mono text-red-650 shrink-0">−{fmtIDR(transaction.amount)}</div>

      <div className="space-y-1 py-1 text-xs">
        <div className="text-gray-450 font-bold uppercase tracking-wider text-[10px]">Budget Envelope</div>
        <div className="font-bold text-gray-800 text-sm">{cat ? cat.name : 'Deleted Envelope'}</div>
        {acc && (
          <div className="text-[11px] text-gray-500 font-semibold" id="tx-details-account-display">
            ({acc.name} holdings)
          </div>
        )}
        {transaction.note && <div className="text-xs text-gray-500 italic pt-2">"{transaction.note}"</div>}
        <div className="text-[10px] text-gray-400 font-bold font-mono tracking-wider pt-1">{fmtDate(transaction.date)}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 select-none pt-4" id="tx-details-sheet-actions">
        <button
          onClick={() => onEditExpense(transaction)}
          className="py-2 px-3 border border-slate-200 text-gray-700 hover:bg-slate-100 rounded-md text-xs font-semibold flex items-center justify-center gap-1 transition"
        >
          Edit Detail
        </button>
        <button
          onClick={() => {
            showConfirm('Delete Transaction?', 'Permanently remove this charge from accounting totals?', () => {
              deleteExpense(transaction.id);
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
};

interface EditExpenseFormProps
  extends AmountFormState,
    SelectFormState,
    SecondSelectFormState,
    DateFormState,
    NoteFormState,
    SheetCallbacks {
  transaction: Transaction;
}

export const EditExpenseForm: React.FC<EditExpenseFormProps> = ({
  transaction,
  formAmountStr,
  setFormAmountStr,
  formSelectedId,
  setFormSelectedId,
  formSelectedId2,
  setFormSelectedId2,
  formDate,
  setFormDate,
  formNote,
  setFormNote,
  closeSheet,
  showToast
}) => {
  const { state, editExpense } = useBudget();

  return (
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
          const spendVal = parseAmount(formAmountStr);
          if (!spendVal) return;

          editExpense(
            transaction.id,
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
  );
};

interface IncomeDetailSheetProps extends SheetCallbacks, ConfirmCallback {
  income: Income;
}

export const IncomeDetailSheet: React.FC<IncomeDetailSheetProps> = ({
  income,
  closeSheet,
  showToast,
  showConfirm
}) => {
  const { state, deleteIncome } = useBudget();
  const acc = state.accounts.find(a => a.id === income.accountId);

  return (
    <div className="space-y-4 text-center select-none" id="inc-details-sheet-box">
      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto my-2 shadow-sm animate-bounce">
        <ArrowUpCircle size={20} />
      </div>
      <div className="text-3xl font-extrabold font-mono text-emerald-700 shrink-0">+{fmtIDR(income.amount)}</div>

      <div className="space-y-1 py-1 text-xs">
        <div className="text-gray-450 font-bold uppercase tracking-wider text-[10px]">Income Source</div>
        <div className="font-bold text-gray-800 text-sm">Ready to Assign Inflow</div>
        {acc && (
          <div className="text-[11px] text-gray-500 font-semibold">
            (Credited to {acc.name})
          </div>
        )}
        {income.note && <div className="text-xs text-gray-500 italic pt-2">"{income.note}"</div>}
        <div className="text-[10px] text-gray-400 font-bold font-mono tracking-wider pt-1">{fmtDate(income.date)}</div>
      </div>

      <div className="pt-4" id="inc-details-sheet-actions">
        <button
          onClick={() => {
            showConfirm('Delete Income?', 'Are you sure you want to permanently erase this income inflow record? Budgets RTA balances will decrease.', () => {
              deleteIncome(income.id);
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
};

interface TransferDetailSheetProps extends SheetCallbacks, ConfirmCallback {
  transfer: Transfer;
}

export const TransferDetailSheet: React.FC<TransferDetailSheetProps> = ({
  transfer,
  closeSheet,
  showToast,
  showConfirm
}) => {
  const { state, deleteTransfer } = useBudget();
  const fAcc = state.accounts.find(a => a.id === transfer.fromAccountId);
  const tAcc = state.accounts.find(a => a.id === transfer.toAccountId);

  return (
    <div className="space-y-4 text-center select-none" id="tf-details-sheet-box">
      <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mx-auto my-2 shadow-sm">
        <ArrowRightLeft size={16} />
      </div>
      <div className="text-2xl font-extrabold font-mono text-violet-700 shrink-0">{fmtIDR(transfer.amount)}</div>

      <div className="space-y-1 py-1 text-xs">
        <div className="text-gray-450 font-bold uppercase tracking-wider text-[10px]">Inter-Account Transfer</div>
        <div className="font-bold text-gray-800 text-xs flex items-center justify-center gap-1.5 pt-1">
          <span>{fAcc ? fAcc.name : 'Unknown'}</span>
          <span>→</span>
          <span>{tAcc ? tAcc.name : 'Unknown'}</span>
        </div>
        {transfer.note && <div className="text-xs text-gray-500 italic pt-2">"{transfer.note}"</div>}
        <div className="text-[10px] text-gray-400 font-bold font-mono tracking-wider pt-1">{fmtDate(transfer.date)}</div>
      </div>

      <div className="pt-4">
        <button
          onClick={() => {
            showConfirm('Delete Transfer?', 'Erase this account transfer? Starting account balances will adjust back instantly.', () => {
              deleteTransfer(transfer.id);
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
};
