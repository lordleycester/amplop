/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR, parseAmount } from '../../utils/helpers';
import type { AmountFormState, DateFormState, NoteFormState, RepeatMonthlyState, SelectFormState, SheetCallbacks } from './SheetFormProps';

interface AddIncomeFormProps extends AmountFormState, SelectFormState, DateFormState, NoteFormState, RepeatMonthlyState, SheetCallbacks {}

export const AddIncomeForm: React.FC<AddIncomeFormProps> = ({
  formAmountStr,
  setFormAmountStr,
  formSelectedId,
  setFormSelectedId,
  formDate,
  setFormDate,
  formNote,
  setFormNote,
  formRepeatMonthly,
  setFormRepeatMonthly,
  closeSheet,
  showToast
}) => {
  const { state, addIncome, addRecurring } = useBudget();
  const budgetAccounts = state.accounts.filter(a => a.onBudget);
  const recurringDay = Math.min(28, Math.max(1, Number(formDate.split('-')[2]) || 1));

  return (
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

      {budgetAccounts.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">To Account</label>
          <select
            value={formSelectedId}
            onChange={(e) => setFormSelectedId(e.target.value)}
            className="w-full px-2.5 py-2 border border-gray-200 bg-white rounded text-xs select-none"
            id="inc-acc"
          >
            {budgetAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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

      <label
        className="flex items-center justify-between gap-3 border border-gray-150 bg-white rounded p-3 cursor-pointer select-none"
        id="inc-repeat-monthly"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-800">Repeat monthly</div>
          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
            Uses day {recurringDay} each month, starting from this income date.
          </div>
        </div>
        <input
          type="checkbox"
          checked={formRepeatMonthly}
          onChange={(e) => setFormRepeatMonthly(e.target.checked)}
          className="w-4 h-4 shrink-0 accent-emerald-800"
          id="inc-repeat-checkbox"
        />
      </label>

      <button
        onClick={() => {
          const incomeValue = parseAmount(formAmountStr);
          if (!incomeValue) return;

          const resolvedAccId = formSelectedId || budgetAccounts[0]?.id || null;
          const note = formNote.trim() || 'Salary Inflow';
          const recurringId = formRepeatMonthly
            ? addRecurring(
                note,
                incomeValue,
                'income',
                null,
                resolvedAccId,
                recurringDay,
                formDate,
                null
              )
            : undefined;

          addIncome(incomeValue, formDate, resolvedAccId, note, recurringId);
          closeSheet();
          showToast(
            formRepeatMonthly
              ? `Income added. It will repeat monthly.`
              : `Added inflow +${fmtIDR(incomeValue)} explicitly to RTA!`,
            null,
            undefined
          );
        }}
        disabled={!parseAmount(formAmountStr)}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded transition uppercase tracking-wide"
        id="inc-submit-btn"
      >
        Add Income
      </button>
    </div>
  );
};
