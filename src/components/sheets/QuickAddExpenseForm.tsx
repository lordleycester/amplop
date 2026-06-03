/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { fmtIDR, parseAmount } from '../../utils/helpers';
import { getGroupColor } from '../../utils/sharedUtils';
import type {
  AmountFormState,
  DateFormState,
  NoteFormState,
  QuickAddFilterState,
  RepeatMonthlyState,
  SecondSelectFormState,
  SelectFormState,
  SheetCallbacks
} from './SheetFormProps';

interface QuickAddExpenseFormProps
  extends AmountFormState,
    SelectFormState,
    SecondSelectFormState,
    DateFormState,
    NoteFormState,
    QuickAddFilterState,
    RepeatMonthlyState,
    SheetCallbacks {}

export const QuickAddExpenseForm: React.FC<QuickAddExpenseFormProps> = ({
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
  formRepeatMonthly,
  setFormRepeatMonthly,
  qaSelectedGroupId,
  setQaSelectedGroupId,
  closeSheet,
  showToast
}) => {
  const { state, addExpense, addRecurring } = useBudget();
  const budgetAccounts = state.accounts.filter(a => a.onBudget);
  const recurringDay = Math.min(28, Math.max(1, Number(formDate.split('-')[2]) || 1));

  return (
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

      <div className="space-y-2 select-none" id="qa-category-select">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">Category</label>

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
                className="px-3 py-1 rounded text-[9px] font-mono font-extrabold uppercase transition whitespace-nowrap border"
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

      {budgetAccounts.length > 1 && (
        <div className="space-y-2 select-none" id="qa-account-select">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">From Account</label>
          <div className="flex gap-2 overflow-x-auto pb-1.5" id="qa-accounts-pillslist">
            {budgetAccounts.map(a => {
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

      <label
        className="flex items-center justify-between gap-3 border border-gray-150 bg-white rounded p-3 cursor-pointer select-none"
        id="qa-repeat-monthly"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold text-gray-800">Repeat monthly</div>
          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
            Uses day {recurringDay} each month, starting from this transaction date.
          </div>
        </div>
        <input
          type="checkbox"
          checked={formRepeatMonthly}
          onChange={(e) => setFormRepeatMonthly(e.target.checked)}
          className="w-4 h-4 shrink-0 accent-emerald-800"
          id="qa-repeat-checkbox"
        />
      </label>

      <button
        onClick={() => {
          const spendingValue = parseAmount(formAmountStr);
          if (!spendingValue || !formSelectedId) return;

          const resolvedAccId = formSelectedId2 || budgetAccounts[0]?.id || null;
          const note = formNote.trim();
          const recurringId = formRepeatMonthly
            ? addRecurring(
                note || state.categories.find(c => c.id === formSelectedId)?.name || 'Monthly expense',
                spendingValue,
                'expense',
                formSelectedId,
                resolvedAccId,
                recurringDay,
                formDate,
                null
              )
            : undefined;

          addExpense(spendingValue, formDate, formSelectedId, resolvedAccId, note, recurringId);
          closeSheet();
          showToast(
            formRepeatMonthly
              ? `Expense added. It will repeat monthly.`
              : `Added ${fmtIDR(spendingValue)} to expense feed`,
            null,
            undefined
          );
        }}
        disabled={!parseAmount(formAmountStr) || !formSelectedId}
        className="w-full py-2.5 bg-emerald-800 disabled:opacity-30 hover:bg-emerald-900 text-white font-semibold text-xs rounded shadow transition"
        id="qa-submit-btn"
      >
        Tambah Expense {formAmountStr ? fmtIDR(parseAmount(formAmountStr)) : ''}
      </button>
    </div>
  );
};
